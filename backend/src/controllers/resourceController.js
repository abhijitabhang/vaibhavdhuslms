import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESOURCE_DIR = path.resolve(__dirname, '../../storage/resources');

export const downloadResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user.id;
    const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';

    // Fetch resource metadata
    const [rows] = await pool.query(
      `SELECT r.*, c.title as course_title 
       FROM course_resources r
       JOIN courses c ON r.course_id = c.id
       WHERE r.id = ? LIMIT 1`,
      [resourceId]
    );

    if (rows.length === 0) {
      return sendError(res, 'Resource not found.', 404);
    }

    const resource = rows[0];

    // Check download permission:
    // If not free, user must have active enrollment (or be admin/instructor)
    if (resource.is_free !== 1 && req.user.role === 'student') {
      const [enrollment] = await pool.query(
        `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'active' LIMIT 1`,
        [userId, resource.course_id]
      );

      if (enrollment.length === 0) {
        return sendError(res, 'You must be enrolled in this course to access this premium resource.', 403, null, 'ENROLLMENT_REQUIRED');
      }
    }

    const filePath = path.join(RESOURCE_DIR, resource.file_path);
    if (!fs.existsSync(filePath)) {
      return sendError(res, 'The requested document file could not be located on the server.', 404);
    }

    // 1. Record download in audit log
    await pool.query(
      `INSERT INTO user_downloads (user_id, resource_id, course_id, ip_address, downloaded_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, resource.id, resource.course_id, clientIp]
    );

    // 2. Increment download counter
    await pool.query(
      `UPDATE course_resources SET download_count = download_count + 1 WHERE id = ?`,
      [resource.id]
    );

    // 3. Stream file safely
    res.setHeader('Content-Type', resource.file_type || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resource.file_name)}"`);
    res.setHeader('Content-Length', fs.statSync(filePath).size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download resource error:', error);
    if (!res.headersSent) {
      return sendError(res, 'Failed to process file download.', 500);
    }
  }
};

export const getCourseResources = async (req, res) => {
  try {
    const { courseId } = req.params;
    const [rows] = await pool.query(
      `SELECT r.id, r.course_id, r.lesson_id, r.title, r.description, r.file_name,
              r.file_size_bytes, r.file_type, r.is_free, r.download_count,
              l.title as lesson_title
       FROM course_resources r
       LEFT JOIN lessons l ON r.lesson_id = l.id
       WHERE r.course_id = ?
       ORDER BY r.created_at ASC`,
      [courseId]
    );

    return sendSuccess(res, rows, 'Course resources retrieved');
  } catch (error) {
    console.error('Get course resources error:', error);
    return sendError(res, 'Failed to retrieve course resources.', 500);
  }
};
