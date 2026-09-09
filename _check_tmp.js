const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ROOT = 'd:/GitHub/vaavascanvas';
const OUT = 'C:/Users/joel_/AppData/Local/Temp/claude/d--GitHub-vaavascanvas/4de007d9-b52f-4f9c-b969-aeb7481fa479/scratchpad';
const PORT = 8099;

(async () => {
  const server = spawn('npx', ['http-server', ROOT, '-p', String(PORT), '-c-1', '--silent'], {
    cwd: ROOT, shell: true, stdio: 'ignore',
  });
  await new Promise(r => setTimeout(r, 3500));

  const base = `http://127.0.0.1:${PORT}`;
  const browser = await chromium.launch();
  const errors = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(`${base}/pictures/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const slug = await page.evaluate(() => {
      localStorage.removeItem('vc_cart');
      const c = paintings.find(p => p.type === 'clay' && p.status === 'for_sale');
      return paintingPageUrl(c);
    });

    // Add the same clay piece twice from its own page
    await page.goto(`${base}${slug}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.click('.pageview-buy-btn');
    await page.waitForTimeout(700);
    const afterFirst = await page.evaluate(() => ({
      cart: JSON.parse(localStorage.getItem('vc_cart') || '[]').map(i => ({ id: i.id, qty: i.qty })),
      qtyControls: document.querySelectorAll('.cart-item-qty').length,
      buyLabel: document.querySelector('.pageview-buy-btn')?.textContent.trim(),
    }));
    console.log('after first add:', JSON.stringify(afterFirst));

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await page.click('.pageview-buy-btn');
    await page.waitForTimeout(700);
    const afterSecond = await page.evaluate(() => ({
      cart: JSON.parse(localStorage.getItem('vc_cart') || '[]').map(i => ({ id: i.id, qty: i.qty })),
      qtyControls: document.querySelectorAll('.cart-item-qty').length,
      toast: document.getElementById('vc-toast')?.textContent,
    }));
    console.log('after second add:', JSON.stringify(afterSecond));
    await page.screenshot({ path: path.join(OUT, 'clay-twice.png') });

    console.log('console errors:', errors.length ? errors : 'none');
  } catch (e) {
    console.log('FAILED:', e.message);
  } finally {
    await browser.close();
    server.kill();
    process.exit(0);
  }
})();
