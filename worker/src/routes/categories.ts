import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb, categories } from '../db';
import { Env, Variables } from '../types/env';
import { requireRole } from '../middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all categories
app.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const result = await db.query.categories.findMany({
    with: {
      productTypes: true,
    },
  });
  return c.json(result);
});

// Get single category
app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const result = await db.query.categories.findFirst({
    where: eq(categories.id, id),
    with: {
      productTypes: true,
    },
  });

  if (!result) {
    return c.json({ error: 'Category not found' }, 404);
  }

  return c.json(result);
});

// Create category (admin/editor only)
app.post('/', requireRole('admin', 'editor'), async (c) => {
  const db = createDb(c.env.DB);
  const body = await c.req.json<{ name: string; description?: string }>();

  if (!body.name) {
    return c.json({ error: 'Name is required' }, 400);
  }

  const [result] = await db.insert(categories).values({
    name: body.name,
    description: body.description,
  }).returning();

  return c.json(result, 201);
});

// Update category
app.put('/:id', requireRole('admin', 'editor'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{ name?: string; description?: string }>();

  const [result] = await db.update(categories)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(categories.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'Category not found' }, 404);
  }

  return c.json(result);
});

// Delete category
app.delete('/:id', requireRole('admin'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const [result] = await db.delete(categories)
    .where(eq(categories.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'Category not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
