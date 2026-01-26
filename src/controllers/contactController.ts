import { Request, Response } from 'express';
import ContactPage, { IContactPage } from '../models/ContactPage';

class ContactController {
  // Récupérer la page contact
  async getContactPage(req: Request, res: Response): Promise<void> {
    try {
      const contactPage = await ContactPage.findOne().sort({ 'meta.updatedAt': -1 });
      
      if (!contactPage) {
        // Créer une page par défaut si elle n'existe pas
        const defaultPage = await this.createDefaultPage();
        res.status(200).json(defaultPage);
        return;
      }
      
      res.status(200).json(contactPage);
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la récupération de la page contact',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour la page contact
  async updateContactPage(req: Request, res: Response): Promise<void> {
    try {
      const { heroSection, contactForm, testimonialSection, gallerySection } = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';

      // Vérifier les données requises
      if (!heroSection || !contactForm || !testimonialSection || !gallerySection) {
        res.status(400).json({ error: 'Toutes les sections sont requises' });
        return;
      }

      // Récupérer la dernière version
      const latestPage = await ContactPage.findOne().sort({ 'meta.updatedAt': -1 });
      const currentVersion = latestPage ? latestPage.meta.version : 0;

      const updatedPage = await ContactPage.findOneAndUpdate(
        {},
        {
          heroSection,
          contactForm,
          testimonialSection,
          gallerySection,
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
        message: 'Page contact mise à jour avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour de la page contact',
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

      const validSections = ['heroSection', 'contactForm', 'testimonialSection', 'gallerySection'];
      
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

      const updatedPage = await ContactPage.findOneAndUpdate(
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

  // Ajouter un témoignage
  async addTestimonial(req: Request, res: Response): Promise<void> {
    try {
      const testimonial = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';

      const updatedPage = await ContactPage.findOneAndUpdate(
        {},
        {
          $push: { 'testimonialSection.testimonials': testimonial },
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy,
          $inc: { 'meta.version': 1 }
        },
        { new: true, upsert: true }
      );

      res.status(201).json({
        message: 'Témoignage ajouté avec succès',
        testimonials: updatedPage?.testimonialSection.testimonials
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de l\'ajout du témoignage',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Ajouter un élément à la galerie
  async addGalleryItem(req: Request, res: Response): Promise<void> {
    try {
      const galleryItem = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';

      const updatedPage = await ContactPage.findOneAndUpdate(
        {},
        {
          $push: { 'gallerySection.items': galleryItem },
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy,
          $inc: { 'meta.version': 1 }
        },
        { new: true, upsert: true }
      );

      res.status(201).json({
        message: 'Élément de galerie ajouté avec succès',
        items: updatedPage?.gallerySection.items
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de l\'ajout de l\'élément de galerie',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Créer une page par défaut
  private async createDefaultPage(): Promise<IContactPage> {
    const defaultPage = new ContactPage({
      heroSection: {
        title: 'CONTACTEZ\nNOUS',
        subtitle: 'Nous sommes là pour vous aider',
        backgroundImage: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1000&auto=format&fit=crop',
        email: 'contact@example.com',
        phone: '+33 00 00 000',
        emailIcon: 'mail',
        phoneIcon: 'phone'
      },
      contactForm: {
        title: 'Contactez-nous',
        fields: [
          {
            label: 'Nom complet',
            placeholder: 'Votre nom',
            type: 'text',
            required: true
          },
          {
            label: 'Téléphone',
            placeholder: 'Votre numéro',
            type: 'tel',
            required: true
          },
          {
            label: 'Email',
            placeholder: 'votre@email.com',
            type: 'email',
            required: true
          },
          {
            label: 'Message',
            placeholder: 'Comment pouvons-nous vous aider ?',
            type: 'textarea',
            required: true
          }
        ],
        consentText: 'J\'accepte la politique de confidentialité et la récolte de données.',
        submitButtonText: 'Envoyer le message'
      },
      testimonialSection: {
        title: 'CLASS APTENT TACITI SOCIOSQU AD LITORA TORQUENT',
        description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
        testimonials: [
          {
            name: 'John Doe',
            role: 'Client satisfait',
            avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
            quote: 'Excellent service ! L\'équipe a été très réactive et professionnelle.',
            rating: 5
          }
        ],
        featuredImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop',
        accentColor: '#FF2D75'
      },
      gallerySection: {
        title: 'Gorem ipsum dolor sit amet, consectetur',
        description: 'Sorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate et velit interdum, ac aliquet odio mattis.',
        items: [
          {
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop',
            alt: 'Salon moderne',
            title: 'Salon élégant',
            description: 'Espace de vie moderne et confortable'
          },
          {
            image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000&auto=format&fit=crop',
            alt: 'Chambre minimaliste',
            title: 'Chambre paisible',
            description: 'Ambiance calme et reposante'
          }
        ],
        accentColor: '#FF2D75'
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

export default new ContactController();