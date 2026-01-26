import mongoose, { Schema, Document } from 'mongoose';

export interface IHeroSection {
  title: string;
  subtitle: string;
  backgroundImage: string;
  email: string;
  phone: string;
  emailIcon: string;
  phoneIcon: string;
}

export interface IFormField {
  label: string;
  placeholder: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox';
  required: boolean;
}

export interface IContactForm {
  title: string;
  fields: IFormField[];
  consentText: string;
  submitButtonText: string;
}

export interface ITestimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
}

export interface ITestimonialSection {
  title: string;
  description: string;
  testimonials: ITestimonial[];
  featuredImage: string;
  accentColor: string;
}

export interface IGalleryItem {
  image: string;
  alt: string;
  title: string;
  description: string;
}

export interface IGallerySection {
  title: string;
  description: string;
  items: IGalleryItem[];
  accentColor: string;
}

export interface IContactPage extends Document {
  heroSection: IHeroSection;
  contactForm: IContactForm;
  testimonialSection: ITestimonialSection;
  gallerySection: IGallerySection;
  meta: {
    updatedAt: Date;
    updatedBy: string;
    version: number;
  };
}

const HeroSectionSchema = new Schema<IHeroSection>({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  backgroundImage: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  emailIcon: { type: String, default: 'mail' },
  phoneIcon: { type: String, default: 'phone' }
});

const FormFieldSchema = new Schema<IFormField>({
  label: { type: String, required: true },
  placeholder: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'email', 'tel', 'textarea', 'checkbox'],
    required: true 
  },
  required: { type: Boolean, default: false }
});

const ContactFormSchema = new Schema<IContactForm>({
  title: { type: String, required: true },
  fields: [FormFieldSchema],
  consentText: { type: String, required: true },
  submitButtonText: { type: String, required: true }
});

const TestimonialSchema = new Schema<ITestimonial>({
  name: { type: String, required: true },
  role: { type: String, required: true },
  avatar: { type: String, required: true },
  quote: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 }
});

const TestimonialSectionSchema = new Schema<ITestimonialSection>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  testimonials: [TestimonialSchema],
  featuredImage: { type: String, required: true },
  accentColor: { type: String, default: '#FF2D75' }
});

const GalleryItemSchema = new Schema<IGalleryItem>({
  image: { type: String, required: true },
  alt: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
});

const GallerySectionSchema = new Schema<IGallerySection>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  items: [GalleryItemSchema],
  accentColor: { type: String, default: '#FF2D75' }
});

const ContactPageSchema = new Schema<IContactPage>({
  heroSection: { type: HeroSectionSchema, required: true },
  contactForm: { type: ContactFormSchema, required: true },
  testimonialSection: { type: TestimonialSectionSchema, required: true },
  gallerySection: { type: GallerySectionSchema, required: true },
  meta: {
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'system' },
    version: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

export default mongoose.model<IContactPage>('ContactPage', ContactPageSchema);