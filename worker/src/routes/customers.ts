import { Hono } from 'hono';
import { eq, like, or, and } from 'drizzle-orm';
import { createDb, customers, agreements } from '../db';
import { Env, Variables } from '../types/env';
import { requireRole } from '../middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all customers
app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const search = c.req.query('search');
  const activeOnly = c.req.query('active') !== 'false';

  let whereClause;
  if (search) {
    whereClause = and(
      activeOnly ? eq(customers.isActive, true) : undefined,
      or(
        like(customers.name, `%${search}%`),
        like(customers.orgNumber, `%${search}%`),
        like(customers.contactEmail, `%${search}%`)
      )
    );
  } else if (activeOnly) {
    whereClause = eq(customers.isActive, true);
  }

  const result = await db.query.customers.findMany({
    where: whereClause,
    with: {
      agreements: {
        where: eq(agreements.isActive, true),
        with: {
          productType: {
            with: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: (customers, { asc }) => [asc(customers.name)],
  });

  // Add summary for each customer
  const enrichedResult = result.map((customer) => ({
    ...customer,
    summary: {
      totalAgreements: customer.agreements.length,
      totalMonthlyValue: customer.agreements.reduce((sum, a) => {
        // Normalize to monthly value
        return sum + (a.amount / a.billingIntervalMonths);
      }, 0),
      totalAnnualValue: customer.agreements.reduce((sum, a) => {
        return sum + (a.amount * (12 / a.billingIntervalMonths));
      }, 0),
    },
  }));

  return c.json(enrichedResult);
});

// Get single customer with all agreements
app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const result = await db.query.customers.findFirst({
    where: eq(customers.id, id),
    with: {
      agreements: {
        with: {
          productType: {
            with: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    return c.json({ error: 'Customer not found' }, 404);
  }

  // Separate active and inactive agreements
  const activeAgreements = result.agreements.filter((a) => a.isActive);
  const inactiveAgreements = result.agreements.filter((a) => !a.isActive);

  // Calculate summary
  const summary = {
    totalAgreements: activeAgreements.length,
    totalMonthlyValue: activeAgreements.reduce((sum, a) => sum + (a.amount / a.billingIntervalMonths), 0),
    totalAnnualValue: activeAgreements.reduce((sum, a) => sum + (a.amount * (12 / a.billingIntervalMonths)), 0),
    currency: 'NOK',
  };

  return c.json({
    ...result,
    activeAgreements,
    inactiveAgreements,
    summary,
  });
});

// Create customer
app.post('/', requireRole('admin', 'editor'), async (c) => {
  const db = createDb(c.env.DB);
  const body = await c.req.json<{
    name: string;
    orgNumber?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    notes?: string;
  }>();

  if (!body.name) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const [result] = await db.insert(customers).values({
    name: body.name,
    orgNumber: body.orgNumber,
    contactEmail: body.contactEmail,
    contactPhone: body.contactPhone,
    address: body.address,
    notes: body.notes,
  }).returning();

  return c.json(result, 201);
});

// Update customer
app.put('/:id', requireRole('admin', 'editor'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{
    name?: string;
    orgNumber?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    notes?: string;
    isActive?: boolean;
  }>();

  const [result] = await db.update(customers)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(customers.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'Customer not found' }, 404);
  }

  return c.json(result);
});

// Soft delete customer
app.delete('/:id', requireRole('admin'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const [result] = await db.update(customers)
    .set({
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(customers.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'Customer not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
