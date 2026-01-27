const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const resetAdminPassword = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@airbnb.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

    if (!mongoUri) {
      throw new Error('MONGODB_URI not configured');
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoUri, { 
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    
    console.log('✅ Connected to MongoDB Atlas\n');

    // Get collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Hash password correctly (just once)
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    console.log('✅ Password hashed\n');

    // Delete existing admin
    console.log(`🗑️  Deleting existing admin: ${adminEmail}`);
    const deleteResult = await usersCollection.deleteOne({ email: adminEmail });
    console.log(`✅ Deleted ${deleteResult.deletedCount} document(s)\n`);

    // Create new admin with correct hash
    console.log('➕ Creating new admin user...');
    const adminUser = {
      email: adminEmail,
      password: hashedPassword,
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.ADMIN_LAST_NAME || 'Airbnb',
      role: 'superadmin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await usersCollection.insertOne(adminUser);
    console.log('✅ Admin user created successfully\n');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Role: superadmin\n');
    console.log('✨ Admin is ready to use!');

    await mongoose.disconnect();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
};

// Run with timeout
setTimeout(() => {
  console.error('❌ Timeout after 15 seconds');
  process.exit(1);
}, 15000);

resetAdminPassword();
