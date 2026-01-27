import * as Sentry from '@sentry/node';
import { logger } from '../utils/logger';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only activates if SENTRY_DSN is set in environment variables
 */
export const initSentry = (): boolean => {
  const sentryDsn = process.env.SENTRY_DSN;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!sentryDsn) {
    logger.info('Sentry DSN not provided. Error tracking disabled.');
    return false;
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
        // Filter out health check requests
        if (event.request?.url?.includes('/health')) {
          return null;
        }
        // Remove sensitive headers
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
    return true;
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
    return false;
  }
};

/**
 * Capture an error in Sentry
 */
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (!process.env.SENTRY_DSN) {
    return;
  }
  
  if (context) {
    Sentry.captureException(error, { contexts: { custom: context } });
  } else {
    Sentry.captureException(error);
  }
};

/**
 * Capture a message in Sentry
 */
export const captureMessage = (message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info') => {
  if (!process.env.SENTRY_DSN) {
    return;
  }
  
  Sentry.captureMessage(message, level);
};
