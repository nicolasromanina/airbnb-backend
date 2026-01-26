import { Request, Response } from 'express';
import { StripeService } from '../services/stripe.service';
import { ReservationService } from '../services/reservation.service';
import { Payment } from '../models/Payment';
import { Reservation } from '../models/Reservation';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger, logStep } from '../utils/logger';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

const stripeService = new StripeService();
const reservationService = new ReservationService();

export class PaymentController {
  // Validation rules for creating payment
  static validateCreatePayment = [
    body('amount')
      .optional()
      .toFloat()
      .isFloat({ min: 1 })
      .withMessage('Amount must be at least 1€'),
    body('priceId')
      .optional()
      .isString()
      .withMessage('Price ID must be a string'),
    body('reservationDetails')
      .isObject()
      .withMessage('Reservation details are required'),
    body('reservationDetails.apartmentId')
      .optional({ checkFalsy: true })
      .toInt()
      .isInt({ min: 1 })
      .withMessage('Valid apartment ID is required'),
    body('reservationDetails.nights')
      .optional({ checkFalsy: true })
      .toInt()
      .isInt({ min: 1 })
      .withMessage('Number of nights must be at least 1'),
    body('reservationDetails.guests')
      .optional({ checkFalsy: true })
      .toInt()
      .isInt({ min: 1 })
      .withMessage('Number of guests must be at least 1'),
  ];

  createPayment = async (req: AuthRequest, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        logStep('PAYMENT_VALIDATION_ERROR', { errors: errors.array() });
        return res.status(400).json({ 
          success: false,
          message: 'Validation failed',
          errors: errors.array() 
        });
      }

      const { 
        priceId,
        amount,
        reservationDetails 
      } = req.body;

      // Get user from auth middleware
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      logStep('CREATE_PAYMENT_REQUEST', {
        userId: user._id,
        userEmail: user.email,
        hasAmount: !!amount,
        hasPriceId: !!priceId
      });

      // First create reservation
      const reservation = await reservationService.createReservation({
        // Map frontend option names to backend model
        ...reservationDetails,
        additionalOptions: reservationDetails.additionalOptions || reservationDetails.selectedOptions || undefined,
        additionalOptionsPrice: reservationDetails.additionalOptionsPrice ?? reservationDetails.optionsPrice ?? undefined,
        user: user._id,
        status: 'pending',
        checkIn: reservationDetails.checkIn ? new Date(reservationDetails.checkIn) : new Date(),
        checkOut: reservationDetails.checkOut ? new Date(reservationDetails.checkOut) : new Date(Date.now() + (reservationDetails.nights || 1) * 24 * 60 * 60 * 1000),
      });

      logStep('RESERVATION_CREATED_FOR_PAYMENT', {
        reservationId: reservation._id,
        totalPrice: reservation.totalPrice
      });

      // Create Stripe checkout session FIRST (before creating payment record)
      const result = await stripeService.createCheckoutSession({
        priceId,
        amount: amount || reservation.totalPrice,
        reservationDetails: {
          ...reservationDetails,
          _id: reservation._id.toString(),
        },
        userEmail: reservationDetails.customerEmail || user.email,
        userId: user._id.toString(),
        customerId: user.stripeCustomerId,
      });

      logStep('STRIPE_SESSION_CREATED_FOR_PAYMENT', {
        sessionId: result.sessionId,
        url: result.url
      });

      // Now create payment record with the sessionId
      const payment = new Payment({
        sessionId: result.sessionId,
        user: user._id,
        userEmail: reservationDetails.customerEmail || user.email,
        amount: amount || reservation.totalPrice,
        currency: 'eur',
        status: 'pending',
        reservation: reservation._id,
        stripeCustomerId: result.stripeCustomerId || user.stripeCustomerId,
      });

      await payment.save();

      // Update user with stripe customer ID if it was just created
      if (result.stripeCustomerId && !user.stripeCustomerId) {
        await User.findByIdAndUpdate(user._id, { 
          stripeCustomerId: result.stripeCustomerId 
        });
      }

