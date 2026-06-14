import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { query } from '../db/connection';
import { extractFields } from '../ai/extract';
import { createRDOValidation, approveRDOValidation } from '../middleware/validation';
import { logAudit } from '../middleware/audit';

export const rdoRouter = Router();

// List RDOs
rdoRouter.get('/', async (req: Request, res: Response) => {
  const { id_work, status, start, end } = req.query;
  let sql = 'SELECT * FROM rdo WHERE 1=1';
  const params: any[] = [];

  if (id_work) {
    params.push(id_work);
    sql += ` AND id_work = $${params.length}`;
  }
  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }
  if (start) {
    params.push(start);
    sql += ` AND rdo_date >= $${params.length}`;
  }
  if (end) {
    params.push(end);
    sql += ` AND rdo_date <= $${params.length}`;
  }

  sql += ' ORDER BY rdo_date DESC, rdo_number DESC LIMIT 100';

  try {
    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch RDOs' });
  }
});

// Get single RDO
rdoRouter.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM rdo WHERE id_rdo = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RDO not found' });
    }
    const photos = await query('SELECT * FROM photos WHERE id_rdo = $1', [id]);
    const audit = await query(
      'SELECT * FROM audit_trail WHERE id_rdo = $1 ORDER BY created_at DESC',
      [id],
    );
    res.json({ ...result.rows[0], photos: photos.rows, audit: audit.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch RDO' });
  }
});

