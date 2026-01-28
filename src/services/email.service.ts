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

  async sendReservationConfirmationEmail(to: string, reservationData: {
    firstName: string;
    lastName: string;
    title: string;
    apartmentNumber: string;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    guests: number;
    bedrooms: number;
    totalPrice: number;
    pricePerNight: number;
    additionalOptionsPrice?: number;
    additionalOptions?: Array<{ name: string; price: number; quantity: number }>;
    reservationId: string;
  }) {
    const formatDate = (date: Date) => new Date(date).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const optionsHtml = reservationData.additionalOptions && reservationData.additionalOptions.length > 0
      ? `
        <h3 style="color: #FF2D75; margin-top: 20px; margin-bottom: 10px;">Options supplémentaires</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="text-align: left; padding: 10px; border-bottom: 1px solid #dee2e6;">Option</th>
              <th style="text-align: center; padding: 10px; border-bottom: 1px solid #dee2e6;">Quantité</th>
              <th style="text-align: right; padding: 10px; border-bottom: 1px solid #dee2e6;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${reservationData.additionalOptions.map(opt => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 10px;">${opt.name}</td>
                <td style="text-align: center; padding: 10px;">${opt.quantity}</td>
                <td style="text-align: right; padding: 10px;">${(opt.price * opt.quantity).toFixed(2)}€</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF2D75 0%, #FF1B7C 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #dee2e6; border-top: none; }
          .section { margin: 20px 0; }
          .section-title { color: #FF2D75; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #FF2D75; padding-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
          .info-label { font-weight: bold; color: #666; }
          .info-value { text-align: right; }
          .price-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .price-table th { background-color: #f8f9fa; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold; color: #333; }
          .price-table td { padding: 10px; border-bottom: 1px solid #f0f0f0; }
          .price-table tr:last-child td { border-bottom: 2px solid #FF2D75; }
          .total-row { background-color: #fff9fc; padding: 15px; border-radius: 5px; margin-top: 15px; }
          .total-amount { font-size: 24px; color: #FF2D75; font-weight: bold; text-align: right; }
          .confirmation-badge { display: inline-block; background: #28a745; color: white; padding: 10px 15px; border-radius: 5px; margin: 15px 0; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 12px; text-align: center; }
          .contact-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background-color: #f8f9fa; padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold; }
          td { padding: 10px; border-bottom: 1px solid #f0f0f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎉 Réservation Confirmée!</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Numéro de confirmation: <strong>${reservationData.reservationId}</strong></p>
          </div>
          <div class="content">
            <p>Bonjour ${reservationData.firstName} ${reservationData.lastName},</p>
            
            <p>Merci pour votre confiance ! Nous sommes ravi de vous accueillir. Voici les détails de votre réservation :</p>

            <div class="confirmation-badge">✓ Réservation en cours de traitement</div>

            <!-- Détails du logement -->
            <div class="section">
              <div class="section-title">📍 Logement Réservé</div>
              <div class="info-row">
                <span class="info-label">Titre:</span>
                <span class="info-value">${reservationData.title}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Numéro:</span>
                <span class="info-value">${reservationData.apartmentNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Chambres:</span>
                <span class="info-value">${reservationData.bedrooms}</span>
              </div>
            </div>

            <!-- Dates et durée -->
            <div class="section">
              <div class="section-title">📅 Dates de Séjour</div>
              <div class="info-row">
                <span class="info-label">Arrivée:</span>
                <span class="info-value">${formatDate(reservationData.checkIn)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Départ:</span>
                <span class="info-value">${formatDate(reservationData.checkOut)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Durée:</span>
                <span class="info-value">${reservationData.nights} nuit(s)</span>
              </div>
              <div class="info-row">
                <span class="info-label">Nombre de personnes:</span>
                <span class="info-value">${reservationData.guests}</span>
              </div>
            </div>

            <!-- Résumé du tarif -->
            <div class="section">
              <div class="section-title">💰 Résumé du Tarif</div>
              <table class="price-table">
                <tbody>
                  <tr>
                    <td>Prix par nuit</td>
                    <td style="text-align: right;">${reservationData.pricePerNight.toFixed(2)}€</td>
                  </tr>
                  <tr>
                    <td>Nombre de nuits</td>
                    <td style="text-align: right;">x${reservationData.nights}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: bold; padding-top: 10px;">Sous-total</td>
                    <td style="text-align: right; font-weight: bold; padding-top: 10px;">${(reservationData.pricePerNight * reservationData.nights).toFixed(2)}€</td>
                  </tr>
                  ${reservationData.additionalOptionsPrice && reservationData.additionalOptionsPrice > 0 ? `
                  <tr>
                    <td>Options supplémentaires</td>
                    <td style="text-align: right;">${reservationData.additionalOptionsPrice.toFixed(2)}€</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="font-weight: bold; color: #FF2D75; font-size: 16px;">TOTAL À PAYER</td>
                    <td style="text-align: right; font-weight: bold; color: #FF2D75; font-size: 16px;">${reservationData.totalPrice.toFixed(2)}€</td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${optionsHtml}

            <!-- Informations de contact -->
            <div class="contact-info">
              <p style="margin: 0 0 10px 0; font-weight: bold;">📞 Besoin d'aide ?</p>
              <p style="margin: 0;">Email: <strong>${process.env.CONTACT_EMAIL || 'contact@example.com'}</strong></p>
              <p style="margin: 5px 0 0 0;">Téléphone: <strong>${process.env.CONTACT_PHONE || '+33 00 00 000'}</strong></p>
            </div>

            <p style="margin-top: 20px; color: #666;">
              Prochaine étape : Vous recevrez une confirmation de paiement une fois que votre réservation sera traitée. 
              Un code d'accès et plus de détails vous seront envoyés quelques jours avant votre arrivée.
            </p>

            <div class="footer">
              <p>Cet email a été envoyé automatiquement. Veuillez ne pas y répondre.</p>
              <p>© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Notre Société'}. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
RÉSERVATION CONFIRMÉE

Bonjour ${reservationData.firstName} ${reservationData.lastName},

Merci pour votre confiance ! Voici les détails de votre réservation :

Numéro de confirmation: ${reservationData.reservationId}

LOGEMENT RÉSERVÉ
- Titre: ${reservationData.title}
- Numéro: ${reservationData.apartmentNumber}
- Chambres: ${reservationData.bedrooms}

DATES DE SÉJOUR
- Arrivée: ${formatDate(reservationData.checkIn)}
- Départ: ${formatDate(reservationData.checkOut)}
- Durée: ${reservationData.nights} nuit(s)
- Nombre de personnes: ${reservationData.guests}

RÉSUMÉ DU TARIF
- Prix par nuit: ${reservationData.pricePerNight.toFixed(2)}€
- Nombre de nuits: ${reservationData.nights}
- Sous-total: ${(reservationData.pricePerNight * reservationData.nights).toFixed(2)}€
${reservationData.additionalOptionsPrice && reservationData.additionalOptionsPrice > 0 ? `- Options supplémentaires: ${reservationData.additionalOptionsPrice.toFixed(2)}€` : ''}
- TOTAL À PAYER: ${reservationData.totalPrice.toFixed(2)}€

${reservationData.additionalOptions && reservationData.additionalOptions.length > 0 ? `
OPTIONS SUPPLÉMENTAIRES
${reservationData.additionalOptions.map(opt => `- ${opt.name}: ${(opt.price * opt.quantity).toFixed(2)}€`).join('\n')}
` : ''}

BESOIN D'AIDE ?
Email: ${process.env.CONTACT_EMAIL || 'contact@example.com'}
Téléphone: ${process.env.CONTACT_PHONE || '+33 00 00 000'}

Prochaine étape: Vous recevrez une confirmation de paiement une fois que votre réservation sera traitée.
Un code d'accès et plus de détails vous seront envoyés quelques jours avant votre arrivée.

Cet email a été envoyé automatiquement.
© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Notre Société'}. Tous droits réservés.
    `;

    const mailOptions: EmailOptions = {
      to,
      subject: `Confirmation de réservation - ${reservationData.title}`,
      html,
      text
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Reservation confirmation email sent to', to);
      return true;
    } catch (error) {
      console.error('Error sending reservation confirmation email:', error);
      // Ne pas throw l'erreur ici pour ne pas bloquer l'enregistrement en base
      return false;
    }
  }
}

export default new EmailService();