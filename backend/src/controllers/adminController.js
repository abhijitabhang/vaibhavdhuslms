import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAdminAnalytics = async (req, res) => {
  try {
    // 1. Total Students
    const [totalStudentsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE role_id = 3`
    );

    // 2. Total Enrollments
    const [totalEnrollmentsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM enrollments WHERE status = 'active'`
    );

    // 3. Total Lessons & Total Video Duration
    const [lessonStatsRows] = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(duration_seconds), 0) as total_duration FROM lessons`
    );

    // 4. Total PDF Downloads
    const [downloadStatsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM user_downloads`
    );

    // 5. Active Sessions right now
    const [activeSessionsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM user_sessions WHERE is_active = 1`
    );

    // 6. Top Watched Lessons
    const [topLessons] = await pool.query(
      `SELECT l.id, l.title, c.title as course_title, COUNT(vp.id) as learners_count,
              COALESCE(AVG(vp.watch_percentage), 0) as avg_completion
       FROM lessons l
       JOIN courses c ON l.course_id = c.id
       LEFT JOIN video_progress vp ON l.id = vp.lesson_id
       GROUP BY l.id
       ORDER BY learners_count DESC, avg_completion DESC
       LIMIT 5`
    );

    // 7. Recent Registrations & Logins
    const [recentUsers] = await pool.query(
      `SELECT u.id, u.name, u.email, u.created_at, u.is_active,
              (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) as enrolled_count
       FROM users u
       WHERE u.role_id = 3
       ORDER BY u.created_at DESC LIMIT 5`
    );

    return sendSuccess(res, {
      totalStudents: totalStudentsRows[0].count,
      totalEnrollments: totalEnrollmentsRows[0].count,
      totalLessons: lessonStatsRows[0].count,
      totalVideoDurationMinutes: Math.round(lessonStatsRows[0].total_duration / 60),
      totalPdfDownloads: downloadStatsRows[0].count,
      activeSessionsCount: activeSessionsRows[0].count,
      topLessons,
      recentUsers
    }, 'Admin analytics summary');
  } catch (error) {
    console.error('Admin analytics error:', error);
    return sendError(res, 'Failed to fetch analytics.', 500);
  }
};

export const getAdminCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(
      `SELECT c.*, cat.name as category_name, u.name as instructor_name,
              (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as total_lessons,
              (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as total_students,
              (SELECT COUNT(*) FROM course_resources cr WHERE cr.course_id = c.id) as total_resources
       FROM courses c
       LEFT JOIN course_categories cat ON c.category_id = cat.id
       LEFT JOIN users u ON c.instructor_id = u.id
       ORDER BY c.created_at DESC`
    );

    return sendSuccess(res, courses, 'Admin courses retrieved');
  } catch (error) {
    console.error('Admin get courses error:', error);
    return sendError(res, 'Failed to fetch courses list.', 500);
  }
};

export const createAdminCourse = async (req, res) => {
  try {
    const { title, subtitle, description, category_id, price, discount_price, difficulty_level, thumbnail_url } = req.body;

    if (!title) {
      return sendError(res, 'Course title is required.', 400);
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);

    const [result] = await pool.query(
      `INSERT INTO courses (
        title, slug, subtitle, description, category_id, instructor_id,
        price, discount_price, difficulty_level, thumbnail_url, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        title,
        slug,
        subtitle || '',
        description || '',
        category_id || 1,
        req.user.id,
        price || 0,
        discount_price || null,
        difficulty_level || 'All Levels',
        thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80'
      ]
    );

    // Create an initial Section 1
    await pool.query(
      `INSERT INTO course_sections (course_id, title, sort_order) VALUES (?, 'Module 1: Introduction', 1)`,
      [result.insertId]
    );

    return sendSuccess(res, { courseId: result.insertId, slug }, 'Course created successfully', 201);
  } catch (error) {
    console.error('Create course error:', error);
    return sendError(res, 'Failed to create course.', 500);
  }
};

