import { Reservation, IReservation } from '../models/Reservation';
import { Payment } from '../models/Payment';
import { User, IUser } from '../models/User';
import emailService from './email.service';
import { logger, logStep } from '../utils/logger';
import { Types } from 'mongoose';

export class ReservationService {
  async createReservation(reservationData: Partial<IReservation>) {
    logStep('CREATE_RESERVATION', { 
      apartmentId: reservationData.apartmentId,
      userId: reservationData.user 
    });

    try {
      // Validate dates
      if (reservationData.checkIn && reservationData.checkOut) {
        const checkIn = new Date(reservationData.checkIn);
        const checkOut = new Date(reservationData.checkOut);
        
        if (checkIn >= checkOut) {
          throw new Error('Check-in date must be before check-out date');
        }

        // Check for overlapping reservations
        // Only check confirmed reservations, not pending ones
        // Pending reservations can be retried/updated without blocking new attempts
        const overlappingReservations = await Reservation.find({
          apartmentId: reservationData.apartmentId,
          status: 'confirmed',  // Only check confirmed reservations
          $or: [
            { checkIn: { $lt: checkOut, $gte: checkIn } },
            { checkOut: { $gt: checkIn, $lte: checkOut } },
            { checkIn: { $lte: checkIn }, checkOut: { $gte: checkOut } }
          ]
        });

        if (overlappingReservations.length > 0) {
          // Compute next available start date for the requested duration
          const nextAvailable = await this.computeNextAvailableStart(
            reservationData.apartmentId as number,
            checkIn,
            checkOut
          );

          const err: any = new Error('This apartment is already booked for the selected dates');
          if (nextAvailable) err.availableFrom = nextAvailable.toISOString();
          throw err;
        }
      }

      // Validate & normalize additional options if provided
      if (reservationData.additionalOptions && Array.isArray(reservationData.additionalOptions)) {
        const allowedPricing = ['fixed', 'per_day', 'per_guest'];
        const normalized: any[] = [];

        for (const rawOpt of reservationData.additionalOptions) {
          const opt = rawOpt || {};
          const optionId = opt.optionId || (opt as any)._id || (opt as any).id || null;
          const name = String(opt.name || (opt as any).optionName || (opt as any).title || '').trim();
          const pricingType = allowedPricing.includes((opt as any).pricingType) ? (opt as any).pricingType : 'fixed';
          const price = Number(opt.price ?? (opt as any).unitPrice ?? 0);
          const quantity = Number(opt.quantity ?? (opt as any).qty ?? 1);

          if (!name) throw Object.assign(new Error('Invalid reservation option: name is required'), { statusCode: 400 });
          if (isNaN(price) || price < 0) throw Object.assign(new Error('Invalid reservation option: price must be >= 0'), { statusCode: 400 });
          if (!Number.isFinite(quantity) || quantity < 1) throw Object.assign(new Error('Invalid reservation option: quantity must be >= 1'), { statusCode: 400 });

          let oid: any = optionId;
          try {
            if (optionId && Types.ObjectId.isValid(String(optionId))) oid = new Types.ObjectId(String(optionId));
          } catch (e) {
            // leave as-is
          }

          normalized.push({ optionId: oid, name, price, quantity, pricingType });
        }

        reservationData.additionalOptions = normalized as any;

        // Compute additionalOptionsPrice if not provided, using nights/guests when pricingType requires it
        if (reservationData.additionalOptionsPrice == null) {
          const nights = Number(reservationData.nights ?? 1) || 1;
          const guests = Number(reservationData.guests ?? 1) || 1;
          let totalOpt = 0;
          for (const o of normalized) {
            switch (o.pricingType) {
              case 'per_day':
                totalOpt += o.price * nights * o.quantity;
                break;
              case 'per_guest':
                totalOpt += o.price * guests * o.quantity;
                break;
              case 'fixed':
              default:
                totalOpt += o.price * o.quantity;
            }
          }
          reservationData.additionalOptionsPrice = Number(totalOpt.toFixed(2));
        }
      }

      const reservation = new Reservation(reservationData);
      await reservation.save();

      logStep('RESERVATION_CREATED', { 
        reservationId: reservation._id,
        status: reservation.status 
      });

      // Envoyer l'email de confirmation automatiquement
      try {
        // Récupérer les informations de l'utilisateur
        const user = await User.findById(reservationData.user) as IUser | null;
        
        if (user && user.email) {
          logStep('SENDING_RESERVATION_EMAIL', { 
            reservationId: reservation._id,
            userEmail: user.email 
          });

          await emailService.sendReservationConfirmationEmail(user.email, {
            firstName: user.firstName,
            lastName: user.lastName,
            title: reservationData.title || 'Réservation',
            apartmentNumber: reservationData.apartmentNumber || '',
            checkIn: reservationData.checkIn as Date,
            checkOut: reservationData.checkOut as Date,
            nights: reservationData.nights as number,
            guests: reservationData.guests as number,
            bedrooms: reservationData.bedrooms as number,
            totalPrice: reservationData.totalPrice as number,
            pricePerNight: reservationData.pricePerNight as number,
            additionalOptionsPrice: reservationData.additionalOptionsPrice as number,
            additionalOptions: (reservationData.additionalOptions as any[])?.map(opt => ({
              name: opt.name,
              price: opt.price,
              quantity: opt.quantity
            })) || [],
            reservationId: reservation._id.toString()
          });

          logStep('RESERVATION_EMAIL_SENT', { 
            reservationId: reservation._id,
            userEmail: user.email 
          });
        } else {
          logger.warn('Could not send reservation email - user or email not found', { 
            userId: reservationData.user,
            reservationId: reservation._id 
          });
        }
      } catch (emailError) {
        logger.error('Error sending reservation email - continuing anyway', { 
          error: emailError,
          reservationId: reservation._id 
        });
        // Ne pas jeter l'erreur - la réservation est déjà créée
      }

      return reservation;
    } catch (error) {
      logger.error('Error creating reservation:', error);
      throw error;
    }
  }

