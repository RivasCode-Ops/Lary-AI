const BASE_URL = process.argv[2] || 'http://localhost:3001';

async function test() {
  console.log('Testing LARY AI at: ' + BASE_URL + '\n');
  let passed = 0, failed = 0;
  function check(name, ok, detail) {
    const status = ok ? 'PASS' : 'FAIL';
    console.log(status + ' ' + name + (detail ? ': ' + detail : ''));
    ok ? passed++ : failed++;
  }

  try {
    const r = await fetch(BASE_URL + '/health');
    const d = await r.json();
    check('Health check', r.status === 200, String(r.status));
  } catch (e) { check('Health check', false, e.message); }

  try {
    const r = await fetch(BASE_URL);
    const d = await r.json();
    check('Root route', r.status === 200, d.service || d.message || 'ok');
  } catch (e) { check('Root route', false, e.message); }

  let masterToken, workId;
  try {
    const r = await fetch(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'mestre@obra.com', password: '123456' })
    });
    const d = await r.json();
    masterToken = d.token;
    check('Login mestre', r.status === 200 && !!d.token, d.user ? d.user.name_user : '');
  } catch (e) { check('Login mestre', false, e.message); }

  if (masterToken) {
    try {
      const r = await fetch(BASE_URL + '/api/auth/me', {
        headers: { Authorization: 'Bearer ' + masterToken }
      });
      const d = await r.json();
      workId = d.user ? d.user.id_work_allocated : null;
      check('Get work', !!workId, workId ? workId.substring(0, 8) + '...' : 'not found');
    } catch (e) { check('Get work', false, e.message); }
  }

  let rdoId;
  if (masterToken && workId) {
    try {
      const r = await fetch(BASE_URL + '/api/rdo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + masterToken },
        body: JSON.stringify({ id_work: workId, rdo_date: '2026-06-13', service: 'Test auto', team: '2', content: 'Test deployment', shift: 'diurno' })
      });
      const d = await r.json();
      rdoId = d.id_rdo;
      check('Create RDO', r.status === 201 && d.status === 'pending', '#' + d.rdo_number);
    } catch (e) { check('Create RDO', false, e.message); }
  }

  let engineerToken, engineerId;
  try {
    const r = await fetch(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'engenheiro@obra.com', password: '123456' })
    });
    const d = await r.json();
    engineerToken = d.token;
    engineerId = d.user ? d.user.id_user : null;
    check('Login engineer', r.status === 200 && !!d.token, d.user ? d.user.name_user : '');
  } catch (e) { check('Login engineer', false, e.message); }

  if (engineerToken && rdoId && engineerId) {
    try {
      const r = await fetch(BASE_URL + '/api/rdo/' + rdoId + '/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + engineerToken },
        body: JSON.stringify({ approved_by: engineerId, confirmed_review: true, engineer_notes: 'Post-deploy test' })
      });
      const d = await r.json();
      check('Approve RDO', r.status === 200 && d.status === 'approved', d.hash_sha256 ? d.hash_sha256.substring(0, 12) + '...' : '');
    } catch (e) { check('Approve RDO', false, e.message); }
  }

  if (engineerToken && rdoId) {
    try {
      const r = await fetch(BASE_URL + '/api/rdo/' + rdoId + '/pdf', {
        headers: { Authorization: 'Bearer ' + engineerToken }
      });
      const blob = await r.blob();
      check('Generate PDF', r.status === 200 && blob.size > 1000, (blob.size / 1024).toFixed(1) + ' KB');
    } catch (e) { check('Generate PDF', false, e.message); }
  }

  if (engineerToken) {
    try {
      const r = await fetch(BASE_URL + '/api/rdo/export/csv?start=2026-06-01&end=2026-06-30', {
        headers: { Authorization: 'Bearer ' + engineerToken }
      });
      const text = await r.text();
      check('Export CSV', r.status === 200 && text.includes('data,obra'), text.split('\n').length + ' lines');
    } catch (e) { check('Export CSV', false, e.message); }
  }

  console.log('\nResult: ' + passed + ' passed, ' + failed + ' failed of ' + (passed + failed) + ' tests\n');
  process.exit(failed > 0 ? 1 : 0);
}

test();
