import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  stripeCustomerId?: string;
  phone?: string;
  isActive: boolean;
  role: 'user' | 'admin';
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true
  },
  stripeCustomerId: { 
    type: String 
  },
  phone: { 
    type: String,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'manager', 'support', 'superadmin'], 
    default: 'user' 
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret: any) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ stripeCustomerId: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: 1 });

export const User = model<IUser>('User', UserSchema);