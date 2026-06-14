import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../db/connection';
import { generateToken, verifyToken } from '../middleware/auth';
import crypto from 'crypto';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name_user: z.string().min(1).max(255),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  user_profile: z.enum(['admin', 'engineer', 'master', 'storekeeper', 'inspector', 'financial', 'viewer']).default('viewer'),
  id_work_allocated: z.string().uuid().optional(),
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error.flatten() });
  }

  const { name_user, email, password, user_profile, id_work_allocated } = validation.data;

  try {
    // Check if user exists
    const existing = await query('SELECT id_user FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password using pgcrypto
    const result = await query(
      `INSERT INTO users (name_user, email, user_profile, password_hash, id_work_allocated)
       VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), $5)
       RETURNING id_user, name_user, email, user_profile, created_at`,
      [name_user, email, user_profile, password, id_work_allocated || null],
    );

    const user = result.rows[0];
    const token = generateToken({
      id_user: user.id_user,
      name_user: user.name_user,
      email: user.email,
      user_profile: user.user_profile,
    });

    res.status(201).json({ user, token });
  } catch (err: any) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error.flatten() });
  }

  const { email, password } = validation.data;

  try {
    const result = await query(
      'SELECT id_user, name_user, email, user_profile FROM users WHERE email = $1 AND password_hash = crypt($2, password_hash) AND active = true',
      [email, password],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const token = generateToken({
      id_user: user.id_user,
      name_user: user.name_user,
      email: user.email,
      user_profile: user.user_profile,
    });

    res.json({ user, token });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// GET /api/auth/me — get current user from token
authRouter.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    const payload = verifyToken(authHeader.split(' ')[1]);
    const result = await query(
      'SELECT id_user, name_user, email, user_profile, id_work_allocated FROM users WHERE id_user = $1 AND active = true',
      [payload.id_user],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/change-password
authRouter.post('/change-password', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const schema = z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(6).max(100),
  });

  const validation = schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed' });
  }

  try {
    const payload = verifyToken(authHeader.split(' ')[1]);
    const { current_password, new_password } = validation.data;

    // Verify current password
    const verify = await query(
      'SELECT id_user FROM users WHERE id_user = $1 AND password_hash = crypt($2, password_hash)',
      [payload.id_user, current_password],
    );

    if (verify.rows.length === 0) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await query(
      'UPDATE users SET password_hash = crypt($1, gen_salt(\'bf\')), updated_at = NOW() WHERE id_user = $2',
      [new_password, payload.id_user],
    );

    res.json({ message: 'Password updated successfully' });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});
