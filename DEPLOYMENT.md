# 🚀 Déploiement Vercel - Maquis Manager

Guide complet pour déployer le frontend sur **Vercel** et le backend sur **Railway** (ou Render).

---

## 📋 Table des matières

1. [Frontend sur Vercel](#-frontend-sur-vercel)
2. [Backend sur Railway](#-backend-sur-railway)
3. [Configuration Database](#-configuration-database)
4. [Variables d'environnement](#-variables-denvironnement)
5. [Vérification](#-vérification)

---

## 🎨 Frontend sur Vercel

### Étape 1 : Connexion à Vercel

1. Va sur https://vercel.com et **Login** avec ton compte
2. Clique **Add New** → **Project**
3. Sélectionne **Import Git Repository**
4. Trouve et sélectionne : `Le-corridor-club`

### Étape 2 : Configuration du build

Vercel devrait auto-détecter Vite. **Assure-toi que :**

```
Framework: Vite
Root Directory: ./apps/web
Build Command: pnpm --filter web build
Output Directory: dist
```

### Étape 3 : Ajouter les variables d'env

**Project Settings** → **Environment Variables**

Ajoute :
```
VITE_API_URL=https://maquis-api.railway.app
```

(On reviendra avec l'URL exacte du backend)

### Étape 4 : Deploy

Clique **Deploy** → Attends ~2-3 minutes

**Ton frontend sera live à :** `https://le-corridor-club.vercel.app` (ou un nom perso)

---

## ⚙️ Backend sur Railway

Railway offre 5$ de crédit gratuit par mois (suffisant pour un petit projet).

### Étape 1 : Créer un projet Railway

1. Va sur https://railway.app
2. Login ou crée un compte GitHub
3. Clique **Create New Project**
4. Sélectionne **Deploy from GitHub repo**
5. Connecte ton repo `Le-corridor-club`

### Étape 2 : Configurer le build

Railway devrait détecter Node.js automatiquement.

**Dans le projet Railway :**
- **Root Directory** : `apps/api`
- **Build Command** : `pnpm install && pnpm --filter api build`
- **Start Command** : `node dist/index.js`

### Étape 3 : Ajouter variables d'env

**Variables** → **Add Variable**

```
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/db
JWT_SECRET=your-super-secret-key-here-min-32-chars
NODE_ENV=production
```

### Étape 4 : Connecter PostgreSQL

**Add** → **Database** → **PostgreSQL**

Railway va :
- Créer une DB automatiquement
- Remplir `DATABASE_URL` auto

Sinon, utilise ta **Supabase** existante (voir section Database).

### Étape 5 : Deploy

Clique **Deploy**

Railway va auto-déployer à chaque push sur `main`.

**Ton backend sera à :** `https://maquis-api-production.up.railway.app` (URL générée par Railway)

---

## 💾 Configuration Database

### Option 1 : Supabase (Recommandé)

Tu as déjà un compte Supabase. **Réutilise-le :**

1. Va sur https://app.supabase.com
2. Ouvre ton projet
3. **Settings** → **Database** → Copie la **Connection String**

Elle ressemble à :
```
postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

Colle-la dans la variable `DATABASE_URL` du backend.

### Option 2 : Railway Database

Si tu veux tout en un :

1. Dans Railway, clique **Add** → **Database** → **PostgreSQL**
2. Railway crée la DB et la variable `DATABASE_URL` auto

### Option 3 : Render (Alternative à Railway)

Si tu préfères Render.com :
- Free tier : PostgreSQL 256 MB + 0.1 CPU
- Procédure similaire

---

## 🔐 Variables d'environnement

### Frontend (Vercel)

```env
VITE_API_URL=https://maquis-api-production.up.railway.app
```

(Remplace par ton URL Railway réelle)

### Backend (Railway)

```env
PORT=3000
DATABASE_URL=postgresql://user:pwd@host:5432/db
JWT_SECRET=tes-super-secret-key-ici-au-moins-32-chars
NODE_ENV=production
```

**Générer un JWT_SECRET sécurisé :**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔄 Workflow après déploiement

Après le premier déploiement :

### Pour chaque changement :

```bash
git add .
git commit -m "feat: ton changement"
git push origin main
```

Vercel et Railway vont **auto-déployer** ! 🚀

---

## ✅ Vérification

### Frontend

1. Va sur https://le-corridor-club.vercel.app (ou ton URL)
2. Tu devrais voir la page de login

### Backend

```bash
curl https://maquis-api-production.up.railway.app/health
```

Devrait retourner `200 OK` ou une réponse.

### API depuis Frontend

1. Ouvre Developer Tools (F12)
2. Va sur **Network**
3. Essaie de te connecter avec les comptes démo
4. Tu devrais voir les requêtes API réussies (status 200/201)

---

## 🐛 Troubleshooting

### "Cannot find module" sur Vercel

**Solution :** Ajoute dans `vercel.json` :

```json
{
  "buildCommand": "pnpm install && pnpm --filter web build",
  "outputDirectory": "apps/web/dist"
}
```

### "DATABASE_URL not found" sur Railway

Assure-toi que la variable est bien définie dans Railway Settings.

### "CORS Error" depuis le frontend

Ajoute dans `apps/api/src/index.ts` :

```typescript
app.use(cors({
  origin: [
    'https://le-corridor-club.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

### Les migrations Prisma ne tournent pas

Railway devrait les faire auto au déploiement. Si pas :

Ajoute à `package.json` du backend :

```json
{
  "scripts": {
    "postinstall": "prisma migrate deploy"
  }
}
```

---

## 📊 Coûts estimés

| Service | Gratuit | Prix |
|---------|---------|------|
| **Vercel** | Oui (1 projet) | $0-20/mois |
| **Railway** | 5$ crédit/mois | $5+/mois |
| **Supabase** | 2 projets + 500MB | $25+/mois |
| **Total** | ~$5/mois | ~$25+/mois |

---

## 🚀 Checklist Final

- [ ] Frontend déployé sur Vercel
- [ ] Backend déployé sur Railway
- [ ] Database PostgreSQL connectée
- [ ] Variables d'env configurées
- [ ] API accessible depuis le frontend
- [ ] Login fonctionne
- [ ] Caisse fonctionne (ventes enregistrées)
- [ ] Stock décrémente correctement
- [ ] Rapports génèrent
- [ ] Export PDF marche

---

**Tu es prêt(e) ! Les 3 services (Vercel + Railway + Supabase) sont gratuits pour commencer.** 🎉
