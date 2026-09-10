<?php
declare(strict_types=1);

/**
 * Shared bootstrap for the it-academy CMS API.
 * Loads config, opens a PDO connection, and exposes request/response/auth helpers.
 *
 * Every endpoint starts with:  require __DIR__ . "/_bootstrap.php";
 */

error_reporting(E_ALL);
ini_set("display_errors", "0");   // never leak stack traces to clients
date_default_timezone_set("UTC");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
$__cfg_file = __DIR__ . "/config.php";
if (!is_file($__cfg_file)) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode(["error" => "Server not configured: config.php missing"]);
    exit;
}
$CONFIG = require $__cfg_file;

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
function cors(array $cfg): void
{
    $origin = $_SERVER["HTTP_ORIGIN"] ?? "";
    $allowed = $cfg["allowed_origins"] ?? [];
    if ($origin && in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Vary: Origin");
        header("Access-Control-Allow-Credentials: true");
    }
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Max-Age: 86400");

    if (($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS") {
        http_response_code(204);
        exit;
    }
}
cors($CONFIG);

// ---------------------------------------------------------------------------
// Security headers (every API/CMS JSON response)
// ---------------------------------------------------------------------------
function security_headers(): void
{
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: DENY");                       // JSON must never be framed
    header("Referrer-Policy: strict-origin-when-cross-origin");
    // HSTS only over TLS, so we don't pin plain-http dev clients.
    $https = ($_SERVER["HTTPS"] ?? "") === "on"
        || ($_SERVER["HTTP_X_FORWARDED_PROTO"] ?? "") === "https";
    if ($https) {
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
    }
    // ponytail: no CSP here — these are JSON endpoints (nosniff covers the
    // sniffing risk). The SPA HTML gets its CSP/headers from the deploy .htaccess.
}
security_headers();

// ---------------------------------------------------------------------------
// Database (lazy singleton)
// ---------------------------------------------------------------------------
function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    global $CONFIG;
    $d = $CONFIG["db"];
    $dsn = "mysql:host={$d['host']};dbname={$d['name']};charset={$d['charset']}";
    try {
        $pdo = new PDO($dsn, $d["user"], $d["pass"], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (Throwable $e) {
        json_error("Database connection failed", 500);
    }
    return $pdo;
}

// ---------------------------------------------------------------------------
// Request / response helpers
// ---------------------------------------------------------------------------
function method(): string
{
    return strtoupper($_SERVER["REQUEST_METHOD"] ?? "GET");
}

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    // CMS data changes from the admin panel must be visible immediately. Do not
    // allow a browser, CDN, or hosting proxy to reuse an old JSON response.
    header("Cache-Control: no-store, max-age=0, must-revalidate");
    header("Pragma: no-cache");
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400, array $extra = []): void
{
    json_out(array_merge(["error" => $message], $extra), $status);
}

/** Parse JSON request body into an array (empty array if none/invalid). */
function body(): array
{
    $raw = file_get_contents("php://input") ?: "";
    if ($raw === "") return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/** Read a query param. */
function q(string $key, $default = null)
{
    return $_GET[$key] ?? $default;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
/** Extract the Bearer token from the Authorization header (robust across SAPIs). */
function bearer_token(): ?string
{
    $hdr = $_SERVER["HTTP_AUTHORIZATION"]
        ?? $_SERVER["REDIRECT_HTTP_AUTHORIZATION"]
        ?? "";
    if ($hdr === "" && function_exists("getallheaders")) {
        foreach (getallheaders() as $k => $v) {
            if (strcasecmp($k, "Authorization") === 0) { $hdr = $v; break; }
        }
    }
    if (preg_match('/Bearer\s+([A-Za-z0-9._\-]+)/i', $hdr, $m)) {
        return $m[1];
    }
    return null;
}

/** Return the current admin user array, or null if not authenticated. */
function current_user(): ?array
{
    $token = bearer_token();
    if (!$token) return null;
    $stmt = db()->prepare(
        "SELECT u.id, u.username, u.email, u.role
           FROM admin_sessions s
           JOIN admin_users u ON u.id = s.user_id
          WHERE s.token = ? AND s.expires_at > UTC_TIMESTAMP() AND u.is_active = 1
          LIMIT 1"
    );
    $stmt->execute([hash("sha256", $token)]);
    $user = $stmt->fetch();
    return $user ?: null;
}

/** Require an authenticated admin; sends 401 and exits otherwise. */
function require_auth(): array
{
    $user = current_user();
    if (!$user) {
        json_error("Unauthorized", 401);
    }
    return $user;
}

/** Hash a raw token for storage (we never store the raw token). */
function hash_token(string $raw): string
{
    return hash("sha256", $raw);
}
