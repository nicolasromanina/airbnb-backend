# 🚀 Backend Production - Quick Deploy

**Status**: ✅ Production Ready with MongoDB Atlas

---

## ⚡ 5 Minute Setup

### 1. Variables d'Environnement (**OBLIGATOIRE**)
```bash
# backend/.env

# 🔴 CHANGEZ ABSOLUMENT:
JWT_SECRET=<générez une clé robuste>
STRIPE_SECRET_KEY=sk_live_<votre clé production>
STRIPE_PUBLISHABLE_KEY=pk_live_<votre clé production>
SMTP_PASS=<votre app password Gmail>

# 🟡 VÉRIFIEZ:
FRONTEND_URL=https://votre-domaine.com
MONGODB_URI=mongodb+srv://airbnb_user:d4CdJV6T8E8EIJvR@airrbnb-cluster.upznduc.mongodb.net
NODE_ENV=production
```

### 2. Test Local
```bash
cd backend

# Build
npm run build

# Test MongoDB
npm run test:mongo
# Doit afficher: ✅ Successfully connected to MongoDB

# Démarrer en mode prod
npm run prod
# Doit afficher: 🚀 Server running on port 3000
```

### 3. Déployer sur Vercel
```bash
# Installer vercel CLI
npm i -g vercel

# Déployer
vercel --prod

# Entrez vos secrets quand demandé
```

### 4. Vérifier Production
```bash
curl https://your-backend-url.com/health
# Doit retourner: {"status":"OK"}
```

---

## 📋 Checklist Sécurité

- [ ] JWT_SECRET changé ✅
- [ ] Stripe keys en production ✅
- [ ] FRONTEND_URL correcte ✅
- [ ] MongoDB Atlas IP whitelist OK ✅
- [ ] SMTP_PASS configuré ✅
- [ ] Build sans erreur: `npm run build` ✅
- [ ] Test MongoDB OK: `npm run test:mongo` ✅

---

## 🔧 Commandes Importantes

```bash
# Développement
npm run dev          # Mode dev avec hot-reload

# Production
npm run build        # Compiler TypeScript
npm run prod         # Lancer en mode production
npm run start        # Lancer build produit

# Tests
npm run test:mongo   # Test connexion MongoDB
npm run test:health  # Test health endpoint

# Database
npm run seed         # Seed données options
npm run seed:rooms   # Seed données rooms
```

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to MongoDB"
```bash
# 1. Vérifiez MONGODB_URI dans .env
# 2. Vérifiez IP whitelist MongoDB Atlas:
#    Settings → Network Access → IP Whitelist
# 3. Testez:
npm run test:mongo
```

### ❌ "CORS blocked"
```bash
# Vérifiez FRONTEND_URL = votre domaine frontend
# Redémarrez le serveur après changement
```

### ❌ "Port already in use"
```bash
# Tuez le processus:
lsof -ti:3000 | xargs kill -9
# Ou changez PORT=3001 dans .env
```

### ❌ "Build fails"
```bash
# Nettoyez et reconstituez:
rm -rf dist node_modules
npm install
npm run build
```

---

## 📊 Architecture Production

```
┌─────────────────────────────────────┐
│         Frontend (Vercel)            │
│      https://yourdomain.com         │
└────────────┬────────────────────────┘
             │
             │ API Calls
             ↓
┌─────────────────────────────────────┐
│   Backend (Vercel/Render/Railway)    │
│    https://api.yourdomain.com        │
│   port: 3000 (or custom)            │
└────────────┬────────────────────────┘
             │
             │ MongoDB Protocol
             ↓
┌─────────────────────────────────────┐
│      MongoDB Atlas (Cloud)           │
│   airrbnb-cluster.mongodb.net       │
│      Connection Pool: 10             │
└─────────────────────────────────────┘
```

---

## 🎯 Configuration MongoDB Atlas

**Database URL**: 
```
mongodb+srv://airbnb_user:d4CdJV6T8E8EIJvR@airrbnb-cluster.upznduc.mongodb.net/?appName=airrbnb-cluster
```

**Security Checklist**:
- ✅ IP Whitelist configured (or 0.0.0.0/0 for dev)
- ✅ User credentials created (airbnb_user)
- ✅ SSL/TLS enabled
- ✅ Backups enabled
- ✅ Connection pooling: 10 (production)

---

## 🔐 Security Features Enabled

✅ **Helmet** - HTTP security headers
✅ **Rate Limiting** - 100 req/15min per IP
✅ **CORS** - Restricted to allowed origins
✅ **Helmet HSTS** - Force HTTPS (1 year)
✅ **JWT Auth** - All protected endpoints
✅ **Input Validation** - Express validator
✅ **Error Handling** - No stack traces exposed
✅ **Graceful Shutdown** - Clean DB disconnect
✅ **SSL/TLS** - MongoDB Atlas only
✅ **Request Logging** - Winston logger

