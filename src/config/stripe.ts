import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { config } from './env'; // Import depuis le nouveau fichier

console.log('🔧 Configuration Stripe:');
console.log('- Clé secrète:', config.stripe.secretKey ? '✓' : '✗');
console.log('- Webhook secret:', config.stripe.webhookSecret ? '✓' : '✗');

export const stripe = new Stripe(
  config.stripe.secretKey || 'sk_test_dummy_key_for_development',
  {
    apiVersion: '2025-08-27.basil',
    typescript: true,
  }
);

export const STRIPE_WEBHOOK_SECRET = config.stripe.webhookSecret;

export const stripeConfig = {
  defaultCurrency: 'eur',
  paymentMethods: ['card'],
  successUrl: `${config.server.frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${config.server.frontendUrl}/payment-canceled`,
};

logger.info('Stripe configuration loaded', {
  hasSecretKey: !!config.stripe.secretKey,
  hasWebhookSecret: !!config.stripe.webhookSecret,
  mode: config.server.nodeEnv
});