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
  // Informations générales additionnelles
  accommodationType?: string;
  includes?: string[];
  amenities?: string[];
  selectedOptionIds?: string[];
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
