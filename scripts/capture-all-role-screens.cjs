const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  console.log("📸 Starting Full EduSphere Role-by-Role Multi-Screen Capture...");

  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.48\\msedge.exe';
  const chromePath = fs.existsSync(edgePath)
    ? edgePath
    : 'C:\\Users\\pak\\.cache\\puppeteer\\chrome\\win64-152.0.7977.54\\chrome-win64\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // 1. PUBLIC & LOGIN SCREENS
  console.log("1️⃣ Capturing Login & Public Portal...");
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '01_login_page.png') });

  // API Login helper function
  async function apiLogin(username, password) {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(`API Login failed for ${username}`);
    const data = await res.json();
    return data;
  }

  async function setSessionAndLoad(token, user) {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate((t, u) => {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('edusphere_token', t);
      localStorage.setItem('edusphere_user', JSON.stringify(u));
    }, token, user);
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
  }

  async function clickNavAndCapture(tabText, filename) {
    const items = await page.$$('a, button, div, span');
    for (const item of items) {
      const text = await page.evaluate(el => el.textContent, item);
      if (text && text.trim().toLowerCase().includes(tabText.toLowerCase())) {
        await item.click();
        await new Promise(r => setTimeout(r, 1200));
        break;
      }
    }
    await page.screenshot({ path: path.join(outDir, filename) });
  }

  // ==========================================
  // 👑 2. PRINCIPAL / ADMIN ROLE SCREENS
  // ==========================================
  console.log("2️⃣ Capturing Admin & Principal Screens...");
  const adminAuth = await apiLogin('principal', 'admin123');
  await setSessionAndLoad(adminAuth.token, adminAuth.user);

  await page.screenshot({ path: path.join(outDir, '02_admin_dashboard.png') });
  await clickNavAndCapture('Admissions', '03_admin_admissions_desk.png');
  await clickNavAndCapture('Students', '04_admin_student_directory.png');
  await clickNavAndCapture('Teachers & Staff', '05_admin_teachers_directory.png');
  await clickNavAndCapture('Fees & Challans', '06_admin_fees_challans.png');

  // Open AI WhatsApp Notice Modal
  const noticeBtns = await page.$$('button');
  for (const b of noticeBtns) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && txt.includes('AI WhatsApp Notice')) {
      await b.click();
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(outDir, '07_admin_ai_whatsapp_modal.png') });
      // Close modal
      await page.keyboard.press('Escape');
      break;
    }
  }

  await clickNavAndCapture('Financial Mgmt', '08_admin_financial_mgmt.png');
  await clickNavAndCapture('HR & Payroll', '09_admin_hr_payroll.png');
  await clickNavAndCapture('Reports', '10_admin_reports_analytics.png');

  // ==========================================
  // 👩‍🏫 3. TEACHER ROLE SCREENS
  // ==========================================
  console.log("3️⃣ Capturing Teacher Role Screens...");
  const teacherAuth = await apiLogin('fatima', 'teacher123');
  await setSessionAndLoad(teacherAuth.token, teacherAuth.user);

  await page.screenshot({ path: path.join(outDir, '11_teacher_dashboard.png') });
  await clickNavAndCapture('Quizzes', '12_teacher_quizzes_page.png');
  await clickNavAndCapture('Class Diary', '13_teacher_class_diary.png');
  await clickNavAndCapture('Assignments', '14_teacher_assignments.png');
  await clickNavAndCapture('Take Attendance', '15_teacher_attendance.png');
  await clickNavAndCapture('Marks & Exams', '16_teacher_marks_exams.png');

  // ==========================================
  // 🎓 4. STUDENT ROLE SCREENS
  // ==========================================
  console.log("4️⃣ Capturing Student Role Screens...");
  const studentAuth = await apiLogin('areeba', 'student123');
  await setSessionAndLoad(studentAuth.token, studentAuth.user);

  await page.screenshot({ path: path.join(outDir, '17_student_dashboard_ai_radar.png') });
  await clickNavAndCapture('Quizzes', '18_student_quizzes_proctoring.png');
  await clickNavAndCapture('My Results', '19_student_my_results.png');
  await clickNavAndCapture('Fee & Challan', '20_student_fee_challans.png');

  // ==========================================
  // 👨‍👩‍👧 5. PARENT ROLE SCREENS
  // ==========================================
  console.log("5️⃣ Capturing Parent Role Screens...");
  const parentAuth = await apiLogin('parent', 'parent123');
  await setSessionAndLoad(parentAuth.token, parentAuth.user);

  await page.screenshot({ path: path.join(outDir, '21_parent_portal.png') });

  await browser.close();
  console.log("🎉 SUCCESS: 21 Screenshots for ALL ROLES & ALL SCREENS captured into /screenshots folder!");
})();
