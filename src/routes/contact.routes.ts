import { Router } from 'express';
import contactController from '../controllers/contactController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes publiques (lecture seule)
router.get('/', contactController.getContactPage.bind(contactController));

// Routes protégées (édition)
router.put('/', authenticate, contactController.updateContactPage.bind(contactController));
router.put('/section/:section', authenticate, contactController.updateSection.bind(contactController));
router.post('/testimonials', authenticate, contactController.addTestimonial.bind(contactController));
router.post('/gallery', authenticate, contactController.addGalleryItem.bind(contactController));

export default router;