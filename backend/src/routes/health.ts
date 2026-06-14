import { Router } from 'express';
import { query } from '../db/connection';

export const healthRouter = Router();

healthRouter.get('/', async (_, res) => {
  const checks: Record<string, string> = {};
  let dbOk = false;

  try {
    await query('SELECT 1');
    checks.database = 'ok';
    dbOk = true;
  } catch {
    checks.database = 'error';
  }

  checks.redis = process.env.REDIS_URL ? 'configured' : 'not configured';
  checks.openai = process.env.OPENAI_API_KEY ? 'configured' : 'not configured';

  res.status(dbOk ? 200 : 503).json({
    service: 'LARY AI',
    version: '0.1.0',
    status: dbOk ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});
