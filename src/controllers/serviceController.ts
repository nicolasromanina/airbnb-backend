import { Request, Response } from 'express';
import ServicePage, { IServicePage } from '../models/ServicePage';

class ServiceController {
  // Récupérer la page services
  async getServicePage(req: Request, res: Response): Promise<void> {
    try {
      const servicePage = await ServicePage.findOne().sort({ 'meta.updatedAt': -1 }).lean();

      if (!servicePage) {
        const defaultPage = await this.createDefaultPage();
        res.status(200).json(defaultPage);
        return;
      }

      res.status(200).json(servicePage);
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la récupération de la page services',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Mettre à jour la page services
  async updateServicePage(req: Request, res: Response): Promise<void> {
    try {
      const {
        service1,
        service2
      } = req.body;
      
      const updatedBy = (req as any).user?.email || 'anonymous';

      // Récupérer la dernière version
      const latestPage = await ServicePage.findOne().sort({ 'meta.updatedAt': -1 });
      const currentVersion = latestPage ? latestPage.meta.version : 0;

      const updatedPage = await ServicePage.findOneAndUpdate(
        {},
        {
          service1,
          service2,
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
        message: 'Page services mise à jour avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la mise à jour de la page services',
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
        'service1',
        'service2'
      ];
      
      if (!validSections.includes(section)) {
        res.status(400).json({ error: 'Section invalide' });
        return;
      }

      const validSubsections = {
        service1: [
          'heroSection',
          'compositionSection',
          'ctaSection',
          'featuresSection',
          'darkSection'
        ],
        service2: [
          'faqSection',
          'gallerySection'
        ]
      };

      if (subsection && !validSubsections[section as keyof typeof validSubsections]?.includes(subsection)) {
        res.status(400).json({ error: 'Sous-section invalide' });
        return;
      }

      const updatePath = subsection ? `${section}.${subsection}` : section;
      const updateQuery: any = {
        [`${updatePath}`]: sectionData,
        'meta.updatedAt': new Date(),
        'meta.updatedBy': updatedBy,
        $inc: { 'meta.version': 1 }
      };

      const updatedPage = await ServicePage.findOneAndUpdate(
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

  // Créer une page par défaut
  private async createDefaultPage(): Promise<IServicePage> {
    const defaultPage = new ServicePage({
      service1: {
        heroSection: {
          titleLine1: 'CONSECT',
          titleLine2: 'ADIPISCING',
          titleLine3: 'ELIT.',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum.',
          backgroundImage: '/assets/hero-service.png'
        },
        compositionSection: {
          mainImage: '/assets/livingroom-service-1.png',
          secondaryImage: '/assets/badroom-service-1.png',
          title: 'Lorem ipsum dolor sit.',
          description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent.',
          features: [
            { icon: 'Gem', title: 'Inceptos' },
            { icon: 'Home', title: 'Curabitur' }
          ],
          decorativeElements: {
            pinkSquare: '#FF1675',
            blackSquare: '#000000'
          }
        },
        ctaSection: {
          title: 'Adipiscing elit amet consectetur.',
          description: 'Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.',
          buttonText: 'Reserver',
          image: '/assets/bedroom-service-2.png',
          featureCards: [
            {
              icon: 'Bed',
              title: 'Inceptos himenaeos',
              description: 'Ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.'
            },
            {
              icon: 'Sofa',
              title: 'Class aptent taciti',
              description: 'Norem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.'
            }
          ],
          layout: 'split'
        },
        featuresSection: {
          title: 'Lorem ipsum dolor sit amet.',
          features: [
            {
              icon: 'FileText',
              title: 'Adipiscing elit amet, consectetur.',
              description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.'
            },
            {
              icon: 'Bed',
              title: 'Class aptent taciti sociosqu ad',
              description: 'Norem ipsum dolor sit amet, consectetur adipiscing elit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.'
            },
            {
              icon: 'Utensils',
              title: 'A nunc vulputate libero et velit',
              description: 'Curabitur tempus urna at turpis condimentum lobortis. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent.'
            },
            {
              icon: 'Umbrella',
              title: 'Curabitur tempus urna at turpis condimentum',
              description: 'Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.'
            }
          ],
          decorativeText: 'Lorem ipsum dolor',
          backgroundColor: '#FAFAFA'
        },
        darkSection: {
          title: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
          subtitle: 'Worem ipsum dolor sit amet',
          description: 'Qorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent.',
          image1: '/assets/bedroom-service-3.png',
          image2: '/assets/livingroom-service-2.png',
          buttonText: 'Reserver maintenant',
          accentColor: '#FF2E63',
          features: [
            { id: '01', text: 'Nunc vulputate libero et velit interdum' },
            { id: '02', text: 'Class aptent taciti sociosqu ad litora torquent' },
            { id: '03', text: 'Class aptent taciti sociosqu ad litora' },
            { id: '04', text: 'Taciti sociosqu ad litora torquent' }
          ]
        }
      },
      service2: {
        faqSection: {
          questions: [
            {
              question: 'Gorem ipsum dolor sit amet, consectetur adipiscing elit.',
              answer: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.'
            },
            {
              question: 'Aptent taciti sociosqu ad litora torquent per conubia',
              answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
            },
            {
              question: 'Curabitur tempus urna at turpis condimentum lobortis',
              answer: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
            },
            {
              question: 'Ut commodo efficitur amet, consectetur adipiscing elit.',
              answer: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.'
            }
          ],
          title: 'Elit amet, consectetur tempus at turpis',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          image: '/assets/livingroom-service-3.png',
          decorativeElements: {
            pinkSquare: '#FF2E63',
            blackSquare: '#000000'
          }
        },
        gallerySection: {
          mainImage: '/assets/bedroom-service-4.png',
          secondaryImages: [
            '/assets/sofa-service-2.png',
            '/assets/sofa-service-1.png'
          ],
          title: 'Aptent taciti sociosqu ad litora',
          description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur tempus urna at turpis condimentum lobortis.',
          backgroundColor: '#F5F5F5',
          decorativeElements: {
            pinkSquare: '#FF2E63',
            blackSquare: '#000000'
          }
        }
      },
      meta: {
        updatedAt: new Date(),
        updatedBy: 'system',
        version: 1
      }
    });

    return await defaultPage.save();
  }

  // Ajouter une question FAQ
  async addFAQItem(req: Request, res: Response): Promise<void> {
    try {
      const { question, answer } = req.body;
      
      const updatedPage = await ServicePage.findOneAndUpdate(
        {},
        {
          $push: { 
            'service2.faqSection.questions': { question, answer }
          },
          'meta.updatedAt': new Date(),
          $inc: { 'meta.version': 1 }
        },
        { new: true }
      );

      res.status(200).json({
        message: 'Question FAQ ajoutée avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de l\'ajout de la question FAQ',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Supprimer une question FAQ
  async removeFAQItem(req: Request, res: Response): Promise<void> {
    try {
      const { index } = req.params;
      
      const updatedPage = await ServicePage.findOneAndUpdate(
        {},
        {
          $unset: { 
            [`service2.faqSection.questions.${index}`]: 1 
          },
          $pull: { 
            'service2.faqSection.questions': null 
          },
          'meta.updatedAt': new Date(),
          $inc: { 'meta.version': 1 }
        },
        { new: true }
      );

      res.status(200).json({
        message: 'Question FAQ supprimée avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de la suppression de la question FAQ',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Ajouter une feature
  async addFeature(req: Request, res: Response): Promise<void> {
    try {
      const { section, feature } = req.body;
      
      const updatePath = section === 'service1' 
        ? 'service1.featuresSection.features' 
        : 'service1.darkSection.features';
      
      const updatedPage = await ServicePage.findOneAndUpdate(
        {},
        {
          $push: { 
            [updatePath]: feature
          },
          'meta.updatedAt': new Date(),
          $inc: { 'meta.version': 1 }
        },
        { new: true }
      );

      res.status(200).json({
        message: 'Feature ajoutée avec succès',
        page: updatedPage
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur lors de l\'ajout de la feature',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new ServiceController();