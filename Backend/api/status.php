<?php

header("Content-Type: application/json");

require_once "../config/database.php";

echo json_encode([
    "status" => true,
    "message" => "Backend GPS Monitoring aktif",
    "database" => "connected",
    "server_time" => date("Y-m-d H:i:s")
]);

$conn->close();