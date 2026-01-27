import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const deleteAdminProduction = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@airbnb.com';

    if (!mongoUri) {
      throw new Error('MONGODB_URI not configured in .env');
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    console.log(`📧 Admin email to delete: ${adminEmail}`);
    console.log(`🌐 Database: ${mongoUri.split('@')[1]?.split('/')[0] || 'unknown'}`);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');

    // Get User model
    const User = mongoose.model('User');
    
    // Delete admin user
    const result = await User.deleteOne({ email: adminEmail });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Admin user DELETED successfully from production: ${adminEmail}`);
      console.log(`🔄 Admin will be recreated on next deployment with password: ${process.env.ADMIN_PASSWORD || 'AdminPass123!'}`);
    } else {
      console.log(`ℹ️  No admin user found with email: ${adminEmail}`);
    }

    await mongoose.connection.close();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
};

deleteAdminProduction();
