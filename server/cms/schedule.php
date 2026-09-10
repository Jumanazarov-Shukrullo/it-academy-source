<?php
declare(strict_types=1);
require __DIR__ . "/_bootstrap.php";

/**
 * Course schedule resource (replaces the old Firebase "schedule" node).
 *   GET    /cms/schedule.php            -> published items (public)
 *   GET    /cms/schedule.php?branch=x   -> filter by branch (public)
 *   GET    /cms/schedule.php?all=1      -> all items incl. unpublished (admin)
 *   POST   /cms/schedule.php            -> create (admin)
 *   PUT    /cms/schedule.php?id=N       -> update (admin)
 *   DELETE /cms/schedule.php?id=N       -> delete (admin)
 */

const FIELDS = [
    "branch", "course", "days", "time_from", "time_to", "start_date",
    "duration_months", "discount", "description_ru", "description_uz",
    "sort_order", "is_published",
];

/** Pull whitelisted fields from the request body, casting types. */
function pick_fields(array $in): array
{
    $out = [];
    foreach (FIELDS as $f) {
        if (!array_key_exists($f, $in)) continue;
        $v = $in[$f];
        if (in_array($f, ["duration_months", "sort_order"], true)) {
            $v = ($v === "" || $v === null) ? null : (int)$v;
        } elseif ($f === "is_published") {
            $v = (int)((bool)$v);
        } elseif ($f === "start_date") {
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
        $branch = q("branch");
        $sql = "SELECT * FROM schedule_items";
        $where = [];
        $args = [];
        if (!$all) { $where[] = "is_published = 1"; }
        if ($branch) { $where[] = "branch = ?"; $args[] = $branch; }
        if ($where) { $sql .= " WHERE " . implode(" AND ", $where); }
        $sql .= " ORDER BY sort_order ASC, id ASC";
        $stmt = db()->prepare($sql);
        $stmt->execute($args);
        json_out(["items" => $stmt->fetchAll()]);
    }

    case "POST": {
        require_auth();
        $data = pick_fields(body());
        if (empty($data["branch"]) || empty($data["course"])) {
            json_error("branch and course are required", 422);
        }
        $cols = array_keys($data);
        $ph   = implode(", ", array_fill(0, count($cols), "?"));
        $sql  = "INSERT INTO schedule_items (" . implode(", ", $cols) . ") VALUES ($ph)";
        db()->prepare($sql)->execute(array_values($data));
        $id = (int)db()->lastInsertId();
        $row = db()->prepare("SELECT * FROM schedule_items WHERE id = ?");
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
        $n = db()->prepare("UPDATE schedule_items SET $set WHERE id = ?");
        $n->execute($args);
        $row = db()->prepare("SELECT * FROM schedule_items WHERE id = ?");
        $row->execute([$id]);
        $item = $row->fetch();
        if (!$item) json_error("Not found", 404);
        json_out(["item" => $item]);
    }

    case "DELETE": {
        require_auth();
        $id = (int)q("id");
        if ($id <= 0) json_error("id is required", 422);
        db()->prepare("DELETE FROM schedule_items WHERE id = ?")->execute([$id]);
        json_out(["ok" => true]);
    }

    default:
        json_error("Method not allowed", 405);
}
