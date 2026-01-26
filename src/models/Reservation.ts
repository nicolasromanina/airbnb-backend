import { Schema, model, Document, Types } from 'mongoose';

export interface IReservation extends Document {
  user: Types.ObjectId;
  apartmentId: number;
  apartmentNumber: string;
  title: string;
  description?: string;
  image: string;
  includes: string[];
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  bedrooms: number;
  totalPrice: number;
  pricePerNight: number;
  additionalOptions: Array<{
    optionId: Types.ObjectId;
    name: string;
    price: number;
    quantity: number; // Pour les options per_day ou per_guest
  }>;
  additionalOptionsPrice: number;
  payment?: Types.ObjectId;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  apartmentId: { 
    type: Number, 
    required: true 
  },
  apartmentNumber: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  image: { 
    type: String, 
    required: true 
  },
  includes: [{ 
    type: String 
  }],
  checkIn: { 
    type: Date, 
    required: true 
  },
  checkOut: { 
    type: Date, 
    required: true 
  },
  nights: { 
    type: Number, 
    required: true,
    min: 1
  },
  guests: { 
    type: Number, 
    required: true,
    min: 1
  },
  bedrooms: { 
    type: Number, 
    required: true,
    min: 1
  },
  totalPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  pricePerNight: { 
    type: Number, 
    required: true,
    min: 0
  },
  additionalOptions: [{
    optionId: {
      type: Schema.Types.ObjectId,
      ref: 'AdditionalOption'
    },
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 }
  }],
  additionalOptionsPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  payment: { 
    type: Schema.Types.ObjectId, 
    ref: 'Payment' 
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  specialRequests: { 
    type: String 
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
ReservationSchema.index({ user: 1 });
ReservationSchema.index({ apartmentId: 1 });
ReservationSchema.index({ status: 1 });
ReservationSchema.index({ checkIn: 1 });
ReservationSchema.index({ checkOut: 1 });
ReservationSchema.index({ createdAt: 1 });
ReservationSchema.index({ user: 1, status: 1 });
ReservationSchema.index({ apartmentId: 1, checkIn: 1, checkOut: 1 });

// Virtual for date range validation
ReservationSchema.pre('save', function(next) {
  if (this.checkIn >= this.checkOut) {
    next(new Error('Check-in date must be before check-out date'));
  }
  next();
});

export const Reservation = model<IReservation>('Reservation', ReservationSchema);