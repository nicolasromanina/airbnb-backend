import { Request, Response } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { logger, logStep } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import { AuthRequest, authenticate } from '../middleware/auth.middleware';

export class AuthController {
  // Validation rules for registration
  static validateRegister = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required'),
  ];

  // Validation rules for login
  static validateLogin = [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ];

  // Generate JWT token
  private generateToken(userId: string): string {
    const secret: Secret = process.env.JWT_SECRET || 'default-secret-key';
    return jwt.sign({ userId }, secret, { expiresIn: '7d' } as SignOptions);
  }

  // Register new user
  register = async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName } = req.body;

      logStep('REGISTER_REQUEST', { email, firstName });

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          error: 'User with this email already exists' 
        });
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
      });

      await user.save();

      // Generate token
      const token = this.generateToken(user._id.toString());

      logStep('USER_REGISTERED_SUCCESS', { userId: user._id, email });

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        message: 'Registration successful'
      });

    } catch (error: any) {
      logger.error('Registration error:', error);
      
      res.status(500).json({ 
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
  }

  // Login user
  login = async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      logStep('LOGIN_REQUEST', { email });

      // Find user
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({ 
          error: 'Account is disabled. Please contact support.' 
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Invalid email or password' 
        });
      }

      // Generate token
      const token = this.generateToken(user._id.toString());

      logStep('LOGIN_SUCCESS', { userId: user._id, email });

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          stripeCustomerId: user.stripeCustomerId,
        },
        message: 'Login successful'
      });

    } catch (error: any) {
      logger.error('Login error:', error);
      
      res.status(500).json({ 
        success: false,
        error: 'Login failed. Please try again.'
      });
    }
  }

  // Get current user
  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone,
          stripeCustomerId: user.stripeCustomerId,
          createdAt: user.createdAt,
        }
      });

    } catch (error: any) {
      logger.error('Get current user error:', error);
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to get user information'
      });
    }
  }

  // Update user profile
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { firstName, lastName, phone } = req.body;

      // Find and update user
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { 
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          phone: phone || user.phone,
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      logStep('PROFILE_UPDATED', { userId: user._id });

      res.json({
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully'
      });

    } catch (error: any) {
      logger.error('Update profile error:', error);
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  // Change password
  async changePassword(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Current password and new password are required' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'New password must be at least 6 characters long' 
        });
      }

      // Get user with password
      const userWithPassword = await User.findById(user._id).select('+password');
      
      if (!userWithPassword) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isPasswordValid = await userWithPassword.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Current password is incorrect' 
        });
      }

      // Update password
      userWithPassword.password = newPassword;
      await userWithPassword.save();

      logStep('PASSWORD_CHANGED', { userId: user._id });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error: any) {
      logger.error('Change password error:', error);
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to change password'
      });
    }
  }

  // Refresh token
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      // In a real application, you would verify the refresh token
      // and issue a new access token
      // This is a simplified version
      
      res.json({
        success: true,
        message: 'Token refresh functionality to be implemented'
      });

    } catch (error: any) {
      logger.error('Refresh token error:', error);
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to refresh token'
      });
    }
  }

  // Forgot password
  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await User.findOne({ email });
      
      if (!user) {
        // For security, don't reveal if user exists
        return res.json({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link'
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET! + user.password,
        { expiresIn: '1h' }
      );

      // In production, send email with reset link
      // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      logStep('PASSWORD_RESET_REQUESTED', { email, userId: user._id });

      res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link',
        // In development, return the token
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      });

    } catch (error: any) {
      logger.error('Forgot password error:', error);
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to process forgot password request'
      });
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ 
          error: 'Token and new password are required' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          error: 'New password must be at least 6 characters long' 
        });
      }

      // Decode token to get user ID
      const decoded = jwt.decode(token) as { userId: string };
      
      if (!decoded || !decoded.userId) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify token
      try {
        jwt.verify(token, process.env.JWT_SECRET! + user.password);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logStep('PASSWORD_RESET_SUCCESS', { userId: user._id });

      res.json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error: any) {
      logger.error('Reset password error:', error);
      
      res.status(500).json({ 
        success: false,
        error: 'Failed to reset password'
      });
    }
  }

  // Middleware function
  authenticate = authenticate;
}