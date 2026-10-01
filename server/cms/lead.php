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
 * Leads land in the `leads` table and are read from the admin panel. When
 * configured, a successful insert also sends a Telegram notification.
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

/** Keep user input from adding forged lines to the notification. */
function telegram_field(string $value): string
{
    return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
}

/** Notify after storing the lead; Telegram failures must not lose the lead. */
function notify_telegram_lead(array $lead): void
{
    global $CONFIG;
    $telegram = $CONFIG['telegram'] ?? [];
    $token = trim((string)($telegram['bot_token'] ?? ''));
    $chatId = trim((string)($telegram['chat_id'] ?? ''));
    if ($token === '' || $chatId === '') {
        return;
    }
    if (!function_exists('curl_init')) {
        error_log('Lead Telegram notification unavailable: cURL missing');
        return;
    }

    $lines = [
        '📩 Новая заявка',
        '👤 Имя: ' . telegram_field($lead['name']),
        '📞 Телефон: ' . $lead['phone'],
    ];
    foreach (['course' => 'Курс', 'form' => 'Форма', 'source' => 'Страница'] as $key => $label) {
        if ($lead[$key] !== '') {
            $lines[] = $label . ': ' . telegram_field($lead[$key]);
        }
    }
    $lines[] = '🕒 ' . (new DateTimeImmutable('now', new DateTimeZone('Asia/Tashkent')))->format('d.m.Y H:i') . ' (Ташкент)';

    try {
        $request = curl_init('https://api.telegram.org/bot' . $token . '/sendMessage');
        if ($request === false) {
            error_log('Lead Telegram notification unavailable: cURL initialization failed');
            return;
        }
        curl_setopt_array($request, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'chat_id' => $chatId,
                'text' => implode("\n", $lines),
            ]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT => 4,
            CURLOPT_FOLLOWLOCATION => false,
        ]);
        $result = curl_exec($request);
        $status = (int)curl_getinfo($request, CURLINFO_HTTP_CODE);
        curl_close($request);
        if ($result === false || $status !== 200) {
            error_log('Lead Telegram notification failed (HTTP ' . $status . ')');
        }
    } catch (Throwable $e) {
        // Never log the exception: cURL errors may include the token in the URL.
        error_log('Lead Telegram notification failed');
    }
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

notify_telegram_lead([
    'name' => mb_substr($name, 0, 120),
    'phone' => $phone,
    'course' => mb_substr($course, 0, 190),
    'form' => mb_substr($form, 0, 60),
    'source' => mb_substr($source, 0, 190),
]);

json_out(["ok" => true]);
