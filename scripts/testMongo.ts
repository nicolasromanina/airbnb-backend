#!/usr/bin/env ts-node-dev

/**
 * MongoDB Atlas Connection Test
 * Teste la connexion à MongoDB Atlas et valide la configuration
 * 
 * Usage: npm run test:mongo
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '../src/utils/logger';

// Load environment variables
dotenv.config();

const testMongoConnection = async () => {
  console.log('\n🔍 MongoDB Atlas Connection Test\n');
  console.log('═'.repeat(50));

  // Display current configuration
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-app';
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  console.log('\n📋 Configuration:');
  console.log(`   Environment: ${nodeEnv}`);
  console.log(`   Connection String: ${mongoUri.replace(/:(.+?)@/, ':****@')}`);
  console.log(`   Node Version: ${process.version}`);
  console.log(`   Mongoose Version: ${mongoose.version}`);

  console.log('\n═'.repeat(50));
  console.log('\n⏳ Testing connection...\n');

  try {
    // Attempt connection
    const startTime = Date.now();
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      retryWrites: true,
      retryReads: true,
      ssl: true,
      tls: true,
      tlsInsecure: false,
    });

    const connectionTime = Date.now() - startTime;

    // Connection successful
    console.log(`✅ Successfully connected to MongoDB in ${connectionTime}ms\n`);

    // Display connection details
    const db = mongoose.connection;
    console.log('📊 Connection Details:');
    console.log(`   Database: ${db.name}`);
    console.log(`   Host: ${db.host}`);
    console.log(`   Port: ${db.port}`);
    console.log(`   State: ${db.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // List collections
    console.log('\n📚 Collections:');
    const collections = await db.db?.listCollections().toArray();
    
    if (collections && collections.length > 0) {
      collections.forEach((col) => {
        console.log(`   ✓ ${col.name}`);
      });
    } else {
      console.log('   (No collections yet)');
    }

    // Test a simple query
    console.log('\n🧪 Testing database access...');
    const result = await db.db?.admin().ping();
    console.log(`   Ping result: ${JSON.stringify(result)}`);

    // Pool info (if available)
    console.log('\n🔌 Connection Pool:');
    const connectionState = (mongoose.connection as any).getClient?.();
    if (connectionState) {
      console.log(`   Status: Active`);
    } else {
      console.log(`   Pool initialized and ready`);
    }

    console.log('\n═'.repeat(50));
    console.log('\n✅ All tests passed! Database connection is working.\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error Details:');
    console.error(`   Type: ${(error as any).name}`);
    console.error(`   Message: ${(error as any).message}`);
    
    if ((error as any).code) {
      console.error(`   Code: ${(error as any).code}`);
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify MONGODB_URI in .env file');
    console.log('   2. Check MongoDB Atlas IP Whitelist (Network Access)');
    console.log('   3. Verify credentials (airbnb_user:password)');
    console.log('   4. Check internet connection');
    console.log('   5. Ensure cluster is running in MongoDB Atlas');

    console.log('\n💡 How to fix:');
    console.log('   1. Go to MongoDB Atlas: https://cloud.mongodb.com');
    console.log('   2. Select your cluster');
    console.log('   3. Go to "Network Access"');
    console.log('   4. Add your IP address (or 0.0.0.0/0 for development)');
    console.log('   5. Wait 1-2 minutes for changes to apply');

    console.log('\n═'.repeat(50) + '\n');

    process.exit(1);
  }
};

// Run test
testMongoConnection();
