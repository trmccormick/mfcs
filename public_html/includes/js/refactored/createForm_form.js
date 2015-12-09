// Global Variable
// ===================================================================
var globalFieldID;
var choicesFields = {};

// Document Ready
// ===================================================================
$(function(){
	// Grab commonly used IDs
	var formPreview  = $('#formPreview');
	var fieldAdd     = $('#fieldAdd');
	var formSettings = $('#formSettings');
	var fieldTab     = $('#fieldTab');
	var leftPanel    = $('#leftPanel');
	var testStart = performance.now();

	// helper functions
    sortableForm();
    fieldSettingsBindings();
	formSettingsBindings();
	modalBindings();
	applyFormPreview();

	// Blank all panes when changing tabs
	fieldTab.on("click", "a", function() {
		$('li', formPreview).removeClass("well");
		showFieldSettings(); // blank the Field Settings pane
	});

	// Click and Draggable form fields.
	$(".draggable li", fieldAdd)
		.draggable({
			connectToSortable: "#formCreator ul.sortable",
			helper: "clone",
			revert: "invalid"})
		.click(function() {
			event.preventDefault();
			$(this).clone().appendTo(formPreview);
			addNewField($("li:last",formPreview));
			sortableForm();
	});

	// Deleted The field
	formPreview.on("click", ".fieldPreview i.icon-remove", function() {
		if (confirm("Are you sure you want to remove this field?")) {
			var thisLI = $(this).parent().parent();

			if ($(this).parent().next().children(":input[name^=type_]").val() == 'fieldset') {
				thisLI.after($(this).next().find("li"));
			}

			thisLI.remove();

			if ($("#formSettings_formMetadata").not(":checked")) {
				if ($(":input[name^=type_][value=idno]",formPreview).length == 0) {
					$("#formSettings_formProduction").prop({
						checked:  false,
						disabled: true,
						title:    "This form needs an ID Number field.",
					});
				}
				else {
					$("#formSettings_formProduction").removeAttr("disabled").removeAttr("title");
				}
			}
		}
	});


	// Re-order nesting on load
	// This loops through <li> and finds all the fieldsets, then loops through matching all <li> that have
	// the same fieldset name and moves them inside it
	$(".fieldValues :input[name^='type_'][value='fieldset']").each(function() {
		var fieldset = $(this).closest("li").prop("id");
		$(".fieldValues :input[name^='fieldset_'][value='"+$(this).siblings(":input[name^='fieldset_']").val()+"']").each(function() {
			if (fieldset != $(this).closest("li").prop("id")) {
				$(this).closest("li").detach().appendTo($("#"+fieldset+" ul"));
			}
		});
	});

	// Form submit handler
	$("form[name=submitForm]").submit(function(e) {
		// Undo Bindings
		$("#formPreview").find('[data-bind]').unbind('change', setOriginalValues);
		$('#fieldSettings_form').find("[data-bindmodel]").unbind('change keyup', bindToHiddenForm);

		// Create a multidimentional object to store field info
		var obj = {};
		$(":input",formSettings).each(function() {
			var form = $(this).prop("name").split("_");

			if ($(this).prop("type") == "checkbox") {
				obj[ form[1] ] = $(this).prop("checked");
			}
			else {
				obj[ form[1] ] = $(this).val();
			}
		});
		// Convert object to JSON and add it to a hidden form field
		$(":input[name=form]", this).val(JSON.stringify(obj));

		// Create a multidimentional object to store field info
		var obj = {};
		$(".fieldValues :input").each(function() {
			var field = $(this).prop("name").split("_");

			if (!obj[ field[1] ]) {
				obj[ field[1] ] = {};
			}

			if ($(this).is('[id^="choicesOptions_"]') || $(this).is('[id^="allowedExtensions_"]')) {
				obj[ field[1] ][ field[0] ] = {};
				obj[ field[1] ][ field[0] ] = $(this).val().split("%,%");
			}
			else {
				obj[ field[1] ][ field[0] ] = $(this).val();
			}
		});

		// Remove fieldsets from submission
		for (var i in obj) {
			if (obj[i]['type'] == 'fieldset' || obj[i]['type'] == 'Field Set') {
				delete obj[i];
			}
		};

		// Convert object to JSON and add it to a hidden form field
		$(":input[name=fields]", this).val(JSON.stringify(obj));
	});

	// Enable the submit button and hide thenoJavaScriptWarning
	$(':submit').removeAttr('disabled');
});


// Helper Functions
// ===================================================================
function applyFormPreview(){
	var formPreview;

	if(typeof globalFieldID === 'undefined'){
		formPreview = $('#formPreview').children().find('.fieldPreview');
	}
	else {
		formPreview = $('#formPreview_'+globalFieldID).find('.fieldPreview');
	}

	formPreview.each(function(){
		var label          = $(this).find('.fieldLabels');
		var controls       = $(this).find('.controls').children().first();
		var settings       = $(this).next();

		var placeholder    = settings.find($('input[name^="placeholder"]')).val();
		var name           = settings.find($('input[name^="name"]')).val();
		var style          = settings.find($('input[name^="style"]')).val();
		var labelValue     = settings.find($('input[name^="label"]')).val();
		var id             = settings.find($('input[name^="id"]')).val();
		var someClass      = settings.find($('input[name^="class"]')).val();
		var value          = settings.find($('input[name^="value"]')).val();

		var disabled       = settings.find($('input[name^="disabled"')).val();
		var readonly       = settings.find($('input[name^="readonly"')).val();
		var hidden         = settings.find($('input[name^="hidden"]')).val();

		controls.attr({
			'placeholder' : placeholder,
			'name'        : name,
			'style'       : style,
			'id'		  : id,
			'class'		  : someClass
		});

		if(disabled === "true" || readonly === "true"){
			controls.prop('readonly', true);
		} else {
			controls.prop('readonly', false);
		}

		if(value.length){
			controls.val(value);
		}

		label.html(labelValue)
	});
}

function sortableForm() {
	$("#formCreator ul.sortable").sortable({
		connectWith: "#formCreator ul.sortable",
		revert: true,
		placeholder: "highlight",
		update: function(event, ui) {
			// Only perform this if it's a brand new field
			if ($(ui.item).hasClass("ui-draggable")) {
				// Block fieldsets within fieldsets
				if ($(ui.item).text() == 'Field Set' && $(ui.item).parent().attr("id") != "formPreview") {
					$(ui.item).remove();
				}
				// Convert text to preview
				addNewField(ui.item);
			}
			$(ui.item).parents("li").click();
			$(ui.item).click();
			sortableForm();
		}
	});
	calculatePosition();
}

