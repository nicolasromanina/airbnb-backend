import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceHeroSection {
  titleLine1: string;
  titleLine2: string;
  titleLine3: string;
  description: string;
  backgroundImage: string;
}

export interface IServiceComposition {
  mainImage: string;
  secondaryImage: string;
  title: string;
  description: string;
  features: Array<{
    icon: string;
    title: string;
  }>;
  decorativeElements: {
    pinkSquare: string;
    blackSquare: string;
  };
}

export interface IServiceCTASection {
  title: string;
  description: string;
  buttonText: string;
  image: string;
  featureCards: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  layout: 'split' | 'grid';
}

export interface IServiceFeaturesSection {
  title: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  decorativeText: string;
  backgroundColor: string;
}

export interface IServiceDarkSection {
  title: string;
  subtitle: string;
  description: string;
  image1: string;
  image2: string;
  buttonText: string;
  accentColor: string;
  features: Array<{
    id: string;
    text: string;
  }>;
}

export interface IServiceFAQ {
  questions: Array<{
    question: string;
    answer: string;
  }>;
  title: string;
  description: string;
  image: string;
  decorativeElements: {
    pinkSquare: string;
    blackSquare: string;
  };
}

export interface IServiceGallery {
  mainImage: string;
  secondaryImages: string[];
  title: string;
  description: string;
  backgroundColor: string;
  decorativeElements: {
    pinkSquare: string;
    blackSquare: string;
  };
}

export interface IServicePage extends Document {
  service1: {
    heroSection: IServiceHeroSection;
    compositionSection: IServiceComposition;
    ctaSection: IServiceCTASection;
    featuresSection: IServiceFeaturesSection;
    darkSection: IServiceDarkSection;
  };
  service2: {
    faqSection: IServiceFAQ;
    gallerySection: IServiceGallery;
  };
  meta: {
    updatedAt: Date;
    updatedBy: string;
    version: number;
  };
}

// Schéma Hero Section
const ServiceHeroSectionSchema = new Schema<IServiceHeroSection>({
  titleLine1: { type: String, required: true, default: 'CONSECT' },
  titleLine2: { type: String, required: true, default: 'ADIPISCING' },
  titleLine3: { type: String, required: true, default: 'ELIT.' },
  description: { 
    type: String, 
    required: true, 
    default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum.' 
  },
  backgroundImage: { 
    type: String, 
    required: true, 
    default: '/assets/hero-service.png' 
  }
});

// Schéma Composition Section
const ServiceFeatureSchema = new Schema({
  icon: { type: String, required: true, default: 'Gem' },
  title: { type: String, required: true, default: 'Inceptos' }
});

const ServiceCompositionSchema = new Schema<IServiceComposition>({
  mainImage: { type: String, required: true, default: '/assets/livingroom-service-1.png' },
  secondaryImage: { type: String, required: true, default: '/assets/badroom-service-1.png' },
  title: { type: String, required: true, default: 'Lorem ipsum dolor sit.' },
  description: { 
    type: String, 
    required: true, 
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent.' 
  },
  features: [ServiceFeatureSchema],
  decorativeElements: {
    pinkSquare: { type: String, default: '#FF1675' },
    blackSquare: { type: String, default: '#000000' }
  }
});

// Schéma CTA Section
const ServiceFeatureCardSchema = new Schema({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
});

const ServiceCTASectionSchema = new Schema<IServiceCTASection>({
  title: { 
    type: String, 
    required: true, 
    default: 'Adipiscing elit amet consectetur.' 
  },
  description: { 
    type: String, 
    required: true, 
    default: 'Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.' 
  },
  buttonText: { type: String, required: true, default: 'Reserver' },
  image: { type: String, required: true, default: '/assets/bedroom-service-2.png' },
  featureCards: [ServiceFeatureCardSchema],
  layout: { type: String, enum: ['split', 'grid'], default: 'split' }
});

// Schéma Features Section
const ServiceFeaturesItemSchema = new Schema({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
});

const ServiceFeaturesSectionSchema = new Schema<IServiceFeaturesSection>({
  title: { 
    type: String, 
    required: true, 
    default: 'Lorem ipsum dolor sit amet.' 
  },
  features: [ServiceFeaturesItemSchema],
  decorativeText: { 
    type: String, 
    default: 'Lorem ipsum dolor' 
  },
  backgroundColor: { type: String, default: '#FAFAFA' }
});

// Schéma Dark Section
const ServiceDarkFeatureSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true }
});

const ServiceDarkSectionSchema = new Schema<IServiceDarkSection>({
  title: { 
    type: String, 
    required: true, 
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.' 
  },
  subtitle: { type: String, required: true, default: 'Worem ipsum dolor sit amet' },
  description: { 
    type: String, 
    required: true, 
    default: 'Qorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent.' 
  },
  image1: { type: String, required: true, default: '/assets/bedroom-service-3.png' },
  image2: { type: String, required: true, default: '/assets/livingroom-service-2.png' },
  buttonText: { type: String, required: true, default: 'Reserver maintenant' },
  accentColor: { type: String, default: '#FF2E63' },
  features: [ServiceDarkFeatureSchema]
});

// Schéma FAQ Section
const ServiceFAQItemSchema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
});

const ServiceFAQSchema = new Schema<IServiceFAQ>({
  questions: [ServiceFAQItemSchema],
  title: { 
    type: String, 
    required: true, 
    default: 'Elit amet, consectetur tempus at turpis' 
  },
  description: { 
    type: String, 
    required: true, 
    default: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' 
  },
  image: { type: String, required: true, default: '/assets/livingroom-service-3.png' },
  decorativeElements: {
    pinkSquare: { type: String, default: '#FF2E63' },
    blackSquare: { type: String, default: '#000000' }
  }
});

// Schéma Gallery Section
const ServiceGallerySchema = new Schema<IServiceGallery>({
  mainImage: { type: String, required: true, default: '/assets/bedroom-service-4.png' },
  secondaryImages: [{ type: String }],
  title: { 
    type: String, 
    required: true, 
    default: 'Aptent taciti sociosqu ad litora' 
  },
  description: { 
    type: String, 
    required: true, 
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.' 
  },
  backgroundColor: { type: String, default: '#F5F5F5' },
  decorativeElements: {
    pinkSquare: { type: String, default: '#FF2E63' },
    blackSquare: { type: String, default: '#000000' }
  }
});

// Schéma Service1
const Service1Schema = new Schema({
  heroSection: { type: ServiceHeroSectionSchema, required: true },
  compositionSection: { type: ServiceCompositionSchema, required: true },
  ctaSection: { type: ServiceCTASectionSchema, required: true },
  featuresSection: { type: ServiceFeaturesSectionSchema, required: true },
  darkSection: { type: ServiceDarkSectionSchema, required: true }
});

// Schéma Service2
const Service2Schema = new Schema({
  faqSection: { type: ServiceFAQSchema, required: true },
  gallerySection: { type: ServiceGallerySchema, required: true }
});

// Schéma principal de la Service Page
const ServicePageSchema = new Schema<IServicePage>({
  service1: { type: Service1Schema, required: true },
  service2: { type: Service2Schema, required: true },
  meta: {
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'system' },
    version: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

export default mongoose.model<IServicePage>('ServicePage', ServicePageSchema);