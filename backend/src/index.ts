import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MulterError } from 'multer';
import parseSowRouter from './routes/parseSow';
import webhookRouter from './routes/webhook';
import requestsRouter from './routes/requests';
import agenciesRouter from './routes/agencies';
import clientsRouter from './routes/clients';
import sowsRouter from './routes/sows';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'scopeguard-backend' });
});

app.use('/api/parse-sow', parseSowRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/agencies', agenciesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/sows', sowsRouter);

app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 20MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  if (err.message && err.message.includes('Only PDF and text files')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`ScopeGuard backend running on http://localhost:${PORT}`);
});

function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
