import crypto from 'crypto';
import pool from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const getCourseCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Check if user has completed all lessons
    const [totalLessonsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM lessons WHERE course_id = ?`,
      [courseId]
    );

    const [completedLessonsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM video_progress WHERE user_id = ? AND course_id = ? AND is_completed = 1`,
      [userId, courseId]
    );

    const total = totalLessonsRows[0]?.count || 0;
    const completed = completedLessonsRows[0]?.count || 0;

    if (total === 0 || completed < total) {
      return sendError(res, `You must complete all ${total} lessons in this course before your certificate can be issued. Currently completed: ${completed}/${total}`, 400);
    }

    // Check if certificate already generated
    const [existing] = await pool.query(
      `SELECT * FROM certificates WHERE user_id = ? AND course_id = ? LIMIT 1`,
      [userId, courseId]
    );

    if (existing.length > 0) {
      return sendSuccess(res, existing[0], 'Certificate retrieved');
    }

    // Fetch user and course details
    const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
    const [courseRows] = await pool.query('SELECT title FROM courses WHERE id = ?', [courseId]);

    const code = `VDLMS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const verificationUrl = `/verify-certificate/${code}`;

    const [insertResult] = await pool.query(
      `INSERT INTO certificates (certificate_code, user_id, course_id, student_name, course_title, completion_date, verification_url)
       VALUES (?, ?, ?, ?, ?, CURDATE(), ?)`,
      [code, userId, courseId, userRows[0].name, courseRows[0].title, verificationUrl]
    );

    const certificate = {
      id: insertResult.insertId,
      certificate_code: code,
      student_name: userRows[0].name,
      course_title: courseRows[0].title,
      completion_date: new Date().toISOString().split('T')[0],
      verification_url: verificationUrl
    };

    return sendSuccess(res, certificate, 'Certificate awarded successfully!', 201);
  } catch (error) {
    console.error('Get certificate error:', error);
    return sendError(res, 'Failed to process certificate.', 500);
  }
};

export const verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;
    const [rows] = await pool.query(
      `SELECT c.*, co.thumbnail_url 
       FROM certificates c
       JOIN courses co ON c.course_id = co.id
       WHERE c.certificate_code = ? LIMIT 1`,
      [code]
    );

    if (rows.length === 0) {
      return sendError(res, 'Invalid or unrecognized certificate verification code.', 404);
    }

    return sendSuccess(res, rows[0], 'Certificate verified');
  } catch (error) {
    console.error('Verify certificate error:', error);
    return sendError(res, 'Verification failed.', 500);
  }
};
