import { Router } from 'express';
import { getVideoPlaybackToken, streamVideo } from '../controllers/videoController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Endpoint to generate signed playback token (Auth required)
router.get('/token/:lessonId', authenticate, getVideoPlaybackToken);

// Protected streaming endpoint (Verifies signed token query)
router.get('/stream/:lessonId', streamVideo);

export default router;
