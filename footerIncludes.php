<!-- Modal - Select Current Projects -->
<div id="selectProjects" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	<div class="modal-header">
		<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
		<h3 id="myModalLabel">Your current projects:</h3>
	</div>
	<div class="modal-body">
		<ul id="selectProjectsList">
			<?php

			// @TODO : This logic should be moved out of the HTML and put into a local variable

			// $currentProjectsIDs = array_keys($currentProjects);
			// foreach(projects::getProjects() as $project){
			//     echo sprintf("<li><label><input type='checkbox' value='%s'%s> %s</label></li>",
			//         $project['ID'],
			//         in_array($project['ID'], $currentProjectsIDs) ? " checked='checked'" : '',
			//         $project['projectName']);
			// }
			?>
	</ul>
	</div>
	<div class="modal-footer">
		<button class="btn" data-dismiss="modal" aria-hidden="true">Cancel</button>
		<button class="btn btn-primary" onclick="saveSelectedProjects();">Save changes</button>
	</div>
</div>

