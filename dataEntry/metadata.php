<?php
include("../header.php");

try {

	if (isset($engine->cleanGet['MYSQL']['objectID'])
		&& (is_empty($engine->cleanGet['MYSQL']['objectID'])
			|| !validate::integer($engine->cleanGet['MYSQL']['objectID']))
		) {

		errorHandle::newError(__METHOD__."() - ObjectID Provided is invalid", errorHandle::DEBUG);
		throw new Exception("ObjectID Provided is invalid.");
	}
	else if (!isset($engine->cleanGet['MYSQL']['objectID'])) {
		$engine->cleanGet['MYSQL']['objectID'] = NULL;
	}

	if (!isset($engine->cleanGet['MYSQL']['formID'])
		|| is_empty($engine->cleanGet['MYSQL']['formID'])
		|| !validate::integer($engine->cleanGet['MYSQL']['formID'])) {

		if (!isnull($engine->cleanGet['MYSQL']['objectID'])) {
			$object = objects::get($engine->cleanGet['MYSQL']['objectID']);

			if ($object === FALSE) {
				errorHandle::newError(__METHOD__."() - No Form ID Provided, error getting Object", errorHandle::DEBUG);
				throw new Exception("No Form ID Provided, error getting Object.");
			}

			http::setGet('formID',$object['formID']);

		}
		else {
			errorHandle::newError(__METHOD__."() - No Form ID Provided.", errorHandle::DEBUG);
			throw new Exception("No Form ID Provided.");
		}
	}

	if (mfcsPerms::isAdmin($engine->cleanGet['MYSQL']['formID']) === FALSE) {
		throw new Exception("Permission Denied to view objects created with this form.");
	}

	$form = forms::get($engine->cleanGet['MYSQL']['formID']);
	if ($form === FALSE) {
		throw new Exception("Error retrieving form.");
	}

	if (forms::isMetadataForm($engine->cleanGet['MYSQL']['formID']) === FALSE) {
		throw new Exception("Obejct form provided (Metadata forms only).");
	}

	// check for edit permissions on the project
	// if (checkProjectPermissions($engine->cleanGet['MYSQL']['id']) === FALSE) {
	// 	errorHandle::errorMsg("Permissions denied for working on this project");
	// 	throw new Exception('Error');
	// }

	// check that this form is part of the project
	// // TODO need forms from User
	// if (!checkFormInProject($engine->cleanGet['MYSQL']['id'],$engine->cleanGet['MYSQL']['formID'])) {
	// 	errorHandle::errorMsg("Form is not part of project.");
	// 	throw new Exception('Error');
	// }

	// if an object ID is provided make sure the object is from this form
	if (isset($engine->cleanGet['MYSQL']['objectID'])
		&& !checkObjectInForm($engine->cleanGet['MYSQL']['formID'],$engine->cleanGet['MYSQL']['objectID'])) {
		throw new Exception("Object not from this form");
	}

	// Get the project
	// $project = NULL; // TODO: Needs to be gotten from the user info
	// if ($project === FALSE) {
	// 	errorHandle::errorMsg("Error retrieving project.");
	// 	throw new Exception('Error');
	// }





	localvars::add("formName",$form['title']);

	// handle submission
	if (isset($engine->cleanPost['MYSQL']['submitForm'])) {
		$return = forms::submit($engine->cleanGet['MYSQL']['formID']);
		if ($return === FALSE) {
			throw new Exception("Error Submitting Form.");
		}
	}
	else if (isset($engine->cleanPost['MYSQL']['updateForm'])) {
		$return = forms::submit($engine->cleanGet['MYSQL']['formID'],$engine->cleanGet['MYSQL']['objectID']);
		if ($return === FALSE) {
			throw new Exception("Error Updating Form.");
		}
	}
	else if (isset($engine->cleanPost['MYSQL']['updateEdit'])) {
		$return = forms::submitEditTable($engine->cleanGet['MYSQL']['formID']);
		if ($return === FALSE) {
			throw new Exception("Error Updating Form.");
		}
	}

	// build the form for displaying
	$builtForm = forms::build($engine->cleanGet['MYSQL']['formID'],$engine->cleanGet['MYSQL']['objectID']);
	if ($builtForm === FALSE) {
		throw new Exception("Error building form.");
	}

	$builtEditTable = forms::buildEditTable($engine->cleanGet['MYSQL']['formID']);
	if ($builtForm === FALSE) {
		throw new Exception("Error building edit table.");
	}

	localvars::add("form",$builtForm);
	localvars::add("metadataEditTable",$builtEditTable);

	// localvars::add("leftnav",buildProjectNavigation($engine->cleanGet['MYSQL']['id']));

}
catch(Exception $e) {
	errorHandle::errorMsg($e->getMessage());
}

localVars::add("results",displayMessages());

$engine->eTemplate("include","header");
?>

<link rel="stylesheet" type="text/css" href="{local var="siteRoot"}includes/css/fineuploader.css" />
<script type="text/javascript" src="{local var="siteRoot"}includes/js/jquery.fineuploader.min.js"></script>
<style>
  /* Fine Uploader
  -------------------------------------------------- */
  .qq-upload-list {
    text-align: left;
  }

  li.alert-success {
    background-color: #DFF0D8;
  }

  li.alert-error {
    background-color: #F2DEDE;
  }

  .alert-error .qq-upload-failed-text {
    display: inline;
  }
</style>
<section>
	<header class="page-header">
		<h1>{local var="formName"}</h1>
	</header>

	{local var="results"}

	<div class="row-fluid">
		<div class="span9" id="right">
			{local var="form"}
		</div>

		<div class="span9">
			{local var="metadataEditTable"}
		</div>

	</div>
</section>


<?php
$engine->eTemplate("include","footer");
?>
