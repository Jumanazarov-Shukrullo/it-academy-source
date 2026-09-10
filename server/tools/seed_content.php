<?php
declare(strict_types=1);

/**
 * CLI: seed marketing content (courses, news, vacancies) from seed_data.json.
 *   php server/tools/seed_content.php
 *
 * Idempotent: each row is matched by a natural key (slug, or title_ru for
 * vacancies) and updated in place, so re-running won't duplicate rows.
 * Only the columns present in each JSON row are written — DB defaults fill the
 * rest (is_published=1, timestamps, etc.).
 */

if (PHP_SAPI !== "cli") { http_response_code(403); exit("CLI only\n"); }

$cfg  = require __DIR__ . "/../cms/config.php";
$data = json_decode((string)file_get_contents(__DIR__ . "/seed_data.json"), true);
if (!is_array($data)) { fwrite(STDERR, "seed_data.json missing/invalid\n"); exit(1); }

$d   = $cfg["db"];
$pdo = new PDO(
    "mysql:host={$d['host']};dbname={$d['name']};charset={$d['charset']}",
    $d["user"], $d["pass"],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

/** Insert or update one row, matched on $keyCol. Returns "ins"|"upd". */
function upsert(PDO $pdo, string $table, string $keyCol, array $row): string
{
    $sel = $pdo->prepare("SELECT id FROM `$table` WHERE `$keyCol` = ? LIMIT 1");
    $sel->execute([$row[$keyCol]]);
    $id = $sel->fetchColumn();

    if ($id) {
        $cols = array_keys($row);
        $set  = implode(", ", array_map(fn($c) => "`$c` = ?", $cols));
        $pdo->prepare("UPDATE `$table` SET $set WHERE id = ?")
            ->execute([...array_values($row), $id]);
        return "upd";
    }
    $cols = array_keys($row);
    $ph   = implode(", ", array_fill(0, count($cols), "?"));
    $pdo->prepare("INSERT INTO `$table` (`" . implode("`, `", $cols) . "`) VALUES ($ph)")
        ->execute(array_values($row));
    return "ins";
}

$plan = [
    ["courses",   "slug",     $data["courses"]   ?? []],
    ["news",      "slug",     $data["news"]      ?? []],
    ["vacancies", "title_ru", $data["vacancies"] ?? []],
];

foreach ($plan as [$table, $key, $rows]) {
    $ins = $upd = 0;
    foreach ($rows as $row) {
        if (empty($row[$key])) { fwrite(STDERR, "  skip $table row (no $key)\n"); continue; }
        upsert($pdo, $table, $key, $row) === "ins" ? $ins++ : $upd++;
    }
    echo "$table: +$ins inserted, $upd updated\n";
}