function calculatePosition(){
	$('#formCreator ul.sortable').children('li').each(function(index){
		$(this).attr('data-position', index);
		$(this).find("[data-bind='position']").val(index);
	});
}

// This function creates the form view
// It allows you to see the fields, drag and drop
// It also selects what field options show when a field is clicked
// This form is the main caller of bindings and form previews

function showFieldSettings(fullID) {
	// Create jQuery shortcuts (code optimization)
	var fieldSettings_form          = $("#fieldSettings_form");
	var fieldSettings_fieldset_form = $("#fieldSettings_fieldset_form");

	if (fullID === undefined) {
		$("#noFieldSelected").show();
		fieldSettings_fieldset_form.hide();
		fieldSettings_form.hide();
	}
	else {
		var id       = fullID;
		var type     = $("#type_"+id).val();
		var fieldset = $("#fieldset_"+id);
		var opts;
		var tmp;
		var i;

		// Hide the nothing selected error and show the form
		$("#noFieldSelected").hide();
		if (type == "fieldset") {
			fieldSettings_fieldset_form.show();
			fieldSettings_form.hide();
		}
		else {
			fieldSettings_fieldset_form.hide();
			fieldSettings_form.show();
			fieldSettings_form.find('.dataSettings').children().hide();
			fieldSettings_form.find('.default').show();

			// Create jQuery shortcuts (code optimization)
			var fieldSettings_name                 = $("#fieldSettings_name");
			var fieldSettings_options_required     = $("#fieldSettings_options_required");
			var fieldSettings_options_duplicates   = $("#fieldSettings_options_duplicates");
			var fieldSettings_options_displayTable = $("#fieldSettings_options_displayTable");
			var fieldSettings_options_readonly     = $("#fieldSettings_options_readonly");
			var fieldSettings_options_disabled     = $("#fieldSettings_options_disabled");

			if (type == 'idno') {
				fieldSettings_name.prop("readonly", true).val("idno").keyup();
				fieldSettings_options_required.prop({
					checked:  true,
					disabled: true,
				}).change();
				fieldSettings_options_duplicates.prop({
					checked:  true,
					disabled: true,
				}).change();
				fieldSettings_options_displayTable.prop({
					checked:  true,
					disabled: true,
				}).change();
				fieldSettings_options_readonly.prop({
					checked:  true,
					disabled: true,
				}).change();
				fieldSettings_options_disabled.prop({
					checked:  false,
					disabled: true,
				}).change();
			}
			else if (type == 'file') {
				fieldSettings_options_displayTable.removeAttr("checked").change().prop("disabled", true);
			}
			else {
				fieldSettings_name.removeAttr("readonly");
				fieldSettings_options_required.removeAttr("disabled");
				fieldSettings_options_duplicates.removeAttr("disabled");
				fieldSettings_options_readonly.removeAttr("disabled");
				fieldSettings_options_disabled.removeAttr("disabled");
				fieldSettings_options_displayTable.removeAttr("disabled");
			}

			// Show optional fields
			switch(type) {
				case 'idno':
					$("#fieldSettings_container_idno").parent().show();
					break;

				case 'text':
					$("#fieldSettings_container_value").show();
					$("#fieldSettings_container_placeholder").show();
					$("#fieldSettings_container_externalUpdate").parent().hide();
					$("#fieldSettings_container_range").parent().show();
					$("#fieldSettings_range_step").parent().hide();
					$('#fieldSettings_range_format').parent().removeClass('span4').addClass('span6');
					$("#fieldSettings_range_format option").remove();
					$("#fieldSettings_range_format").append('<option value="characters">Characters</option><option value="words">Words</option>');
					break;

				case 'textarea':
					$("#fieldSettings_container_value").show();
					$("#fieldSettings_container_placeholder").show();
					$("#fieldSettings_container_range").parent().show();
					$("#fieldSettings_range_step").parent().hide();
					$('#fieldSettings_range_format').parent().removeClass('span4').addClass('span6');
					$("#fieldSettings_range_format option").remove();
					$("#fieldSettings_range_format").append('<option value="characters">Characters</option><option value="words">Words</option>');
					break;

				case 'radio':
				case 'checkbox':
				case 'select':
				case 'multiselect':
					$("#fieldSettings_container_choices").parent().show();
					break;

				case 'number':
					$("#fieldSettings_container_value").hide();
					$("#fieldSettings_container_placeholder").show();
					$("#fieldSettings_container_range").parent().show();
					$("#fieldSettings_range_step").parent().show();
					$('#fieldSettings_range_format').parent().removeClass('span6').addClass('span4');

					$("#fieldSettings_range_format option").remove();
					$("#fieldSettings_range_format").append('<option value="value">Value</option><option value="digits">Digits</option>');
					break;

				case 'wysiwyg':
					$("#fieldSettings_container_placeholder").hide();
					$("#fieldSettings_container_value").hide();
					break;

				case 'file':
					$("#fieldSettings_container_file_allowedExtensions").parent().show();
					$("#fieldSettings_container_file_options").parent().show();
					$("#fieldSettings_container_value").hide();
					$("#fieldSettings_container_placeholder").hide();
					break;

				default:
					$("#fieldSettings_container_value").show();
					$("#fieldSettings_container_placeholder").show();
					break;
			}

			var choicesOptions_val = $("#choicesOptions_"+id).val();
			if (choicesOptions_val !== undefined) {
				var fieldSettings_choices_manual = $("#fieldSettings_choices_manual");
				opts                             = choicesOptions_val.split("%,%");
				tmp                              = '';
				// Update left panel
				for (i = 0; i < opts.length; i++) {
					tmp += addChoice(opts[i],$("#choicesDefault_"+id).val());
				}
				fieldSettings_choices_manual.html(tmp).find("input[name=fieldSettings_choices_text]").keyup();
			}

			var allowedExtensions_val = $("#allowedExtensions_"+id).val();
			if (allowedExtensions_val !== undefined) {
				var fieldSettings_file_allowedExtensions = $("#fieldSettings_file_allowedExtensions");
				opts                                     = allowedExtensions_val.split("%,%");
				tmp                                      = '';

				fieldSettings_file_allowedExtensions.html('');
				for (i = 0; i < opts.length; i++) {
					tmp += addAllowedExtension(opts[i]);
				}
				fieldSettings_file_allowedExtensions.append(tmp);
				fieldSettings_file_allowedExtensions.find(":input[name=fieldSettings_allowedExtension_text]:first").keyup();
			}

			var metaDataStandards = $('#metadataStandard_'+id).val();
			if(metaDataStandards !== undefined){
				var displayMDStandards = $("#metadataStandard_options");
				opts = metaDataStandards.split("%,%");
				tmp  = '';
				displayMDStandards.html('');

				for (i = 0; i < opts.length; i++) {
					tmp += addMetadataStandard(opts[i]);
				}
				displayMDStandards.append(tmp);

				// need to be used to get the values into the select menus
				$('.mdStandardSelect').each(function(){
					var selectValue = $(this).data('selectvalue');
					$(this).val(selectValue);
				});
			}

			if (type != 'fieldset') {
				var parentFieldset = fieldset.parents("li").parents("li");
				if (parentFieldset.length > 0) {
					var parentFieldsetID = parentFieldset.prop("id").split("_")[1];
					fieldset.val($("#fieldset_"+parentFieldsetID).val());
				}
				else {
					fieldset.val('');
				}
			}
			else {
				$("#fieldSettings_fieldset").val(fieldset.val());
			}

			// Do I show the 'Variables' link?
			if(-1 != $.inArray(type, ['idno','text','textarea','date','time','wysiwyg'])){
				$('#fieldVariablesLink').show();
			}else{
				$('#fieldVariablesLink').hide();
			}

			// Ajax Stuff that still needed
			$("#fieldSettings_externalUpdate_formSelect").change(function() {
				var val             = $(this).val();

				if (choicesFields[val] === undefined) {
					choicesFields[val] = '';

					$.ajax({
						url: "../includes/getFormFields.php",
						async: false
					}).always(function(data) {
						var obj = JSON.parse(data);

						$.each(obj, function(I, field) {
							var options = '';
							$.each(field, function(i, f) {
								options += '<option value="'+f.name+'">'+f.label+'</option>';
							});
							choicesFields[I] = options;
						});
					});
				}

				$("#externalUpdateForm_"+id).val(val).change();
				$("#fieldSettings_externalUpdate_fieldSelect").html(choicesFields[val]).change();
			});

			$('.uxOptions').find('input').change(function(){
				var dataObj = $(this).data('bindmodel');
				var element  = $("."+dataObj);
				if($(this).is(':checked') || $(this).value){
					element.show();
				} else {
					element.hide();
				}
			});

			// bind functionality of form
			enableChoiceFunctionality();
		}
	}
}

