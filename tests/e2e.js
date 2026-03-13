#!/usr/bin/env node

/**
 * End-to-End tests for Vaavascanvas
 * Tests actual browser behavior, image loading, modals, and console errors
 */

const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  error: (msg) => console.error(`${colors.red}✗ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`)
};

let errorCount = 0;
let testCount = 0;

function test(name, fn) {
  testCount++;
  return fn()
    .then(() => {
      log.success(name);
    })
    .catch(err => {
      log.error(`${name}\n  ${err.message}`);
      errorCount++;
    });
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Start HTTP server
function startServer() {
  return new Promise((resolve, reject) => {
    const projectRoot = path.join(__dirname, '..');
    const server = spawn('npx', ['http-server', projectRoot, '-p', '8888', '-s'], {
      stdio: 'pipe',
      shell: true
    });

    let started = false;

    server.stdout.on('data', (data) => {
      if (!started && data.toString().includes('Hit CTRL-C')) {
        started = true;
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      if (!started) {
        reject(new Error(`Server error: ${data.toString()}`));
      }
    });

    // Fallback: resolve after 2 seconds
    setTimeout(() => {
      if (!started) resolve(server);
    }, 2000);
  });
}

// Load paintings data for testing
function loadPaintings() {
  const paintingsPath = path.join(__dirname, '../js/paintings.js');
  const content = fs.readFileSync(paintingsPath, 'utf8');

  const statusMatch = content.match(/const STATUS = \{([^}]+)\}/s);
  const statuses = {};
  if (statusMatch) {
    const statusStr = statusMatch[1];
    statusStr.match(/(\w+):\s*"([^"]+)"/g)?.forEach(str => {
      const [key, val] = str.match(/(\w+):\s*"([^"]+)"/).slice(1);
      statuses[key] = val;
    });
  }

  const paintingsMatch = content.match(/const paintings = \[([\s\S]+?)\];/);
  let paintingsStr = `[${paintingsMatch[1]}]`;
  paintingsStr = paintingsStr.replace(/STATUS\.(\w+)/g, (match, key) => `"${statuses[key]}"`);
  paintingsStr = paintingsStr.replace(/(\{|,)\s*(\w+):/g, '$1"$2":');
  paintingsStr = paintingsStr.replace(/,(\s*[}\]])/g, '$1');

  const paintings = JSON.parse(paintingsStr);
  return paintings;
}

