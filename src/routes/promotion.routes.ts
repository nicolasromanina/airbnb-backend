import { Router } from 'express';
import promotionController from '../controllers/promotion.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadToCloudinary } from '../middleware/cloudinary.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Routes publiques
router.get('/:roomId', promotionController.getPromotionByRoomId);

// Routes protégées (admin)
router.put('/:roomId', authenticate, promotionController.updatePromotion);
router.post('/', authenticate, promotionController.createPromotion);
router.post('/:roomId/upload', authenticate, upload.single('image'), uploadToCloudinary, promotionController.uploadPromotionImage);
router.post('/:roomId/upload-card', authenticate, upload.single('image'), uploadToCloudinary, promotionController.uploadPromotionCardImage);
router.delete('/:id', authenticate, promotionController.deletePromotion);

export default router;