function fieldSettingsBindings(){
	var formPreview   = $("#formPreview");
	formPreview.children('li').removeClass('activeField');

    // Setup Form Bindings
    $('#fieldSettings_form').find("[data-bindmodel]").bind('change keyup', bindToHiddenForm);

	// Select a field to change settings
	formPreview.on("click", "li", function(event) {
		event.stopPropagation();
		var id = $(this).data('id');
		globalFieldID = id;

		formPreview.find('[data-bind]').bind('change', setOriginalValues);

		if(!$(this).hasClass('activeField')){
			formPreview.find('.activeField').removeClass('activeField');
			$(this).addClass('activeField');
			$("#fieldTab a[href='#fieldSettings']").tab("show");
			showFieldSettings(id);
			setInitialBind();
			applyFormPreview();
		}
	});
}  // end function

function setInitialBind(){
    var id = globalFieldID;
    if (typeof id == 'undefined') {
        return;
    }
    else {
        var parentObj  = $("#formPreview").find("[data-id='"+ id +"']");
        var hiddenForm = parentObj.find('.fieldValues');
        hiddenForm.find('[data-bind]').change();
        $("#formPreview").find('[data-bind]').unbind('change', setOriginalValues);
    }
}

function setOriginalValues(){
    var id          = globalFieldID;
    var bindObj     = $(this).data('bind');
    var value      = $(this).is("input[type=checkbox]") ? evaluateCheck($(this)) : $(this).val();
    var bindToInput = $('#fieldSettings_form').find("[data-bindmodel='" + bindObj + "']");

    if(bindObj == 'name'){
    	value = $.trim(value);
    	evaluateSpace(value, bindToInput);
    }

    // Object Specific Value Change
	if( bindObj == 'help'){
		var helpType = value.split(" | ")[0];
		var help     = value.split(" | ")[1];
		var value    = (help == 'undefined' ? "" : help);
		$(this).val(helpType + " | " + help);

		$("#fieldSettings_help_textarea").val(value).hide();
		$("#fieldSettings_help_url").hide().val(value);
		$('#fieldSettings_help_type').val(helpType).change();
	}

    // Modifications for inputs and selects need to be done here same with checks
   if(bindToInput.is("input[type=checkbox]")) {
		if(value == "true"){
			bindToInput.prop('checked', true);
		}
		else {
			bindToInput.prop('checked', false);
		}
    }
    else if(bindToInput.is('select')) {
        bindToInput.find('option[value="' + value + '"]').prop('selected', true);
    }
    else if(bindToInput.is("input[type=number]")){
    	bindToInput.val(parseInt(value));
    }
    else{
    	bindToInput.val(value);
    }

    // choices
    if(bindToInput.is($("#fieldSettings_choices_type"))){
		if(value == 'manual'){
			$('#fieldSettings_container_choices').find('.manual_choices').show();
			$('#fieldSettings_container_choices').find('.form_choices').hide();
		} else {
			$('#fieldSettings_container_choices').find('.manual_choices').hide();
			$('#fieldSettings_container_choices').find('.form_choices').show();
		}
	}

	// system
	if(bindObj == 'managedBy'){
		if(value == 'system'){
			$("#fieldSettings_idno_managedBy").next().hide();
		} else {
			$("#fieldSettings_idno_managedBy").next().show();
		}
	}
}

