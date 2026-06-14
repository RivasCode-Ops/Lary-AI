import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rdoRouter } from './routes/rdo';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { initializeDB } from './db/connection';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));

app.get('/', (_req, res) => res.json({ service: 'LARY AI', status: 'running' }));
app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/rdo', authMiddleware, rdoRouter);

app.use(errorHandler);

async function start() {
  await initializeDB();
  app.listen(PORT, () => {
    console.log(`[LARY AI] API running on port ${PORT}`);
  });
}

start().catch(console.error);

export default app;
