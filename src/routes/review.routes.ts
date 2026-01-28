import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const reviewController = new ReviewController();

// Public routes - get reviews for apartment
router.get('/apartment/:apartmentId', reviewController.getReviewsByApartment.bind(reviewController));
router.get('/:reviewId', reviewController.getReviewById.bind(reviewController));

// Protected routes - authenticated users
router.post('/', authenticate, reviewController.createReview.bind(reviewController));
router.post('/:reviewId/helpful', authenticate, reviewController.markHelpful.bind(reviewController));
router.get('/user/my-reviews', authenticate, reviewController.getUserReviews.bind(reviewController));
router.delete('/:reviewId', authenticate, reviewController.deleteReview.bind(reviewController));
router.post('/:reviewId/response', authenticate, reviewController.addReviewResponse.bind(reviewController));

// Admin routes
router.get('/admin/pending', authenticate, authorize('admin'), reviewController.getPendingReviews.bind(reviewController));
router.patch('/:reviewId/approve', authenticate, authorize('admin'), reviewController.approveReview.bind(reviewController));
router.patch('/:reviewId/reject', authenticate, authorize('admin'), reviewController.rejectReview.bind(reviewController));

export default router;
