import { Router } from 'express';
import contactController from '../controllers/contactController';
import { authenticate } from '../middleware/auth.middleware';
import { upload, uploadToCloudinary } from '../middleware/cloudinary.middleware';

const router = Router();

// Routes publiques (lecture seule)
router.get('/', contactController.getContactPage.bind(contactController));

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

// Routes protégées (édition)
router.put('/', authenticate, contactController.updateContactPage.bind(contactController));
router.put('/section/:section', authenticate, contactController.updateSection.bind(contactController));
router.post('/testimonials', authenticate, contactController.addTestimonial.bind(contactController));
router.post('/gallery', authenticate, contactController.addGalleryItem.bind(contactController));

export default router;