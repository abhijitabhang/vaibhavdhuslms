import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

async function seedDatabase() {
  console.log('🌱 Starting comprehensive database seeding...');
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Roles
    await conn.query(`
      INSERT INTO roles (id, name, display_name, description) VALUES
      (1, 'admin', 'Platform Administrator', 'Full access to all platform controls and settings'),
      (2, 'instructor', 'Course Instructor', 'Can create and manage own courses and lessons'),
      (3, 'student', 'Student / Learner', 'Can enroll, stream protected lessons and download resources')
      ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);
    `);

    // 2. Users (Admin, Instructor, Student)
    const adminPass = await bcrypt.hash('Admin@12345', 10);
    const instructorPass = await bcrypt.hash('Instructor@12345', 10);
    const studentPass = await bcrypt.hash('Student@12345', 10);

    const [adminResult] = await conn.query(`
      INSERT INTO users (id, name, email, password_hash, role_id, phone, is_active) VALUES
      (1, 'Vaibhav Dhus (Admin)', 'admin@vaibhavdhuslms.com', ?, 1, '+91 9876543210', 1),
      (2, 'Dr. Sarah Mitchell', 'instructor@vaibhavdhuslms.com', ?, 2, '+91 9876543211', 1),
      (3, 'Abhijit Abhang', 'student@vaibhavdhuslms.com', ?, 3, '+91 9876543212', 1)
      ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), name=VALUES(name);
    `, [adminPass, instructorPass, studentPass]);

    // 3. Categories
    await conn.query(`
      INSERT INTO course_categories (id, name, slug, icon, description, is_active) VALUES
      (1, 'Full-Stack Architecture', 'full-stack-architecture', 'layers', 'Modern enterprise application architecture and system design.', 1),
      (2, 'Backend & Database Systems', 'backend-databases', 'database', 'High-throughput Node.js APIs, indexing, and transactional engines.', 1),
      (3, 'Frontend & User Experience', 'frontend-ux', 'layout', 'Responsive React component systems, design tokens, and fluid interactions.', 1)
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `);

    // 4. Flagship Masterclass Course
    await conn.query(`
      INSERT INTO courses (
        id, title, slug, subtitle, description, category_id, instructor_id,
        thumbnail_url, promo_video_url, price, discount_price, difficulty_level,
        language, is_published, total_duration_seconds
      ) VALUES (
        1,
        'Enterprise Full-Stack Architecture: Node.js, React & Scalable Systems',
        'enterprise-full-stack-mastery',
        'Build, secure, and scale modern web applications with bulletproof video protection, high-performance MySQL, and modular React architecture.',
        'Welcome to the premier masterclass on building enterprise-grade learning management systems and full-stack software products. In this comprehensive course, you will engineer a production-ready application from bare metal to cloud deployment.\n\nKey pillars covered:\n• Decoupled modular architecture with Express and React\n• Industrial-strength video protection, signed ephemeral tokens, and canvas watermarking\n• High-concurrency MySQL indexing, query optimization, and transaction boundaries\n• Dynamic token-based theme engine supporting seamless dark/light modes\n• Device fingerprinting and concurrent session control to mitigate account sharing\n• Production deployment readiness, rate limiting, and defensive security middleware.',
        1,
        2,
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
        'lesson_1.mp4',
        4999.00,
        2499.00,
        'All Levels',
        'English',
        1,
        18400
      ) ON DUPLICATE KEY UPDATE title=VALUES(title), price=VALUES(price), discount_price=VALUES(discount_price);
    `);

    // 5. Course Sections (4 Modules)
    await conn.query(`
      INSERT INTO course_sections (id, course_id, title, description, sort_order) VALUES
      (1, 1, 'Module 1: Architecture Foundations & Environment Design', 'Core architectural blueprints, decouple patterns, and configuration hardening.', 1),
      (2, 1, 'Module 2: High Performance Node.js Backend & MySQL Mastery', 'Database pooling, relational indexing, and resilient REST API pipelines.', 2),
      (3, 1, 'Module 3: Premium React Frontend & State Architecture', 'Design systems, token hierarchies, and dynamic client security implementations.', 3),
      (4, 1, 'Module 4: Production Deployment, Monitoring & Scaling', 'Containerization, DDoS defense, reverse proxies, and live operations.', 4)
      ON DUPLICATE KEY UPDATE title=VALUES(title);
    `);

    // 6. Complete 12 Lessons (3 lessons per module)
    const lessonsData = [
      // Module 1
      [1, 1, 1, '01. Architectural Patterns & Decoupled LMS Systems', 'lesson-01-architectural-patterns', 'Deep dive into micro-modular architecture, decoupled React frontends, and REST API contracts.', 1, 1260, 1, 1, 'local_protected', 'lesson_1.mp4'],
      [2, 1, 1, '02. Repository Structure & Scalability Fundamentals', 'lesson-02-repo-scalability', 'Organizing backend and frontend services for clean separation of concerns and maintainability.', 2, 1420, 0, 0, 'local_protected', 'lesson_2.mp4'],
      [3, 1, 1, '03. Environment Hardening & Secret Management', 'lesson-03-environment-hardening', 'Secure configuration lifecycles, runtime secret injection, and defensive env loading.', 3, 1180, 0, 0, 'local_protected', 'lesson_3.mp4'],

      // Module 2
      [4, 1, 2, '04. MySQL Connection Pooling, Transactions & Index Optimization', 'lesson-04-mysql-pooling-indexing', 'Optimizing relational schemas, B-tree indexes, foreign key cascades, and connection pool sizing.', 1, 1680, 0, 0, 'local_protected', 'lesson_4.mp4'],
      [5, 1, 2, '05. Secure Token Auth & Multi-Device Session Invalidation', 'lesson-05-auth-session-invalidation', 'Building JWT auth, device fingerprint tracking, and remote session revocation engines.', 2, 1540, 0, 0, 'local_protected', 'lesson_5.mp4'],
      [6, 1, 2, '06. Streaming Architecture, Range Requests & Ephemeral HMAC Tokens', 'lesson-06-streaming-range-tokens', 'Engineering HTTP 206 chunked video streaming with HMAC-SHA256 expiring token verification.', 3, 1890, 0, 0, 'local_protected', 'lesson_6.mp4'],

      // Module 3
      [7, 1, 3, '07. Design Tokens, Fluid Typography & Dark Mode Engine', 'lesson-07-design-tokens-dark-mode', 'Building a scalable CSS variable token system dynamically driven by admin settings.', 1, 1390, 0, 0, 'local_protected', 'lesson_7.mp4'],
      [8, 1, 3, '08. Resilient API State, Optimistic UI & Error Boundaries', 'lesson-08-resilient-api-state', 'Handling loading states, network failures, cache revalidation, and graceful UI degradation.', 2, 1450, 0, 0, 'local_protected', 'lesson_8.mp4'],
      [9, 1, 3, '09. Canvas Watermarking & Video Download Prevention Techniques', 'lesson-09-canvas-watermark-anti-download', 'Implementing dynamic forensic watermarks, disabling context menus, and player defense overlays.', 3, 1720, 0, 0, 'local_protected', 'lesson_9.mp4'],

      // Module 4
      [10, 1, 4, '10. Containerization, Health Checks & Reverse Proxy Setup', 'lesson-10-docker-reverse-proxy', 'Setting up Nginx reverse proxy headers, CORS whitelisting, and automated health checks.', 1, 1510, 0, 0, 'local_protected', 'lesson_10.mp4'],
      [11, 1, 4, '11. Rate Limiting, DDoS Mitigation & Security Headers', 'lesson-11-rate-limiting-headers', 'Defending endpoints with Helmet, rate limiters, HPP, and parameter sanitization.', 2, 1340, 0, 0, 'local_protected', 'lesson_11.mp4'],
      [12, 1, 4, '12. Production Checklist, Zero-Downtime Migration & Capstone', 'lesson-12-production-checklist-capstone', 'Final production audit, migration rollback testing, and capstone deployment review.', 3, 2010, 0, 0, 'local_protected', 'lesson_12.mp4']
    ];

    for (const l of lessonsData) {
      await conn.query(`
        INSERT INTO lessons (
          id, course_id, section_id, title, slug, description, sort_order,
          duration_seconds, is_preview, is_free, video_type, video_storage_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title=VALUES(title), sort_order=VALUES(sort_order), is_preview=VALUES(is_preview), is_free=VALUES(is_free);
      `, l);
    }

    // 7. Course Resources / PDFs
    const resourcesData = [
      [1, 1, 1, 'Architecture Blueprint & Decoupled LMS Systems', 'High-level system design, data flow diagrams, and component interactions.', 'architecture_blueprint.pdf', 'architecture_blueprint.pdf', 84520, 'application/pdf', 1],
      [2, 1, 4, 'MySQL Indexing and Query Optimization Master Guide', 'Production guide on composite indexes, EXPLAIN analysis, and pool tuning.', 'mysql_indexing_guide.pdf', 'mysql_indexing_guide.pdf', 92140, 'application/pdf', 1],
      [3, 1, 5, 'Enterprise Security, Ephemeral Tokens & JWT Lifecycle Notes', 'Comprehensive reference on token rotation, session validation, and device tracking.', 'jwt_security_notes.pdf', 'jwt_security_notes.pdf', 78910, 'application/pdf', 1],
      [4, 1, 7, 'React Design Token System & Dynamic Theme Reference', 'CSS custom properties dictionary and admin token mapping rules.', 'react_design_tokens.pdf', 'react_design_tokens.pdf', 64300, 'application/pdf', 1],
      [5, 1, 12, 'Complete LMS Production Launch & Scaling Checklist', 'Defensive checklist covering security headers, SSL certificates, and backup cron jobs.', 'lms_production_checklist.pdf', 'lms_production_checklist.pdf', 105400, 'application/pdf', 0]
    ];

    for (const r of resourcesData) {
      await conn.query(`
        INSERT INTO course_resources (
          id, course_id, lesson_id, title, description, file_name, file_path, file_size_bytes, file_type, is_free
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title=VALUES(title), is_free=VALUES(is_free);
      `, r);
    }

    // 8. Enroll student in the course
    await conn.query(`
      INSERT INTO enrollments (id, user_id, course_id, status, enrolled_at)
      VALUES (1, 3, 1, 'active', NOW())
      ON DUPLICATE KEY UPDATE status='active';
    `);

    // 9. Initial Progress for student on Lesson 1 & 2
    await conn.query(`
      INSERT INTO video_progress (user_id, course_id, lesson_id, last_watched_second, highest_watched_second, watch_percentage, is_completed, completed_at)
      VALUES 
      (3, 1, 1, 1260, 1260, 100, 1, NOW()),
      (3, 1, 2, 420, 420, 30, 0, NULL)
      ON DUPLICATE KEY UPDATE last_watched_second=VALUES(last_watched_second), watch_percentage=VALUES(watch_percentage);
    `);

    // 10. Reviews
    await conn.query(`
      INSERT INTO reviews (id, user_id, course_id, rating, review_text, is_approved) VALUES
      (1, 3, 1, 5, 'Outstanding architecture course! The video security pipeline and session invalidation patterns are genuinely production-grade.', 1)
      ON DUPLICATE KEY UPDATE rating=VALUES(rating);
    `);

    // 11. Platform Settings & Theme Design Tokens
    const defaultSettings = [
      ['platform_name', 'Vaibhav Dhus LMS', 'branding', 'Platform display name', 1],
      ['platform_tagline', 'Modern, Secure & Scalable Learning Ecosystem', 'branding', 'Platform hero tagline', 1],
      ['theme_mode', 'dark', 'theme', 'Default theme mode (light or dark)', 1],
      ['primary_color', '#6366f1', 'theme', 'Primary brand color hex', 1],
      ['secondary_color', '#06b6d4', 'theme', 'Secondary accent color hex', 1],
      ['accent_color', '#10b981', 'theme', 'Success/Accent color hex', 1],
      ['bg_base', '#090d16', 'theme', 'Base dark background', 1],
      ['bg_surface', '#131b2e', 'theme', 'Surface container background', 1],
      ['bg_elevated', '#1e2942', 'theme', 'Elevated card background', 1],
      ['text_primary', '#f8fafc', 'theme', 'Primary text color', 1],
      ['text_secondary', '#94a3b8', 'theme', 'Secondary text color', 1],
      ['border_color', '#24324f', 'theme', 'Border color token', 1],
      ['max_concurrent_sessions', '1', 'security', 'Maximum simultaneous active devices per user', 1],
      ['enforce_single_device', 'true', 'security', 'Force logout of previous devices on new login', 1],
      ['watermark_enabled', 'true', 'security', 'Overlay dynamic forensic watermark on video player', 1],
      ['watermark_interval_seconds', '12', 'security', 'Watermark position rotation interval in seconds', 1],
      ['watermark_opacity', '0.22', 'security', 'Watermark opacity level (0.1 to 0.5)', 1],
      ['anti_download_protection', 'true', 'security', 'Prevent context menu, native download and inspect controls', 1]
    ];

    for (const [key, value, group, desc, isPublic] of defaultSettings) {
      await conn.query(`
        INSERT INTO platform_settings (setting_key, setting_value, group_name, description, is_public)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value), group_name=VALUES(group_name);
      `, [key, value, group, desc, isPublic]);
    }

    await conn.commit();
    console.log('✅ Database seeded successfully with 12-lesson flagship course, users, settings, and resources!');
    process.exit(0);
  } catch (error) {
    await conn.rollback();
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    conn.release();
  }
}

seedDatabase();
