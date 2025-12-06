import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check for required environment variables
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'MASTER_KEY'];
  const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missingEnvVars.length > 0) {
    return res.status(500).json({
      error: 'Configuration Error',
      message: `Missing required environment variables: ${missingEnvVars.join(', ')}`,
      hint: 'Please configure these in your Vercel project settings'
    });
  }

  try {
    // Dynamic imports to avoid bundling issues
    const { PrismaClient } = await import('@prisma/client');
    
    // Test database connection
    const prisma = new PrismaClient();
    await prisma.$connect();
    
    // For now, return API info
    const url = new URL(req.url || '/', `https://${req.headers.host}`);
    const path = url.pathname.replace('/api', '');
    
    // Health check endpoint
    if (path === '' || path === '/' || path === '/health') {
      await prisma.$disconnect();
      return res.status(200).json({
        status: 'ok',
        message: 'UNI-CHAIN API is running',
        timestamp: new Date().toISOString(),
        endpoints: [
          'POST /api/login',
          'POST /api/register/farmer',
          'POST /api/register/transporter', 
          'POST /api/register/retailer',
          'POST /api/register/consumer',
          'GET /api/supplies',
          'GET /api/ledger/economic',
          'GET /api/ledger/quality',
          'GET /api/trace/:batchId'
        ]
      });
    }

    // Import routes dynamically
    const express = (await import('express')).default;
    const cors = (await import('cors')).default;
    
    const app = express();
    app.use(cors({ origin: '*', credentials: true }));
    app.use(express.json());

    // Import and mount routes
    const routes = (await import('../backend/src/routes/index.js')).default;
    app.use('/api', routes);

    // Convert Vercel request/response to Express
    return new Promise((resolve) => {
      app(req as any, res as any, () => {
        resolve(undefined);
      });
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
}
