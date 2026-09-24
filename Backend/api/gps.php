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
$input = json_decode(
    file_get_contents("php://input"),
    true
);

// Cek JSON
if ($input === null) {

    http_response_code(400);

    echo json_encode([
        "status" => false,
        "message" => "Format JSON tidak valid"
    ]);

    exit;
}

// Cek field
if (
    !isset($input["device_id"]) ||
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

// Ambil data
$device_id = trim($input["device_id"]);
$latitude = $input["latitude"];
$longitude = $input["longitude"];

// Validasi device ID
if ($device_id === "") {

    http_response_code(400);

    echo json_encode([
        "status" => false,
        "message" => "Device ID tidak boleh kosong"
    ]);

    exit;
}

// Validasi latitude
if (!is_numeric($latitude) ||
    $latitude < -90 ||
    $latitude > 90) {

    http_response_code(400);

    echo json_encode([
        "status" => false,
        "message" => "Latitude tidak valid"
    ]);

    exit;
}

// Validasi longitude
if (!is_numeric($longitude) ||
    $longitude < -180 ||
    $longitude > 180) {

    http_response_code(400);

    echo json_encode([
        "status" => false,
        "message" => "Longitude tidak valid"
    ]);

    exit;
}

// Query
$sql = "
    INSERT INTO gps_data
    (
        device_id,
        latitude,
        longitude
    )
    VALUES (?, ?, ?)
";

$stmt = $conn->prepare($sql);

$stmt->bind_param(
    "sdd",
    $device_id,
    $latitude,
    $longitude
);

// Eksekusi
if ($stmt->execute()) {

    echo json_encode([
        "status" => true,
        "message" => "Data GPS berhasil disimpan",
        "data" => [
            "id" => $stmt->insert_id,
            "device_id" => $device_id,
            "latitude" => (float) $latitude,
            "longitude" => (float) $longitude
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