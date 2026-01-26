// backend/src/routes/roomDetail.routes.ts
import { Router } from 'express';
import roomDetailController from '../controllers/roomDetailController';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Routes publiques (lecture)
router.get('/', roomDetailController.getAllRoomDetails);
router.get('/:roomId', roomDetailController.getRoomDetail);

// Route upload d'images
router.post('/upload', authenticate, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erreur lors du téléchargement de l\'image' });
  }
});

// Routes protégées (édition)
router.post('/', authenticate, roomDetailController.createRoomDetail);
router.put('/:roomId', authenticate, roomDetailController.updateRoomDetail);
router.delete('/:roomId', authenticate, roomDetailController.deleteRoomDetail);

export default router;