// Create RDO
rdoRouter.post('/', async (req: Request, res: Response) => {
  const validation = createRDOValidation.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error.flatten() });
  }

  const { id_work, rdo_date, service, team, content, shift, weather, photos, created_by } = validation.data;

  try {
    // Get next RDO number
    const numRes = await query(
      'SELECT COALESCE(MAX(rdo_number), 0) + 1 AS next_num FROM rdo WHERE id_work = $1',
      [id_work],
    );
    const rdo_number = numRes.rows[0].next_num;

    const id_rdo = uuid();
    await query(
      `INSERT INTO rdo (id_rdo, id_work, rdo_number, rdo_date, service, team, content, shift, weather, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)`,
      [id_rdo, id_work, rdo_number, rdo_date, service, team, content, shift, weather, created_by],
    );

    // Insert photos if any
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        await query(
          `INSERT INTO photos (id_photo, id_rdo, url, latitude, longitude, tags)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuid(), id_rdo, photo.url, photo.latitude, photo.longitude, photo.tags || []],
        );
      }
    }

    // Trigger IA extraction asynchronously (fire and forget via queue in production)
    extractFields(id_rdo, content).catch(console.error);

    await logAudit({
      id_rdo,
      action: 'RDO_CREATED',
      metadata: { rdo_number, source: 'offline' },
    });

    res.status(201).json({ id_rdo, rdo_number, status: 'pending' });
  } catch (err: any) {
    console.error('[RDO] Create error:', err);
    res.status(500).json({ error: 'Failed to create RDO' });
  }
});

// Approve RDO
rdoRouter.patch('/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const validation = approveRDOValidation.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Validation failed', details: validation.error.flatten() });
  }

  const { approved_by, engineer_notes, confirmed_review } = validation.data;
  if (!confirmed_review) {
    return res.status(400).json({ error: 'You must confirm review before approving' });
  }

  try {
    const existing = await query('SELECT * FROM rdo WHERE id_rdo = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'RDO not found' });
    }

    const rdo = existing.rows[0];
    if (rdo.status === 'approved') {
      return res.status(409).json({ error: 'RDO already approved' });
    }

    // Generate SHA-256 hash of content for integrity
    const hashContent = `${rdo.content}${rdo.service}${rdo.rdo_date}${rdo.rdo_number}`;
    const hash_sha256 = crypto.createHash('sha256').update(hashContent).digest('hex');

    await query(
      `UPDATE rdo SET status = 'approved', approved_by = $1, approved_at = NOW(),
       engineer_notes = $2, hash_sha256 = $3, updated_at = NOW()
       WHERE id_rdo = $4`,
      [approved_by, engineer_notes, hash_sha256, id],
    );

    await logAudit({
      id_rdo: id,
      id_user: approved_by,
      action: 'RDO_APPROVED',
      metadata: { hash_sha256 },
    });

    res.json({
      id_rdo: id,
      status: 'approved',
      hash_sha256,
      approved_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve RDO' });
  }
});

// Generate PDF
rdoRouter.get('/:id/pdf', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM rdo WHERE id_rdo = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'RDO not found' });
    }
    const rdo = result.rows[0];
    // Get approver name if approved
    if (rdo.approved_by) {
      const userRes = await query('SELECT name_user FROM users WHERE id_user = $1', [rdo.approved_by]);
      if (userRes.rows.length > 0) {
        rdo.approved_name = userRes.rows[0].name_user;
      }
    }
    const pdfContent = await generatePDF(rdo);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rdo_${rdo.rdo_number}.pdf`);
    res.send(pdfContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Export CSV
rdoRouter.get('/export/csv', async (req: Request, res: Response) => {
  const { start, end, id_work } = req.query;
  let sql = 'SELECT * FROM rdo WHERE status = $1';
  const params: any[] = ['approved'];

  if (start) {
    params.push(start);
    sql += ` AND rdo_date >= $${params.length}`;
  }
  if (end) {
    params.push(end);
    sql += ` AND rdo_date <= $${params.length}`;
  }
  if (id_work) {
    params.push(id_work);
    sql += ` AND id_work = $${params.length}`;
  }
  sql += ' ORDER BY rdo_date ASC';

  try {
    const result = await query(sql, params);
    const csvLines = ['data,obra,servico,equipe,ocorrencias,status,hash'];
    for (const row of result.rows) {
      csvLines.push(
        `${row.rdo_date},${row.id_work},${row.service || ''},${row.team || ''},${(row.content || '').replace(/"/g, '""')},${row.status},${row.hash_sha256 || ''}`,
      );
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=rdo_export.csv');
    res.send(csvLines.join('\n'));
  } catch (err) {
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

function generatePDF(rdo: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `RDO #${rdo.rdo_number}`,
        Author: 'LARY AI',
        Subject: 'Registro Diário de Obra',
        Keywords: 'RDO, construção civil, LARY AI',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('LARY AI', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor('#64748b')
      .text('Sistema de Inteligência Artificial para Construção Civil', { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(1);

    // Title
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f172a')
      .text(`RDO #${rdo.rdo_number}`, { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#64748b')
      .text(`Data: ${new Date(rdo.rdo_date).toLocaleDateString('pt-BR')}`, { align: 'center' });
    doc.moveDown(0.5);

    // Status badge
    const statusColor = rdo.status === 'approved' ? '#22c55e' : rdo.status === 'pending' ? '#eab308' : '#ef4444';
    doc.fontSize(11).font('Helvetica-Bold').fillColor(statusColor)
      .text(rdo.status === 'approved' ? '✅ APROVADO' : rdo.status === 'pending' ? '⏳ PENDENTE' : '❌ REJEITADO', { align: 'center' });
    doc.moveDown(1.5);

    // Info section
    const leftX = 50;
    const labelX = 180;

    function drawField(label: string, value: string, y?: number) {
      const currentY = y ?? doc.y;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#64748b').text(label, leftX, currentY);
      doc.font('Helvetica').fillColor('#0f172a').text(value || 'N/A', labelX, currentY);
      return doc.y + 8;
    }

    let y = doc.y;
    y = drawField('Serviço:', rdo.service || 'N/A', y);
    y = drawField('Equipe:', rdo.team || 'N/A', y);
    y = drawField('Turno:', rdo.shift || 'N/A', y);
    y = drawField('Clima:', rdo.weather || 'N/A', y);

    doc.y = y;
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    // Content
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Ocorrências do dia');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#334155').text(rdo.content || 'Nenhuma ocorrência registrada.', {
      align: 'justify',
      lineGap: 4,
    });

    if (rdo.engineer_notes) {
      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.5);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('Observações do Engenheiro');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#334155').text(rdo.engineer_notes, {
        align: 'justify',
        lineGap: 4,
      });
    }

    // Hash and audit
    doc.moveDown(1.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text('Hash de Integridade (SHA-256)');
    doc.fontSize(8).font('Courier').fillColor('#94a3b8').text(rdo.hash_sha256 || 'N/A', { lineGap: 2 });
    doc.moveDown(0.3);

    if (rdo.approved_by) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text(`Aprovado por: ${rdo.approved_name || rdo.approved_by}`);
    }
    if (rdo.approved_at) {
      doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Em: ${new Date(rdo.approved_at).toLocaleString('pt-BR')}`);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(
      'Documento gerado por LARY AI. Verifique a integridade através do hash SHA-256.',
      { align: 'center', lineGap: 2 },
    );
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

    doc.end();
  });
}
