-- ============================================================================
-- Vaibhav Dhus LMS — Complete Enterprise Relational Schema (MySQL InnoDB)
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL DEFAULT 3,
  avatar_url VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  email_verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(128) NOT NULL UNIQUE,
  device_name VARCHAR(150) NULL,
  device_type VARCHAR(50) DEFAULT 'desktop',
  os VARCHAR(50) NULL,
  browser VARCHAR(80) NULL,
  ip_address VARCHAR(64) NULL,
  device_fingerprint VARCHAR(128) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  revoked_reason VARCHAR(100) NULL,
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_sessions_lookup (user_id, is_active, session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT 'book-open',
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  subtitle VARCHAR(350) NULL,
  description LONGTEXT NULL,
  category_id INT NULL,
  instructor_id INT NOT NULL,
  thumbnail_url VARCHAR(255) NULL,
  promo_video_url VARCHAR(255) NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_price DECIMAL(10,2) NULL,
  difficulty_level ENUM('Beginner', 'Intermediate', 'Advanced', 'All Levels') DEFAULT 'All Levels',
  language VARCHAR(50) DEFAULT 'English',
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  total_duration_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_courses_published (is_published, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_sections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_sections_order (course_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  section_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description LONGTEXT NULL,
  sort_order INT NOT NULL DEFAULT 1,
  duration_seconds INT NOT NULL DEFAULT 0,
  is_preview TINYINT(1) NOT NULL DEFAULT 0,
  is_free TINYINT(1) NOT NULL DEFAULT 0,
  video_type ENUM('local_protected', 'hls_stream', 'external_drm') DEFAULT 'local_protected',
  video_storage_key VARCHAR(255) NOT NULL,
  thumbnail_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
  INDEX idx_lessons_order (section_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS video_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  lesson_id INT NOT NULL,
  last_watched_second INT NOT NULL DEFAULT 0,
  highest_watched_second INT NOT NULL DEFAULT 0,
  watch_percentage INT NOT NULL DEFAULT 0,
  is_completed TINYINT(1) NOT NULL DEFAULT 0,
  completed_at TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_lesson_progress (user_id, lesson_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_user_course_progress (user_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  status ENUM('active', 'expired', 'revoked') DEFAULT 'active',
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  UNIQUE KEY uq_user_enrollment (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_enrollment_lookup (user_id, course_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS course_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  lesson_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description VARCHAR(350) NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  file_type VARCHAR(50) DEFAULT 'application/pdf',
  is_free TINYINT(1) NOT NULL DEFAULT 1,
  download_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_downloads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  resource_id INT NOT NULL,
  course_id INT NOT NULL,
  ip_address VARCHAR(64) NULL,
  downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES course_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  certificate_code VARCHAR(64) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  completion_date DATE NOT NULL,
  verification_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_cert_code (certificate_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  rating TINYINT NOT NULL DEFAULT 5,
  review_text TEXT NULL,
  is_approved TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'success', 'warning', 'security') DEFAULT 'info',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  link_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type ENUM('percentage', 'flat') DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2) DEFAULT 0.00,
  max_discount DECIMAL(10,2) NULL,
  valid_from TIMESTAMP NULL,
  valid_until TIMESTAMP NULL,
  usage_limit INT DEFAULT 100,
  times_used INT DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value LONGTEXT NOT NULL,
  group_name VARCHAR(50) DEFAULT 'general',
  description VARCHAR(255) NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NULL,
  entity_id VARCHAR(50) NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id, action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
