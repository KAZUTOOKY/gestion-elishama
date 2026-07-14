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

### Avec Bun (recommandé)

```bash
# 1. Installer les dépendances
bun install

# 2. Configurer la base de données
cp .env.example .env
bun run db:push

# 3. (Optionnel) Charger les données de démonstration
bun run prisma/seed.ts

# 4. Démarrer l'application
bun run dev
```

### Avec npm

```bash
npm install
cp .env.example .env
npx prisma db push
npx prisma generate
npm run dev
```

L'application sera disponible sur `http://localhost:3000`

## Variables d'environnement

Créez un fichier `.env` à la racine :

```
DATABASE_URL="file:./db/custom.db"
```

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
