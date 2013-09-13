<?php

include("../../header.php");

function parseHeadings($table,$record) {

	switch ($table) {
		case "creatorCorpName":
			$metaTable = "creator_CorpName";
			break;
		case "creatorMeetName":
			$metaTable = "creator_MeetingName";
			break;
		case "creatorPersName":
			$metaTable = "creator_PersName";
			break;
		case "creatorUniformTitle":
			$metaTable = "creator_UniformName";
			break;
		case "subjectUniformTitle":
			$metaTable = "subject_uniformtitle";
			break;
		case "subjectTopical":
			$metaTable = "subject_topical";
			break;
		case "subjectPersName":
			$metaTable = "subject_persname";
			break;
		case "subjectMeetingName":
			$metaTable = "subject_meetname";
			break;
		case "subjectGeoName":
			$metaTable = "subject_geoname";
			break;
		case "subjectCorpName":
			$metaTable = "subject_corpname";
			break;
		default:
			print "Error getting table setup for ".$table;
			exit;
	}

	global $metadata;

	$return = array();
	if (!is_empty($record[$table])) {
		$items = explode("|",$record[$table]);

		foreach ($items as $item) {
			if (is_empty($item)) continue;

			$return[] = (string)$metadata[$metaTable][$item]['objID'];
		}
	}

	print "<pre>";
	var_dump($return);
	print "</pre>";

	return $return;

}

errorHandle::errorReporting(errorHandle::E_ALL);

$engine->dbConnect("server","dlxs.lib.wvu.edu");
$engine->dbConnect("username","remote");
$engine->dbConnect("password",'My$QLnb.UP??');

$remoteDB = $engine->dbConnect("database","AdminPEC",FALSE);

// Reset the values for the local database
$engine->openDB = NULL;
$engine->dbConnect("server","localhost");
$engine->dbConnect("username","systems");
$engine->dbConnect("password",'Te$t1234');
$engine->dbConnect("database","mfcs",TRUE);

$metadataSQL                         = array();
$metadataSQL['creator_CorpName']     = sprintf("SELECT * FROM `creator_CorpName`");
$metadataSQL['creator_MeetingName']  = sprintf("SELECT * FROM `creator_MeetingName`");
$metadataSQL['creator_PersName']     = sprintf("SELECT * FROM `creator_PersName`");
$metadataSQL['creator_UniformName']  = sprintf("SELECT * FROM `creator_UniformName`");
$metadataSQL['subject_uniformtitle'] = sprintf("SELECT * FROM `subject_uniformtitle`");
$metadataSQL['subject_topical']      = sprintf("SELECT * FROM `subject_topical`");
$metadataSQL['subject_persname']     = sprintf("SELECT * FROM `subject_persname`");
$metadataSQL['subject_meetname']     = sprintf("SELECT * FROM `subject_meetname`");
$metadataSQL['subject_geoname']      = sprintf("SELECT * FROM `subject_geoname`");
$metadataSQL['subject_corpname']     = sprintf("SELECT * FROM `subject_corpname`");
$metadataSQL['types']                = sprintf("SELECT * FROM `types`");


$sql       = sprintf("SELECT * FROM `records`");
$sqlResult = $remoteDB->query($sql);

if (!$sqlResult['result']) {
	errorHandle::newError(__METHOD__."() - : ".$sqlResult['error'], errorHandle::DEBUG);
	print "Error retrieving records.";
	print "<pre>";
	var_dump($sqlResult);
	print "</pre>";
	exit;
}

$records   = array();
$metadata = array();

while ($row       = mysql_fetch_array($sqlResult['result'],  MYSQL_ASSOC)) {
	foreach ($row as $I=>$V) {
		$records[$row['identifier']][$I] = $V; 
	}
}


