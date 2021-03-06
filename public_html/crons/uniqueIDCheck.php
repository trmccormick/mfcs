<?php


session_save_path('/tmp');
ini_set('memory_limit',-1);
set_time_limit(0);

require("../header.php");

if (!isCLI()) {
	print "Must be run from the command line.";
	exit;
}

$sql       = sprintf("SELECT `ID`,`idno`,COUNT(`idno`) FROM `objects` GROUP BY `idno` HAVING COUNT(`idno`) > 1");
$sqlResult = mfcs::$engine->openDB->query($sql);

if (!$sqlResult['result']) {
	errorHandle::newError(__METHOD__."() - : ".$sqlResult['error'], errorHandle::DEBUG);

	// TODO: a notification should be sent via email to alert of an issue running the script

	exit;
}

if ($sqlResult['numrows'] == "0") {

	// This is the expect result
	checks::set_ok("uniqueIDCheck");

}
else {

	// This is the bad result
	checks::set_error("uniqueIDCheck");
}

$sqlResult = mfcs::$engine->openDB->query($sql);
if (!$sqlResult['result']) {
	errorHandle::newError(__METHOD__."() - : ".$sqlResult['error'], errorHandle::DEBUG);

	// TODO: a notification should be sent via email to alert of an issue running the script

	exit;
}

?>