# ELISHAMA Stock Manager

Application de gestion de stock et financière pour le restaurant ELISHAMA.

## Fonctionnalités

- **Tableau de bord** : KPIs en temps réel (recettes, dépenses, bénéfices, valeur du stock)
- **Produits & Ingrédients** : Gestion complète des produits et catégories
- **Gestion du Stock** : Entrées/sorties, suivi en temps réel, alertes de seuil
- **Ventes** : Enregistrement des ventes journalières multi-articles
- **Dépenses & Pertes** : Suivi des dépenses, achats fournisseurs et pertes
- **Rapports** : Journalier, hebdomadaire, mensuel, annuel avec export PDF
- **Notifications** : Alertes intelligentes de stock faible et rupture
- **Paramètres** : Configuration, sauvegarde cloud, synchronisation multi-appareils

## Prérequis

- [Node.js](https://nodejs.org/) 18+ ou [Bun](https://bun.sh/)
- Un navigateur moderne (Chrome, Firefox, Safari, Edge)

## Installation

### Avec npm

```bash
# 1. Installer les dépendances
npm install

# 2. Copier le fichier d'exemple d'environnement
cp .env.example .env

# 3. Mettre à jour DATABASE_URL avec votre base PostgreSQL
# 4. Synchroniser la base de données
npx prisma db push

# 5. Démarrer l'application
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

### Avec Bun

```bash
bun install
cp .env.example .env
bun run db:push
bun run dev
```

## Variables d'environnement

Créez un fichier `.env` à la racine à partir de [.env.example](.env.example) :

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
NEXT_PUBLIC_VERCEL_URL="http://localhost:3000"
VERCEL_URL="http://localhost:3000"
```

## Déploiement GitHub / Vercel

```bash
git add .
git commit -m "Prepare deployment"
git push origin main
```

Pour Vercel, connectez ce dépôt puis déployez avec la variable `DATABASE_URL` définie dans les paramètres d'environnement.

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `bun run dev` | Démarre le serveur de développement |
| `bun run build` | Compile l'application pour la production |
| `bun run start` | Démarre le serveur de production |
| `bun run lint` | Vérifie la qualité du code |
| `bun run db:push` | Synchronise le schéma de base de données |
| `bun run db:generate` | Régénère le client Prisma |

## Technologies

- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript 5
- **Style** : Tailwind CSS 4 + shadcn/ui
- **Base de données** : Prisma ORM + SQLite
- **État** : Zustand + TanStack Query
- **Graphiques** : Recharts
- **PDF** : jsPDF + jspdf-autotable

## Structure du projet

```
├── prisma/
│   ├── schema.prisma    # Schéma de base de données
│   └── seed.ts          # Données de démonstration
├── src/
│   ├── app/
│   │   ├── api/         # Routes API REST
│   │   ├── layout.tsx   # Layout racine
│   │   └── page.tsx     # Page principale
│   ├── components/
│   │   ├── elishama/    # Composants de l'application
│   │   └── ui/          # Composants shadcn/ui
│   ├── lib/             # Utilitaires (db, api, format, pdf)
│   └── store/           # Stores Zustand
└── public/              # Assets statiques
```

## Sauvegarde et restauration

Les données sont stockées dans `db/custom.db`. Pour sauvegarder :

```bash
cp db/custom.db db/backup-$(date +%Y%m%d).db
```

Pour restaurer, remplacez le fichier et redémarrez l'application.

---

© ELISHAMA — Gestion de stock & financière