  async getReservationById(id: string, userId?: string) {
    logStep('GET_RESERVATION_BY_ID', { id, userId });
    
    try {
      const query: any = { _id: id };
      if (userId) {
        query.user = userId;
      }

      const reservation = await Reservation.findOne(query)
        .populate('user', 'firstName lastName email')
        .populate('payment', 'status amount currency');

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      return reservation;
    } catch (error) {
      logger.error('Error getting reservation:', error);
      throw error;
    }
  }

  async getUserReservations(userId: string, status?: string) {
    logStep('GET_USER_RESERVATIONS', { userId, status });
    
    try {
      const query: any = { user: userId };
      if (status) {
        query.status = status;
      }

      const reservations = await Reservation.find(query)
        .populate('payment', 'status amount currency createdAt')
        .sort({ createdAt: -1 });

      return reservations;
    } catch (error) {
      logger.error('Error getting user reservations:', error);
      throw error;
    }
  }

  async updateReservationStatus(id: string, status: IReservation['status'], userId?: string) {
    logStep('UPDATE_RESERVATION_STATUS', { id, status, userId });
    
    try {
      const query: any = { _id: id };
      if (userId) {
        query.user = userId;
      }

      const reservation = await Reservation.findOneAndUpdate(
        query,
        { status },
        { new: true, runValidators: true }
      );

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      logStep('RESERVATION_STATUS_UPDATED', { 
        id, 
        newStatus: status 
      });

      return reservation;
    } catch (error) {
      logger.error('Error updating reservation status:', error);
      throw error;
    }
  }

  /**
   * Determine if guest is currently checked in
   */
  isCheckedIn(reservation: any): boolean {
    const now = new Date();
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    return now >= checkIn && now < checkOut;
  }

  /**
   * Determine if guest can still be refunded based on timing
   */
  calculateRefundPercentage(reservation: any): number {
    const now = new Date();
    const checkIn = new Date(reservation.checkIn);
    const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilCheckIn >= 48) return 100; // Full refund if >48 hours before check-in
    if (hoursUntilCheckIn >= 24) return 50;  // 50% refund if 24-48 hours
    if (hoursUntilCheckIn > 0) return 0;     // No refund if <24 hours before check-in
    
    // If guest is checked in or past check-in, partial refund for early checkout
    const checkOut = new Date(reservation.checkOut);
    const daysRemaining = (checkOut.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const totalDays = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
    
    return Math.max(0, Math.round((daysRemaining / totalDays) * 100));
  }

