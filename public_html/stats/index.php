<?php
include("../header.php");
$engine->eTemplate("include","header");

log::insert("Stats: View Index Page");

$stats = new mfcsStats(".");
localvars::add("statsList",$stats->showStatFiles());
?>
<section>
	<header class="page-header">
		<h1>System Stats</h1>
	</header>

	<ul class="breadcrumbs">
		<li><a href="{local var="siteRoot"}">Home</a></li>
		<li><a href="{local var="siteRoot"}/stats/">Stats</a></li>
	</ul>


	{local var="statsList"}

</section>
<?php
$engine->eTemplate("include","footer");
?>