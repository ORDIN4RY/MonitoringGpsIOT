<?php

header("Content-Type: application/json");

require_once "../config/database.php";

$sql = "
    SELECT
        id,
        latitude,
        longitude,
        created_at
    FROM gps_data
    ORDER BY id DESC
    LIMIT 1
";

$result = $conn->query($sql);

if (!$result) {

    http_response_code(500);

    echo json_encode([
        "status" => false,
        "message" => "Gagal mengambil data GPS"
    ]);

    exit;
}

if ($result->num_rows === 0) {

    echo json_encode([
        "status" => false,
        "message" => "Belum ada data GPS"
    ]);

    exit;
}

$data = $result->fetch_assoc();

echo json_encode([
    "status" => true,
    "data" => [
        "id" => (int)$data["id"],
        "latitude" => (float)$data["latitude"],
        "longitude" => (float)$data["longitude"],
        "created_at" => $data["created_at"]
    ]
]);

$conn->close();