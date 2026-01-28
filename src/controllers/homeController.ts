import { Request, Response } from 'express';
import HomePage, { IHomePage } from '../models/HomePage';

class HomeController {
  // Récupérer la page d'accueil
  async getHomePage(req: Request, res: Response): Promise<void> {
    try {
      // Use lean() to avoid mongoose document casting/validation when only reading
      const homePage = await HomePage.findOne().sort({ 'meta.updatedAt': -1 }).lean();

      if (!homePage) {
        const defaultPage = await this.createDefaultPage();
        res.status(200).json(defaultPage);
        return;
      }

      res.status(200).json(homePage);
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la récupération de la page d\'accueil',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour la page d'accueil
  async updateHomePage(req: Request, res: Response): Promise<void> {
    try {
      const {
        heroSection,
        welcomeSection,
        marqueeSection,
        destinationSearch,
        featureRoom,
        marqueeBlackSection,
        videoSection,
        servicesSection,
        featuresSection,
        statsSection,
        logoSection,
        threeCardsSection
      } = req.body;
      
      const updatedBy = (req as any).user?.email || 'anonymous';

      // Récupérer la dernière version
      const latestPage = await HomePage.findOne().sort({ 'meta.updatedAt': -1 });
      const currentVersion = latestPage ? latestPage.meta.version : 0;

      const updatedPage = await HomePage.findOneAndUpdate(
        {},
        {
          heroSection,
          welcomeSection,
          marqueeSection,
          destinationSearch,
          featureRoom,
          marqueeBlackSection,
          videoSection,
          servicesSection,
          featuresSection,
          statsSection,
          logoSection,
          threeCardsSection,
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy,
          'meta.version': currentVersion + 1
        },
        { 
          new: true,
          upsert: true,
          setDefaultsOnInsert: true 
        }
      );

      res.status(200).json({
        message: 'Page d\'accueil mise à jour avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour de la page d\'accueil',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour une section spécifique
  async updateSection(req: Request, res: Response): Promise<void> {
    try {
      const { section } = req.params;
      const sectionData = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';

      const validSections = [
        'heroSection',
        'welcomeSection',
        'marqueeSection',
        'destinationSearch',
        'featureRoom',
        'marqueeBlackSection',
        'videoSection',
        'servicesSection',
        'featuresSection',
        'statsSection',
        'logoSection',
        'threeCardsSection'
      ];
      
      if (!validSections.includes(section)) {
        res.status(400).json({ error: 'Section invalide' });
        return;
      }

      const updateQuery: any = {
        [`${section}`]: sectionData,
        'meta.updatedAt': new Date(),
        'meta.updatedBy': updatedBy,
        $inc: { 'meta.version': 1 }
      };

      const updatedPage = await HomePage.findOneAndUpdate(
        {},
        updateQuery,
        { new: true, upsert: true }
      );

      res.status(200).json({
        message: `${section} mis à jour avec succès`,
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: `Erreur lors de la mise à jour de ${req.params.section}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Créer une page par défaut
  private async createDefaultPage(): Promise<IHomePage> {
    const defaultPage = new HomePage({
      heroSection: {
        mainTitle: {
          line1: 'Lorem',
          line2: 'Ipsum',
          line3: 'Dolor Sit'
        },
        description: 'Norem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        buttonText: 'Réserver',
        testimonial: {
          image: 'https://images.pexels.com/photos/3777570/pexels-photo-3777570.jpeg?auto=compress&cs=tinysrgb&w=200',
          title: 'Lorem ipsum dolor sit amet',
          subtitle: 'Korem ipsum dolor sit amet, consectetur adipiscing elit.'
        },
        images: {
          main: '/assets/image-principale-hero.png',
          secondary: '/assets/Image-Grise-hero.png',
          bedroom: '/assets/Image-Lit-hero.png'
        },
        accentColor: '#FF1B7C'
      },
      welcomeSection: {
        videoImage: '/assets/video-bg-welcome.png',
        videoUrl: '',
        image1: '/assets/photo-welcome1.png',
        image2: '/assets/photo-welcome2.png',
        title: 'Welcome to lorem consectetur',
        description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra.',
        features: {
          feature1: 'Luxe & Confort',
          feature2: 'Service Premium'
        },
        buttonText: 'Faire une réservation'
      },
      marqueeSection: {
        text: 'Lorem ipsum dolor •',
        color: 'hsla(0, 0%, 10%, 0.15)',
        backgroundColor: 'hsl(0 0% 98%)'
      },
      destinationSearch: {
        title: 'Sit amet, consectetur adipiscing elit.',
        description: 'Consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        images: {
          small: '/assets/left-photo-destination.png',
          main: '/assets/vertical-photo-destination.png'
        },
        formLabels: {
          destination: 'Votre destination',
          date: 'Date',
          travelers: 'Voyageur',
          button: 'Rechercher'
        }
      },
      featureRoom: {
        title: 'Adipiscing Elit Amet Consectetur',
        subtitle: 'Adipiscing Elit Amet Consectetur',
        description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        features: [
          {
            icon: 'Home',
            title: 'Lorem ipsum dolor sit amet',
            description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
            backgroundColor: '#1a1a1a'
          },
          {
            icon: 'Home',
            title: 'Nunc vulputate libero et velit',
            description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
            backgroundColor: '#F5F5F5'
          }
        ],
        images: {
          bedroom: '/assets/horizontal-photo-room.png',
          living: '/assets/square-photo-room.png'
        }
      },
      marqueeBlackSection: {
        text: 'Lorem ipsum dolor •',
        color: '#1a1a1a',
        backgroundColor: '#FFFFFF'
      },
      videoSection: {
        title: 'Adipiscing elit amet, consectetur.',
        description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra.',
        mainImage: '/assets/bedroom-main.png',
        videoUrl: '',
        galleryImages: [
          '/assets/image-above.png',
          '/assets/image-center.png',
          '/assets/image-below.png'
        ],
        buttonText: 'Réserver maintenant',
        accentColor: '#FF1B7C'
      },
      servicesSection: {
        title: 'Adipiscing elit amet, consectetur.',
        services: [
          {
            image: '/assets/photo-serivece-1.png',
            title: 'Lorem ipsum dolor sit amet',
            description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra.'
          },
          {
            image: '/assets/photo-service-2.png',
            title: 'Class aptent taciti sociosqu ad litora',
            description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra.'
          },
          {
            image: '/assets/photo-service-3.png',
            title: 'Torquent per conubia nostra, per inceptos',
            description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra.'
          }
        ],
        buttonText: 'Réserver maintenant'
      },
      featuresSection: {
        title: 'Elit amet consectetur',
        features: [
          {
            icon: 'Sofa',
            title: 'Rorem ipsum dolor sit amet'
          },
          {
            icon: 'Home',
            title: 'Rorem ipsum dolor sit amet'
          }
        ],
        mainImage: '/assets/b-photo-center-feature.png',
        thumbnails: [
          '/assets/s-photo-feature-1.png',
          '/assets/s-photo-feature-2.png'
        ],
        description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra.',
        subtitle: 'Aptent taciti sociosqu ad litora',
        backgroundColor: '#DEDEDE'
      },
      statsSection: {
        propertyCard: {
          image: '/assets/image-card-property.png',
          title: 'Per conubia nostra, per inceptos himenaeos',
          price: 600,
          priceUnit: 'Nuit',
          features: [
            { icon: 'Wifi', label: 'Wifi' },
            { icon: 'Bed', label: '4 chambres à coucher' },
            { icon: 'TreePine', label: 'Terrasse' },
            { icon: 'Car', label: 'Garage' },
            { icon: 'Waves', label: 'Piscine' }
          ],
          description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra.',
          buttonText: 'Reserver maintenant'
        },
        stats: [
          { value: '+15', label: 'Lorem ispum dolor' },
          { value: '+20', label: 'Class aptent taciti' },
          { value: '+2K', label: 'Customer lorem dolor' },
          { value: '100%', label: 'Guarantees apdent elit' }
        ]
      },
      logoSection: {
        title: 'Elit amet, consectetur',
        description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra.',
        logos: [
          { name: 'Logoipsum 1', image: '/assets/p-logo1.png' },
          { name: 'Logoipsum 2', image: '/assets/p-logo2.png' },
          { name: 'Logoipsum 3', image: '/assets/p-logo3.png' },
          { name: 'Logoipsum 4', image: '/assets/p-logo4.png' },
          { name: 'Logoipsum 5', image: '/assets/p-logo5.png' },
          { name: 'Logoipsum 6', image: '/assets/p-logo6.png' },
          { name: 'Logoipsum 7', image: '/assets/p-logo7.png' },
          { name: 'Logoipsum 8', image: '/assets/p-logo8.png' }
        ],
        backgroundColor: '#F3F3F3'
      },
      threeCardsSection: {
        cards: [
          {
            title: 'Sorem ipsum dolor sit amet',
            subtitle: 'Origine',
            description: 'Class aptent taciti socios quad litora torquent.',
            buttonText: 'En savoir plus',
            backgroundColor: '#F3F3F3',
            textColor: '#000000'
          },
          {
            title: 'Sit amet, consectetur elit.',
            subtitle: 'Découvrir',
            description: 'Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
            buttonText: 'Réserver maintenant',
            backgroundColor: '#000000',
            textColor: '#FFFFFF'
          },
          {
            title: 'Inceptos himenaeos.',
            subtitle: 'Découvrir',
            description: 'Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
            buttonText: 'En savoir plus',
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
            icon: 'Diamond'
          }
        ]
      },
      meta: {
        updatedAt: new Date(),
        updatedBy: 'system',
        version: 1
      }
    });

    return await defaultPage.save();
  }
}

export default new HomeController();