import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { createDb, productTypes, agreements, customers, categories } from '../db';
import { Env, Variables } from '../types/env';
import { requireRole } from '../middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all product types (optionally filtered by category)
app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const categoryId = c.req.query('categoryId');
  const categoryName = c.req.query('category'); // 'Produkt' or 'Lisens'

  let result;

  if (categoryName) {
    // Get category ID first
    const category = await db.query.categories.findFirst({
      where: eq(categories.name, categoryName),
    });

    if (!category) {
      return c.json([]);
    }

    result = await db.query.productTypes.findMany({
      where: eq(productTypes.categoryId, category.id),
      with: {
        category: true,
        agreements: {
          where: eq(agreements.isActive, true),
        },
      },
    });
  } else if (categoryId) {
    result = await db.query.productTypes.findMany({
      where: eq(productTypes.categoryId, parseInt(categoryId)),
      with: {
        category: true,
        agreements: {
          where: eq(agreements.isActive, true),
        },
      },
    });
  } else {
    result = await db.query.productTypes.findMany({
      with: {
        category: true,
        agreements: {
          where: eq(agreements.isActive, true),
        },
      },
    });
  }

  // Add customer count and total revenue
  const enrichedResult = result.map((pt) => ({
    ...pt,
    customerCount: pt.agreements.length,
    totalRevenue: pt.agreements.reduce((sum, a) => sum + a.amount, 0),
  }));

  return c.json(enrichedResult);
});

// Get single product type with all customer agreements
app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const result = await db.query.productTypes.findFirst({
    where: eq(productTypes.id, id),
    with: {
      category: true,
      agreements: {
        with: {
          customer: true,
        },
      },
    },
  });

  if (!result) {
    return c.json({ error: 'Product type not found' }, 404);
  }

  // Calculate summary
  const activeAgreements = result.agreements.filter((a) => a.isActive);
  const summary = {
    totalCustomers: activeAgreements.length,
    totalRevenue: activeAgreements.reduce((sum, a) => sum + a.amount, 0),
    currency: 'NOK',
  };

  return c.json({ ...result, summary });
});

// Create product type
app.post('/', requireRole('admin', 'editor'), async (c) => {
  const db = createDb(c.env.DB);
  const body = await c.req.json<{
    name: string;
    categoryId: number;
    description?: string;
    defaultBillingIntervalMonths?: number;
  }>();

  if (!body.name || !body.categoryId) {
    return c.json({ error: 'Name and categoryId are required' }, 400);
  }

  const [result] = await db.insert(productTypes).values({
    name: body.name,
    categoryId: body.categoryId,
    description: body.description,
    defaultBillingIntervalMonths: body.defaultBillingIntervalMonths || 12,
  }).returning();

  return c.json(result, 201);
});

// Update product type
app.put('/:id', requireRole('admin', 'editor'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{
    name?: string;
    categoryId?: number;
    description?: string;
    defaultBillingIntervalMonths?: number;
  }>();

  const [result] = await db.update(productTypes)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(productTypes.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'Product type not found' }, 404);
  }

  return c.json(result);
});

// Delete product type (soft delete via cascade to agreements)
app.delete('/:id', requireRole('admin'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const [result] = await db.delete(productTypes)
    .where(eq(productTypes.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'Product type not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
