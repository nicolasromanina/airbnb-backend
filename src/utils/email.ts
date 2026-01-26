import nodemailer from 'nodemailer';

export function createTransporter() {
  if (!process.env.SMTP_HOST) {
    throw new Error('SMTP_HOST not configured');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  const transporter = createTransporter();
  return transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com',
    to,
    subject,
    text,
    html,
  });
}
