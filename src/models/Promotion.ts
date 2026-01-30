import { Schema, model, Document, Types } from 'mongoose';

export interface IPromotion extends Document {
  roomId: number;
  title: string;
  description: string;
  image: string;
  cardImage: string;
  badge: {
    label: string;
    color: string;
  };
  features: Array<{
    text: string;
    icon?: string;
  }>;
  bottomMessage: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>({
  roomId: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.'
  },
  description: {
    type: String,
    required: true,
    default: 'Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.'
  },
  image: {
    type: String,
    required: true,
    default: '/assets/bedroom-promo.jpg'
  },
  cardImage: {
    type: String,
    required: false,
    default: '/assets/promo-card.jpg'
  },
  badge: {
    label: {
      type: String,
      default: 'Option Premium'
    },
    color: {
      type: String,
      default: '#10b981'
    }
  },
  features: [{
    text: String,
    icon: String
  }],
  bottomMessage: {
    type: String,
    default: 'Cette option premium est automatiquement incluse dans votre réservation. Aucun coût supplémentaire.'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export const Promotion = model<IPromotion>('Promotion', PromotionSchema);
