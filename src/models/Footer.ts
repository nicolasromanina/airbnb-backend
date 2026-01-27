import mongoose, { Schema, Document } from 'mongoose';

export interface IGalleryImage {
  _id?: mongoose.Types.ObjectId;
  image: string;
  cloudinaryPublicId: string;
  alt: string;
  order: number;
}

export interface ILinkGroup {
  title: string;
  links: Array<{
    text: string;
    url: string;
  }>;
}

export interface IFooterData extends Document {
  // Galerie d'images
  galleryImages: IGalleryImage[];
  
  // Liens utiles
  usefulLinks: ILinkGroup;
  
  // Pages légales
  legalPages: ILinkGroup;
  
  // Bannière visuelle
  visualBanner: {
    title: string;
    backgroundColor: string;
  };
  
  // Copyright
  copyright: {
    text: string;
    designText: string;
  };
  
  // Logo
  logo: {
    url: string;
    cloudinaryPublicId: string;
    alt: string;
  };
  
  // Métadonnées
  meta: {
    updatedAt: Date;
    updatedBy: string;
    version: number;
  };
}

const GalleryImageSchema = new Schema<IGalleryImage>({
  image: { type: String, required: true },
  cloudinaryPublicId: { type: String, required: true },
  alt: { type: String, required: true },
  order: { type: Number, default: 0 }
});

const LinkSchema = new Schema({
  text: { type: String, required: true },
  url: { type: String, required: true }
});

const LinkGroupSchema = new Schema<ILinkGroup>({
  title: { type: String, required: true },
  links: [LinkSchema]
});

const FooterDataSchema = new Schema<IFooterData>({
  galleryImages: [GalleryImageSchema],
  usefulLinks: { type: LinkGroupSchema, required: true },
  legalPages: { type: LinkGroupSchema, required: true },
  visualBanner: {
    title: { type: String, required: true },
    backgroundColor: { type: String, default: '#E5E5E5' }
  },
  copyright: {
    text: { type: String, required: true },
    designText: { type: String, required: true }
  },
  logo: {
    url: { type: String, required: true },
    cloudinaryPublicId: { type: String },
    alt: { type: String, default: 'Logo' }
  },
  meta: {
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'system' },
    version: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

// Index pour récupération rapide
FooterDataSchema.index({ 'meta.updatedAt': -1 });

export default mongoose.model<IFooterData>('Footer', FooterDataSchema);