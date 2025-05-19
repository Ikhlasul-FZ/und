<?php
header('Content-Type: application/json');
require_once 'config.php';

// Handle CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle form submission
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Log received data
    error_log("Received data: " . print_r($data, true));
    
    // Validate required fields
    if (!isset($data['name']) || !isset($data['attendance']) || !isset($data['message'])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Data tidak lengkap'
        ]);
        exit;
    }
    
    // Validate attendance value
    if (!in_array($data['attendance'], ['yes', 'no'])) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Nilai attendance tidak valid'
        ]);
        exit;
    }
    
    try {
        // Prepare the SQL statement
        $stmt = $pdo->prepare("INSERT INTO wishes (name, attendance, guests, message, created_at) VALUES (:name, :attendance, :guests, :message, NOW())");
        
        // Bind parameters explicitly
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':attendance', $data['attendance']);
        $stmt->bindParam(':guests', $data['guests']);
        $stmt->bindParam(':message', $data['message']);
        
        // Execute the statement
        $result = $stmt->execute();
        
        if ($result) {
            // Log successful insertion
            error_log("Successfully inserted wish with attendance: " . $data['attendance']);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Ucapan berhasil disimpan',
                'data' => [
                    'id' => $pdo->lastInsertId(),
                    'name' => $data['name'],
                    'attendance' => $data['attendance'],
                    'guests' => $data['guests'] ?? null,
                    'message' => $data['message']
                ]
            ]);
        } else {
            throw new Exception('Gagal menyimpan data');
        }
    } catch(Exception $e) {
        error_log("Error in wishes_handler.php: " . $e->getMessage());
        error_log("Failed data: " . print_r($data, true));
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Terjadi kesalahan saat menyimpan ucapan: ' . $e->getMessage()
        ]);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all wishes
    try {
        $stmt = $pdo->query("SELECT * FROM wishes ORDER BY created_at DESC");
        $wishes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log retrieved data
        error_log("Retrieved " . count($wishes) . " wishes from database");
        
        echo json_encode([
            'status' => 'success',
            'data' => $wishes
        ]);
    } catch(PDOException $e) {
        error_log("Error in wishes_handler.php: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Terjadi kesalahan saat mengambil data ucapan: ' . $e->getMessage()
        ]);
    }
}
?> 