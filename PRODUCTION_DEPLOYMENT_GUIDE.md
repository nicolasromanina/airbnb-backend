# 🚀 Production Deployment Guide - Backend

## Status: Production Ready ✅

Votre backend est maintenant configuré pour MongoDB Atlas et prêt pour la production.

---

## 📋 Configuration Effectuée

### ✅ Base de Données
- **Provider**: MongoDB Atlas
- **Connection String**: `mongodb+srv://airbnb_user:d4CdJV6T8E8EIJvR@airrbnb-cluster.upznduc.mongodb.net`
- **Pool Size**: 10 (production) / 5 (development)
- **SSL/TLS**: Activé ✅
- **Timeouts**: Optimisés pour production (30s server selection, 60s socket)

### ✅ Sécurité
- **Helmet**: Protection contre les vulnérabilités HTTP
- **CORS**: Configuré avec allowedOrigins
- **Rate Limiting**: 100 requêtes par 15 minutes (production)
- **Proxy Trust**: Activé pour les load balancers
- **HSTS**: 1 an de durée (production)

### ✅ Gestion des Erreurs
- **Graceful Shutdown**: Arrêt propre du serveur
- **Error Handlers**: Logs complètes des erreurs
- **Unhandled Rejections**: Gestion des promises rejetées
- **Uncaught Exceptions**: Gestion des exceptions non capturées

### ✅ Logs & Monitoring
- **Winston Logger**: Logs structurées
- **Request Logging**: IP, User Agent, Origin
- **Error Tracking**: Tous les erreurs loggées
- **Health Check**: Endpoint `/health` disponible

---

## 🔧 Prérequis pour la Production

### 1. Secrets & Clés (À ABSOLUMENT changer)
```
❌ CHANGEZ AVANT LA PRODUCTION:
- JWT_SECRET → Générez une clé aléatoire robuste
- STRIPE_SECRET_KEY → Utilisez vos clés de production
- STRIPE_PUBLISHABLE_KEY → Clés de production Stripe
- SMTP_PASS → Votre vrai mot de passe d'app
```

### 2. URLs & Domaines
```
À mettre à jour dans .env.production:
- FRONTEND_URL → Votre domaine de production
- SMTP_USER → Votre email professionnel
- SMTP_FROM → Email d'envoi
```

### 3. Base de Données MongoDB Atlas
```
✅ Vérifications à faire:
- Cluster actif et accessible
- IP Whitelist configurée (allowlist)
- Utilisateur airbnb_user créé
- Database "booking-app" créée (optionnel)
- Backups automatiques activés
```

---

## 🚀 Déploiement sur Vercel (Recommandé)

### Étape 1: Préparer le Projet
```bash
# Build le backend
cd backend
npm run build

# Vérifiez que dist/ est créé
ls -la dist/
```

### Étape 2: Configurer Vercel

