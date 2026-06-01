# 🍺 Maquis Manager - Le Corridor Club

**Système POS, Stock & Rapports** pour bars et restaurants

## ✨ Fonctionnalités

- 💳 **Caisse** : Encaissement avec catalogue produits
- 📦 **Stock** : Décrémentation auto, alertes, historique
- 📊 **Rapports** : Bilans auto avec CA, Coût, Bénéfice
- 👥 **Admin** : Gestion employés, produits, analytics

## 🚀 Quick Start

```bash
# Install
pnpm install

# Setup .env files
# apps/api/.env : DATABASE_URL, JWT_SECRET
# apps/web/.env : VITE_API_URL

# Migrations
pnpm --filter api prisma migrate dev

# Start
pnpm --filter api dev     # :4000
pnpm --filter web dev     # :5173
```

Accès: **http://localhost:5173/login**

## 👥 Comptes Démo

| Rôle | Email | Password |
|------|-------|----------|
| Admin | admin@corridorclub.ci | Admin@2025! |
| Employé | caisse1@corridorclub.ci | Employe@2025! |

## 📱 Responsive Design

✅ Mobile (320px+)  
✅ Tablette (640px+)  
✅ Desktop (1024px+)  

Test: DevTools (F12) → Toggle device (Ctrl+Shift+M)

## 🏗️ Stack

- **Frontend**: React 18 + Vite + Tailwind
- **Backend**: Express + Prisma
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Socket.io
- **Export**: PDF

## 📄 License

MIT

---

Pour plus de détails, voir [GITHUB_SETUP.md](GITHUB_SETUP.md)
