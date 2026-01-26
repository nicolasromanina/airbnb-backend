// models/ApartmentDetailPage.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IGalleryImage {
  src: string;
  alt: string;
}

export interface IFeatureItem {
  id: string;
  text: string;
}

export interface IApartmentDetailPage extends Document {
  apartmentId: number;
  
  // Hero Section
  hero: {
    title: string;
    subtitle: string;
    description: string;
    price: number;
    guests: string;
    bedrooms: string;
    mainImage: string;
    galleryImages: string[];
  };
  
  // Details Section
  details: {
    title: string;
    subtitle: string;
    description: string;
    highlights: string[];
    features: IFeatureItem[];
  };
  
  // Gallery Section
  gallery: {
    title: string;
    subtitle: string;
    images: IGalleryImage[];
    buttonText: string;
  };
  
  // Last Section
  lastSection: {
    title: string;
    description: string;
    features: IFeatureItem[];
    image: string;
    tagline: string;
  };
  
  // Options associées
  additionalOptions?: string[]; // IDs des options supplémentaires
  
  // Métadonnées
  meta: {
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
    version: number;
  };
}

const GalleryImageSchema = new Schema<IGalleryImage>({
  src: { type: String, required: true },
  alt: { type: String, required: true }
}, { _id: false });

const FeatureItemSchema = new Schema<IFeatureItem>({
  id: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

// Schémas pour les sections imbriquées
const HeroSchema = new Schema({
  title: { 
    type: String, 
    required: true, 
    default: 'Luxury Apartment' 
  },
  subtitle: { 
    type: String, 
    required: true, 
    default: 'Experience premium comfort and style' 
  },
  description: { 
    type: String, 
    required: true,
    default: 'Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus.'
  },
  price: { 
    type: Number, 
    required: true, 
    default: 300 
  },
  guests: { 
    type: String, 
    required: true, 
    default: "jusqu'à 4 invités" 
  },
  bedrooms: { 
    type: String, 
    required: true, 
    default: "2 chambres à coucher" 
  },
  mainImage: { 
    type: String, 
    required: true, 
    default: '/assets/apartment-detail-main.jpg' 
  },
  galleryImages: [{ type: String }]
}, { _id: false });

const DetailsSchema = new Schema({
  title: { 
    type: String, 
    required: true, 
    default: 'Détails de l\'appartement' 
  },
  subtitle: { 
    type: String, 
    default: 'Class aptent taciti per inceptos himenaeos.' 
  },
  description: { 
    type: String, 
    required: true,
    default: 'Maecenas eget condimentum velit, sit amet feugiat lectus.'
  },
  highlights: [{ type: String }],
  features: [FeatureItemSchema]
}, { _id: false });

const GallerySchema = new Schema({
  title: { 
    type: String, 
    required: true, 
    default: 'Nunc vulputate libero et' 
  },
  subtitle: { 
    type: String, 
    default: 'velit interdum, ac aliquet odio mattis.' 
  },
  images: [GalleryImageSchema],
  buttonText: { 
    type: String, 
    default: 'Nous contacter' 
  }
}, { _id: false });

const LastSectionSchema = new Schema({
  title: { 
    type: String, 
    required: true, 
    default: 'Consectetur ipsum elit' 
  },
  description: { 
    type: String, 
    default: 'Sorem ipsum dolor sit amet, consectetur adipiscing elit.' 
  },
  features: [FeatureItemSchema],
  image: { 
    type: String, 
    default: '/assets/apartment-last-section.jpg' 
  },
  tagline: { 
    type: String, 
    default: 'Consectetur adipiscing' 
  }
}, { _id: false });

const MetaSchema = new Schema({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'system' },
  version: { type: Number, default: 1 }
}, { _id: false });

const ApartmentDetailPageSchema = new Schema<IApartmentDetailPage>({
  apartmentId: { 
    type: Number, 
    required: true, 
    unique: true 
  },
  
  hero: { type: HeroSchema, required: true },
  details: { type: DetailsSchema, required: true },
  gallery: { type: GallerySchema, required: true },
  lastSection: { type: LastSectionSchema, required: true },
  additionalOptions: [{ type: String }],
  meta: { type: MetaSchema, required: true }
}, {
  timestamps: true
});

// Créer un index sur apartmentId pour des recherches rapides
ApartmentDetailPageSchema.index({ apartmentId: 1 });

export default mongoose.model<IApartmentDetailPage>('ApartmentDetailPage', ApartmentDetailPageSchema);