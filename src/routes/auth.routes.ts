import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', AuthController.validateRegister, authController.register);
router.post('/login', AuthController.validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.get('/me', authController.authenticate, authController.getCurrentUser);
router.put('/profile', authController.authenticate, authController.updateProfile);
router.put('/change-password', authController.authenticate, authController.changePassword);

export default router;