import { stripe, stripeConfig } from '../config/stripe';
import { Payment } from '../models/Payment';
import { User } from '../models/User';
import { Reservation } from '../models/Reservation';
import { logger, logStep } from '../utils/logger';

export class StripeService {
  async createCheckoutSession(params: {
    priceId?: string;
    amount?: number;
    reservationDetails: any;
    userEmail: string;
    userId: string;
    customerId?: string;
  }) {
    logStep('CREATE_CHECKOUT_SESSION', { 
      userEmail: params.userEmail,
      userId: params.userId,
      hasAmount: !!params.amount 
    });

    const { priceId, amount, reservationDetails, userEmail, userId, customerId } = params;

    // Validate required parameters
    if (!priceId && !amount) {
      throw new Error("Either priceId or amount must be provided");
    }

    if (!reservationDetails) {
      throw new Error("Reservation details are required");
    }

    // Build line items - Priority to amount over priceId
    const lineItems: any[] = [];

    if (amount) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: reservationDetails.title || "Réservation Appartement",
            description: reservationDetails.description || reservationDetails.apartmentNumber || "Réservation",
            metadata: {
              apartmentId: reservationDetails.apartmentId?.toString() || '0',
              apartmentNumber: reservationDetails.apartmentNumber || 'N/A'
            }
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      });
    } else if (priceId) {
      lineItems.push({
        price: priceId,
        quantity: 1,
      });
    }

    // Create or get customer
    let stripeCustomerId = customerId;
    if (!stripeCustomerId) {
      stripeCustomerId = await this.findOrCreateCustomer(userEmail, userId);
      
      // Update user with stripe customer ID
      await User.findByIdAndUpdate(userId, { stripeCustomerId });
    }

    logStep('CREATING_STRIPE_SESSION', { 
      lineItemsCount: lineItems.length,
      stripeCustomerId 
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: lineItems,
      mode: "payment",
      success_url: stripeConfig.successUrl,
      cancel_url: stripeConfig.cancelUrl,
      metadata: {
        userId,
        reservationId: reservationDetails._id?.toString() || reservationDetails.id?.toString() || 'temp',
        apartmentId: reservationDetails.apartmentId?.toString() || '0',
        apartmentNumber: reservationDetails.apartmentNumber || 'N/A',
        nights: reservationDetails.nights?.toString() || '1',
        guests: reservationDetails.guests?.toString() || '1',
      },
      allow_promotion_codes: true,
    });

    logStep('STRIPE_SESSION_CREATED', { 
      sessionId: session.id, 
      url: session.url 
    });

    return {
      url: session.url,
      sessionId: session.id,
      stripeCustomerId
    };
  }

  async findOrCreateCustomer(email: string, userId: string): Promise<string> {
    logStep('FIND_OR_CREATE_CUSTOMER', { email, userId });
    
    try {
      // Check if customer already exists
      const customers = await stripe.customers.list({ 
        email: email, 
        limit: 1 
      });
      
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        logStep('EXISTING_CUSTOMER_FOUND', { customerId });
        return customerId;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
          createdAt: new Date().toISOString(),
        },
        description: `Customer for user ${userId}`
      });

      logStep('NEW_CUSTOMER_CREATED', { customerId: customer.id });
      return customer.id;
      
    } catch (error) {
      logger.error('Error finding/creating Stripe customer:', error);
      throw new Error('Failed to create Stripe customer');
    }
  }

  async verifyPayment(sessionId: string) {
    logStep('VERIFY_PAYMENT', { sessionId });
    
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent", "line_items", "customer"],
      });

      logStep('SESSION_RETRIEVED', { 
        status: session.payment_status,
        customerEmail: session.customer_email 
      });

      // Find payment in database
      const payment = await Payment.findOne({ sessionId });
      if (!payment) {
        throw new Error(`Payment not found for session ${sessionId}`);
      }

      // Update payment status
      const isPaid = session.payment_status === 'paid';
      payment.status = isPaid ? 'paid' : 'failed';
      
      // Get the payment intent ID (could be string or object)
      if (session.payment_intent) {
        payment.paymentIntentId = typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : (session.payment_intent as any).id;
      }
      
      payment.stripeCheckoutData = session;
      
      if (session.customer && typeof session.customer !== 'string') {
        payment.stripeCustomerId = session.customer.id;
      }

      await payment.save();

      // If paid, update reservation
      if (isPaid) {
        await Reservation.findByIdAndUpdate(payment.reservation, {
          status: 'confirmed',
          payment: payment._id
        });
      }

      return {
        success: isPaid,
        paymentStatus: session.payment_status,
        customerEmail: payment.userEmail || session.customer_email,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
        paymentId: payment._id,
        reservationId: payment.reservation,
      };
      
    } catch (error) {
      logger.error('Error verifying payment:', error);
      throw error;
    }
  }

