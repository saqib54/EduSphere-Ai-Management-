const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  console.log("📸 Launching Headless Chrome to capture screenshots of EduSphere...");

  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const chromePath = 'C:\\Users\\pak\\.cache\\puppeteer\\chrome\\win64-152.0.7977.54\\chrome-win64\\chrome.exe';

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // 1. LOGIN PAGE SCREENSHOT
  console.log("1. Capturing Login Page...");
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '01_login_page.png') });

  // Helper login function
  async function loginAs(user, pass) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1000));

    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type(user);
      await inputs[1].click({ clickCount: 3 });
      await inputs[1].type(pass);
    }
    const btn = await page.$('button[type="submit"]');
    if (btn) await btn.click();
    await new Promise(r => setTimeout(r, 2000));
  }

  // 2. PRINCIPAL / ADMIN DASHBOARD
  console.log("2. Capturing Principal Dashboard...");
  await loginAs('principal', 'admin123');
  await page.screenshot({ path: path.join(outDir, '02_principal_dashboard.png') });

  // 3. PRINCIPAL - FEES & AI WHATSAPP NOTICE
  console.log("3. Capturing Fees Page...");
  const feeNav = await page.$('a[href="/fees"], button');
  const allBtns = await page.$$('button, a, span');
  for (const b of allBtns) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && txt.includes('Fees & Challans')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '03_principal_fees_page.png') });

  // Click AI WhatsApp Notice button
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && txt.includes('AI WhatsApp Notice')) {
      await b.click();
      await new Promise(r => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(outDir, '04_ai_whatsapp_notice_modal.png') });
      break;
    }
  }

  // 4. ONLINE ADMISSIONS PAGE
  console.log("4. Capturing Admissions System...");
  const navItems = await page.$$('button, a, span');
  for (const b of navItems) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && txt.includes('Admissions')) {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '05_admissions_management.png') });

  // 5. TEACHER DASHBOARD
  console.log("5. Capturing Teacher Dashboard...");
  await loginAs('fatima', 'teacher123');
  await page.screenshot({ path: path.join(outDir, '06_teacher_dashboard.png') });

  // 6. STUDENT DASHBOARD & AI PERFORMANCE PREDICTOR
  console.log("6. Capturing Student Dashboard...");
  await loginAs('areeba', 'student123');
  await page.screenshot({ path: path.join(outDir, '07_student_dashboard_ai_radar.png') });

  // 7. PARENT PORTAL
  console.log("7. Capturing Parent Portal...");
  await loginAs('parent', 'parent123');
  await page.screenshot({ path: path.join(outDir, '08_parent_portal.png') });

  await browser.close();
  console.log("🎉 SUCCESS: All 8 screenshots captured into /screenshots folder!");
})();
