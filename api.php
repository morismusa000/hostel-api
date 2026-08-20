<?php

header("Content-Type: application/json");

/* =====================================================
   SQLITE DATABASE - NO CONFIGURATION NEEDED!
===================================================== */

// Create SQLite database file in the same directory
$dbPath = __DIR__ . '/database.sqlite';
$db = new SQLite3($dbPath);

// Create tables if they don't exist
$db->exec("
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        room_no TEXT DEFAULT '',
        role TEXT DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
");

$db->exec("
    CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        image_path TEXT,
        status TEXT DEFAULT 'pending',
        admin_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
");

$db->exec("
    CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        complaint_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
");

// Create admin account if it doesn't exist
$result = $db->query("SELECT id FROM users WHERE email = 'admin@example.com'");
if (!$result->fetchArray()) {
    $hashedPassword = password_hash("admin123", PASSWORD_DEFAULT);
    $db->exec("INSERT INTO users (full_name, email, password, role) 
               VALUES ('System Administrator', 'admin@example.com', '$hashedPassword', 'admin')");
}

// Auto-detect base URL for images
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") 
           . "://" . $_SERVER['HTTP_HOST'] . "/";

$action = $_POST["action"] ?? $_GET["action"] ?? "";

/* ---------------------------------------------------
   LOGIN
--------------------------------------------------- */

if ($action == "login") {
    $email = trim($_POST["email"] ?? "");
    $passwordInput = $_POST["password"] ?? "";

    if ($email == "" || $passwordInput == "") {
        echo json_encode(["success" => false, "message" => "Email and password are required"]);
        exit;
    }

    $stmt = $db->prepare("SELECT id, full_name, email, password, room_no, role FROM users WHERE email = :email LIMIT 1");
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $result = $stmt->execute();
    $user = $result->fetchArray(SQLITE3_ASSOC);

    if (!$user) {
        echo json_encode(["success" => false, "message" => "Account not found"]);
        exit;
    }

    if (!password_verify($passwordInput, $user['password'])) {
        echo json_encode(["success" => false, "message" => "Incorrect password"]);
        exit;
    }

    unset($user['password']);
    echo json_encode(["success" => true, "message" => "Login successful", "user" => $user]);
    exit;
}

/* ---------------------------------------------------
   REGISTER
--------------------------------------------------- */

if ($action == "register") {
    $fullName = trim($_POST["full_name"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $passwordInput = $_POST["password"] ?? "";
    $roomNo = trim($_POST["room_no"] ?? "");

    if ($fullName == "" || $email == "" || $passwordInput == "") {
        echo json_encode(["success" => false, "message" => "Please complete all required fields"]);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["success" => false, "message" => "Invalid email address"]);
        exit;
    }

    if (strlen($passwordInput) < 6) {
        echo json_encode(["success" => false, "message" => "Password must be at least 6 characters"]);
        exit;
    }

    // Check if email exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $result = $stmt->execute();
    if ($result->fetchArray()) {
        echo json_encode(["success" => false, "message" => "Email already registered"]);
        exit;
    }

    $hashedPassword = password_hash($passwordInput, PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO users (full_name, email, password, room_no, role) 
                          VALUES (:full_name, :email, :password, :room_no, 'student')");
    $stmt->bindValue(':full_name', $fullName, SQLITE3_TEXT);
    $stmt->bindValue(':email', $email, SQLITE3_TEXT);
    $stmt->bindValue(':password', $hashedPassword, SQLITE3_TEXT);
    $stmt->bindValue(':room_no', $roomNo, SQLITE3_TEXT);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Registration successful"]);
    } else {
        echo json_encode(["success" => false, "message" => "Registration failed"]);
    }
    exit;
}

/* ---------------------------------------------------
   SUBMIT COMPLAINT
--------------------------------------------------- */

if ($action == "submit_complaint") {
    $userId = intval($_POST["user_id"] ?? 0);
    $title = trim($_POST["title"] ?? "");
    $category = trim($_POST["category"] ?? "");
    $description = trim($_POST["description"] ?? "");

    if ($userId <= 0 || $title == "" || $category == "" || $description == "") {
        echo json_encode(["success" => false, "message" => "Please complete all complaint fields"]);
        exit;
    }

    $imagePath = null;
    if (isset($_FILES["image"]) && $_FILES["image"]["error"] == 0) {
        $uploadDirectory = __DIR__ . "/uploads/";
        if (!is_dir($uploadDirectory)) mkdir($uploadDirectory, 0777, true);
        
        $extension = strtolower(pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION));
        $allowed = ["jpg", "jpeg", "png", "webp"];
        if (in_array($extension, $allowed)) {
            $fileName = "complaint_" . time() . "_" . rand(1000,9999) . "." . $extension;
            $destination = $uploadDirectory . $fileName;
            if (move_uploaded_file($_FILES["image"]["tmp_name"], $destination)) {
                $imagePath = "uploads/" . $fileName;
            }
        }
    }

    $stmt = $db->prepare("INSERT INTO complaints (user_id, title, category, description, image_path, status) 
                          VALUES (:user_id, :title, :category, :description, :image_path, 'pending')");
    $stmt->bindValue(':user_id', $userId, SQLITE3_INTEGER);
    $stmt->bindValue(':title', $title, SQLITE3_TEXT);
    $stmt->bindValue(':category', $category, SQLITE3_TEXT);
    $stmt->bindValue(':description', $description, SQLITE3_TEXT);
    $stmt->bindValue(':image_path', $imagePath, SQLITE3_TEXT);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Complaint submitted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Could not submit complaint"]);
    }
    exit;
}

/* ---------------------------------------------------
   GET COMPLAINTS
--------------------------------------------------- */

if ($action == "get_complaints") {
    $userId = intval($_POST["user_id"] ?? 0);
    $role = $_POST["role"] ?? "student";

    if ($role == "admin") {
        $result = $db->query("
            SELECT complaints.*, users.full_name, users.email, users.room_no 
            FROM complaints 
            INNER JOIN users ON complaints.user_id = users.id 
            ORDER BY complaints.created_at DESC
        ");
    } else {
        $stmt = $db->prepare("SELECT * FROM complaints WHERE user_id = :user_id ORDER BY created_at DESC");
        $stmt->bindValue(':user_id', $userId, SQLITE3_INTEGER);
        $result = $stmt->execute();
    }

    $complaints = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $row['image_url'] = !empty($row['image_path']) ? $baseUrl . $row['image_path'] : null;
        $complaints[] = $row;
    }

    echo json_encode(["success" => true, "complaints" => $complaints]);
    exit;
}

/* ---------------------------------------------------
   UPDATE COMPLAINT STATUS
--------------------------------------------------- */

if ($action == "update_status") {
    $complaintId = intval($_POST["complaint_id"] ?? 0);
    $status = $_POST["status"] ?? "";
    $adminNote = trim($_POST["admin_note"] ?? "");

    $allowedStatuses = ["pending", "in_progress", "resolved", "rejected"];
    if (!in_array($status, $allowedStatuses)) {
        echo json_encode(["success" => false, "message" => "Invalid status"]);
        exit;
    }

    $stmt = $db->prepare("UPDATE complaints SET status = :status, admin_note = :admin_note WHERE id = :id");
    $stmt->bindValue(':status', $status, SQLITE3_TEXT);
    $stmt->bindValue(':admin_note', $adminNote, SQLITE3_TEXT);
    $stmt->bindValue(':id', $complaintId, SQLITE3_INTEGER);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Complaint status updated"]);
    } else {
        echo json_encode(["success" => false, "message" => "Could not update complaint"]);
    }
    exit;
}

/* ---------------------------------------------------
   SUBMIT FEEDBACK
--------------------------------------------------- */

if ($action == "submit_feedback") {
    $userId = intval($_POST["user_id"] ?? 0);
    $complaintId = intval($_POST["complaint_id"] ?? 0);
    $rating = intval($_POST["rating"] ?? 0);
    $comment = trim($_POST["comment"] ?? "");

    if ($userId <= 0 || $complaintId <= 0 || $rating < 1 || $rating > 5 || $comment == "") {
        echo json_encode(["success" => false, "message" => "Please provide rating and feedback"]);
        exit;
    }

    $stmt = $db->prepare("SELECT id FROM feedback WHERE user_id = :user_id AND complaint_id = :complaint_id LIMIT 1");
    $stmt->bindValue(':user_id', $userId, SQLITE3_INTEGER);
    $stmt->bindValue(':complaint_id', $complaintId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    if ($result->fetchArray()) {
        echo json_encode(["success" => false, "message" => "Feedback already submitted"]);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO feedback (user_id, complaint_id, rating, comment) 
                          VALUES (:user_id, :complaint_id, :rating, :comment)");
    $stmt->bindValue(':user_id', $userId, SQLITE3_INTEGER);
    $stmt->bindValue(':complaint_id', $complaintId, SQLITE3_INTEGER);
    $stmt->bindValue(':rating', $rating, SQLITE3_INTEGER);
    $stmt->bindValue(':comment', $comment, SQLITE3_TEXT);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Feedback submitted successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Could not submit feedback"]);
    }
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid API request"]);
?>
