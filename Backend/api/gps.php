<?php

header("Content-Type: application/json");

require_once "../config/database.php";

// Hanya menerima POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {

    http_response_code(405);

    echo json_encode([
        "status" => false,
        "message" => "Method harus POST"
    ]);

    exit;
}

// Ambil JSON
$input = json_decode(file_get_contents("php://input"), true);

// Validasi
if (
    !isset($input["latitude"]) ||
    !isset($input["longitude"])
) {

    http_response_code(400);

    echo json_encode([
        "status" => false,
        "message" => "Data GPS tidak lengkap"
    ]);

    exit;
}

$latitude = $input["latitude"];
$longitude = $input["longitude"];

// Validasi angka
if (!is_numeric($latitude) || !is_numeric($longitude)) {

    http_response_code(400);

    echo json_encode([
        "status" => false,
        "message" => "Latitude atau longitude tidak valid"
    ]);

    exit;
}

// Simpan ke database
$sql = "
    INSERT INTO gps_data
    (
        latitude,
        longitude
    )
    VALUES (?, ?, ?)
";

$stmt = $conn->prepare($sql);

if (!$stmt) {

    http_response_code(500);

    echo json_encode([
        "status" => false,
        "message" => "Query gagal dibuat"
    ]);

    exit;
}

$stmt->bind_param(
    "sdd",
    $latitude,
    $longitude
);

if ($stmt->execute()) {

    echo json_encode([
        "status" => true,
        "message" => "Data GPS berhasil disimpan",
        "data" => [
            "id" => $stmt->insert_id,
            "latitude" => (float)$latitude,
            "longitude" => (float)$longitude
        ]
    ]);

} else {

    http_response_code(500);

    echo json_encode([
        "status" => false,
        "message" => "Gagal menyimpan data GPS"
    ]);
}

$stmt->close();
$conn->close();