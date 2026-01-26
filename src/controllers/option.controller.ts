import { Request, Response } from 'express';
import { AdditionalOption } from '../models/AdditionalOption';
import { logger, logStep } from '../utils/logger';
import { body, validationResult } from 'express-validator';

export class AdditionalOptionController {
  // Validation rules for creating option
  static validateCreateOption = [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required'),
    body('category')
      .isIn(['service', 'modification', 'insurance', 'commodity'])
      .withMessage('Invalid category'),
    body('price')
      .toFloat()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('pricingType')
      .optional()
      .isIn(['fixed', 'per_day', 'per_guest'])
      .withMessage('Invalid pricing type'),
  ];

  // Get all active options
  getAllOptions = async (req: Request, res: Response) => {
    try {
      logStep('GET_ALL_OPTIONS', {});

      // If an apartmentId is provided, include global options (no apartmentIds) and options matching that apartment
      const apartmentId = req.query.apartmentId as string | undefined;
      let filter: any = { isActive: true };
      if (apartmentId) {
        const aIdNum = Number(apartmentId);
        filter = {
          isActive: true,
          $or: [
            { apartmentIds: { $exists: false } },
            { apartmentIds: { $size: 0 } },
            { apartmentIds: aIdNum }
          ]
        };
      }

      const options = await AdditionalOption.find(filter).sort('category');

      // Group by category
      const grouped = options.reduce((acc: any, option) => {
        if (!acc[option.category]) {
          acc[option.category] = [];
        }
        acc[option.category].push(option);
        return acc;
      }, {});

      res.json({
        success: true,
        options: grouped,
        all: options
      });

    } catch (error: any) {
      logger.error('Get all options error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch options'
      });
    }
  };

  // Get options by category
  getOptionsByCategory = async (req: Request, res: Response) => {
    try {
      const { category } = req.params;

      logStep('GET_OPTIONS_BY_CATEGORY', { category });

      if (!['service', 'modification', 'insurance', 'commodity'].includes(category)) {
        return res.status(400).json({ 
          error: 'Invalid category' 
        });
      }

      const options = await AdditionalOption.find({ 
        category, 
        isActive: true 
      });

      res.json({
        success: true,
        category,
        options
      });

    } catch (error: any) {
      logger.error('Get options by category error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch options'
      });
    }
  };

  // Get single option
  getOption = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      logStep('GET_OPTION', { id });

      const option = await AdditionalOption.findById(id);

      if (!option) {
        return res.status(404).json({ error: 'Option not found' });
      }

      res.json({
        success: true,
        option
      });

    } catch (error: any) {
      logger.error('Get option error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch option'
      });
    }
  };

  // Create option (Admin only)
  createOption = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, category, price, pricingType, icon } = req.body;

      logStep('CREATE_OPTION', { name, category });

      const option = new AdditionalOption({
        name,
        description,
        category,
        price,
        pricingType: pricingType || 'fixed',
        icon,
        isActive: true
      });

      await option.save();

      logStep('OPTION_CREATED', { optionId: option._id });

      res.status(201).json({
        success: true,
        option
      });

    } catch (error: any) {
      logger.error('Create option error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create option'
      });
    }
  };

  // Update option (Admin only)
  updateOption = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description, category, price, pricingType, icon, isActive } = req.body;

      logStep('UPDATE_OPTION', { id });

      const option = await AdditionalOption.findByIdAndUpdate(
        id,
        {
          name,
          description,
          category,
          price,
          pricingType,
          icon,
          isActive
        },
        { new: true, runValidators: true }
      );

      if (!option) {
        return res.status(404).json({ error: 'Option not found' });
      }

      logStep('OPTION_UPDATED', { optionId: id });

      res.json({
        success: true,
        option
      });

    } catch (error: any) {
      logger.error('Update option error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to update option'
      });
    }
  };

  // Delete option (Admin only)
  deleteOption = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      logStep('DELETE_OPTION', { id });

      const option = await AdditionalOption.findByIdAndDelete(id);

      if (!option) {
        return res.status(404).json({ error: 'Option not found' });
      }

      logStep('OPTION_DELETED', { optionId: id });

      res.json({
        success: true,
        message: 'Option deleted successfully'
      });

    } catch (error: any) {
      logger.error('Delete option error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete option'
      });
    }
  };
}
