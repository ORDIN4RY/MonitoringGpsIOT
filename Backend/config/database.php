<?php

$host = "localhost";
$username = "gps_iot";
$password = "123";
$database = "gps_access";

$conn = new mysqli(
    $host,
    $username,
    $password,
    $database
);

if ($conn->connect_error) {
    http_response_code(500);

    die(json_encode([
        "status" => false,
        "message" => "Koneksi database gagal",
        "error" => $conn->connect_error
    ]));
}

$conn->set_charset("utf8mb4");