<?php
declare(strict_types=1);

/**
 * CLI: create or update an admin user.
 *   php server/tools/create_admin.php <username> <password> [email]
 *
 * Run on the server (or locally) after loading the schema. Safe to re-run:
 * an existing username has its password/email updated.
 */

if (PHP_SAPI !== "cli") {
    http_response_code(403);
    exit("CLI only\n");
}

$cfgFile = __DIR__ . "/../cms/config.php";
if (!is_file($cfgFile)) {
    fwrite(STDERR, "config.php missing at {$cfgFile}\n");
    exit(1);
}
$cfg = require $cfgFile;

[$_, $username, $password, $email] = array_pad($argv, 4, null);
if (!$username || !$password) {
    fwrite(STDERR, "usage: php create_admin.php <username> <password> [email]\n");
    exit(1);
}

$d = $cfg["db"];
$pdo = new PDO(
    "mysql:host={$d['host']};dbname={$d['name']};charset={$d['charset']}",
    $d["user"], $d["pass"],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$hash = password_hash($password, PASSWORD_DEFAULT);

$pdo->prepare(
    "INSERT INTO admin_users (username, email, password_hash, role, is_active)
     VALUES (?, ?, ?, 'admin', 1)
     ON DUPLICATE KEY UPDATE email = VALUES(email),
                             password_hash = VALUES(password_hash),
                             is_active = 1"
)->execute([$username, $email, $hash]);

echo "Admin user '{$username}' created/updated.\n";
