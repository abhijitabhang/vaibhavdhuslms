import pool from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Check course exists and is published
    const [courses] = await pool.query(
      `SELECT id, title, price, is_published FROM courses WHERE id = ? LIMIT 1`,
      [courseId]
    );

    if (courses.length === 0 || !courses[0].is_published) {
      return sendError(res, 'Course not found or currently unavailable.', 404);
    }

    // Check if already enrolled
    const [existing] = await pool.query(
      `SELECT id, status FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1`,
      [userId, courseId]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'active') {
        return sendSuccess(res, { alreadyEnrolled: true }, 'You are already enrolled in this course.');
      } else {
        await pool.query(
          `UPDATE enrollments SET status = 'active', enrolled_at = NOW() WHERE id = ?`,
          [existing[0].id]
        );
        return sendSuccess(res, { reActivated: true }, 'Your enrollment has been re-activated!');
      }
    }

    // Insert new enrollment
    const [result] = await pool.query(
      `INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
       VALUES (?, ?, 'active', NOW())`,
      [userId, courseId]
    );

    return sendSuccess(res, {
      enrollmentId: result.insertId,
      courseId: parseInt(courseId, 10),
      courseTitle: courses[0].title
    }, 'Enrolled successfully! You can now start learning.', 201);
  } catch (error) {
    console.error('Enroll in course error:', error);
    return sendError(res, 'Failed to complete course enrollment.', 500);
  }
};
