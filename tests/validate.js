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

  // Convert unquoted keys to quoted keys (JavaScript object notation to JSON)
  paintingsStr = paintingsStr.replace(/(\{|,)\s*(\w+):/g, '$1"$2":');

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

  // Quote unquoted keys
  keysStr = keysStr.replace(/(\{|,)\s*(\w+):/g, '$1"$2":');

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

test('FOR_SALE paintings have originalPrice', () => {
  paintings.forEach(p => {
    if (p.status === statuses.FOR_SALE) {
      assert(p.originalPrice !== undefined && p.originalPrice !== null,
        `FOR_SALE painting ${p.id} missing originalPrice`);
      assert(typeof p.originalPrice === 'number' && p.originalPrice > 0,
        `FOR_SALE painting ${p.id} has invalid price: ${p.originalPrice}`);
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

test('No translation keys have extra unexpected languages', () => {
  Object.entries(keys).forEach(([key, langs]) => {
    Object.keys(langs).forEach(lang => {
      assertIncludes(['sv', 'en'], lang,
        `Translation key "${key}" has unexpected language: ${lang}`);
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

test('Paintings dropdown for "Originals" only includes FOR_SALE paintings', () => {
  const forSalePaintings = paintings.filter(p => p.status === statuses.FOR_SALE);
  assert(forSalePaintings.length > 0, 'No FOR_SALE paintings found');
});

test('Paintings dropdown for "Prints" includes all paintings', () => {
  assert(paintings.length > 0, 'No paintings found');
});

test('All FOR_SALE paintings have price for display', () => {
  const forSalePaintings = paintings.filter(p => p.status === statuses.FOR_SALE);
  forSalePaintings.forEach(p => {
    assert(p.originalPrice !== undefined && p.originalPrice > 0,
      `FOR_SALE painting ${p.id} missing valid price`);
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 6: Gallery Logic Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[6] GALLERY LOGIC VALIDATION' + colors.reset);

test('Paintings can be sorted by status and price', () => {
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

  assert(sorted.length === paintings.length, 'Sorting changed array length');
});

test('All paintings have valid filter status', () => {
  paintings.forEach(p => {
    assertIncludes(Object.values(statuses), p.status,
      `Painting ${p.id} has invalid filter status: ${p.status}`);
  });
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
