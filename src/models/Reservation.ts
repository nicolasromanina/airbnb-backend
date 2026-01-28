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
  // Amélioration: Statuts plus détaillés et réalistes
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'early_checkout' | 'dispute';
  // Nouveau: Type d'action pour distinguer annulation vs early checkout vs modification
  actionType?: 'cancellation' | 'early_checkout' | 'modification' | 'dispute_resolution' | 'checkout';
  // Nouveau: Raison de l'annulation/early checkout/dispute
  cancellationReason?: string;
  cancellationRequestedAt?: Date;
  // Nouveau: Pour les early checkouts (départ anticipé)
  actualCheckoutDate?: Date;
  earlyCheckoutReason?: string;
  // Nouveau: Pour les disputes
  disputeReason?: string;
  disputeResolution?: string;
  disputeResolvedAt?: Date;
  // Nouveau: Tracking des modifications
  originalCheckOut?: Date;
  modificationReason?: string;
  modifiedAt?: Date;
  // Nouveau: Refund info
  refundAmount?: number;
  refundPercentage?: number;
  refundProcessedAt?: Date;
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
  // Amélioration: Statuts plus détaillés
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'early_checkout', 'dispute'],
    default: 'pending'
  },
  // Nouveau: Type d'action
  actionType: {
    type: String,
    enum: ['cancellation', 'early_checkout', 'modification', 'dispute_resolution', 'checkout'],
    sparse: true
  },
  // Nouveau: Raison de l'annulation/early checkout
  cancellationReason: {
    type: String,
    sparse: true
  },
  cancellationRequestedAt: {
    type: Date,
    sparse: true
  },
  // Nouveau: Pour les early checkouts
  actualCheckoutDate: {
    type: Date,
    sparse: true
  },
  earlyCheckoutReason: {
    type: String,
    sparse: true
  },
  // Nouveau: Pour les disputes
  disputeReason: {
    type: String,
    sparse: true
  },
  disputeResolution: {
    type: String,
    sparse: true
  },
  disputeResolvedAt: {
    type: Date,
    sparse: true
  },
  // Nouveau: Tracking des modifications
  originalCheckOut: {
    type: Date,
    sparse: true
  },
  modificationReason: {
    type: String,
    sparse: true
  },
  modifiedAt: {
    type: Date,
    sparse: true
  },
  // Nouveau: Refund info
  refundAmount: {
    type: Number,
    min: 0,
    sparse: true
  },
  refundPercentage: {
    type: Number,
    min: 0,
    max: 100,
    sparse: true
  },
  refundProcessedAt: {
    type: Date,
    sparse: true
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