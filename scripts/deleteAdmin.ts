import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const deleteAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/airbnb';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@airbnb.com';

    console.log('🔗 Connecting to MongoDB...');
    console.log(`📧 Admin email to delete: ${adminEmail}`);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const User = mongoose.model('User');
    
    const result = await User.deleteOne({ email: adminEmail });
    
    if (result.deletedCount > 0) {
      console.log(`✅ Admin user deleted successfully: ${adminEmail}`);
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

deleteAdmin();
