import mongoose, { Schema, Document } from 'mongoose';

export interface IHeroSection {
  mainTitle: {
    line1: string;
    line2: string;
    line3: string;
  };
  description: string;
  buttonText: string;
  testimonial: {
    image: string;
    title: string;
    subtitle: string;
  };
  images: {
    main: string;
    secondary: string;
    bedroom: string;
  };
  accentColor: string;
}

export interface IWelcomeSection {
  videoImage: string;
  videoUrl: string;
  image1: string;
  image2: string;
  title: string;
  description: string;
  features: {
    feature1: string;
    feature2: string;
  };
  buttonText: string;
}

export interface IMarqueeSection {
  text: string;
  color: string;
  backgroundColor: string;
}

export interface IDestinationSearch {
  title: string;
  description: string;
  images: {
    small: string;
    main: string;
  };
  rotatingText?: string;
  formLabels: {
    destination: string;
    date: string;
    travelers: string;
    button: string;
  };
}

export interface IFeatureRoom {
  title: string;
  subtitle: string;
  description: string;
  features: Array<{
    icon: string;
    title: string;
    description: string;
    backgroundColor: string;
  }>;
  images: {
    bedroom: string;
    living: string;
  };
}

export interface IVideoSection {
  title: string;
  description: string;
  mainImage: string;
  videoUrl: string;
  galleryImages: string[];
  buttonText: string;
  accentColor: string;
}

export interface IService {
  image: string;
  title: string;
  description: string;
}

export interface IServicesSection {
  title: string;
  services: IService[];
  buttonText: string;
}

export interface IFeature {
  icon: string;
  title: string;
}

export interface IFeaturesSection {
  title: string;
  features: IFeature[];
  mainImage: string;
  thumbnails: string[];
  description: string;
  subtitle: string;
  backgroundColor: string;
}

export interface IPropertyCard {
  image: string;
  title: string;
  price: number;
  priceUnit: string;
  features: Array<{
    icon: string;
    label: string;
  }>;
  description: string;
  buttonText: string;
}

export interface IStat {
  value: string;
  label: string;
}

export interface IStatsSection {
  propertyCard: IPropertyCard;
  stats: IStat[];
}

export interface ILogo {
  name: string;
  image: string;
}

export interface ILogoSection {
  title: string;
  description: string;
  logos: ILogo[];
  backgroundColor: string;
}

export interface ICard {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  backgroundColor: string;
  textColor: string;
  icon?: string;
}

export interface IThreeCardsSection {
  cards: ICard[];
}

export interface IHomePage extends Document {
  heroSection: IHeroSection;
  welcomeSection: IWelcomeSection;
  marqueeSection: IMarqueeSection;
  destinationSearch: IDestinationSearch;
  featureRoom: IFeatureRoom;
  marqueeBlackSection: IMarqueeSection;
  videoSection: IVideoSection;
  servicesSection: IServicesSection;
  featuresSection: IFeaturesSection;
  statsSection: IStatsSection;
  logoSection: ILogoSection;
  threeCardsSection: IThreeCardsSection;
  meta: {
    updatedAt: Date;
    updatedBy: string;
    version: number;
  };
}

// Schéma Hero Section
const HeroSectionSchema = new Schema<IHeroSection>({
  mainTitle: {
    line1: { type: String, required: true, default: 'Lorem' },
    line2: { type: String, required: true, default: 'Ipsum' },
    line3: { type: String, required: true, default: 'Dolor Sit' }
  },
  description: { type: String, required: true },
  buttonText: { type: String, required: true, default: 'Réserver' },
  testimonial: {
    image: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, required: true }
  },
  images: {
    main: { type: String, required: true },
    secondary: { type: String, required: true },
    bedroom: { type: String, required: true }
  },
  accentColor: { type: String, default: '#FF1B7C' }
});

// Schéma Welcome Section
const WelcomeSectionSchema = new Schema<IWelcomeSection>({
  videoImage: { type: String, required: true },
  videoUrl: { type: String, default: '' },
  image1: { type: String, required: true },
  image2: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  features: {
    feature1: { type: String, required: true },
    feature2: { type: String, required: true }
  },
  buttonText: { type: String, required: true, default: 'Faire une réservation' }
});

// Schéma Marquee Section
const MarqueeSectionSchema = new Schema<IMarqueeSection>({
  text: { type: String, required: true, default: 'Lorem ipsum dolor •' },
  color: { type: String, default: 'hsla(0, 0%, 10%, 0.15)' },
  backgroundColor: { type: String, default: 'hsl(0 0% 98%)' }
});

