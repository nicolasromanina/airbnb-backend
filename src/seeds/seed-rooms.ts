// backend/src/seeds/seed-rooms.ts
import mongoose from 'mongoose';
import RoomDetail from '../models/RoomDetail';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';

const ROOM_DETAILS = [
  {
    roomId: 2,
    title: 'Chambre 2',
    subtitle: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
    description: 'Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
    price: 900,
    guests: 'jusqu\'à 6 invités',
    bedrooms: '2 chambres à coucher',
    accommodationType: 'Logement sans fumeur',
    includes: ['Thé', 'Café', 'Petit déjeuner'],
    amenities: ['Parking sécurisé'],
    features: ['Vue panoramique', 'Balcon privé', 'Salle de bain luxe'],
    images: [],
    selectedOptionIds: [],
    meta: {
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: 'seed-script',
      version: 1
    }
  }
];

async function seedRoomDetails() {
  try {
    console.log('[SEED] Connecting to database...');
    await connectDatabase();
    console.log('[SEED] ✅ Database connected');

    for (const roomData of ROOM_DETAILS) {
      console.log(`[SEED] Processing Room ${roomData.roomId}...`);
      
      // Check if room already exists
      const existingRoom = await RoomDetail.findOne({ roomId: roomData.roomId });
      
      if (existingRoom) {
        console.log(`[SEED] Room ${roomData.roomId} already exists, updating...`);
        const updated = await RoomDetail.findOneAndUpdate(
          { roomId: roomData.roomId },
          { 
            ...roomData,
            'meta.updatedAt': new Date(),
            'meta.updatedBy': 'seed-script-update'
          },
          { new: true }
        );
        console.log(`[SEED] ✅ Room ${roomData.roomId} updated:`, {
          title: updated?.title,
          price: updated?.price,
          guests: updated?.guests,
          bedrooms: updated?.bedrooms,
          includes: updated?.includes,
          amenities: updated?.amenities
        });
      } else {
        console.log(`[SEED] Creating new Room ${roomData.roomId}...`);
        const newRoom = new RoomDetail(roomData);
        const saved = await newRoom.save();
        console.log(`[SEED] ✅ Room ${roomData.roomId} created:`, {
          title: saved.title,
          price: saved.price,
          guests: saved.guests,
          bedrooms: saved.bedrooms,
          includes: saved.includes,
          amenities: saved.amenities
        });
      }
    }

    console.log('[SEED] ✅ Room details seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] ❌ Error seeding room details:', error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedRoomDetails();
}

export default seedRoomDetails;
