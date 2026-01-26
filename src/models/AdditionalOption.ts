import { Schema, model, Document } from 'mongoose';

export interface IAdditionalOption extends Document {
  name: string;
  description: string;
  category: 'service' | 'modification' | 'insurance' | 'commodity';
  price: number; // Prix en euros
  pricingType: 'fixed' | 'per_day' | 'per_guest'; // Comment est facturisé
  icon?: string;
  isActive: boolean;
  apartmentIds?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const AdditionalOptionSchema = new Schema<IAdditionalOption>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['service', 'modification', 'insurance', 'commodity'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    pricingType: {
      type: String,
      enum: ['fixed', 'per_day', 'per_guest'],
      default: 'fixed',
    },
    icon: {
      type: String,
    },
    apartmentIds: {
      type: [Number],
      default: undefined,
      description: 'Optional list of apartment IDs this option applies to (empty = global)'
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AdditionalOption = model<IAdditionalOption>(
  'AdditionalOption',
  AdditionalOptionSchema
);
