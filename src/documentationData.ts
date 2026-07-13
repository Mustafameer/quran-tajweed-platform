/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MYSQL_SCHEMA = `-- =========================================================================
-- Online Quran Reading & Tajweed Learning Platform - MySQL Database Schema
-- Version: 1.0.0
-- =========================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS reading_assignments;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS students;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. STUDENTS TABLE
CREATE TABLE students (
    student_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(100) NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    city VARCHAR(100) NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    age INT NULL,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_phone (phone),
    INDEX idx_student_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TEACHERS TABLE
CREATE TABLE teachers (
    teacher_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. COURSES TABLE
CREATE TABLE courses (
    course_id VARCHAR(50) PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    teacher_id VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_course_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ENROLLMENTS TABLE
CREATE TABLE enrollments (
    enrollment_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    UNIQUE KEY uq_student_course (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_enrollment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SESSIONS (LIVE CLASSES)
CREATE TABLE sessions (
    session_id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('scheduled', 'live', 'completed') DEFAULT 'scheduled',
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_session_date (session_date),
    INDEX idx_session_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ATTENDANCE LOGS
CREATE TABLE attendance (
    attendance_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    session_id VARCHAR(50) NOT NULL,
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leave_time TIMESTAMP NULL,
    duration INT DEFAULT 0 COMMENT 'Duration in seconds',
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_attendance_student (student_id),
    INDEX idx_attendance_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. READING ASSIGNMENTS
CREATE TABLE reading_assignments (
    assignment_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NULL COMMENT 'If null, it is assigned to the whole session',
    session_id VARCHAR(50) NOT NULL,
    surah_number INT NOT NULL,
    start_ayah INT NOT NULL,
    end_ayah INT NOT NULL,
    page_number INT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. STUDENT EVALUATIONS
CREATE TABLE evaluations (
    evaluation_id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    session_id VARCHAR(50) NOT NULL,
    reading_accuracy INT NOT NULL CHECK (reading_accuracy BETWEEN 0 AND 100),
    tajweed_accuracy INT NOT NULL CHECK (tajweed_accuracy BETWEEN 0 AND 100),
    fluency INT NOT NULL CHECK (fluency BETWEEN 0 AND 100),
    score DECIMAL(5,2) NOT NULL COMMENT 'Average calculated score',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_evaluation_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. IN-APP NOTIFICATIONS
CREATE TABLE notifications (
    notification_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. SYSTEM SECURITY AUDIT LOGS
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    action VARCHAR(255) NOT NULL,
    date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const PHP_MVC_STRUCTURE = `=========================================================================
PHP 8+ MVC PROJECT STRUCTURE (Clean Architecture & API-First)
=========================================================================

