<?php
declare(strict_types=1);
require __DIR__ . "/_bootstrap.php";

/**
 * Generic CRUD for the marketing content tables (courses, teachers, news,
 * vacancies). One file instead of four near-identical copies of schedule.php —
 * the table is chosen from a hardcoded allowlist (never from client input
 * directly), so there is no SQL-injection surface on the table name.
 *
 *   GET    /cms/resource.php?type=courses              -> published items (public)
 *   GET    /cms/resource.php?type=courses&all=1        -> all incl. unpublished (admin)
 *   GET    /cms/resource.php?type=courses&slug=python  -> one item by slug (public)
 *   GET    /cms/resource.php?type=news&id=5            -> one item by id (public)
 *   POST   /cms/resource.php?type=courses              -> create (admin)
 *   PUT    /cms/resource.php?type=courses&id=N         -> update (admin)
 *   DELETE /cms/resource.php?type=courses&id=N         -> delete (admin)
 *
 * ponytail: generic over a fixed map; add a new content type by adding one
 * entry to RESOURCES, not a new file.
 */

const RESOURCES = [
    "courses" => [
        "table"    => "courses",
        "fields"   => ["slug", "title_ru", "title_uz", "summary_ru", "summary_uz",
                       "description_ru", "description_uz", "price", "duration_months",
                       "duration_ru", "duration_uz", "lessons_ru", "lessons_uz",
                       "format_ru", "format_uz", "lesson_duration_ru", "lesson_duration_uz",
                       "button_ru", "button_uz", "button_url", "image", "sort_order", "is_published"],
        "required" => ["slug", "title_ru", "title_uz", "image"],
        "int"      => ["duration_months", "sort_order", "is_published"],
        "float"    => ["price"],
        "slug"     => "slug",
        "order"    => "sort_order ASC, id ASC",
    ],
    "b2b_courses" => [
        "table"    => "b2b_courses",
        "fields"   => ["title_ru", "title_uz", "summary_ru", "summary_uz",
                       "description_ru", "description_uz", "duration_ru", "duration_uz",
                       "format_ru", "format_uz", "image", "sort_order", "is_published"],
        "required" => ["title_ru", "title_uz"],
        "int"      => ["sort_order", "is_published"],
        "float"    => [],
        "slug"     => null,
        "order"    => "sort_order ASC, id ASC",
    ],
    "teachers" => [
        "table"    => "teachers",
        "fields"   => ["name", "role_ru", "role_uz", "bio_ru", "bio_uz",
                       "photo", "sort_order", "is_published"],
        "required" => ["name"],
        "int"      => ["sort_order", "is_published"],
        "float"    => [],
        "slug"     => null,
        "order"    => "sort_order ASC, id ASC",
    ],
    "news" => [
        "table"    => "news",
        "fields"   => ["slug", "title_ru", "title_uz", "excerpt_ru", "excerpt_uz",
                       "body_ru", "body_uz", "cover_image", "is_published", "published_at"],
        "required" => ["title_ru", "title_uz"],
        "int"      => ["is_published"],
        "float"    => [],
        "slug"     => "slug",
        "order"    => "published_at DESC, id DESC",
    ],
    "vacancies" => [
        "table"    => "vacancies",
        "fields"   => ["title_ru", "title_uz", "description_ru", "description_uz",
                       "location", "employment", "image", "sort_order", "is_published"],
        "required" => ["title_ru", "title_uz"],
        "int"      => ["sort_order", "is_published"],
        "float"    => [],
        "slug"     => null,
        "order"    => "sort_order ASC, id ASC",
    ],
];

/**
 * Course-banner fields were added after the first beta schema was installed.
 * Plesk deploys over FTPS, so there is no remote migration command to run. Keep
 * the upgrade idempotent and local to the courses endpoint: the site's own DB
 * user can add the missing nullable columns on the first request after deploy.
 */
function ensure_course_banner_columns(): void
{
    $definitions = [
        "duration_ru"       => "VARCHAR(120) DEFAULT NULL",
        "duration_uz"       => "VARCHAR(120) DEFAULT NULL",
        "lessons_ru"        => "VARCHAR(120) DEFAULT NULL",
        "lessons_uz"        => "VARCHAR(120) DEFAULT NULL",
        "format_ru"         => "VARCHAR(120) DEFAULT NULL",
        "format_uz"         => "VARCHAR(120) DEFAULT NULL",
        "lesson_duration_ru" => "VARCHAR(120) DEFAULT NULL",
        "lesson_duration_uz" => "VARCHAR(120) DEFAULT NULL",
        "button_ru"         => "VARCHAR(120) DEFAULT NULL",
        "button_uz"         => "VARCHAR(120) DEFAULT NULL",
        "button_url"        => "VARCHAR(500) DEFAULT NULL",
    ];
    $columns = db()->query("SHOW COLUMNS FROM courses")->fetchAll(PDO::FETCH_COLUMN);
    $missing = [];
    foreach ($definitions as $name => $definition) {
        if (!in_array($name, $columns, true)) {
            $missing[] = "ADD COLUMN `$name` $definition";
        }
    }
    if ($missing) {
        try {
            db()->exec("ALTER TABLE courses " . implode(", ", $missing));
        } catch (Throwable $e) {
            // Keep the public list available with its localized fallbacks if a
            // restricted DB user cannot ALTER. Admin requests get an explicit
            // error instead of silently discarding the new banner fields.
            error_log("Course banner schema upgrade failed: " . $e->getMessage());
            if (current_user()) json_error("Course banner database upgrade failed", 500);
        }
    }
}