function bindToHiddenForm(){
	var id = globalFieldID;
	if (typeof id == 'undefined') {
        return;
    }
    else {
		var inputObj   = $(this).data('bindmodel');
		var value      = $(this).is("input[type=checkbox]") ? evaluateCheck($(this)) : $(this).val();
		var parentObj  = $("#formPreview").find("[data-id='"+ id +"']");
		var label      = $("#formPreview_"+id).find('.fieldLabels');
		var hiddenForm = parentObj.find('.fieldValues');
		hiddenForm.find("[data-bind='"+ inputObj +"']").val(value);

		if(inputObj == 'name'){
			evaluateSpace(value, $(this));
			titleField();
		}

		if(inputObj == 'choicesType'){
			if(value == 'manual'){
				$('#fieldSettings_container_choices').find('.manual_choices').show();
				$('#fieldSettings_container_choices').find('.form_choices').hide();
				$('#choicesForm_'+id).val('');
			} else {
				$('#fieldSettings_container_choices').find('.manual_choices').hide();
				$('#fieldSettings_container_choices').find('.form_choices').show();
			}
		}

		if(inputObj == 'managedBy'){
			console.log('managedBy');
			if(value == 'system'){
				$("#fieldSettings_idno_managedBy").next().hide().addClass('monkey');
			} else {
				$("#fieldSettings_idno_managedBy").next().show().addClass('tails');
			}
		}

		if(inputObj == 'validation'){
			var validationValue = $('#fieldSettings_validation').val();
			if(validationValue === 'regexp'){
				$('#fieldSettings_validationRegex').show();
			} else {
				$('#fieldSettings_validationRegex').hide().val('');
			}
		}

		if(inputObj == 'helpText' || inputObj == 'helpURL'){
			formatHelpForHiddenField(hiddenForm);
		}

		if(inputObj == 'helpType'){
			switch($(this).val()){
				case 'text':
				case 'html':
					$("#fieldSettings_help_textarea").show().removeClass('hidden');
					$("#fieldSettings_help_url").hide().removeClass('hidden');
					break;
				case 'web':
					$("#fieldSettings_help_url").show().removeClass('hidden');
					$("#fieldSettings_help_textarea").hide().removeClass('hidden');
					break;
				case 'none':
				case 'default':
					$("#fieldSettings_help_textarea").hide().removeClass('hidden');
					$("#fieldSettings_help_url").hide().removeClass('hidden');
					break;
			}
			formatHelpForHiddenField(hiddenForm);
		}

		applyFormPreview();
	}
}

function formatHelpForHiddenField(hiddenForm){
	var value;
	var type = $('#fieldSettings_help_type').val();
	var id = globalFieldID;

	if(type == 'text' || type == 'html'){
		value = sanitizeInput($('#fieldSettings_help_textarea').val());
	}
	else {
		value = $('#fieldSettings_help_url').val();

		if(validateURL(value)){
			$('#fieldSettings_help_url').removeClass('has-error');
		} else {
			$('#fieldSettings_help_url').addClass('has-error');
		}
	}

	var newValues = type + " | " + value;

	$('#fieldSettings_help_text').val(newValues);
	hiddenForm.find("[data-bind='help']").val(newValues);

	$('.helpPreview').popover('destroy');
 	$('.helpPreview').hide();

	if(type == 'html' || type == 'text'){
		$('#formPreview_'+id).find('.helpPreview').show();
		$('.helpPreview').popover({
			'title'   : 'Help',
			'content' : '<div>' + value + '</div>',
			'trigger' : 'click',
			'html' : true
		});
	} else if(type == 'web'){
		$('#formPreview_'+id).find('.helpPreview').show();
		$('.helpPreview').popover({
			'title'   : 'Help Url',
			'content' : '<div><a href="'+value+'">' + value + '</a></div>',
			'trigger' : 'click',
			'html' : true
		});
	} else {
		$('.helpPreview').hide();
	}

}

function evaluateSpace(value, input){
	if(checkForSpaces(value)){
		input.addClass('has-error testy');
		$('.noSpacesAlert').show();
		$('input[type=submit]').addClass('disabled').attr('disabled', true);
	}
	else {
		input.removeClass('has-error');
		$('input[type=submit]').removeClass('disabled').removeAttr('disabled');
		$('.noSpacesAlert').hide();
	}
}

function getFormFields(){
	var options = '';
	$.ajax({
		url: "../includes/getFormFields.php",
		async: false
	}).always(function(data) {
		var obj = JSON.parse(data);
		$.each(obj, function(I, field) {
			$.each(field, function(i, f) {
				options += '<option value="'+f.name+'">'+f.label+'</option>';
			});
		});
	});
	return options;
}

function evaluateCheck(object){
	return (object.is(':checked') ? true : false);
}

function formSettingsBindings() {
	$("#formTitle").on("click", function() {
		$("#fieldTab a[href='#formSettings']").click();
		$("#formSettings_formTitle").focus();
	});
	$("#formSettings_formTitle").keyup(function() {
		$("#formTitle").html($(this).val());
	}).keyup();

	$("#formDescription").on("click", function() {
		$("#fieldTab a[href='#formSettings']").click();
		$("#formSettings_formDescription").focus();
	});
	$("#formSettings_formDescription").keyup(function() {
		$("#formDescription").html($(this).val());
	}).keyup();

	$("#formSettings_formMetadata").change(function() {
		var fieldAdd = $('#fieldAdd');
		var idnoType = $("#formPreview").find("input[name^=type_][value=idno]");

		if ($(this).is(":checked")){
			$("#formSettings_linkTitle_container").show();

			if (idnoType.length === 0) {
				$("#formSettings_formProduction").removeAttr("disabled").removeAttr("title");
				fieldAdd.find("li:contains('ID Number')").hide();
				fieldAdd.find("li:contains('Paragraph Text')").hide();
				fieldAdd.find("li:contains('Radio')").hide();
				fieldAdd.find("li:contains('Checkboxes')").hide();
				fieldAdd.find("li:contains('Dropdown')").hide();
				fieldAdd.find("li:contains('Multi-Select')").hide();
				fieldAdd.find("li:contains('File Upload')").hide();
				fieldAdd.find("li:contains('WYSIWYG')").hide();
				fieldAdd.find("li:contains('Field Set')").parent().hide().prev().hide();
			}
			else {
				if (confirm("Enabling this will remove any existing ID Number fields. Do you want to continue?")) {
					idnoType.parent().parent().remove();
					$("#formSettings_formProduction").removeAttr("disabled").removeAttr("title");
					fieldAdd.find("li:contains('ID Number')").hide();
					fieldAdd.find("li:contains('Paragraph Text')").hide();
					fieldAdd.find("li:contains('Radio')").hide();
					fieldAdd.find("li:contains('Checkboxes')").hide();
					fieldAdd.find("li:contains('Dropdown')").hide();
					fieldAdd.find("li:contains('Multi-Select')").hide();
					fieldAdd.find("li:contains('File Upload')").hide();
					fieldAdd.find("li:contains('WYSIWYG')").hide();
					fieldAdd.find("li:contains('Field Set')").parent().hide().prev().hide();
				}
				else {
					$(this).removeAttr('checked');
				}
			}
		}
		else {
			$("#formSettings_linkTitle_container").hide();

			fieldAdd.find("li:contains('ID Number')").show();
			fieldAdd.find("li:contains('Paragraph Text')").show();
			fieldAdd.find("li:contains('Radio')").show();
			fieldAdd.find("li:contains('Checkboxes')").show();
			fieldAdd.find("li:contains('Dropdown')").show();
			fieldAdd.find("li:contains('Multi-Select')").show();
			fieldAdd.find("li:contains('File Upload')").show();
			fieldAdd.find("li:contains('WYSIWYG')").show();
			fieldAdd.find("li:contains('Field Set')").parent().show().prev().show();

			if (idnoType.length === 0) {
				$("#formSettings_formProduction").prop({
					checked:  false,
					disabled: true,
					title:    "This form needs an ID Number field.",
				});
			}
			else {
				$("#formSettings_formProduction").removeAttr("disabled").removeAttr("title");
			}
		}
	}).change();
}


