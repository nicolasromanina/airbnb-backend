import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const analyticsController = new AnalyticsController();

// All analytics routes require admin authentication
router.use(authenticate, authorize('admin'));

router.get('/dashboard/stats', analyticsController.getDashboardStats.bind(analyticsController));
router.get('/revenue/monthly', analyticsController.getMonthlyRevenueChart.bind(analyticsController));
router.get('/apartments', analyticsController.getApartmentStats.bind(analyticsController));
router.get('/trends', analyticsController.getBookingTrends.bind(analyticsController));
router.get('/reviews', analyticsController.getReviewAnalytics.bind(analyticsController));

export default router;
