import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  sessionId: string;
  stripeCustomerId?: string;
  user: Types.ObjectId;
  userEmail: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded';
  reservation: Types.ObjectId;
  paymentIntentId?: string;
  stripeCheckoutData?: Record<string, any>;
  refundReason?: string;
  refundedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  stripeCustomerId: { 
    type: String 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: { 
    type: String, 
    default: 'eur' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'canceled', 'refunded'],
    default: 'pending'
  },
  reservation: { 
    type: Schema.Types.ObjectId, 
    ref: 'Reservation', 
    required: true 
  },
  paymentIntentId: { 
    type: String 
  },
  stripeCheckoutData: { 
    type: Schema.Types.Mixed 
  },
  refundReason: { 
    type: String 
  },
  refundedAt: { 
    type: Date 
  },
  metadata: { 
    type: Schema.Types.Mixed 
  }
}, {
  timestamps: true
});

// Indexes
PaymentSchema.index({ sessionId: 1 });
PaymentSchema.index({ user: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: 1 });
PaymentSchema.index({ userEmail: 1 });
PaymentSchema.index({ paymentIntentId: 1 });
PaymentSchema.index({ stripeCustomerId: 1 });

// Update reservation status when payment status changes
PaymentSchema.post('save', async function(doc) {
  if (doc.status === 'paid') {
    const { Reservation } = await import('./Reservation');
    await Reservation.findByIdAndUpdate(doc.reservation, { status: 'confirmed' });
  } else if (doc.status === 'failed' || doc.status === 'canceled') {
    const { Reservation } = await import('./Reservation');
    await Reservation.findByIdAndUpdate(doc.reservation, { status: 'cancelled' });
  }
});

export const Payment = model<IPayment>('Payment', PaymentSchema);