function formSettingsBindings() {
	$("#formTitle").on("click", function() {
		$("#fieldTab a[href='#formSettings']").click();
		$("#formSettings_formTitle").focus();
	});
	$("#formSettings_formTitle").keyup(function() {
		$("#formTitle").html($(this).val());
	}).keyup();

	$("#formDescription").on("click", function() {
		$("#fieldTab a[href='#formSettings']").click();
		$("#formSettings_formDescription").focus();
	});
	$("#formSettings_formDescription").keyup(function() {
		$("#formDescription").html($(this).val());
	}).keyup();

	$("#formSettings_formMetadata").change(function() {
		var fieldAdd = $('#fieldAdd');
		var idnoType = $("#formPreview").find("input[name^=type_][value=idno]");

		if ($(this).is(":checked")) {
			$("#formSettings_linkTitle_container").show();

			if (idnoType.length === 0) {
				$("#formSettings_formProduction").removeAttr("disabled").removeAttr("title");
				fieldAdd.find("li:contains('ID Number')").hide();
				fieldAdd.find("li:contains('Paragraph Text')").hide();
				fieldAdd.find("li:contains('Radio')").hide();
				fieldAdd.find("li:contains('Checkboxes')").hide();
				fieldAdd.find("li:contains('Dropdown')").hide();
				fieldAdd.find("li:contains('Multi-Select')").hide();
				fieldAdd.find("li:contains('File Upload')").hide();
				fieldAdd.find("li:contains('WYSIWYG')").hide();
				fieldAdd.find("li:contains('Field Set')").parent().hide().prev().hide();
			}
			else {
				if (confirm("Enabling this will remove any existing ID Number fields. Do you want to continue?")) {
					idnoType.parent().parent().remove();
					$("#formSettings_formProduction").removeAttr("disabled").removeAttr("title");
					fieldAdd.find("li:contains('ID Number')").hide();
					fieldAdd.find("li:contains('Paragraph Text')").hide();
					fieldAdd.find("li:contains('Radio')").hide();
					fieldAdd.find("li:contains('Checkboxes')").hide();
					fieldAdd.find("li:contains('Dropdown')").hide();
					fieldAdd.find("li:contains('Multi-Select')").hide();
					fieldAdd.find("li:contains('File Upload')").hide();
					fieldAdd.find("li:contains('WYSIWYG')").hide();
					fieldAdd.find("li:contains('Field Set')").parent().hide().prev().hide();
				}
				else {
					$(this).removeAttr('checked');
				}
			}
		}
		else {
			$("#formSettings_linkTitle_container").hide();

			fieldAdd.find("li:contains('ID Number')").show();
			fieldAdd.find("li:contains('Paragraph Text')").show();
			fieldAdd.find("li:contains('Radio')").show();
			fieldAdd.find("li:contains('Checkboxes')").show();
			fieldAdd.find("li:contains('Dropdown')").show();
			fieldAdd.find("li:contains('Multi-Select')").show();
			fieldAdd.find("li:contains('File Upload')").show();
			fieldAdd.find("li:contains('WYSIWYG')").show();
			fieldAdd.find("li:contains('Field Set')").parent().show().prev().show();

			if (idnoType.length === 0) {
				$("#formSettings_formProduction").prop({
					checked:  false,
					disabled: true,
					title:    "This form needs an ID Number field.",
				});
			}
			else {
				$("#formSettings_formProduction").removeAttr("disabled").removeAttr("title");
			}
		}
	}).change();
}

function modalBindings() {
	$("#formTypeSelector")
		.modal({
			show:     false,
			keyboard: false,
			backdrop: "static"
		})
		.on("click", "button:contains('Metadata')", function() {
			// Select Metadata form
			$('.nav-tabs li:nth-child(3) a').click();
			$("#formSettings_formMetadata").prop("checked", true).change();
			$("#formTypeSelector").modal("hide");
		})
		.on("click", "button:contains('Object')", function() {
			var fieldAdd                         = $('#fieldAdd');
			var formPreviewWell                  = $("#formPreview .well");
			var fieldSettings_label              = $("#fieldSettings_label");
			var fieldSettings_options_sortable   = $("#fieldSettings_options_sortable");
			var fieldSettings_options_searchable = $("#fieldSettings_options_searchable");

			// Add IDNO field and select options
			fieldAdd.find("li:contains('ID Number')").click();
			fieldSettings_label.val('IDNO').keyup();
			fieldSettings_options_sortable.prop("checked", true).change();
			fieldSettings_options_searchable.prop("checked", true).change();

			// Add Title field and select options
			fieldAdd.find("li:contains('Single Line Text')").click();
			$("#fieldSettings_name").val('title').keyup();
			fieldSettings_label.val('Title').keyup();
			$("#fieldSettings_options_required").prop("checked", true).change();
			$("#fieldSettings_options_duplicates").prop("checked", true).change();
			fieldSettings_options_sortable.prop("checked", true).change();
			fieldSettings_options_searchable.prop("checked", true).change();
			$("#fieldSettings_options_displayTable").prop("checked", true).change();

			// Click through each field and then back to add field tab to update form preview
			$("#fieldTab li:last a").click();
			$('#formPreview li').removeClass('activeField');

			// Deselect object form
			$("#formSettings_formMetadata").removeAttr("checked").change();

			// Hide modal
			$("#formTypeSelector").modal("hide");
		});
}

