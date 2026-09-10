<?php
declare(strict_types=1);
require __DIR__ . "/_bootstrap.php";

/**
 * Lead / contact-form endpoint.
 *
 *   POST   /cms/lead.php        (public) — store a consultation/contact request.
 *     body: { name, phone, course?, source?, form?, _hp? }
 *       _hp  = honeypot; if filled we drop silently and still return ok.
 *       form = which form sent it (home / openday / course-start / nearby / ...).
 *   GET    /cms/lead.php        (admin)  — list leads, newest first.
 *   DELETE /cms/lead.php?id=N   (admin)  — delete a lead.
 *
 * Leads land in the `leads` table and are read from the admin panel.
 * (This used to proxy submissions to a Telegram bot — Telegram is no longer used.)
 */

function format_uz_phone(string $phone): ?string
{
    $digits = preg_replace('/\D+/', "", $phone) ?? "";
    if (strlen($digits) !== 12 || substr($digits, 0, 3) !== "998") {
        return null;
    }

    $local = substr($digits, 3);
    return "+998 "
        . substr($local, 0, 2) . " "
        . substr($local, 2, 3) . "-"
        . substr($local, 5, 2) . "-"
        . substr($local, 7, 2);
}

// --- Admin: list leads ---------------------------------------------------
if (method() === "GET") {
    require_auth();
    $rows = db()->query(
        "SELECT id, name, phone, course, form, source, created_at
           FROM leads ORDER BY id DESC LIMIT 500"
    )->fetchAll();
    json_out(["items" => $rows]);
}

// --- Admin: delete a lead ------------------------------------------------
if (method() === "DELETE") {
    require_auth();
    $id = (int)q("id", 0);
    if ($id <= 0) {
        json_error("Missing ?id", 422);
    }
    db()->prepare("DELETE FROM leads WHERE id = ?")->execute([$id]);
    json_out(["ok" => true]);
}

if (method() !== "POST") {
    json_error("Method not allowed", 405);
}

// --- Public: submit a lead -----------------------------------------------
$in     = body();
$name   = trim((string)($in["name"] ?? ""));
$phone  = trim((string)($in["phone"] ?? ""));
$course = trim((string)($in["course"] ?? ""));
$source = trim((string)($in["source"] ?? ""));
$form   = trim((string)($in["form"] ?? ""));
$hp     = trim((string)($in["_hp"] ?? ""));

// Honeypot: bots fill hidden fields. Pretend success, store nothing.
if ($hp !== "") {
    json_out(["ok" => true]);
}

// Validate and normalize Uzbek numbers: +998 plus exactly 9 local digits.
$phone = format_uz_phone($phone);
if ($phone === null) {
    json_error("Valid phone is required", 422);
}
if (mb_strlen($name) > 120 || mb_strlen($course) > 190) {
    json_error("Field too long", 422);
}

// Per-IP rate limit: 1 submit / 10s.
// ponytail: tmp-file throttle, fine for a contact form; swap to a DB/Redis
// counter only if spam becomes a real problem.
$ip   = $_SERVER["REMOTE_ADDR"] ?? "0.0.0.0";
$lock = sys_get_temp_dir() . "/ia_lead_" . hash("sha256", $ip);
if (is_file($lock) && (time() - (int)@filemtime($lock)) < 10) {
    json_error("Too many requests, try again shortly", 429);
}
@touch($lock);

db()->prepare(
    "INSERT INTO leads (name, phone, course, form, source, ip)
     VALUES (?, ?, ?, ?, ?, ?)"
)->execute([
    mb_substr($name, 0, 120),
    $phone,
    mb_substr($course, 0, 190),
    mb_substr($form, 0, 60),
    mb_substr($source, 0, 190),
    substr($ip, 0, 45),
]);

json_out(["ok" => true]);
