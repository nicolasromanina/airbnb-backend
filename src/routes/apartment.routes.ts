import { Router } from 'express';
import apartmentController from '../controllers/apartmentController';
import { authenticate } from '../middleware/auth.middleware';
import { upload, uploadVideo, uploadToCloudinary } from '../middleware/cloudinary.middleware';

const router = Router();

// Routes publiques (lecture seule)
router.get('/', apartmentController.getApartmentPage.bind(apartmentController));
router.get('/health', (req, res) => res.json({ status: 'OK', service: 'apartments' }));

// Routes upload d'images (Cloudinary)
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
router.put('/', authenticate, apartmentController.updateApartmentPage.bind(apartmentController));
router.put('/section/:section/:subsection?', authenticate, apartmentController.updateSection.bind(apartmentController));

// Routes pour gérer les chambres
router.post('/rooms', authenticate, apartmentController.addRoom.bind(apartmentController));
router.put('/rooms/:id', authenticate, apartmentController.updateRoom.bind(apartmentController));
router.delete('/rooms/:id', authenticate, apartmentController.deleteRoom.bind(apartmentController));

// Routes pour l'import/export
router.post('/reset', authenticate, async (req, res) => {
  try {
    const defaultPage = await (apartmentController as any).createDefaultPage();
    res.json({ 
      message: 'Données réinitialisées avec succès', 
      page: defaultPage 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur lors de la réinitialisation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/import', authenticate, apartmentController.updateApartmentPage.bind(apartmentController));

export default router;