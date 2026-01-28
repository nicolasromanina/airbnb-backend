import { Schema, model, Document, Types } from 'mongoose';

export interface IBookingAnalytics extends Document {
  month: number; // 1-12
  year: number;
  totalBookings: number;
  totalRevenue: number;
  averageRevenuePerBooking: number;
  apartmentStats: Array<{
    apartmentId: number;
    apartmentTitle: string;
    bookings: number;
    revenue: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const BookingAnalyticsSchema = new Schema<IBookingAnalytics>({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    index: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  averageRevenuePerBooking: {
    type: Number,
    default: 0
  },
  apartmentStats: [
    {
      apartmentId: Number,
      apartmentTitle: String,
      bookings: Number,
      revenue: Number
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Composite index for month/year queries
BookingAnalyticsSchema.index({ month: 1, year: 1 }, { unique: true });
BookingAnalyticsSchema.index({ year: 1 });

export const BookingAnalytics = model<IBookingAnalytics>(
  'BookingAnalytics',
  BookingAnalyticsSchema
);
