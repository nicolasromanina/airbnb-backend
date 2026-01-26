# ✅ Production Readiness Checklist

## 🔐 Sécurité - À FAIRE AVANT LE DÉPLOIEMENT

### Secrets & Clés
- [ ] **JWT_SECRET** changé (ancien: `your_super_secret_jwt_key_change_this_in_production`)
  - Générer: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Longueur: 32+ caractères
  - Stocké en sécurité (pas de Git commit)

- [ ] **STRIPE_SECRET_KEY** en production (ancien: `sk_test_*`)
  - Obtenir dans Stripe Dashboard → Developers → API Keys
  - Utiliser `sk_live_*` pas `sk_test_*`

- [ ] **STRIPE_PUBLISHABLE_KEY** en production (ancien: `pk_test_*`)
  - Obtenir dans Stripe Dashboard
  - Utiliser `pk_live_*` pas `pk_test_*`

- [ ] **STRIPE_WEBHOOK_SECRET** en production (ancien: `whsec_*`)
  - Obtenir dans Stripe Dashboard → Webhooks
  - Utiliser la clé de production

- [ ] **SMTP_PASS** correctement configuré
  - Gmail: Utiliser "App Password" pas le vrai mot de passe
  - Générer: https://myaccount.google.com/apppasswords
  - Vérifier: 2FA activé sur le compte Gmail

- [ ] **DATABASE CREDENTIALS** sécurisés
  - Vérifier MongoDB Atlas IP Whitelist
  - User `airbnb_user` avec un mot de passe robuste

### URLs & Domaines
- [ ] **FRONTEND_URL** pointant vers votre domaine de production
  - Ancien: `http://localhost:8080`
  - Nouveau: `https://yourdomain.com`
  - Format HTTPS (pas HTTP)

- [ ] **CORS Origins** restreints à votre domaine
  - Pas de `localhost` en production
  - Pas de `*` (tous les domaines)

- [ ] **SMTP_FROM** avec votre adresse professionnelle
  - Ancien: `nicolasromanina@gmail.com`
  - Nouveau: `support@yourdomain.com` ou similaire

### Environnement
- [ ] **NODE_ENV** défini à `production`
  - Fichier: `.env`
  - Valeur: `NODE_ENV=production`

---

## 🗄️ Base de Données MongoDB Atlas

### Configuration
- [ ] **Cluster actif** dans MongoDB Atlas
  - Vérifier: Cloud console → Clusters → Status = "Available"
  - Cluster: `airrbnb-cluster` ou similaire

- [ ] **Database créée** (optionnel mais recommandé)
  - Nom: `booking-app` ou similaire
  - Collections: Seront créées automatiquement par mongoose

- [ ] **User créé** avec les bons permissions
  - Username: `airbnb_user`
  - Password: Robuste (32+ caractères)
  - Role: `readWriteAnyDatabase` ou limité

- [ ] **IP Whitelist** configurée
  - Aller à: Network Access → IP Whitelist
  - Ajouter votre IP de déploiement
  - Ou `0.0.0.0/0` pour permettre tous (moins sécurisé)

- [ ] **Connection String** copiée correctement
  - Format: `mongodb+srv://user:password@cluster.mongodb.net/?appName=cluster`
  - Pas d'espaces à la fin
  - Caractères spéciaux échappés correctement

### Backups & Recovery
- [ ] **Backups automatiques** activés
  - Vérifier: Backup section du cluster
  - Fréquence: Minimum 12h ou quotidienne
  - Retention: 7+ jours

- [ ] **Restore procedure** documentée
  - Comment restaurer depuis un backup?
  - Qui fait les backups? Qui les teste?

---

## 🔍 Tests & Validation

### Avant Déploiement
- [ ] **Build fonctionne localement**
  ```bash
  npm run build
  ls -la dist/
  # Doit avoir des fichiers .js dans dist/
  ```

- [ ] **Test de connexion MongoDB réussi**
  ```bash
  npm run test:mongo
  # Doit afficher: ✅ Successfully connected to MongoDB
  ```

- [ ] **Serveur démarre sans erreur**
  ```bash
  npm run prod
  # Doit afficher: 🚀 Server running on port 3000
  # Pas d'erreurs, pas de warnings
  ```

- [ ] **Health check accessible**
  ```bash
  curl http://localhost:3000/health
  # Doit retourner: {"status":"OK"}
  ```

