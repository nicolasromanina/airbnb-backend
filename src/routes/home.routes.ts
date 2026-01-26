import { Router } from 'express';
import homeController from '../controllers/homeController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes publiques (lecture seule)
router.get('/', homeController.getHomePage.bind(homeController));

// Routes protégées (édition)
router.put('/', authenticate, homeController.updateHomePage.bind(homeController));
router.put('/section/:section', authenticate, homeController.updateSection.bind(homeController));

export default router;