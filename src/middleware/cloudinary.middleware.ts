import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for multer since we'll upload to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF.'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// Middleware to upload to Cloudinary
export const uploadToCloudinary = async (req: any, res: any, next: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier téléchargé' });
  }

  try {
    // Create a stream to upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'airbnb-app',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({ 
            error: 'Erreur lors du téléchargement vers Cloudinary',
            details: error.message 
          });
        }
        
        // Attach the Cloudinary result to the request
        req.cloudinaryUrl = result?.secure_url;
        req.cloudinaryPublicId = result?.public_id;
        next();
      }
    );

    // Write the buffer to the stream
    stream.end(req.file.buffer);
  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur lors du traitement de l\'image',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to delete from Cloudinary
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    if (!publicId) return;
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};
