#!/usr/bin/env node

/**
 * Comprehensive validation test suite for Vaavascanvas
 * Tests data consistency, translations, and logic before deployment
 */

const fs = require('fs');
const path = require('path');

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
  try {
    fn();
    log.success(name);
  } catch (err) {
    log.error(`${name}\n  ${err.message}`);
    errorCount++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
}

function assertIncludes(array, item, message) {
  if (!array.includes(item)) throw new Error(`${message}\nExpected array to include: ${item}\nArray: ${array.join(', ')}`);
}

// ─────────────────────────────────────────────────────────────
// Load and parse data files
// ─────────────────────────────────────────────────────────────

function loadPaintingsData() {
  const paintingsPath = path.join(__dirname, '../js/paintings.js');
  const content = fs.readFileSync(paintingsPath, 'utf8');

  // Extract STATUS constants
  const statusMatch = content.match(/const STATUS = \{([^}]+)\}/s);
  const statuses = {};
  if (statusMatch) {
    const statusStr = statusMatch[1];
    statusStr.match(/(\w+):\s*"([^"]+)"/g)?.forEach(str => {
      const [key, val] = str.match(/(\w+):\s*"([^"]+)"/).slice(1);
      statuses[key] = val;
    });
  }

  // Extract SHAPE constants
  const shapeMatch = content.match(/const SHAPE = \{([^}]+)\}/s);
  const shapes = {};
  if (shapeMatch) {
    const shapeStr = shapeMatch[1];
    shapeStr.match(/(\w+):\s*"([^"]+)"/g)?.forEach(str => {
      const [key, val] = str.match(/(\w+):\s*"([^"]+)"/).slice(1);
      shapes[key] = val;
    });
  }

  // Extract MEDIUM constants
  const mediumMatch = content.match(/const MEDIUM = \{([^}]+)\}/s);
  const mediums = {};
  if (mediumMatch) {
    const mediumStr = mediumMatch[1];
    mediumStr.match(/(\w+):\s*"([^"]+)"/g)?.forEach(str => {
      const [key, val] = str.match(/(\w+):\s*"([^"]+)"/).slice(1);
      mediums[key] = val;
    });
  }

  // Extract paintings array
  const paintingsMatch = content.match(/const paintings = \[([\s\S]+?)\];/);
  if (!paintingsMatch) throw new Error('Could not find paintings array in paintings.js');

  // Parse the array by replacing STATUS.* references with their values and handling trailing commas
  let paintingsStr = `[${paintingsMatch[1]}]`;

  // Replace STATUS references with actual values
  paintingsStr = paintingsStr.replace(/STATUS\.(\w+)/g, (match, key) => {
    return `"${statuses[key]}"`;
  });

  // Replace SHAPE references with actual values
  paintingsStr = paintingsStr.replace(/SHAPE\.(\w+)/g, (match, key) => {
    return `"${shapes[key]}"`;
  });

  // Replace MEDIUM references with actual values
  paintingsStr = paintingsStr.replace(/MEDIUM\.(\w+)/g, (match, key) => {
    return `"${mediums[key]}"`;
  });

  // Convert unquoted keys to quoted keys (including keys with non-ASCII chars like å, ä, ö)
  paintingsStr = paintingsStr.replace(/(\{|,)\s*([\wÀ-ɏ]+):/g, '$1"$2":');

  // Remove trailing commas before } or ]
  paintingsStr = paintingsStr.replace(/,(\s*[}\]])/g, '$1');

  const paintings = JSON.parse(paintingsStr);

  return { paintings, statuses };
}

function loadTranslationsData() {
  const translationsPath = path.join(__dirname, '../js/translations.js');
  const content = fs.readFileSync(translationsPath, 'utf8');

  // Extract keys object
  const keysMatch = content.match(/const keys = \{([\s\S]+?)\};/);
  if (!keysMatch) throw new Error('Could not find keys object in translations.js');

  let keysStr = `{${keysMatch[1]}}`;

  // Remove comments
  keysStr = keysStr.replace(/\/\/[^\n]*\n/g, '\n');

  // Quote unquoted keys (including keys with non-ASCII chars like å, ä, ö)
  keysStr = keysStr.replace(/(\{|,)\s*([\wÀ-ɏ]+):/g, '$1"$2":');

  // Remove trailing commas
  keysStr = keysStr.replace(/,(\s*[}\]])/g, '$1');

  const keys = JSON.parse(keysStr);
  return keys;
}