/** Resolve the resource spec from ?type=, or 400. */
function resource_spec(): array
{
    $type = (string)(q("type") ?? "");
    if (!isset(RESOURCES[$type])) {
        json_error("Unknown or missing ?type (allowed: " . implode(", ", array_keys(RESOURCES)) . ")", 400);
    }
    return RESOURCES[$type];
}

/** Pull whitelisted fields from the body, casting per the spec. */
function pick(array $spec, array $in): array
{
    $out = [];
    foreach ($spec["fields"] as $f) {
        if (!array_key_exists($f, $in)) continue;
        $v = $in[$f];
        if (in_array($f, $spec["int"], true)) {
            if ($f === "is_published") {
                $v = (int)((bool)$v);
            } else {
                $v = ($v === "" || $v === null) ? null : (int)$v;
            }
        } elseif (in_array($f, $spec["float"], true)) {
            $v = ($v === "" || $v === null) ? null : (float)$v;
        } else {
            $v = ($v === null) ? null : (string)$v;
        }
        $out[$f] = $v;
    }
    return $out;
}

$spec  = resource_spec();
$table = $spec["table"];
if ($table === "courses") ensure_course_banner_columns();

switch (method()) {

    case "GET": {
        // Single item by slug or id (public — published only unless admin).
        $slug = $spec["slug"] ? q("slug") : null;
        $id   = q("id");
        if ($slug !== null && $slug !== "") {
            $stmt = db()->prepare("SELECT * FROM $table WHERE {$spec['slug']} = ? LIMIT 1");
            $stmt->execute([$slug]);
            $row = $stmt->fetch();
            if (!$row || (!current_user() && !(int)$row["is_published"])) json_error("Not found", 404);
            json_out(["item" => $row]);
        }
        if ($id !== null && $id !== "") {
            $stmt = db()->prepare("SELECT * FROM $table WHERE id = ? LIMIT 1");
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch();
            if (!$row || (!current_user() && !(int)$row["is_published"])) json_error("Not found", 404);
            json_out(["item" => $row]);
        }

        // List.
        $all = q("all") && current_user();
        $sql = "SELECT * FROM $table";
        if (!$all) $sql .= " WHERE is_published = 1";
        $sql .= " ORDER BY " . $spec["order"];
        json_out(["items" => db()->query($sql)->fetchAll()]);
    }

    case "POST": {
        require_auth();
        $data = pick($spec, body());
        foreach ($spec["required"] as $r) {
            if (!isset($data[$r]) || $data[$r] === "" || $data[$r] === null) {
                json_error(implode(", ", $spec["required"]) . " are required", 422);
            }
        }
        $cols = array_keys($data);
        $ph   = implode(", ", array_fill(0, count($cols), "?"));
        $sql  = "INSERT INTO $table (" . implode(", ", $cols) . ") VALUES ($ph)";
        try {
            db()->prepare($sql)->execute(array_values($data));
        } catch (PDOException $e) {
            if ($e->getCode() === "23000") json_error("Duplicate (slug already exists?)", 409);
            throw $e;
        }
        $id  = (int)db()->lastInsertId();
        $row = db()->prepare("SELECT * FROM $table WHERE id = ?");
        $row->execute([$id]);
        json_out(["item" => $row->fetch()], 201);
    }

    case "PUT":
    case "PATCH": {
        require_auth();
        $id = (int)q("id");
        if ($id <= 0) json_error("id is required", 422);
        $data = pick($spec, body());
        if (!$data) json_error("No fields to update", 422);
        $set  = implode(", ", array_map(fn($c) => "$c = ?", array_keys($data)));
        $args = array_values($data);
        $args[] = $id;
        try {
            db()->prepare("UPDATE $table SET $set WHERE id = ?")->execute($args);
        } catch (PDOException $e) {
            if ($e->getCode() === "23000") json_error("Duplicate (slug already exists?)", 409);
            throw $e;
        }
        $row = db()->prepare("SELECT * FROM $table WHERE id = ?");
        $row->execute([$id]);
        $item = $row->fetch();
        if (!$item) json_error("Not found", 404);
        json_out(["item" => $item]);
    }

    case "DELETE": {
        require_auth();
        $id = (int)q("id");
        if ($id <= 0) json_error("id is required", 422);
        db()->prepare("DELETE FROM $table WHERE id = ?")->execute([$id]);
        json_out(["ok" => true]);
    }

    default:
        json_error("Method not allowed", 405);
}
