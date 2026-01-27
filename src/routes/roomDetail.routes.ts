// backend/src/routes/roomDetail.routes.ts
import { Router } from 'express';
import roomDetailController from '../controllers/roomDetailController';
import { authenticate } from '../middleware/auth.middleware';
import { upload, uploadToCloudinary } from '../middleware/cloudinary.middleware';

const router = Router();

// Routes publiques (lecture)
router.get('/', roomDetailController.getAllRoomDetails);
router.get('/:roomId', roomDetailController.getRoomDetail);

// Route upload d'images (Cloudinary)
router.post('/upload', authenticate, upload.single('image'), uploadToCloudinary, (req, res) => {
  try {
    if (!req.cloudinaryUrl) {
      return res.status(400).json({ success: false, error: 'Erreur lors du téléchargement vers Cloudinary' });
    }
    
    res.json({ 
      success: true, 
      url: req.cloudinaryUrl, 
      publicId: req.cloudinaryPublicId
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du traitement de l\'image' 
    });
  }
});

// Routes protégées (édition)
router.post('/', authenticate, roomDetailController.createRoomDetail);
router.put('/:roomId', authenticate, roomDetailController.updateRoomDetail);
router.delete('/:roomId', authenticate, roomDetailController.deleteRoomDetail);

export default router;
