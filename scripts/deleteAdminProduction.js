const mongoose = require('mongoose');
require('dotenv').config();

const deleteAdminProduction = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@airbnb.com';

    if (!mongoUri) {
      throw new Error('MONGODB_URI not configured in .env');
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log(`📧 Admin email to delete: ${adminEmail}`);

    await mongoose.connect(mongoUri, { 
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Direct connection to users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Delete admin user
    const result = await usersCollection.deleteOne({ email: adminEmail });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Admin user DELETED successfully from production: ${adminEmail}`);
      console.log(`🔄 Admin will be recreated on next deployment`);
    } else {
      console.log(`ℹ️  No admin user found with email: ${adminEmail}`);
    }

    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
};

// Run with timeout
setTimeout(() => {
  console.error('❌ Timeout après 10 secondes');
  process.exit(1);
}, 10000);

deleteAdminProduction();