foreach ($metadataSQL as $I=>$sql) {
	$sqlResult2 = $remoteDB->query($sql);
	
	if (!$sqlResult2['result']) {
		print "Error retrieving records.";
		print "<pre>";
		var_dump($sqlResult2);
		print "</pre>";
		exit;
	}
	
	while($row       = mysql_fetch_array($sqlResult2['result'],  MYSQL_ASSOC)) {

		switch ($I) {
			case "creator_CorpName":
				$formID = "3";
				break;
			case "creator_MeetingName":
				$formID = "4";
				break;
			case "creator_PersName":
				$formID = "1";
				break;
			case "creator_UniformName":
				$formID = "5";
				break;
			case "subject_uniformtitle":
				$formID = "11";
				break;
			case "subject_topical":
				$formID = "12";
				break;
			case "subject_persname":
				$formID = "6";
				break;
			case "subject_meetname":
				$formID = "10";
				break;
			case "subject_geoname":
				$formID = "13";
				break;
			case "subject_corpname":
				$formID = "9";
				break;
			case "types":
				$formID = "14";
				break;
			default:
				print "Error getting FormID for ".$I;
				exit;
		}

		$submitArray = array();
		$submitArray['name'] = $row['title'];

		if (objects::add($formID,$submitArray) !== TRUE) {
			print "error submiting formID ".$formID;
			print "<pre>";
			var_dump($submitArray);
			print "</pre>";

			errorHandle::prettyPrint();

			exit;
		}

		$metadata[$I][$row['ID']]['title'] = $row['title'];
		$metadata[$I][$row['ID']]['objID'] = localvars::get("newObjectID");

		// print "objID<pre>";
		// var_dump($metadata[$I][$row['ID']]['objID']);
		// print "</pre>";
	}
}

foreach ($records as $identifier=>$record) {
	$submitArray = array();
	
	$submitArray['identifier']           = $record['identifier'];
	$submitArray['publicRelease']        = ($record['publicRelease'] == "1")?"Yes":"No"; // "No" | "Yes"
	$submitArray['hasMedia']             = ($record['hasMedia']      == "1")?"Yes":"No"; // "No" | "Yes""
	$submitArray['title']                = $record['title']; //
	$submitArray['date']                 = $record['date']; //
	$submitArray['extent']               = $record['extent']; //
	$submitArray['description']          = $record['description']; //
	$submitArray['scopeAndContentsNote'] = $record['scopeAndContentsNote']; //
	$submitArray['type']                 = $record['type']; //
	$submitArray['format']               = $record['format']; //
	$submitArray['itemCount']            = $record['itemCount']; //
	
	$submitArray['creatorPersName']      = parseHeadings('creatorPersName',$record);
	$submitArray['creatorCorpName']      = parseHeadings('creatorCorpName',$record); //
	$submitArray['creatorMeetName']      = parseHeadings('creatorMeetName',$record); //
	$submitArray['creatorUniformTitle']  = parseHeadings('creatorUniformTitle',$record); //
	$submitArray['subjectPersName']      = parseHeadings('subjectPersName',$record); //
	$submitArray['subjectCorpName']      = parseHeadings('subjectCorpName',$record); //
	$submitArray['subjectMeetingName']   = parseHeadings('subjectMeetingName',$record); //
	$submitArray['subjectUniformTitle']  = parseHeadings('subjectUniformTitle',$record); //
	$submitArray['subjectTopical']       = parseHeadings('subjectTopical',$record); //
	$submitArray['subjectGeoName']       = parseHeadings('subjectGeoName',$record); //


	print "<pre>";
	var_dump($submitArray);
	print "</pre>";

	if (objects::add("2",$submitArray) !== TRUE) {
		print "error submiting formID ".$formID;
		print "<pre>";
		var_dump($submitArray);
		print "</pre>";

		errorHandle::prettyPrint();

		exit;
	}

exit;

}



print "Records: <pre>";
var_dump(count($records));
print "</pre>";

$total = 0;
foreach ($metadata as $table=>$records) {
	print "$table: <pre>";
	var_dump(count($records));
	print "</pre>";

	$total += count($records);
}

print "total Metadata: <pre>";
var_dump($total);
print "</pre>";

?>