quran-platform/
│
├── config/
│   ├── database.php        # MySQL PDO Database connection singleton
│   ├── config.php          # Security headers, App configuration, environment keys
│   └── bot.php             # Telegram bot configuration credentials
│
├── core/
│   ├── App.php             # Core Router - parses URL & loads matching controller
│   ├── Controller.php      # Base Controller - handles inputs, sanitization, renders JSON/RTL views
│   ├── Model.php           # Base Model - handles PDO statements and query bindings safely
│   └── Database.php        # Core wrapper around standard PDO (prepared statements for SQLi prevention)
│
├── app/
│   ├── Controllers/
│   │   ├── AuthController.php        # CSRF-safe registration, login, session handlers
│   │   ├── CourseController.php      # Creation, updates, dynamic enrollment handlers
│   │   ├── SessionController.php     # Live voice classroom coordinate & permission endpoints
│   │   ├── EvaluationController.php  # Grade accuracy and export reports
│   │   ├── QuranController.php       # Query and assign passages
│   │   └── BotApiController.php      # REUSABLE API endpoints called by Telegram Bot webhook
│   │
│   ├── Models/
│   │   ├── Student.php               # Queries for Students, registration status approvals
│   │   ├── Teacher.php               # Teacher profiles and statistics
│   │   ├── Course.php                # Course management & enrollment filters
│   │   ├── Session.php               # Voice state and active assignments
│   │   └── Evaluation.php            # Analytics & performance calculations
│   │
│   └── Views/
│       ├── layouts/
│       │   ├── header.php            # HTML5 Head containing Arabic RTL stylesheets & Bootstrap 5
│       │   └── footer.php            # Audio visualization dependencies & scripts
│       ├── admin/                    # Admin views (RTL, RTL-customized Bootstrap tables)
│       ├── teacher/                  # Teacher console (classroom triggers, audio permissions)
│       └── student/                  # Student portal (mic permission listening, assignments)
│
├── public/
│   ├── index.php           # Front Controller - Entrypoint for Nginx/Apache routing rewrite rules
│   ├── css/
│   │   ├── rtl-bootstrap.min.css     # Pre-compiled Bootstrap 5 RTL layout
│   │   └── custom.css                # Quranic typography adjustments & wave visualizations
│   ├── js/
│   │   ├── main.js                   # Application global listeners
│   │   └── voice-room.js             # WebRTC media connection, peer handshakes, or dynamic websocket listeners
│   └── upload/                       # Secure folder for Lesson PDFs and files
│
├── composer.json           # PHP 8+ Package declarations (Vlucas/phpdotenv, Firebase/php-jwt)
├── .htaccess               # Apache routing rules for Clean URLs (re-directing all to public/index.php)
└── README.md               # Quick install instructions

-------------------------------------------------------------------------
EXAMPLE BASE CONTROLLER CODE (app/core/Controller.php)
-------------------------------------------------------------------------
<?php
namespace Core;

class Controller {
    // Sanitize input to protect against XSS
    public function getPostData() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            return [];
        }
        $raw = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $sanitized = [];
        foreach ($raw as $key => $val) {
            $sanitized[$key] = is_string($val) ? htmlspecialchars(trim($val), ENT_QUOTES, 'UTF-8') : $val;
        }
        return $sanitized;
    }

    // JSON response helper
    public function jsonResponse($data, $status = 200) {
        header("Content-Type: application/json; charset=UTF-8");
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Verify CSRF Token
    protected function verifyCsrfToken($token) {
        if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
            $this->jsonResponse(['error' => 'Invalid CSRF security token.'], 403);
        }
    }
}
`;

export const TELEGRAM_BOT_PLAN = `=========================================================================
TELEGRAM BOT PREPARATION & INTEGRATION PLAN (Reusable API Architecture)
=========================================================================

1. REUSABLE API ARCHITECTURE (SOLID Principles)
----------------------------------------------
The core platform acts as an API-first server. The Telegram Bot and the Web Frontend
are simply two client consumer channels utilizing the EXACT same business logic models.

┌────────────────────────────────────────────────────────┐
│                      MySQL Database                    │
└───────────────────────────▲────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │       Core PHP PHP MVC Models │
            │   (Student, Enrollment, etc.) │
            └───────────────▲───────────────┘
                            │
            ┌───────────────┴───────────────┐
            │   REST API endpoints          │
            │   (/api/bot/register, etc.)   │
            └──────▲─────────────────▲──────┘
                   │                 │
    ┌──────────────┴───┐     ┌───────┴──────────┐
    │ Web RTL Frontend │     │ Telegram Bot     │
    │ (WebRTC Voice)   │     │ (Long-Poll/Hook) │
    └──────────────────┘     └──────────────────┘

2. INTEGRATION BLUEPRINT
------------------------
- Webhook Mode (Recommended for Production): Configure Telegram's servers to send HTTPS POST
  requests to: https://yourdomain.com/api/bot/webhook
- PHP SDK: Utilizes 'irazasyed/telegram-bot-sdk' package inside config/composer.json.

3. WEBHOOK ENTRYPOINT CONTROLLER EXAMPLE (app/Controllers/BotApiController.php)
-------------------------------------------------------------------------
<?php
namespace App\\Controllers;

