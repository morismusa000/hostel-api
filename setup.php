<?php

/* =====================================================
   DATABASE CONFIGURATION - UPDATE AFTER RENDER SETUP
===================================================== */

// ⚠️ KEEP THESE AS IS - UPDATE AFTER GETTING RENDER CREDENTIALS
$host = getenv('MYSQL_HOST') ?: "localhost";
$username = getenv('MYSQL_USER') ?: "root";
$password = getenv('MYSQL_PASSWORD') ?: "";
$database = getenv('MYSQL_DATABASE') ?: "hostel_db";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}

$conn->set_charset("utf8mb4");

/* USERS TABLE */
$sql = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    room_no VARCHAR(50) DEFAULT '',
    role ENUM('student','admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if (!$conn->query($sql)) {
    die("Users table error: " . $conn->error);
}

/* COMPLAINTS TABLE */
$sql = "CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    image_path VARCHAR(255) DEFAULT NULL,
    status ENUM('pending','in_progress','resolved','rejected') DEFAULT 'pending',
    admin_note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)";

if (!$conn->query($sql)) {
    die("Complaints table error: " . $conn->error);
}

/* FEEDBACK TABLE */
$sql = "CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    complaint_id INT NOT NULL,
    rating INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
)";

if (!$conn->query($sql)) {
    die("Feedback table error: " . $conn->error);
}

/* CREATE ADMIN ACCOUNT */
$adminEmail = "admin@example.com";
$adminPassword = password_hash("admin123", PASSWORD_DEFAULT);
$adminName = "System Administrator";

$check = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
$check->bind_param("s", $adminEmail);
$check->execute();
$result = $check->get_result();

if ($result->num_rows == 0) {
    $insert = $conn->prepare("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'admin')");
    $insert->bind_param("sss", $adminName, $adminEmail, $adminPassword);
    
    if ($insert->execute()) {
        echo "✅ Admin account created successfully.<br>";
    } else {
        echo "❌ Could not create admin account: " . $insert->error . "<br>";
    }
} else {
    echo "✅ Admin account already exists.<br>";
}

echo "✅ Database setup completed successfully.<br>";
echo "<strong>Admin Email:</strong> admin@example.com<br>";
echo "<strong>Admin Password:</strong> admin123<br>";

$conn->close();

?>