  /**
   * Request cancellation of a reservation (before check-in)
   */
  async requestCancellation(id: string, userId: string, reason?: string) {
    logStep('REQUEST_CANCELLATION', { id, userId, reason });
    
    try {
      const reservation = await Reservation.findOne({
        _id: id,
        user: userId,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (!reservation) {
        throw new Error('Reservation not found or cannot be cancelled');
      }

      // If guest is already checked in, deny cancellation
      if (this.isCheckedIn(reservation)) {
        throw new Error(
          'Guest is already checked in. Cannot cancel. ' +
          'Please use early checkout if guest wants to leave early.'
        );
      }

      // Check if check-in is within 24 hours
      const now = new Date();
      const checkIn = new Date(reservation.checkIn);
      const hoursUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilCheckIn < 24 && reservation.status === 'confirmed') {
        throw new Error('Cannot cancel reservation less than 24 hours before check-in');
      }

      // Calculate refund percentage
      const refundPercentage = this.calculateRefundPercentage(reservation);
      const totalPrice = reservation.totalPrice;
      const refundAmount = (totalPrice * refundPercentage) / 100;

      // Update reservation with cancellation details
      reservation.status = 'cancelled';
      reservation.actionType = 'cancellation';
      reservation.cancellationReason = reason || 'No reason provided';
      reservation.cancellationRequestedAt = now;
      reservation.refundPercentage = refundPercentage;
      reservation.refundAmount = refundAmount;
      await reservation.save();

      // Process refund in payment
      if (reservation.payment) {
        const payment = await Payment.findById(reservation.payment);
        if (payment && payment.status === 'paid') {
          payment.status = 'refunded';
          payment.refundedAt = now;
          payment.refundReason = `Cancellation: ${reason || 'Customer requested'}`;
          await payment.save();
        }
      }

      logStep('CANCELLATION_REQUESTED', { id, refundPercentage, refundAmount });
      return reservation;
    } catch (error) {
      logger.error('Error requesting cancellation:', error);
      throw error;
    }
  }

  /**
   * Process early checkout (guest leaves before checkout date)
   */
  async processEarlyCheckout(id: string, userId: string, reason?: string) {
    logStep('PROCESS_EARLY_CHECKOUT', { id, userId, reason });
    
    try {
      const reservation = await Reservation.findOne({
        _id: id,
        user: userId,
        status: 'confirmed'
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // Verify guest is checked in
      if (!this.isCheckedIn(reservation)) {
        throw new Error(
          'Guest is not checked in yet or already checked out. ' +
          'Cannot process early checkout.'
        );
      }

      const now = new Date();
      const refundPercentage = this.calculateRefundPercentage(reservation);
      const totalPrice = reservation.totalPrice;
      const refundAmount = (totalPrice * refundPercentage) / 100;

      // Update reservation
      reservation.status = 'early_checkout';
      reservation.actionType = 'early_checkout';
      reservation.actualCheckoutDate = now;
      reservation.earlyCheckoutReason = reason || 'Guest requested early departure';
      reservation.refundPercentage = refundPercentage;
      reservation.refundAmount = refundAmount;
      await reservation.save();

      // Process refund if applicable
      if (refundPercentage > 0 && reservation.payment) {
        const payment = await Payment.findById(reservation.payment);
        if (payment && payment.status === 'paid') {
          payment.status = 'refunded';
          payment.refundedAt = now;
          payment.refundReason = `Early checkout: ${reason || 'Guest requested early departure'}`;
          await payment.save();
        }
      }

      logStep('EARLY_CHECKOUT_PROCESSED', { id, refundPercentage, refundAmount });
      return reservation;
    } catch (error) {
      logger.error('Error processing early checkout:', error);
      throw error;
    }
  }

  /**
   * Modify reservation dates
   */
  async modifyReservation(
    id: string,
    userId: string,
    newCheckIn?: Date,
    newCheckOut?: Date,
    reason?: string
  ) {
    logStep('MODIFY_RESERVATION', { id, userId, newCheckIn, newCheckOut });
    
    try {
      const reservation = await Reservation.findOne({
        _id: id,
        user: userId
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // Cannot modify if guest is checked in (unless it's extension)
      const now = new Date();
      const currentCheckOut = new Date(reservation.checkOut);
      
      if (this.isCheckedIn(reservation) && newCheckOut && newCheckOut < currentCheckOut) {
        throw new Error(
          'Cannot shorten stay for checked-in guest. Please use early checkout instead.'
        );
      }

      // Save original dates
      const originalCheckOut = reservation.checkOut;

      // Update dates if provided
      if (newCheckIn) reservation.checkIn = newCheckIn;
      if (newCheckOut) reservation.checkOut = newCheckOut;

      reservation.actionType = 'modification';
      reservation.originalCheckOut = originalCheckOut;
      reservation.modificationReason = reason || 'No reason provided';
      reservation.modifiedAt = now;

      await reservation.save();

      logStep('RESERVATION_MODIFIED', { id });
      return reservation;
    } catch (error) {
      logger.error('Error modifying reservation:', error);
      throw error;
    }
  }

  /**
   * Raise dispute for a reservation
   */
  async raiseDispute(id: string, userId: string, disputeReason: string) {
    logStep('RAISE_DISPUTE', { id, userId, disputeReason });
    
    try {
      const reservation = await Reservation.findOne({
        _id: id,
        user: userId
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      const now = new Date();

      reservation.status = 'dispute';
      reservation.actionType = 'dispute_resolution';
      reservation.disputeReason = disputeReason;
      reservation.disputeResolvedAt = undefined; // Will be set when admin resolves
      await reservation.save();

      logStep('DISPUTE_RAISED', { id });
      return reservation;
    } catch (error) {
      logger.error('Error raising dispute:', error);
      throw error;
    }
  }

  /**
   * Legacy method: cancelReservation - now dispatches to appropriate method
   */
  async cancelReservation(id: string, userId: string) {
    logStep('CANCEL_RESERVATION', { id, userId });
    
    try {
      const reservation = await Reservation.findOne({
        _id: id,
        user: userId
      });

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      // If guest is checked in, suggest early checkout instead
      if (this.isCheckedIn(reservation)) {
        throw new Error(
          'Cannot cancel: guest is already checked in. ' +
          'Please use early checkout endpoint instead. ' +
          'Endpoint: POST /api/reservations/:id/early-checkout'
        );
      }

      // Otherwise, process as cancellation
      return this.requestCancellation(id, userId, 'Cancelled via legacy endpoint');
    } catch (error) {
      logger.error('Error in cancelReservation:', error);
      throw error;
    }
  }

  async checkAvailability(apartmentId: number, checkIn: Date, checkOut: Date) {
    logStep('CHECK_AVAILABILITY', { apartmentId, checkIn, checkOut });
    
    try {
      const overlappingReservations = await Reservation.countDocuments({
        apartmentId,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
          { checkIn: { $lt: checkOut, $gte: checkIn } },
          { checkOut: { $gt: checkIn, $lte: checkOut } },
          { checkIn: { $lte: checkIn }, checkOut: { $gte: checkOut } }
        ]
      });

      const isAvailable = overlappingReservations === 0;

      const result: any = {
        isAvailable,
        message: isAvailable 
          ? 'Apartment is available for the selected dates' 
          : 'Apartment is not available for the selected dates'
      };

      if (!isAvailable) {
        // suggest next available start date for the same duration
        const nextAvailable = await this.computeNextAvailableStart(apartmentId, checkIn, checkOut);
        if (nextAvailable) result.nextAvailable = nextAvailable.toISOString();
      }

      return result;
    } catch (error) {
      logger.error('Error checking availability:', error);
      throw error;
    }
  }

  // Compute the earliest start date on or after requestedCheckIn where the requested duration fits
  async computeNextAvailableStart(apartmentId: number | undefined, requestedCheckIn: Date, requestedCheckOut: Date) {
    if (!apartmentId) return null;

    try {
      const durationMs = requestedCheckOut.getTime() - requestedCheckIn.getTime();

      // Get confirmed reservations that end after the requested check-in
      const reservations = await Reservation.find({
        apartmentId,
        status: 'confirmed',
        checkOut: { $gt: requestedCheckIn }
      }).sort({ checkIn: 1 });

      // If there are no reservations that conflict, the requested start is available
      if (!reservations || reservations.length === 0) {
        return requestedCheckIn;
      }

      // Walk the bookings to find a gap >= durationMs starting at or after requestedCheckIn
      let candidateStart = new Date(requestedCheckIn);

      for (const r of reservations) {
        const rCheckIn = new Date(r.checkIn);
        const rCheckOut = new Date(r.checkOut);

        // If reservation starts after candidateStart
        if (rCheckIn.getTime() > candidateStart.getTime()) {
          // gap between candidateStart and r.checkIn
          const gap = rCheckIn.getTime() - candidateStart.getTime();
          if (gap >= durationMs) {
            return candidateStart;
          }
          // otherwise move candidateStart to r.checkOut
          candidateStart = new Date(Math.max(candidateStart.getTime(), rCheckOut.getTime()));
        } else {
          // reservation starts at or before candidateStart -> move candidateStart to after this reservation
          candidateStart = new Date(Math.max(candidateStart.getTime(), rCheckOut.getTime()));
        }
      }

      // No gap found within existing reservations, candidateStart is after last reservation's checkout
      return candidateStart;
    } catch (error) {
      logger.error('Error computing next available start:', error);
      return null;
    }
  }

  async getReservationStats(userId?: string) {
    logStep('GET_RESERVATION_STATS', { userId });
    
    try {
      const query: any = {};
      if (userId) {
        query.user = userId;
      }

      const stats = await Reservation.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'confirmed'] }, '$totalPrice', 0]
              }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('Error getting reservation stats:', error);
      throw error;
    }
  }
}