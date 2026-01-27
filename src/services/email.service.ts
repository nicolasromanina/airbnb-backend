// services/emailService.ts
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendContactNotification(contactData: {
    fullName: string;
    email: string;
    phone: string;
    message: string;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #dee2e6; border-top: none; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #495057; margin-bottom: 5px; }
          .value { color: #212529; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0; color: #FF2D75;">Nouveau message de contact</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Nom complet :</div>
              <div class="value">${contactData.fullName}</div>
            </div>
            <div class="field">
              <div class="label">Email :</div>
              <div class="value">${contactData.email}</div>
            </div>
            <div class="field">
              <div class="label">Téléphone :</div>
              <div class="value">${contactData.phone}</div>
            </div>
            <div class="field">
              <div class="label">Message :</div>
              <div class="value" style="white-space: pre-wrap;">${contactData.message}</div>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé depuis le formulaire de contact de votre site web.</p>
              <p>Date : ${new Date().toLocaleString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Nouveau message de contact

Nom complet : ${contactData.fullName}
Email : ${contactData.email}
Téléphone : ${contactData.phone}
Message : ${contactData.message}

Date : ${new Date().toLocaleString('fr-FR')}
    `;

    const mailOptions: EmailOptions = {
      to: adminEmail || 'admin@example.com',
      subject: `Nouveau message de contact de ${contactData.fullName}`,
      html,
      text
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Notification email sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendConfirmationEmail(to: string, contactData: {
    fullName: string;
    message: string;
  }) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF2D75; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #dee2e6; border-top: none; }
          .message { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Merci pour votre message !</h1>
          </div>
          <div class="content">
            <p>Bonjour ${contactData.fullName},</p>
            <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
            
            <div class="message">
              <p><strong>Votre message :</strong></p>
              <p>${contactData.message}</p>
            </div>
            
            <p>Notre équipe va examiner votre demande et vous répondra dans les plus brefs délais.</p>
            <p>Pour toute urgence, vous pouvez nous joindre au ${process.env.CONTACT_PHONE || '+33 00 00 000'}.</p>
            
            <p>Cordialement,<br>L'équipe ${process.env.COMPANY_NAME || 'Notre Société'}</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Notre Société'}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Merci pour votre message !

Bonjour ${contactData.fullName},

Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.

Votre message : ${contactData.message}

Notre équipe va examiner votre demande et vous répondra dans les plus brefs délais.

Pour toute urgence, vous pouvez nous joindre au ${process.env.CONTACT_PHONE || '+33 00 00 000'}.

Cordialement,
L'équipe ${process.env.COMPANY_NAME || 'Notre Société'}
    `;

    const mailOptions: EmailOptions = {
      to,
      subject: 'Confirmation de réception de votre message',
      html,
      text
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Confirmation email sent to', to);
      return true;
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Ne pas throw l'erreur ici pour ne pas bloquer l'enregistrement en base
      return false;
    }
  }
}

export default new EmailService();