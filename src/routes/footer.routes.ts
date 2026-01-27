import { Router } from 'express';
import footerController from '../controllers/footerController';
import { authenticate } from '../middleware/auth.middleware';
import { upload, uploadMultiple, uploadToCloudinary } from '../middleware/cloudinary.middleware';

const router = Router();

// Routes publiques
router.get('/', footerController.getFooterData.bind(footerController));

// Routes protégées
router.put('/', authenticate, footerController.updateFooterData.bind(footerController));

// Upload de logo
router.post(
  '/logo',
  authenticate,
  upload.single('logo'),
  uploadToCloudinary,
  footerController.updateLogo.bind(footerController)
);

// Upload d'images de galerie
router.post(
  '/gallery',
  authenticate,
  upload.single('image'),
  uploadToCloudinary,
  footerController.addGalleryImage.bind(footerController)
);

// Gestion multiple d'images
router.post(
  '/gallery/multiple',
  authenticate,
  uploadMultiple,
  uploadToCloudinary,
  async (req: any, res: any) => {
    try {
      const { altTexts = [] } = req.body;
      const updatedBy = req.user?.email || 'anonymous';
      
      if (!req.cloudinaryUrls || !Array.isArray(req.cloudinaryUrls)) {
        return res.status(400).json({ error: 'Aucune image téléchargée' });
      }

      // Récupérer le footer actuel
      const Footer = require('../models/Footer.model').default;
      const footer = await Footer.findOne();
      let currentOrder = footer?.galleryImages?.length || 0;

      // Créer les nouvelles images
      const newImages = req.cloudinaryUrls.map((url: string, index: number) => ({
        image: url,
        cloudinaryPublicId: req.cloudinaryPublicIds[index],
        alt: altTexts[index] || `Image ${currentOrder + index + 1}`,
        order: currentOrder + index
      }));

      // Ajouter au footer
      const updatedFooter = await Footer.findOneAndUpdate(
        {},
        {
          $push: { galleryImages: { $each: newImages } },
          $inc: { 'meta.version': 1 },
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy
        },
        { new: true, upsert: true }
      );

      res.status(201).json({
        message: 'Images ajoutées avec succès',
        galleryImages: updatedFooter.galleryImages
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de l\'ajout multiple d\'images',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

// Supprimer une image
router.delete('/gallery/:imageId', authenticate, footerController.deleteGalleryImage.bind(footerController));

// Mettre à jour l'ordre
router.put('/gallery/order', authenticate, footerController.updateGalleryOrder.bind(footerController));

// Route d'upload générique
router.post('/upload', authenticate, upload.single('image'), uploadToCloudinary, (req: any, res) => {
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

export default router;