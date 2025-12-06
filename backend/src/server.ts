import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { cleanupOldProduceLogs } from './controllers/produceController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

// Error handling middleware (must be after routes)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cleanup old produce logs every 24 hours (86400000 ms)
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

const scheduleCleanup = () => {
  // Run cleanup immediately on startup
  cleanupOldProduceLogs();

  // Then schedule it to run every 24 hours
  setInterval(() => {
    cleanupOldProduceLogs();
  }, CLEANUP_INTERVAL);
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Scheduling produce logs cleanup job (runs every 24 hours)');
  scheduleCleanup();
});

