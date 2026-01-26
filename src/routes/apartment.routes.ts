import { Router } from 'express';
import apartmentController from '../controllers/apartmentController';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Routes publiques (lecture seule)
router.get('/', apartmentController.getApartmentPage.bind(apartmentController));
router.get('/health', (req, res) => res.json({ status: 'OK', service: 'apartments' }));

// Routes upload d'images
router.post('/upload', authenticate, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier téléchargé' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du téléchargement de l\'image' });
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