import { Request, Response } from 'express';
import { User } from '../../models/User';
import { Reservation } from '../../models/Reservation';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger';

export const listUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) || '1'));
    const limit = Math.max(1, parseInt((req.query.limit as string) || '20'));
    const search = (req.query.q as string) || '';

    const filter: any = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Attach recent reservations count
    const userIds = users.map(u => u._id);
    const reservations = await Reservation.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);
    const resMap: Record<string, number> = {};
    reservations.forEach(r => { resMap[r._id.toString()] = r.count; });

    const usersWithMeta = users.map(u => ({
      ...u,
      reservationsCount: resMap[u._id.toString()] || 0
    }));

    res.json({ data: usersWithMeta, meta: { total, page, limit } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list users', details: (error as any).message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const history = await Reservation.find({ user: user._id }).sort({ createdAt: -1 }).limit(50).lean();

    res.json({ data: { ...user, history } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user', details: (error as any).message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { role, isActive } = req.body;
    const allowed = ['user', 'admin', 'manager', 'support', 'superadmin'];
    if (role && !allowed.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const update: any = {};
    if (role) update.role = role;
    if (typeof isActive === 'boolean') update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: (error as any).message });
  }
};

export const sendCommunication = async (req: Request, res: Response) => {
  try {
    const { userIds = [], subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'subject and message required' });

    // Simple nodemailer usage if configured
    if (!process.env.SMTP_HOST) {
      return res.status(501).json({ error: 'Email provider not configured (SMTP_HOST missing)' });
    }

    const secureFlag = String(process.env.SMTP_SECURE).toLowerCase() === 'true';
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: secureFlag, // true for port 465 (SSL), false for 587 (STARTTLS)
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      tls: {
        // allow override with SMTP_REJECT_UNAUTHORIZED=false in .env for testing
        rejectUnauthorized: String(process.env.SMTP_REJECT_UNAUTHORIZED).toLowerCase() !== 'false'
      }
    });

    const users = await User.find({ _id: { $in: userIds } }).select('email firstName lastName').lean();

    const sendPromises = users.map(u => transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to: u.email,
      subject,
      text: `Bonjour ${u.firstName || ''} ${u.lastName || ''},\n\n${message}`
    }));

    const results = await Promise.allSettled(sendPromises);

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failedResults = results
      .map((r, i) => ({ result: r, user: users[i] }))
      .filter(x => x.result.status === 'rejected')
      .map(x => ({ email: x.user.email, reason: (x.result as PromiseRejectedResult).reason?.toString() }));

    // Log failures for debugging
    if (failedResults.length > 0) {
      logger.warn('Some emails failed to send', { failures: failedResults });
    }

    res.json({ data: { sent, failed: failedResults.length, failures: failedResults } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send communications', details: (error as any).message });
  }
};

// Development helper: create or return a dev superadmin and issue a JWT
export const devSeedAdmin = async (req: Request, res: Response) => {
  try {
    // Only allow in development or when explicitly enabled
    if (process.env.NODE_ENV !== 'development' && process.env.ALLOW_DEV_SEED !== 'true') {
      return res.status(403).json({ error: 'Dev seeding not allowed in this environment' });
    }

    const email = process.env.DEV_ADMIN_EMAIL || 'admin@local.dev';
    const password = process.env.DEV_ADMIN_PWD || 'Admin123!';

    let user = await User.findOne({ email }).select('+password');
    let created = false;

    if (!user) {
      user = new User({
        email,
        password,
        firstName: 'Dev',
        lastName: 'Admin',
        role: 'superadmin',
        isActive: true,
      });
      await user.save();
      created = true;
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    // Return safe user info + token (don't return hashed password)
    res.json({
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        token,
        created,
        // Only return plain password when newly created so developer can log in if needed
        ...(created ? { password } : {}),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed admin', details: (error as any).message });
  }
};

export default { listUsers, getUser, updateUserRole, sendCommunication, devSeedAdmin };
