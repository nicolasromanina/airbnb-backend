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
router.delete('/:id', authenticate, promotionController.deletePromotion);

// Upload image
router.post('/:roomId/upload', authenticate, upload.single('image'), uploadToCloudinary, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  res.json({ success: true, url: (req as any).cloudinaryUrl });
});

export default router;
