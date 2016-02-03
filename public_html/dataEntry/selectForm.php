<?php
include("../header.php");

//Permissions Access
if(!mfcsPerms::evaluatePageAccess(1)){
	header('Location: /index.php?permissionFalse');
}

try {
	if (($formList = listGenerator::generateAccordionFormList(TRUE)) === FALSE) {
		throw new Exception("Error getting Forms Listing");
	}
	else {
		localvars::add("formList",$formList);
	}
}
catch(Exception $e) {
	errorHandle::errorMsg($e->getMessage());
}

localVars::add("results",displayMessages());
log::insert("Data Entry: Form Select: View Page");
$engine->eTemplate("include","header");
?>

<section>
	<header class="page-header">
		<h1 class="page-title">Select a Form
		</h1>
	</header>

	<ul class="breadcrumbs">
		<li><a href="{local var="siteRoot"}">Home</a></li>
		<li><a href="{local var="siteRoot"}/dataEntry/selectForm.php">Select a Form</a></li>
	</ul>

	{local var="results"}

	{local var="formList"}
</section>

<?php
$engine->eTemplate("include","footer");
?>
