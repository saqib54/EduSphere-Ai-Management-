const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.48\\msedge.exe';
  const chromePath = fs.existsSync(edgePath) ? edgePath : 'C:\\Users\\pak\\.cache\\puppeteer\\chrome\\win64-152.0.7977.54\\chrome-win64\\chrome.exe';

  console.log("🚀 Using browser binary:", chromePath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. LOGIN SCREEN
  console.log("📸 1/7: Capturing Login Page...");
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '01_login_page.png') });

  // Helper login function
  async function loginAndCapture(user, pass, filename, name) {
    console.log(`📸 Capturing ${name}...`);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
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
    await page.screenshot({ path: path.join(outDir, filename) });
  }

  // 2. PRINCIPAL ROLE
  await loginAndCapture('principal', 'admin123', '02_principal_dashboard.png', 'Principal / Admin Dashboard');

  // 3. TEACHER ROLE
  await loginAndCapture('fatima', 'teacher123', '03_teacher_dashboard.png', 'Teacher Dashboard & Quiz Tools');

  // 4. STUDENT ROLE
  await loginAndCapture('areeba', 'student123', '04_student_dashboard.png', 'Student Dashboard & AI Performance Radar');

  // 5. PARENT ROLE
  await loginAndCapture('parent', 'parent123', '05_parent_portal.png', 'Parent Portal & Child Overview');

  await browser.close();
  console.log("✅ ALL SCREENSHOTS SUCCESSFULLY CAPTURED IN screenshots/ FOLDER!");
})();
