// routes/service.routes.ts - version complétée
import { Router } from 'express';
import serviceController from '../controllers/serviceController';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Routes publiques (lecture seule)
router.get('/', serviceController.getServicePage.bind(serviceController));
router.get('/health', (req, res) => res.json({ status: 'OK', service: 'services' }));

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
router.put('/', authenticate, serviceController.updateServicePage.bind(serviceController));
router.put('/section/:section/:subsection?', authenticate, serviceController.updateSection.bind(serviceController));

// Routes pour gérer les éléments dynamiques
router.post('/faq', authenticate, serviceController.addFAQItem.bind(serviceController));
router.delete('/faq/:index', authenticate, serviceController.removeFAQItem.bind(serviceController));
router.post('/features', authenticate, serviceController.addFeature.bind(serviceController));

// Routes pour l'import/export
router.post('/reset', authenticate, async (req, res) => {
  try {
    const defaultPage = await (serviceController as any).createDefaultPage();
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

router.post('/import', authenticate, serviceController.updateServicePage.bind(serviceController));

export default router;