import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom {
  id: number;
  image: string;
  title: string;
  description: string;
  guests: string;
  bedrooms: string;
}

export interface IHeroSection {
  titleLine1: string;
  titleLine2: string;
  titleLine3: string;
  description: string;
  backgroundImage: string;
}

export interface IRoomsSection {
  title: string;
  description: string;
  rooms: IRoom[];
  loadMoreText: string;
  showLessText: string;
  backToTopText: string;
}

export interface IFeatureCard {
  title: string;
  footer?: string;
  description?: string;
}

export interface IFeatureSection {
  mainTitle: string;
  mainDescription: string;
  darkCard: IFeatureCard;
  lightCard: IFeatureCard;
  images: {
    small: string;
    large: string;
  };
  footerTexts: string[];
}

export interface IShowcaseSection {
  title: string;
  description: string;
  image: string;
  checkItems: Array<{ text: string }>;
  decorativeElements: {
    grayRectangle: string;
    pinkSquare: string;
  };
}

export interface IPerfectShowSection {
  title: string;
  description: string;
  buttonText: string;
  images: {
    main: string;
    view: string;
    detail: string;
  };
  footerText: string;
}

export interface IMarqueeSection {
  text: string;
  backgroundColor: string;
  textColor: string;
}

export interface IVideoSection {
  coverImage: string;
  videoUrl: string;
  playButtonText: string;
  overlayColor: string;
  galleryImages: string[];
}

export interface IFinalSection {
  title: string;
  subtitle: string;
  text1: string;
  text2: string;
  images: string[];
}

export interface IApartmentPage extends Document {
  heroSection: IHeroSection;
  roomsSection: IRoomsSection;
  featureSection: IFeatureSection;
  showcaseSection: IShowcaseSection;
  perfectShowSection: IPerfectShowSection;
  marqueeSection: IMarqueeSection;
  videoSection: IVideoSection;
  finalSection: IFinalSection;
  meta: {
    updatedAt: Date;
    updatedBy: string;
    version: number;
  };
}

// Schéma Room
const RoomSchema = new Schema<IRoom>({
  id: { type: Number, required: true },
  image: { type: String, required: true, default: '/assets/room-default.jpg' },
  title: { type: String, required: true, default: 'Nouvelle chambre' },
  description: { type: String, required: true, default: 'Description de la chambre' },
  guests: { type: String, required: true, default: 'jusqu\'à 2 invités' },
  bedrooms: { type: String, required: true, default: '1 chambre à coucher' }
});

// Schéma Hero Section
const HeroSectionSchema = new Schema<IHeroSection>({
  titleLine1: { type: String, required: true, default: 'INTERDUM,' },
  titleLine2: { type: String, required: true, default: 'AC ALIQUET' },
  titleLine3: { type: String, required: true, default: 'ODIO MATTIS.' },
  description: { 
    type: String, 
    required: true, 
    default: 'Norem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.' 
  },
  backgroundImage: { 
    type: String, 
    required: true, 
    default: '/assets/hero-room.jpg' 
  }
});

// Schéma Rooms Section
const RoomsSectionSchema = new Schema<IRoomsSection>({
  title: { 
    type: String, 
    required: true, 
    default: 'Adipiscing elit amet consectetur.' 
  },
  description: { 
    type: String, 
    required: true, 
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.' 
  },
  rooms: [RoomSchema],
  loadMoreText: { type: String, default: 'Affichez plus de chambres (+6)' },
  showLessText: { type: String, default: 'Réduire l\'affichage' },
  backToTopText: { type: String, default: 'Retour en haut' }
});

// Schéma Feature Section
const FeatureCardSchema = new Schema<IFeatureCard>({
  title: { type: String, required: true },
  footer: { type: String },
  description: { type: String }
});

