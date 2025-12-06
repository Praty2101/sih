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

  // API info endpoint
  return res.status(200).json({
    status: 'ok',
    message: 'UNI-CHAIN API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    note: 'For full API functionality, please run the backend server locally or deploy to a dedicated server (Railway, Render, etc.)',
    localBackend: 'http://localhost:3001/api',
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
