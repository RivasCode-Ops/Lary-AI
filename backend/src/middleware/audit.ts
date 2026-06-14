import { query } from '../db/connection';
import { v4 as uuid } from 'uuid';

interface AuditParams {
  id_rdo: string;
  id_user?: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
}

export async function logAudit(params: AuditParams) {
  try {
    await query(
      `INSERT INTO audit_trail (id_audit, id_rdo, id_user, action, field_name, old_value, new_value, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        uuid(),
        params.id_rdo,
        params.id_user || null,
        params.action,
        params.field_name || null,
        params.old_value || null,
        params.new_value || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        params.ip_address || null,
      ],
    );
  } catch (err) {
    console.error('[Audit] Failed to log:', err);
  }
}