async function runTests() {
  console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.blue + 'VAAVASCANVAS END-TO-END TESTS' + colors.reset);
  console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');

  let browser;
  let server;

  try {
    // Start server
    log.info('Starting HTTP server on port 8888...');
    server = await startServer();

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Launch browser
    log.info('Launching headless browser...\n');
    browser = await chromium.launch();

    const paintings = loadPaintings();

    console.log(colors.blue + '[1] MAIN PAGE TESTS' + colors.reset);

    // Test 1: Main page loads without errors
    await test('Main page loads without console errors', async () => {
      const page = await browser.newPage();
      const consoleErrors = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      const response = await page.goto('http://localhost:8888/', { waitUntil: 'networkidle' });
      assert(response.ok(), `Page load failed with status ${response.status()}`);
      assert(consoleErrors.length === 0, `Console errors found: ${consoleErrors.join(', ')}`);

      await page.close();
    });

    // Test 2: Hero section is visible
    await test('Hero section is rendered', async () => {
      const page = await browser.newPage();
      await page.goto('http://localhost:8888/', { waitUntil: 'networkidle' });

      const heroTitle = await page.locator('[data-i18n="hero_title"]').isVisible();
      assert(heroTitle, 'Hero title not visible');

      await page.close();
    });

    // Test 3: Featured cards render on main page
    await test('Featured cards render on main page', async () => {
      const page = await browser.newPage();
      await page.goto('http://localhost:8888/', { waitUntil: 'networkidle' });

      // Wait for featured cards to load
      await page.waitForSelector('.featured-card', { timeout: 10000 });

      const featuredCards = await page.locator('.featured-card').count();
      assertEqual(featuredCards, 3, `Expected 3 featured cards`);

      await page.close();
    });

    // Test 4: Featured images load without errors
    await test('Featured images load successfully', async () => {
      const page = await browser.newPage();
      const failedImages = [];

      page.on('response', (response) => {
        if (response.url().includes('/images/paintings/') && !response.ok()) {
          failedImages.push(`${response.url()} (${response.status()})`);
        }
      });

      await page.goto('http://localhost:8888/', { waitUntil: 'networkidle' });
      await page.waitForSelector('.featured-card img', { timeout: 10000 });

      // Give images time to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      assert(failedImages.length === 0,
        `Failed to load images: ${failedImages.join(', ')}`);

      await page.close();
    });

    console.log(colors.blue + '\n[2] GALLERY & MODAL TESTS (Paintings Page)' + colors.reset);

    // Test 5: Full gallery renders on paintings page
    await test(`Gallery renders all ${paintings.length} paintings`, async () => {
      const page = await browser.newPage();
      await page.goto('http://localhost:8888/pages/pictures.html', { waitUntil: 'networkidle' });

      // Wait for gallery to load
      await page.waitForSelector('.gallery-item', { timeout: 10000 });

      const galleryItems = await page.locator('.gallery-item').count();
      assertEqual(galleryItems, paintings.length, `Gallery item count mismatch`);

      await page.close();
    });

    // Test 6: Modal opens for first painting
    await test('Modal opens when clicking first painting', async () => {
      const page = await browser.newPage();
      await page.goto('http://localhost:8888/pages/pictures.html', { waitUntil: 'networkidle' });

      await page.waitForSelector('.gallery-item img', { timeout: 10000 });
      await page.locator('.gallery-item').first().click();

      const modal = page.locator('.modal');
      const isVisible = await modal.isVisible({ timeout: 5000 });
      assert(isVisible, 'Modal did not open');

      await page.close();
    });

    // Test 7: Modal images load without errors
    await test('Modal images load without 404 errors', async () => {
      const page = await browser.newPage();
      const failedImages = [];

      page.on('response', (response) => {
        if (response.url().includes('/images/paintings/') && !response.ok()) {
          failedImages.push(response.url());
        }
      });

      await page.goto('http://localhost:8888/pages/pictures.html', { waitUntil: 'networkidle' });
      await page.waitForSelector('.gallery-item img', { timeout: 10000 });

      // Open first painting modal
      await page.locator('.gallery-item').first().click();
      await page.waitForSelector('.modal', { timeout: 5000 });

      // Give modal images time to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      assert(failedImages.length === 0,
        `Modal images failed to load: ${failedImages.join(', ')}`);

      await page.close();
    });

    // Test 8: Modal closes when clicking close button
    await test('Modal closes properly', async () => {
      const page = await browser.newPage();
      await page.goto('http://localhost:8888/pages/pictures.html', { waitUntil: 'networkidle' });

      await page.waitForSelector('.gallery-item img', { timeout: 10000 });
      await page.locator('.gallery-item').first().click();
      await page.waitForSelector('.modal', { timeout: 5000 });

      const closeBtn = page.locator('.close');
      const hasCloseBtn = await closeBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasCloseBtn) {
        await closeBtn.click();
        const modalVisible = await page.locator('.modal').isVisible({ timeout: 2000 }).catch(() => false);
        assert(!modalVisible, 'Modal did not close');
      }

      await page.close();
    });

    console.log(colors.blue + '\n[3] LANGUAGE SWITCHING TESTS' + colors.reset);

    // Test 9: Language switching works
    await test('Language switching to English works', async () => {
      const page = await browser.newPage();
      await page.goto('http://localhost:8888/', { waitUntil: 'networkidle' });

      // Find and click English language button
      const langBtn = page.locator('[data-lang="en"]').first();
      const hasBtnVisible = await langBtn.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasBtnVisible) {
        await langBtn.click();

        // Give time for language to update
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if lang attribute changed
        const htmlLang = await page.evaluate(() => document.documentElement.lang);
        assertEqual(htmlLang, 'en', 'Language did not switch to English');
      }

      await page.close();
    });

    console.log(colors.blue + '\n[4] FORM TESTS' + colors.reset);

    // Test 10: Contact form exists
    await test('Contact form is present', async () => {
      const page = await browser.newPage();
      await page.goto('http://localhost:8888/', { waitUntil: 'networkidle' });

      // Scroll to form
      await page.evaluate(() => {
        const form = document.getElementById('footerForm');
        if (form) form.scrollIntoView();
      });

      const form = page.locator('#footerForm');
      const isVisible = await form.isVisible({ timeout: 5000 }).catch(() => false);
      assert(isVisible, 'Contact form not found');

      await page.close();
    });


    console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
    console.log(colors.blue + 'E2E TEST RESULTS' + colors.reset);
    console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
    console.log(`\nTotal tests: ${testCount}`);
    console.log(`${colors.green}Passed: ${testCount - errorCount}${colors.reset}`);

    if (errorCount > 0) {
      console.log(`${colors.red}Failed: ${errorCount}${colors.reset}\n`);
    } else {
      console.log(`${colors.green}Failed: 0${colors.reset}`);
      console.log(`\n${colors.green}✓ All E2E tests passed!${colors.reset}\n`);
    }

  } catch (err) {
    log.error(`Fatal error: ${err.message}`);
    errorCount++;
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.kill();
    }

    process.exit(errorCount > 0 ? 1 : 0);
  }
}

runTests().catch(err => {
  log.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