use Core\\Controller;
use App\\Models\\Student;
use App\\Models\\Session;

class BotApiController extends Controller {
    
    public function handleWebhook() {
        // Read Telegram JSON Payload
        $update = json_decode(file_get_contents('php://input'), true);
        if (!$update || !isset($update['message'])) {
            return $this->jsonResponse(['status' => 'ignored']);
        }

        $message = $update['message'];
        $chatId = $message['chat']['id'];
        $text = trim($message['text'] ?? '');

        // Command Router
        if (strpos($text, '/start') === 0) {
            $this->sendTelegramMessage($chatId, "مرحباً بكم في منصة تعليم القرآن والتجويد 📖\\n\\nللتسجيل يرجى إرسال: /register\\nلعرض الحصص الجارية: /classes");
        } 
        elseif (strpos($text, '/register') === 0) {
            $this->sendTelegramMessage($chatId, "يرجى تسجيل حسابك أولاً عبر الرابط التالي للحفاظ على الخصوصية والمصادقة الآمنة:\\nhttps://yourdomain.com/student/register?telegram_id=" . $chatId);
        }
        elseif (strpos($text, '/classes') === 0) {
            $this->showLiveClasses($chatId);
        }
        else {
            $this->sendTelegramMessage($chatId, "عذراً، لم أفهم هذا الأمر. يرجى استخدام القائمة المتاحة.");
        }

        return $this->jsonResponse(['status' => 'processed']);
    }

    private function showLiveClasses($chatId) {
        $sessionModel = new Session();
        $liveClasses = $sessionModel->getLiveSessions();
        
        if (empty($liveClasses)) {
            $msg = "لا توجد حصص مباشرة جارية حالياً. 📴";
        } else {
            $msg = "📖 الحصص المباشرة الجارية الآن:\\n\\n";
            foreach ($liveClasses as $cls) {
                $msg .= "🔹 " . $cls['title'] . "\\n📅 " . $cls['session_date'] . "\\n🔗 رابط الانضمام: https://yourdomain.com/classroom/" . $cls['session_id'] . "\\n\\n";
            }
        }
        $this->sendTelegramMessage($chatId, $msg);
    }

