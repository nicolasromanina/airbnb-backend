#!/usr/bin/env ts-node-dev
/**
 * Deployment initialization script
 * Runs automatically after Render deploys
 * - Creates default admin user if none exists
 * - Seeds initial data
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-app';

interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'admin' | 'manager' | 'support' | 'superadmin';
  isActive: boolean;
}

const initializeDeployment = async () => {
  try {
    console.log('\n🚀 Initializing Deployment\n');
    console.log('═'.repeat(60));

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Define User schema inline
    const userSchema = new mongoose.Schema<IUser>(
      {
        email: {
          type: String,
          required: true,
          unique: true,
          lowercase: true,
          trim: true,
        },
        password: {
          type: String,
          required: true,
          minlength: 6,
        },
        firstName: {
          type: String,
          required: true,
          trim: true,
        },
        lastName: {
          type: String,
          required: true,
          trim: true,
        },
        phone: String,
        role: {
          type: String,
          enum: ['user', 'admin', 'manager', 'support', 'superadmin'],
          default: 'user',
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
      { timestamps: true }
    );

    // Create User model
    const User = mongoose.model<IUser>('User', userSchema);

    // Get admin credentials from environment or use defaults
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@airbnb.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

    console.log('🔐 Creating Admin User');
    console.log(`   Email: ${adminEmail}`);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists (${adminEmail})`);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 12);

      // Create admin user
      const adminUser = new User({
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
        role: 'superadmin',
        isActive: true,
      });

      await adminUser.save();
      console.log(`✅ Admin user created successfully`);
      console.log(`\n📋 Admin Credentials:`);
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Role: superadmin`);
    }

    console.log('\n✅ Deployment initialization completed successfully!\n');
    console.log('═'.repeat(60) + '\n');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Deployment initialization failed:');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\n⚠️  Deployment will continue, but admin user may not be created.');
    console.error('   You can create it manually using: npm run create:admin\n');
    
    // Don't exit with error - allow deployment to continue
    process.exit(0);
  }
};

// Run initialization
initializeDeployment();