function addNewField(item) {
	// Remove class to designate this is not new for next time
	$(item).removeClass("ui-draggable");

	// Preserve type
	var type = $("a", item).text();

	// Assign an id to new li
	var newID = 0;
	$("#formPreview li").each(function() {
		if ($(this)[0] !== $(item)[0]) {
			var thisID = $(this).attr("id").split("_");
			if (newID <= thisID[1]) {
				newID = parseInt(thisID[1])+1;
			}
		}
	});

	$(item).attr({
			'id': "formPreview_" + newID,
			'data-id': newID,
		}).html('<div class="fieldPreview">'+newFieldPreview(newID,type)+'</div><div class="fieldValues">'+newFieldValues(newID,type)+'</div>');

	// Display settings for new field
	$("#formPreview_"+newID).click();

	if ($("#formSettings_formMetadata").not(":checked")) {
		// Enable/disable Production Form setting based on whether an idno field exists
		if ($("#formPreview").find("input[name^=type_][value=idno]").length === 0) {
			$("#formSettings_formProduction").prop({
				checked:  false,
				disabled: true,
				title:    "This form needs an ID Number field.",
			});
		}
		else {
			$("#formSettings_formProduction").removeAttr("disabled").removeAttr("title");
		}
	}
}

function newFieldPreview(id,type) {
	var output;
	output = '<i class="icon-remove"></i>';

	if (type == 'Field Set' || type == 'fieldset') {
		output += '<fieldset><legend></legend><ul class="unstyled sortable"></ul></fieldset>';
	}
	else {
		output += '<div class="control-group"><label class="control-label fieldLabels">Untitled</label><div class="controls">';

		switch(type) {
			case 'ID Number':
			case 'idno':
			case 'Single Line Text':
			case 'text':
				output += '<input type="text">';
				break;

			case 'Paragraph Text':
			case 'textarea':
				output += '<textarea></textarea>';
				break;

			case 'Radio':
			case 'radio':
				output += '<label class="radio"><input type="radio">First Choice</label><label class="radio"><input type="radio">Second Choice</label>';
				break;

			case 'Checkboxes':
			case 'checkbox':
				output += '<label class="checkbox"><input type="checkbox">First Choice</label><label class="checkbox"><input type="checkbox">Second Choice</label>';
				break;

			case 'Dropdown':
			case 'select':
				output += '<select></select>';
				break;

			case 'Number':
			case 'number':
				output += '<input type="number">';
				break;

			case 'Email':
			case 'email':
				output += '<input type="email">';
				break;

			case 'Phone':
			case 'tel':
				output += '<input type="tel">';
				break;

			case 'Date':
			case 'date':
				output += '<input type="date">';
				break;

			case 'Time':
			case 'time':
				output += '<input type="time">';
				break;

			case 'Website':
			case 'url':
				output += '<input type="url">';
				break;

			case 'Multi-Select':
			case 'multiselect':
				output += '<select multiple></select><br><select class="selectPreview"></select>';
				break;

			case 'WYSIWYG':
			case 'wysiwyg':
				output += '<img src="../includes/img/wysiwyg.png">';
				break;

			case 'File Upload':
			case 'file':
				output += '<input type="file" disabled>';
				break;

			default:
				break;
		}
		output += ' <span class="fa fa-question-circle helpPreview"></span>';
		output += '</div></div>';
	}
	return output;
}

function newFieldValues(id,type,vals) {
	var output = "";

	// sets default values for new fields if they are currently undefined
	if (vals === undefined) {
		vals = {};
		vals.validation    = determineValidation(type);
		vals.name          = 'Untitled'+'_'+id;
		vals.label         = 'Untitiled';
		vals.help          = 'none | ';
		vals.choicesType   = 'manual';
		vals.publicRelease = true;
		vals.managedBy     = 'system';
	}

    vals.type = determineType(type);
    type = vals.type;

    var defaultHiddenFormFields = ['name','position', 'type', 'label', 'value', 'placeholder', 'id', 'class', 'style', 'help', 'helpType', 'required', 'duplicates', 'readonly', 'disabled', 'disabledInsert', 'disabledUpdate', 'publicRelease', 'sortable', 'searchable', 'displayTable', 'hidden', 'validation', 'validationRegex', 'access', 'fieldset', 'metadataStandard' ];

    output += createHiddenFields(defaultHiddenFormFields, id, vals);

    // handle additional form information based on field added
	switch(type) {
		case 'idno':
            var idnoHiddenFields = ['managedBy', 'idnoFormat'];
            output += createHiddenFields(idnoHiddenFields, id, vals);
			output += '<input type="hidden" id="startIncrement_'+id+'" name="startIncrement_'+id+'"   data-bind="startIncrement"    value="'+((vals.startIncrement !== undefined)?vals.startIncrement:'1')+'">';
			output += '<input type="hidden" id="idnoConfirm_'+id+'"    name="idnoConfirm_'+id+'"      data-bind"idnoConfirm"        value="false">';  // why is this hard coded
			break;

		case 'text':
            var textHiddenFields = ['externalUpdateForm', 'externalUpdateField', 'min', 'max', 'step', 'format'];
            output += createHiddenFields(textHiddenFields, id, vals);
			break;

		case 'textarea':
		case 'number':
            var textHiddenFields = ['min', 'max', 'step', 'format'];
            output += createHiddenFields(textHiddenFields, id, vals);
			break;

		case 'radio':
		case 'checkbox':
		case 'select':
		case 'multiselect':
            var choiceHiddenFields = ['choicesType', 'choicesNull', 'choicesDefault', 'choicesForm', 'choicesField', 'choicesFieldDefault'];
            output += createHiddenFields(choiceHiddenFields, id, vals);
			output += '<input type="hidden" id="choicesOptions_'+id+'" name="choicesOptions_'+id+'" data-bind="choicesOptions" value="'+((vals.choicesOptions !== undefined)?vals.choicesOptions:'First Choice%,%Second Choice')+'">';
			break;

		case 'file':
            var fileHiddenFields = [
                'bgProcessing', 'multipleFiles', 'combine', 'ocr', 'convert', 'convertHeight', 'convertWidth', 'watermark', 'watermarkImage',
                'watermarkLocation', 'border', 'borderHeight', 'borderWidth', 'borderColor', 'thumbnail', 'convertAudio', 'bitRate', 'audioFormat', 'convertVideo',
                'videoHeight', 'videoWidth', 'videobitRate', 'aspectRatio', 'videoFormat', 'videothumbnail', 'videoThumbFrames', 'videoThumbHeight',
                'videoThumbWidth', 'videoFormatThumb'];

     		output += createHiddenFields(fileHiddenFields, id, vals);

             // default values
            output += '<input type="hidden" id="allowedExtensions_'+id+'" name="allowedExtensions_'+id+'"     data-bind="allowedExtensions"    value="'+((vals.allowedExtensions !== undefined)?vals.allowedExtensions:'tif%,%tiff%,%jpg')+'">';
			output += '<input type="hidden" id="convertResolution_'+id+'" name="convertResolution_'+id+'"     data-bind="convertResolution"    value="'+((vals.convertResolution !== undefined)?vals.convertResolution:'192')+'">';
			output += '<input type="hidden" id="convertFormat_'+id+'"     name="convertFormat_'+id+'"         data-bind="convertFormat"        value="'+((vals.convertFormat !== undefined)?vals.convertFormat:'JPG')+'">';
			output += '<input type="hidden" id="thumbnailHeight_'+id+'"   name="thumbnailHeight_'+id+'"       data-bind="thumbnailHeight"      value="'+((vals.thumbnailHeight !== undefined)?vals.thumbnailHeight:'150')+'">';
			output += '<input type="hidden" id="thumbnailWidth_'+id+'"    name="thumbnailWidth_'+id+'"        data-bind="thumbnailWidth"       value="'+((vals.thumbnailWidth !== undefined)?vals.thumbnailWidth:'150')+'">';
			output += '<input type="hidden" id="thumbnailFormat_'+id+'"   name="thumbnailFormat_'+id+'"       data-bind="thumbnailFormat"      value="'+((vals.thumbnailFormat !== undefined)?vals.thumbnailFormat:'JPG')+'">';
			break;

		default:
			break;
	}
	return output;
}

