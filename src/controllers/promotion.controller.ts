import { Request, Response } from 'express';
import { Promotion } from '../models/Promotion';

export const getPromotionByRoomId = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const roomIdNumber = Number(roomId);
    const roomIdString = String(roomId);
    
    console.log('🔍 Searching for promotion:', { roomId, roomIdNumber, roomIdString });

    // Try to find with number first, then with string if not found
    let promotion = await Promotion.findOne({ roomId: roomIdNumber }).lean();
    
    if (!promotion) {
      console.log('📌 Not found as number, trying as string...');
      // MongoDB might have stored it as string, so also try that
      promotion = await Promotion.findOne({ roomId: roomIdString } as any).lean();
    }
    
    if (!promotion) {
      console.log('❌ Promotion not found for roomId:', roomId);
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }
    
    console.log('✅ Promotion found:', {
      roomId: promotion.roomId,
      title: promotion.title,
      hasImage: !!promotion.image,
      isActive: promotion.isActive ?? true  // Show isActive, defaulting to true if undefined
    });
    
    res.json({ success: true, data: promotion });
  } catch (error) {
    console.error('❌ Error fetching promotion:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch promotion', details: (error as any).message });
  }
};

export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    let updateData = req.body;
    const roomIdNumber = Number(roomId);

    console.log('🔄 Updating promotion:', {
      roomId: roomIdNumber,
      hasTitle: !!updateData.title,
      hasImage: !!updateData.image,
      hasCardImage: !!updateData.cardImage
    });

    // Ensure roomId is always a number in the update data
    const sanitizedData = {
      ...updateData,
      roomId: roomIdNumber
    };

    // Filter out empty/null values to prevent overwriting with empty data
    // Only update fields that are explicitly provided and have values
    const cleanedData = Object.entries(sanitizedData).reduce((acc, [key, value]) => {
      // Always include roomId
      if (key === 'roomId') {
        acc[key] = value;
        return acc;
      }
      
      // For other fields, only include if they have a value
      // This prevents auto-save with empty fields from clearing existing data
      if (value !== null && value !== undefined && value !== '') {
        acc[key] = value;
      }
      
      return acc;
    }, {} as any);

    console.log('📝 Cleaned data for update:', {
      fields: Object.keys(cleanedData),
      hasTitle: !!cleanedData.title,
      hasImage: !!cleanedData.image,
      hasCardImage: !!cleanedData.cardImage
    });

    // Use new: true to get the updated document, and runValidators: false to avoid validation errors on partial updates
    const promotion = await Promotion.findOneAndUpdate(
      { $or: [{ roomId: roomIdNumber }, { roomId: String(roomId) } as any] },
      cleanedData,
      { new: true, upsert: true, runValidators: false }
    ).lean();

    console.log('✅ Promotion updated:', {
      roomId: promotion?.roomId,
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
