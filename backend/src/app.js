import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
app.use(
  cors({
    origin: true, // Allow frontend dev server and production clients
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Requested-With']
  })
);

// Logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // generous max requests per window for active course video seeks
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after a few minutes.'
  }
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads (thumbnails, avatar images)
app.use('/uploads', express.static(path.resolve(__dirname, '../storage/uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'Vaibhav Dhus LMS Backend Engine'
  });
});

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// 404 Route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server.`
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
