import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { runValidation } from '../middleware/validate.middleware';
import userCtrl from '../controllers/admin/user.controller';
import bookingCtrl from '../controllers/admin/booking.controller';
import cmsCtrl from '../controllers/cms.controller';

const router = Router();

// Users
router.get('/users', authenticate, authorize('admin','superadmin','manager'), userCtrl.listUsers);
router.get('/users/:id', authenticate, authorize('admin','superadmin','manager'), param('id').isMongoId(), runValidation, userCtrl.getUser);
router.put('/users/:id/role', authenticate, authorize('admin','superadmin'), [
	param('id').isMongoId(),
	body('role').optional().isString().isIn(['user','admin','manager','support','superadmin']),
	body('isActive').optional().isBoolean(),
], runValidation, userCtrl.updateUserRole);
router.post('/users/communications', authenticate, authorize('admin','superadmin','manager','support'), [
	body('userIds').isArray().optional(),
	body('subject').isString().notEmpty(),
	body('message').isString().notEmpty(),
], runValidation, userCtrl.sendCommunication);

// Dev-only seed endpoint: create or return a superadmin and issue a token
if (process.env.NODE_ENV === 'development' || process.env.ALLOW_DEV_SEED === 'true') {
  router.post('/dev/seed-admin', userCtrl.devSeedAdmin);
}

// Bookings
router.get('/bookings', authenticate, authorize('admin','superadmin','manager'), bookingCtrl.listReservations);
router.get('/bookings/export', authenticate, authorize('admin','superadmin','manager'), bookingCtrl.exportReservationsCSV);
router.get('/bookings/:id', authenticate, authorize('admin','superadmin','manager'), param('id').isMongoId(), runValidation, bookingCtrl.getReservation);
router.get('/bookings/:id/communications', authenticate, authorize('admin','superadmin','manager','support'), param('id').isMongoId(), runValidation, bookingCtrl.getBookingCommunications);
router.post('/bookings/:id/confirm', authenticate, authorize('admin','superadmin','manager'), param('id').isMongoId(), runValidation, bookingCtrl.confirmReservation);
router.post('/bookings/:id/cancel', authenticate, authorize('admin','superadmin','manager'), param('id').isMongoId(), runValidation, bookingCtrl.cancelReservation);

// CMS pages (persisted to disk)
router.get('/cms/:page', authenticate, authorize('admin','superadmin','manager'), cmsCtrl.getPage);
router.post('/cms/:page', authenticate, authorize('admin','superadmin','manager'), cmsCtrl.savePage);
router.get('/cms/:page/history', authenticate, authorize('admin','superadmin','manager'), cmsCtrl.getHistory);
router.post('/cms/:page/restore', authenticate, authorize('admin','superadmin','manager'), body('id').isNumeric().notEmpty(), cmsCtrl.restore);

export default router;
