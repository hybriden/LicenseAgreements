# License Agreements Management System

A web application for managing customer licenses and products, hosted on Cloudflare with Azure AD authentication.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Cloudflare Workers + Hono.js
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Authentication**: Cloudflare Access + Azure AD

## Project Structure

```
LicenseAgreements/
├── frontend/          # React frontend application
├── worker/            # Cloudflare Workers API
├── shared/            # Shared TypeScript types
└── PLAN.md           # Detailed implementation plan
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hybriden/LicenseAgreements.git
   cd LicenseAgreements
   ```

2. **Install dependencies**
   ```bash
   # Install worker dependencies
   cd worker
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Create D1 Database**
   ```bash
   cd worker
   wrangler d1 create license-agreements-db
   ```

   Copy the database_id from the output and update `worker/wrangler.toml`.

4. **Run database migrations**
   ```bash
   cd worker
   wrangler d1 execute license-agreements-db --local --file=src/db/migrations/0000_init.sql
   ```

### Development

1. **Start the API (in worker directory)**
   ```bash
   cd worker
   npm run dev
   ```
   The API will run at http://localhost:8787

2. **Start the frontend (in frontend directory)**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run at http://localhost:5173

### Deployment

1. **Deploy the Worker**
   ```bash
   cd worker
   # Run migration on remote database first
   wrangler d1 execute license-agreements-db --remote --file=src/db/migrations/0000_init.sql
   # Deploy worker
   npm run deploy
   ```

2. **Deploy the Frontend**
   ```bash
   cd frontend
   npm run build
   wrangler pages deploy dist --project-name=license-agreements
   ```

### Configure Azure AD Authentication

1. Go to Cloudflare Zero Trust Dashboard
2. Navigate to Access > Applications
3. Add a new application and protect your domain
4. Configure Azure AD as identity provider under Settings > Authentication
5. See [Cloudflare Azure AD Integration](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/azuread/)

## Features

- **Dashboard**: Overview statistics and upcoming billing
- **Customers (Kunder)**: Manage customers and their agreements
- **Products (Produkter)**: Internal products and services
- **Licenses (Lisenser)**: Third-party licenses and software
- **Reports (Rapport)**: Revenue reports by category and product
- **Invoices (Faktura)**: Track and manage billing
- **Users (Brukere)**: User management with role-based access
- **Settings (Innstillinger)**: Configure categories and product types

## API Endpoints

- `GET/POST /api/customers` - List/Create customers
- `GET/PUT/DELETE /api/customers/:id` - Customer CRUD
- `GET/POST /api/product-types` - List/Create product types
- `GET/PUT/DELETE /api/product-types/:id` - Product type CRUD
- `GET/POST /api/agreements` - List/Create agreements
- `GET/PUT/DELETE /api/agreements/:id` - Agreement CRUD
- `POST /api/agreements/:id/bill` - Mark as billed
- `GET /api/categories` - List categories
- `GET /api/reports/dashboard` - Dashboard stats
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/billing` - Billing due report
- `GET /api/reports/export` - CSV export
- `GET /api/users` - List users
- `GET /api/users/me` - Current user

## License

Private - Epinova

---
*Last updated: 2025-12-21*
