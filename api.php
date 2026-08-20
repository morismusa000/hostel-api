<?php

header("Content-Type: application/json");

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
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

/* =====================================================
   AUTO-DETECT YOUR DOMAIN FOR IMAGES
===================================================== */

$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
$baseUrl = $protocol . "://" . $_SERVER['HTTP_HOST'] . "/";

$action = $_POST["action"] ?? $_GET["action"] ?? "";

/* ---------------------------------------------------
   LOGIN
--------------------------------------------------- */

if ($action == "login") {

    $email = trim($_POST["email"] ?? "");
    $passwordInput = $_POST["password"] ?? "";

    if ($email == "" || $passwordInput == "") {
        echo json_encode([
            "success" => false,
            "message" => "Email and password are required"
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT id,full_name,email,password,room_no,role
         FROM users
         WHERE email = ?
         LIMIT 1"
    );

    $stmt->bind_param("s", $email);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows != 1) {

        echo json_encode([
            "success" => false,
            "message" => "Account not found"
        ]);
        exit;
    }

    $user = $result->fetch_assoc();

    if (!password_verify($passwordInput, $user["password"])) {

        echo json_encode([
            "success" => false,
            "message" => "Incorrect password"
        ]);
        exit;
    }

    unset($user["password"]);

    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "user" => $user
    ]);

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

        echo json_encode([
            "success" => false,
            "message" => "Please complete all required fields"
        ]);

        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

        echo json_encode([
            "success" => false,
            "message" => "Invalid email address"
        ]);

        exit;
    }

    if (strlen($passwordInput) < 6) {

        echo json_encode([
            "success" => false,
            "message" => "Password must be at least 6 characters"
        ]);

        exit;
    }

    $check = $conn->prepare(
        "SELECT id FROM users WHERE email = ? LIMIT 1"
    );

    $check->bind_param("s", $email);
    $check->execute();

    $result = $check->get_result();

    if ($result->num_rows > 0) {

        echo json_encode([
            "success" => false,
            "message" => "Email already registered"
        ]);

        exit;
    }

    $hashedPassword = password_hash(
        $passwordInput,
        PASSWORD_DEFAULT
    );

    $stmt = $conn->prepare(
        "INSERT INTO users
        (full_name,email,password,room_no,role)
        VALUES (?,?,?,?,'student')"
    );

    $stmt->bind_param(
        "ssss",
        $fullName,
        $email,
        $hashedPassword,
        $roomNo
    );

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "Registration successful"
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "Registration failed: " . $conn->error
        ]);
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

        echo json_encode([
            "success" => false,
            "message" => "Please complete all complaint fields"
        ]);

        exit;
    }

    $imagePath = null;

    if (isset($_FILES["image"]) && $_FILES["image"]["error"] == 0) {

        $uploadDirectory = __DIR__ . "/uploads/";

        if (!is_dir($uploadDirectory)) {
            mkdir($uploadDirectory, 0777, true);
        }

        $extension = strtolower(
            pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION)
        );

        $allowed = ["jpg", "jpeg", "png", "webp"];

        if (!in_array($extension, $allowed)) {

            echo json_encode([
                "success" => false,
                "message" => "Only JPG, JPEG, PNG and WEBP images are allowed"
            ]);

            exit;
        }

        $fileName =
            "complaint_" .
            time() .
            "_" .
            rand(1000,9999) .
            "." .
            $extension;

        $destination = $uploadDirectory . $fileName;

        if (move_uploaded_file(
            $_FILES["image"]["tmp_name"],
            $destination
        )) {

            $imagePath = "uploads/" . $fileName;
        }
    }

    $stmt = $conn->prepare(
        "INSERT INTO complaints
        (user_id,title,category,description,image_path,status)
        VALUES (?,?,?,?,?,'pending')"
    );

    $stmt->bind_param(
        "issss",
        $userId,
        $title,
        $category,
        $description,
        $imagePath
    );

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "Complaint submitted successfully"
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "Could not submit complaint: " . $conn->error
        ]);
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

        $sql = "
            SELECT
                complaints.*,
                users.full_name,
                users.email,
                users.room_no
            FROM complaints
            INNER JOIN users
            ON complaints.user_id = users.id
            ORDER BY complaints.created_at DESC
        ";

        $result = $conn->query($sql);

    } else {

        $stmt = $conn->prepare(
            "SELECT *
             FROM complaints
             WHERE user_id = ?
             ORDER BY created_at DESC"
        );

        $stmt->bind_param("i", $userId);
        $stmt->execute();

        $result = $stmt->get_result();
    }

    $complaints = [];

    while ($row = $result->fetch_assoc()) {

        if (!empty($row["image_path"])) {
            $row["image_url"] = $baseUrl . $row["image_path"];
        } else {
            $row["image_url"] = null;
        }

        $complaints[] = $row;
    }

    echo json_encode([
        "success" => true,
        "complaints" => $complaints
    ]);

    exit;
}


/* ---------------------------------------------------
   UPDATE COMPLAINT STATUS
--------------------------------------------------- */

if ($action == "update_status") {

    $complaintId = intval($_POST["complaint_id"] ?? 0);
    $status = $_POST["status"] ?? "";
    $adminNote = trim($_POST["admin_note"] ?? "");

    $allowedStatuses = [
        "pending",
        "in_progress",
        "resolved",
        "rejected"
    ];

    if (!in_array($status, $allowedStatuses)) {

        echo json_encode([
            "success" => false,
            "message" => "Invalid status"
        ]);

        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE complaints
         SET status = ?, admin_note = ?
         WHERE id = ?"
    );

    $stmt->bind_param(
        "ssi",
        $status,
        $adminNote,
        $complaintId
    );

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "Complaint status updated"
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "Could not update complaint: " . $conn->error
        ]);
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

    if (
        $userId <= 0 ||
        $complaintId <= 0 ||
        $rating < 1 ||
        $rating > 5 ||
        $comment == ""
    ) {

        echo json_encode([
            "success" => false,
            "message" => "Please provide rating and feedback"
        ]);

        exit;
    }

    $check = $conn->prepare(
        "SELECT id
         FROM feedback
         WHERE user_id = ?
         AND complaint_id = ?
         LIMIT 1"
    );

    $check->bind_param(
        "ii",
        $userId,
        $complaintId
    );

    $check->execute();

    if ($check->get_result()->num_rows > 0) {

        echo json_encode([
            "success" => false,
            "message" => "Feedback already submitted"
        ]);

        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO feedback
        (user_id,complaint_id,rating,comment)
        VALUES (?,?,?,?)"
    );

    $stmt->bind_param(
        "iiis",
        $userId,
        $complaintId,
        $rating,
        $comment
    );

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "Feedback submitted successfully"
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "Could not submit feedback: " . $conn->error
        ]);
    }

    exit;
}


/* ---------------------------------------------------
   UNKNOWN ACTION
--------------------------------------------------- */

echo json_encode([
    "success" => false,
    "message" => "Invalid API request"
]);

?>