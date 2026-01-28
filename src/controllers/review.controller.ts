import { Request, Response } from 'express';
import { Review, IReview } from '../models/Review';
import { Reservation } from '../models/Reservation';
import { User } from '../models/User';
import RoomDetail from '../models/RoomDetail';

export class ReviewController {
  // Create a new review for a reservation
  async createReview(req: Request, res: Response) {
    try {
      const { reservationId, rating, title, comment, categories, photos } = req.body;
      const userId = (req as any).user._id;

      // Verify reservation exists and belongs to user
      const reservation = await Reservation.findById(reservationId).populate('user');
      if (!reservation || reservation.user._id.toString() !== userId.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({
        reservation: reservationId,
        author: userId
      });
      if (existingReview) {
        return res.status(400).json({ error: 'Review already exists for this reservation' });
      }

      // Create review
      const review = new Review({
        reservation: reservationId,
        apartment: {
          id: reservation.apartmentId,
          title: reservation.title,
          image: reservation.image
        },
        author: userId,
        authorName: (req as any).user.name || (req as any).user.email,
        authorEmail: (req as any).user.email,
        rating,
        title,
        comment,
        categories,
        photos: photos || [],
        isVerifiedBooking: true
      });

      await review.save();

      res.status(201).json({
        message: 'Review created successfully',
        review
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  }

  // Get reviews for an apartment
  async getReviewsByApartment(req: Request, res: Response) {
    try {
      const { apartmentId } = req.params;
      const { status = 'approved', sortBy = 'recent' } = req.query;

      let sortOption: any = { createdAt: -1 };
      if (sortBy === 'helpful') {
        sortOption = { helpful: -1 };
      } else if (sortBy === 'rating') {
        sortOption = { rating: -1 };
      }

      const reviews = await Review.find({
        'apartment.id': parseInt(apartmentId),
        status: status || 'approved'
      })
        .populate('author', 'name email avatar')
        .sort(sortOption)
        .lean();

      // Calculate aggregate stats
      const stats = reviews.reduce(
        (acc, review) => {
          acc.totalReviews++;
          acc.averageRating += review.rating;
          if (review.categories) {
            acc.categories.cleanliness += review.categories.cleanliness || 0;
            acc.categories.communication += review.categories.communication || 0;
            acc.categories.checkIn += review.categories.checkIn || 0;
            acc.categories.accuracy += review.categories.accuracy || 0;
            acc.categories.location += review.categories.location || 0;
            acc.categories.value += review.categories.value || 0;
          }
          return acc;
        },
        {
          totalReviews: 0,
          averageRating: 0,
          categories: {
            cleanliness: 0,
            communication: 0,
            checkIn: 0,
            accuracy: 0,
            location: 0,
            value: 0
          }
        }
      );

      if (stats.totalReviews > 0) {
        stats.averageRating = Math.round((stats.averageRating / stats.totalReviews) * 10) / 10;
        Object.keys(stats.categories).forEach((key) => {
          stats.categories[key as keyof typeof stats.categories] = Math.round(
            (stats.categories[key as keyof typeof stats.categories] / stats.totalReviews) * 10
          ) / 10;
        });
      }

      res.json({
        reviews,
        stats
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  // Get review by ID
  async getReviewById(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;
      const review = await Review.findById(reviewId)
        .populate('author', 'name email avatar')
        .populate('response.author', 'name email avatar');

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json(review);
    } catch (error) {
      console.error('Error fetching review:', error);
      res.status(500).json({ error: 'Failed to fetch review' });
    }
  }

  // Add response to review (owner/admin only)
  async addReviewResponse(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;
      const { text } = req.body;
      const userId = (req as any).user._id;

      const review = await Review.findById(reviewId).populate('apartment');

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Verify user is owner of the apartment
      // TODO: Add proper ownership verification

      review.response = {
        text,
        author: userId as any,
        authorName: (req as any).user.name || (req as any).user.email,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;

      await review.save();

      res.json({
        message: 'Response added successfully',
        review
      });
    } catch (error) {
      console.error('Error adding response:', error);
      res.status(500).json({ error: 'Failed to add response' });
    }
  }

  // Approve review (admin only)
  async approveReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByIdAndUpdate(
        reviewId,
        { status: 'approved' },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json({
        message: 'Review approved',
        review
      });
    } catch (error) {
      console.error('Error approving review:', error);
      res.status(500).json({ error: 'Failed to approve review' });
    }
  }

  // Reject review (admin only)
  async rejectReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByIdAndUpdate(
        reviewId,
        { status: 'rejected' },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json({
        message: 'Review rejected',
        review
      });
    } catch (error) {
      console.error('Error rejecting review:', error);
      res.status(500).json({ error: 'Failed to reject review' });
    }
  }

  // Mark review as helpful
  async markHelpful(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;

      const review = await Review.findByIdAndUpdate(
        reviewId,
        { $inc: { helpful: 1 } },
        { new: true }
      );

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      res.json({
        message: 'Review marked as helpful',
        helpful: review.helpful
      });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      res.status(500).json({ error: 'Failed to mark review as helpful' });
    }
  }

  // Get reviews pending moderation (admin only)
  async getPendingReviews(req: Request, res: Response) {
    try {
      const reviews = await Review.find({ status: 'pending' })
        .populate('author', 'name email')
        .sort({ createdAt: -1 });

      res.json({
        total: reviews.length,
        reviews
      });
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      res.status(500).json({ error: 'Failed to fetch pending reviews' });
    }
  }

  // Get user's reviews
  async getUserReviews(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id;

      const reviews = await Review.find({ author: userId })
        .populate('reservation')
        .sort({ createdAt: -1 });

      res.json(reviews);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      res.status(500).json({ error: 'Failed to fetch user reviews' });
    }
  }

  // Delete review (owner or admin only)
  async deleteReview(req: Request, res: Response) {
    try {
      const { reviewId } = req.params;
      const userId = (req as any).user._id;
      const userRole = (req as any).user.role;

      const review = await Review.findById(reviewId);

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Check authorization
      if (review.author.toString() !== userId.toString() && userRole !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      await Review.findByIdAndDelete(reviewId);

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ error: 'Failed to delete review' });
    }
  }
}
