# 🔐 Créer un Admin en Production

**3 méthodes pour créer un compte administrateur**

---

## ✅ Méthode 1: Script Automatique (Recommandé)

### Localement
```bash
cd backend

# Avec env variables
ADMIN_EMAIL="admin@yourdomain.com" \
ADMIN_PASSWORD="YourSecurePassword123!" \
ADMIN_FIRST_NAME="John" \
ADMIN_LAST_NAME="Admin" \
npm run create:admin
```

### En Production (Render/Vercel)

#### Option A: Via Console Render
1. **Render Dashboard** → Select Your Service
2. **Shell** tab
3. Exécutez:
```bash
ADMIN_EMAIL="admin@yourdomain.com" \
ADMIN_PASSWORD="SecurePassword123!" \
ADMIN_FIRST_NAME="John" \
ADMIN_LAST_NAME="Admin" \
npm run create:admin
```

#### Option B: Ajouter une Commande Build
Modifier `render.yaml`:
```yaml
buildCommand: npm install --include=dev && npm run build && npm run create:admin
```

Puis fournir les env variables:
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_FIRST_NAME` (optionnel)
- `ADMIN_LAST_NAME` (optionnel)

---

## ✅ Méthode 2: MongoDB Compass (Direct)

### Étapes
1. Ouvrir **MongoDB Compass**
2. Connecter à votre cluster Atlas
3. Database → `booking-app` → `users`
4. Ajouter document:

```json
{
  "email": "admin@yourdomain.com",
  "password": "HashedPasswordHere",
  "firstName": "Admin",
  "lastName": "User",
  "role": "superadmin",
  "isActive": true,
  "createdAt": new Date(),
  "updatedAt": new Date()
}
```

**⚠️ Attention**: Le mot de passe doit être **hashé** avec bcrypt!

---

## ✅ Méthode 3: API Endpoint (À Créer)

Si vous créez un endpoint administrateur:

```typescript
// POST /api/admin/create-first-admin
// Body:
{
  "email": "admin@yourdomain.com",
  "password": "SecurePassword123!",
  "firstName": "Admin",
  "lastName": "User"
}
```

---

## 🔒 Étapes de Sécurité

### 1. Générer un Mot de Passe Robuste
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Ou utiliser: https://www.1password.com/password-generator/
```

### 2. Créer l'Admin
```bash
npm run create:admin
```

### 3. Vérifier en Production
```bash
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "SecurePassword123!"
  }'
# Doit retourner un JWT token ✅
```

### 4. Changer le Mot de Passe
- Se connecter avec les credentials d'admin
- Aller au profil
- Changer le mot de passe temporaire

---

## 📋 Variables d'Environnement

Pour `npm run create:admin`:

```bash
ADMIN_EMAIL="admin@company.com"              # Email admin
ADMIN_PASSWORD="SecurePass123!"              # Mot de passe (min 6 chars)
ADMIN_FIRST_NAME="John"                      # Prénom (défaut: "Admin")
ADMIN_LAST_NAME="Doe"                        # Nom (défaut: "User")
MONGODB_URI="mongodb+srv://..."              # Connection string
```

---

## ✅ Vérification

Après création, vérifier dans MongoDB:

```javascript
// MongoDB Compass → Query
db.users.findOne({ email: "admin@yourdomain.com" })

// Doit afficher:
{
  _id: ObjectId(...),
  email: "admin@yourdomain.com",
  firstName: "John",
  lastName: "Admin",
  role: "superadmin",
  isActive: true,
  createdAt: ISODate(...),
  updatedAt: ISODate(...)
}
```

---

## 🚀 Recommandations

| Aspect | Recommandation |
|--------|----------------|
| **Méthode** | Script automatique (create-admin) ✅ |
| **Env Vars** | Utiliser secrets du platform |
| **Mot de passe** | 12+ caractères, mélangé (maj/min/chiffres/symboles) |
| **Email** | Adresse professionnelle / d'équipe |
| **Stockage** | Password manager (1Password, LastPass, etc.) |
| **Changement** | Après première connexion |

---

## 🔐 Super Admin vs Admin

| Rôle | Permissions | Utilisation |
|------|-------------|------------|
| **superadmin** | Tout contrôle | Créateur du système |
| **admin** | Gestion complète | Administrateurs ordinaires |
| **manager** | Gestion partielle | Responsables |
| **support** | Lecture/Assistance | Support client |
| **user** | Compte client | Utilisateurs normaux |

---

## ⚠️ Sécurité Importante

✅ **À FAIRE**
- Utiliser des mots de passe robustes
- Changer le mot de passe par défaut
- Activer 2FA si disponible
- Utiliser des env variables
- Ne jamais commiter les credentials

❌ **NE PAS FAIRE**
- Utiliser "admin123" comme mot de passe
- Commiter credentials en Git
- Partager le mot de passe par email
- Utiliser le même mot de passe partout
- Laisser le mot de passe par défaut

---

## 🆘 Troubleshooting

### Erreur: "Email already exists"
```
Solution: L'admin existe déjà
→ Vérifier dans MongoDB Compass
→ Supprimer et recréer ou changer d'email
```

### Erreur: "Cannot connect to MongoDB"
```
Solution: MongoDB URI invalide
→ Vérifier MONGODB_URI dans .env
→ Vérifier IP whitelist MongoDB Atlas
→ Vérifier credentials
```

### Erreur: "Password must be at least 6 characters"
```
Solution: Mot de passe trop court
→ Utiliser minimum 6 caractères
→ Recommandé: 12+ caractères
```

---

## 📞 Questions Fréquentes

**Q: Puis-je créer plusieurs admins?**
Oui, exécutez le script plusieurs fois avec des emails différents.

**Q: Comment supprimer un admin?**
Via MongoDB Compass ou créer un endpoint DELETE.

**Q: Comment réinitialiser le mot de passe?**
Créer un endpoint "forgot password" ou supprimer/recréer l'utilisateur.

**Q: Combien d'admins devrais-je créer?**
Minimum: 1 pour les tests
Production: 2-3 (principal + backup)

---

## 🎯 Résumé Rapide

```bash
# Créer un admin localement
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="YourSecurePass123!" \
npm run create:admin

# En production sur Render
# Shell → Exécuter la même commande

# Vérifier
curl -X POST https://your-api.com/api/auth/login \
  -d '{"email":"admin@example.com","password":"YourSecurePass123!"}'
```

**C'est tout!** ✅