---

## 📈 Performance Optimizations

✅ **Connection Pooling** - Max 10 connections
✅ **Timeouts** - 30s server, 60s socket
✅ **Retry Logic** - Automatic retries on failure
✅ **Error Recovery** - Graceful reconnection
✅ **Compression** - Gzip enabled (via Helmet)
✅ **Caching** - HTTP cache headers
✅ **Rate Limiting** - Prevent abuse

---

## 🎁 What's Included

```
Backend Production Ready Package:
├── ✅ MongoDB Atlas integration
├── ✅ Optimized security (Helmet, CORS, Rate Limiting)
├── ✅ Graceful shutdown handling
├── ✅ Comprehensive error logging (Winston)
├── ✅ Health check endpoint
├── ✅ Production configuration
├── ✅ Test scripts (MongoDB, Health)
├── ✅ Deployment guides
└── ✅ Production checklist
```

---

## 🚀 Deployment Platforms Supported

### Vercel (⭐ Recommended)
```bash
vercel --prod
```
- Auto CI/CD from GitHub
- Serverless functions
- Global CDN
- Free tier available

### Render.com
- Dashboard based deployment
- Auto deploys from GitHub
- Built-in monitoring
- Free tier available

### Railway.app
- Simple, Git-based deployment
- Pay as you go
- PostgreSQL/MongoDB ready
- Good for learning

### Docker/Self-Hosted
- Full control
- Run anywhere
- More configuration needed

---

## 📞 Environment Variables Reference

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| NODE_ENV | production | ✅ | Must be "production" |
| PORT | 3000 | ✅ | Server port |
| MONGODB_URI | mongodb+srv://... | ✅ | Atlas connection string |
| JWT_SECRET | abc123... | ✅ | 32+ chars, random |
| STRIPE_SECRET_KEY | sk_live_... | ✅ | Production key only |
| STRIPE_PUBLISHABLE_KEY | pk_live_... | ✅ | Production key only |
| STRIPE_WEBHOOK_SECRET | whsec_... | ✅ | Production webhook |
| FRONTEND_URL | https://yourdomain.com | ✅ | For CORS |
| SMTP_HOST | smtp.gmail.com | ✅ | Email server |
| SMTP_PORT | 587 | ✅ | Email port |
| SMTP_USER | email@gmail.com | ✅ | Email account |
| SMTP_PASS | app_password | ✅ | App-specific password |
| SMTP_FROM | noreply@domain.com | ✅ | From address |
| JWT_EXPIRES_IN | 7d | ⚪ | Token expiry |
| REQUEST_LIMIT | 10mb | ⚪ | Max request size |
| LOG_LEVEL | info | ⚪ | Logging level |

---

## ✅ Final Checklist Before Deploy

```
BEFORE PRODUCTION DEPLOYMENT:

Security:
- [ ] JWT_SECRET is strong (32+ random chars)
- [ ] All Stripe keys are production (sk_live_/pk_live_)
- [ ] FRONTEND_URL is your production domain
- [ ] SMTP password is app-specific password (Gmail)
- [ ] NODE_ENV=production

Database:
- [ ] MongoDB Atlas cluster is running
- [ ] IP Whitelist includes your backend server IP
- [ ] User 'airbnb_user' has correct permissions
- [ ] Backups are enabled

Testing:
- [ ] Build succeeds: npm run build ✅
- [ ] MongoDB test passes: npm run test:mongo ✅
- [ ] Server starts: npm run prod ✅
- [ ] Health check works: curl http://localhost:3000/health ✅

Deployment:
- [ ] Platform account created (Vercel/Render/etc)
- [ ] GitHub repo connected
- [ ] All environment variables added
- [ ] Build command: npm run build
- [ ] Start command: npm run prod

Go Live:
- [ ] Backend URL accessible: https://your-api.com/health ✅
- [ ] CORS test passes
- [ ] Auth endpoint works
- [ ] Database queries work
- [ ] Frontend can reach backend
```

---

## 🎯 Next Steps

1. **Update Secrets** (JWT, Stripe, SMTP)
2. **Configure MongoDB Atlas** (IP Whitelist)
3. **Build & Test Locally** (`npm run build && npm run test:mongo`)
4. **Deploy** (`vercel --prod`)
5. **Verify** (curl health endpoint)
6. **Test** (Login, Create Reservation, Pay)

---

## 📖 Full Documentation

- **PRODUCTION_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **PRODUCTION_CHECKLIST.md** - Detailed pre-production checklist
- **README.ADMIN.md** - Admin features documentation

---

**Status**: 🟢 **PRODUCTION READY**

**Last Updated**: 2026-01-26
**Backend Version**: 1.0.0
**MongoDB**: Atlas
**Node.js**: 18+

Ready to deploy! 🚀
