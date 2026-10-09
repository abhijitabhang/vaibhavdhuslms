import pool from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const getAllCourses = async (req, res) => {
  try {
    const { category, search, difficulty } = req.query;

    let query = `
      SELECT 
        c.id, c.title, c.slug, c.subtitle, c.thumbnail_url, c.price, c.discount_price,
        c.difficulty_level, c.language, c.total_duration_seconds, c.created_at,
        cat.name as category_name, cat.slug as category_slug,
        u.name as instructor_name,
        (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lesson_count,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count,
        (SELECT COALESCE(AVG(rating), 5.0) FROM reviews r WHERE r.course_id = c.id) as rating
      FROM courses c
      LEFT JOIN course_categories cat ON c.category_id = cat.id
      JOIN users u ON c.instructor_id = u.id
      WHERE c.is_published = 1
    `;

    const params = [];

    if (category) {
      query += ` AND cat.slug = ?`;
      params.push(category);
    }

    if (difficulty) {
      query += ` AND c.difficulty_level = ?`;
      params.push(difficulty);
    }

    if (search) {
      query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY c.created_at DESC`;

    const [courses] = await pool.query(query, params);
    return sendSuccess(res, courses, 'Courses retrieved successfully');
  } catch (error) {
    console.error('Get courses error:', error);
    return sendError(res, 'Failed to fetch course catalog.', 500);
  }
};

export const getCourseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id || null;

    const [courses] = await pool.query(
      `SELECT 
        c.*, 
        cat.name as category_name,
        u.name as instructor_name,
        u.avatar_url as instructor_avatar,
        (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') as student_count,
        (SELECT COALESCE(AVG(rating), 5.0) FROM reviews r WHERE r.course_id = c.id) as rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.course_id = c.id) as review_count
       FROM courses c
       LEFT JOIN course_categories cat ON c.category_id = cat.id
       JOIN users u ON c.instructor_id = u.id
       WHERE c.slug = ? AND c.is_published = 1 LIMIT 1`,
      [slug]
    );

    if (courses.length === 0) {
      return sendError(res, 'Course not found.', 404);
    }

    const course = courses[0];

    // Check if current user is enrolled
    let isEnrolled = false;
    if (userId) {
      const [enrollment] = await pool.query(
        `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'active' LIMIT 1`,
        [userId, course.id]
      );
      isEnrolled = enrollment.length > 0;
    }

    // Fetch Sections
    const [sections] = await pool.query(
      `SELECT id, title, description, sort_order 
       FROM course_sections 
       WHERE course_id = ? 
       ORDER BY sort_order ASC`,
      [course.id]
    );

    // Fetch Lessons
    const [lessons] = await pool.query(
      `SELECT id, section_id, title, slug, description, sort_order, duration_seconds, is_preview, is_free, thumbnail_url
       FROM lessons 
       WHERE course_id = ? 
       ORDER BY sort_order ASC`,
      [course.id]
    );

    // Fetch Resources
    const [resources] = await pool.query(
      `SELECT id, lesson_id, title, description, file_name, file_size_bytes, is_free, download_count
       FROM course_resources 
       WHERE course_id = ?`,
      [course.id]
    );

    // Fetch Reviews
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at, u.name as student_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.course_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC LIMIT 10`,
      [course.id]
    );

    // Fetch user progress if enrolled
    let progressMap = {};
    if (userId && isEnrolled) {
      const [progressRows] = await pool.query(
        `SELECT lesson_id, last_watched_second, watch_percentage, is_completed 
         FROM video_progress WHERE user_id = ? AND course_id = ?`,
        [userId, course.id]
      );
      progressRows.forEach(p => {
        progressMap[p.lesson_id] = p;
      });
    }

    // Combine sections with lessons
    const structuredSections = sections.map(section => {
      const sectionLessons = lessons
        .filter(l => l.section_id === section.id)
        .map(l => ({
          ...l,
          progress: progressMap[l.id] || null,
          resources: resources.filter(r => r.lesson_id === l.id),
          isAccessible: isEnrolled || l.is_preview === 1 || l.is_free === 1
        }));

      return {
        ...section,
        lessons: sectionLessons
      };
    });

    return sendSuccess(res, {
      ...course,
      isEnrolled,
      sections: structuredSections,
      courseResources: resources.filter(r => !r.lesson_id),
      reviews
    });
  } catch (error) {
    console.error('Get course by slug error:', error);
    return sendError(res, 'Failed to fetch course detail.', 500);
  }
};

export const getMyCourses = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT 
        c.id, c.title, c.slug, c.subtitle, c.thumbnail_url, c.total_duration_seconds,
        e.enrolled_at, e.completed_at,
        u.name as instructor_name,
        (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as total_lessons,
        (SELECT COUNT(*) FROM video_progress vp WHERE vp.course_id = c.id AND vp.user_id = ? AND vp.is_completed = 1) as completed_lessons,
        (
          SELECT l.title 
          FROM video_progress vp 
          JOIN lessons l ON vp.lesson_id = l.id 
          WHERE vp.course_id = c.id AND vp.user_id = ? 
          ORDER BY vp.updated_at DESC LIMIT 1
        ) as last_watched_lesson_title,
        (
          SELECT vp.last_watched_second 
          FROM video_progress vp 
          WHERE vp.course_id = c.id AND vp.user_id = ? 
          ORDER BY vp.updated_at DESC LIMIT 1
        ) as last_watched_second,
        (
          SELECT vp.lesson_id 
          FROM video_progress vp 
          WHERE vp.course_id = c.id AND vp.user_id = ? 
          ORDER BY vp.updated_at DESC LIMIT 1
        ) as last_watched_lesson_id
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON c.instructor_id = u.id
       WHERE e.user_id = ? AND e.status = 'active'
       ORDER BY e.enrolled_at DESC`,
      [userId, userId, userId, userId, userId]
    );

    const formatted = rows.map(item => {
      const total = item.total_lessons || 1;
      const completed = item.completed_lessons || 0;
      const progressPercent = Math.min(100, Math.round((completed / total) * 100));

      return {
        ...item,
        progressPercent
      };
    });

    return sendSuccess(res, formatted, 'Enrolled courses retrieved');
  } catch (error) {
    console.error('Get my courses error:', error);
    return sendError(res, 'Failed to fetch your courses.', 500);
  }
};
