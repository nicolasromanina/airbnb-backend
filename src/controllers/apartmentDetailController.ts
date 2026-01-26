import { Request, Response } from 'express';
import ApartmentDetailPage from '../models/ApartmentDetailPage';
import { AdditionalOption } from '../models/AdditionalOption';

class ApartmentDetailController {
  constructor() {
    // Binder les méthodes pour préserver le contexte 'this'
    this.getAllDetails = this.getAllDetails.bind(this);
    this.getDetailByApartmentId = this.getDetailByApartmentId.bind(this);
    this.updateDetail = this.updateDetail.bind(this);
    this.updateSection = this.updateSection.bind(this);
    this.updateAdditionalOptions = this.updateAdditionalOptions.bind(this);
    this.deleteDetail = this.deleteDetail.bind(this);
    this.syncWithMainPage = this.syncWithMainPage.bind(this);
  }
  
  // Récupérer tous les détails
  async getAllDetails(req: Request, res: Response): Promise<void> {
    try {
      const details = await ApartmentDetailPage.find().sort({ apartmentId: 1 });
      
      // Récupérer aussi les options associées
      const detailsWithOptions = await Promise.all(
        details.map(async (detail) => {
          const options = detail.additionalOptions?.length 
            ? await AdditionalOption.find({ 
                _id: { $in: detail.additionalOptions },
                isActive: true 
              })
            : [];
          
          return {
            ...detail.toObject(),
            availableOptions: options
          };
        })
      );
      
      res.status(200).json({
        success: true,
        data: detailsWithOptions
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération des détails',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Récupérer un détail par apartmentId
  async getDetailByApartmentId(req: Request, res: Response): Promise<void> {
    try {
      const { apartmentId } = req.params;
      const id = parseInt(apartmentId);
      
      let detail = await ApartmentDetailPage.findOne({ apartmentId: id });
      
      // Si non trouvé, créer un template par défaut
      if (!detail) {
        detail = await this.createDefaultDetail(id);
      }
      
      // Récupérer les options disponibles pour cet appartement
      const availableOptions = await AdditionalOption.find({ 
        $or: [
          { apartmentIds: { $exists: false } },
          { apartmentIds: { $size: 0 } },
          { apartmentIds: id }
        ],
        isActive: true 
      });
      
      res.status(200).json({
        success: true,
        data: {
          ...detail.toObject(),
          availableOptions
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération du détail',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Mettre à jour un détail
  async updateDetail(req: Request, res: Response): Promise<void> {
    try {
      const { apartmentId } = req.params;
      const id = parseInt(apartmentId);
      const updateData = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';
      
      const updatedDetail = await ApartmentDetailPage.findOneAndUpdate(
        { apartmentId: id },
        {
          $set: {
            ...updateData,
            'meta.updatedAt': new Date(),
            'meta.updatedBy': updatedBy
          },
          $inc: { 'meta.version': 1 }
        },
        { 
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: false 
        }
      );
      
      res.status(200).json({
        success: true,
        message: 'Détails mis à jour avec succès',
        data: updatedDetail
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la mise à jour',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Mettre à jour une section spécifique
  async updateSection(req: Request, res: Response): Promise<void> {
    try {
      const { apartmentId, section } = req.params;
      const id = parseInt(apartmentId);
      const sectionData = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';
      
      const validSections = ['hero', 'details', 'gallery', 'lastSection'];
      if (!validSections.includes(section)) {
        res.status(400).json({ error: 'Section invalide' });
        return;
      }
      
      const updateQuery: any = {
        $set: {
          [`${section}`]: sectionData,
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy
        },
        $inc: { 'meta.version': 1 }
      };
      
      const updatedDetail = await ApartmentDetailPage.findOneAndUpdate(
        { apartmentId: id },
        updateQuery,
        { new: true, upsert: true, runValidators: false }
      );
      
      res.status(200).json({
        success: true,
        message: `${section} mis à jour avec succès`,
        data: updatedDetail
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: `Erreur lors de la mise à jour de ${req.params.section}`,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Mettre à jour les options supplémentaires
  async updateAdditionalOptions(req: Request, res: Response): Promise<void> {
    try {
      const { apartmentId } = req.params;
      const { optionIds } = req.body;
      const id = parseInt(apartmentId);
      const updatedBy = (req as any).user?.email || 'anonymous';
      
      const updatedDetail = await ApartmentDetailPage.findOneAndUpdate(
        { apartmentId: id },
        {
          $set: {
            additionalOptions: optionIds,
            'meta.updatedAt': new Date(),
            'meta.updatedBy': updatedBy
          },
          $inc: { 'meta.version': 1 }
        },
        { new: true, upsert: true, runValidators: false }
      );
      
      res.status(200).json({
        success: true,
        message: 'Options supplémentaires mises à jour',
        data: updatedDetail
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la mise à jour des options',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Supprimer un détail
  async deleteDetail(req: Request, res: Response): Promise<void> {
    try {
      const { apartmentId } = req.params;
      const id = parseInt(apartmentId);
      
      await ApartmentDetailPage.findOneAndDelete({ apartmentId: id });
      
      res.status(200).json({
        success: true,
        message: 'Détails supprimés avec succès'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la suppression',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Synchroniser avec la page appartements principale
  async syncWithMainPage(req: Request, res: Response): Promise<void> {
    try {
      const { apartmentId } = req.params;
      const { roomData } = req.body;
      const id = parseInt(apartmentId);
      const updatedBy = (req as any).user?.email || 'anonymous';
      
      // Vérifier si le détail existe
      let detail = await ApartmentDetailPage.findOne({ apartmentId: id });
      
      if (!detail) {
        // Créer un nouveau détail basé sur les données de la chambre
        detail = new ApartmentDetailPage({
          apartmentId: id,
          hero: {
            title: roomData.title || 'Nouvel appartement',
            subtitle: roomData.description || 'Découvrez cet appartement exceptionnel',
            description: 'Détails de l\'appartement...',
            price: 300,
            guests: roomData.guests || "jusqu'à 2 invités",
            bedrooms: roomData.bedrooms || "1 chambre à coucher",
            mainImage: roomData.image || '/assets/default-apartment.jpg',
            galleryImages: [roomData.image]
          },
          details: {
            title: 'Détails de l\'appartement',
            description: roomData.description || 'Description détaillée...',
            highlights: ['Luxe', 'Confort', 'Vue exceptionnelle']
          },
          meta: {
            updatedBy,
            version: 1
          }
        });
        
        await detail.save();
      } else {
        // Mettre à jour avec les nouvelles données
        detail.hero.title = roomData.title || detail.hero.title;
        detail.hero.subtitle = roomData.description || detail.hero.subtitle;
        detail.hero.guests = roomData.guests || detail.hero.guests;
        detail.hero.bedrooms = roomData.bedrooms || detail.hero.bedrooms;
        if (roomData.image && !detail.hero.galleryImages.includes(roomData.image)) {
          detail.hero.galleryImages.unshift(roomData.image);
        }
        detail.meta.updatedAt = new Date();
        detail.meta.updatedBy = updatedBy;
        detail.meta.version += 1;
        
        await detail.save();
      }
      
      res.status(200).json({
        success: true,
        message: 'Synchronisation réussie',
        data: detail
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la synchronisation',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Créer un template par défaut
  private async createDefaultDetail(apartmentId: number) {
    const defaultDetail = new ApartmentDetailPage({
      apartmentId,
      hero: {
        title: `Appartement ${apartmentId}`,
        subtitle: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
        description: 'Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus.',
        price: 300,
        guests: "jusqu'à 4 invités",
        bedrooms: "2 chambres à coucher",
        mainImage: '/assets/apartment-detail-main.jpg',
        galleryImages: [
          '/assets/apartment-detail-1.jpg',
          '/assets/apartment-detail-2.jpg',
          '/assets/apartment-detail-3.jpg'
        ]
      },
      details: {
        title: 'Détails de l\'appartement',
        subtitle: 'Class aptent taciti per inceptos himenaeos.',
        description: 'Maecenas eget condimentum velit, sit amet feugiat lectus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        highlights: [
          'Logement sans fumeur',
          'Parking sécurisé',
          'Thé, café, petit déjeuné'
        ],
        features: [
          { id: '01', text: 'Class aptent taciti sociosqu ad litora torquent.' },
          { id: '02', text: 'Class aptent taciti sociosqu ad litora torquent.' },
          { id: '03', text: 'Class aptent taciti sociosqu ad litora torquent.' },
          { id: '04', text: 'Class aptent taciti sociosqu ad litora torquent.' }
        ]
      },
      gallery: {
        title: 'Nunc vulputate libero et',
        subtitle: 'velit interdum, ac aliquet odio mattis.',
        images: Array.from({ length: 9 }, (_, i) => ({
          src: `/assets/gallery-${i + 1}.jpg`,
          alt: `Image gallery ${i + 1}`
        })),
        buttonText: 'Nous contacter'
      },
      lastSection: {
        title: 'Consectetur ipsum elit',
        description: 'Sorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum.',
        features: [
          { id: '01', text: 'Class aptent taciti sociosqu ad litora torquent.' },
          { id: '02', text: 'Class aptent taciti sociosqu ad litora torquent.' },
          { id: '03', text: 'Class aptent taciti sociosqu ad litora torquent.' },
          { id: '04', text: 'Class aptent taciti sociosqu ad litora torquent.' }
        ],
        image: '/assets/apartment-last-section.jpg',
        tagline: 'Consectetur adipiscing'
      },
      meta: {
        updatedBy: 'system',
        version: 1
      }
    });
    
    return await defaultDetail.save();
  }
}

export default new ApartmentDetailController();