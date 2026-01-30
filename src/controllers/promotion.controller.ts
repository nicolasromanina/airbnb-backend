import { Request, Response } from 'express';
import { Promotion } from '../models/Promotion';

export const getPromotionByRoomId = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const promotion = await Promotion.findOne({ roomId: Number(roomId) }).lean();
    
    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }
    
    res.json({ success: true, data: promotion });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch promotion', details: (error as any).message });
  }
};

export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const updateData = req.body;

    // Use new: true to get the updated document, and runValidators: false to avoid validation errors on partial updates
    const promotion = await Promotion.findOneAndUpdate(
      { roomId: Number(roomId) },
      updateData,
      { new: true, upsert: true, runValidators: false }
    ).lean();

    console.log('✅ Promotion updated:', {
      roomId,
      title: promotion?.title,
      image: promotion?.image,
      cardImage: promotion?.cardImage,
      isActive: promotion?.isActive
    });

    res.json({ success: true, data: promotion });
  } catch (error) {
    console.error('❌ Error updating promotion:', error);
    res.status(500).json({ success: false, error: 'Failed to update promotion', details: (error as any).message });
  }
};

export const getPromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findById(id).lean();
    
    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }
    
    res.json({ success: true, data: promotion });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch promotion', details: (error as any).message });
  }
};

export const createPromotion = async (req: Request, res: Response) => {
  try {
    const promotionData = req.body;
    
    const promotion = new Promotion(promotionData);
    await promotion.save();
    
    res.status(201).json({ success: true, data: promotion });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create promotion', details: (error as any).message });
  }
};

export const deletePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const promotion = await Promotion.findByIdAndDelete(id);
    
    if (!promotion) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }
    
    res.json({ success: true, message: 'Promotion deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete promotion', details: (error as any).message });
  }
};

export default { getPromotionByRoomId, updatePromotion, getPromotion, createPromotion, deletePromotion };
