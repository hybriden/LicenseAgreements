import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Categories (Product, License, etc.)
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Products/License Types
export const productTypes = sqliteTable('product_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  description: text('description'),
  defaultBillingIntervalMonths: integer('default_billing_interval_months').default(12),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Customers
export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  orgNumber: text('org_number'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  notes: text('notes'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Customer Agreements (links customers to products/licenses)
export const agreements = sqliteTable('agreements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  productTypeId: integer('product_type_id').notNull().references(() => productTypes.id),
  amount: real('amount').notNull(),
  currency: text('currency').default('NOK'),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  billingIntervalMonths: integer('billing_interval_months').notNull(),
  nextBillingDate: text('next_billing_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  notes: text('notes'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});

// Users (synced from Azure AD)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  azureId: text('azure_id').unique().notNull(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('viewer'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastLogin: text('last_login'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Audit Log
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id'),
  oldValues: text('old_values'),
  newValues: text('new_values'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  productTypes: many(productTypes),
}));

export const productTypesRelations = relations(productTypes, ({ one, many }) => ({
  category: one(categories, {
    fields: [productTypes.categoryId],
    references: [categories.id],
  }),
  agreements: many(agreements),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  agreements: many(agreements),
}));

export const agreementsRelations = relations(agreements, ({ one }) => ({
  customer: one(customers, {
    fields: [agreements.customerId],
    references: [customers.id],
  }),
  productType: one(productTypes, {
    fields: [agreements.productTypeId],
    references: [productTypes.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLog),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));
