# 📤 Guide Setup GitHub - Maquis Manager

## Étape 1 : Créer un repo GitHub

1. Va sur https://github.com/new
2. Remplis :
   - **Repository name** : `maquis-manager` (ou autre nom)
   - **Description** : `POS & Stock Management System for Le Corridor Club`
   - **Public** ou **Private** : Ton choix
   - ✅ Pas de README, .gitignore, ou LICENSE (on les a déjà)

3. Clique **Create repository**

---

## Étape 2 : Setup local (dans Git Bash ou PowerShell)

```bash
cd "C:\Users\JEANPATRICKROMUALDCA\Desktop\Le corridor club"

# Configurer user (si pas déjà fait)
git config user.name "Ton Nom"
git config user.email "ton-email@example.com"

# Ajouter le remote GitHub
git remote add origin https://github.com/TON-USERNAME/maquis-manager.git

# Ou avec SSH (si configuré)
git remote add origin git@github.com:TON-USERNAME/maquis-manager.git
```

---

## Étape 3 : Commit & Push

```bash
# Ajouter les fichiers du projet
git add apps/ packages/ .gitignore

# Commit
git commit -m "feat: Maquis Manager - Complete POS system

- Point of sale system with cart
- Auto stock decrement
- Daily reports with KPIs
- Admin dashboard
- Real-time notifications
- Responsive design (all screens)
"

# Vérifier le commit
git log --oneline -3

# Push vers GitHub
git branch -M main
git push -u origin main
```

---

## Étape 4 : Ajouter collaborateurs (optionnel)

1. Accédez à ton repo GitHub
2. **Settings** → **Collaborators**
3. Ajoute des emails pour collaboration

---

## 🔐 Authentification GitHub

### Option A : HTTPS (plus simple)
```bash
git push
# → Demande username + token d'accès personnel
```

**Créer un token d'accès :**
1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Clique **Generate new token**
3. Sélectionne `repo` scope
4. Copie le token et utilise-le comme password

### Option B : SSH (plus sécurisé)
1. Génère une clé SSH :
```bash
ssh-keygen -t ed25519 -C "ton-email@example.com"
```

2. Ajoute la clé publique à GitHub :
   - GitHub → **Settings** → **SSH and GPG keys** → **New SSH key**
   - Copie le contenu de `~/.ssh/id_ed25519.pub`

3. Test la connexion :
```bash
ssh -T git@github.com
```

---

## ✅ Vérifier que tout fonctionne

```bash
# Vérifier le remote
git remote -v

# Vérifier le dernier commit
git log --oneline -1

# Vérifier le statut
git status
```

---

## 📝 Après le premier push

**Tous les changements futurs :**
```bash
git add .
git commit -m "feat: Description du changement"
git push
```

---

## 🚨 Si problème de credentials

### Réinitialiser les identifiants

**Windows (Git Bash) :**
```bash
# Supprimer les credentials en cache
git credential reject
# Puis refaire un push → demande les identifiants

# Ou via PowerShell
cmdkey /delete:git:https://github.com
```

---

## 📌 Résumé des Commandes

```bash
# Configuration initiale
git config user.name "Ton Nom"
git config user.email "email@example.com"
git remote add origin https://github.com/USERNAME/maquis-manager.git

# Ajouter & commit
git add apps/ packages/ .gitignore
git commit -m "Message de commit"

# Push vers GitHub
git branch -M main
git push -u origin main

# Après (push normal)
git push
```

---

## 🎯 Links Utiles

- **Mon repo** : https://github.com/USERNAME/maquis-manager
- **Git docs** : https://git-scm.com/doc
- **GitHub Help** : https://docs.github.com

---

**C'est tout !** 🎉 Ton code est maintenant sur GitHub !
