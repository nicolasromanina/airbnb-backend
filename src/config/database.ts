import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-app';
    const isProduction = process.env.NODE_ENV === 'production';
    
    const mongooseOptions: mongoose.ConnectOptions = {
      // Connection pool
      maxPoolSize: isProduction ? 10 : 5,
      minPoolSize: isProduction ? 5 : 2,
      
      // Timeouts
      serverSelectionTimeoutMS: isProduction ? 30000 : 5000,
      socketTimeoutMS: isProduction ? 60000 : 45000,
      
      // Retries
      retryWrites: true,
      retryReads: true,
      
      // SSL/TLS for MongoDB Atlas
      ssl: true,
      tls: true,
      tlsInsecure: false,
      
      // Connection string validation
      authSource: 'admin',
    };
    
    logger.info(`Connecting to MongoDB in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...`);
    
    await mongoose.connect(mongoUri, mongooseOptions);
    
    logger.info('✅ MongoDB connected successfully');
    logger.info(`Database: ${mongoose.connection.name}`);
    logger.info(`Host: ${mongoose.connection.host}`);
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      logger.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('🔄 MongoDB reconnected');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Closing MongoDB connection...');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    });
    
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};