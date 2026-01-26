import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const reservationController = new ReservationController();

// Public routes
router.get('/availability', reservationController.checkAvailability);

// Protected routes
router.post(
  '/',
  authenticate,
  ReservationController.validateCreateReservation,
  reservationController.createReservation
);

router.get(
  '/my-reservations',
  authenticate,
  reservationController.getUserReservations
);

router.get(
  '/:id',
  authenticate,
  reservationController.getReservation
);

router.put(
  '/:id/status',
  authenticate,
  reservationController.updateReservationStatus
);

router.delete(
  '/:id/cancel',
  authenticate,
  reservationController.cancelReservation
);

router.delete(
  '/:id',
  authenticate,
  reservationController.deleteReservation
);

router.get(
  '/stats/overview',
  authenticate,
  reservationController.getReservationStats
);

// Admin routes
router.get(
  '/',
  authenticate,
  authorize('admin'),
  reservationController.getUserReservations // Reusing with admin privileges
);

router.put(
  '/:id/admin-status',
  authenticate,
  authorize('admin'),
  reservationController.updateReservationStatus
);

export default router;