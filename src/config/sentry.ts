import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';
import dotenv from 'dotenv';

dotenv.config();

export const initSentry = () => {
  const sentryDsn = process.env.SENTRY_DSN;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!sentryDsn && isProduction) {
    console.warn('⚠️ SENTRY_DSN not configured. Error tracking disabled.');
    return null;
  }

  if (!sentryDsn) {
    console.log('ℹ️ Sentry DSN not provided. Skipping Sentry initialization.');
    return null;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: isProduction ? 0.1 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Tracing.Integrations.Express({
          app: true,
          request: true,
          transaction: 'name',
        }),
      ],
      // Performance Monitoring
      maxBreadcrumbs: 50,
      attachStacktrace: true,
      
      // Release tracking
      release: process.env.APP_VERSION || '1.0.0',
      
      // Before sending - filter sensitive data
      beforeSend(event, hint) {
        // Don't send health check errors
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
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
      ],
    });

    console.log('✅ Sentry initialized successfully');
    return Sentry;
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
    return null;
  }
};

export default Sentry;