function determineValidation(type){
    switch (type) {
        case 'Number':
        case 'number':
            return "integer";
            break;
        case 'Email':
        case 'email':
            return "emailAddr";
            break;
        case 'Phone':
        case 'tel':
            return "phoneNumber";
            break;
        case 'Date':
        case 'date':
            return "date";
            break;
        case 'Website':
        case 'url':
            return "url";
            break;
        default:
            return;
            break;
    }
}

function determineType(type){ switch(type) {
        case 'ID Number':
        case 'idno':
            return 'idno';
            break;

        case 'Single Line Text':
        case 'text':
            return 'text';
            break;

        case 'Paragraph Text':
        case 'textarea':
            return 'textarea';
            break;

        case 'Radio':
        case 'radio':
            return 'radio';
            break;

        case 'Checkboxes':
        case 'checkbox':
            return 'checkbox';
            break;

        case 'Dropdown':
        case 'select':
            return 'select';
            break;

        case 'Number':
        case 'number':
            return 'number';
            break;

        case 'Email':
        case 'email':
            return 'email';
            break;

        case 'Phone':
        case 'tel':
            return 'tel';
            break;

        case 'Date':
        case 'date':
            return 'date';
            break;

        case 'Time':
        case 'time':
            return 'time';
            break;

        case 'Website':
        case 'url':
            return 'url';
            break;

        case 'Multi-Select':
        case 'multiselect':
            return 'multiselect';
            break;

        case 'WYSIWYG':
        case 'wysiwyg':
            return 'wysiwyg';
            break;

        case 'File Upload':
        case 'file':
            return 'file';
            break;

        case 'Field Set':
        case 'fieldset':
            return 'fieldset';
            break;

        default:
            return;
            break;
    }
}

function createHiddenFields(fieldArray,id, vals){
    // Loops through the array to add the hidden fields with out manually adding all of them.  If there isn't a value already determined
    // The value will come from manually declaring it or from the data-bind setup.
    output = "";
    $.each(fieldArray, function(index, value) {
        var field = value + "_" + id;
        var hiddenValues = ((vals[value] !== undefined) ? vals[value]: '');
        output += '<input type="hidden" id="'+field+'" name="'+field+'" data-bind="'+value+'" value="'+hiddenValues+'"/>';
    });
    return output;
}

function addChoice(val,def) {
	if (typeof val === 'undefined') {
		return '<div class="input-prepend input-append" data-itemtype="choice">'+
					'<button name="default" class="btn" type="button" data-toggle="buttons-radio" title="Set this choice as the default."><i class="icon-ok"></i></button>'+
					'<input name="fieldSettings_choices_text" type="text">'+
					'<button name="add" class="btn" type="button" title="Add a choice."><i class="icon-plus"></i></button>'+
					'<button name="remove" class="btn" type="button" title="Remove this choice."><i class="icon-remove"></i></button>'+
				'</div>';
	}
	else if (typeof def === 'undefined') {
		return '<div class="input-prepend input-append" data-itemtype="choice">'+
					'<button name="default" class="btn" type="button" data-toggle="buttons-radio" title="Set this choice as the default."><i class="icon-ok"></i></button>'+
					'<input name="fieldSettings_choices_text" type="text" value="'+val+'">'+
					'<button name="add" class="btn" type="button" title="Add a choice."><i class="icon-plus"></i></button>'+
					'<button name="remove" class="btn" type="button" title="Remove this choice."><i class="icon-remove"></i></button>'+
				'</div>';
	}
	return '<div class="input-prepend input-append" data-itemtype="choice">'+
				'<button name="default" class="btn'+(val==def?" active":"")+'" type="button" data-toggle="buttons-radio" title="Set this choice as the default."><i class="icon-ok"></i></button>'+
				'<input name="fieldSettings_choices_text" type="text" value="'+val+'">'+
				'<button name="add" class="btn" type="button" title="Add a choice."><i class="icon-plus"></i></button>'+
				'<button name="remove" class="btn" type="button" title="Remove this choice."><i class="icon-remove"></i></button>'+
			'</div>';
}

function addAllowedExtension(val) {
	if (typeof val === 'undefined') {
		val = '';
	}
	return '<div class="row-fluid input-append" data-itemtype="extension">'+
				'<input name="fieldSettings_allowedExtension_text" type="text" value="'+val+'">'+
				'<button name="add" class="btn" type="button" title="Add an extension."><i class="icon-plus"></i></button>'+
				'<button name="remove" class="btn" type="button" title="Remove this extension."><i class="icon-remove"></i></button>'+
			'</div>';
}

