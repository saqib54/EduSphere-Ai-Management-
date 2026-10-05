const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  console.log("🧹 Cleaning up old screenshots...");

  const outDir = path.join(__dirname, '..', 'screenshots');
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.48\\msedge.exe';
  const chromePath = fs.existsSync(edgePath)
    ? edgePath
    : 'C:\\Users\\pak\\.cache\\puppeteer\\chrome\\win64-152.0.7977.54\\chrome-win64\\chrome.exe';

  console.log("🚀 Launching Headless Edge / Chrome...");

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // 1. PUBLIC LANDING PORTAL
  console.log("📸 1. Capturing Public School Portal...");
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3200));
  await page.screenshot({ path: path.join(outDir, '01_public_landing_portal.png') });

  // 2. LOGIN SCREEN WITH 1-CLICK DEMO CHIPS
  console.log("📸 2. Capturing Login Screen...");
  const loginBtns = await page.$$('button, a');
  for (const b of loginBtns) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && (txt.includes('Portal Login') || txt.includes('Login'))) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '02_login_screen.png') });

  // Helper login function via UI chip or form submit
  async function loginAsRole(roleName, username, password) {
    console.log(`🔐 Logging in as ${roleName}...`);
    // Clear session & reload login page
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    // Open login modal / view if on portal
    const btns = await page.$$('button, a');
    for (const b of btns) {
      const txt = await page.evaluate(el => el.textContent, b);
      if (txt && (txt.includes('Portal Login') || txt.includes('Login'))) {
        await b.click();
        await new Promise(r => setTimeout(r, 800));
        break;
      }
    }

    // Type credentials & submit
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type(username);
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type(password);
    }
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();

    // WAIT 3.5 SECONDS FOR SPLASH SCREEN TO FADE OUT COMPLETELY!
    await new Promise(r => setTimeout(r, 3600));
  }

  async function clickSidebarAndCapture(itemText, filename) {
    const navButtons = await page.$$('aside nav button, aside button, .sidebar button');
    let clicked = false;
    for (const btn of navButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes(itemText.toLowerCase())) {
        await btn.click();
        clicked = true;
        await new Promise(r => setTimeout(r, 1500));
        break;
      }
    }
    if (!clicked) {
      // fallback search in document
      const allBtns = await page.$$('button, a');
      for (const btn of allBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.toLowerCase().includes(itemText.toLowerCase())) {
          await btn.click();
          await new Promise(r => setTimeout(r, 1500));
          break;
        }
      }
    }
    await page.screenshot({ path: path.join(outDir, filename) });
  }

  // ==========================================
  // 👑 3. PRINCIPAL / ADMIN ROLE
  // ==========================================
  await loginAsRole('Principal', 'principal', 'admin123');
  console.log("📸 Capturing 03_principal_dashboard.png...");
  await page.screenshot({ path: path.join(outDir, '03_principal_dashboard.png') });

  console.log("📸 Capturing 04_principal_admissions_desk.png...");
  await clickSidebarAndCapture('Admissions', '04_principal_admissions_desk.png');

  console.log("📸 Capturing 05_principal_student_directory.png...");
  await clickSidebarAndCapture('Students', '05_principal_student_directory.png');

  console.log("📸 Capturing 06_principal_fees_challans.png...");
  await clickSidebarAndCapture('Fees & Challans', '06_principal_fees_challans.png');

  // Open AI WhatsApp Notice Modal
  const actionBtns = await page.$$('button');
  for (const b of actionBtns) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && txt.includes('AI WhatsApp Notice')) {
      await b.click();
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(outDir, '07_principal_ai_whatsapp_notice_modal.png') });
      await page.keyboard.press('Escape');
      break;
    }
  }

  console.log("📸 Capturing 08_principal_hr_payroll.png...");
  await clickSidebarAndCapture('HR & Payroll', '08_principal_hr_payroll.png');

  console.log("📸 Capturing 09_principal_reports.png...");
  await clickSidebarAndCapture('Reports', '09_principal_reports.png');

  // ==========================================
  // 👩‍🏫 4. TEACHER ROLE
  // ==========================================
  await loginAsRole('Teacher', 'fatima', 'teacher123');
  console.log("📸 Capturing 10_teacher_dashboard.png...");
  await page.screenshot({ path: path.join(outDir, '10_teacher_dashboard.png') });

  console.log("📸 Capturing 11_teacher_quizzes.png...");
  await clickSidebarAndCapture('Quizzes', '11_teacher_quizzes.png');

  console.log("📸 Capturing 12_teacher_class_diary.png...");
  await clickSidebarAndCapture('Class Diary', '12_teacher_class_diary.png');

  console.log("📸 Capturing 13_teacher_attendance.png...");
  await clickSidebarAndCapture('Attendance', '13_teacher_attendance.png');

  // ==========================================
  // 🎓 5. STUDENT ROLE
  // ==========================================
  await loginAsRole('Student', 'areeba', 'student123');
  console.log("📸 Capturing 14_student_dashboard_ai_radar.png...");
  await page.screenshot({ path: path.join(outDir, '14_student_dashboard_ai_radar.png') });

  console.log("📸 Capturing 15_student_active_quizzes.png...");
  await clickSidebarAndCapture('Quizzes', '15_student_active_quizzes.png');

  console.log("📸 Capturing 16_student_exam_results.png...");
  await clickSidebarAndCapture('My Results', '16_student_exam_results.png');

  console.log("📸 Capturing 17_student_fee_challan.png...");
  await clickSidebarAndCapture('Fee & Challan', '17_student_fee_challan.png');

  // ==========================================
  // 👨‍👩‍👧 6. PARENT ROLE
  // ==========================================
  await loginAsRole('Parent', 'parent', 'parent123');
  console.log("📸 Capturing 18_parent_portal.png...");
  await page.screenshot({ path: path.join(outDir, '18_parent_portal.png') });

  await browser.close();
  console.log("🎉 ALL SCREENSHOTS REBUILT SUCCESSFULLY!");
})();
