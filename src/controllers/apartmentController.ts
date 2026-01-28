import { Request, Response } from 'express';
import ApartmentPage, { IApartmentPage } from '../models/ApartmentPage';

class ApartmentController {
  // Récupérer la page appartements
  async getApartmentPage(req: Request, res: Response): Promise<void> {
    try {
      const apartmentPage = await ApartmentPage.findOne().sort({ 'meta.updatedAt': -1 }).lean();

      if (!apartmentPage) {
        const defaultPage = await this.createDefaultPage();
        res.status(200).json(defaultPage);
        return;
      }

      res.status(200).json(apartmentPage);
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la récupération de la page appartements',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour la page appartements
  async updateApartmentPage(req: Request, res: Response): Promise<void> {
    try {
      const {
        heroSection,
        roomsSection,
        featureSection,
        showcaseSection,
        perfectShowSection,
        marqueeSection,
        videoSection,
        finalSection
      } = req.body;
      
      const updatedBy = (req as any).user?.email || 'anonymous';

      // Récupérer la dernière version
      const latestPage = await ApartmentPage.findOne().sort({ 'meta.updatedAt': -1 });
      const currentVersion = latestPage ? latestPage.meta.version : 0;

      const updatedPage = await ApartmentPage.findOneAndUpdate(
        {},
        {
          heroSection,
          roomsSection,
          featureSection,
          showcaseSection,
          perfectShowSection,
          marqueeSection,
          videoSection,
          finalSection,
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
        message: 'Page appartements mise à jour avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour de la page appartements',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour une section spécifique
  async updateSection(req: Request, res: Response): Promise<void> {
    try {
      const { section, subsection } = req.params;
      const sectionData = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';

      const validSections = [
        'heroSection',
        'roomsSection',
        'featureSection',
        'showcaseSection',
        'perfectShowSection',
        'marqueeSection',
        'videoSection',
        'finalSection'
      ];
      
      if (!validSections.includes(section)) {
        res.status(400).json({ error: 'Section invalide' });
        return;
      }

      const updatePath = subsection ? `${section}.${subsection}` : section;
      const updateQuery: any = {
        [`${updatePath}`]: sectionData,
        'meta.updatedAt': new Date(),
        'meta.updatedBy': updatedBy,
        $inc: { 'meta.version': 1 }
      };

      const updatedPage = await ApartmentPage.findOneAndUpdate(
        {},
        updateQuery,
        { new: true, upsert: true }
      );

      res.status(200).json({
        message: `${updatePath} mis à jour avec succès`,
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: `Erreur lors de la mise à jour de ${req.params.section}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Ajouter une chambre
  async addRoom(req: Request, res: Response): Promise<void> {
    try {
      const { room } = req.body;
      
      const updatedPage = await ApartmentPage.findOneAndUpdate(
        {},
        {
          $push: { 
            'roomsSection.rooms': room
          },
          'meta.updatedAt': new Date(),
          $inc: { 'meta.version': 1 }
        },
        { new: true }
      );

      res.status(200).json({
        message: 'Chambre ajoutée avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de l\'ajout de la chambre',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour une chambre
  async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { updates } = req.body;
      
      const roomId = parseInt(id);
      
      const updatedPage = await ApartmentPage.findOneAndUpdate(
        { 'roomsSection.rooms.id': roomId },
        {
          $set: { 
            'roomsSection.rooms.$[elem]': updates
          },
          'meta.updatedAt': new Date(),
          $inc: { 'meta.version': 1 }
        },
        {
          new: true,
          arrayFilters: [{ 'elem.id': roomId }]
        }
      );

      if (!updatedPage) {
        res.status(404).json({ error: 'Chambre non trouvée' });
        return;
      }

      res.status(200).json({
        message: 'Chambre mise à jour avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour de la chambre',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Supprimer une chambre
  async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const roomId = parseInt(id);
      
      const updatedPage = await ApartmentPage.findOneAndUpdate(
        {},
        {
          $pull: { 
            'roomsSection.rooms': { id: roomId }
          },
          'meta.updatedAt': new Date(),
          $inc: { 'meta.version': 1 }
        },
        { new: true }
      );

      res.status(200).json({
        message: 'Chambre supprimée avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la suppression de la chambre',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Créer une page par défaut
  private async createDefaultPage(): Promise<IApartmentPage> {
    const defaultPage = new ApartmentPage({
      heroSection: {
        titleLine1: 'INTERDUM,',
        titleLine2: 'AC ALIQUET',
        titleLine3: 'ODIO MATTIS.',
        description: 'Norem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        backgroundImage: '/assets/hero-room.jpg'
      },
      roomsSection: {
        title: 'Adipiscing elit amet consectetur.',
        description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        rooms: [
          {
            id: 1,
            image: '/assets/room-1.jpg',
            title: 'Chambre Élégante',
            description: 'Suite spacieuse avec vue panoramique',
            guests: 'jusqu\'à 4 invités',
            bedrooms: '2 chambres à coucher'
          },
          {
            id: 2,
            image: '/assets/room-2.jpg',
            title: 'Suite Royale',
            description: 'Luxueuse suite avec balcon privé',
            guests: 'jusqu\'à 6 invités',
            bedrooms: '3 chambres à coucher'
          },
          {
            id: 3,
            image: '/assets/room-3.jpg',
            title: 'Chambre Familiale',
            description: 'Parfaite pour les séjours en famille',
            guests: 'jusqu\'à 5 invités',
            bedrooms: '2 chambres à coucher'
          },
          {
            id: 4,
            image: '/assets/room-4.jpg',
            title: 'Suite Romantique',
            description: 'Ambiance intimiste et cosy',
            guests: 'jusqu\'à 2 invités',
            bedrooms: '1 chambre à coucher'
          },
          {
            id: 5,
            image: '/assets/room-5.jpg',
            title: 'Penthouse Vue Mer',
            description: 'Vue imprenable sur l\'océan',
            guests: 'jusqu\'à 8 invités',
            bedrooms: '4 chambres à coucher'
          },
          {
            id: 6,
            image: '/assets/room-6.jpg',
            title: 'Chambre Moderne',
            description: 'Design contemporain et épuré',
            guests: 'jusqu\'à 3 invités',
            bedrooms: '1 chambre à coucher'
          }
        ],
        loadMoreText: 'Affichez plus de chambres (+6)',
        showLessText: 'Réduire l\'affichage',
        backToTopText: 'Retour en haut'
      },
      featureSection: {
        mainTitle: 'Consectetur ipsum elit',
        mainDescription: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        darkCard: {
          title: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
          footer: 'Amet, consectetur adipiscing elit.'
        },
        lightCard: {
          title: 'Nunc vulputate libero',
          description: 'Rorem ipsum dolor sit amet, consectetur adipiscing elit'
        },
        images: {
          small: '/assets/bedroom-small.jpg',
          large: '/assets/bedroom-large.jpg'
        },
        footerTexts: [
          'Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
          'Class aptent taciti sociosqu ad litora torquent.'
        ]
      },
      showcaseSection: {
        title: 'Elit amet, consectetur',
        description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        image: '/assets/appartement-photo.png',
        checkItems: [
          { text: 'Lorem ipsum dolor' },
          { text: 'Sit amet, consectetur' },
          { text: 'Adipiscing elit.' },
          { text: 'Curabitur tempus' }
        ],
        decorativeElements: {
          grayRectangle: '#9CA3AF',
          pinkSquare: '#FF2E63'
        }
      },
      perfectShowSection: {
        title: 'Class aptent taciti sociosqu ad litora torquent.',
        description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        buttonText: 'Réserver maintenant',
        images: {
          main: '/assets/hotel-room-main.jpg',
          view: '/assets/hotel-room-view.jpg',
          detail: '/assets/hotel-room-detail.jpg'
        },
        footerText: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia'
      },
      marqueeSection: {
        text: 'Lorem ipsum dolor •',
        backgroundColor: '#FAFAFA',
        textColor: 'hsla(0, 0%, 10%, 0.15)'
      },
      videoSection: {
        coverImage: '/assets/video-cover.jpg',
        videoUrl: '',
        playButtonText: 'Play Tour',
        overlayColor: 'rgba(0,0,0,0.1)',
        galleryImages: []
      },
      finalSection: {
        title: 'ADIPISCING ELIT AMET, CONSECTETUR.',
        subtitle: 'Nunc vulputate libero',
        text1: 'Class aptent taciti sociosqu ad litora torquent.',
        text2: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        images: [
          '/assets/final-room-1.jpg',
          '/assets/final-room-2.jpg'
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

export default new ApartmentController();