### Après Déploiement
- [ ] **Health check sur production**
  ```bash
  curl https://your-backend-url.com/health
  # Doit retourner: {"status":"OK"}
  ```

- [ ] **Test d'authentification**
  ```bash
  curl -X POST https://your-backend-url.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
  # Doit retourner un token JWT ou erreur explicite
  ```

- [ ] **Test de réservations**
  ```bash
  curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    https://your-backend-url.com/api/reservations
  # Doit retourner les réservations
  ```

- [ ] **Test de paiement** (mode test Stripe)
  - Créer une réservation en prod
  - Paiement avec carte test: 4242 4242 4242 4242
  - Vérifier que la réservation est créée

---

## 🚀 Déploiement

### Platform: Vercel (Recommandé)
- [ ] **Compte Vercel créé** et GitHub connecté
- [ ] **Projet importé** depuis GitHub
- [ ] **Environment variables** configurées
  - Dans: Project Settings → Environment Variables
  - Toutes les variables du `.env.production`
- [ ] **Build settings** corrects
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Root Directory: `backend/`
- [ ] **Deploy réussi** sans erreurs
  - Voir: Deployments → Latest
  - Status: Ready (pas "Building" ou "Error")

### Platform: Render / Railway / Heroku
- [ ] **Compte créé** et repo connecté
- [ ] **Variables d'env** ajoutées
- [ ] **Build & Start commands** configurés
- [ ] **Deployment réussi**

### Platform: Docker/Personnalisé
- [ ] **Dockerfile créé** et testé
- [ ] **Image construit** sans erreur
- [ ] **Container lance** correctement
- [ ] **Logs** affichent le démarrage du serveur

---

## 📊 Monitoring & Logs

### Logs Disponibles
- [ ] **Logs d'application** accessibles
  - Vercel: `vercel logs`
  - Render: Dashboard → Logs
  - Local: `npm run dev` ou fichiers de logs

- [ ] **Logs de MongoDB** consultables
  - MongoDB Atlas: Activity Feed
  - Vérifier: Connexions, erreurs, temps de réponse

- [ ] **Error tracking** configuré (optionnel)
  - Sentry (recommandé)
  - LogRocket, DataDog, New Relic, etc.

### Alertes Configurées
- [ ] **Alert sur crash** de l'application
- [ ] **Alert sur quota dépassé** (MongoDB)
- [ ] **Alert sur rate limiting** activé
- [ ] **Alert sur erreurs** 5xx

---

## 🔄 Processus Continu

### Maintenance
- [ ] **Backup MongoDB** testé régulièrement
- [ ] **Logs** archivés et nettoyés
- [ ] **Dépendances npm** mises à jour tous les mois
- [ ] **Security patches** appliqués immédiatement

### Monitoring Production
- [ ] **Performance** suivi (CPU, RAM, DB)
- [ ] **Erreurs** corrigées rapidement
- [ ] **Uptime** > 99% (idéal 99.9%)
- [ ] **Response time** < 200ms (idéal)

### Communication
- [ ] **Équipe** informée de la production
- [ ] **Runbook** documenté (qui appeler si crash?)
- [ ] **On-call rotation** établie
- [ ] **Status page** publique (optionnel)

---

## 📋 Résumé Rapide

### À faire en 15 minutes:
1. ✅ Générer JWT_SECRET robuste
2. ✅ Obtenir Stripe keys de production
3. ✅ Configurer MongoDB Atlas IP Whitelist
4. ✅ Mettre à jour `.env` ou variables déploiement
5. ✅ Déployer sur Vercel/Render/Docker

### À faire ensuite:
1. ✅ Tester tout en production
2. ✅ Configurer monitoring
3. ✅ Informer l'équipe
4. ✅ Activer backups

---

## 🎯 Dernières Vérifications

- [ ] Tous les secrets changés de leurs valeurs "test"
- [ ] Variables d'env correctes sur la platform de déploiement
- [ ] Build fonctionne: `npm run build` ✅
- [ ] Tests passent: `npm test` ✅
- [ ] Pas d'erreurs lors du démarrage
- [ ] Health check répond: ✅
- [ ] Frontend peut accéder au backend (CORS OK)
- [ ] Database connections stables
- [ ] Logs accessible et lisible

---

## 🚀 Status

```
CONFIGURATION: ✅ READY FOR PRODUCTION

Vous pouvez commencer le déploiement!
```

---

**Date de cette checklist**: 2026-01-26
**Version Backend**: 1.0.0
**Dernière mise à jour**: Automatique lors du déploiement

