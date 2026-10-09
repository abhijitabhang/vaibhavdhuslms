import { Router } from 'express';
import { getCourseCertificate, verifyCertificate } from '../controllers/certificateController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/verify/:code', verifyCertificate);
router.get('/course/:courseId', authenticate, getCourseCertificate);

export default router;
