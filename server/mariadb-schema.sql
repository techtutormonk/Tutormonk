-- ====================================================================
-- Tutor Monk - Production MariaDB / MySQL Schema for Hostinger
-- Web Hosting Plan Database (Free included with Hostinger hPanel)
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS (Admin, Tutor, Student)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role` ENUM('admin', 'tutor', 'student') NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `timezone` VARCHAR(100) DEFAULT 'UTC',
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `calendar_token` VARCHAR(64) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `ix_users_email` (`email`),
  INDEX `ix_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. STUDENTS (Linked to users)
CREATE TABLE IF NOT EXISTS `students` (
  `user_id` INT PRIMARY KEY,
  `grade` VARCHAR(100) DEFAULT NULL,
  `curriculum` VARCHAR(150) DEFAULT NULL,
  `school` VARCHAR(255) DEFAULT NULL,
  `goals` TEXT DEFAULT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TUTORS (Bio, subjects, rates, availability JSON)
CREATE TABLE IF NOT EXISTS `tutors` (
  `user_id` INT PRIMARY KEY,
  `bio` TEXT DEFAULT NULL,
  `subjects` TEXT NOT NULL,
  `countries` TEXT NOT NULL,
  `qualifications` VARCHAR(255) DEFAULT NULL,
  `experience_years` INT DEFAULT 0,
  `hourly_rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `status` ENUM('pending', 'verified', 'suspended') NOT NULL DEFAULT 'pending',
  `rating_avg` DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  `rating_count` INT NOT NULL DEFAULT 0,
  `availability` TEXT NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TUTOR APPLICATIONS (Public hiring portal)
CREATE TABLE IF NOT EXISTS `tutor_applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `subjects` TEXT DEFAULT NULL,
  `qualifications` VARCHAR(255) DEFAULT NULL,
  `experience_years` INT DEFAULT 0,
  `demo_link` VARCHAR(500) DEFAULT NULL,
  `message` TEXT DEFAULT NULL,
  `status` ENUM('new', 'approved', 'rejected') NOT NULL DEFAULT 'new',
  `review_note` TEXT DEFAULT NULL,
  `reviewed_by` INT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. LEADS (Inquiries from free demo forms & WhatsApp)
CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `student_name` VARCHAR(255) DEFAULT NULL,
  `grade` VARCHAR(100) DEFAULT NULL,
  `subject` VARCHAR(150) DEFAULT NULL,
  `message` TEXT DEFAULT NULL,
  `source` VARCHAR(100) DEFAULT 'website',
  `status` ENUM('new', 'contacted', 'demo_booked', 'converted', 'lost') NOT NULL DEFAULT 'new',
  `assigned_to` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `converted_user_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`converted_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. COURSES (Programs & curricula)
CREATE TABLE IF NOT EXISTS `courses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `grade_band` VARCHAR(100) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `active` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. ENROLLMENTS (Max 5 active teachers per student)
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `course_id` INT NOT NULL,
  `tutor_id` INT NOT NULL,
  `status` ENUM('active', 'paused', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  `classes_total` INT NOT NULL DEFAULT 0,
  `classes_used` INT NOT NULL DEFAULT 0,
  `start_date` DATE DEFAULT NULL,
  `assignment_link` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE RESTRICT,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PAYOUTS (Tutor earnings)
CREATE TABLE IF NOT EXISTS `payouts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tutor_id` INT NOT NULL,
  `period_start` DATE NOT NULL,
  `period_end` DATE NOT NULL,
  `sessions_count` INT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL,
  `status` ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
  `reference` VARCHAR(255) DEFAULT NULL,
  `paid_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SESSIONS (1:1 Live Classes & Demos)
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enrollment_id` INT DEFAULT NULL,
  `tutor_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `lead_id` INT DEFAULT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME NOT NULL,
  `duration_min` INT NOT NULL DEFAULT 60,
  `meeting_url` VARCHAR(500) DEFAULT NULL,
  `meet_link` VARCHAR(500) DEFAULT NULL,
  `whiteboard_link` VARCHAR(500) DEFAULT NULL,
  `recording_url` VARCHAR(500) DEFAULT NULL,
  `transcript_url` VARCHAR(500) DEFAULT NULL,
  `transcript_text` MEDIUMTEXT DEFAULT NULL,
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('scheduled', 'completed', 'cancelled', 'no_show') NOT NULL DEFAULT 'scheduled',
  `student_attended` TINYINT(1) DEFAULT NULL,
  `tutor_attended` TINYINT(1) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `cancel_reason` VARCHAR(255) DEFAULT NULL,
  `payout_id` INT DEFAULT NULL,
  `series_id` INT DEFAULT NULL,
  `original_starts_at` DATETIME DEFAULT NULL,
  `rescheduled` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`payout_id`) REFERENCES `payouts`(`id`) ON DELETE SET NULL,
  INDEX `ix_sess_tutor` (`tutor_id`, `starts_at`),
  INDEX `ix_sess_student` (`student_id`, `starts_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9b. RECURRING CLASS SERIES (rule + the sessions generated from it)
CREATE TABLE IF NOT EXISTS `session_series` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enrollment_id` INT DEFAULT NULL,
  `tutor_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `rule` TEXT NOT NULL,
  `created_by` INT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. HOMEWORK & SUBMISSIONS
CREATE TABLE IF NOT EXISTS `homework` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enrollment_id` INT DEFAULT NULL,
  `session_id` INT DEFAULT NULL,
  `link_url` VARCHAR(500) DEFAULT NULL,
  `tutor_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `due_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `homework_id` INT NOT NULL UNIQUE,
  `text` TEXT DEFAULT NULL,
  `file_url` VARCHAR(500) DEFAULT NULL,
  `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `grade` DECIMAL(5,2) DEFAULT NULL,
  `feedback` TEXT DEFAULT NULL,
  `graded_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`homework_id`) REFERENCES `homework`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. TESTS & ASSESSMENTS
CREATE TABLE IF NOT EXISTS `tests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(150) DEFAULT NULL,
  `grade` VARCHAR(50) DEFAULT NULL,
  `total_marks` DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `test_results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `test_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `tutor_id` INT NOT NULL,
  `score` DECIMAL(6,2) NOT NULL,
  `remarks` TEXT DEFAULT NULL,
  `taken_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_test_student` (`test_id`, `student_id`),
  FOREIGN KEY (`test_id`) REFERENCES `tests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. PROGRESS REPORTS & FEEDBACK
CREATE TABLE IF NOT EXISTS `reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `tutor_id` INT NOT NULL,
  `period` VARCHAR(100) DEFAULT NULL,
  `summary` TEXT NOT NULL,
  `strengths` TEXT DEFAULT NULL,
  `improvements` TEXT DEFAULT NULL,
  `score` DECIMAL(5,2) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `from_user` INT NOT NULL,
  `tutor_id` INT NOT NULL,
  `rating` TINYINT NOT NULL CHECK(`rating` BETWEEN 1 AND 5),
  `comment` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_session_fromuser` (`session_id`, `from_user`),
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`from_user`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. INVOICES & BILLING
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `enrollment_id` INT DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `due_date` DATE DEFAULT NULL,
  `status` ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `method` VARCHAR(50) DEFAULT NULL,
  `reference` VARCHAR(255) DEFAULT NULL,
  `paid_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. ANNOUNCEMENTS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT NOT NULL,
  `audience` ENUM('all', 'tutor', 'student') NOT NULL DEFAULT 'all',
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `body` TEXT DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. AUDIT LOG & OUTBOX (WhatsApp / Email Worker)
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(100) DEFAULT NULL,
  `entity_id` INT DEFAULT NULL,
  `meta` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `outbox` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `channel` ENUM('email', 'whatsapp') NOT NULL,
  `to_addr` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) DEFAULT NULL,
  `body` TEXT NOT NULL,
  `meta` TEXT DEFAULT NULL,
  `user_id` INT DEFAULT NULL,
  `status` ENUM('pending', 'sending', 'sent', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
  `attempts` INT NOT NULL DEFAULT 0,
  `error` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sent_at` DATETIME DEFAULT NULL,
  INDEX `ix_outbox_status` (`status`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. CHAPTERS, PROGRESS & WHITEBOARD
CREATE TABLE IF NOT EXISTS `chapters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `course_id` INT NOT NULL,
  `position` INT NOT NULL DEFAULT 0,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE,
  INDEX `ix_chap_course` (`course_id`, `position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chapter_progress` (
  `enrollment_id` INT NOT NULL,
  `chapter_id` INT NOT NULL,
  `status` ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
  `updated_by` INT DEFAULT NULL,
  `updated_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  PRIMARY KEY (`enrollment_id`, `chapter_id`),
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `whiteboard_ops` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `data` MEDIUMTEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `ix_wb` (`session_id`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `class_remarks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `tutor_id` INT NOT NULL,
  `remark` TEXT NOT NULL,
  `topics` VARCHAR(255) DEFAULT NULL,
  `understanding` INT DEFAULT NULL,
  `private` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  UNIQUE KEY `uq_remark_session_student` (`session_id`, `student_id`),
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. RESOURCES, ATTENDANCE & DOUBTS Q&A
CREATE TABLE IF NOT EXISTS `resources` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tutor_id` INT NOT NULL,
  `course_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `file_url` VARCHAR(500) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `status` ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'present',
  `marked_by` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_session_student_attendance` (`session_id`, `student_id`),
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`marked_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `doubts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `tutor_id` INT DEFAULT NULL,
  `enrollment_id` INT DEFAULT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT DEFAULT NULL,
  `status` ENUM('open', 'answered') NOT NULL DEFAULT 'open',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. QUIZZES
CREATE TABLE IF NOT EXISTS `quizzes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `course_id` INT DEFAULT NULL,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quiz_questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quiz_id` INT NOT NULL,
  `question` TEXT NOT NULL,
  `options` JSON NOT NULL, -- ["opt1", "opt2", "opt3", "opt4"]
  `correct_option_index` INT NOT NULL,
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quiz_assignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quiz_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `assigned_by` INT NOT NULL,
  `due_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_quiz_student` (`quiz_id`, `student_id`),
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `quiz_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quiz_id` INT NOT NULL,
  `student_id` INT NOT NULL,
  `score` DECIMAL(6,2) NOT NULL,
  `answers` LONGTEXT NULL, -- student's chosen option per question: {"<question_id>": <option_index>}
  `taken_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`quiz_id`) REFERENCES `quizzes`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ====================================================================
-- Initial Seed Data: Administrator & Standard Courses
-- ====================================================================

-- Core Initial Courses
INSERT INTO `courses` (`id`, `title`, `country`, `category`, `grade_band`, `description`, `price`, `currency`, `active`) VALUES
(1, 'Grade 8 Mathematics & Algebra', 'Australia', 'School Readiness', 'Years 7-9', 'Linear equations, coordinate geometry, fractions, and problem solving.', 160.00, 'USD', 1),
(2, 'NAPLAN Year 7 Numeracy & Literacy', 'Australia', 'Exam Prep', 'Year 7', 'Past paper drills, persuasive writing conventions, and speed numeracy.', 180.00, 'USD', 1),
(3, 'Digital SAT Math Masterclass', 'USA', 'Exam Prep', 'Grades 10-12', 'Desmos mastery, algebra speed tactics, and official adaptive test drills.', 220.00, 'USD', 1),
(4, 'CBSE Class 10 Board Sprint (Math & Science)', 'India', 'School Readiness', 'Class 10', 'Past 10-year question solving, NCERT concept clarity, and mock exams.', 9500.00, 'INR', 1),
(5, 'Vedic Maths Mental Speed Arithmetic', 'International', 'Skill Academy', 'Ages 8-16', '16 Vedic sutras, high-speed calculation shortcuts, and mental agility.', 140.00, 'USD', 1),
(6, 'Kids Coding & AI Python Lab', 'International', 'Skill Academy', 'Ages 9-16', 'Game development with Pygame, algorithms, and AI assistant mechanics.', 190.00, 'USD', 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 18. TOPICS COVERED (only the tutor adds; student, tutor and admin can see)
CREATE TABLE IF NOT EXISTS `topic_progress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enrollment_id` INT DEFAULT NULL,
  `session_id` INT DEFAULT NULL,
  `student_id` INT NOT NULL,
  `tutor_id` INT NOT NULL,
  `subject` VARCHAR(150) NOT NULL,
  `topic` VARCHAR(255) NOT NULL,
  `note` VARCHAR(500) DEFAULT NULL,
  `covered_on` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tutor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `ix_topic_student` (`student_id`, `covered_on`),
  INDEX `ix_topic_tutor` (`tutor_id`, `covered_on`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
