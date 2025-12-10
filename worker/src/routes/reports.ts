import { Hono } from 'hono';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { createDb, agreements, productTypes, categories, customers } from '../db';
import { Env, Variables } from '../types/env';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Revenue report
app.get('/revenue', async (c) => {
  const db = createDb(c.env.DB);

  // Get all active agreements with their product types and categories
  const allAgreements = await db.query.agreements.findMany({
    where: eq(agreements.isActive, true),
    with: {
      productType: {
        with: {
          category: true,
        },
      },
      customer: true,
    },
  });

  // Calculate revenue by category
  const revenueByCategory: Record<string, { name: string; totalRevenue: number; agreementCount: number }> = {};
  const revenueByProductType: Record<string, { name: string; category: string; totalRevenue: number; agreementCount: number }> = {};

  let totalRevenue = 0;
  let totalAgreements = 0;

  allAgreements.forEach((agreement) => {
    const annualizedAmount = agreement.amount * (12 / agreement.billingIntervalMonths);
    totalRevenue += annualizedAmount;
    totalAgreements++;

    const categoryName = agreement.productType.category?.name || 'Ukjent';
    const productTypeName = agreement.productType.name;

    // Aggregate by category
    if (!revenueByCategory[categoryName]) {
      revenueByCategory[categoryName] = { name: categoryName, totalRevenue: 0, agreementCount: 0 };
    }
    revenueByCategory[categoryName].totalRevenue += annualizedAmount;
    revenueByCategory[categoryName].agreementCount++;

    // Aggregate by product type
    if (!revenueByProductType[productTypeName]) {
      revenueByProductType[productTypeName] = { name: productTypeName, category: categoryName, totalRevenue: 0, agreementCount: 0 };
    }
    revenueByProductType[productTypeName].totalRevenue += annualizedAmount;
    revenueByProductType[productTypeName].agreementCount++;
  });

  return c.json({
    summary: {
      totalAnnualRevenue: totalRevenue,
      totalAgreements,
      currency: 'NOK',
    },
    byCategory: Object.values(revenueByCategory).sort((a, b) => b.totalRevenue - a.totalRevenue),
    byProductType: Object.values(revenueByProductType).sort((a, b) => b.totalRevenue - a.totalRevenue),
  });
});

// Billing report - agreements due for billing
app.get('/billing', async (c) => {
  const db = createDb(c.env.DB);
  const daysAhead = parseInt(c.req.query('days') || '30');

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const allAgreements = await db.query.agreements.findMany({
    where: eq(agreements.isActive, true),
    with: {
      productType: {
        with: {
          category: true,
        },
      },
      customer: true,
    },
    orderBy: (agreements, { asc }) => [asc(agreements.nextBillingDate)],
  });

  // Filter to agreements due within the period
  const dueSoon = allAgreements.filter((a) => {
    const billingDate = new Date(a.nextBillingDate);
    return billingDate <= futureDate;
  });

  // Separate overdue and upcoming
  const overdue = dueSoon.filter((a) => new Date(a.nextBillingDate) < today);
  const upcoming = dueSoon.filter((a) => new Date(a.nextBillingDate) >= today);

  // Calculate totals
  const overdueTotal = overdue.reduce((sum, a) => sum + a.amount, 0);
  const upcomingTotal = upcoming.reduce((sum, a) => sum + a.amount, 0);

  return c.json({
    summary: {
      overdueCount: overdue.length,
      overdueTotal,
      upcomingCount: upcoming.length,
      upcomingTotal,
      currency: 'NOK',
      periodDays: daysAhead,
    },
    overdue,
    upcoming,
  });
});

// Dashboard statistics
app.get('/dashboard', async (c) => {
  const db = createDb(c.env.DB);

  // Get counts
  const allCustomers = await db.query.customers.findMany({
    where: eq(customers.isActive, true),
  });

  const allProductTypes = await db.query.productTypes.findMany();

  const allAgreements = await db.query.agreements.findMany({
    where: eq(agreements.isActive, true),
  });

  const allCategories = await db.query.categories.findMany();

  // Get upcoming billing (next 30 days)
  const today = new Date();
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

  const upcomingBilling = allAgreements.filter((a) => {
    const billingDate = new Date(a.nextBillingDate);
    return billingDate >= today && billingDate <= thirtyDaysAhead;
  });

  const overdueBilling = allAgreements.filter((a) => {
    return new Date(a.nextBillingDate) < today;
  });

  // Calculate total annual revenue
  const totalAnnualRevenue = allAgreements.reduce((sum, a) => {
    return sum + (a.amount * (12 / a.billingIntervalMonths));
  }, 0);

  return c.json({
    customers: {
      total: allCustomers.length,
    },
    productTypes: {
      total: allProductTypes.length,
    },
    agreements: {
      total: allAgreements.length,
      totalAnnualRevenue,
    },
    categories: {
      total: allCategories.length,
    },
    billing: {
      upcoming: upcomingBilling.length,
      upcomingTotal: upcomingBilling.reduce((sum, a) => sum + a.amount, 0),
      overdue: overdueBilling.length,
      overdueTotal: overdueBilling.reduce((sum, a) => sum + a.amount, 0),
    },
    currency: 'NOK',
  });
});

// Export data as CSV
app.get('/export', async (c) => {
  const db = createDb(c.env.DB);
  const type = c.req.query('type') || 'agreements';

  if (type === 'agreements') {
    const data = await db.query.agreements.findMany({
      with: {
        customer: true,
        productType: {
          with: {
            category: true,
          },
        },
      },
    });

    // Create CSV
    const headers = ['ID', 'Kunde', 'Produkt/Lisens', 'Kategori', 'Sum', 'Valuta', 'Start dato', 'Slutt dato', 'Fakturaintervall (mnd)', 'Neste fakturadato', 'Aktiv'];
    const rows = data.map((a) => [
      a.id,
      a.customer.name,
      a.productType.name,
      a.productType.category?.name || '',
      a.amount,
      a.currency,
      a.startDate,
      a.endDate || '',
      a.billingIntervalMonths,
      a.nextBillingDate,
      a.isActive ? 'Ja' : 'Nei',
    ]);

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="avtaler.csv"',
      },
    });
  }

  if (type === 'customers') {
    const data = await db.query.customers.findMany();

    const headers = ['ID', 'Navn', 'Org.nr', 'E-post', 'Telefon', 'Adresse', 'Aktiv'];
    const rows = data.map((c) => [
      c.id,
      c.name,
      c.orgNumber || '',
      c.contactEmail || '',
      c.contactPhone || '',
      c.address || '',
      c.isActive ? 'Ja' : 'Nei',
    ]);

    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="kunder.csv"',
      },
    });
  }

  return c.json({ error: 'Invalid export type' }, 400);
});

export default app;
