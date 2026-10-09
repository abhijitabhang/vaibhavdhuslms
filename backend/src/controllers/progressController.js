import pool from '../config/db.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

export const updateProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { currentTime, duration, isCompleted } = req.body;
    const userId = req.user.id;

    // Fetch lesson and course id
    const [lessonRows] = await pool.query(
      `SELECT id, course_id, duration_seconds FROM lessons WHERE id = ? LIMIT 1`,
      [lessonId]
    );

    if (lessonRows.length === 0) {
      return sendError(res, 'Lesson not found.', 404);
    }

    const lesson = lessonRows[0];
    const totalDuration = duration || lesson.duration_seconds || 1;
    const currentSec = Math.floor(currentTime || 0);
    const watchPct = Math.min(100, Math.round((currentSec / totalDuration) * 100));
    const completedFlag = isCompleted || watchPct >= 90 ? 1 : 0;

    // Upsert into video_progress
    await pool.query(
      `INSERT INTO video_progress (
        user_id, course_id, lesson_id, last_watched_second, highest_watched_second,
        watch_percentage, is_completed, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, IF(? = 1, NOW(), NULL))
      ON DUPLICATE KEY UPDATE
        last_watched_second = VALUES(last_watched_second),
        highest_watched_second = GREATEST(highest_watched_second, VALUES(last_watched_second)),
        watch_percentage = GREATEST(watch_percentage, VALUES(watch_percentage)),
        is_completed = IF(is_completed = 1, 1, VALUES(is_completed)),
        completed_at = IF(is_completed = 1, completed_at, IF(VALUES(is_completed) = 1, NOW(), NULL)),
        updated_at = NOW()`,
      [userId, lesson.course_id, lesson.id, currentSec, currentSec, watchPct, completedFlag, completedFlag]
    );

    // Check if entire course is completed
    const [totalLessonsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM lessons WHERE course_id = ?`,
      [lesson.course_id]
    );
    const [completedLessonsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM video_progress WHERE user_id = ? AND course_id = ? AND is_completed = 1`,
      [userId, lesson.course_id]
    );

    const isCourseFinished = completedLessonsRows[0].count >= totalLessonsRows[0].count;
    if (isCourseFinished) {
      await pool.query(
        `UPDATE enrollments SET completed_at = NOW() WHERE user_id = ? AND course_id = ? AND completed_at IS NULL`,
        [userId, lesson.course_id]
      );
    }

    return sendSuccess(res, {
      lessonId: lesson.id,
      courseId: lesson.course_id,
      currentSecond: currentSec,
      watchPercentage: watchPct,
      isCompleted: completedFlag === 1,
      isCourseFinished
    }, 'Progress saved');
  } catch (error) {
    console.error('Update progress error:', error);
    return sendError(res, 'Failed to save progress.', 500);
  }
};

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const [progressRows] = await pool.query(
      `SELECT lesson_id, last_watched_second, highest_watched_second, watch_percentage, is_completed, updated_at
       FROM video_progress 
       WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );

    const [totalLessonsRows] = await pool.query(
      `SELECT COUNT(*) as count FROM lessons WHERE course_id = ?`,
      [courseId]
    );

    const totalLessons = totalLessonsRows[0]?.count || 0;
    const completedCount = progressRows.filter(p => p.is_completed).length;
    const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Find last accessed lesson
    const sorted = [...progressRows].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    const lastAccessed = sorted[0] || null;

    return sendSuccess(res, {
      courseId: parseInt(courseId, 10),
      totalLessons,
      completedCount,
      percentage,
      lastAccessedLessonId: lastAccessed ? lastAccessed.lesson_id : null,
      lastWatchedSecond: lastAccessed ? lastAccessed.last_watched_second : 0,
      lessonsProgress: progressRows
    }, 'Course progress retrieved');
  } catch (error) {
    console.error('Get course progress error:', error);
    return sendError(res, 'Failed to retrieve progress.', 500);
  }
};
