import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { generateVideoPlaybackToken, verifyVideoPlaybackToken } from '../utils/tokenSigner.js';
import { SessionService } from '../services/sessionService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEO_DIR = path.resolve(__dirname, '../../storage/videos');

/**
 * Generates an ephemeral HMAC signed token for playing a video
 */
export const getVideoPlaybackToken = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const sessionToken = req.user.sessionToken;

    // Fetch lesson and course access status
    const [lessonRows] = await pool.query(
      `SELECT l.id, l.course_id, l.title, l.is_preview, l.is_free, l.video_storage_key,
              c.is_published
       FROM lessons l
       JOIN courses c ON l.course_id = c.id
       WHERE l.id = ? LIMIT 1`,
      [lessonId]
    );

    if (lessonRows.length === 0) {
      return sendError(res, 'Lesson not found.', 404);
    }

    const lesson = lessonRows[0];

    // Check if user has permission
    let hasAccess = lesson.is_preview === 1 || lesson.is_free === 1;

    if (!hasAccess) {
      const [enrollment] = await pool.query(
        `SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = 'active' LIMIT 1`,
        [userId, lesson.course_id]
      );
      if (enrollment.length > 0) {
        hasAccess = true;
      }
    }

    // Admins always have access
    if (req.user.role === 'admin' || req.user.role === 'instructor') {
      hasAccess = true;
    }

    if (!hasAccess) {
      return sendError(res, 'Access denied. You must be enrolled in this course to watch this lesson.', 403, null, 'NOT_ENROLLED');
    }

    // Generate signed HMAC token (valid for 180 seconds to initiate stream)
    const playbackToken = generateVideoPlaybackToken(userId, lesson.id, sessionToken, 180);

    return sendSuccess(res, {
      playbackToken,
      lessonId: lesson.id,
      streamUrl: `/api/videos/stream/${lesson.id}?token=${playbackToken}`,
      watermark: {
        userEmail: req.user.email,
        userId: req.user.id,
        timestamp: new Date().toISOString()
      }
    }, 'Video playback authorized');
  } catch (error) {
    console.error('Get video playback token error:', error);
    return sendError(res, 'Could not authorize video playback.', 500);
  }
};

/**
 * Secure HTTP 206 Partial Content Video Streamer with Token Verification
 */
export const streamVideo = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(403).json({ error: 'Playback forbidden. Missing signed token.' });
    }

    // Verify token cryptographic signature
    const verified = verifyVideoPlaybackToken(token, lessonId);
    if (!verified) {
      return res.status(403).json({ error: 'Playback forbidden. Invalid or expired playback signature.' });
    }

    // Verify session validity
    const sessionStatus = await SessionService.validateSession(verified.userId, verified.sessionId);
    if (!sessionStatus.valid) {
      return res.status(401).json({ error: 'Session terminated. Active playback aborted.' });
    }

    // Fetch storage key
    const [rows] = await pool.query(
      `SELECT video_storage_key FROM lessons WHERE id = ? LIMIT 1`,
      [lessonId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Media not found.' });
    }

    let videoFile = rows[0].video_storage_key;
    let filePath = path.join(VIDEO_DIR, videoFile);

    // Fallback if specific file doesn't exist
    if (!fs.existsSync(filePath)) {
      filePath = path.join(VIDEO_DIR, 'sample_masterclass.mp4');
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video file asset unavailable on storage server.' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Secure headers: prevent browser caching of protected video chunks and disable direct download
    const securityHeaders = {
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff'
    };

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`
        }).end();
        return;
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        ...securityHeaders,
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Content-Length': chunkSize
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        ...securityHeaders,
        'Content-Length': fileSize
      });

      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Stream video error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Video streaming delivery error.' });
    }
  }
};
