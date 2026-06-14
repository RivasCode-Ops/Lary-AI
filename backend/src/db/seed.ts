import 'dotenv/config';
import { pool, query } from './connection';
import { v4 as uuid } from 'uuid';

async function seed() {
  console.log('[Seed] Starting...');

  // Create test works
  const workId = uuid();
  await query(
    `INSERT INTO works (id_works, name_works, type_works, start_date, end_date, address, budget_total, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [workId, 'Residencial Park Avenue', 'Residencial', '2026-01-15', '2026-12-20',
     'Rua das Flores, 150 - Jardim Paulista', 4500000.00, 'active'],
  );

  const workId2 = uuid();
  await query(
    `INSERT INTO works (id_works, name_works, type_works, start_date, end_date, address, budget_total, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [workId2, 'Galpão Industrial Logtech', 'Industrial', '2026-03-01', '2026-11-30',
     'Av. Marginal, 2800 - Distrito Industrial', 8200000.00, 'active'],
  );

  // Create test users with bcrypt-hashed passwords (password: 123456)
  // Check if admin exists first (inserted by init.sql)
  const existingAdmin = await query('SELECT id_user FROM users WHERE email = $1', ['admin@lary.ai']);
  const adminId = existingAdmin.rows[0]?.id_user || uuid();

  if (!existingAdmin.rows[0]) {
    await query(
      `INSERT INTO users (id_user, name_user, email, user_profile, password_hash, active, id_work_allocated)
       VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), true, $6)`,
      [adminId, 'Admin LARY', 'admin@lary.ai', 'admin', '123456', workId],
    );
  }

  const masterId = uuid();
  await query(
    `INSERT INTO users (id_user, name_user, email, user_profile, password_hash, active, id_work_allocated)
     VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), true, $6)
     ON CONFLICT (email) DO NOTHING`,
    [masterId, 'Mestre Carlos', 'mestre@obra.com', 'master', '123456', workId],
  );

  const engineerId = uuid();
  await query(
    `INSERT INTO users (id_user, name_user, email, user_profile, password_hash, active, id_work_allocated)
     VALUES ($1, $2, $3, $4, crypt($5, gen_salt('bf')), true, $6)
     ON CONFLICT (email) DO NOTHING`,
    [engineerId, 'Eng. João Resende', 'engenheiro@obra.com', 'engineer', '123456', workId],
  );

  // Create sample RDOs
  const rdo1Id = uuid();
  await query(
    `INSERT INTO rdo (id_rdo, id_work, rdo_number, rdo_date, service, team, content, shift, weather, status, created_by, approved_by, approved_at, hash_sha256)
     VALUES ($1, $2, 1, '2026-06-10', 'Fôrma de viga V5', 'Turma do João (3 serventes)', 'Início da fôrma da viga V5. Material chegou com 1h de atraso. Produção normal no resto do dia.', 'diurno', 'sol', 'approved', $3, $4, NOW(), $5)`,
    [rdo1Id, workId, masterId, engineerId, 'a3f8c2d1e5b79f4e2c1d8a6b3f7e0d9c2a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8'],
  );

  const rdo2Id = uuid();
  await query(
    `INSERT INTO rdo (id_rdo, id_work, rdo_number, rdo_date, service, team, content, shift, weather, status, created_by, approved_by, approved_at, hash_sha256)
     VALUES ($1, $2, 2, '2026-06-11', 'Concretagem laje L02', 'Turma do João + Betoneira', 'Concretagem da laje L02. 4 caminhões betoneira. 42m³ de concreto usinado. Chuva leve das 14h sem paralisação.', 'diurno', 'chuva leve', 'approved', $3, $4, NOW(), $5)`,
    [rdo2Id, workId, masterId, engineerId, 'b4f9d3e2c6a80f5f3d2e9b7c4a8f1e0d9b2c5d7e8f9a0b1c2d3e4f5a6b7c8d9'],
  );

  const rdo3Id = uuid();
  await query(
    `INSERT INTO rdo (id_rdo, id_work, rdo_number, rdo_date, service, team, content, shift, weather, status, created_by)
     VALUES ($1, $2, 3, '2026-06-13', 'Alvenaria bloco cerâmico', 'Turma do João (3 serventes)', 'Início da alvenaria do 2º pavimento. Bloco cerâmico 14x19x29. Produção: 18m² no período.', 'diurno', 'sol', 'pending', $3)`,
    [rdo3Id, workId, masterId],
  );

  // Add photos to RDO 1
  await query(
    `INSERT INTO photos (id_photo, id_rdo, url, latitude, longitude, tags)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuid(), rdo1Id, 'https://images.unsplash.com/photo-1590674899484-d5640d1f8f6f', -23.5505, -46.6333, ['forma', 'viga-v5']],
  );

  await query(
    `INSERT INTO photos (id_photo, id_rdo, url, latitude, longitude, tags)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuid(), rdo1Id, 'https://images.unsplash.com/photo-1590674899484-d5640d1f8f6f', -23.5505, -46.6333, ['armadura']],
  );

  // AI confidence logs
  await query(
    `INSERT INTO ai_confidence (id_ai_log, id_rdo, field_name, extracted_value, confidence, model, was_corrected)
     VALUES ($1, $2, 'service', 'Fôrma de viga V5', 98, 'gpt-4o-mini', false),
            ($3, $2, 'team', 'Turma do João (3 serventes)', 95, 'gpt-4o-mini', false),
            ($4, $2, 'weather', 'Sol', 97, 'gpt-4o-mini', false)`,
    [uuid(), rdo1Id, uuid(), uuid()],
  );

  // Audit trail
  await query(
    `INSERT INTO audit_trail (id_audit, id_rdo, id_user, action, metadata)
     VALUES ($1, $2, $3, 'RDO_CREATED', '{"source":"mobile","rdo_number":1}'),
            ($4, $2, $5, 'RDO_APPROVED', '{"hash":"a3f8c2d1..."}')`,
    [uuid(), rdo1Id, masterId, uuid(), engineerId],
  );

  console.log('[Seed] Complete!');
  console.log('');
  console.log('=== Credenciais de teste ===');
  console.log('Admin:        admin@lary.ai / 123456');
  console.log('Mestre:       mestre@obra.com / 123456');
  console.log('Engenheiro:   engenheiro@obra.com / 123456');
  console.log('');
  console.log('=== Obras de teste ===');
  console.log(`Residencial Park Avenue (${workId})`);
  console.log(`Galpão Industrial Logtech (${workId2})`);
  console.log('');
  console.log('=== RDOs de exemplo ===');
  console.log('RDO #1 - Aprovado (Fôrma viga V5)');
  console.log('RDO #2 - Aprovado (Concretagem laje L02)');
  console.log('RDO #3 - Pendente (Alvenaria)');
  console.log('');

  await pool.end();
}

seed().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
