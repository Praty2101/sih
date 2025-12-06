import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazily initialize the Express app to avoid build-time crashes (e.g., missing Prisma client)
let cachedApp: any;

async function getApp() {
  if (cachedApp) return cachedApp;

  // Dynamic imports to prevent build-time failures
  const [{ default: express }, { default: cors }, dotenv, routesModule] = await Promise.all([
    import('express'),
    import('cors'),
    import('dotenv'),
    import('../src/routes')
  ]);

  // Load env vars (Vercel provides them via process.env)
  dotenv.config();

  const app = express();

  app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  app.use(express.json());

  // Health check endpoints
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API routes
  app.use('/api', routesModule.default);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'UNI-CHAIN API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        api: '/api',
        docs: 'See /api for available endpoints'
      }
    });
  });

  // Error handling middleware
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', message: err?.message });
  });

  cachedApp = app;
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ensure required environment variables exist to avoid Prisma init crashes
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'MASTER_KEY'];
  const missing = requiredEnv.filter((k) => !process.env[k]);
  if (missing.length) {
    return res.status(500).json({
      error: 'Configuration error',
      message: `Missing env vars: ${missing.join(', ')}`,
    });
  }

  try {
    const app = await getApp();
    return app(req as any, res as any);
  } catch (err: any) {
    console.error('Serverless function error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err?.message || 'Unknown error',
      hint: err?.code === 'P1012' ? 'Prisma client not generated. Add \"postinstall\": \"prisma generate\" to backend/package.json' : undefined,
    });
  }
}

