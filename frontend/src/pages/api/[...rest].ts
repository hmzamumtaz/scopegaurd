import { NextApiRequest, NextApiResponse } from 'next';
import express from 'express';
import { MulterError } from 'multer';
import parseSowRouter from '../../server/routes/parseSow';
import webhookRouter from '../../server/routes/webhook';
import requestsRouter from '../../server/routes/requests';
import agenciesRouter from '../../server/routes/agencies';
import clientsRouter from '../../server/routes/clients';
import sowsRouter from '../../server/routes/sows';
import seedRouter from '../../server/routes/seed';

const app = express();

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
app.use('/api/seed', seedRouter);

app.use((err: Error & { type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (err: unknown) => {
      if (err) {
        console.error('Express error:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
