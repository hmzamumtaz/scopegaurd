import express from 'express';
import serverless from 'serverless-http';
import { MulterError } from 'multer';
import parseSowRouter from '../src/server/routes/parseSow';
import webhookRouter from '../src/server/routes/webhook';
import requestsRouter from '../src/server/routes/requests';
import agenciesRouter from '../src/server/routes/agencies';
import clientsRouter from '../src/server/routes/clients';
import sowsRouter from '../src/server/routes/sows';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use('/api/parse-sow', parseSowRouter);
app.use('/api/webhook', webhookRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/agencies', agenciesRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/sows', sowsRouter);

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

const handler = serverless(app);
export default handler;
