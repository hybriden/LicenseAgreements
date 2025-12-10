import { Context, Next } from 'hono';
import { Env, Variables } from '../types/env';
import { createDb, users } from '../db';
import { eq } from 'drizzle-orm';

// In production, this will read from Cloudflare Access JWT
// For development, we'll use mock data or allow unauthenticated access
export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  const db = createDb(c.env.DB);

  // Check for Cloudflare Access JWT header
  const cfAccessJwt = c.req.header('CF-Access-JWT-Assertion');
  const cfAccessEmail = c.req.header('X-User-Email') || c.req.header('CF-Access-Authenticated-User-Email');

  if (cfAccessEmail) {
    // Production: User authenticated via Cloudflare Access
    let user = await db.query.users.findFirst({
      where: eq(users.email, cfAccessEmail),
    });

    if (!user) {
      // First time login - create user
      // Convert email prefix to readable name (e.g., "hans.thjomoe" -> "Hans Thjomoe")
      const emailPrefix = cfAccessEmail.split('@')[0];
      const displayName = emailPrefix
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');

      const [newUser] = await db.insert(users).values({
        azureId: cfAccessJwt || `azure_${Date.now()}`,
        email: cfAccessEmail,
        displayName: displayName,
        role: 'viewer',
        lastLogin: new Date().toISOString(),
      }).returning();
      user = newUser;
    } else {
      // Update last login (and displayName if it's still just the email prefix)
      const emailPrefix = cfAccessEmail.split('@')[0];
      const needsDisplayNameUpdate = !user.displayName ||
        user.displayName === emailPrefix ||
        user.displayName === cfAccessEmail;

      const updates: { lastLogin: string; displayName?: string } = {
        lastLogin: new Date().toISOString(),
      };

      if (needsDisplayNameUpdate) {
        updates.displayName = emailPrefix
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
      }

      await db.update(users)
        .set(updates)
        .where(eq(users.id, user.id));

      if (updates.displayName) {
        user = { ...user, displayName: updates.displayName };
      }
    }

    c.set('user', {
      id: user.id,
      azureId: user.azureId,
      email: user.email,
      displayName: user.displayName,
      role: user.role || 'viewer',
    });
  } else if (c.env.ENVIRONMENT === 'development') {
    // Development: Use mock user
    c.set('user', {
      id: 1,
      azureId: 'dev-user',
      email: 'dev@example.com',
      displayName: 'Developer',
      role: 'admin',
    });
  } else {
    // Production without auth - deny
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
}

// Role-based access control
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    await next();
  };
}