const FeatureSectionSchema = new Schema<IFeatureSection>({
  mainTitle: { 
    type: String, 
    required: true, 
    default: 'Consectetur ipsum elit' 
  },
  mainDescription: { 
    type: String, 
    required: true, 
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.' 
  },
  darkCard: {
    title: { 
      type: String, 
      default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.' 
    },
    footer: { type: String, default: 'Amet, consectetur adipiscing elit.' }
  },
  lightCard: {
    title: { type: String, default: 'Nunc vulputate libero' },
    description: { type: String, default: 'Rorem ipsum dolor sit amet, consectetur adipiscing elit' }
  },
  images: {
    small: { type: String, default: '/assets/bedroom-small.jpg' },
    large: { type: String, default: '/assets/bedroom-large.jpg' }
  },
  footerTexts: [{ type: String }]
});

// Schéma Showcase Section
const CheckItemSchema = new Schema({
  text: { type: String, required: true }
});

const ShowcaseSectionSchema = new Schema<IShowcaseSection>({
  title: { 
    type: String, 
    required: true, 
    default: 'Elit amet, consectetur' 
  },
  description: { 
    type: String, 
    required: true, 
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.' 
  },
  image: { type: String, default: '/assets/appartement-photo.png' },
  checkItems: [CheckItemSchema],
  decorativeElements: {
    grayRectangle: { type: String, default: '#9CA3AF' },
    pinkSquare: { type: String, default: '#FF2E63' }
  }
});

// Schéma Perfect Show Section
const PerfectShowSectionSchema = new Schema<IPerfectShowSection>({
  title: { 
    type: String, 
    required: true, 
    default: 'Class aptent taciti sociosqu ad litora torquent.' 
  },
  description: { 
    type: String, 
    required: true, 
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.' 
  },
  buttonText: { type: String, default: 'Réserver maintenant' },
  images: {
    main: { type: String, default: '/assets/hotel-room-main.jpg' },
    view: { type: String, default: '/assets/hotel-room-view.jpg' },
    detail: { type: String, default: '/assets/hotel-room-detail.jpg' }
  },
  footerText: { 
    type: String, 
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia' 
  }
});

// Schéma Marquee Section
const MarqueeSectionSchema = new Schema<IMarqueeSection>({
  text: { type: String, default: 'Lorem ipsum dolor •' },
  backgroundColor: { type: String, default: '#FAFAFA' },
  textColor: { type: String, default: 'hsla(0, 0%, 10%, 0.15)' }
});

// Schéma Video Section
const VideoSectionSchema = new Schema<IVideoSection>({
  coverImage: { type: String, default: '/assets/video-cover.jpg' },
  videoUrl: { type: String, default: '' },
  playButtonText: { type: String, default: 'Play Tour' },
  overlayColor: { type: String, default: 'rgba(0,0,0,0.1)' },
  galleryImages: { type: [String], default: [] }
});

// Schéma Final Section
const FinalSectionSchema = new Schema<IFinalSection>({
  title: { 
    type: String, 
    required: true, 
    default: 'ADIPISCING ELIT AMET, CONSECTETUR.' 
  },
  subtitle: { type: String, default: 'Nunc vulputate libero' },
  text1: { type: String, default: 'Class aptent taciti sociosqu ad litora torquent.' },
  text2: { 
    type: String, 
    default: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.' 
  },
  images: [{ type: String }]
});

// Schéma principal de la Apartment Page
const ApartmentPageSchema = new Schema<IApartmentPage>({
  heroSection: { type: HeroSectionSchema, required: true },
  roomsSection: { type: RoomsSectionSchema, required: true },
  featureSection: { type: FeatureSectionSchema, required: true },
  showcaseSection: { type: ShowcaseSectionSchema, required: true },
  perfectShowSection: { type: PerfectShowSectionSchema, required: true },
  marqueeSection: { type: MarqueeSectionSchema, required: true },
  videoSection: { type: VideoSectionSchema, required: true },
  finalSection: { type: FinalSectionSchema, required: true },
  meta: {
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'system' },
    version: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

export default mongoose.model<IApartmentPage>('ApartmentPage', ApartmentPageSchema);