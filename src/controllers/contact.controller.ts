// controllers/contactController.ts
import { Request, Response } from 'express';
import ContactMessage from '../models/ContactMessage';
import emailService from '../services/email.service';

interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
}

class ContactController {
  async submitContactForm(req: Request, res: Response) {
    try {
      const { fullName, email, phone, message, consent }: ContactFormData = req.body;

      // Validation des données
      if (!fullName || !email || !phone || !message) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs obligatoires doivent être remplis'
        });
      }

      if (!consent) {
        return res.status(400).json({
          success: false,
          message: 'Vous devez accepter la politique de confidentialité'
        });
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }

      // Création du message en base de données
      const contactMessage = new ContactMessage({
        fullName,
        email,
        phone,
        message,
        consent,
        status: 'new'
      });

      await contactMessage.save();

      // Envoyer l'email de notification à l'admin
      try {
        await emailService.sendContactNotification({
          fullName,
          email,
          phone,
          message
        });

        // Envoyer l'email de confirmation à l'utilisateur
        await emailService.sendConfirmationEmail(email, {
          fullName,
          message
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // On continue même si l'envoi d'email échoue
        // Le message est quand même sauvegardé en base
      }

      res.status(201).json({
        success: true,
        message: 'Votre message a été envoyé avec succès',
        data: {
          id: contactMessage._id,
          createdAt: contactMessage.createdAt
        }
      });

    } catch (error) {
      console.error('Error submitting contact form:', error);
      res.status(500).json({
        success: false,
        message: 'Une erreur est survenue lors de l\'envoi du message',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getContactMessages(req: Request, res: Response) {
    try {
      // Pour protéger cette route, ajouter un middleware d'authentification
      const messages = await ContactMessage.find()
        .sort({ createdAt: -1 })
        .select('-__v');
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des messages'
      });
    }
  }

  async updateMessageStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['new', 'read', 'replied', 'archived'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide'
        });
      }

      const message = await ContactMessage.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message non trouvé'
        });
      }

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du message'
      });
    }
  }
}

export default new ContactController();