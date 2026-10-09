import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAdminAnalytics,
  getAdminCourses,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  getAdminSections,
  createAdminSection,
  updateAdminSection,
  deleteAdminSection,
  createAdminLesson,
  updateAdminLesson,
  deleteAdminLesson,
  getCourseCurriculum,
  getAdminStudents,
  toggleStudentStatus,
  getAdminActiveSessions,
  revokeAdminSession,
  getAdminResources,
  createAdminResource,
  updateAdminResource,
  deleteAdminResource,
  getAvailableVideos
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resourceStorageDir = path.resolve(__dirname, '../../storage/resources');
if (!fs.existsSync(resourceStorageDir)) {
  fs.mkdirSync(resourceStorageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resourceStorageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, 'resource-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = Router();

// Protect all admin routes with authentication and role check
router.use(authenticate, authorize('admin'));

router.get('/analytics', getAdminAnalytics);

// Courses
router.get('/courses', getAdminCourses);
router.post('/courses', createAdminCourse);
router.put('/courses/:id', updateAdminCourse);
router.delete('/courses/:id', deleteAdminCourse);
router.get('/courses/:courseId/curriculum', getCourseCurriculum);
router.get('/courses/:courseId/sections', getAdminSections);

// Sections
router.post('/sections', createAdminSection);
router.put('/sections/:id', updateAdminSection);
router.delete('/sections/:id', deleteAdminSection);

// Lessons
router.post('/lessons', createAdminLesson);
router.put('/lessons/:id', updateAdminLesson);
router.delete('/lessons/:id', deleteAdminLesson);

// Resources / PDFs
router.get('/resources', getAdminResources);
router.post('/resources', upload.single('file'), createAdminResource);
router.put('/resources/:id', updateAdminResource);
router.delete('/resources/:id', deleteAdminResource);

// Video Assets
router.get('/videos', getAvailableVideos);

// Students & Sessions
router.get('/students', getAdminStudents);
router.put('/students/:id/status', toggleStudentStatus);
router.get('/sessions', getAdminActiveSessions);
router.post('/sessions/:id/revoke', revokeAdminSession);

export default router;