function addMetadataStandard(val){
	if (typeof val === 'undefined') {
		val = '';
	}

	var options    = metadataSchema;
	var identifier = val.split(' : ')[1];
	var standard   = val.split(' : ')[0];

	if(typeof identifier === 'undefined'){
		identifier = '';
	}

	if(typeof standard === 'undefined'){
		 standard = '';
	}

	var metaDataOptions = '<select class="input-block-level form-control mdStandardSelect" id="fieldSettings_standardType" name="fieldSettings_standardType" data-selectvalue="' + standard +'"><option value=""> None </option>' + options + '</select>';


	return '<div class="row-fluid input-append metadata-item" data-itemtype="metadataStandard">' + metaDataOptions +
				'<input name="fieldSettings_metadataIdentifer" type="text" value="'+identifier+'">'+
				'<button name="add" class="btn" type="button" title="Add Metadata Standard"><i class="icon-plus"></i></button>'+
				'<button name="remove" class="btn" type="button" title="Remove Metadata Standard"><i class="icon-remove"></i></button>'+
			'</div>';
}

function enableChoiceFunctionality(){
	$('.input-append').find($('input[type=text], select')).bind('change keyup', modifyChoiceBinding);
	$('#fieldSettings_choices_null').change(function(){
		$('.input-append').find('input[type=text]').change();
	});

	$('.input-append').find('button').click(function(){
		var state = $(this).attr('name');
		var type  = $(this).parent().data('itemtype');

		if(state == "add"){
			if(type == "choice"){
				$(this).parent().after(addChoice());
			}
			else if(type == "extension") {
				$(this).parent().after(addAllowedExtension());
			}
			else {
				$(this).parent().after(addMetadataStandard());
			}

			// EVENT LISTENER Recouple
			$('.input-append').find('button').unbind('click');
			enableChoiceFunctionality();
		}
		else if(state == "remove"){
			$(this).parent().remove();
			$('.input-append').find($('input[type=text]')).change();
		}
	});

	$("#fieldSettings_choices_formSelect").change(function(){
		var val             = $(this).val();
		if (choicesFields[val] === undefined) {
			var options;
			choicesFields[null] = options;

			$.ajax({
				url: "../includes/getFormFields.php",
				async: false
			}).always(function(data) {
				var obj = JSON.parse(data);

				$.each(obj, function(I, field) {
					var options;
					$.each(field, function(i, f) {
						options += '<option value="'+f.name+'">'+f.label+'</option>';
					});
					choicesFields[I] = options;
				});
			});
		}

		$("#fieldSettings_choices_fieldSelect").html(choicesFields[val]);
	});
}

function modifyChoiceBinding(){
	var valueObject = [];
	var dataType = $(this).parent().data('itemtype');

	if(dataType == 'choice' || dataType == 'extension'){
		$(this).parent().parent().find($('input[type=text]')).each(function(index){
			value = $(this).val();
			valueObject[index] = value;
		});
	}
	else {
		$(this).parent().parent().find($('input[type=text]')).each(function(index){
			var select = $(this).prev('select').val();
			value = select + " : " + $(this).val();
			valueObject[index] = value;
		});
	}

	var choices = valueObject.join('%,%');

	if($('#fieldSettings_choices_null').is(':checked')){
		valueObject.unshift('Make A Selection');
	}

	// use global id  to make form changes
	var targetFormPreview = $('#formPreview_'+globalFieldID);
	var targetType        = targetFormPreview.find($('#type_'+globalFieldID)).val();
	var output            = "";

	for(var iterateChoice = 0; iterateChoice < valueObject.length; iterateChoice++){
		if(targetType == 'multiselect' || targetType == 'select'){
			output += "<option value='"+valueObject[iterateChoice]+"'>"+valueObject[iterateChoice]+"</option>";
		}
		else if(targetType == 'checkbox') {
			output += "<label for='checkbox'><input type='checkbox'/>"+valueObject[iterateChoice]+"</option>";
		} else {
			// do nothing
		}
	}

	if(targetType == 'multiselect'){
		var target = targetFormPreview.find($('.controls')).find($('.selectPreview'));
		target.html(output);
	}
	else if(targetType == 'checkbox') {
		var target = targetFormPreview.find($('.controls'));
		target.find($('label')).remove();
		target.append(output);
	}
	else if(targetType == 'select'){
		var target = targetFormPreview.find($('.controls')).find($('select'));
		target.html(output);
	}

	if(dataType == 'choice'){
		$('.choicesOptions').val(choices).change();
	}
	else if(dataType == "extension") {
		$('.allowedExtensions').val(choices).change();
	}
	else {
		$('.metadataStandard').val(choices).change();
	}
}

// Title Field Form Settings
function titleField(){
	var titleField   = $('#formSettings_objectTitleField');
	var titleOptions = "";

	$('#formPreview').find($(':input[type=text]')).each(function(){
		var name = $(this).parent().parent().parent().next('div').find($("input[name^='label']" )).val();
		var optionValue = $(this).parent().parent().parent().next('div').find($("input[name^='name']" )).val();
		if(optionValue === "idno"){
			//do nothing
		} else {
			titleOptions += "<option value='"+optionValue+"'>"+optionValue+"</option>";
		}
	});

	titleField.html(titleOptions);
}

// REGEX VALIDATION FUNCTIONS
// ====================================================================
function validateURL(value) {
    var urlregex = /^((https?|ftp):\/\/)?([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
    return urlregex.test(value);
}

function sanitizeInput(value){
	var regex = /<(script|embed|object|frameset|frame|iframe|meta|link|style).*?>.*? <\/(script|embed|object|frameset|frame|iframe|meta|link|style).*?>/gmi;
	return value.replace(regex, "");
}

function checkForSpaces(string) {
  return /\s/g.test(string);
}

function escapeHtml(string) {
	return string.replace(/&/g, '&amp;')
                 .replace(/>/g, '&gt;')
                 .replace(/</g, '&lt;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&apos;')
                 .replace(/\//g, '&#x2F;');
}

function unEscapeHtml(string) {
	return string.replace(/&amp;/g, '&')
                 .replace(/&gt;/g, '>')
                 .replace(/&lt;/g, '<')
                 .replace(/&quot;/g, '"')
                 .replace(/&#39;/g, "'")
                 .replace(/&#x2F;/g, '/');
}

function removeHtml(string){
	return string.replace(/&/g, '&amp;')
                 .replace(/>/g, '')
                 .replace(/</g, '')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&apos;')
                 .replace(/\//g, '');
}
