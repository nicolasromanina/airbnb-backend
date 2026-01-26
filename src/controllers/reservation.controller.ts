import { Request, Response } from 'express';
import { ReservationService } from '../services/reservation.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger, logStep } from '../utils/logger';
import { body, validationResult, param } from 'express-validator';

const reservationService = new ReservationService();

export class ReservationController {
  // Validation rules for creating reservation
  static validateCreateReservation = [
    body('apartmentId')
      .isInt({ min: 1 })
      .withMessage('Valid apartment ID is required'),
    body('apartmentNumber')
      .isString()
      .notEmpty()
      .withMessage('Apartment number is required'),
    body('title')
      .isString()
      .notEmpty()
      .withMessage('Title is required'),
    body('image')
      .isString()
      .notEmpty()
      .withMessage('Image URL is required'),
    body('includes')
      .isArray()
      .withMessage('Includes must be an array'),
    body('checkIn')
      .isISO8601()
      .toDate()
      .withMessage('Valid check-in date is required'),
    body('checkOut')
      .isISO8601()
      .toDate()
      .withMessage('Valid check-out date is required'),
    body('nights')
      .isInt({ min: 1 })
      .withMessage('Number of nights must be at least 1'),
    body('guests')
      .isInt({ min: 1 })
      .withMessage('Number of guests must be at least 1'),
    body('bedrooms')
      .isInt({ min: 1 })
      .withMessage('Number of bedrooms must be at least 1'),
    body('totalPrice')
      .isFloat({ min: 0 })
      .withMessage('Total price must be a positive number'),
    body('pricePerNight')
      .isFloat({ min: 0 })
      .withMessage('Price per night must be a positive number'),
  ];

  createReservation = async (req: AuthRequest, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      logStep('CREATE_RESERVATION_REQUEST', {
        userId: user._id,
        apartmentId: req.body.apartmentId
      });

      const reservationData = {
        // Map frontend option field names to backend model fields
        ...req.body,
        additionalOptions: req.body.additionalOptions || req.body.selectedOptions || undefined,
        additionalOptionsPrice: req.body.additionalOptionsPrice ?? req.body.optionsPrice ?? undefined,
        user: user._id,
        status: 'pending'
      };

      const reservation = await reservationService.createReservation(reservationData);

      logStep('RESERVATION_CREATED_SUCCESS', {
        reservationId: reservation._id,
        status: reservation.status
      });

      res.status(201).json({
        success: true,
        reservation
      });

    } catch (error: any) {
      logger.error('Create reservation error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to create reservation';
      
      res.status(statusCode).json({ 
        success: false,
        error: message,
        ...(error.availableFrom && { availableFrom: error.availableFrom }),
        ...(error.nextAvailable && { nextAvailable: error.nextAvailable })
      });
    }
  };

  getReservation = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;

      logStep('GET_RESERVATION_REQUEST', { reservationId: id, userId: user?._id });

      const reservation = await reservationService.getReservationById(id, user?._id);

      res.json({
        success: true,
        reservation
      });

    } catch (error: any) {
      logger.error('Get reservation error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to get reservation';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  getUserReservations = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { status, page = 1, limit = 10 } = req.query;
      
      logStep('GET_USER_RESERVATIONS_REQUEST', {
        userId: user._id,
        status,
        page,
        limit
      });

      const reservations = await reservationService.getUserReservations(user._id, status as string);

      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedReservations = reservations.slice(startIndex, endIndex);

      res.json({
        success: true,
        reservations: paginatedReservations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: reservations.length,
          pages: Math.ceil(reservations.length / Number(limit))
        }
      });

    } catch (error: any) {
      logger.error('Get user reservations error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to get user reservations';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  updateReservationStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      logStep('UPDATE_RESERVATION_STATUS_REQUEST', {
        reservationId: id,
        newStatus: status,
        userId: user._id
      });

      const reservation = await reservationService.updateReservationStatus(id, status, user._id);

      res.json({
        success: true,
        reservation
      });

    } catch (error: any) {
      logger.error('Update reservation status error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to update reservation status';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  cancelReservation = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      logStep('CANCEL_RESERVATION_REQUEST', {
        reservationId: id,
        userId: user._id
      });

      const reservation = await reservationService.cancelReservation(id, user._id);

      res.json({
        success: true,
        reservation,
        message: 'Reservation cancelled successfully'
      });

    } catch (error: any) {
      logger.error('Cancel reservation error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to cancel reservation';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  checkAvailability = async (req: Request, res: Response) => {
    try {
      const { apartmentId, checkIn, checkOut } = req.query;

      if (!apartmentId || !checkIn || !checkOut) {
        return res.status(400).json({ 
          error: 'apartmentId, checkIn, and checkOut are required' 
        });
      }

      logStep('CHECK_AVAILABILITY_REQUEST', {
        apartmentId,
        checkIn,
        checkOut
      });

      const result = await reservationService.checkAvailability(
        Number(apartmentId),
        new Date(checkIn as string),
        new Date(checkOut as string)
      );

      res.json({
        success: true,
        ...result
      });

    } catch (error: any) {
      logger.error('Check availability error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to check availability';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  getReservationStats = async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      logStep('GET_RESERVATION_STATS_REQUEST', { userId: user._id });

      const stats = await reservationService.getReservationStats(user._id);

      res.json({
        success: true,
        stats
      });

    } catch (error: any) {
      logger.error('Get reservation stats error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to get reservation statistics';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };

  deleteReservation = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      logStep('DELETE_RESERVATION_REQUEST', {
        reservationId: id,
        userId: user._id
      });

      const reservation = await reservationService.getReservationById(id, user._id);

      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      // Only allow deletion of cancelled or completed reservations
      if (!['cancelled', 'completed'].includes(reservation.status)) {
        return res.status(400).json({ 
          error: 'Cannot delete reservation with current status',
          currentStatus: reservation.status,
          allowedStatuses: ['cancelled', 'completed']
        });
      }

      // In production, you might want to soft delete instead
      // For now, we'll mark as cancelled
      reservation.status = 'cancelled';
      await reservation.save();

      logStep('RESERVATION_DELETED', { reservationId: id });

      res.json({
        success: true,
        message: 'Reservation deleted successfully'
      });

    } catch (error: any) {
      logger.error('Delete reservation error:', error);
      
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Failed to delete reservation';
      
      res.status(statusCode).json({ 
        success: false,
        error: message
      });
    }
  };
}