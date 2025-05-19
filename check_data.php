<?php
require_once 'config.php';

try {
    // Get all records from wishes table
    $stmt = $pdo->query("SELECT * FROM wishes ORDER BY created_at DESC");
    $wishes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h2>Data Wishes:</h2>";
    echo "<pre>";
    print_r($wishes);
    echo "</pre>";
    
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?> 