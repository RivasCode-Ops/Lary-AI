import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test('Fluxo completo RDO: login → criar → extrair IA → aprovar → PDF → CSV', async ({ request }) => {
  // 1. Login como mestre
  const loginRes = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: 'mestre@obra.com', password: '123456' },
  });
  expect(loginRes.status()).toBe(200);
  const { token: masterToken } = await loginRes.json();
  expect(masterToken).toBeTruthy();

  // 2. Obter obra do mestre
  const meRes = await request.get(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${masterToken}` },
  });
  expect(meRes.status()).toBe(200);
  const { user } = await meRes.json();
  const workId = user.id_work_allocated;
  expect(workId).toBeTruthy();

  // 3. Criar RDO
  const rdoRes = await request.post(`${BASE_URL}/api/rdo`, {
    data: {
      id_work: workId,
      rdo_date: '2026-06-13',
      service: 'Concretagem Laje L02',
      team: 'Turma do João (8 operários)',
      content: 'Início da concretagem da laje L02. 4 caminhões betoneira recebidos. Chuva leve das 14h. Produção normal.',
      shift: 'diurno',
      weather: 'chuva leve',
    },
    headers: { Authorization: `Bearer ${masterToken}` },
  });
  expect(rdoRes.status()).toBe(201);
  const { id_rdo: rdoId, status } = await rdoRes.json();
  expect(rdoId).toBeTruthy();
  expect(status).toBe('pending');

  // 4. Login como engenheiro
  const engLoginRes = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: 'engenheiro@obra.com', password: '123456' },
  });
  expect(engLoginRes.status()).toBe(200);
  const { token: engineerToken } = await engLoginRes.json();

  const engMeRes = await request.get(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${engineerToken}` },
  });
  expect(engMeRes.status()).toBe(200);
  const { user: engineer } = await engMeRes.json();
  const engineerId = engineer.id_user;

  // 5. Engenheiro aprova RDO com confirmação explícita
  const approveRes = await request.patch(`${BASE_URL}/api/rdo/${rdoId}/approve`, {
    data: {
      approved_by: engineerId,
      engineer_notes: 'Concretagem dentro do esperado. Nenhuma não conformidade.',
      confirmed_review: true,
    },
    headers: { Authorization: `Bearer ${engineerToken}` },
  });
  expect(approveRes.status()).toBe(200);
  const approveBody = await approveRes.json();
  expect(approveBody.status).toBe('approved');
  expect(approveBody.hash_sha256).toMatch(/^[a-f0-9]{64}$/);

  // 6. Gerar PDF
  const pdfRes = await request.get(`${BASE_URL}/api/rdo/${rdoId}/pdf`, {
    headers: { Authorization: `Bearer ${engineerToken}` },
  });
  expect(pdfRes.status()).toBe(200);
  expect(pdfRes.headers()['content-type']).toBe('application/pdf');
  const pdfBody = await pdfRes.body();
  expect(pdfBody.length).toBeGreaterThan(1000);

  // 7. Exportar CSV
  const csvRes = await request.get(`${BASE_URL}/api/rdo/export/csv?start=2026-06-01&end=2026-06-30`, {
    headers: { Authorization: `Bearer ${engineerToken}` },
  });
  expect(csvRes.status()).toBe(200);
  expect(csvRes.headers()['content-type']).toContain('text/csv');
  const csvText = await csvRes.text();
  expect(csvText).toContain('data,obra,servico,equipe,ocorrencias,status,hash');
  expect(csvText.split('\n').length).toBeGreaterThanOrEqual(3);

  // 8. Rejeitar aprovação sem confirmação explícita
  const rejectRes = await request.patch(`${BASE_URL}/api/rdo/${rdoId}/approve`, {
    data: {
      approved_by: engineerId,
      engineer_notes: 'Tentativa sem confirmar',
      confirmed_review: false,
    },
    headers: { Authorization: `Bearer ${engineerToken}` },
  });
  expect(rejectRes.status()).toBe(400);
});
