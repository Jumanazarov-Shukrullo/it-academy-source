<?php
declare(strict_types=1);
require __DIR__ . "/../_bootstrap.php";

$user = require_auth();
json_out(["user" => $user]);
