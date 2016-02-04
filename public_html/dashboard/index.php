<?php
require_once "../header.php";

$counts = array(
"objects_total"       => sprintf("SELECT COUNT(*) FROM `objects` WHERE `metadata`='0'"),
"metadata_total"      => sprintf("SELECT COUNT(*) FROM `objects` WHERE `metadata`='1'"),
"forms_object_total"  => sprintf("SELECT COUNT(*) FROM `forms` WHERE `metadata`='0'"),
"metadate_form_total" => sprintf("SELECT COUNT(*) FROM `forms` WHERE `metadata`='1'"),
"forms_production"    => sprintf("SELECT COUNT(*) FROM `forms` WHERE `metadata`='0' AND `production`='1'"),
"failed_fixity"       => sprintf("SELECT COUNT(*) FROM `filesChecks` WHERE `pass`='0'"),
"no_checksum"         => sprintf("SELECT COUNT(*) FROM `filesChecks` WHERE `checksum` is null"),
"virus_count"         => sprintf("SELECT COUNT(*) FROM `virusChecks` WHERE `state`='3'")
);

foreach ($counts as $type=>$sql) {

	$sqlResult = $engine->openDB->query($sql);
	if (!$sqlResult['result']) {
		errorHandle::newError(__METHOD__."() - : ".$sqlResult['error'], errorHandle::DEBUG);
	}

	$row = mysql_fetch_array($sqlResult['result'],  MYSQL_ASSOC);

	localvars::add($type,$row["COUNT(*)"]);
}

$engine->eTemplate("include","header");

?>

<section>
	<header class="page-header">
		<h1>Dashboard</h1>
	</header>

	<ul class="breadcrumbs">
		<li><a href="{local var="siteRoot"}">Home</a></li>
	</ul>

	<div class="leftContainerDash">
		<div class="dashboardContainer">
			<h2> System Counts </h2>
			<p>
				<strong class="fileItem">Total Objects in system: </strong>
				<span class="fileCount">{local var="objects_total"}</span>
			</p>
			<p>
				<strong class="fileItem">Total Metadata Objects: </strong>
				<span class="fileCount">{local var="metadata_total"}</span>
			</p>
			<p>
				<strong class="fileItem">Total Object Forms: </strong>
				<span class="fileCount">{local var="forms_object_total"}</span>
			</p>
			<p>
				<strong class="fileItem">Object Forms in Production: </strong>
				<span class="fileCount">{local var="forms_production"}</span>
			</p>
			<p>
				<strong class="fileItem">Total Metadata Forms: </strong>
				<span class="fileCount">{local var="metadate_form_total"}</span>
			</p>
		</div>
	</div>

	<div class="rightContainerDash">
		<div class="dashboardContainer">
			<h2>Fixity Information</h2>
			<p>
				<strong class="fileItem"> Files with failed fixity: </strong>
				<span class="fileCount"> {local var="failed_fixity"}</span>
			</p>
			<p>
				<strong class="fileItem">Files without Checksum: </strong>
				<span class="fileCount">{local var="no_checksum"} </span>
			</p>
		</div>
		<div class="dashboardContainer">
			<h2>Virus Information</h2>
			<p>
				<strong class="fileItem"> Current Virus Count: </strong>
				<span class="fileCount"> {local var="virus_count"}</span>
			</p>
		</div>
	</div>
</section>

<?php
$engine->eTemplate("include","footer");
?>
