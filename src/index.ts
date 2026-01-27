import dotenv from 'dotenv';
import createApp from './app';
import { logger } from './utils/logger';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = createApp();

let server: any;

// Initialize default admin user on first startup
const initializeAdminUser = async () => {
  try {
    const User = mongoose.model('User');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@airbnb.local';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      logger.info(`ℹ️  Admin user already exists (${adminEmail})`);
      return;
    }

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = new User({
      email: adminEmail,
      password: hashedPassword,
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.ADMIN_LAST_NAME || 'User',
      role: 'superadmin',
      isActive: true,
    });

    await adminUser.save();
    logger.info(`✅ Admin user created successfully`);
    logger.info(`   📧 Email: ${adminEmail}`);
  } catch (err) {
    logger.warn(`⚠️  Could not initialize admin user: ${err instanceof Error ? err.message : String(err)}`);
    // Don't exit - allow app to continue even if admin creation fails
  }
};

// Start server
const startServer = async () => {
  server = app.listen(PORT, async () => {
    logger.info(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
    logger.info(`📍 Environment: ${NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    logger.info(`🔗 Database: MongoDB Atlas`);

    // Initialize admin user after server starts (but database is already connected)
    setTimeout(() => {
      initializeAdminUser().catch(err => {
        logger.warn(`Admin initialization failed: ${err instanceof Error ? err.message : String(err)}`);
      });
    }, 1000);
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