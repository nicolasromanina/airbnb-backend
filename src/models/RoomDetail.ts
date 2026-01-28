// backend/src/models/RoomDetail.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IRoomDetail extends Document {
  roomId: number;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  guests: string;
  bedrooms: string;
  images: string[];
  features: string[];
  videoUrl?: string;
  city?: string;
  country?: string;
  location?: string;
  availability?: boolean;
  availableFrom?: string;
  capacity?: number;
  // Informations générales additionnelles
  accommodationType?: string;
  includes?: string[];
  amenities?: string[];
  selectedOptionIds?: string[];
  additionalOptions?: {
    optionId: string;
    name: string;
    price: number;
    quantity: number;
    pricingType: 'fixed' | 'per_day' | 'per_guest';
  }[];
  meta?: {
    createdAt?: Date;
    updatedAt?: Date;
    updatedBy?: string;
    version?: number;
  };
}

const RoomDetailSchema = new Schema<IRoomDetail>({
  roomId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: false,
    default: 'Apartment'
  },
  subtitle: {
    type: String,
    required: false,
    default: 'Luxury accommodation'
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  price: {
    type: Number,
    required: false,
    default: 300
  },
  guests: {
    type: String,
    required: false,
    default: 'until 4 guests'
  },
  bedrooms: {
    type: String,
    required: false,
    default: '2 bedrooms'
  },
  images: {
    type: [String],
    default: []
  },
  features: {
    type: [String],
    default: []
  },
  videoUrl: {
    type: String,
    required: false,
    default: ''
  },
  city: {
    type: String,
    required: false,
    default: 'Paris'
  },
  country: {
    type: String,
    required: false,
    default: 'France'
  },
  location: {
    type: String,
    required: false,
    default: 'City Center'
  },
  availability: {
    type: Boolean,
    required: false,
    default: true
  },
  availableFrom: {
    type: String,
    required: false,
    default: () => new Date().toISOString().split('T')[0]
  },
  capacity: {
    type: Number,
    required: false,
    default: 4
  },
  accommodationType: {
    type: String,
    required: false,
    default: 'Logement sans fumeur'
  },
  includes: {
    type: [String],
    default: ['Thé', 'Café', 'Petit déjeuner']
  },
  amenities: {
    type: [String],
    default: ['Parking sécurisé']
  },
  selectedOptionIds: {
    type: [String],
    default: []
  },
  additionalOptions: {
    type: [{
      optionId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, default: 1 },
      pricingType: { 
        type: String, 
        enum: ['fixed', 'per_day', 'per_guest'],
        default: 'fixed'
      }
    }],
    default: []
  },
  meta: {
    type: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: String, default: 'system' },
      version: { type: Number, default: 1 }
    },
    default: {}
  }
}, {
  timestamps: true
});

// Create index on roomId for fast lookups
RoomDetailSchema.index({ roomId: 1 });

export default mongoose.model<IRoomDetail>('RoomDetail', RoomDetailSchema);