1. **Créez un compte** sur [vercel.com](https://vercel.com)
2. **Importez le projet** GitHub/GitLab
3. **Configurez les variables d'environnement**:
   - Allez dans Settings → Environment Variables
   - Copiez-collez vos secrets du `.env.production`
   - Sélectionnez "Production" pour NODE_ENV

### Étape 3: Configuration Vercel (vercel.json)

Votre projet a déjà `vercel.json`. Vérifiez le contenu:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Étape 4: Déployez
```bash
vercel --prod
```

---

## 🐳 Déploiement avec Docker

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["npm", "start"]
```

### Build & Run
```bash
# Build
docker build -t airbnb-backend:latest .

# Run
docker run -p 3000:3000 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e NODE_ENV="production" \
  -e JWT_SECRET="your-secret" \
  airbnb-backend:latest
```

---

## ☁️ Déploiement sur Render / Railway / Heroku

### Render.com (Recommandé)

1. **Créez un compte** Render
2. **New Service** → GitHub
3. **Configurez**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Runtime: Node
   - Environment: Production
4. **Variables d'environnement**: Dans Settings
5. **Deploy**

### Railway.app

1. **Connectez GitHub**
2. **New Project** → GitHub repo
3. **Configure** → Add Environment Variables
4. **Deploy** (automatique à chaque push)

---

## ✅ Checklists Avant Production

### Sécurité
- [ ] JWT_SECRET changé et robuste (32+ caractères)
- [ ] Stripe keys en production (sk_live_* et pk_live_*)
- [ ] CORS origins restrits à votre domaine
- [ ] Database credentials sécurisées
- [ ] SMTP password sécurisé (App Password, pas le vrai mot de passe)
- [ ] Headers de sécurité activés (Helmet)
- [ ] HTTPS/SSL activé sur votre domaine

### Performance
- [ ] Database connection pooling = 10
- [ ] Rate limiting activé
- [ ] Compression activée (Gzip)
- [ ] Caching headers configurés
- [ ] Logs limités (level: info ou error)

### Monitoring
- [ ] Health check endpoint testé: `/health`
- [ ] Erreurs loggées et centralisées
- [ ] Alertes de crash configurées
- [ ] Backups MongoDB planifiés
- [ ] CPU/Memory monitoring activé

### Testing
- [ ] Tests API locaux validés
- [ ] Database mutations testées
- [ ] Authentication flows testés
- [ ] Payment flows testés
- [ ] Email notifications testées

---

## 🔍 Tests de Production

### 1. Test de Connexion à MongoDB
```bash
# Dans le backend déployé:
curl https://your-backend.com/health

# Réponse attendue:
{"status":"OK"}
```

### 2. Test d'Authentification
```bash
curl -X POST https://your-backend.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Test de Rate Limiting
```bash
# Faire 100+ requêtes rapidement:
for i in {1..150}; do
  curl https://your-backend.com/api/auth/login
done

# Après la 100ème, devrait recevoir 429 (Too Many Requests)
```

### 4. Test CORS
```bash
curl -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS https://your-backend.com/api/auth/login
```

---

## 📊 Monitoring & Logging

### Winston Logger (Déjà Configuré)
Logs automatiquement:
- ✅ Démarrage du serveur
- ✅ Connexions à MongoDB
- ✅ Requêtes HTTP
- ✅ Erreurs et warnings
- ✅ Arrêt gracieux

Voir les logs:
```bash
# Vercel
vercel logs

# Render
# Via le dashboard Render

# Docker/Local
docker logs <container-id>
npm run dev  # Vue en direct
```

### Intégration Sentry (Optionnel - Recommandé)
```bash
npm install @sentry/node

# Dans app.ts:
import * as Sentry from "@sentry/node";

app.use(Sentry.Handlers.requestHandler());
app.use(errorHandler);
app.use(Sentry.Handlers.errorHandler());
```

---

## 🚨 Troubleshooting Production

### Erreur: "Impossible de se connecter à MongoDB"
```
✓ Vérifiez: MONGODB_URI correcte dans env
✓ Vérifiez: IP whitelist MongoDB Atlas
✓ Vérifiez: Credentials airbnb_user:password
✓ Testez: mongosh "mongodb+srv://..."
```

### Erreur: "CORS blocked"
```
✓ Vérifiez: FRONTEND_URL dans env
✓ Vérifiez: Origin du frontend = allowedOrigins
✓ Logs: Cherchez "CORS request blocked"
```

### Erreur: "Rate limit exceeded"
```
✓ Normal en production (100 req/15min)
✓ Pour l'admin: Augmentez dans database.ts
✓ Ou skipez health checks (déjà fait)
```

### Erreur: "Memory leak" ou crash
```
✓ Vérifiez: connectDatabase() se ferme proprement
✓ Vérifiez: Pas d'intervalles infinis
✓ Activez: Garbage collection logs
✓ Augmentez: Node heap size si besoin
```

---

## 📈 Performance Tips

### Optimisations Déjà Appliquées
- ✅ Connection pooling MongoDB (10 connections max)
- ✅ Helmet security headers
- ✅ Rate limiting
- ✅ Graceful shutdown
- ✅ Error handling

### Optimisations Futures
1. **Redis Cache** pour sessions JWT
2. **CDN** pour les uploads
3. **Database Indexes** sur les requêtes fréquentes
4. **Query Optimization** pour les gros volumes
5. **Load Balancer** si trafic élevé

---

## 🔐 Production Secrets

### Générer Secrets Robustes
```bash
# JWT Secret (node)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou en Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Stocker les Secrets
```
❌ NE PAS:
- Commiter le .env en Git
- Partager par email
- Hardcoder en code

✅ FAIRE:
- Utiliser .env.local (git ignored)
- Utiliser les secrets du platform (Vercel, Render, etc.)
- Changer régulièrement
- Rotater après chaque incident
```

---

## 🎯 Next Steps

1. **Changez tous les secrets** (JWT, Stripe, SMTP)
2. **Testez MongoDB Atlas** localement
3. **Déployez sur Vercel/Render/Railway**
4. **Testez les endpoints** en production
5. **Configurez monitoring** (Sentry, etc.)
6. **Activez HTTPS** sur votre domaine
7. **Activez backups** MongoDB Atlas
8. **Informez votre équipe** des accès

---

## 📞 Support

Si vous avez des problèmes:
1. Vérifiez les logs: `npm run dev` ou `vercel logs`
2. Testez en local d'abord
3. Vérifiez MongoDB Atlas status
4. Vérifiez les variables d'env

---

**Status**: ✅ **PRODUCTION READY**

Votre backend est prêt pour la production! Déployez et profitez! 🚀

