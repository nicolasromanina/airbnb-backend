import { Router } from 'express';
import homeController from '../controllers/homeController';
import { authenticate } from '../middleware/auth.middleware';
import { upload, uploadVideo, uploadToCloudinary } from '../middleware/cloudinary.middleware';

const router = Router();

// Routes publiques (lecture seule)
router.get('/', homeController.getHomePage.bind(homeController));

// Route upload d'images (Cloudinary)
router.post('/upload', authenticate, upload.single('image'), uploadToCloudinary, (req, res) => {
  try {
    if (!req.cloudinaryUrl) {
      return res.status(400).json({ error: 'Erreur lors du téléchargement vers Cloudinary' });
    }
    
    res.json({ 
      url: req.cloudinaryUrl, 
      publicId: req.cloudinaryPublicId,
      success: true 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du traitement de l\'image' });
  }
});

// Route upload de vidéos (Cloudinary)
router.post('/upload-video', authenticate, uploadVideo.single('video'), uploadToCloudinary, (req: any, res) => {
  try {
    if (!req.cloudinaryUrl) {
      return res.status(400).json({ error: 'Erreur lors du téléchargement de la vidéo vers Cloudinary' });
    }
    
    res.json({ 
      url: req.cloudinaryUrl, 
      publicId: req.cloudinaryPublicId,
      resourceType: req.resourceType,
      success: true 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du traitement de la vidéo' });
  }
});

// Routes protégées (édition)
router.put('/', authenticate, homeController.updateHomePage.bind(homeController));
router.put('/section/:section', authenticate, homeController.updateSection.bind(homeController));

export default router;