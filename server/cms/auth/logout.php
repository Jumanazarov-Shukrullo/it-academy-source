<?php
declare(strict_types=1);
require __DIR__ . "/../_bootstrap.php";

if (method() !== "POST") {
    json_error("Method not allowed", 405);
}

$token = bearer_token();
if ($token) {
    db()->prepare("DELETE FROM admin_sessions WHERE token = ?")
        ->execute([hash_token($token)]);
}
json_out(["ok" => true]);
