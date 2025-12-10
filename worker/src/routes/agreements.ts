import { Hono } from 'hono';
import { eq, and, lte, gte } from 'drizzle-orm';
import { createDb, agreements, productTypes, customers } from '../db';
import { Env, Variables } from '../types/env';
import { requireRole } from '../middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all agreements with filters
app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const customerId = c.req.query('customerId');
  const productTypeId = c.req.query('productTypeId');
  const categoryId = c.req.query('categoryId');
  const activeOnly = c.req.query('active') !== 'false';

  const result = await db.query.agreements.findMany({
    where: activeOnly ? eq(agreements.isActive, true) : undefined,
    with: {
      customer: true,
      productType: {
        with: {
          category: true,
        },
      },
    },
    orderBy: (agreements, { asc }) => [asc(agreements.nextBillingDate)],
  });

  // Apply filters
  let filtered = result;

  if (customerId) {
    filtered = filtered.filter((a) => a.customerId === parseInt(customerId));
  }

  if (productTypeId) {
    filtered = filtered.filter((a) => a.productTypeId === parseInt(productTypeId));
  }

  if (categoryId) {
    filtered = filtered.filter((a) => a.productType.categoryId === parseInt(categoryId));
  }

  return c.json(filtered);
});

// Get single agreement
app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const result = await db.query.agreements.findFirst({
    where: eq(agreements.id, id),
    with: {
      customer: true,
      productType: {
        with: {
          category: true,
        },
      },
    },
  });

  if (!result) {
    return c.json({ error: 'Agreement not found' }, 404);
  }

  return c.json(result);
});

// Create agreement
app.post('/', requireRole('admin', 'editor'), async (c) => {
  const db = createDb(c.env.DB);
  const body = await c.req.json<{
    customerId: number;
    productTypeId: number;
    amount: number;
    currency?: string;
    startDate: string;
    endDate?: string;
    billingIntervalMonths: number;
    nextBillingDate: string;
    notes?: string;
  }>();

  // Validation
  if (!body.customerId || !body.productTypeId || !body.amount || !body.startDate || !body.billingIntervalMonths || !body.nextBillingDate) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  // Verify customer exists
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, body.customerId),
  });

  if (!customer) {
    return c.json({ error: 'Customer not found' }, 404);
  }

  // Verify product type exists
  const productType = await db.query.productTypes.findFirst({
    where: eq(productTypes.id, body.productTypeId),
  });

  if (!productType) {
    return c.json({ error: 'Product type not found' }, 404);
  }

  const [result] = await db.insert(agreements).values({
    customerId: body.customerId,
    productTypeId: body.productTypeId,
    amount: body.amount,
    currency: body.currency || 'NOK',
    startDate: body.startDate,
    endDate: body.endDate,
    billingIntervalMonths: body.billingIntervalMonths,
    nextBillingDate: body.nextBillingDate,
    notes: body.notes,
  }).returning();

  return c.json(result, 201);
});

// Update agreement
app.put('/:id', requireRole('admin', 'editor'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{
    amount?: number;
    currency?: string;
    startDate?: string;
    endDate?: string;
    billingIntervalMonths?: number;
    nextBillingDate?: string;
    isActive?: boolean;
    notes?: string;
  }>();

  const [result] = await db.update(agreements)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(agreements.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'Agreement not found' }, 404);
  }

  return c.json(result);
});

// Soft delete agreement
app.delete('/:id', requireRole('admin'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const [result] = await db.update(agreements)
    .set({
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(agreements.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'Agreement not found' }, 404);
  }

  return c.json({ success: true });
});

// Mark agreement as billed (update next billing date)
app.post('/:id/bill', requireRole('admin', 'editor'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const agreement = await db.query.agreements.findFirst({
    where: eq(agreements.id, id),
  });

  if (!agreement) {
    return c.json({ error: 'Agreement not found' }, 404);
  }

  // Calculate next billing date
  const currentBillingDate = new Date(agreement.nextBillingDate);
  const nextDate = new Date(currentBillingDate);
  nextDate.setMonth(nextDate.getMonth() + agreement.billingIntervalMonths);

  const [result] = await db.update(agreements)
    .set({
      nextBillingDate: nextDate.toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    })
    .where(eq(agreements.id, id))
    .returning();

  return c.json(result);
});

export default app;