export const updateAdminCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, description, price, discount_price, difficulty_level, is_published, thumbnail_url } = req.body;

    await pool.query(
      `UPDATE courses SET
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        discount_price = ?,
        difficulty_level = COALESCE(?, difficulty_level),
        is_published = COALESCE(?, is_published),
        thumbnail_url = COALESCE(?, thumbnail_url),
        updated_at = NOW()
       WHERE id = ?`,
      [title, subtitle, description, price, discount_price, difficulty_level, is_published, thumbnail_url, id]
    );

    return sendSuccess(res, null, 'Course updated successfully');
  } catch (error) {
    console.error('Update course error:', error);
    return sendError(res, 'Failed to update course.', 500);
  }
};

export const deleteAdminCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    return sendSuccess(res, null, 'Course deleted successfully');
  } catch (error) {
    console.error('Delete course error:', error);
    return sendError(res, 'Failed to delete course.', 500);
  }
};

export const createAdminSection = async (req, res) => {
  try {
    const { course_id, title, description, sort_order } = req.body;
    if (!course_id || !title) {
      return sendError(res, 'Course ID and section title are required.', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO course_sections (course_id, title, description, sort_order)
       VALUES (?, ?, ?, ?)`,
      [course_id, title, description || '', sort_order || 1]
    );

    return sendSuccess(res, { sectionId: result.insertId }, 'Section created successfully', 201);
  } catch (error) {
    console.error('Create section error:', error);
    return sendError(res, 'Failed to create section.', 500);
  }
};

export const createAdminLesson = async (req, res) => {
  try {
    const { course_id, section_id, title, description, duration_seconds, is_preview, is_free, video_storage_key } = req.body;

    if (!course_id || !section_id || !title) {
      return sendError(res, 'Course ID, Section ID, and Lesson Title are required.', 400);
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-') + '-' + Date.now().toString().slice(-4);

    const [maxOrder] = await pool.query(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM lessons WHERE section_id = ?`,
      [section_id]
    );

    const [result] = await pool.query(
      `INSERT INTO lessons (
        course_id, section_id, title, slug, description, sort_order,
        duration_seconds, is_preview, is_free, video_storage_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        course_id,
        section_id,
        title,
        slug,
        description || '',
        maxOrder[0].next_order,
        duration_seconds || 600,
        is_preview ? 1 : 0,
        is_free ? 1 : 0,
        video_storage_key || 'sample_masterclass.mp4'
      ]
    );

    return sendSuccess(res, { lessonId: result.insertId }, 'Lesson created successfully', 201);
  } catch (error) {
    console.error('Create lesson error:', error);
    return sendError(res, 'Failed to create lesson.', 500);
  }
};

export const getAdminStudents = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at,
             (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id AND e.status = 'active') as active_enrollments,
             (SELECT COUNT(*) FROM user_sessions s WHERE s.user_id = u.id AND s.is_active = 1) as active_sessions_count
      FROM users u
      WHERE u.role_id = 3
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC`;

    const [students] = await pool.query(query, params);
    return sendSuccess(res, students, 'Students retrieved');
  } catch (error) {
    console.error('Get students error:', error);
    return sendError(res, 'Failed to fetch students.', 500);
  }
};

export const toggleStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);

    // If deactivated, revoke all active sessions immediately
    if (!is_active) {
      await pool.query('UPDATE user_sessions SET is_active = 0, revoked_reason = "Account suspended" WHERE user_id = ?', [id]);
    }

    return sendSuccess(res, null, `Student status updated to ${is_active ? 'Active' : 'Suspended'}`);
  } catch (error) {
    console.error('Toggle status error:', error);
    return sendError(res, 'Failed to update student status.', 500);
  }
};

