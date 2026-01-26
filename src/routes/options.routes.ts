import { Router } from 'express';
import { AdditionalOptionController } from '../controllers/option.controller';

const router = Router();
const optionController = new AdditionalOptionController();

// Public routes
router.get('/', optionController.getAllOptions);
router.get('/category/:category', optionController.getOptionsByCategory);
router.get('/:id', optionController.getOption);

// Admin routes (TODO: Add authorize middleware)
router.post('/', AdditionalOptionController.validateCreateOption, optionController.createOption);
router.put('/:id', optionController.updateOption);
router.delete('/:id', optionController.deleteOption);

export default router;
