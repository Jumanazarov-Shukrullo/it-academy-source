<?php
declare(strict_types=1);
require __DIR__ . "/_bootstrap.php";

/**
 * B2B schedule resource.
 *   GET    /cms/b2b_schedule.php            -> published items
 *   GET    /cms/b2b_schedule.php?all=1      -> all items incl. unpublished (admin)
 *   POST   /cms/b2b_schedule.php            -> create (admin)
 *   PUT    /cms/b2b_schedule.php?id=N       -> update (admin)
 *   DELETE /cms/b2b_schedule.php?id=N       -> delete (admin)
 */

const FIELDS = [
    "course_ru", "course_uz", "audience_ru", "audience_uz",
    "format_ru", "format_uz", "location_ru", "location_uz",
    "days_ru", "days_uz", "time_from", "time_to", "start_date", "end_date",
    "duration_ru", "duration_uz", "trainer_ru", "trainer_uz",
    "seats", "price_ru", "price_uz", "description_ru", "description_uz",
    "sort_order", "is_published",
];

function pick_fields(array $in): array
{
    $out = [];
    foreach (FIELDS as $f) {
        if (!array_key_exists($f, $in)) continue;
        $v = $in[$f];
        if (in_array($f, ["seats", "sort_order"], true)) {
            $v = ($v === "" || $v === null) ? null : (int)$v;
        } elseif ($f === "is_published") {
            $v = (int)((bool)$v);
        } elseif (in_array($f, ["start_date", "end_date"], true)) {
            $v = ($v === "" || $v === null) ? null : (string)$v;
        } else {
            $v = ($v === null) ? null : (string)$v;
        }
        $out[$f] = $v;
    }
    return $out;
}

switch (method()) {

    case "GET": {
        $all = q("all") && current_user();
        $sql = "SELECT * FROM b2b_schedule_items";
        if (!$all) {
            // Publication is the editor's explicit visibility control. Filtering
            // by end_date made a saved item silently disappear on the website.
            $sql .= " WHERE is_published = 1";
        }
        $sql .= " ORDER BY start_date IS NULL ASC, start_date ASC, sort_order ASC, id ASC";
        json_out(["items" => db()->query($sql)->fetchAll()]);
    }

    case "POST": {
        require_auth();
        $data = pick_fields(body());
        if (empty($data["course_ru"]) || empty($data["course_uz"])) {
            json_error("course_ru and course_uz are required", 422);
        }
        $cols = array_keys($data);
        $ph   = implode(", ", array_fill(0, count($cols), "?"));
        $sql  = "INSERT INTO b2b_schedule_items (" . implode(", ", $cols) . ") VALUES ($ph)";
        db()->prepare($sql)->execute(array_values($data));
        $id = (int)db()->lastInsertId();
        $row = db()->prepare("SELECT * FROM b2b_schedule_items WHERE id = ?");
        $row->execute([$id]);
        json_out(["item" => $row->fetch()], 201);
    }

    case "PUT":
    case "PATCH": {
        require_auth();
        $id = (int)q("id");
        if ($id <= 0) json_error("id is required", 422);
        $data = pick_fields(body());
        if (!$data) json_error("No fields to update", 422);
        $set = implode(", ", array_map(fn($c) => "$c = ?", array_keys($data)));
        $args = array_values($data);
        $args[] = $id;
        db()->prepare("UPDATE b2b_schedule_items SET $set WHERE id = ?")->execute($args);
        $row = db()->prepare("SELECT * FROM b2b_schedule_items WHERE id = ?");
        $row->execute([$id]);
        $item = $row->fetch();
        if (!$item) json_error("Not found", 404);
        json_out(["item" => $item]);
    }

    case "DELETE": {
        require_auth();
        $id = (int)q("id");
        if ($id <= 0) json_error("id is required", 422);
        db()->prepare("DELETE FROM b2b_schedule_items WHERE id = ?")->execute([$id]);
        json_out(["ok" => true]);
    }

    default:
        json_error("Method not allowed", 405);
}
