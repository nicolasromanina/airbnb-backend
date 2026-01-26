// backend/src/controllers/roomDetailController.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import RoomDetail from '../models/RoomDetail';

class RoomDetailController {
  
  // Récupérer tous les détails de chambres
  async getAllRoomDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      const details = await RoomDetail.find().sort({ roomId: 1 });
      
      res.status(200).json({
        success: true,
        data: details
      });
    } catch (error) {
      console.error('RoomDetail.getAllRoomDetails error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération des détails des chambres',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Récupérer les détails d'une chambre
  async getRoomDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const id = parseInt(roomId);
      
      if (isNaN(id)) {
        res.status(400).json({ 
          success: false,
          error: 'Room ID must be a valid number'
        });
        return;
      }
      
      let detail = await RoomDetail.findOne({ roomId: id });
      
      // Si non trouvé, créer un template par défaut
      if (!detail) {
        try {
          const defaultDetail = new RoomDetail({
            roomId: id,
            title: `Chambre ${id}`,
            subtitle: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
            description: 'Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus.',
            price: 300,
            guests: "jusqu'à 4 invités",
            bedrooms: "2 chambres à coucher",
            images: [],
            features: []
          });
          detail = await defaultDetail.save();
        } catch (createError) {
          console.error('RoomDetail.getRoomDetail - error creating default:', createError);
          // Return template data without saving
          detail = {
            roomId: id,
            title: `Chambre ${id}`,
            subtitle: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
            description: 'Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus.',
            price: 300,
            guests: "jusqu'à 4 invités",
            bedrooms: "2 chambres à coucher",
            images: [],
            features: []
          } as any;
        }
      }
      
      res.status(200).json({
        success: true,
        data: detail
      });
    } catch (error) {
      console.error('RoomDetail.getRoomDetail error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la récupération du détail de la chambre',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Mettre à jour les détails d'une chambre
  async updateRoomDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const id = parseInt(roomId);
      const updateData = req.body;
      const updatedBy = (req as any).user?.email || 'anonymous';
      
      // Extract meta from updateData to avoid conflicts
      const { meta, ...cleanData } = updateData;
      
      // Prepare update object with proper MongoDB operators
      const updateObj = {
        $set: {
          ...cleanData,
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy
        },
        $inc: { 'meta.version': 1 }
      };
      
      const updatedDetail = await RoomDetail.findOneAndUpdate(
        { roomId: id },
        updateObj,
        { 
          new: true,
          upsert: true,
          setDefaultsOnInsert: true 
        }
      );
      
      res.status(200).json({
        success: true,
        data: updatedDetail
      });
    } catch (error) {
      console.error('RoomDetail.updateRoomDetail error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la mise à jour',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Créer un détail de chambre
  async createRoomDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId, ...data } = req.body;
      const id = parseInt(roomId);
      
      const newDetail = new RoomDetail({
        roomId: id,
        ...data
      });
      
      const saved = await newDetail.save();
      
      res.status(201).json({
        success: true,
        data: saved
      });
    } catch (error) {
      console.error('RoomDetail.createRoomDetail error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la création',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Supprimer les détails d'une chambre
  async deleteRoomDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      const id = parseInt(roomId);
      
      await RoomDetail.deleteOne({ roomId: id });
      
      res.status(200).json({
        success: true,
        message: 'Détails de la chambre supprimés'
      });
    } catch (error) {
      console.error('RoomDetail.deleteRoomDetail error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Erreur lors de la suppression',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new RoomDetailController();