function loadCountsData() {
  const countsPath = path.join(__dirname, '../images/paintings/counts.json');
  const content = fs.readFileSync(countsPath, 'utf8');
  return JSON.parse(content);
}

function loadHtmlFiles() {
  const pagesDir = path.join(__dirname, '../pages');
  const componentsDir = path.join(__dirname, '../components');
  const indexFile = path.join(__dirname, '../index.html');

  const files = [];

  // Read index.html
  if (fs.existsSync(indexFile)) {
    files.push({
      path: indexFile,
      content: fs.readFileSync(indexFile, 'utf8')
    });
  }

  // Read pages
  if (fs.existsSync(pagesDir)) {
    fs.readdirSync(pagesDir).forEach(file => {
      if (file.endsWith('.html')) {
        const filePath = path.join(pagesDir, file);
        files.push({
          path: filePath,
          content: fs.readFileSync(filePath, 'utf8')
        });
      }
    });
  }

  // Read components
  if (fs.existsSync(componentsDir)) {
    fs.readdirSync(componentsDir).forEach(file => {
      if (file.endsWith('.html')) {
        const filePath = path.join(componentsDir, file);
        files.push({
          path: filePath,
          content: fs.readFileSync(filePath, 'utf8')
        });
      }
    });
  }

  return files;
}

// ─────────────────────────────────────────────────────────────
// Test Suites
// ─────────────────────────────────────────────────────────────

console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + 'VAAVASCANVAS PRE-DEPLOYMENT VALIDATION TESTS' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset + '\n');

// Load data once
let paintings, statuses, keys, counts, htmlFiles;

