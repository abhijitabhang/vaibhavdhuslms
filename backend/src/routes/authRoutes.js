import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  getActiveSessions,
  revokeOtherSessions,
  changePassword,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.get('/sessions', authenticate, getActiveSessions);
router.post('/sessions/revoke-others', authenticate, revokeOtherSessions);
router.put('/change-password', authenticate, changePassword);

export default router;
