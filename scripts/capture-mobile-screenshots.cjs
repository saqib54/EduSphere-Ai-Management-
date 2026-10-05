const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const outDir = path.join(__dirname, '..', 'screenshots');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\EdgeCore\\154.0.4258.48\\msedge.exe';
  const chromePath = fs.existsSync(edgePath)
    ? edgePath
    : 'C:\\Users\\pak\\.cache\\puppeteer\\chrome\\win64-152.0.7977.54\\chrome-win64\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'shell',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=430,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  console.log("📱 Capturing Mobile Parent Portal...");
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 800));

  const btns = await page.$$('button, a');
  for (const b of btns) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && (txt.includes('Portal Login') || txt.includes('Login'))) {
      await b.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }

  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].click({ clickCount: 3 });
    await inputs[0].type('parent');
    await inputs[1].click({ clickCount: 3 });
    await inputs[1].type('parent123');
  }
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) await submitBtn.click();

  await new Promise(r => setTimeout(r, 3600));
  await page.screenshot({ path: path.join(outDir, 'mobile_06_parent_portal.png') });

  await browser.close();
  console.log("✅ Mobile Parent Portal Captured!");
})();
