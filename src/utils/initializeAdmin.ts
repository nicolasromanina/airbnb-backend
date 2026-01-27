import bcrypt from 'bcryptjs';
import { logger } from './logger';
import { User } from '../models/User';

/**
 * Initialize default admin user after database is connected
 */
export const initializeAdminUser = async (): Promise<void> => {
  try {
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
    logger.info(`   🔑 Password: Set from environment variable`);
  } catch (err) {
    // Log warning but don't fail startup
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`⚠️  Could not initialize admin user: ${message}`);
  }
};
