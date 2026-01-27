// models/ContactMessage.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IContactMessage extends Document {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, required: true },
  consent: { type: Boolean, required: true, default: false },
  status: { 
    type: String, 
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  }
}, {
  timestamps: true
});

export default mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);