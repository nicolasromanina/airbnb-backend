// routes/contactRoutes.ts
import { Router } from 'express';
import contactController from '../controllers/contact.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Route publique pour soumettre un formulaire de contact
router.post('/submit', contactController.submitContactForm);

// Routes protégées pour l'administration
router.get('/messages', authenticate, contactController.getContactMessages);
router.put('/messages/:id/status', authenticate, contactController.updateMessageStatus);

export default router;