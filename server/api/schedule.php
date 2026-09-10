<?php
declare(strict_types=1);
require __DIR__ . "/_config.php";
require_auth(); // per-id group schedule — was IDOR-able.

$id = q("id");
if (!$id) json_error("Missing student id", 400);

$data = call_hollihop(hollihop_endpoint("schedule"), [
    "clientId"        => $id,
    "studentClientId" => $id,
    "queryDays"       => "true",
]);

// Keep only groups the student is actually in (checked at EdUnit + ScheduleItems level).
if (isset($data["EdUnits"]) && is_array($data["EdUnits"])) {
    $data["EdUnits"] = array_values(array_filter($data["EdUnits"], function ($unit) use ($id) {
        $has = function ($value) use ($id) {
            if (is_string($value)) $value = [$value];
            if (!is_array($value)) return false;
            return in_array((string)$id, array_map("strval", $value), true);
        };
        $unitIds = $unit["StudentClientIds"] ?? $unit["StudentIds"] ?? $unit["ClientIds"] ?? [];
        if ($has($unitIds)) return true;
        if (!empty($unit["ScheduleItems"]) && is_array($unit["ScheduleItems"])) {
            foreach ($unit["ScheduleItems"] as $item) {
                $itemIds = $item["StudentClientIds"] ?? $item["StudentIds"] ?? $item["ClientIds"] ?? [];
                if ($has($itemIds)) return true;
            }
        }
        return empty($unitIds); // no explicit links — keep; front filters further by day.
    }));
}

json_out($data);
