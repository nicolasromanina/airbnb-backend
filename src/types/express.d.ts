// Extend Express Request type to include Cloudinary properties
declare namespace Express {
  interface Request {
    cloudinaryUrl?: string;
    cloudinaryPublicId?: string;
  }
}
