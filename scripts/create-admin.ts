import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// MongoDB connection
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

const seedAdmin = async () => {
  try {
    console.log('\n🔐 Creating Admin User\n');
    console.log('═'.repeat(50));

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

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
        isActive: {
          type: Boolean,
          default: true,
        },
        role: {
          type: String,
          enum: ['user', 'admin', 'manager', 'support', 'superadmin'],
          default: 'user',
        },
      },
      {
        timestamps: true,
        toJSON: {
          transform: (doc, ret: any) => {
            delete ret.password;
            delete ret.__v;
            return ret;
          },
        },
      }
    );

    // Hash password before saving
    userSchema.pre('save', async function (next) {
      if (!this.isModified('password')) return next();

      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
      } catch (error) {
        next(error as Error);
      }
    });

    const User = mongoose.model('User', userSchema);

    // Admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

    console.log('\n📋 Admin Details:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Name: ${adminFirstName} ${adminLastName}`);
    console.log(`   Role: superadmin`);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('\n⚠️  Admin already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);

      if (existingAdmin.role !== 'superadmin') {
        console.log('\n🔄 Updating role to superadmin...');
        existingAdmin.role = 'superadmin';
        await existingAdmin.save();
        console.log('✅ Role updated to superadmin');
      }

      console.log('\n═'.repeat(50));
      process.exit(0);
      return;
    }

    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'superadmin',
      isActive: true,
    });

    await adminUser.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📊 Admin Account Info:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: superadmin`);
    console.log(`   Active: Yes`);

    console.log('\n═'.repeat(50));
    console.log('\n🔐 Security Reminder:');
    console.log('   1. Change the default password immediately');
    console.log('   2. Use environment variables for credentials');
    console.log('   3. Never commit credentials to Git');
    console.log('   4. Store securely (password manager, etc)');

    console.log('\n═'.repeat(50));
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error);
    process.exit(1);
  }
};

seedAdmin();
