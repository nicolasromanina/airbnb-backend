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

// File filter pour les images
const imageFileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, WebP ou GIF.'), false);
  }
};

// File filter pour les vidéos
const videoFileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de vidéo non supporté. Utilisez MP4, WebM, MPEG, MOV ou AVI.'), false);
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB pour les images
  },
  fileFilter: imageFileFilter
});

// Multer pour les vidéos (100MB max)
export const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB pour les vidéos
  },
  fileFilter: videoFileFilter
});

// Middleware to upload to Cloudinary (images & videos)
export const uploadToCloudinary = async (req: any, res: any, next: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier téléchargé' });
  }

  try {
    // Log file information for debugging
    console.log('📤 Upload to Cloudinary:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.path
    });

    // Déterminer le type de ressource (image ou vidéo)
    const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    
    // Create a stream to upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: resourceType === 'video' ? 'airbnb-app/videos' : 'airbnb-app',
        resource_type: resourceType,
        quality: 'auto',
        fetch_format: resourceType === 'video' ? undefined : 'auto',
        eager_async: true,
        // Pour les vidéos: codec optimisé
        ...(resourceType === 'video' && {
          video_sampling: 5,
          background_removal: 'cloudinary_ai'
        })
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          return res.status(500).json({ 
            error: `Erreur lors du téléchargement vers Cloudinary`,
            details: error.message 
          });
        }
        
        // Log successful upload
        console.log('✅ Cloudinary upload success:', {
          url: result?.secure_url,
          publicId: result?.public_id,
          size: result?.bytes,
          width: result?.width,
          height: result?.height
        });
        
        // Attach the Cloudinary result to the request
        req.cloudinaryUrl = result?.secure_url;
        req.cloudinaryPublicId = result?.public_id;
        req.resourceType = resourceType;
        next();
      }
    );

    // Write the buffer to the stream
    stream.write(req.file.buffer);
    stream.end();
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({ 
      error: `Erreur lors du traitement du fichier`,
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
