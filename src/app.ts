import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import paymentRoutes from './routes/payment.routes';
import reservationRoutes from './routes/reservation.routes';
import authRoutes from './routes/auth.routes';
import optionsRoutes from './routes/options.routes';
import adminRoutes from './routes/admin.routes';
import home from './routes/home.routes';
import serviceRoutes from './routes/service.routes';
import apartmentRoutes from './routes/apartment.routes';
import apartmentDetailRoutes from './routes/apartmentDetail.routes';
import roomDetailRoutes from './routes/roomDetail.routes';
import contactRoutes from './routes/contact.routes';
import footerRoutes from './routes/footer.routes';
import cmsRoutes from './routes/cms.routes';
import reviewRoutes from './routes/review.routes';
import analyticsRoutes from './routes/analytics.routes';
import searchRoutes from './routes/search.routes';
import { errorHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import path from 'path';

import contactMessageRoutes from './routes/contactMessageRoutes';
import ContactMessage from './models/ContactMessage';

dotenv.config();

// Initialize Sentry
const initSentry = () => {
  const sentryDsn = process.env.SENTRY_DSN;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!sentryDsn) {
    logger.info('Sentry DSN not provided. Error tracking disabled.');
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      maxBreadcrumbs: 50,
      attachStacktrace: true,
      release: process.env.APP_VERSION || '1.0.0',
      beforeSend(event, hint) {
        if (event.request?.url?.includes('/health')) {
          return null;
        }
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      },
      denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
      ],
    });

    logger.info('✅ Sentry initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
  }
};

initSentry();

export const createApp = () => {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  // Security middleware
  app.use(helmet({
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: false, // Configure based on your needs
  }));

  // Sentry Error Boundary - Only if initialized
  if (process.env.SENTRY_DSN) {
    app.use((req, res, next) => {
      Sentry.captureMessage(`${req.method} ${req.path}`, 'debug');
      next();
    });
  }

  // Trust proxy for production (needed for load balancers, reverse proxies)
  if (isProduction) {
    app.set('trust proxy', 1);
  }

// CORS configuration (MUST be before rate limiter)
const defaultOrigins = isProduction 
  ? [] 
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'];

const envOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) : [];
const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

logger.info(`✅ CORS allowed origins: ${allowedOrigins.join(', ')}`);

// CORS patterns for Vercel and other frontend domains
const vercelPatterns = [
  // Production
  /^https:\/\/air-frontend-neon\.vercel\.app$/,
  // Preview URLs de Vercel (any project name with any preview hash)
  /^https:\/\/air-frontend-[a-z0-9]+-nicolasromaninas-projects\.vercel\.app$/,
  /^https:\/\/airbnb-[a-z0-9]+-nicolasromaninas-projects\.vercel\.app$/,
  // Lovable app (any preview)
  /^https:\/\/id-preview-[a-z0-9-]+\.lovable\.app$/,
  // Catch-all for any vercel.app subdomain under your account (safer for development)
  /^https:\/\/.*-nicolasromaninas-projects\.vercel\.app$/,
  // Localhost for development
  /^http:\/\/localhost(:[0-9]+)?$/,
];

app.use(cors({
  origin: (origin, callback) => {
    // Permettre les requêtes sans origine (comme curl, postman)
    if (!origin) {
      return callback(null, true);
    }

    // Vérifier les URLs exactes
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Vérifier les patterns regex
    const isAllowedByPattern = vercelPatterns.some(pattern => pattern.test(origin));
    if (isAllowedByPattern) {
      return callback(null, true);
    }

    logger.warn(`⚠️  CORS request blocked from origin: ${origin}`);
    return callback(new Error('CORS not allowed from this origin'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-info'],
  maxAge: 86400, // 24 hours
}));

  // Rate limiting (AFTER CORS so preflight requests can pass through)
  const limiter = rateLimit({
    windowMs: isProduction ? 15 * 60 * 1000 : 15 * 60 * 1000,
    max: isProduction ? 100 : 500,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks and preflight requests
      return req.path === '/health' || req.method === 'OPTIONS';
    },
  });
  app.use('/api/', limiter);

  // Increase body size limits to allow larger page payloads (e.g., base64 images)
  app.use(express.json({ limit: process.env.REQUEST_LIMIT || '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_LIMIT || '10mb' }));

  // Health check BEFORE logging and database - must respond instantly
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'booking-backend' });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', service: 'booking-backend' });
  });

  // Request logging middleware
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      origin: req.get('origin'),
      cors: req.get('access-control-request-method') ? 'PREFLIGHT' : 'NORMAL',
    });
    next();
  });

  // Connect to MongoDB
  connectDatabase().catch((err) => {
    logger.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

  // Routes
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/options', optionsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/home', home);
  app.use('/api/services', serviceRoutes);
  app.use('/api/apartment', apartmentRoutes);
  app.use('/api/apartment-details', apartmentDetailRoutes);
  app.use('/api/room-details', roomDetailRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/footer', footerRoutes);
  app.use('/api/cms', cmsRoutes);
  app.use('/api/contact-messages', contactMessageRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/search', searchRoutes);


  // Serve uploaded files from backend/public/uploads (one level above src)
  // Serve uploaded files and allow cross-origin embedding from the frontend
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  }, express.static(path.resolve(__dirname, '..', 'public', 'uploads')));

  app.use('*', (req, res) => res.status(404).json({ error: 'Route not found', path: req.originalUrl }));
  
  // Error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    // Capture error in Sentry if initialized
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
    }
    // Call custom error handler
    errorHandler(err, req, res, next);
  });

  return app;
};
export default createApp;
