import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from '../backend/src/routes';

// Load environment variables
dotenv.config();

const app = express();

// Enable CORS
app.use(cors({
  origin: '*', // In production, specify your frontend domain
  credentials: true,
}));
app.use(express.json());

// Mount API routes at /api
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export as Vercel serverless function handler
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
