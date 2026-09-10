<?php
declare(strict_types=1);
require __DIR__ . "/_config.php";
require_auth(); // per-id financials — was IDOR-able.

$id = q("id");
if (!$id) json_error("Missing student id", 400);

$data = call_hollihop(hollihop_endpoint("payments"), [
    "clientId"        => $id,
    "studentClientId" => $id,
]);

if (isset($data["Payments"]) && is_array($data["Payments"])) {
    $data["Payments"] = array_values(array_filter(
        $data["Payments"],
        fn($r) => (string)($r["ClientId"] ?? $r["StudentClientId"] ?? $r["Id"] ?? null) === (string)$id
    ));
}

json_out($data);
