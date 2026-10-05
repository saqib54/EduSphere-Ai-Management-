const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Full API Route Audit...\n');

  // Test Logins
  const roles = [
    { name: 'Principal', user: 'principal', pass: 'admin123' },
    { name: 'Teacher', user: 'fatima', pass: 'teacher123' },
    { name: 'Student', user: 'areeba', pass: 'student123' },
    { name: 'Parent', user: 'parent', pass: 'parent123' },
  ];

  const tokens = {};
  for (const r of roles) {
    const res = await request('/auth/login', 'POST', { username: r.user, password: r.pass });
    if (res.status === 200 && res.data.token) {
      tokens[r.name] = { token: res.data.token, user: res.data.user };
      console.log(`✅ Login Success: ${r.name} (${r.user})`);
    } else {
      console.error(`❌ Login Failed: ${r.name} (${r.user}) - status ${res.status}`, res.data);
    }
  }

  console.log('\n--- Testing Endpoints for Principal ---');
  const adminToken = tokens['Principal']?.token;

  const endpointsToTest = [
    '/reports/dashboard',
    '/reports/attendance-trend',
    '/reports/grades',
    '/reports/notifications',
    '/academics',
    '/classes',
    '/classes/subjects',
    '/teachers',
    '/students',
    '/attendance?class_id=1&date=2026-09-14',
    '/attendance/summary?class_id=1&month=September&year=2026',
    '/assignments',
    '/exams',
    '/fees/structures',
    '/fees/challans',
    '/fees/summary',
    '/financials/dashboard?year=2026',
    '/financials/expenses',
    '/financials/salaries',
    '/timetable?class_id=1',
    '/materials',
    '/announcements',
    '/settings',
    '/settings/users',
    '/diary',
    '/quizzes',
    '/operations/admissions',
    '/operations/library/books',
    '/operations/library/issues',
    '/operations/transport/routes',
    '/operations/hr/leaves',
    '/operations/hr/payroll',
    '/operations/inventory',
    '/operations/discipline',
    '/operations/events',
    '/operations/audit-logs',
  ];

  let passed = 0;
  let failed = 0;

  for (const path of endpointsToTest) {
    const res = await request(path, 'GET', null, adminToken);
    if (res.status >= 200 && res.status < 300) {
      console.log(`  ✅ GET ${path} -> ${res.status}`);
      passed++;
    } else {
      console.log(`  ❌ GET ${path} -> ${res.status}`, res.data);
      failed++;
    }
  }

  console.log(`\n--- Teacher Endpoints ---`);
  const teacherToken = tokens['Teacher']?.token;
  const teacherId = tokens['Teacher']?.user?.ref_id || '1';
  const tRes = await request(`/reports/teacher-dashboard?teacher_id=${teacherId}`, 'GET', null, teacherToken);
  console.log(`  ${tRes.status === 200 ? '✅' : '❌'} GET /reports/teacher-dashboard -> ${tRes.status}`);

  console.log(`\n--- Student Endpoints ---`);
  const studentToken = tokens['Student']?.token;
  const studentId = tokens['Student']?.user?.ref_id || '1';
  const sRes = await request(`/reports/student-dashboard?student_id=${studentId}`, 'GET', null, studentToken);
  console.log(`  ${sRes.status === 200 ? '✅' : '❌'} GET /reports/student-dashboard -> ${sRes.status}`);
  const sAtt = await request(`/attendance/my?student_id=${studentId}&month=September&year=2026`, 'GET', null, studentToken);
  console.log(`  ${sAtt.status === 200 ? '✅' : '❌'} GET /attendance/my -> ${sAtt.status}`);
  const sEx = await request(`/exams/my-results?student_id=${studentId}`, 'GET', null, studentToken);
  console.log(`  ${sEx.status === 200 ? '✅' : '❌'} GET /exams/my-results -> ${sEx.status}`);

  console.log(`\n--- Parent Endpoints ---`);
  const parentToken = tokens['Parent']?.token;
  const parentId = tokens['Parent']?.user?.id || '12';
  const pRes = await request(`/operations/parents/${parentId}/children`, 'GET', null, parentToken);
  console.log(`  ${pRes.status === 200 ? '✅' : '❌'} GET /operations/parents/children -> ${pRes.status}`);

  console.log(`\n📊 API Audit Summary: ${passed} Passed, ${failed} Failed.`);
}

runTests().catch(console.error);
