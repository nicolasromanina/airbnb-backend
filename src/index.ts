import dotenv from 'dotenv';
import createApp from './app';
import { logger } from './utils/logger';
import { initializeAdminUser } from './utils/initializeAdmin';
import mongoose from 'mongoose';
// Import all models to register them with Mongoose
import { User } from './models/User';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = createApp();

let server: any;

// Start server
const startServer = async () => {
  server = app.listen(PORT, async () => {
    logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
    logger.info(`📍 Environment: ${NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    logger.info(`🔗 Database: MongoDB Atlas`);

    // Initialize admin user after server starts (database is now connected)
    setTimeout(() => {
      initializeAdminUser().catch(err => {
        logger.warn(`Admin initialization failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }, 2000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: any) => {
    logger.error('❌ Unhandled Rejection:', err);
    gracefulShutdown();
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err: any) => {
    logger.error('❌ Uncaught Exception:', err);
    gracefulShutdown();
  });
};

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('🛑 Graceful shutdown initiated...');
  
  if (server) {
    server.close(() => {
      logger.info('✅ Server closed');
    });
  }

  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB connection closed');
  } catch (err) {
    logger.error('❌ Error closing MongoDB:', err);
  }

  process.exit(0);
};

// Handle termination signals
process.on('SIGTERM', () => {
  logger.info('📢 SIGTERM received');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('📢 SIGINT received');
  gracefulShutdown();
});

startServer();