export const getAdminActiveSessions = async (req, res) => {
  try {
    const [sessions] = await pool.query(
      `SELECT s.id, s.user_id, s.session_token, s.device_name, s.device_type, s.os, s.browser,
              s.ip_address, s.is_active, s.revoked_reason, s.last_active_at, s.created_at,
              u.name as user_name, u.email as user_email
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.is_active = 1
       ORDER BY s.last_active_at DESC
       LIMIT 100`
    );

    return sendSuccess(res, sessions, 'Active sessions list');
  } catch (error) {
    console.error('Get sessions error:', error);
    return sendError(res, 'Failed to fetch sessions.', 500);
  }
};

export const revokeAdminSession = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE user_sessions SET is_active = 0, revoked_reason = 'Terminated by Platform Administrator' WHERE id = ?`,
      [id]
    );

    return sendSuccess(res, null, 'Session revoked. User will be logged out on next request.');
  } catch (error) {
    console.error('Revoke session error:', error);
    return sendError(res, 'Failed to revoke session.', 500);
  }
};

export const getAdminSections = async (req, res) => {
  try {
    const { courseId } = req.params;
    const [sections] = await pool.query(
      `SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order ASC, id ASC`,
      [courseId]
    );
    return sendSuccess(res, sections, 'Sections retrieved');
  } catch (error) {
    console.error('Get sections error:', error);
    return sendError(res, 'Failed to fetch sections.', 500);
  }
};

export const updateAdminSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, sort_order } = req.body;
    await pool.query(
      `UPDATE course_sections SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         sort_order = COALESCE(?, sort_order),
         updated_at = NOW()
       WHERE id = ?`,
      [title, description, sort_order, id]
    );
    return sendSuccess(res, null, 'Section updated successfully');
  } catch (error) {
    console.error('Update section error:', error);
    return sendError(res, 'Failed to update section.', 500);
  }
};

export const deleteAdminSection = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM course_sections WHERE id = ?', [id]);
    return sendSuccess(res, null, 'Section deleted successfully');
  } catch (error) {
    console.error('Delete section error:', error);
    return sendError(res, 'Failed to delete section.', 500);
  }
};

export const updateAdminLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, duration_seconds, is_preview, is_free, video_storage_key, sort_order, section_id } = req.body;
    await pool.query(
      `UPDATE lessons SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         duration_seconds = COALESCE(?, duration_seconds),
         is_preview = CASE WHEN ? IS NOT NULL THEN ? ELSE is_preview END,
         is_free = CASE WHEN ? IS NOT NULL THEN ? ELSE is_free END,
         video_storage_key = COALESCE(?, video_storage_key),
         sort_order = COALESCE(?, sort_order),
         section_id = COALESCE(?, section_id),
         updated_at = NOW()
       WHERE id = ?`,
      [
        title,
        description,
        duration_seconds,
        is_preview !== undefined ? (is_preview ? 1 : 0) : null,
        is_preview !== undefined ? (is_preview ? 1 : 0) : null,
        is_free !== undefined ? (is_free ? 1 : 0) : null,
        is_free !== undefined ? (is_free ? 1 : 0) : null,
        video_storage_key,
        sort_order,
        section_id,
        id
      ]
    );
    return sendSuccess(res, null, 'Lesson updated successfully');
  } catch (error) {
    console.error('Update lesson error:', error);
    return sendError(res, 'Failed to update lesson.', 500);
  }
};

export const deleteAdminLesson = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM lessons WHERE id = ?', [id]);
    return sendSuccess(res, null, 'Lesson deleted successfully');
  } catch (error) {
    console.error('Delete lesson error:', error);
    return sendError(res, 'Failed to delete lesson.', 500);
  }
};

export const getCourseCurriculum = async (req, res) => {
  try {
    const { courseId } = req.params;
    const [sections] = await pool.query(
      `SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order ASC, id ASC`,
      [courseId]
    );
    const [lessons] = await pool.query(
      `SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order ASC, id ASC`,
      [courseId]
    );
    const sectionsWithLessons = sections.map(sec => ({
      ...sec,
      lessons: lessons.filter(l => l.section_id === sec.id)
    }));
    return sendSuccess(res, sectionsWithLessons, 'Curriculum retrieved');
  } catch (error) {
    console.error('Get curriculum error:', error);
    return sendError(res, 'Failed to fetch course curriculum.', 500);
  }
};

export const getAdminResources = async (req, res) => {
  try {
    const [resources] = await pool.query(
      `SELECT r.*, c.title as course_title, l.title as lesson_title
       FROM course_resources r
       JOIN courses c ON r.course_id = c.id
       LEFT JOIN lessons l ON r.lesson_id = l.id
       ORDER BY r.created_at DESC`
    );
    return sendSuccess(res, resources, 'Admin resources retrieved');
  } catch (error) {
    console.error('Get admin resources error:', error);
    return sendError(res, 'Failed to fetch resources.', 500);
  }
};

export const createAdminResource = async (req, res) => {
  try {
    const { course_id, lesson_id, title, description, is_free, file_name, file_path, file_size_bytes } = req.body;
    if (!course_id || !title) {
      return sendError(res, 'Course ID and Resource title are required.', 400);
    }
    let finalFileName = file_name;
    let finalFilePath = file_path;
    let finalSizeBytes = file_size_bytes || 0;

    if (req.file) {
      finalFileName = req.file.originalname;
      finalFilePath = req.file.filename;
      finalSizeBytes = req.file.size;
    }

    if (!finalFilePath) {
      finalFilePath = 'architecture_blueprint.pdf';
      finalFileName = finalFileName || 'Resource-Document.pdf';
      finalSizeBytes = 876;
    }

    const [result] = await pool.query(
      `INSERT INTO course_resources (course_id, lesson_id, title, description, file_name, file_path, file_size_bytes, file_type, is_free)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'application/pdf', ?)`,
      [
        course_id,
        lesson_id || null,
        title,
        description || '',
        finalFileName,
        finalFilePath,
        finalSizeBytes,
        is_free ? 1 : 0
      ]
    );
    return sendSuccess(res, { resourceId: result.insertId }, 'Resource created successfully', 201);
  } catch (error) {
    console.error('Create resource error:', error);
    return sendError(res, 'Failed to create resource.', 500);
  }
};

export const updateAdminResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_free, course_id, lesson_id } = req.body;
    await pool.query(
      `UPDATE course_resources SET
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         is_free = CASE WHEN ? IS NOT NULL THEN ? ELSE is_free END,
         course_id = COALESCE(?, course_id),
         lesson_id = ?
       WHERE id = ?`,
      [
        title,
        description,
        is_free !== undefined ? (is_free ? 1 : 0) : null,
        is_free !== undefined ? (is_free ? 1 : 0) : null,
        course_id,
        lesson_id || null,
        id
      ]
    );
    return sendSuccess(res, null, 'Resource updated successfully');
  } catch (error) {
    console.error('Update resource error:', error);
    return sendError(res, 'Failed to update resource.', 500);
  }
};

export const deleteAdminResource = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM course_resources WHERE id = ?', [id]);
    return sendSuccess(res, null, 'Resource deleted successfully');
  } catch (error) {
    console.error('Delete resource error:', error);
    return sendError(res, 'Failed to delete resource.', 500);
  }
};

export const getAvailableVideos = async (req, res) => {
  try {
    const videoDir = path.resolve(__dirname, '../../storage/videos');
    if (!fs.existsSync(videoDir)) {
      return sendSuccess(res, []);
    }
    const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
    const videoList = files.map(filename => {
      const stat = fs.statSync(path.join(videoDir, filename));
      return {
        filename,
        sizeBytes: stat.size,
        sizeFormatted: (stat.size / (1024 * 1024)).toFixed(1) + ' MB'
      };
    });
    return sendSuccess(res, videoList, 'Available video assets');
  } catch (error) {
    console.error('Get available videos error:', error);
    return sendError(res, 'Failed to read video assets.', 500);
  }
};
