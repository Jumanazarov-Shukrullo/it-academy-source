<?php
declare(strict_types=1);
require __DIR__ . "/_config.php";
require_auth(); // was a public leak of ALL students' PII — now admin-only.

$params = [];
if (($s = q("search")) !== null) $params["search"] = $s;
if (($t = q("take"))   !== null) $params["take"]   = $t;
if (($k = q("skip"))   !== null) $params["skip"]   = $k;

json_out(call_hollihop(hollihop_endpoint("students"), $params));
