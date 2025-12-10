# License Agreements Management System - Technical Plan

## Overview

A web application for managing customer licenses and products, hosted on Cloudflare with Azure AD authentication.

---

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui (Tailwind CSS based)
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite

### Backend
- **Runtime**: Cloudflare Workers (serverless)
- **Framework**: Hono.js (lightweight, fast, Cloudflare-native)
- **Database**: Cloudflare D1 (SQLite-based, free tier available)
- **ORM**: Drizzle ORM (TypeScript-first, D1 compatible)

### Authentication
- **Provider**: Cloudflare Access + Azure AD (Entra ID)
- **Method**: Zero Trust ZTNA - protects the entire application

### Hosting (All Free Tier)
- **Frontend**: Cloudflare Pages
- **Backend API**: Cloudflare Workers
- **Database**: Cloudflare D1 (5GB free, 100k reads/day, 1k writes/day)

---

## Database Schema

### Tables

```sql
-- Categories (Product, License, etc.)
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products/License Types
CREATE TABLE product_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER NOT NULL,
  description TEXT,
  default_billing_interval_months INTEGER DEFAULT 12,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Customers
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  org_number TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  notes TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Customer Agreements (links customers to products/licenses)
CREATE TABLE agreements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  product_type_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'NOK',
  start_date DATE NOT NULL,
  end_date DATE,
  billing_interval_months INTEGER NOT NULL,
  next_billing_date DATE NOT NULL,
  is_active INTEGER DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_type_id) REFERENCES product_types(id)
);

-- Users (synced from Azure AD)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  azure_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'viewer',
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  old_values TEXT,
  new_values TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Application Structure

```
LicenseAgreements/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Shadcn components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MainLayout.tsx
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   ├── licenses/
│   │   │   ├── reports/
│   │   │   ├── invoices/
│   │   │   └── settings/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Customers.tsx
│   │   │   ├── CustomerDetail.tsx
│   │   │   ├── Products.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── Licenses.tsx
│   │   │   ├── LicenseDetail.tsx
│   │   │   ├── Reports.tsx
│   │   │   ├── Invoices.tsx
│   │   │   ├── Users.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── worker/
│   ├── src/
│   │   ├── index.ts             # Hono app entry
│   │   ├── routes/
│   │   │   ├── customers.ts
│   │   │   ├── products.ts
│   │   │   ├── agreements.ts
│   │   │   ├── reports.ts
│   │   │   └── settings.ts
│   │   ├── db/
│   │   │   ├── schema.ts        # Drizzle schema
│   │   │   └── migrations/
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   └── types/
│   ├── wrangler.toml
│   └── package.json
│
├── shared/
│   └── types/                   # Shared TypeScript types
│
└── wrangler.toml                # Root config
```

---

## Features & Pages

### 1. Dashboard (Home)
- Overview statistics
- Upcoming billing dates
- Recent activity

### 2. Customers (Kunder)
- **List View**: Searchable/filterable table of all customers
- **Detail View**: Customer info + all their products/licenses
- **Actions**: Add, Edit, Deactivate customer

### 3. Products (Produkter)
- Filter by category "Produkt"
- **List View**: All product types with customer count
- **Detail View**: Product info + all customers with this product
  - Shows: Sum, date from/to, next billing date per customer
- **Actions**: View customer list, see revenue totals

### 4. Licenses (Lisenser)
- Filter by category "Lisens"
- **List View**: All license types with customer count
- **Detail View**: License info + all customers with this license
  - Shows: Sum, date from/to, next billing date per customer
- **Actions**: View customer list, see revenue totals

### 5. Reports (Rapport)
- Total revenue by products
- Revenue breakdown by category
- Revenue by time period
- Export to CSV/Excel

### 6. Invoices (Faktura)
- List of agreements due for billing
- Filter by date range
- Mark as invoiced/processed
- Alerts for upcoming billing

### 7. Users (Brukere)
- List of system users (from Azure AD)
- Role management (Admin, Editor, Viewer)
- Activity log

### 8. Settings (Innstillinger)
- **Customers**: Register new customers
- **Categories**: Define categories (Product, License, etc.)
- **Product Types**: Create product/license types, assign to category
- **Billing Intervals**: Set default billing intervals

---

## API Endpoints

### Customers
```
GET    /api/customers              # List all
GET    /api/customers/:id          # Get one with agreements
POST   /api/customers              # Create
PUT    /api/customers/:id          # Update
DELETE /api/customers/:id          # Soft delete
```

### Product Types
```
GET    /api/product-types          # List all (filter by category)
GET    /api/product-types/:id      # Get one with agreements
POST   /api/product-types          # Create
PUT    /api/product-types/:id      # Update
DELETE /api/product-types/:id      # Soft delete
```

### Categories
```
GET    /api/categories             # List all
POST   /api/categories             # Create
PUT    /api/categories/:id         # Update
DELETE /api/categories/:id         # Delete
```

### Agreements
```
GET    /api/agreements             # List all (with filters)
GET    /api/agreements/:id         # Get one
POST   /api/agreements             # Create
PUT    /api/agreements/:id         # Update
DELETE /api/agreements/:id         # Soft delete
```

### Reports
```
GET    /api/reports/revenue        # Revenue report
GET    /api/reports/billing        # Upcoming billing
GET    /api/reports/export         # Export data
```

### Users
```
GET    /api/users                  # List users
GET    /api/users/me               # Current user
PUT    /api/users/:id/role         # Update role
```

---

## Authentication Flow

1. User navigates to app URL
2. Cloudflare Access intercepts request
3. User redirected to Azure AD login
4. After authentication, Cloudflare Access validates and sets JWT
5. App receives user info via `CF-Access-JWT-Assertion` header
6. Backend validates JWT and extracts user identity
7. User synced to local users table on first login

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Initialize project structure
- [ ] Set up Cloudflare Workers with Hono
- [ ] Configure D1 database
- [ ] Create Drizzle schema and migrations
- [ ] Set up basic API routes (CRUD for all entities)
- [ ] Initialize React frontend with Vite
- [ ] Install and configure Shadcn/ui

### Phase 2: Core Features
- [ ] Build main layout with sidebar navigation
- [ ] Implement Customers page (list + detail)
- [ ] Implement Products page (list + detail)
- [ ] Implement Licenses page (list + detail)
- [ ] Create agreement management forms
- [ ] Add search and filtering

### Phase 3: Reporting & Billing
- [ ] Build Reports page with charts
- [ ] Implement Invoice/Billing due list
- [ ] Add export functionality (CSV)
- [ ] Create dashboard with overview stats

### Phase 4: Settings & Users
- [ ] Implement Settings page
- [ ] Category management
- [ ] Product type management
- [ ] User management interface

### Phase 5: Authentication & Deployment
- [ ] Configure Cloudflare Access
- [ ] Set up Azure AD integration
- [ ] Implement role-based access control
- [ ] Deploy to production
- [ ] Testing and bug fixes

---

## Cloudflare Configuration

### wrangler.toml (Worker)
```toml
name = "license-agreements-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "license-agreements"
database_id = "<your-database-id>"
```

### D1 Free Tier Limits
- 5 GB storage
- 100,000 row reads per day
- 1,000 row writes per day
- 5 million rows read per month

This should be sufficient for a license management system with moderate usage.

---

## Security Considerations

1. **Authentication**: All requests protected by Cloudflare Access
2. **Authorization**: Role-based access control (Admin, Editor, Viewer)
3. **Data Validation**: Input validation on all API endpoints
4. **Audit Trail**: All changes logged with user and timestamp
5. **HTTPS**: Enforced by Cloudflare

---

## Norwegian UI Labels

| English | Norwegian |
|---------|-----------|
| Customers | Kunder |
| Products | Produkter |
| Licenses | Lisenser |
| Reports | Rapport |
| Invoice/Billing | Faktura |
| Users | Brukere |
| Settings | Innstillinger |
| Amount | Sum |
| From Date | Dato fra |
| To Date | Dato til |
| Next Billing Date | Neste fakturadato |
| Billing Interval | Fakturaintervall |
| Category | Kategori |

---

## Sources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Azure AD + Cloudflare Zero Trust Integration](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/azuread/)
- [Cloudflare Workers Storage Options](https://developers.cloudflare.com/workers/platform/storage-options/)
