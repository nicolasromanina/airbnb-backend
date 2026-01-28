import { Schema, model, Document, Types } from 'mongoose';

export interface IAvailability extends Document {
  apartmentId: number;
  apartmentTitle: string;
  dateFrom: Date;
  dateTo: Date;
  isAvailable: boolean;
  blockedReason?: string; // Maintenance, unavailable, etc.
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>({
  apartmentId: {
    type: Number,
    required: true,
    index: true
  },
  apartmentTitle: {
    type: String,
    required: true
  },
  dateFrom: {
    type: Date,
    required: true,
    index: true
  },
  dateTo: {
    type: Date,
    required: true,
    index: true
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  blockedReason: {
    type: String,
    enum: ['maintenance', 'cleaning', 'unavailable', 'private', 'reserved'],
    default: 'unavailable'
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

// Compound index for efficient availability queries
AvailabilitySchema.index({ apartmentId: 1, dateFrom: 1, dateTo: 1 });
AvailabilitySchema.index({ apartmentId: 1, isAvailable: 1 });

// Helper method to check if date is available
AvailabilitySchema.statics.isDateAvailable = async function(
  apartmentId: number,
  checkInDate: Date,
  checkOutDate: Date
) {
  const conflictingBlocks = await this.findOne({
    apartmentId,
    isAvailable: false,
    $or: [
      { dateFrom: { $lt: checkOutDate }, dateTo: { $gt: checkInDate } }
    ]
  });

  return !conflictingBlocks;
};

// Helper method to block dates
AvailabilitySchema.statics.blockDates = async function(
  apartmentId: number,
  dateFrom: Date,
  dateTo: Date,
  reason: string = 'unavailable'
) {
  return this.create({
    apartmentId,
    dateFrom,
    dateTo,
    isAvailable: false,
    blockedReason: reason
  });
};

// Helper method to unblock dates
AvailabilitySchema.statics.unblockDates = async function(
  apartmentId: number,
  dateFrom: Date,
  dateTo: Date
) {
  return this.updateMany(
    {
      apartmentId,
      dateFrom: { $gte: dateFrom },
      dateTo: { $lte: dateTo },
      isAvailable: false
    },
    { isAvailable: true }
  );
};

export const Availability = model<IAvailability>('Availability', AvailabilitySchema);
