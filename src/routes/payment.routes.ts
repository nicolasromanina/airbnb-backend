import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// ✅ SOLUTION DÉFINITIVE - Route webhook Stripe
router.post('/webhook', (req, res) => {
  console.log('🎯 WEBHOOK STRIPE - Nouvelle requête');
  
  // Méthode 1 : Si Express a déjà lu le body
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    console.log('📦 Body déjà parsé par Express');
    console.log('📝 Type d\'événement:', req.body.type);
    
    // Convertir en Buffer
    const rawBody = JSON.stringify(req.body);
    const payload = Buffer.from(rawBody, 'utf8');
    const sig = req.headers['stripe-signature'] as string;
    
    // Appeler le contrôleur avec les données
    (req as any).rawBody = rawBody;
    return paymentController.handleStripeWebhook(req, res);
  }
  
  // Méthode 2 : Lire manuellement si pas déjà fait
  console.log('📖 Lecture manuelle du body...');
  
  let rawBody = '';
  req.on('data', (chunk: Buffer) => {
    rawBody += chunk.toString('utf8');
  });
  
  req.on('end', () => {
    console.log('✅ Body lu:', rawBody.length, 'bytes');
    
    if (!rawBody) {
      console.error('❌ Body vide');
      return res.status(400).json({ error: 'Empty body' });
    }
    
    // Stocker et appeler le contrôleur
    (req as any).rawBody = rawBody;
    paymentController.handleStripeWebhook(req, res);
  });
  
  req.on('error', (error) => {
    console.error('❌ Erreur lecture body:', error);
    res.status(500).json({ error: 'Failed to read body' });
  });
});

// Public routes
router.post(
  '/verify',
  PaymentController.validateVerifyPayment,
  paymentController.verifyPayment
);

router.get('/session/:sessionId', paymentController.getPaymentBySessionId);

// Nouvel endpoint pour récupérer les infos Stripe complètes
router.get(
  '/stripe-session/:sessionId',
  paymentController.getStripeSessionDetails
);

// Protected routes
router.post(
  '/create',
  authenticate,
  PaymentController.validateCreatePayment,
  paymentController.createPayment
);

router.get(
  '/my-payments',
  authenticate,
  paymentController.getUserPayments
);

router.get(
  '/stats',
  authenticate,
  paymentController.getPaymentStats
);

// Admin routes
router.get(
  '/',
  authenticate,
  authorize('admin'),
  paymentController.getUserPayments // Reusing with admin privileges
);

export default router;