import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Chercher le fichier .env
const envFile = path.resolve(__dirname, '../../.env');
const envExampleFile = path.resolve(__dirname, '../../.env.example');

console.log('🔍 Recherche du fichier .env...');
console.log('Chemin .env:', envFile);
console.log('Existe:', fs.existsSync(envFile));
console.log('Chemin .env.example:', envExampleFile);
console.log('Existe:', fs.existsSync(envExampleFile));

// Charger .env
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log('✅ .env chargé depuis:', envFile);
} else if (fs.existsSync(envExampleFile)) {
  dotenv.config({ path: envExampleFile });
  console.log('⚠️  .env.example chargé depuis:', envExampleFile);
} else {
  console.warn('⚠️  Aucun fichier .env trouvé');
}

// Configuration exportée
export const config = {
  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  
  // Database
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-app',
  },
  
  // Server
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

// Validation
console.log('🔐 Configuration chargée:');
console.log('- Port:', config.server.port);
console.log('- Mode:', config.server.nodeEnv);
console.log('- Stripe Key:', config.stripe.secretKey ? 'PRÉSENTE' : 'ABSENTE');
console.log('- MongoDB:', config.database.uri);

if (!config.stripe.secretKey && config.server.nodeEnv === 'production') {
  throw new Error('STRIPE_SECRET_KEY is required in production');
}

export default config;