<?php
declare(strict_types=1);
require __DIR__ . "/../_bootstrap.php";

if (method() !== "POST") {
    json_error("Method not allowed", 405);
}

$in = body();
$username = trim((string)($in["username"] ?? ""));
$password = (string)($in["password"] ?? "");

if ($username === "" || $password === "") {
    json_error("Username and password are required", 422);
}

// Brute-force throttle: max 5 failed logins / 15 min per IP. We count this
// attempt UP FRONT under an exclusive lock (and clear it on success below), so
// the check+increment is atomic and concurrent POSTs can't outrun the cap.
// ponytail: flock'd tmp-file counter, fine for a single admin box; swap to a
// DB/Redis counter (or fail2ban) if you add many admins or run multiple nodes.
$ip       = $_SERVER["REMOTE_ADDR"] ?? "0.0.0.0";
$throttle = sys_get_temp_dir() . "/ia_login_" . hash("sha256", $ip);
$window   = 900;
$maxFails = 5;
$fh = fopen($throttle, "c+");
if ($fh) {                                   // fail-open if tmp is unwritable
    flock($fh, LOCK_EX);
    [$fails, $since] = array_pad(explode("|", stream_get_contents($fh) ?: ""), 2, "0");
    $fails = (int)$fails; $since = (int)$since;
    if ($since === 0 || (time() - $since) > $window) { $fails = 0; $since = time(); }
    if ($fails >= $maxFails) {
        flock($fh, LOCK_UN); fclose($fh);
        json_error("Too many failed attempts. Try again later.", 429);
    }
    rewind($fh); ftruncate($fh, 0);
    fwrite($fh, ($fails + 1) . "|" . $since);
    flock($fh, LOCK_UN); fclose($fh);
}

$stmt = db()->prepare(
    "SELECT id, username, email, role, password_hash, is_active
       FROM admin_users WHERE username = ? LIMIT 1"
);
$stmt->execute([$username]);
$user = $stmt->fetch();

// Constant-ish failure path (avoid leaking which part was wrong).
if (!$user || !$user["is_active"] || !password_verify($password, $user["password_hash"])) {
    json_error("Invalid login or password", 401);   // already counted above
}

// Success — clear the failure counter for this IP.
@unlink($throttle);

// Issue an opaque session token; store only its hash.
$raw   = bin2hex(random_bytes(32));
$ttl   = (int)($CONFIG["session_ttl"] ?? 604800);
$ins = db()->prepare(
    "INSERT INTO admin_sessions (token, user_id, expires_at, user_agent, ip)
     VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND), ?, ?)"
);
$ins->execute([
    hash_token($raw),
    (int)$user["id"],
    $ttl,
    substr((string)($_SERVER["HTTP_USER_AGENT"] ?? ""), 0, 255),
    $_SERVER["REMOTE_ADDR"] ?? null,
]);

db()->prepare("UPDATE admin_users SET last_login_at = UTC_TIMESTAMP() WHERE id = ?")
    ->execute([(int)$user["id"]]);

json_out([
    "token" => $raw,
    "user"  => [
        "id"       => (int)$user["id"],
        "username" => $user["username"],
        "email"    => $user["email"],
        "role"     => $user["role"],
    ],
    "expires_in" => $ttl,
]);
