<?php

include("../header.php");


	if (!isset($engine->cleanGet['MYSQL'])) $engine->cleanGet['MYSQL'] = array("listType" => "");

	// Setup the start of the breadcrumbs and pre-populate what we can
	$siteRoot = localvars::get('siteRoot');
	$breadCrumbs = array(
		sprintf('<a href="%s">Home</a>', $siteRoot),
		sprintf('<a href="%s/dataView/list.php">List Objects</a>', $siteRoot)
	);

	// Figure out what kind of list we're building
	switch($engine->cleanGet['MYSQL']['listType']) {
		case 'selectForm':
			$list = listGenerator::createFormSelectList();
			localvars::add('subTitle',' - Select Form');
			$breadCrumbs[] = sprintf('<a href="%s/dataView/list.php?listType=selectForm">Select Form</a>', $siteRoot);
			break;
		case 'selectProject':
			$list = listGenerator::createProjectSelectList();
			localvars::add('subTitle',' - Select Project');
			$breadCrumbs[] = sprintf('<a href="%s/dataView/list.php?listType=selectProject">Select Project</a>', $siteRoot);
			break;
		case 'form':
			$list = listGenerator::createFormObjectList($engine->cleanGet['MYSQL']['formID']);
			$form = forms::get($engine->cleanGet['MYSQL']['formID']);
			localvars::add('subTitle',' - '.$form['title']);
			$breadCrumbs[] = sprintf('<a href="%s/dataView/list.php?listType=selectForm">Select Form</a>', $siteRoot);
			$breadCrumbs[] = sprintf('<a href="%s/dataView/list.php?listType=form&formID=%s">%s</a>', $siteRoot, $form['ID'], $form['title']);
			break;
		case 'project':
			$list    = listGenerator::createProjectObjectList($engine->cleanGet['MYSQL']['projectID']);
			$project = projects::get($engine->cleanGet['MYSQL']['projectID']);
			localvars::add('subTitle',' - '.$project['projectName']);
			$breadCrumbs[] = sprintf('<a href="%s/dataView/list.php?listType=selectProject">Select Project</a>', $siteRoot);
			$breadCrumbs[] = sprintf('<a href="%s/dataView/list.php?listType=project&projectID=%s">%s</a>', $siteRoot, $project['ID'], $project['projectName']);
			break;
		case 'all':
			$list = listGenerator::createAllObjectList();
			localvars::add('subTitle',' - All Objects');
			$breadCrumbs[] = sprintf('<a href="%s/dataView/list.php?listType=all">All Objects</a>', $siteRoot);
			break;
		default:
			$list = listGenerator::createInitialSelectList();
			break;
	}

	localvars::add("list",$list);

	// Make breadcrumbs
	$crumbs = '';
	foreach($breadCrumbs as $breadCrumb){
		$crumbs .= "<li>$breadCrumb</li>";
	}
	localvars::add("breadcrumbs", $crumbs);



localVars::add("results",displayMessages());

$engine->eTemplate("include","header");
?>

<section>
	<header class="page-header">
		<h1>List Objects{local var="subTitle"}</h1>
	</header>
	<nav id="breadcrumbs">
		<ul class="breadcrumb">
			{local var="breadcrumbs"}
		</ul>
	</nav>

	{local var="results"}


	{local var="list"}


</section>


<?php
$engine->eTemplate("include","footer");
?>