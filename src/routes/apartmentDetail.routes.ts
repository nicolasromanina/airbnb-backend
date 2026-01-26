// routes/apartmentDetail.routes.ts
import { Router } from 'express';
import apartmentDetailController from '../controllers/apartmentDetailController';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes publiques
router.get('/', apartmentDetailController.getAllDetails);
router.get('/:apartmentId', apartmentDetailController.getDetailByApartmentId);

// Routes protégées
router.put('/:apartmentId', authenticate, apartmentDetailController.updateDetail);
router.put('/:apartmentId/section/:section', authenticate, apartmentDetailController.updateSection);
router.put('/:apartmentId/options', authenticate, apartmentDetailController.updateAdditionalOptions);
router.delete('/:apartmentId', authenticate, apartmentDetailController.deleteDetail);
router.post('/:apartmentId/sync', authenticate, apartmentDetailController.syncWithMainPage);

export default router;