<?php
declare(strict_types=1);
require __DIR__ . "/_config.php";
require_auth(); // per-id PII — was IDOR-able by anyone.

$id = q("id");
if (!$id) json_error("Missing student id", 400);

// HolliHop's filter breaks if id and clientId are sent together — try id, then clientId.
$data = call_hollihop(hollihop_endpoint("student"), ["id" => $id]);
if (empty($data["Students"])) {
    $data = call_hollihop(hollihop_endpoint("student"), ["clientId" => $id]);
}

if (isset($data["Students"]) && is_array($data["Students"])) {
    $match = null;
    foreach ($data["Students"] as $s) {
        $cid = $s["ClientId"] ?? $s["Id"] ?? null;
        if ($cid && (string)$cid === (string)$id) { $match = $s; break; }
    }
    $data = $match ?? ($data["Students"][0] ?? []);
}

json_out($data);
