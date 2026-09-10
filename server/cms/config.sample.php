<?php
// Copy this file to config.php and fill in real values on the server.
// config.php is gitignored and must NEVER be committed (holds DB pass + HolliHop key).
return [
    "db" => [
        "host"    => "localhost",
        "name"    => "itacadem_cms",      // MySQL database name (created in Plesk)
        "user"    => "itacadem_cms",      // MySQL user
        "pass"    => "CHANGE_ME",         // MySQL password
        "charset" => "utf8mb4",
    ],

    // Browser origins allowed to call this API (the SPA). Add localhost for dev.
    // Beta is the only deploy target for now; production stays untouched.
    "allowed_origins" => [
        "https://beta.it-academy.uz",
        "https://it-academy.uz",
        "https://www.it-academy.uz",
        "http://localhost:5173",
    ],

    // HolliHop CRM (student portal proxy under /api). Key was previously
    // hardcoded in the bundled proxy — now it lives here, server-side only.
    "hollihop" => [
        "base_url" => "https://it-academy.t8s.ru",
        "key"      => "CHANGE_ME",        // HolliHop V2 authkey
    ],

    // Admin session lifetime in seconds (default 7 days).
    "session_ttl" => 604800,

    // Absolute path to the directory where uploaded media is stored.
    // On the host this should point inside the docroot so files are web-served,
    // e.g. /var/www/vhosts/it-academy.uz/beta.it-academy.uz/uploads
    "upload_dir"  => __DIR__ . "/../../reference/_uploads_local",
    // Public URL prefix that maps to upload_dir.
    "upload_url"  => "/uploads",
    // The Media library also lists the static site assets in this dir, read-only.
    // Leave unset on the host to default to DOCUMENT_ROOT (the docroot serves them
    // at "/"); set assets_url to "" to match. In dev, point it at app/public.
    "assets_dir"  => $_SERVER["DOCUMENT_ROOT"] ?? "",
    "assets_url"  => "",
    // Leads from the contact/consultation forms are stored in the `leads`
    // table and read from the admin panel (no Telegram/email integration).
];
