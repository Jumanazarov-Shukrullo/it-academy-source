<?php
declare(strict_types=1);
require __DIR__ . "/_config.php";
require_auth(); // per-id attendance — was IDOR-able.

$id = q("id");
if (!$id) json_error("Missing student id", 400);

$data = call_hollihop(hollihop_endpoint("attendance"), ["studentClientId" => $id]);
if (empty($data["EdUnitStudentReports"])) {
    $data = call_hollihop(hollihop_endpoint("attendance"), ["clientId" => $id]);
}

if (isset($data["EdUnitStudentReports"]) && is_array($data["EdUnitStudentReports"])) {
    $data["EdUnitStudentReports"] = array_values(array_filter(
        $data["EdUnitStudentReports"],
        fn($r) => (string)($r["StudentClientId"] ?? $r["ClientId"] ?? $r["Id"] ?? null) === (string)$id
    ));
}

json_out($data);
