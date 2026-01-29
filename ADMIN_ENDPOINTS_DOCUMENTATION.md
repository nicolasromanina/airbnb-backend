# Documentation des Endpoints d'Administration - Airbnb Backend

**Date**: 29 janvier 2026  
**Version**: 1.0  
**Préfixe API**: `/api/admin`

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification et Permissions](#authentification-et-permissions)
3. [Endpoints Utilisateurs](#endpoints-utilisateurs)
4. [Endpoints Réservations](#endpoints-réservations)
5. [Endpoints CMS](#endpoints-cms)
6. [Configuration et Paramètres](#configuration-et-paramètres)
7. [Structures de Données](#structures-de-données)

---

## Vue d'ensemble

Le backend Airbnb dispose d'une suite complète d'endpoints d'administration pour gérer:
- **Utilisateurs**: Gestion des rôles, statut, et communications
- **Réservations**: Confirmation, annulation, export et historique
- **Contenu CMS**: Gestion des pages, restauration d'historique
- **Communications**: Envoi de messages aux utilisateurs

### Configuration globale
- **Port**: 3000 (configurable via `PORT`)
- **Rate Limiting**: 100 requêtes/15min (production), 500 (développement)
- **Taille maximale du body**: 10MB (configurable via `REQUEST_LIMIT`)
- **CORS**: Support de origins multiples

---

## Authentification et Permissions

### Mécanisme d'authentification
Tous les endpoints admin nécessitent un **JWT Bearer token** dans le header `Authorization`:

```
Authorization: Bearer <token_jwt>
```

### Rôles disponibles
| Rôle | Description | Niveau |
|------|-------------|---------|
| `user` | Utilisateur standard | 1 (Aucun accès admin) |
| `support` | Support client | 2 (Accès limité) |
| `manager` | Manager | 3 (Accès étendu) |
| `admin` | Administrateur | 4 (Accès complet) |
| `superadmin` | Super administrateur | 5 (Accès total + dev) |

### Middleware d'autorisation
```typescript
// Format: authorize('role1', 'role2', ...)
// Exemple: authorize('admin', 'superadmin', 'manager')
// = Requiert l'un des rôles spécifiés
```

### Gestion des rôles utilisateur
- `superadmin`: Peut créer/modifier les rôles d'autres utilisateurs
- `admin`: Peut accéder à la plupart des endpoints
- `manager`: Accès limité à la gestion des réservations et utilisateurs
- `support`: Peut gérer les communications uniquement
- `user`: Accès standard (pas d'accès admin)

---

## Endpoints Utilisateurs

### 1️⃣ GET `/api/admin/users` - Lister les utilisateurs
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Récupère une liste paginée des utilisateurs

#### Requête
```http
GET /api/admin/users?page=1&limit=20&q=email_ou_nom HTTP/1.1
Authorization: Bearer <token>
```

#### Paramètres Query
| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `page` | number | Non | Page (défaut: 1) |
| `limit` | number | Non | Nombre par page (défaut: 20) |
| `q` | string | Non | Recherche par email/firstName/lastName |

#### Réponse (200 OK)
```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "phone": "+33612345678",
      "isActive": true,
      "role": "user",
      "stripeCustomerId": "cus_ABC123",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-20T14:45:00Z",
      "reservationsCount": 5
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

---

### 2️⃣ GET `/api/admin/users/:id` - Récupérer un utilisateur
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Récupère les détails d'un utilisateur spécifique avec historique de réservations

#### Requête
```http
GET /api/admin/users/507f1f77bcf86cd799439011 HTTP/1.1
Authorization: Bearer <token>
```

#### Validation
| Champ | Validation |
|-------|-----------|
| `id` | MongoID valide |

#### Réponse (200 OK)
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "+33612345678",
    "isActive": true,
    "role": "user",
    "stripeCustomerId": "cus_ABC123",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T14:45:00Z",
    "history": [
      {
        "_id": "607f2f77bcf86cd799439012",
        "title": "Studio Parisien",
        "status": "confirmed",
        "checkIn": "2024-02-01T15:00:00Z",
        "checkOut": "2024-02-05T11:00:00Z",
        "nights": 4,
        "guests": 2,
        "totalPrice": 400,
        "createdAt": "2024-01-10T09:00:00Z"
      }
    ]
  }
}
```

#### Codes d'erreur
| Code | Description |
|------|-------------|
| 404 | Utilisateur non trouvé |
| 500 | Erreur serveur |

---

### 3️⃣ PUT `/api/admin/users/:id/role` - Mettre à jour le rôle d'un utilisateur
**Authentification**: OUI  
**Permissions**: `superadmin` UNIQUEMENT  
**Description**: Change le rôle ou le statut d'un utilisateur

#### Requête
```http
PUT /api/admin/users/507f1f77bcf86cd799439011/role HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "manager",
  "isActive": true
}
```

#### Corps de la requête (Body)
| Champ | Type | Obligatoire | Valeurs acceptées |
|-------|------|-------------|-------------------|
| `role` | string | Non | `user`, `admin`, `manager`, `support`, `superadmin` |
| `isActive` | boolean | Non | `true` ou `false` |

#### Validation
| Champ | Règle |
|-------|-------|
| `id` | MongoID valide |
| `role` | Dans l'énumération autorisée |
| `isActive` | Booléen |

#### Réponse (200 OK)
```json
{
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "manager",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-29T15:22:00Z"
  }
}
```

#### Codes d'erreur
| Code | Description |
|------|-------------|
| 400 | Rôle invalide |
| 403 | Permissions insuffisantes (non superadmin) |
| 404 | Utilisateur non trouvé |
| 500 | Erreur serveur |

---

### 4️⃣ POST `/api/admin/users/communications` - Envoyer des communications aux utilisateurs
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`, `support`  
**Description**: Envoie des emails à plusieurs utilisateurs

#### Requête
```http
POST /api/admin/users/communications HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "userIds": ["507f1f77bcf86cd799439011", "608f2f77bcf86cd799439013"],
  "subject": "Mise à jour importante",
  "message": "Nous avons amélioré notre plateforme..."
}
```

#### Corps de la requête (Body)
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `userIds` | string[] | Non | IDs des utilisateurs (si vide = tous) |
| `subject` | string | OUI | Sujet de l'email |
| `message` | string | OUI | Contenu du message |

#### Validation
| Champ | Règle |
|-------|-------|
| `subject` | Non vide |
| `message` | Non vide |
| `userIds` | Array optionnel |

#### Configuration SMTP requise
L'email nécessite une configuration SMTP valide dans `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@example.com
SMTP_PASS=password
SMTP_SECURE=false
SMTP_FROM=admin@example.com
SMTP_REJECT_UNAUTHORIZED=true
```

#### Réponse (200 OK)
```json
{
  "data": {
    "sent": 2,
    "failed": 0,
    "failures": []
  }
}
```

#### Réponse (200 OK) - Avec erreurs partielles
```json
{
  "data": {
    "sent": 1,
    "failed": 1,
    "failures": [
      {
        "email": "invalid@example.com",
        "reason": "Invalid email format"
      }
    ]
  }
}
```

#### Codes d'erreur
| Code | Description |
|------|-------------|
| 400 | Subject ou message manquant |
| 501 | SMTP non configuré (SMTP_HOST manquant) |
| 500 | Erreur serveur |

---

### 5️⃣ POST `/api/admin/dev/seed-admin` - Créer un superadmin de développement
**Authentification**: NON (développement uniquement)  
**Permissions**: Nécessite `NODE_ENV=development` ou `ALLOW_DEV_SEED=true`  
**Description**: Crée ou retourne un compte superadmin pour développement

#### Requête
```http
POST /api/admin/dev/seed-admin HTTP/1.1
Content-Type: application/json
```

#### Variables d'environnement utilisées
```env
DEV_ADMIN_EMAIL=admin@local.dev
DEV_ADMIN_PWD=Admin123!
NODE_ENV=development
ALLOW_DEV_SEED=true
```

#### Réponse (200 OK) - Compte créé
```json
{
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@local.dev",
      "firstName": "Dev",
      "lastName": "Admin",
      "role": "superadmin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "created": true,
    "password": "Admin123!"
  }
}
```

#### Réponse (200 OK) - Compte existant
```json
{
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@local.dev",
      "firstName": "Dev",
      "lastName": "Admin",
      "role": "superadmin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "created": false
  }
}
```

#### Codes d'erreur
| Code | Description |
|------|-------------|
| 403 | Seeding non autorisé dans cet environnement |
| 500 | Erreur serveur |

---

## Endpoints Réservations

### 6️⃣ GET `/api/admin/bookings` - Lister les réservations
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Récupère une liste paginée des réservations avec filtres

#### Requête
```http
GET /api/admin/bookings?page=1&limit=20&status=confirmed&q=titre HTTP/1.1
Authorization: Bearer <token>
```

#### Paramètres Query
| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `page` | number | Non | Numéro de page (défaut: 1) |
| `limit` | number | Non | Résultats par page (défaut: 20) |
| `status` | string | Non | Filtre par statut (`pending`, `confirmed`, `cancelled`) |
| `user` | string | Non | Filtrer par ID utilisateur |
| `apartmentId` | number | Non | Filtrer par ID appartement |
| `dateFrom` | ISO8601 | Non | Date de début (check-in) |
| `dateTo` | ISO8601 | Non | Date de fin (check-in) |
| `q` | string | Non | Recherche sur nom/email/titre/numero |

#### Réponse (200 OK)
```json
{
  "data": [
    {
      "_id": "607f2f77bcf86cd799439012",
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@example.com"
      },
      "title": "Studio Parisien",
      "apartmentNumber": "APT-001",
      "apartmentId": 1,
      "checkIn": "2024-02-01T15:00:00Z",
      "checkOut": "2024-02-05T11:00:00Z",
      "nights": 4,
      "guests": 2,
      "totalPrice": 400,
      "status": "confirmed",
      "payment": {
        "_id": "707f3f77bcf86cd799439013",
        "status": "completed",
        "amount": 400
      },
      "createdAt": "2024-01-10T09:00:00Z",
      "updatedAt": "2024-01-20T14:00:00Z"
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "limit": 20
  }
}
```

---

### 7️⃣ GET `/api/admin/bookings/export` - Exporter les réservations
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Exporte les réservations en CSV, XLSX ou PDF

#### Requête
```http
GET /api/admin/bookings/export?format=xlsx&status=confirmed HTTP/1.1
Authorization: Bearer <token>
```

#### Paramètres Query
| Paramètre | Type | Obligatoire | Valeurs |
|-----------|------|-------------|---------|
| `format` | string | Non | `csv` (défaut), `xlsx`, `pdf` |
| `status` | string | Non | Filtre par statut |
| `id` | string | Non | Exporter une réservation spécifique |
| `q` | string | Non | Recherche texte |

#### Réponse (200 OK)
**Type MIME**: 
- CSV: `text/csv`
- XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- PDF: `application/pdf`

**Colonnes exportées**:
```
id, userEmail, userName, apartmentId, apartmentNumber, checkIn, checkOut, nights, guests, totalPrice, status, createdAt
```

---

### 8️⃣ GET `/api/admin/bookings/:id` - Récupérer une réservation
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Récupère les détails complets d'une réservation

#### Requête
```http
GET /api/admin/bookings/607f2f77bcf86cd799439012 HTTP/1.1
Authorization: Bearer <token>
```

#### Réponse (200 OK)
```json
{
  "data": {
    "_id": "607f2f77bcf86cd799439012",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "phone": "+33612345678"
    },
    "title": "Studio Parisien",
    "apartmentNumber": "APT-001",
    "apartmentId": 1,
    "checkIn": "2024-02-01T15:00:00Z",
    "checkOut": "2024-02-05T11:00:00Z",
    "nights": 4,
    "guests": 2,
    "totalPrice": 400,
    "status": "confirmed",
    "payment": {
      "_id": "707f3f77bcf86cd799439013",
      "status": "completed",
      "amount": 400,
      "stripePaymentIntentId": "pi_3ABC123XYZ"
    },
    "createdAt": "2024-01-10T09:00:00Z"
  }
}
```

---

### 9️⃣ GET `/api/admin/bookings/:id/communications` - Historique des communications
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`, `support`  
**Description**: Récupère tous les messages envoyés pour cette réservation

#### Requête
```http
GET /api/admin/bookings/607f2f77bcf86cd799439012/communications HTTP/1.1
Authorization: Bearer <token>
```

#### Réponse (200 OK)
```json
{
  "data": [
    {
      "_id": "807f4f77bcf86cd799439014",
      "reservationId": "607f2f77bcf86cd799439012",
      "type": "confirmation_email",
      "subject": "Confirmation de votre réservation",
      "message": "Votre réservation a été confirmée...",
      "status": "sent",
      "sentAt": "2024-01-10T09:30:00Z"
    }
  ]
}
```

---

### 🔟 POST `/api/admin/bookings/:id/confirm` - Confirmer une réservation
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Change le statut d'une réservation à "confirmed" et envoie un email

#### Requête
```http
POST /api/admin/bookings/607f2f77bcf86cd799439012/confirm HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json
```

#### Réponse (200 OK)
```json
{
  "data": {
    "_id": "607f2f77bcf86cd799439012",
    "title": "Studio Parisien",
    "status": "confirmed",
    "user": {
      "email": "jean@example.com",
      "firstName": "Jean",
      "lastName": "Dupont"
    },
    "updatedAt": "2024-01-29T15:30:00Z"
  }
}
```

**Email envoyé à l'utilisateur**:
```
Subject: Votre réservation [titre] est confirmée
Body: Bonjour [firstName],

Votre réservation a été confirmée. Merci.
```

---

### 1️⃣1️⃣ POST `/api/admin/bookings/:id/cancel` - Annuler une réservation
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Change le statut à "cancelled", met à jour le paiement et envoie un email

#### Requête
```http
POST /api/admin/bookings/607f2f77bcf86cd799439012/cancel HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json
```

#### Réponse (200 OK)
```json
{
  "data": {
    "_id": "607f2f77bcf86cd799439012",
    "title": "Studio Parisien",
    "status": "cancelled",
    "user": {
      "email": "jean@example.com",
      "firstName": "Jean"
    },
    "updatedAt": "2024-01-29T15:35:00Z"
  }
}
```

**Actions effectuées**:
- ✅ Statut changé à `cancelled`
- ✅ Paiement associé changé à `canceled` (si existant)
- ✅ Email d'annulation envoyé

---

## Endpoints CMS

### 1️⃣2️⃣ GET `/api/admin/cms/:page` - Récupérer une page CMS
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Récupère le contenu d'une page CMS persistée

#### Requête
```http
GET /api/admin/cms/privacy-policy HTTP/1.1
Authorization: Bearer <token>
```

#### Paramètres Path
| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `page` | string | OUI | Nom de la page (ex: `privacy-policy`, `terms`, `about`) |

#### Réponse (200 OK)
```json
{
  "data": {
    "page": "privacy-policy",
    "content": "Politique de confidentialité...",
    "lastModified": "2024-01-25T10:30:00Z",
    "lastModifiedBy": "admin@example.com"
  }
}
```

---

### 1️⃣3️⃣ POST `/api/admin/cms/:page` - Mettre à jour une page CMS
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Sauvegarde le contenu d'une page CMS (persisté sur disque)

#### Requête
```http
POST /api/admin/cms/privacy-policy HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Nouvelle politique de confidentialité..."
}
```

#### Corps de la requête (Body)
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `content` | string | OUI | Contenu HTML/Markdown de la page |

#### Réponse (200 OK)
```json
{
  "data": {
    "page": "privacy-policy",
    "content": "Nouvelle politique de confidentialité...",
    "lastModified": "2024-01-29T15:40:00Z",
    "lastModifiedBy": "admin@example.com"
  }
}
```

---

### 1️⃣4️⃣ GET `/api/admin/cms/:page/history` - Récupérer l'historique d'une page
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Liste les versions antérieures d'une page CMS

#### Requête
```http
GET /api/admin/cms/privacy-policy/history HTTP/1.1
Authorization: Bearer <token>
```

#### Réponse (200 OK)
```json
{
  "data": [
    {
      "id": 1,
      "content": "Ancienne version...",
      "lastModified": "2024-01-20T10:30:00Z",
      "lastModifiedBy": "manager@example.com"
    },
    {
      "id": 2,
      "content": "Nouvelle version...",
      "lastModified": "2024-01-25T14:15:00Z",
      "lastModifiedBy": "admin@example.com"
    }
  ]
}
```

---

### 1️⃣5️⃣ POST `/api/admin/cms/:page/restore` - Restaurer une version antérieure
**Authentification**: OUI  
**Permissions**: `admin`, `superadmin`, `manager`  
**Description**: Restaure une version antérieure d'une page CMS

#### Requête
```http
POST /api/admin/cms/privacy-policy/restore HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "1"
}
```

#### Corps de la requête (Body)
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `id` | string/number | OUI | ID de la version à restaurer |

#### Validation
| Champ | Règle |
|-------|-------|
| `id` | Valeur numérique |

#### Réponse (200 OK)
```json
{
  "data": {
    "page": "privacy-policy",
    "content": "Contenu restauré...",
    "restoredFrom": 1,
    "restoredAt": "2024-01-29T15:45:00Z"
  }
}
```

---

## Configuration et Paramètres

### Vue d'ensemble

Le backend Airbnb n'expose pas actuellement d'endpoints dédiés `/admin/config` ou `/admin/settings`, mais utilise des variables d'environnement pour la configuration globale et des endpoints sectoriels pour les paramètres métier.

### Configuration système (Variables d'environnement)

#### JWT et Authentification
```env
JWT_SECRET=votre_cle_secrete
JWT_EXPIRES_IN=7d
```

#### Email (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@example.com
SMTP_PASS=password
SMTP_SECURE=false
SMTP_FROM=admin@example.com
SMTP_REJECT_UNAUTHORIZED=true
ADMIN_EMAIL=admin@example.com
```

#### Stripe
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Base de données
```env
MONGODB_URI=mongodb://localhost:27017/booking-app
```

#### Serveur
```env
NODE_ENV=production|development
PORT=3000
FRONTEND_URL=https://example.com
REQUEST_LIMIT=10mb
```

#### Sentry (Error Tracking)
```env
SENTRY_DSN=https://...@sentry.io/...
APP_VERSION=1.0.0
```

#### Développement
```env
ALLOW_DEV_SEED=false
DEV_ADMIN_EMAIL=admin@local.dev
DEV_ADMIN_PWD=Admin123!
```

### Configuration métier (via endpoints dédiés)

#### Page d'accueil (Home)
**Endpoint**: `PUT /api/home/` ou `PUT /api/home/section/:section`
- Navigation, hero banner, sections, testimonials

#### Services
**Endpoint**: `PUT /api/services/` ou `PUT /api/services/section/:section`
- Descriptions, FAQ, features

#### Appartements
**Endpoint**: `PUT /api/apartment/` ou `PUT /api/apartment-details/:apartmentId`
- Descriptions, images, prix, disponibilité

#### Pied de page (Footer)
**Endpoint**: `PUT /api/footer/`
- Liens, contact, réseaux sociaux, galerie

#### Contact
**Endpoint**: `PUT /api/contact/` ou `PUT /api/contact/section/:section`
- Formulaire, localisation, horaires

---

## Structures de Données

### Structure utilisateur
```typescript
interface IUser {
  _id: ObjectId;
  email: string;                    // Unique, lowercase
  password: string;                 // Hashé (bcrypt)
  firstName: string;
  lastName: string;
  phone?: string;                   // Format E.164
  stripeCustomerId?: string;
  isActive: boolean;                // false = compte désactivé
  role: 'user' | 'admin' | 'manager' | 'support' | 'superadmin';
  createdAt: Date;
  updatedAt: Date;
}
```

### Structure réservation
```typescript
interface IReservation {
  _id: ObjectId;
  user: ObjectId;                   // Reference User
  title: string;                    // Nom du logement
  apartmentId: number;
  apartmentNumber: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment?: ObjectId;               // Reference Payment
  createdAt: Date;
  updatedAt: Date;
}
```

### Structure paiement
```typescript
interface IPayment {
  _id: ObjectId;
  reservationId: ObjectId;          // Reference Reservation
  amount: number;
  currency: string;                 // 'EUR', 'USD'
  status: 'pending' | 'completed' | 'canceled';
  stripePaymentIntentId: string;
  stripeSessionId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Structure page CMS
```typescript
interface ICMSPage {
  page: string;                     // 'privacy-policy', 'terms', etc.
  content: string;                  // HTML ou Markdown
  lastModified: Date;
  lastModifiedBy: string;           // Email du modérateur
}
```

### Structure d'erreur standard
```json
{
  "error": "Description de l'erreur",
  "details": "Détails supplémentaires (optionnel)",
  "requiredRoles": ["admin", "superadmin"],
  "userRole": "user"
}
```

---

## Résumé des Endpoints

| # | Méthode | Endpoint | Rôles | Description |
|---|---------|----------|-------|-------------|
| 1 | GET | `/api/admin/users` | admin, superadmin, manager | Lister les utilisateurs |
| 2 | GET | `/api/admin/users/:id` | admin, superadmin, manager | Récupérer un utilisateur |
| 3 | PUT | `/api/admin/users/:id/role` | superadmin | Mettre à jour le rôle |
| 4 | POST | `/api/admin/users/communications` | admin, superadmin, manager, support | Envoyer des emails |
| 5 | POST | `/api/admin/dev/seed-admin` | dev only | Créer superadmin de dev |
| 6 | GET | `/api/admin/bookings` | admin, superadmin, manager | Lister les réservations |
| 7 | GET | `/api/admin/bookings/export` | admin, superadmin, manager | Exporter les réservations |
| 8 | GET | `/api/admin/bookings/:id` | admin, superadmin, manager | Récupérer une réservation |
| 9 | GET | `/api/admin/bookings/:id/communications` | admin, superadmin, manager, support | Historique communications |
| 10 | POST | `/api/admin/bookings/:id/confirm` | admin, superadmin, manager | Confirmer réservation |
| 11 | POST | `/api/admin/bookings/:id/cancel` | admin, superadmin, manager | Annuler réservation |
| 12 | GET | `/api/admin/cms/:page` | admin, superadmin, manager | Récupérer page CMS |
| 13 | POST | `/api/admin/cms/:page` | admin, superadmin, manager | Mettre à jour page CMS |
| 14 | GET | `/api/admin/cms/:page/history` | admin, superadmin, manager | Historique page CMS |
| 15 | POST | `/api/admin/cms/:page/restore` | admin, superadmin, manager | Restaurer page CMS |

---

## Notes importantes

### ⚠️ Limitations actuelles
1. **Pas d'endpoint dédié pour la configuration système** - Les paramètres globaux sont gérés via variables d'environnement
2. **SMTP requis pour les communications** - Sans configuration SMTP, les emails ne peuvent pas être envoyés
3. **Restauration CMS limitée** - Basée sur l'ID de version, pas sur les timestamps

### ✅ Bonnes pratiques
1. Toujours vérifier les permissions avant chaque request
2. Utiliser des filtres de recherche pour les grandes listes
3. Implémenter la pagination (limit/page)
4. Sauvegarder les tokens JWT en local (durée: 7 jours)
5. Utiliser HTTPS en production
6. Valider tous les IDs MongoID avant les requêtes

### 🔐 Sécurité
- Rate limiting: 100 req/15min (production), 500 req/15min (dev)
- Middleware CORS strict en production
- Passwords hashés avec bcrypt (salt: 10)
- Tokens JWT signés avec secret configuration
- TSLINT + ESLint pour le code quality

---

**Documentation générée le**: 29 janvier 2026  
**Version du backend**: 1.0.0  
**Dernier commit**: git push