async handleWebhookEvent(payload: Buffer, signature: string) {
  console.log('🎯 WEBHOOK ARRIVÉ DANS handleWebhookEvent');
  console.log('📦 Payload type:', typeof payload);
  console.log('📦 Payload is Buffer?', Buffer.isBuffer(payload));
  console.log('🔑 Signature:', signature?.substring(0, 30) + '...');
  
  logStep('WEBHOOK_RECEIVED', { 
    payloadLength: payload.length,
    hasSignature: !!signature
  });
  
  try {
    let event;
    
    // En développement, accepter sans vérification
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Mode développement - parsing direct');
      
      // Convertir le Buffer en string puis en objet
      const payloadStr = payload.toString('utf8');
      console.log('📝 Payload (premiers 200 caractères):', payloadStr.substring(0, 200));
      
      try {
        event = JSON.parse(payloadStr);
        console.log('✅ JSON parsé avec succès');
        console.log('📋 Type d\'événement:', event.type);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        throw parseError;
      }
      
    } else {
      // En production, vérifier la signature
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    }
    
    console.log(`🎪 Événement Stripe reçu: ${event.type}`);
    console.log('🎫 Event ID:', event.id);
    
    // Traiter l'événement
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💳 Traitement checkout.session.completed');
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'checkout.session.expired':
        console.log('⏰ Traitement checkout.session.expired');
        await this.handleCheckoutSessionExpired(event.data.object);
        break;
        
      case 'payment_intent.succeeded':
        console.log('✅ Traitement payment_intent.succeeded');
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        console.log('❌ Traitement payment_intent.payment_failed');
        await this.handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'charge.refunded':
        console.log('↩️ Traitement charge.refunded');
        await this.handleChargeRefunded(event.data.object);
        break;
        
      default:
        console.log(`🤷 Événement non géré: ${event.type}`);
        logger.info(`Unhandled event type: ${event.type}`);
    }
    
    console.log('🎉 Webhook traité avec succès');
    return { received: true };
    
  } catch (error) {
    console.error('💥 ERREUR dans handleWebhookEvent:', error);
    logger.error('Webhook error:', error);
    throw error;
  }
}

  private async handleCheckoutSessionCompleted(session: any) {
    logStep('CHECKOUT_SESSION_COMPLETED', { sessionId: session.id });
    
    try {
      const payment = await Payment.findOne({ sessionId: session.id });
      if (payment) {
        payment.status = session.payment_status === 'paid' ? 'paid' : 'pending';
        await payment.save();
      }
    } catch (error) {
      logger.error('Error handling checkout session completed:', error);
    }
  }

  private async handleCheckoutSessionExpired(session: any) {
    logStep('CHECKOUT_SESSION_EXPIRED', { sessionId: session.id });
    
    try {
      await Payment.findOneAndUpdate(
        { sessionId: session.id },
        { status: 'canceled' }
      );
    } catch (error) {
      logger.error('Error handling checkout session expired:', error);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any) {
    logStep('PAYMENT_INTENT_SUCCEEDED', { paymentIntentId: paymentIntent.id });
    // Additional logic if needed
  }

  private async handlePaymentIntentFailed(paymentIntent: any) {
    logStep('PAYMENT_INTENT_FAILED', { paymentIntentId: paymentIntent.id });
    
    try {
      await Payment.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { status: 'failed' }
      );
    } catch (error) {
      logger.error('Error handling payment intent failed:', error);
    }
  }

  private async handleChargeRefunded(charge: any) {
    logStep('CHARGE_REFUNDED', { chargeId: charge.id });
    
    try {
      const payment = await Payment.findOne({ paymentIntentId: charge.payment_intent });
      if (payment) {
        payment.status = 'refunded';
        payment.refundedAt = new Date();
        payment.refundReason = 'Customer requested refund';
        await payment.save();

        // Update reservation status
        await Reservation.findByIdAndUpdate(payment.reservation, {
          status: 'cancelled'
        });
      }
    } catch (error) {
      logger.error('Error handling charge refunded:', error);
    }
  }
}