import { Request, Response } from 'express';
import Footer, { IFooterData } from '../models/Footer';
import { deleteFromCloudinary } from '../middleware/cloudinary.middleware';

class FooterController {
  // Récupérer les données du footer
  async getFooterData(req: Request, res: Response): Promise<void> {
    try {
      const footerData = await Footer.findOne().sort({ 'meta.updatedAt': -1 });
      
      if (!footerData) {
        const defaultFooter = await this.createDefaultFooter();
        res.status(200).json(defaultFooter);
        return;
      }
      
      res.status(200).json(footerData);
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la récupération du footer',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour le footer
  async updateFooterData(req: Request, res: Response): Promise<void> {
    try {
      const { 
        galleryImages, 
        usefulLinks, 
        legalPages, 
        visualBanner, 
        copyright,
        logo
      } = req.body;
      
      const updatedBy = (req as any).user?.email || 'anonymous';

      // Récupérer la dernière version
      const latestFooter = await Footer.findOne().sort({ 'meta.updatedAt': -1 });
      const currentVersion = latestFooter ? latestFooter.meta.version : 0;

      const updatedFooter = await Footer.findOneAndUpdate(
        {},
        {
          galleryImages,
          usefulLinks,
          legalPages,
          visualBanner,
          copyright,
          logo,
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
        message: 'Footer mis à jour avec succès',
        footer: updatedFooter
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour du footer',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Ajouter une image à la galerie
  async addGalleryImage(req: Request, res: Response): Promise<void> {
    try {
      const { alt, order } = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';

      if (!req.cloudinaryUrl) {
        res.status(400).json({ error: 'Aucune image téléchargée' });
        return;
      }

      const newImage = {
        image: req.cloudinaryUrl,
        cloudinaryPublicId: req.cloudinaryPublicId,
        alt: alt || 'Image de galerie',
        order: order || 0
      };

      const updatedFooter = await Footer.findOneAndUpdate(
        {},
        {
          $push: { galleryImages: newImage },
          $inc: { 'meta.version': 1 },
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy
        },
        { new: true, upsert: true }
      );

      res.status(201).json({
        message: 'Image ajoutée à la galerie',
        galleryImages: updatedFooter?.galleryImages
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de l\'ajout de l\'image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Supprimer une image de la galerie
  async deleteGalleryImage(req: Request, res: Response): Promise<void> {
    try {
      const { imageId } = req.params;
      const updatedBy = (req as any).user?.email || 'anonymous';

      // Récupérer le footer pour obtenir le public_id
      const footer = await Footer.findOne({ 'galleryImages._id': imageId });
      
      if (!footer) {
        res.status(404).json({ error: 'Image non trouvée' });
        return;
      }

      // Trouver l'image à supprimer
      const imageToDelete = footer.galleryImages.find(img => img._id?.toString() === imageId);
      
      if (!imageToDelete) {
        res.status(404).json({ error: 'Image non trouvée' });
        return;
      }

      // Supprimer de Cloudinary
      try {
        await deleteFromCloudinary(imageToDelete.cloudinaryPublicId);
      } catch (cloudinaryError) {
        console.warn('Erreur lors de la suppression Cloudinary, continuation:', cloudinaryError);
      }

      // Supprimer de la base de données
      const updatedFooter = await Footer.findOneAndUpdate(
        {},
        {
          $pull: { galleryImages: { _id: imageId } },
          $inc: { 'meta.version': 1 },
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy
        },
        { new: true }
      );

      res.status(200).json({
        message: 'Image supprimée avec succès',
        galleryImages: updatedFooter?.galleryImages
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la suppression de l\'image',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour l'ordre des images
  async updateGalleryOrder(req: Request, res: Response): Promise<void> {
    try {
      const { orderedImages } = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';

      // Mettre à jour l'ordre
      const updatePromises = orderedImages.map((img: any, index: number) => {
        return Footer.findOneAndUpdate(
          { 'galleryImages._id': img._id },
          { $set: { 'galleryImages.$.order': index } },
          { new: true }
        );
      });

      await Promise.all(updatePromises);

      // Récupérer le footer mis à jour
      const updatedFooter = await Footer.findOneAndUpdate(
        {},
        {
          $inc: { 'meta.version': 1 },
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy
        },
        { new: true }
      );

      // Trier les images par ordre
      const sortedImages = updatedFooter?.galleryImages.sort((a, b) => a.order - b.order);

      res.status(200).json({
        message: 'Ordre mis à jour',
        galleryImages: sortedImages
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour de l\'ordre',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour le logo
  async updateLogo(req: Request, res: Response): Promise<void> {
    try {
      const { alt } = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';

      if (!req.cloudinaryUrl) {
        res.status(400).json({ error: 'Aucune image téléchargée' });
        return;
      }

      // Récupérer l'ancien footer pour supprimer l'ancien logo de Cloudinary
      const oldFooter = await Footer.findOne();
      if (oldFooter?.logo?.cloudinaryPublicId) {
        try {
          await deleteFromCloudinary(oldFooter.logo.cloudinaryPublicId);
        } catch (error) {
          console.warn('Erreur lors de la suppression de l\'ancien logo:', error);
        }
      }

      const newLogo = {
        url: req.cloudinaryUrl,
        cloudinaryPublicId: req.cloudinaryPublicId,
        alt: alt || 'Logo'
      };

      const updatedFooter = await Footer.findOneAndUpdate(
        {},
        {
          logo: newLogo,
          $inc: { 'meta.version': 1 },
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy
        },
        { new: true, upsert: true }
      );

      res.status(200).json({
        message: 'Logo mis à jour avec succès',
        logo: updatedFooter?.logo
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour du logo',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Créer un footer par défaut
  private async createDefaultFooter(): Promise<IFooterData> {
    const defaultFooter = new Footer({
      galleryImages: [
        {
          image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1000&auto=format&fit=crop',
          cloudinaryPublicId: 'default-footer-1',
          alt: 'Intérieur moderne 1',
          order: 0
        },
        {
          image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop',
          cloudinaryPublicId: 'default-footer-2',
          alt: 'Intérieur moderne 2',
          order: 1
        },
        {
          image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1000&auto=format&fit=crop',
          cloudinaryPublicId: 'default-footer-3',
          alt: 'Intérieur moderne 3',
          order: 2
        },
        {
          image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1000&auto=format&fit=crop',
          cloudinaryPublicId: 'default-footer-4',
          alt: 'Intérieur moderne 4',
          order: 3
        }
      ],
      usefulLinks: {
        title: 'Liens Utiles',
        links: [
          { text: 'Nunc vulputate libero', url: '#' },
          { text: 'Curabitur tempus', url: '#' },
          { text: 'Vestibulum eu nisl', url: '#' },
          { text: 'Inceptos himenaeos', url: '#' }
        ]
      },
      legalPages: {
        title: 'Pages Légales',
        links: [
          { text: 'Mentions Légales', url: '/mentions-legales' },
          { text: 'Politique de confidentialité', url: '/confidentialite' },
          { text: 'Conditions Générales', url: '/conditions' },
          { text: 'Contact', url: '/contact' }
        ]
      },
      visualBanner: {
        title: 'Adipiscing elit',
        backgroundColor: '#E5E5E5'
      },
      copyright: {
        text: '© 2026 SWEETHOME. All rights reserved.',
        designText: 'Designed for Excellence'
      },
      logo: {
        url: './Logo.png',
        cloudinaryPublicId: 'logo-default',
        alt: 'SWEETHOME Logo'
      },
      meta: {
        updatedAt: new Date(),
        updatedBy: 'system',
        version: 1
      }
    });

    return await defaultFooter.save();
  }
}

export default new FooterController();