    private function sendTelegramMessage($chatId, $text) {
        $botToken = $_ENV['TELEGRAM_BOT_TOKEN'] ?? 'YOUR_BOT_TOKEN';
        $url = "https://api.telegram.org/bot" . $botToken . "/sendMessage";
        
        $postData = [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown'
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
        curl_exec($ch);
        curl_close($ch);
    }
}
`;

export const INSTALLATION_GUIDE = `=========================================================================
INSTALLATION & CONFIGURATION GUIDE (PHP 8+, MySQL, WebRTC Server)
=========================================================================

1. PRE-REQUISITES
-----------------
- Apache Web Server with mod_rewrite enabled (or Nginx)
- PHP 8.0 or higher with PDO, pdo_mysql, and curl extensions activated
- MySQL 5.7+ or MariaDB 10.3+ database
- Composer installed globally
- Secure Socket Layer (SSL) Certificate (REQUIRED for WebRTC Microphone Access)

2. STEP-BY-STEP SETUP
---------------------
STEP 1: DATABASE SET-UP
- Create a new MySQL Database (e.g. \`quran_db\`).
- Execute the SQL table creation script provided in the "SQL Schema" panel of this platform.

STEP 2: DIRECTORY SETUP
- Clone or unzip the MVC template into your server's root folder (e.g., \`/var/www/html/quran-platform\` or \`C:\\xampp\\htdocs\\quran-platform\`).
- Ensure permissions are set so the web server user can read files and write to the \`public/upload\` directory (e.g., \`chmod -R 775 public/upload\`).

STEP 3: CONFIGURING ENVIRONMENT VARIABLES (.env)
- Create a \`.env\` file in the root folder with the following variables:
  \`\`\`env
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_NAME=quran_db
  DB_USER=your_mysql_username
  DB_PASS=your_mysql_password
  APP_URL=https://yourdomain.com
  TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNO_PQRstuVWX
  \`\`\`

STEP 4: APACHE/NGINX REWRITE RULES
- For Apache, configure mod_rewrite in your VirtualHost or use the provided \`.htaccess\` in the root folder:
  \`\`\`apache
  <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteRule ^$ public/ [L]
      RewriteRule (.*) public/$1 [L]
  </IfModule>
  \`\`\`
- For Nginx, ensure all un-routed traffic is rewritten to the index.php:
  \`\`\`nginx
  location / {
      try_files $uri $uri/ /public/index.php?$query_string;
  }
  \`\`\`

STEP 5: REAL-TIME COMMUNICATION (WEBRTC + WEBSOCKET)
- Because student audio speaking permissions must instantly trigger a handoff, a WebSocket server is used.
- In PHP, you can run an independent Ratchet WebSocket server on port 8080:
  \`\`\`bash
  composer require cboden/ratchet
  php app/bin/websocket-server.php
  \`\`\`
- Configure Nginx to reverse proxy port 8080 to a secure websocket path \`/ws\` to prevent certificate/mixed-content blocks.

3. VERIFYING THE INSTALLATION
-----------------------------
1. Navigate to \`https://yourdomain.com/public/index.php\`.
2. Register a student account and verify that it enters "Pending" status in the DB.
3. Access the Super Admin portal, approve the student, create a course, and assign a teacher.
4. Open the Live session in two separate browser tabs with microphone access approved to test the live voice-switching!
`;

export const SOURCE_CODE_DOCS = `=========================================================================
SOURCE CODE & REST API DOCUMENTATION
=========================================================================

1. SECURITY IMPLEMENTATIONS
---------------------------
- Password Hashing: Implemented via PHP's native \`password_hash($pwd, PASSWORD_ARGON2ID)\` to prevent rainbow-table compromises.
- SQL Injection Prevention: Expressed through standard PDO Prepared Statements where variables are bound explicitly. No raw SQL concatenation.
- CSRF Protection: Done by binding a random cryptographic string to PHP's session \`$_SESSION['csrf_token']\` and cross-checking incoming form POSTs.
- Role-Based Access Control (RBAC): Every controller endpoint has a \`middleware('role')\` filter.

2. REST API ENDPOINTS LIST
--------------------------

A) AUTHENTICATION ENDPOINTS
- POST /api/auth/register    - Registers a student. Parameters: full_name, phone, password, city, gender, age.
- POST /api/auth/login       - Role-based login token generation. Returns role & status.
- POST /api/auth/logout      - Clears session cookies and registers audit log.

B) ENROLLMENTS & COURSES
- GET  /api/courses          - Lists all active courses.
- POST /api/enroll/request   - Student requests enrollment in a course.
- POST /api/admin/enroll/approve - Admin approves/rejects student enrollments.

C) REAL-TIME VOICE ROOMS & STATE
- GET  /api/sessions/live    - Lists live classes currently running.
- POST /api/teacher/permission - Grant speaking permission to a single student ID.
- DELETE /api/teacher/permission - Mute all student microphones.
- POST /api/teacher/assign    - Select a Surah, start Ayah, and end Ayah to display to students.

D) ATTENDANCE & GRADING
- POST /api/session/join     - Records join time and returns attendance ID.
- POST /api/session/leave    - Updates leave time and calculates exact duration.
- POST /api/teacher/evaluate - Teacher evaluates student reading accuracy, Tajweed, fluency, and saves notes.

3. RESTRUCTURING CODE FOR TELEGRAM BOTS
---------------------------------------
Because all business logic resides in models like \`Student.php\` and \`Evaluation.php\`, the Telegram bot simply does:
\`\`\`php
$student = new \\App\\Models\\Student();
$details = $student->getByPhone($telegramUserPhone);
\`\`\`
This keeps code completely DRY (Don't Repeat Yourself) and prevents duplicating logic between platforms.
`;
