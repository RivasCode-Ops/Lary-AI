import { z } from 'zod';

export const createRDOValidation = z.object({
  id_work: z.string().uuid(),
  rdo_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service: z.string().min(1).max(255).optional(),
  team: z.string().max(500).optional(),
  content: z.string().min(1).max(10000),
  shift: z.enum(['diurno', 'noturno', 'integral']).optional(),
  weather: z.string().max(100).optional(),
  photos: z.array(z.object({
    url: z.string().url(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    tags: z.array(z.string()).optional(),
  })).max(10).optional(),
  created_by: z.string().uuid().optional(),
});

export const approveRDOValidation = z.object({
  approved_by: z.string().uuid(),
  engineer_notes: z.string().max(2000).optional(),
  confirmed_review: z.literal(true, {
    errorMap: () => ({ message: 'You must explicitly confirm review before approving' }),
  }),
});

export const listRDOValidation = z.object({
  id_work: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'approved', 'rejected']).optional(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
