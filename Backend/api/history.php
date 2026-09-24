<?php

header("Content-Type: application/json");

require_once "../config/database.php";

$limit = 100;

$sql = "
    SELECT
        id,
        latitude,
        longitude,
        created_at
    FROM gps_data
    ORDER BY id DESC
    LIMIT ?
";

$stmt = $conn->prepare($sql);

$stmt->bind_param("i", $limit);

$stmt->execute();

$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {

    $data[] = [
        "id" => (int) $row["id"],
        "latitude" => (float) $row["latitude"],
        "longitude" => (float) $row["longitude"],
        "created_at" => $row["created_at"]
    ];
}

echo json_encode([
    "status" => true,
    "total" => count($data),
    "data" => $data
]);

$stmt->close();
$conn->close();