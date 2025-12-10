import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env, Variables } from './types/env';
import { authMiddleware } from './middleware/auth';

// Routes
import categoriesRoutes from './routes/categories';
import productTypesRoutes from './routes/product-types';
import customersRoutes from './routes/customers';
import agreementsRoutes from './routes/agreements';
import reportsRoutes from './routes/reports';
import usersRoutes from './routes/users';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://license-agreements.pages.dev',
      'https://license.neoteric.no',
    ];
    // Allow *.license-agreements.pages.dev preview URLs
    if (origin && (allowed.includes(origin) || origin.endsWith('.license-agreements.pages.dev'))) {
      return origin;
    }
    return allowed[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'CF-Access-JWT-Assertion', 'CF-Access-Authenticated-User-Email', 'X-User-Email'],
  credentials: true,
}));

// Health check (no auth required)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint to check headers received by worker (no auth)
app.get('/api/debug-headers', (c) => {
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return c.json({
    message: 'Worker debug headers',
    cfAccessEmail: c.req.header('CF-Access-Authenticated-User-Email'),
    cfAccessJwt: c.req.header('CF-Access-JWT-Assertion') ? 'present' : 'missing',
    allHeaders: headers,
  });
});

// Apply auth middleware to all /api routes except health, debug, and OPTIONS (preflight)
app.use('/api/*', async (c, next) => {
  if (c.req.path === "/api/health" || c.req.path === "/api/debug-headers" || c.req.method === "OPTIONS") {
    return next();
  }
  return authMiddleware(c, next);
});

// Mount routes
app.route('/api/categories', categoriesRoutes);
app.route('/api/product-types', productTypesRoutes);
app.route('/api/customers', customersRoutes);
app.route('/api/agreements', agreementsRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/users', usersRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

export default app;
