# Claude Code Context - License Agreements

## Project Overview

Internal license management system for Epinova. Manages customer agreements, products, licenses, and billing.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Cloudflare Workers + Hono.js
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Auth**: Cloudflare Access + Azure AD

## Working Directory

```
D:\code\LicenseAgreements
```

## Deployment

### Frontend (Cloudflare Pages)
```bash
cd frontend
npm run build
wrangler pages deploy dist --project-name=license-agreements
```
- Production: https://license-agreements.pages.dev
- Preview: https://<hash>.license-agreements.pages.dev

### Backend (Cloudflare Workers)
```bash
cd worker
npm run deploy
```
- API: https://license-agreements-api.hans-christian-thjomoe.workers.dev

## Project Structure

```
LicenseAgreements/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── App.tsx             # Router setup
│   │   ├── main.tsx            # Entry point
│   │   ├── index.css           # Global styles + Tailwind
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx      # Top header with user info
│   │   │   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   │   │   └── MainLayout.tsx  # Page wrapper
│   │   │   └── ui/             # shadcn/ui components
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── select.tsx
│   │   │       ├── table.tsx
│   │   │       └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Main dashboard with stats
│   │   │   ├── Customers.tsx       # Customer list
│   │   │   ├── CustomerDetail.tsx  # Customer detail/edit
│   │   │   ├── Products.tsx        # Products list
│   │   │   ├── ProductDetail.tsx   # Product detail/edit
│   │   │   ├── Licenses.tsx        # Licenses list
│   │   │   ├── LicenseDetail.tsx   # License detail/edit
│   │   │   ├── Reports.tsx         # Revenue reports
│   │   │   ├── Invoices.tsx        # Billing/invoices
│   │   │   ├── Users.tsx           # User management
│   │   │   └── Settings.tsx        # Categories & product types
│   │   ├── lib/
│   │   │   ├── api.ts              # API client functions
│   │   │   └── utils.ts            # Utility functions (cn, formatCurrency)
│   │   └── types/                  # TypeScript types
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── worker/                      # Cloudflare Worker API
│   ├── src/
│   │   ├── index.ts            # Hono app entry, route registration
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle schema definitions
│   │   │   ├── index.ts        # DB connection
│   │   │   └── migrations/     # SQL migrations
│   │   ├── middleware/
│   │   │   └── auth.ts         # Cloudflare Access auth
│   │   ├── routes/
│   │   │   ├── customers.ts    # /api/customers
│   │   │   ├── agreements.ts   # /api/agreements
│   │   │   ├── product-types.ts # /api/product-types
│   │   │   ├── categories.ts   # /api/categories
│   │   │   ├── reports.ts      # /api/reports/*
│   │   │   └── users.ts        # /api/users
│   │   └── types/
│   │       └── env.ts          # Worker env bindings
│   ├── wrangler.toml           # Cloudflare config
│   └── package.json
│
├── shared/                      # Shared TypeScript types
│   └── types.ts
│
├── CLAUDE.md                    # This file
├── README.md                    # Project documentation
└── PLAN.md                      # Implementation plan
```

## Design System

### Colors (Epinova brand)
- **Primary/Accent**: Teal (`teal-600`, `teal-700`)
- **Sidebar**: Dark teal (`#0d5c5c` to `#094545`)
- **Cards**: White with subtle borders
- **Text**: Foreground/muted-foreground CSS variables

### Component Style (Epinova.no inspired)
- Clean white cards with rounded corners (`rounded-2xl`)
- Teal accent bars on left side of cards
- Centered icons with light teal backgrounds
- Thin line-style icons (strokeWidth 1.5)
- Hover effects: shadow + border color change

### Key UI Patterns
- StatCard: Centered icon, large value, title, subtitle
- Action cards: Left teal accent bar
- Tables: Clean with hover states
- Forms: Label above input, consistent spacing

## API Endpoints

```
GET/POST   /api/customers
GET/PUT/DELETE /api/customers/:id

GET/POST   /api/product-types
GET/PUT/DELETE /api/product-types/:id

GET/POST   /api/agreements
GET/PUT/DELETE /api/agreements/:id
POST       /api/agreements/:id/bill

GET        /api/categories

GET        /api/reports/dashboard
GET        /api/reports/revenue
GET        /api/reports/billing
GET        /api/reports/export

GET        /api/users
GET        /api/users/me
```

## Development Commands

```bash
# Frontend dev server
cd frontend && npm run dev    # http://localhost:5173

# Worker dev server
cd worker && npm run dev      # http://localhost:8787

# Build frontend
cd frontend && npm run build

# Run D1 migrations (local)
cd worker && wrangler d1 execute license-agreements-db --local --file=src/db/migrations/0000_init.sql

# Run D1 migrations (production)
cd worker && wrangler d1 execute license-agreements-db --remote --file=src/db/migrations/0000_init.sql
```

## Database

D1 database: `license-agreements-db` (ID: `737541bb-368f-4cbd-bf96-f8f6b1e7169a`)

### Tables
- `customers` - Customer records
- `product_types` - Internal products/services
- `agreements` - Customer agreements linking customers to products
- `categories` - Product/license categories
- `users` - User accounts with roles

## Notes

- Norwegian UI text (Kunder, Produkter, Lisenser, etc.)
- Currency: NOK (Norwegian Kroner)
- Auth handled by Cloudflare Access - user info in `cf-access-jwt-assertion` header