      logStep('PAYMENT_SESSION_CREATED', {
        paymentId: payment._id,
        sessionId: result.sessionId,
        redirectUrl: result.url
      });

      res.json({
        success: true,
        url: result.url,
        sessionId: result.sessionId,
        paymentId: payment._id,
        reservationId: reservation._id,
      });

    } catch (error: any) {
      logger.error('Create payment error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to create payment session';
      
      res.status(statusCode).json({ 
        success: false,
        error: message,
        ...(error.availableFrom && { availableFrom: error.availableFrom }),
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  };;

  // Validation rules for verifying payment
  static validateVerifyPayment = [
    body('sessionId')
      .isString()
      .notEmpty()
      .withMessage('Session ID is required'),
  ];

  verifyPayment = async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      logStep('VERIFY_PAYMENT_REQUEST', { sessionId });

      const result = await stripeService.verifyPayment(sessionId);

      res.json(result);

    } catch (error: any) {
      logger.error('Verify payment error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to verify payment';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  getPaymentBySessionId = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      logStep('GET_PAYMENT_BY_SESSION', { sessionId });

      const payment = await Payment.findOne({ sessionId })
        .populate('user', 'firstName lastName email')
        .populate('reservation');
      
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json({
        success: true,
        payment
      });

    } catch (error: any) {
      logger.error('Get payment error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to get payment';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  // Nouvel endpoint pour récupérer les infos Stripe complètes
  getStripeSessionDetails = async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      logStep('GET_STRIPE_SESSION_DETAILS', { sessionId });

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'line_items', 'customer', 'shipping_cost']
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Récupérer aussi le paiement depuis notre BD pour avoir le contexte local
      const payment = await Payment.findOne({ sessionId })
        .populate('user', 'firstName lastName email')
        .populate('reservation');

      // Combiner les données Stripe et notre BD
      res.json({
        success: true,
        session: {
          id: session.id,
          status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_email,
          customer_details: session.customer_details,
          payment_intent: session.payment_intent,
          payment_method_types: session.payment_method_types,
          created: session.created,
          expires_at: session.expires_at,
          mode: session.mode,
          metadata: session.metadata,
          line_items: session.line_items,
          customer: session.customer,
        },
        payment: payment ? {
          _id: payment._id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          userEmail: payment.userEmail,
          user: payment.user,
          reservation: payment.reservation,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        } : null
      });

    } catch (error: any) {
      logger.error('Get Stripe session details error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to get Stripe session details';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  getUserPayments = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { page = 1, limit = 10, status } = req.query;
      
      logStep('GET_USER_PAYMENTS', { 
        userId: user._id,
        page,
        limit,
        status 
      });

      const query: any = { user: user._id };
      if (status) {
        query.status = status;
      }

      const payments = await Payment.find(query)
        .populate('reservation')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      const total = await Payment.countDocuments(query);

      res.json({
        success: true,
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });

    } catch (error: any) {
      logger.error('Get user payments error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to get payments';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  handleStripeWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe signature' });
    }

    // CORRECTION : Utiliser req.body directement (déjà un buffer avec express.raw())
    // OU utiliser req.rawBody si vous avez créé le middleware personnalisé
    
    const rawBody = (req as any).rawBody || req.body;
    
    if (!rawBody) {
      return res.status(400).json({ error: 'Missing request body' });
    }

    // Vérifier que c'est bien un Buffer ou string
    const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
    
    await stripeService.handleWebhookEvent(payload, sig);
    
    res.json({ received: true });

  } catch (error: any) {
    logger.error('Stripe webhook error:', error);
    
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Failed to process webhook';
    
    res.status(statusCode).json({ 
      success: false,
      error: message
    });
  }
};

  getPaymentStats = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { startDate, endDate } = req.query;
      
      const query: any = { user: user._id };
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      const stats = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalStats = await Payment.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' }
          }
        }
      ]);

      res.json({
        success: true,
        stats,
        totals: totalStats[0] || { totalPayments: 0, totalAmount: 0, averageAmount: 0 }
      });

    } catch (error: any) {
      logger.error('Get payment stats error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to get payment statistics';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };
}