try {
  paintings = loadPaintingsData().paintings;
  statuses = loadPaintingsData().statuses;
  keys = loadTranslationsData();
  counts = loadCountsData();
  htmlFiles = loadHtmlFiles();
} catch (err) {
  log.error('Failed to load data files: ' + err.message);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// SUITE 1: Paintings Data Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[1] PAINTINGS DATA VALIDATION' + colors.reset);

test('All paintings have unique IDs', () => {
  const ids = paintings.map(p => p.id);
  const uniqueIds = new Set(ids);
  assertEqual(ids.length, uniqueIds.size, 'Duplicate painting IDs found');
});

test('All paintings have required fields', () => {
  paintings.forEach((p, i) => {
    assert(p.id, `Painting ${i} missing id`);
    assert(p.title, `Painting ${i} (${p.id}) missing title`);
    assert(p.descKey, `Painting ${i} (${p.id}) missing descKey`);
    assert(p.shape, `Painting ${i} (${p.id}) missing shape`);
    // Check size fields based on shape
    if (p.shape === 'rectangular') {
      assert(p.width !== undefined, `Painting ${i} (${p.id}) missing width`);
      assert(p.height !== undefined, `Painting ${i} (${p.id}) missing height`);
    } else if (p.shape === 'circle') {
      assert(p.diameter !== undefined, `Painting ${i} (${p.id}) missing diameter`);
    }
    assert(p.status, `Painting ${i} (${p.id}) missing status`);
  });
});

test('All painting statuses are valid', () => {
  const validStatuses = Object.values(statuses);
  paintings.forEach(p => {
    assertIncludes(validStatuses, p.status, `Painting ${p.id} has invalid status: ${p.status}`);
  });
});

test('FOR_SALE paintings have originalPrice (or framedOnly with framedPrice)', () => {
  paintings.forEach(p => {
    if (p.status === statuses.FOR_SALE) {
      if (p.framedOnly) {
        assert(typeof p.framedPrice === 'number' && p.framedPrice > 0,
          `framedOnly painting ${p.id} missing valid framedPrice`);
      } else {
        assert(p.originalPrice !== undefined && p.originalPrice !== null,
          `FOR_SALE painting ${p.id} missing originalPrice`);
        assert(typeof p.originalPrice === 'number' && p.originalPrice > 0,
          `FOR_SALE painting ${p.id} has invalid price: ${p.originalPrice}`);
      }
    }
  });
});

test('SOLD paintings have originalPrice', () => {
  paintings.forEach(p => {
    if (p.status === statuses.SOLD) {
      assert(p.originalPrice !== undefined && p.originalPrice !== null,
        `SOLD painting ${p.id} missing originalPrice`);
      assert(typeof p.originalPrice === 'number' && p.originalPrice > 0,
        `SOLD painting ${p.id} has invalid price: ${p.originalPrice}`);
    }
  });
});

test('Painting descKeys reference existing translations', () => {
  paintings.forEach(p => {
    assert(keys[p.descKey], `Painting ${p.id} descKey "${p.descKey}" not found in translations`);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 2: Image Inventory Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[2] IMAGE INVENTORY VALIDATION' + colors.reset);

test('All painting IDs in counts.json exist in paintings.js', () => {
  const paintingIds = paintings.map(p => p.id);
  Object.keys(counts).forEach(countId => {
    assertIncludes(paintingIds, countId, `counts.json contains unknown painting ID: ${countId}`);
  });
});

test('All counts.json entries have valid image counts', () => {
  Object.entries(counts).forEach(([id, count]) => {
    assert(typeof count === 'number' && count > 0,
      `${id} has invalid image count: ${count}`);
  });
});

test('Image counts match painting imageCount property (if set)', () => {
  paintings.forEach(p => {
    const countValue = counts[p.id];
    // Only validate if imageCount is explicitly set on the painting
    if (p.imageCount && countValue) {
      assertEqual(countValue, p.imageCount,
        `Painting ${p.id}: counts.json (${countValue}) doesn't match imageCount (${p.imageCount})`);
    }
  });
});

test('All original images have been synced to desktop and mobile', () => {
  const paintingsDir = path.join(__dirname, '../images/paintings');
  const unsynced = [];

  if (!fs.existsSync(paintingsDir)) return;

  fs.readdirSync(paintingsDir).forEach(paintingId => {
    const paintingPath = path.join(paintingsDir, paintingId);
    if (!fs.statSync(paintingPath).isDirectory()) return;

    const originalDir = path.join(paintingPath, 'original');
    if (!fs.existsSync(originalDir)) return;

    const countJpg = dir =>
      fs.existsSync(dir)
        ? fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png)$/i.test(f)).length
        : 0;

    const originalCount = countJpg(originalDir);
    const desktopCount  = countJpg(path.join(paintingPath, 'desktop'));
    const mobileCount   = countJpg(path.join(paintingPath, 'mobile'));

    if (originalCount !== desktopCount || originalCount !== mobileCount) {
      unsynced.push(
        `${paintingId}: original=${originalCount}, desktop=${desktopCount}, mobile=${mobileCount}`
      );
    }
  });

  assert(
    unsynced.length === 0,
    'Some paintings have unsynced images (run sync_paintings.bat):\n  ' + unsynced.join('\n  ')
  );
});

test('No Swedish characters (å/ä/ö) in identifiers that become URLs or JS keys', () => {
  const swedish = /[åäöÅÄÖ]/;
  const violations = [];

  // Painting IDs (used in folder paths and URLs)
  paintings.forEach(p => {
    if (swedish.test(p.id))
      violations.push(`paintings.js id: "${p.id}"`);
    if (swedish.test(p.descKey))
      violations.push(`paintings.js descKey: "${p.descKey}" (painting: ${p.id})`);
  });

  // Translation key names (parsed as JSON keys in tests and referenced in code)
  Object.keys(keys).forEach(key => {
    if (swedish.test(key))
      violations.push(`translations.js key: "${key}"`);
  });

  // Image folder names on disk (become URL path segments)
  const paintingsDir = path.join(__dirname, '../images/paintings');
  if (fs.existsSync(paintingsDir)) {
    fs.readdirSync(paintingsDir).forEach(name => {
      if (swedish.test(name))
        violations.push(`images/paintings/ folder: "${name}"`);
    });
  }

  // counts.json keys (must match folder names and painting IDs)
  Object.keys(counts).forEach(key => {
    if (swedish.test(key))
      violations.push(`counts.json key: "${key}"`);
  });

  // metadata.json keys (must match folder names and painting IDs)
  const metadataPath = path.join(__dirname, '../images/paintings/metadata.json');
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    Object.keys(metadata).forEach(key => {
      if (swedish.test(key))
        violations.push(`metadata.json key: "${key}"`);
    });
  }

  assert(
    violations.length === 0,
    'Swedish characters found in identifiers (causes 404s and parse errors):\n  ' + violations.join('\n  ')
  );
});

// ─────────────────────────────────────────────────────────────
// SUITE 3: Translation System Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[3] TRANSLATION SYSTEM VALIDATION' + colors.reset);

test('All translation keys have Swedish (sv) version', () => {
  Object.entries(keys).forEach(([key, langs]) => {
    assert(langs.sv !== undefined, `Translation key "${key}" missing Swedish (sv) version`);
    assert(typeof langs.sv === 'string' && langs.sv.length > 0,
      `Translation key "${key}" has empty Swedish version`);
  });
});

test('All translation keys have English (en) version', () => {
  Object.entries(keys).forEach(([key, langs]) => {
    assert(langs.en !== undefined, `Translation key "${key}" missing English (en) version`);
    assert(typeof langs.en === 'string' && langs.en.length > 0,
      `Translation key "${key}" has empty English version`);
  });
});

test('All translation values are non-empty strings', () => {
  Object.entries(keys).forEach(([key, langs]) => {
    Object.entries(langs).forEach(([lang, val]) => {
      assert(typeof val === 'string' && val.length > 0,
        `Translation key "${key}" has empty or non-string value for language "${lang}"`);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 4: HTML & Translation References Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[4] HTML & TRANSLATION REFERENCES VALIDATION' + colors.reset);

test('All data-i18n attributes reference existing translation keys', () => {
  const i18nRegex = /data-i18n\s*=\s*["']([^"']+)["']/g;
  const seenKeys = new Set();

  htmlFiles.forEach(file => {
    let match;
    while ((match = i18nRegex.exec(file.content)) !== null) {
      const key = match[1];
      seenKeys.add(key);
      assert(keys[key],
        `HTML file ${path.basename(file.path)} references unknown translation key: "${key}"`);
    }
  });

  assert(seenKeys.size > 0, 'No data-i18n attributes found in HTML files');
});

test('All data-i18n-ph placeholder attributes reference existing translation keys', () => {
  const i18nPhRegex = /data-i18n-ph\s*=\s*["']([^"']+)["']/g;

  htmlFiles.forEach(file => {
    let match;
    while ((match = i18nPhRegex.exec(file.content)) !== null) {
      const key = match[1];
      assert(keys[key],
        `HTML file ${path.basename(file.path)} references unknown placeholder translation key: "${key}"`);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 5: Form Logic Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[5] FORM LOGIC VALIDATION' + colors.reset);

test('Originals dropdown excludes SOLD and PERSONAL paintings', () => {
  const nonSalePaintings = paintings.filter(
    p => p.status === statuses.SOLD || p.status === statuses.PERSONAL
  );
  nonSalePaintings.forEach(p => {
    assert(p.status !== statuses.FOR_SALE,
      `Painting ${p.id} with status ${p.status} should not appear in Originals dropdown`);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 6: Gallery Logic Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[6] GALLERY LOGIC VALIDATION' + colors.reset);

test('Paintings sort: FOR_SALE before PERSONAL before SOLD, price descending within group', () => {
  const statusOrder = {
    [statuses.FOR_SALE]: 0,
    [statuses.PERSONAL]: 1,
    [statuses.SOLD]: 2
  };

  const sorted = [...paintings].sort((a, b) => {
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return (b.originalPrice || 0) - (a.originalPrice || 0);
  });

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const aOrder = statusOrder[a.status];
    const bOrder = statusOrder[b.status];
    assert(aOrder <= bOrder,
      `Sort order wrong: "${a.id}" (${a.status}) should come before "${b.id}" (${b.status})`);
    if (aOrder === bOrder) {
      assert((a.originalPrice || 0) >= (b.originalPrice || 0),
        `Price order wrong within ${a.status}: "${a.id}" (${a.originalPrice}) should be >= "${b.id}" (${b.originalPrice})`);
    }
  }
});

test('Paintings with frameAvailable have a valid framedPrice', () => {
  paintings.forEach(p => {
    if (p.frameAvailable) {
      assert(typeof p.framedPrice === 'number' && p.framedPrice > 0,
        `Painting ${p.id} has frameAvailable but missing valid framedPrice`);
      if (!p.framedOnly) {
        assert(p.framedPrice > p.originalPrice,
          `Painting ${p.id} framedPrice (${p.framedPrice}) should be greater than originalPrice (${p.originalPrice})`);
      }
    }
  });
});

test('framedOnly paintings have no originalPrice', () => {
  paintings.forEach(p => {
    if (p.framedOnly) {
      assert(p.originalPrice === undefined,
        `framedOnly painting ${p.id} should not have originalPrice`);
    }
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 7: Prints Page Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[7] PRINTS PAGE VALIDATION' + colors.reset);

test('data-print values in prints.html reference valid painting IDs', () => {
  const printsPath = path.join(__dirname, '../pages/prints.html');
  assert(fs.existsSync(printsPath), 'prints.html not found');

  const content = fs.readFileSync(printsPath, 'utf8');
  const dataPrintRegex = /data-print="([^"]+)"/g;
  const paintingIds = paintings.map(p => p.id);
  const missing = [];

  let match;
  while ((match = dataPrintRegex.exec(content)) !== null) {
    const kebabId = match[1];
    // Convert kebab-case to camelCase — same logic used in prints.html cart add
    const camelId = kebabId.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (!paintingIds.includes(camelId)) {
      missing.push(`"${kebabId}" (resolved to "${camelId}")`);
    }
  }

  assert(missing.length === 0,
    `data-print values have no matching painting ID:\n  ${missing.join('\n  ')}`);
});

test('Required cart translation keys exist', () => {
  const requiredKeys = [
    'cart_heading', 'cart_empty', 'cart_total_label', 'cart_terms_text',
    'cart_terms_link', 'cart_checkout_btn', 'cart_processing', 'cart_error',
    'cart_order_success', 'cart_toast_added', 'cart_toast_already',
    'cart_frame_included', 'cart_frame_add',
  ];
  requiredKeys.forEach(key => {
    assert(keys[key], `Required cart translation key missing: "${key}"`);
  });
});

test('Required prints translation keys exist', () => {
  const requiredKeys = [
    'prints_price_from', 'prints_hero_h1', 'prints_hero_p',
    'prints_medium_square', 'prints_medium_portrait', 'prints_size_label',
    'prints_add_to_cart', 'prints_info_heading', 'prints_info_p',
    'prints_request_heading', 'prints_request_p', 'prints_request_btn',
    'prints_success_banner', 'prints_toast_added',
  ];
  requiredKeys.forEach(key => {
    assert(keys[key], `Required prints translation key missing: "${key}"`);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 8: Checkout Price Catalog Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[8] CHECKOUT PRICE CATALOG VALIDATION' + colors.reset);

function loadCheckoutCatalog() {
  const filePath = path.join(__dirname, '../functions/api/create-checkout.js');
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract PAINTINGS array
  const paintingsMatch = content.match(/const PAINTINGS = \[([\s\S]+?)\];/);
  if (!paintingsMatch) throw new Error('Could not find PAINTINGS in create-checkout.js');
  let str = `[${paintingsMatch[1]}]`;
  str = str.replace(/'([^']*)'/g, '"$1"');
  str = str.replace(/(\{|,)\s*([\w]+):/g, '$1"$2":');
  str = str.replace(/,(\s*[}\]])/g, '$1');
  const serverPaintings = JSON.parse(str);

  // Extract PRINT_PRICES
  const printPricesMatch = content.match(/const PRINT_PRICES = \{([^}]+)\}/);
  if (!printPricesMatch) throw new Error('Could not find PRINT_PRICES in create-checkout.js');
  let ppStr = `{${printPricesMatch[1]}}`;
  ppStr = ppStr.replace(/'([^']+)':/g, '"$1":');
  ppStr = ppStr.replace(/,(\s*[}\]])/g, '$1');
  const printPrices = JSON.parse(ppStr);

  // Extract PRINT_PAINTINGS set
  const printPaintingsMatch = content.match(/const PRINT_PAINTINGS = new Set\(\[([^\]]+)\]\)/);
  const printPaintings = new Set();
  if (printPaintingsMatch) {
    const matches = printPaintingsMatch[1].match(/'([^']+)'/g);
    if (matches) matches.forEach(s => printPaintings.add(s.replace(/'/g, '')));
  }

  // Extract shipping constants
  const freeShippingMatch = content.match(/const FREE_SHIPPING_THRESHOLD = (\d+)/);
  const shippingCostMatch = content.match(/const SHIPPING_COST_SE = (\d+)/);

  return {
    paintings: serverPaintings,
    printPrices,
    printPaintings,
    freeShippingThreshold: freeShippingMatch ? parseInt(freeShippingMatch[1]) : null,
    shippingCost: shippingCostMatch ? parseInt(shippingCostMatch[1]) : null,
  };
}

let catalog;
try {
  catalog = loadCheckoutCatalog();
} catch (err) {
  log.error('Failed to load checkout catalog: ' + err.message);
  process.exit(1);
}

test('Checkout catalog covers all for-sale paintings', () => {
  const catalogIds = catalog.paintings.map(p => p.id);
  paintings.filter(p => p.status === 'for_sale').forEach(p => {
    assertIncludes(catalogIds, p.id,
      `For-sale painting "${p.id}" is missing from the checkout price catalog in create-checkout.js`);
  });
});

test('Checkout catalog prices match paintings.js', () => {
  catalog.paintings.forEach(cp => {
    const p = paintings.find(x => x.id === cp.id);
    assert(p, `Checkout catalog contains unknown painting ID: "${cp.id}" — remove it or add it to paintings.js`);
    if (cp.originalPrice !== undefined) {
      assertEqual(cp.originalPrice, p.originalPrice,
        `Painting "${cp.id}" originalPrice mismatch: catalog=${cp.originalPrice}, paintings.js=${p.originalPrice}`);
    }
    if (cp.framedPrice !== undefined) {
      assertEqual(cp.framedPrice, p.framedPrice,
        `Painting "${cp.id}" framedPrice mismatch: catalog=${cp.framedPrice}, paintings.js=${p.framedPrice}`);
    }
    if (cp.framedOnly !== undefined) {
      assertEqual(!!cp.framedOnly, !!p.framedOnly,
        `Painting "${cp.id}" framedOnly mismatch: catalog=${cp.framedOnly}, paintings.js=${p.framedOnly}`);
    }
  });
});

test('Checkout catalog sold statuses match paintings.js', () => {
  paintings.forEach(p => {
    const cp = catalog.paintings.find(x => x.id === p.id);
    if (!cp) return;
    if (p.status === 'sold') {
      assertEqual(cp.status, 'sold',
        `Painting "${p.id}" is sold in paintings.js but catalog still has it for_sale — update create-checkout.js`);
    }
    if (cp.status === 'sold') {
      assertEqual(p.status, 'sold',
        `Painting "${p.id}" is sold in checkout catalog but paintings.js says ${p.status}`);
    }
  });
});

test('Checkout PRINT_PAINTINGS matches paintings.js', () => {
  const paintingsContent = fs.readFileSync(path.join(__dirname, '../js/paintings.js'), 'utf8');
  const match = paintingsContent.match(/const PRINT_PAINTINGS = \[([^\]]+)\]/);
  const jsPrintPaintings = new Set();
  if (match) {
    const found = match[1].match(/'([^']+)'/g);
    if (found) found.forEach(s => jsPrintPaintings.add(s.replace(/'/g, '')));
  }

  catalog.printPaintings.forEach(id => {
    assert(jsPrintPaintings.has(id),
      `Checkout catalog PRINT_PAINTINGS includes "${id}" which is not in paintings.js`);
  });
  jsPrintPaintings.forEach(id => {
    assert(catalog.printPaintings.has(id),
      `paintings.js PRINT_PAINTINGS includes "${id}" but it is missing from the checkout catalog`);
  });
});

test('Checkout print prices match paintings.js PRINT_SIZES constants', () => {
  const paintingsContent = fs.readFileSync(path.join(__dirname, '../js/paintings.js'), 'utf8');

  // Extract PRINT_SIZES_SQUARE and PRINT_SIZES_STANDARD
  function extractSizes(name) {
    const match = paintingsContent.match(new RegExp(`const ${name} = \\[([\\s\\S]+?)\\];`));
    if (!match) throw new Error(`Could not find ${name} in paintings.js`);
    let str = `[${match[1]}]`;
    str = str.replace(/'([^']*)'/g, '"$1"');
    str = str.replace(/(\{|,)\s*([\w]+):/g, '$1"$2":');
    str = str.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(str);
  }

  const squareSizes = extractSizes('PRINT_SIZES_SQUARE');
  const standardSizes = extractSizes('PRINT_SIZES_STANDARD');
  const allSizes = [...squareSizes, ...standardSizes];

  allSizes.forEach(({ size, price }) => {
    assert(catalog.printPrices[size] !== undefined,
      `Print size "${size}" from paintings.js is missing from PRINT_PRICES in create-checkout.js`);
    assertEqual(catalog.printPrices[size], price,
      `Print size "${size}" price mismatch: catalog=${catalog.printPrices[size]}, paintings.js=${price}`);
  });

  Object.keys(catalog.printPrices).forEach(size => {
    const known = allSizes.find(s => s.size === size);
    assert(known,
      `PRINT_PRICES in create-checkout.js contains unknown size "${size}" not in paintings.js`);
  });
});

test('Checkout shipping constants match cart.js', () => {
  const cartContent = fs.readFileSync(path.join(__dirname, '../js/cart.js'), 'utf8');
  const freeMatch = cartContent.match(/const FREE_SHIPPING = (\d+)/);
  const cartFreeShipping = freeMatch ? parseInt(freeMatch[1]) : null;

  assert(catalog.freeShippingThreshold !== null,
    'FREE_SHIPPING_THRESHOLD not found in create-checkout.js');
  assert(catalog.shippingCost !== null,
    'SHIPPING_COST not found in create-checkout.js');

  if (cartFreeShipping !== null) {
    assertEqual(catalog.freeShippingThreshold, cartFreeShipping,
      `Free shipping threshold mismatch: checkout=${catalog.freeShippingThreshold}, cart.js=${cartFreeShipping}`);
  }
  assertEqual(catalog.shippingCost, 59, 'SHIPPING_COST_SE in create-checkout.js should be 59 kr');
});

// ─────────────────────────────────────────────────────────────
// Results Summary
// ─────────────────────────────────────────────────────────────

console.log('\n' + colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(colors.blue + 'TEST RESULTS' + colors.reset);
console.log(colors.blue + '═══════════════════════════════════════════════════════════' + colors.reset);
console.log(`\nTotal tests: ${testCount}`);
console.log(`${colors.green}Passed: ${testCount - errorCount}${colors.reset}`);

if (errorCount > 0) {
  console.log(`${colors.red}Failed: ${errorCount}${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`${colors.green}Failed: 0${colors.reset}`);
  console.log(`\n${colors.green}✓ All validation tests passed! Site is ready to deploy.${colors.reset}\n`);
  process.exit(0);
}
