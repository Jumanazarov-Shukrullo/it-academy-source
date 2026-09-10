<?php
declare(strict_types=1);

/**
 * Shared helper for the HolliHop student-portal proxy.
 *
 * Hardened vs. the original bundled proxy:
 *   - CORS comes from the CMS config allowlist (not a hardcoded origin).
 *   - The HolliHop authkey lives in config.php (server-side), never in the bundle.
 *   - Every endpoint must call require_auth() — these expose student PII and
 *     were previously open to the world (full-list leak + per-id IDOR).
 *
 * Each endpoint starts with:  require __DIR__ . "/_config.php";  require_auth();
 */

require __DIR__ . "/../cms/_bootstrap.php"; // config, CORS, db(), current_user(), require_auth(), json_out/json_error, q()

$HOLLIHOP = $CONFIG["hollihop"] ?? [];
$HOLLIHOP_BASE_URL = rtrim((string)($HOLLIHOP["base_url"] ?? ""), "/");
$HOLLIHOP_API_KEY  = (string)($HOLLIHOP["key"] ?? "");

// HolliHop V2 endpoint map (same as the original proxy).
$HOLLIHOP_ENDPOINTS = [
    "students"   => "/Api/V2/GetStudents",
    "student"    => "/Api/V2/GetStudents",
    "schedule"   => "/Api/V2/GetEdUnits",
    "attendance" => "/Api/V2/GetEdUnitStudentReports",
    "payments"   => "/Api/V2/GetPayments",
    "balances"   => "/Api/V2/GetBalances",
];

function hollihop_endpoint(string $key): string
{
    global $HOLLIHOP_ENDPOINTS;
    if (!isset($HOLLIHOP_ENDPOINTS[$key])) {
        json_error("HolliHop endpoint not configured for '{$key}'", 500);
    }
    return $HOLLIHOP_ENDPOINTS[$key];
}

/** Call the HolliHop V2 API; returns decoded array or sends a JSON error. */
function call_hollihop(string $endpoint, array $query = []): array
{
    global $HOLLIHOP_API_KEY, $HOLLIHOP_BASE_URL;
    if ($HOLLIHOP_API_KEY === "" || $HOLLIHOP_BASE_URL === "") {
        json_error("HolliHop not configured", 500);
    }

    $qs  = http_build_query(array_merge($query, ["authkey" => $HOLLIHOP_API_KEY]));
    $url = $HOLLIHOP_BASE_URL . $endpoint . "?" . $qs;

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 20,
    ]);
    $response = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        json_error("HolliHop request failed: " . $curlErr, 502);
    }
    $data = json_decode((string)$response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        $data = ["raw" => $response];
    }
    if ($httpCode >= 400) {
        $msg = $data["message"] ?? $data["error"] ?? ($data["raw"] ?? "HolliHop error");
        json_error(is_string($msg) ? $msg : "HolliHop error", $httpCode);
    }
    return is_array($data) ? $data : ["data" => $data];
}
