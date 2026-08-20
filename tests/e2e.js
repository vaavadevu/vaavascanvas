#!/usr/bin/env node

/**
 * End-to-End tests for Vaavascanvas
 * Tests actual browser behavior, image loading, page views, and console errors
 */

const { chromium } = require('playwright');
const httpServer = require('http-server');
const path = require('path');
const fs = require('fs');

// Each work has a page of its own under /pictures/. Build the address the same way
// the site does, so a change to the URL scheme moves the tests with it.
const { paintingPageUrl, SHOP_URL } = require('../js/paintings.js');

// http-server's `union` dependency reads the long-deprecated res._headers on
// every response (DEP0066). It only affects the dev server that hosts these
// tests, never the deployed site, so drop that one warning — anything else,
// including deprecations in our own code, still gets through.
const emitWarning = process.emitWarning.bind(process);
process.emitWarning = (warning, ...args) => {
  const code = warning?.code
    || args.find(arg => arg && typeof arg === 'object' && arg.code)?.code
    || args.find(arg => typeof arg === 'string' && /^DEP\d+$/.test(arg));
  if (code === 'DEP0066') return;
  emitWarning(warning, ...args);
};

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

// Start an in-process static server — running it inside this process (rather
// than spawning `npx http-server` through a shell) means it always dies with
// the test run instead of surviving as an orphan that blocks the next one.
function startServer() {
  return new Promise((resolve, reject) => {
    const maxRetries = 3;
    const basePort = 8888;
    const projectRoot = path.join(__dirname, '..');

    function attemptStart(port, retries) {
      const server = httpServer.createServer({ root: projectRoot, cache: -1, silent: true });

      const onError = (err) => {
        if (err.code === 'EADDRINUSE') {
          if (retries < maxRetries) {
            log.warn(`Port ${port} in use, retrying on port ${port + 1}...`);
            attemptStart(port + 1, retries + 1);
          } else {
            reject(new Error(`Could not find available port after ${maxRetries} retries`));
          }
          return;
        }
        reject(new Error(`Server error: ${err.message}`));
      };

      server.server.once('error', onError);
      server.listen(port, '127.0.0.1', () => {
        server.server.removeListener('error', onError);
        resolve({ server, port });
      });
    }

    attemptStart(basePort, 0);
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

  const shapeMatch = content.match(/const SHAPE = \{([^}]+)\}/s);
  const shapes = {};
  if (shapeMatch) {
    const shapeStr = shapeMatch[1];
    shapeStr.match(/(\w+):\s*"([^"]+)"/g)?.forEach(str => {
      const [key, val] = str.match(/(\w+):\s*"([^"]+)"/).slice(1);
      shapes[key] = val;
    });
  }

  const mediumMatch = content.match(/const MEDIUM = \{([^}]+)\}/s);
  const mediums = {};
  if (mediumMatch) {
    const mediumStr = mediumMatch[1];
    mediumStr.match(/(\w+):\s*"([^"]+)"/g)?.forEach(str => {
      const [key, val] = str.match(/(\w+):\s*"([^"]+)"/).slice(1);
      mediums[key] = val;
    });
  }

  const typeMatch = content.match(/const TYPE = \{([^}]+)\}/s);
  const types = {};
  if (typeMatch) {
    const typeStr = typeMatch[1];
    typeStr.match(/(\w+):\s*"([^"]+)"/g)?.forEach(str => {
      const [key, val] = str.match(/(\w+):\s*"([^"]+)"/).slice(1);
      types[key] = val;
    });
  }

  const paintingsMatch = content.match(/const paintings = \[([\s\S]+?)\];/);
  let paintingsStr = `[${paintingsMatch[1]}]`;
  paintingsStr = paintingsStr.replace(/STATUS\.(\w+)/g, (match, key) => `"${statuses[key]}"`);
  paintingsStr = paintingsStr.replace(/SHAPE\.(\w+)/g, (match, key) => `"${shapes[key]}"`);
  paintingsStr = paintingsStr.replace(/MEDIUM\.(\w+)/g, (match, key) => `"${mediums[key]}"`);
  paintingsStr = paintingsStr.replace(/TYPE\.(\w+)/g, (match, key) => `"${types[key]}"`);
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
    const serverInfo = await startServer();
    server = serverInfo.server;
    const port = serverInfo.port;

    log.info(`Serving the site on port ${port}...`);

    // Launch browser
    log.info('Launching headless browser...\n');
    browser = await chromium.launch();

    const paintings = loadPaintings();
    const baseUrl = `http://localhost:${port}`;

    console.log(colors.blue + '[1] PAGE HEALTH TESTS (all pages)' + colors.reset);

    // Test 1: Every page loads without console errors and has a header
    const allPages = [
      { label: 'Main page',        url: `${baseUrl}/` },
      { label: 'Gallery page',     url: `${baseUrl}${SHOP_URL}` },
      { label: 'View page',        url: `${baseUrl}${paintingPageUrl(paintings[0])}` },
      { label: 'Commissions page', url: `${baseUrl}/pages/commissions.html` },
    ];

    for (const { label, url } of allPages) {
      await test(`${label} loads without console errors`, async () => {
        const page = await browser.newPage();
        const consoleErrors = [];
        const failedRequests = [];

        page.on('console', (msg) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        // Chromium's console text for a failed request omits the URL, so track
        // responses separately — otherwise a 404 reports as an unhelpful
        // "Failed to load resource" with no clue which file is missing
        page.on('response', (res) => {
          if (!res.ok()) failedRequests.push(`${res.status()} ${res.url()}`);
        });
        page.on('requestfailed', (req) => {
          failedRequests.push(`${req.failure()?.errorText || 'failed'} ${req.url()}`);
        });

        const response = await page.goto(url, { waitUntil: 'networkidle' });
        assert(response.ok(), `Page load failed with status ${response.status()}`);
        assert(consoleErrors.length === 0,
          `Console errors: ${consoleErrors.join(', ')}` +
          (failedRequests.length ? `\n  Failed requests: ${failedRequests.join(', ')}` : ''));
        assert(failedRequests.length === 0, `Failed requests: ${failedRequests.join(', ')}`);

        await page.close();
      });

      await test(`${label} header is loaded`, async () => {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle' });

        const headerContent = await page.locator('#header-container').innerHTML();
        assert(headerContent.trim().length > 0, 'Header container is empty — component failed to load');

        await page.close();
      });
    }

    console.log(colors.blue + '\n[2] MAIN PAGE TESTS' + colors.reset);

    // Test: Featured cards render on main page
    await test('Featured cards render on main page', async () => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

      // Wait for featured cards to load
      await page.waitForSelector('.featured-card', { timeout: 10000 });

      const featuredCards = await page.locator('.featured-card').count();
      assert(featuredCards >= 1, `Expected at least 1 featured card, got ${featuredCards}`);

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

      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.featured-card img', { timeout: 10000 });

      // Give images time to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      assert(failedImages.length === 0,
        `Failed to load images: ${failedImages.join(', ')}`);

      await page.close();
    });

    console.log(colors.blue + '\n[3] GALLERY & MODAL TESTS (Paintings Page)' + colors.reset);

    // Test 5: Full gallery renders on paintings page
    await test(`Gallery renders all ${paintings.length} paintings`, async () => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}${SHOP_URL}`, { waitUntil: 'networkidle' });

      // Wait for gallery to load
      await page.waitForSelector('.gallery-item', { timeout: 10000 });

      const galleryItems = await page.locator('.gallery-item').count();
      assertEqual(galleryItems, paintings.length, `Gallery item count mismatch`);

      await page.close();
    });

    // Test 5b: The masonry grid places tiles across the columns, not down them
    //
    // CSS multi-column, which this grid used to be, fills each column top to
    // bottom before starting the next — so with "lowest price first" the tile
    // beside the cheapest painting was the middle of the run. layoutGallery()
    // deals the tiles out instead, and this checks the result at both a
    // two-column and a four-column width.
    for (const { label, width } of [{ label: 'two columns', width: 390 }, { label: 'four columns', width: 1280 }]) {
      await test(`Sorted tiles read across the grid, not down it (${label})`, async () => {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(`${baseUrl}${SHOP_URL}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.gallery-item', { timeout: 10000 });

        const grid = await page.evaluate(() => {
          setActiveSortOrder('sort_price_asc');
          const order = paintings.filter(paintingMatchesFilters).map(p => p.title);
          const columns = [...document.querySelectorAll('.gallery-column')]
            .map(column => [...column.children].map(tile => order.indexOf(tile.querySelector('img').alt)));
          return { order, columns };
        });

        assert(grid.columns.length > 1, `Expected more than one column at ${width}px`);

        // The top row is the start of the sort order, left to right
        const topRow = grid.columns.map(column => column[0]);
        assertEqual(topRow.join(','), topRow.map((_, i) => i).join(','),
          `The top row should hold the first ${grid.columns.length} paintings of the sort order, left to right`);

        // And no column ever runs backwards through the order
        grid.columns.forEach((column, i) => {
          const ascending = column.every((position, j) => j === 0 || position > column[j - 1]);
          assert(ascending, `Column ${i + 1} runs out of sort order: ${column.join(' -> ')}`);
        });

        await page.close();
      });
    }

    // Test 5c: Which filter control a screen gets
    //
    // The bar is desktop-only and the floating button covers everything below
    // 961px. Both stylesheets have to agree on that: the button once ended up
    // hidden at every width because each thought the other breakpoint showed
    // it, and nothing caught it.
    for (const { label, width, bar, fab } of [
      { label: 'a phone', width: 390, bar: false, fab: true },
      { label: 'a tablet', width: 900, bar: false, fab: true },
      { label: 'a desktop', width: 1280, bar: true, fab: false },
    ]) {
      await test(`Exactly one set of filter controls shows on ${label}`, async () => {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        await page.goto(`${baseUrl}${SHOP_URL}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.gallery-item', { timeout: 10000 });

        assertEqual(await page.locator('#gallery-filter-bar').isVisible(), bar,
          `The filter bar should ${bar ? '' : 'not '}show at ${width}px`);
        assertEqual(await page.locator('#filter-fab').isVisible(), fab,
          `The floating filter button should ${fab ? '' : 'not '}show at ${width}px`);

        // Nothing may hide behind the fixed header either way
        const clear = await page.evaluate(() => {
          const header = document.getElementById('header-container').getBoundingClientRect();
          const title = document.querySelector('.page-title').getBoundingClientRect();
          return title.top >= header.bottom;
        });
        assert(clear, `The page title is tucked under the fixed header at ${width}px`);

        await page.close();
      });
    }

    // Test 5c2: The bar's four controls sit on one row at the narrowest width
    // that still shows it, with every filter set to its longest label
    await test('The filter bar keeps its four controls on one row at 961px', async () => {
      const page = await browser.newPage({ viewport: { width: 961, height: 900 } });
      await page.goto(`${baseUrl}${SHOP_URL}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.gallery-item', { timeout: 10000 });

      const row = await page.evaluate(() => {
        setActiveStatusFilter('for_sale');
        setActiveTypeFilter('painting');
        setActiveSizeFilter('size_large');
        setActiveSortOrder('sort_size_desc');

        const controls = [...document.querySelectorAll('#gallery-filter-bar .filter-dropdown')]
          .filter(control => control.getBoundingClientRect().width > 0);
        return {
          count: controls.length,
          rows: new Set(controls.map(c => Math.round(c.getBoundingClientRect().top))).size,
          offScreen: controls.filter(c => c.getBoundingClientRect().right > window.innerWidth).length,
          clipped: controls
            .map(c => c.querySelector('.filter-dropdown-label'))
            .filter(label => label.scrollWidth > label.clientWidth + 1)
            .map(label => label.textContent),
        };
      });

      assertEqual(row.count, 4, 'Expected four filter controls in the bar');
      assertEqual(row.rows, 1, 'The filter controls wrapped onto more than one row');
      assertEqual(row.offScreen, 0, 'A filter control hangs off the right of the screen');
      assertEqual(row.clipped.join(', '), '', 'A filter label had to be cut short: ' + row.clipped.join(', '));

      await page.close();
    });

    // Test 5d: The filters stay reachable on a phone once the bar has scrolled
    // away — the floating button is the only way back to them, and it spent a
    // while hidden at every width by two stylesheets that each thought the
    // other breakpoint was showing it.
    await test('The floating filter button filters the grid on a phone', async () => {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
      await page.goto(`${baseUrl}${SHOP_URL}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.gallery-item', { timeout: 10000 });

      // Past the top of the page, where the static filter bar is long gone
      await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
      await page.waitForTimeout(600);

      const barGone = await page.evaluate(() =>
        document.getElementById('gallery-filter-bar').getBoundingClientRect().bottom <= 0);
      assert(barGone, 'The filter bar should have scrolled away before the floating button matters');
      assert(await page.locator('#filter-fab').isVisible(), 'The floating filter button is not visible on a phone');

      await page.click('#fab-trigger');
      await page.waitForTimeout(400);

      const sheet = await page.evaluate(() => {
        const popup = document.querySelector('.fab-popup');
        const box = popup.getBoundingClientRect();
        return {
          opacity: getComputedStyle(popup).opacity,
          groups: [...popup.querySelectorAll('.fab-group')].map(g => g.querySelector('.fab-group-label').textContent),
          onScreen: box.top >= 0 && box.bottom <= window.innerHeight && box.right <= window.innerWidth,
        };
      });
      assertEqual(sheet.opacity, '1', 'The filter sheet did not open');
      assertEqual(sheet.groups.length, 4, `Expected four filter groups, got: ${sheet.groups.join(', ')}`);
      assert(sheet.onScreen, 'The filter sheet opens partly off the screen');

      await page.click('.fab-filter-btn.status-filter[data-filter="sold"]');
      await page.waitForTimeout(600);

      const result = await page.evaluate(() => ({
        stillOpen: document.getElementById('filter-fab').classList.contains('open'),
        shown: document.querySelectorAll('.gallery-item').length,
        barLabel: document.getElementById('filter-status-label').textContent,
      }));
      assert(!result.stillOpen, 'The sheet should close once a filter is picked');
      assertEqual(result.shown, paintings.filter(p => p.status === 'sold').length,
        'Picking "Sålda" in the sheet did not filter the grid to the sold paintings');
      assertEqual(result.barLabel, 'Sålda', 'The bar at the top did not follow the choice made in the sheet');

      await page.close();
    });

    console.log(colors.blue + '\n[4] LANGUAGE SWITCHING TESTS' + colors.reset);

    // Test 6: Language switching works
    await test('Language switching to English works', async () => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

      // Call setLanguage directly — buttons may be hidden (mobile menu) so clicking is unreliable
      await page.waitForFunction(() => typeof setLanguage === 'function', { timeout: 5000 });
      await page.evaluate(() => setLanguage('en'));

      // Give time for language to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if lang attribute changed
      const htmlLang = await page.evaluate(() => document.documentElement.lang);
      assertEqual(htmlLang, 'en', 'Language did not switch to English');

      await page.close();
    });

    console.log(colors.blue + '\n[5] PAINTING DETAIL TESTS' + colors.reset);

    // Test 7: Painting detail page loads
    await test('Painting detail page renders correctly', async () => {
      const page = await browser.newPage();
      const firstPainting = paintings[0];

      const response = await page.goto(
        `${baseUrl}${paintingPageUrl(firstPainting)}`,
        { waitUntil: 'networkidle' }
      );
      assert(response.ok(), `View page failed to load with status ${response.status()}`);

      await page.waitForSelector('.page-view-container', { timeout: 10000 });

      const title = await page.locator('#pageview-title').textContent();
      assert(title.length > 0, 'Painting title not rendered on detail page');

      await page.close();
    });

    // A sold painting must not be buyable from the page. The server rejects it
    // too (tests/checkout.js), but a visible buy button would still let someone
    // fill a cart with a canvas that no longer exists.
    await test('Sold paintings offer no buy button', async () => {
      const soldPaintings = paintings.filter(p => p.status === 'sold');
      assert(soldPaintings.length > 0, 'No sold paintings in the catalog to check');

      const page = await browser.newPage();

      // Control: prove the selector matches something before trusting a count of
      // zero anywhere else, otherwise a renamed class would make this test pass
      // by finding nothing at all
      const forSale = paintings.find(p => p.status === 'for_sale' && !p.framedOnly && !p.frameAvailable);
      await page.goto(`${baseUrl}${paintingPageUrl(forSale)}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.page-view-container', { timeout: 10000 });
      const controlButtons = await page.locator('button.pageview-buy-btn').count();
      assertEqual(controlButtons, 1,
        `The buy-button selector matched ${controlButtons} buttons on for-sale painting ` +
        `"${forSale.id}" — the checks below cannot mean anything until it matches exactly one`);

      // A sample rather than all of them — this is one status-driven code path,
      // and every extra page load lengthens the suite
      const sample = soldPaintings.slice(0, 3);

      for (const painting of sample) {
        await page.goto(`${baseUrl}${paintingPageUrl(painting)}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('.page-view-container', { timeout: 10000 });

        const buyButtons = await page.locator('button.pageview-buy-btn').count();
        assertEqual(buyButtons, 0, `Sold painting "${painting.id}" still shows a buy button`);

        const priceText = await page.locator('#pageview-price-section').textContent();
        assert(priceText.trim().length > 0,
          `Sold painting "${painting.id}" shows nothing at all where the sold notice should be`);
      }

      await page.close();
    });

    console.log(colors.blue + '\n[6] FORM TESTS' + colors.reset);

    // Test 8: Contact form exists
    await test('Contact form is present', async () => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

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


    console.log(colors.blue + '\n[7] LANGUAGE COVERAGE TESTS' + colors.reset);

    // Text that is legitimately identical in both languages. Anything not
    // listed here that survives a switch to English is untranslated copy.
    const SAME_IN_BOTH_LANGUAGES = [
      /^[\s\d.,:·×–—@/()+-]*$/,          // numbers, symbols, separators
      /^\d+\s*(kr|cm|%)/i,                // prices and measurements
      /^\d+\s*[x×]\s*\d+/i,               // dimensions
      /^(Portfolio|Vaavascanvas|Devika|Instagram|Mailchimp|Stripe|Swish|Klarna)$/i,
      /@vaavascanvas/i,                   // social handle
      /vaavascanvas\.se/i,                // domain and e-mail
      /^©/,                               // copyright line
      /^(Alla|Status)$/,                  // filter words that are the same word
      /diameter/i,                        // same word in both languages
    ];

    // Painting and product names are proper nouns and stay as they are
    const PROPER_NOUNS = new Set(paintings.map(p => p.title));

    // Elements holding artwork names rather than interface copy. Portfolio
    // titles come from image file names, so they have no translation.
    const CONTENT_SELECTORS = '#lightboxTitle, .featured-card-label, #pageview-title';

    // `reveal` runs before each snapshot to bring text that is hidden behind an
    // interaction into view — otherwise captions and modals are never compared
    const languagePages = [
      { label: 'Main page',        url: `${baseUrl}/` },
      { label: 'Gallery page',     url: `${baseUrl}${SHOP_URL}` },
      {
        label: 'Portfolio page',
        url: `${baseUrl}/pages/portfolio.html`,
        reveal: async (page) => {
          // The medium caption only exists once a piece is opened
          const opened = await page.evaluate(() => {
            const piece = document.querySelector('.medium-section:not([style*="none"]) .piece');
            if (!piece) return false;
            piece.click();
            return true;
          });
          assert(opened, 'No portfolio pieces rendered, so the lightbox caption cannot be checked');
          await new Promise(resolve => setTimeout(resolve, 300));
        },
      },
      { label: 'Commissions page', url: `${baseUrl}/pages/commissions.html` },
      { label: 'View page',        url: `${baseUrl}${paintingPageUrl(paintings[0])}` },
    ];

    for (const { label, url, reveal } of languagePages) {
      await test(`${label} translates fully to English`, async () => {
        const page = await browser.newPage();

        const readVisibleText = () => page.evaluate((contentSelectors) => {
          const out = [];
          const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walk.nextNode())) {
            const el = node.parentElement;
            if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
            if (!el.offsetParent && el.tagName !== 'BODY') continue;
            if (el.closest(contentSelectors)) continue;
            const text = node.textContent.replace(/\s+/g, ' ').trim();
            if (text) out.push(text);
          }
          return out;
        }, CONTENT_SELECTORS);

        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForFunction(() => typeof setLanguage === 'function', { timeout: 10000 });
        await page.evaluate(() => setLanguage('sv'));
        await new Promise(resolve => setTimeout(resolve, 600));
        if (reveal) await reveal(page);
        const swedish = await readVisibleText();

        await page.evaluate(() => setLanguage('en'));
        await new Promise(resolve => setTimeout(resolve, 600));
        if (reveal) await reveal(page);
        const english = await readVisibleText();

        const untranslated = [];
        const shared = Math.min(swedish.length, english.length);
        for (let i = 0; i < shared; i++) {
          if (swedish[i] !== english[i]) continue;
          const text = swedish[i];
          if (PROPER_NOUNS.has(text)) continue;
          if (SAME_IN_BOTH_LANGUAGES.some(rule => rule.test(text))) continue;
          // Needs at least one word to be prose rather than a stray glyph
          if (!/[a-zåäö]{3}/i.test(text)) continue;
          if (!untranslated.includes(text)) untranslated.push(text);
        }

        assert(untranslated.length === 0,
          `Text did not change when switching to English — it is missing a data-i18n ` +
          `attribute, or is rendered by JS that does not re-run on languagechange:\n  ` +
          untranslated.map(t => `"${t.slice(0, 80)}"`).join('\n  '));

        await page.close();
      });
    }

    console.log(colors.blue + '\n[8] CART TESTS' + colors.reset);

    await test('Cart drawer opens when clicking the cart icon', async () => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

      await page.locator('.cart-icon-btn').click();
      await page.waitForSelector('#cart-drawer.open', { timeout: 5000 });

      const isOpen = await page.locator('#cart-drawer.open').count();
      assert(isOpen > 0, 'Cart drawer did not open after clicking cart icon');

      await page.close();
    });

    await test('Checkout is blocked and terms error shown when terms not accepted', async () => {
      const page = await browser.newPage();

      // Buy buttons only exist on the painting detail page (gallery grid links out
      // to view.html for purchasing). Pick a plain for-sale painting with no frame
      // options so a single click adds it to the cart without opening a modal.
      const simplePainting = paintings.find(p => p.status === 'for_sale' && !p.framedOnly && !p.frameAvailable);
      await page.goto(`${baseUrl}${paintingPageUrl(simplePainting)}`, { waitUntil: 'networkidle' });

      // Add an item so the cart footer (with checkout button) is visible
      await page.waitForSelector('button.pageview-buy-btn', { timeout: 10000 });
      await page.locator('button.pageview-buy-btn').click();
      await page.waitForSelector('#cart-drawer.open', { timeout: 5000 });

      // Ensure terms checkbox is unchecked
      await page.locator('#cart-terms-checkbox').uncheck();

      let navigationAttempted = false;
      page.on('framenavigated', (frame) => {
        if (frame === page.mainFrame()) navigationAttempted = true;
      });

      await page.locator('#checkout-btn').click();
      await new Promise(resolve => setTimeout(resolve, 500));

      assert(!navigationAttempted, 'Page navigated away — checkout should be blocked without terms accepted');

      const hasError = await page.locator('.cart-terms-label.cart-terms-error').count();
      assert(hasError > 0, 'Expected cart-terms-error class on terms label');

      await page.close();
    });

    // The cart is kept in localStorage so a buyer can leave and come back. The
    // maths behind the numbers is covered by tests/cart-math.js — what matters
    // here is that the contents survive the round trip at all.
    await test('The cart survives a page reload', async () => {
      const page = await browser.newPage();
      const painting = paintings.find(p => p.status === 'for_sale' && !p.framedOnly && !p.frameAvailable);
      assert(painting, 'No plain for-sale painting to add to the cart');

      await page.goto(`${baseUrl}${paintingPageUrl(painting)}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.removeItem('vc_cart'));

      await page.waitForSelector('button.pageview-buy-btn', { timeout: 10000 });
      await page.locator('button.pageview-buy-btn').click();
      await page.waitForSelector('#cart-drawer.open', { timeout: 5000 });

      const before = await page.evaluate(() => ({
        stored: JSON.parse(localStorage.getItem('vc_cart') || '[]'),
        badge: document.getElementById('cart-badge')?.textContent,
      }));
      assertEqual(before.stored.length, 1, 'The painting was not stored in the cart');

      // Come back to a different page entirely, the way a returning visitor would
      await page.goto(`${baseUrl}${SHOP_URL}`, { waitUntil: 'networkidle' });

      const after = await page.evaluate(() => ({
        stored: JSON.parse(localStorage.getItem('vc_cart') || '[]'),
        badge: document.getElementById('cart-badge')?.textContent,
        badgeVisible: document.getElementById('cart-badge')?.style.display !== 'none',
      }));

      assertEqual(after.stored.length, 1, 'The cart was empty after reloading');
      assertEqual(after.stored[0].id, painting.id, 'A different painting came back from the cart');
      assertEqual(after.stored[0].price, before.stored[0].price, 'The stored price changed across the reload');
      assertEqual(after.badge, '1', 'The cart badge does not show the restored item');
      assert(after.badgeVisible, 'The cart badge is hidden even though the cart has an item');

      await page.evaluate(() => localStorage.removeItem('vc_cart'));
      await page.close();
    });

    console.log(colors.blue + '\n[9] CHECKOUT REQUEST TESTS' + colors.reset);

    // The seam between the two tested halves: tests/cart-math.js proves the cart
    // totals correctly and tests/checkout.js proves the server prices a payload
    // correctly, but nothing else checks that the browser sends the payload the
    // server expects. Stripe is never contacted — the route is stubbed here.
    await test('Checkout posts the cart to the server and clears it on success', async () => {
      const page = await browser.newPage();
      const painting = paintings.find(p => p.status === 'for_sale' && !p.framedOnly && !p.frameAvailable);

      await page.goto(`${baseUrl}${paintingPageUrl(painting)}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.removeItem('vc_cart'));

      await page.waitForSelector('button.pageview-buy-btn', { timeout: 10000 });
      await page.locator('button.pageview-buy-btn').click();
      await page.waitForSelector('#cart-drawer.open', { timeout: 5000 });

      await page.selectOption('#cart-country', 'SE');
      await page.locator('#cart-terms-checkbox').check();

      let requestBody = null;
      await page.route('**/api/create-checkout', async (route) => {
        requestBody = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ url: `${baseUrl}/?order=success` }),
        });
      });

      await page.locator('#checkout-btn').click();
      await page.waitForURL(/order=success/, { timeout: 10000 });

      assert(requestBody, 'The browser never called /api/create-checkout');
      assert(Array.isArray(requestBody.items), 'The request body carries no items array');
      assertEqual(requestBody.items.length, 1, 'Wrong number of items in the checkout request');
      assertEqual(requestBody.items[0].id, painting.id, 'The wrong painting was sent to checkout');
      assertEqual(requestBody.country, 'SE', 'The chosen shipping country was not sent');

      // The server prices from the id, but it needs a title for the Stripe line
      assert(requestBody.items[0].title, 'The item was sent without a title for the Stripe line item');

      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vc_cart') || '[]'));
      assertEqual(stored.length, 0, 'The cart was not cleared after a successful checkout');

      await page.close();
    });

    await test('A failed checkout keeps the cart and re-enables the button', async () => {
      const page = await browser.newPage();
      const painting = paintings.find(p => p.status === 'for_sale' && !p.framedOnly && !p.frameAvailable);

      await page.goto(`${baseUrl}${paintingPageUrl(painting)}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => localStorage.removeItem('vc_cart'));

      await page.waitForSelector('button.pageview-buy-btn', { timeout: 10000 });
      await page.locator('button.pageview-buy-btn').click();
      await page.waitForSelector('#cart-drawer.open', { timeout: 5000 });

      await page.selectOption('#cart-country', 'SE');
      await page.locator('#cart-terms-checkbox').check();

      // The server rejecting the order must not lose what the buyer picked
      await page.route('**/api/create-checkout', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid item' }),
        });
      });

      await page.locator('#checkout-btn').click();
      await new Promise(resolve => setTimeout(resolve, 800));

      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vc_cart') || '[]'));
      assertEqual(stored.length, 1, 'A rejected checkout emptied the cart');

      const disabled = await page.locator('#checkout-btn').isDisabled();
      assert(!disabled, 'The checkout button was left disabled, so the buyer cannot try again');

      await page.evaluate(() => localStorage.removeItem('vc_cart'));
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
      server.close();
    }

    process.exit(errorCount > 0 ? 1 : 0);
  }
}

runTests().catch(err => {
  log.error(`Unhandled error: ${err.message}`);
  process.exit(1);
});