// Schéma Destination Search
const DestinationSearchSchema = new Schema<IDestinationSearch>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: {
    small: { type: String, required: true },
    main: { type: String, required: true }
  },
  rotatingText: { type: String, default: '' },
  formLabels: {
    destination: { type: String, default: 'Votre destination' },
    date: { type: String, default: 'Date' },
    travelers: { type: String, default: 'Voyageur' },
    button: { type: String, default: 'Rechercher' }
  }
});

// Schéma Feature Room
const FeatureRoomFeatureSchema = new Schema({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  backgroundColor: { type: String, default: '#1a1a1a' }
});

const FeatureRoomSchema = new Schema<IFeatureRoom>({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  features: [FeatureRoomFeatureSchema],
  images: {
    bedroom: { type: String, required: true },
    living: { type: String, required: true }
  }
});

// Schéma Video Section
const VideoSectionSchema = new Schema<IVideoSection>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  mainImage: { type: String, required: true },
  videoUrl: { type: String, default: '' },
  galleryImages: [{ type: String }],
  buttonText: { type: String, default: 'Réserver maintenant' },
  accentColor: { type: String, default: '#FF1B7C' }
});

// Schéma Services Section
const ServiceSchema = new Schema<IService>({
  image: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true }
});

const ServicesSectionSchema = new Schema<IServicesSection>({
  title: { type: String, required: true },
  services: [ServiceSchema],
  buttonText: { type: String, default: 'Réserver maintenant' }
});

// Schéma Features Section
const FeatureSchema = new Schema<IFeature>({
  icon: { type: String, required: true },
  title: { type: String, required: true }
});

const FeaturesSectionSchema = new Schema<IFeaturesSection>({
  title: { type: String, required: true },
  features: [FeatureSchema],
  mainImage: { type: String, required: true },
  thumbnails: [{ type: String }],
  description: { type: String, required: true },
  subtitle: { type: String, required: true },
  backgroundColor: { type: String, default: '#DEDEDE' }
});

// Schéma Property Card
const PropertyFeatureSchema = new Schema({
  icon: { type: String, required: true },
  label: { type: String, required: true }
});

const PropertyCardSchema = new Schema<IPropertyCard>({
  image: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  priceUnit: { type: String, required: true },
  features: [PropertyFeatureSchema],
  description: { type: String, required: true },
  buttonText: { type: String, default: 'Reserver maintenant' }
});

// Schéma Stats
const StatSchema = new Schema<IStat>({
  value: { type: String, required: true },
  label: { type: String, required: true }
});

const StatsSectionSchema = new Schema<IStatsSection>({
  propertyCard: PropertyCardSchema,
  stats: [StatSchema]
});

// Schéma Logo Section
const LogoSchema = new Schema<ILogo>({
  name: { type: String, required: true },
  image: { type: String, required: true }
});

const LogoSectionSchema = new Schema<ILogoSection>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  logos: [LogoSchema],
  backgroundColor: { type: String, default: '#F3F3F3' }
});

// Schéma Three Cards Section
const CardSchema = new Schema<ICard>({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  buttonText: { type: String, required: true },
  backgroundColor: { type: String, default: '#F3F3F3' },
  textColor: { type: String, default: '#000000' },
  icon: { type: String }
});

const ThreeCardsSectionSchema = new Schema<IThreeCardsSection>({
  cards: [CardSchema]
});

// Schéma principal de la Home Page
const HomePageSchema = new Schema<IHomePage>({
  heroSection: { type: HeroSectionSchema, required: true },
  welcomeSection: { type: WelcomeSectionSchema, required: true },
  marqueeSection: { type: MarqueeSectionSchema, required: true },
  destinationSearch: { type: DestinationSearchSchema, required: true },
  featureRoom: { type: FeatureRoomSchema, required: true },
  marqueeBlackSection: { type: MarqueeSectionSchema, required: true },
  videoSection: { type: VideoSectionSchema, required: true },
  servicesSection: { type: ServicesSectionSchema, required: true },
  featuresSection: { type: FeaturesSectionSchema, required: true },
  statsSection: { type: StatsSectionSchema, required: true },
  logoSection: { type: LogoSectionSchema, required: true },
  threeCardsSection: { type: ThreeCardsSectionSchema, required: true },
  meta: {
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'system' },
    version: { type: Number, default: 1 }
  }
}, {
  timestamps: true
});

export default mongoose.model<IHomePage>('HomePage', HomePageSchema);