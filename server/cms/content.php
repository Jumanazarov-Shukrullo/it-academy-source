<?php
declare(strict_types=1);
require __DIR__ . "/_bootstrap.php";

/**
 * Generic localized content blocks (hero text, about, contacts, footer, ...).
 *   GET /cms/content.php             -> { blocks: { "home.hero.title": {ru,uz}, ... } }
 *   GET /cms/content.php?key=K       -> { block: {ru,uz} }
 *   PUT /cms/content.php?key=K       -> upsert {value_ru, value_uz} (admin)
 */

switch (method()) {

    case "GET": {
        $key = q("key");
        if ($key) {
            $stmt = db()->prepare("SELECT value_ru, value_uz FROM content_blocks WHERE block_key = ?");
            $stmt->execute([$key]);
            $row = $stmt->fetch();
            json_out(["block" => $row ? ["ru" => $row["value_ru"], "uz" => $row["value_uz"]] : null]);
        }
        $rows = db()->query("SELECT block_key, value_ru, value_uz FROM content_blocks")->fetchAll();
        $blocks = [];
        foreach ($rows as $r) {
            $blocks[$r["block_key"]] = ["ru" => $r["value_ru"], "uz" => $r["value_uz"]];
        }
        json_out(["blocks" => $blocks]);
    }

    case "PUT":
    case "POST": {
        require_auth();
        $key = q("key") ?: (body()["key"] ?? null);
        if (!$key) json_error("key is required", 422);
        $in = body();
        db()->prepare(
            "INSERT INTO content_blocks (block_key, value_ru, value_uz)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE value_ru = VALUES(value_ru), value_uz = VALUES(value_uz)"
        )->execute([$key, $in["value_ru"] ?? null, $in["value_uz"] ?? null]);
        json_out(["ok" => true, "key" => $key]);
    }

    case "DELETE": {
        require_auth();
        $key = q("key");
        if (!$key) json_error("key is required", 422);
        db()->prepare("DELETE FROM content_blocks WHERE block_key = ?")->execute([$key]);
        json_out(["ok" => true]); // override removed -> page falls back to bundled copy
    }

    default:
        json_error("Method not allowed", 405);
}
