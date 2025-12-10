import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { createDb, users } from '../db';
import { Env, Variables } from '../types/env';
import { requireRole } from '../middleware/auth';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get all users
app.get('/', async (c) => {
  const db = createDb(c.env.DB);

  const result = await db.query.users.findMany({
    orderBy: (users, { asc }) => [asc(users.displayName)],
  });

  return c.json(result);
});

// Get current user
app.get('/me', async (c) => {
  const user = c.get('user');

  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  return c.json(user);
});

// Get single user
app.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!result) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(result);
});

// Update user role (admin only)
app.put('/:id/role', requireRole('admin'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json<{ role: string }>();

  if (!body.role || !['admin', 'editor', 'viewer'].includes(body.role)) {
    return c.json({ error: 'Invalid role. Must be admin, editor, or viewer' }, 400);
  }

  const [result] = await db.update(users)
    .set({ role: body.role })
    .where(eq(users.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json(result);
});

// Deactivate user (admin only)
app.delete('/:id', requireRole('admin'), async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));
  const currentUser = c.get('user');

  // Prevent self-deactivation
  if (currentUser && currentUser.id === id) {
    return c.json({ error: 'Cannot deactivate yourself' }, 400);
  }

  const [result] = await db.update(users)
    .set({ isActive: false })
    .where(eq(users.id, id))
    .returning();

  if (!result) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;
