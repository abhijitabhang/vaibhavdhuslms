import { Router } from 'express';
import { getAllCourses, getCourseBySlug } from '../controllers/courseController.js';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = Router();

// Optional user attachment for checking enrollment on course details
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_vaibhavdhus_lms_jwt_key_2026_xyz!');
      req.user = { id: decoded.userId, sessionToken: decoded.sessionToken };
    } catch (e) {
      // Ignored for public routes
    }
  }
  next();
};

router.get('/', getAllCourses);
router.get('/:slug', optionalAuth, getCourseBySlug);

export default router;
