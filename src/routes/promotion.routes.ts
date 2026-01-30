import { Router } from 'express';
import promotionController from '../controllers/promotion.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload, uploadToCloudinary } from '../middleware/cloudinary.middleware';

const router = Router();

// Routes publiques
router.get('/:roomId', promotionController.getPromotionByRoomId);

// Routes protégées (admin)
router.put('/:roomId', authenticate, promotionController.updatePromotion);
router.post('/', authenticate, promotionController.createPromotion);
router.post('/:roomId/upload', authenticate, upload.single('image'), uploadToCloudinary, (req: any, res) => {
  try {
    if (!req.cloudinaryUrl) {
      return res.status(400).json({ success: false, error: 'Failed to upload to Cloudinary' });
    }
    res.json({ success: true, url: req.cloudinaryUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Upload failed', details: (error as any).message });
  }
});
router.post('/:roomId/upload-card', authenticate, upload.single('image'), uploadToCloudinary, (req: any, res) => {
  try {
    if (!req.cloudinaryUrl) {
      return res.status(400).json({ success: false, error: 'Failed to upload to Cloudinary' });
    }
    res.json({ success: true, url: req.cloudinaryUrl });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Upload failed', details: (error as any).message });
  }
});
router.delete('/:id', authenticate, promotionController.deletePromotion);

export default router;
