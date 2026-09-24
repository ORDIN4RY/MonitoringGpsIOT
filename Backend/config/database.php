<?php

$host = "localhost";
$username = "gpsuser";
$password = "password123";
$database = "gps_monitoring";

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
        "message" => "Koneksi database gagal"
    ]));
}

$conn->set_charset("utf8mb4");