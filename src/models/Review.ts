import { Schema, model, Document, Types } from 'mongoose';

export interface IReviewResponse extends Document {
  text: string;
  author: Types.ObjectId; // Usually the property owner
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReview extends Document {
  reservation: Types.ObjectId;
  apartment: {
    id: number;
    title: string;
    image: string;
  };
  author: Types.ObjectId;
  authorName: string;
  authorEmail: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  categories?: {
    cleanliness: number;
    communication: number;
    checkIn: number;
    accuracy: number;
    location: number;
    value: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  isVerifiedBooking: boolean;
  helpful: number; // Count of helpful votes
  unhelpful: number; // Count of unhelpful votes
  response?: IReviewResponse;
  photos?: string[]; // URLs of uploaded photos
  createdAt: Date;
  updatedAt: Date;
}

const ReviewResponseSchema = new Schema<IReviewResponse>({
  text: {
    type: String,
    required: true,
    maxlength: 2000
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const ReviewSchema = new Schema<IReview>({
  reservation: {
    type: Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true,
    index: true
  },
  apartment: {
    id: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: false
    }
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  comment: {
    type: String,
    required: true,
    maxlength: 5000
  },
  categories: {
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    checkIn: {
      type: Number,
      min: 1,
      max: 5
    },
    accuracy: {
      type: Number,
      min: 1,
      max: 5
    },
    location: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  isVerifiedBooking: {
    type: Boolean,
    default: true
  },
  helpful: {
    type: Number,
    default: 0
  },
  unhelpful: {
    type: Number,
    default: 0
  },
  response: ReviewResponseSchema,
  photos: [String],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for common queries
ReviewSchema.index({ apartment: 1, status: 1 });
ReviewSchema.index({ author: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ reservation: 1, author: 1 }, { unique: true });

// Calculate average rating middleware
ReviewSchema.post('save', async function(doc) {
  const Review = model<IReview>('Review', ReviewSchema);
  const stats = await Review.aggregate([
    {
      $match: {
        'apartment.id': doc.apartment.id,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$apartment.id',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    const RoomDetail = (await import('./RoomDetail')).default;
    await RoomDetail.findOneAndUpdate(
      { roomId: doc.apartment.id },
      {
        $set: {
          'meta.averageRating': stats[0].avgRating,
          'meta.reviewCount': stats[0].totalReviews
        }
      }
    );
  }
});

export const Review = model<IReview>('Review', ReviewSchema);
