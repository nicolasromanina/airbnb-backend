import mongoose from 'mongoose';
import { AdditionalOption } from '../models/AdditionalOption';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';

const DEFAULT_ADDITIONAL_OPTIONS = [
  // Services
  {
    name: 'Nettoyage',
    description: 'Service de nettoyage professionnel avant votre arrivée',
    category: 'service',
    price: 75,
    pricingType: 'fixed',
    icon: '🧹',
    isActive: true
  },
  // Example: make 'Nettoyage' available for all apartments (global)
  {
    name: 'Draps Premium',
    description: 'Draps de haute qualité fournis',
    category: 'service',
    price: 30,
    pricingType: 'fixed',
    icon: '🛏️',
    isActive: true
  },
  {
    name: 'Parking Couvert',
    description: 'Place de parking couvert réservée',
    category: 'service',
    price: 15,
    pricingType: 'per_day',
    icon: '🅿️',
    isActive: true,
    apartmentIds: [1,2,3]
  },
  {
    name: 'WiFi Premium',
    description: 'Internet haute vitesse illimité',
    category: 'service',
    price: 20,
    pricingType: 'fixed',
    icon: '📡',
    isActive: true
  },

  // Modifications de Séjour
  {
    name: 'Check-in Anticipé',
    description: 'Accès avant 14h00',
    category: 'modification',
    price: 25,
    pricingType: 'fixed',
    icon: '🔑',
    isActive: true
  },
  {
    name: 'Check-out Tardif',
    description: 'Départ après 11h00',
    category: 'modification',
    price: 25,
    pricingType: 'fixed',
    icon: '🕐',
    isActive: true
  },
  {
    name: 'Horaires Flexibles',
    description: 'Check-in/out à heure sur demande',
    category: 'modification',
    price: 50,
    pricingType: 'fixed',
    icon: '⏰',
    isActive: true
  },

  // Assurances
  {
    name: 'Assurance Annulation',
    description: 'Remboursement en cas d\'annulation',
    category: 'insurance',
    price: 75,
    pricingType: 'fixed',
    icon: '🛡️',
    isActive: true
  },
  {
    name: 'Protection Dégâts',
    description: 'Couverture en cas de dégâts matériels',
    category: 'insurance',
    price: 50,
    pricingType: 'fixed',
    icon: '⚠️',
    isActive: true
  },
  {
    name: 'Assurance Responsabilité',
    description: 'Responsabilité civile pendant le séjour',
    category: 'insurance',
    price: 40,
    pricingType: 'fixed',
    icon: '📋',
    isActive: true
  },

  // Commodités
  {
    name: 'Petit-déjeuner',
    description: 'Petit-déjeuner continental délicieux',
    category: 'commodity',
    price: 15,
    pricingType: 'per_day',
    icon: '🥐',
    isActive: true,
    apartmentIds: [1,4,7]
  },
  {
    name: 'Dîner à Domicile',
    description: 'Cuisine gastronomique livrée à votre porte',
    category: 'commodity',
    price: 40,
    pricingType: 'per_day',
    icon: '🍽️',
    isActive: true
  },
  {
    name: 'Panier Pique-nique',
    description: 'Repas à emporter préparé',
    category: 'commodity',
    price: 25,
    pricingType: 'fixed',
    icon: '🧺',
    isActive: true
  },
  {
    name: 'Service Conciergerie',
    description: 'Assistance personnalisée 24h/24',
    category: 'commodity',
    price: 35,
    pricingType: 'fixed',
    icon: '🎩',
    isActive: true
  }
];

async function seedOptions() {
  try {
    // Connecter à la base de données
    await connectDatabase();

    // Vérifier si les options existent déjà
    const existingCount = await AdditionalOption.countDocuments();
    
    if (existingCount > 0) {
      logger.info(`Options already exist in database (${existingCount} records)`);
      console.log(`✓ Database already contains ${existingCount} options`);
      await mongoose.connection.close();
      return;
    }

    // Insérer les options par défaut
    const insertedOptions = await AdditionalOption.insertMany(DEFAULT_ADDITIONAL_OPTIONS);
    
    logger.info(`Successfully seeded ${insertedOptions.length} additional options`);
    console.log(`✓ Successfully seeded ${insertedOptions.length} additional options`);

    // Afficher un résumé
    const byCategory = await AdditionalOption.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Options by Category:');
    byCategory.forEach(cat => {
      console.log(`  - ${cat._id}: ${cat.count} options`);
    });

  } catch (error) {
    logger.error('Seed script error:', error);
    console.error('❌ Seed script error:', error);
    process.exit(1);
  } finally {
    // Fermer la connexion à la base de données
    await mongoose.connection.close();
  }
}

// Exécuter le script
seedOptions();
