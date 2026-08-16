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

  // Extract TYPE constants
  const typeMatch = content.match(/const TYPE = \{([^}]+)\}/s);
  const types = {};
  if (typeMatch) {
    const typeStr = typeMatch[1];
    typeStr.match(/(\w+):\s*"([^"]+)"/g)?.forEach(str => {
      const [key, val] = str.match(/(\w+):\s*"([^"]+)"/).slice(1);
      types[key] = val;
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

  // Replace TYPE references with actual values
  paintingsStr = paintingsStr.replace(/TYPE\.(\w+)/g, (match, key) => {
    return `"${types[key]}"`;
  });

  // Convert unquoted keys to quoted keys (including keys with non-ASCII chars like å, ä, ö)
  paintingsStr = paintingsStr.replace(/(\{|,)\s*([\wÀ-ɏ]+):/g, '$1"$2":');

  // Remove trailing commas before } or ]
  paintingsStr = paintingsStr.replace(/,(\s*[}\]])/g, '$1');

  const paintings = JSON.parse(paintingsStr);

  return { paintings, statuses, mediums };
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
let paintings, statuses, mediums, keys, counts, htmlFiles, bookmarksData;

try {
  const paintingsData = loadPaintingsData();
  paintings = paintingsData.paintings;
  statuses = paintingsData.statuses;
  mediums = paintingsData.mediums;
  keys = loadTranslationsData();
  counts = loadCountsData();
  htmlFiles = loadHtmlFiles();
  bookmarksData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/bookmarks.json'), 'utf8'));
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

test('SOLD paintings have originalPrice (or framedOnly with framedPrice)', () => {
  paintings.forEach(p => {
    if (p.status === statuses.SOLD) {
      if (p.framedOnly) {
        assert(typeof p.framedPrice === 'number' && p.framedPrice > 0,
          `SOLD framedOnly painting ${p.id} missing valid framedPrice`);
      } else {
        assert(p.originalPrice !== undefined && p.originalPrice !== null,
          `SOLD painting ${p.id} missing originalPrice`);
        assert(typeof p.originalPrice === 'number' && p.originalPrice > 0,
          `SOLD painting ${p.id} has invalid price: ${p.originalPrice}`);
      }
    }
  });
});

test('Paintings with discountPercent have valid base price and percentage', () => {
  paintings.forEach(p => {
    if (p.discountPercent !== undefined) {
      assert(
        (p.originalPrice !== undefined && p.originalPrice !== null) ||
        (p.framedOnly && p.framedPrice !== undefined && p.framedPrice !== null),
        `Painting ${p.id} has discountPercent but missing price basis (originalPrice or framedPrice)`
      );
      assert(typeof p.discountPercent === 'number' && p.discountPercent > 0 && p.discountPercent < 100,
        `Painting ${p.id} has invalid discountPercent: ${p.discountPercent}`);
    }
  });
});

test('Painting descKeys reference existing translations', () => {
  paintings.forEach(p => {
    assert(keys[p.descKey], `Painting ${p.id} descKey "${p.descKey}" not found in translations`);
  });
});

test('Painting mediums are declared and translated', () => {
  const validMediums = Object.values(mediums);

  paintings.forEach(p => {
    assert(p.medium, `Painting ${p.id} has no medium`);
    assertIncludes(validMediums, p.medium,
      `Painting ${p.id} uses medium "${p.medium}", which is not in the MEDIUM constants in paintings.js`);
    // page-view.js renders this straight through t(), so an untranslated
    // medium would print the raw key on the product page
    assert(keys[p.medium],
      `Painting ${p.id} medium "${p.medium}" has no translation — the product page would show the raw key`);
  });
});

// Bookmark ids carry no extension — the image path is imageDir + id + imageExtension
function bookmarkImagePath(id) {
  return `${bookmarksData.imageDir}${id}${bookmarksData.imageExtension}`;
}

test('bookmarks.json is a valid inventory', () => {
  assert(bookmarksData.imageDir && bookmarksData.imageDir.startsWith('/') && bookmarksData.imageDir.endsWith('/'),
    'bookmarks.json needs an absolute imageDir ending in "/", e.g. "/images/bookmarks/"');
  assert(bookmarksData.imageExtension && bookmarksData.imageExtension.startsWith('.'),
    'bookmarks.json needs an imageExtension like ".jpg"');
  assert(Array.isArray(bookmarksData.variants) && bookmarksData.variants.length > 0,
    'bookmarks.json needs a non-empty variants array');
  assert(typeof bookmarksData.multiBuyPrice === 'number' && bookmarksData.multiBuyPrice > 0,
    `bookmarks.json has an invalid multiBuyPrice: ${bookmarksData.multiBuyPrice}`);
  assert(Number.isInteger(bookmarksData.multiBuyMinQuantity) && bookmarksData.multiBuyMinQuantity >= 2,
    `bookmarks.json multiBuyMinQuantity must be an integer of 2 or more, got: ${bookmarksData.multiBuyMinQuantity}`);

  const root = path.join(__dirname, '..');
  const seen = new Set();

  [bookmarksData.cover, ...bookmarksData.variants.map(v => v.id)].forEach(id => {
    assert(id, 'bookmarks.json has a variant with no id');
    assert(!/[./\\]/.test(id),
      `Bookmark id "${id}" must be a bare name — no extension or path, the build adds "${bookmarksData.imageExtension}"`);
    assert(!seen.has(id), `bookmarks.json lists "${id}" twice`);
    seen.add(id);
    const onDisk = path.join(root, bookmarkImagePath(id).replace(/^\//, ''));
    assert(fs.existsSync(onDisk), `bookmarks.json references missing image: ${bookmarkImagePath(id)}`);
  });

  bookmarksData.variants.forEach(v => {
    assert(v.status === 'sold' || v.status === 'for_sale',
      `Bookmark "${v.id}" has invalid status "${v.status}" — use "sold" or "for_sale"`);
  });

  assert(!bookmarksData.variants.some(v => v.id === bookmarksData.cover),
    'The cover image must not also be listed as a purchasable variant');
});

test('Every bookmark image on disk is listed in bookmarks.json', () => {
  const dir = path.join(__dirname, '..', bookmarksData.imageDir.replace(/^\//, ''));
  const listed = new Set(
    [bookmarksData.cover, ...bookmarksData.variants.map(v => v.id)]
      .map(id => id + bookmarksData.imageExtension)
  );

  fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .forEach(file => {
      assert(listed.has(file),
        `images/bookmarks/${file} is not listed in bookmarks.json — it can never be bought or marked sold` +
        (file.endsWith(bookmarksData.imageExtension) ? '' : ` (only ${bookmarksData.imageExtension} files are supported)`));
    });
});

test('Generated bookmark data matches bookmarks.json', () => {
  const product = paintings.find(p => p.type === 'bookmark');
  assert(product, 'No painting entry with type "bookmark" in paintings.js');

  const expectedImages = [bookmarksData.cover, ...bookmarksData.variants.map(v => v.id)]
    .map(bookmarkImagePath);
  const expectedSold = bookmarksData.variants
    .filter(v => v.status === 'sold')
    .map(v => bookmarkImagePath(v.id));

  assertEqual(JSON.stringify(product.images?.desktop), JSON.stringify(expectedImages),
    'paintings.js bookmark images are stale — run npm run build');
  assertEqual(JSON.stringify(product.images?.mobile), JSON.stringify(expectedImages),
    'paintings.js bookmark images are stale — run npm run build');
  assertEqual(JSON.stringify(product.soldVariants), JSON.stringify(expectedSold),
    'paintings.js bookmark soldVariants are stale — run npm run build');
  assertEqual(product.multiBuyPrice, bookmarksData.multiBuyPrice,
    'paintings.js bookmark multi-buy price is stale — run npm run build');
  assertEqual(product.multiBuyMinQuantity, bookmarksData.multiBuyMinQuantity,
    'paintings.js bookmark multi-buy threshold is stale — run npm run build');
  assert(product.multiBuyPrice < product.originalPrice,
    `The multi-buy price (${product.multiBuyPrice}) must be below the single price (${product.originalPrice}), ` +
    'otherwise buying more costs more');

  const allSold = bookmarksData.variants.every(v => v.status === 'sold');
  assertEqual(product.status, allSold ? 'sold' : 'for_sale',
    allSold
      ? 'Every bookmark is sold but the product is still for sale — run npm run build'
      : 'Bookmarks are still available but the product is marked sold — run npm run build');
});

test('Bookmark soldVariants only reference existing bookmark files', () => {
  paintings.forEach(p => {
    if (!p.soldVariants) return;
    assert(Array.isArray(p.soldVariants), `Painting ${p.id} soldVariants must be an array`);

    const imageNames = new Set();
    if (p.images && Array.isArray(p.images.desktop)) {
      p.images.desktop.forEach(src => {
        const file = src.split('/').pop();
        if (file) imageNames.add(file);
      });
    }

    p.soldVariants.forEach(variant => {
      const file = variant.split('/').pop();
      assert(imageNames.has(file), `Painting ${p.id} sold variant "${variant}" does not exist in bookmark images`);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// SUITE 2: Image Inventory Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[2] IMAGE INVENTORY VALIDATION' + colors.reset);

test('Every painting resolves to real image files', () => {
  const root = path.join(__dirname, '..');
  const missing = [];

  paintings.forEach(p => {
    if (p.images) {
      // Explicit image lists (bookmarks, clay): every path must exist on disk
      ['desktop', 'mobile'].forEach(variant => {
        assert(Array.isArray(p.images[variant]),
          `Painting ${p.id} has images but no ${variant} array — gallery.js would fall back to the folder convention`);
        p.images[variant].forEach(src => {
          if (!fs.existsSync(path.join(root, src.replace(/^\//, '')))) {
            missing.push(`${p.id}: ${src}`);
          }
        });
      });
      return;
    }

    // No explicit images — gallery.js builds /images/paintings/<id>/desktop/01.jpg
    const firstImage = path.join(root, 'images', 'paintings', p.id, 'desktop', '01.jpg');
    if (!fs.existsSync(firstImage)) {
      missing.push(`${p.id}: images/paintings/${p.id}/desktop/01.jpg (no images block and no matching folder)`);
    }
  });

  assert(missing.length === 0,
    'Paintings point at image files that do not exist:\n  ' + missing.join('\n  '));
});

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

test('Every folder-convention painting has an entry in counts.json', () => {
  // script.js falls back to imageCount = 1 for anything missing here, which
  // silently hides every image after the first on the gallery and detail pages
  const missing = paintings
    .filter(p => !p.images && !counts[p.id])
    .map(p => p.id);

  assert(missing.length === 0,
    'These paintings have no counts.json entry, so only their first image will ever be shown ' +
    '(run build_paintings_data.bat):\n  ' + missing.join('\n  '));
});

test('counts.json matches the number of images actually on disk', () => {
  const root = path.join(__dirname, '..');
  const mismatches = [];

  Object.entries(counts).forEach(([id, count]) => {
    const desktopDir = path.join(root, 'images', 'paintings', id, 'desktop');
    if (!fs.existsSync(desktopDir)) return;
    const onDisk = fs.readdirSync(desktopDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).length;
    if (onDisk !== count) mismatches.push(`${id}: counts.json says ${count}, ${onDisk} on disk`);
  });

  assert(mismatches.length === 0,
    'counts.json is out of date (run build_paintings_data.bat):\n  ' + mismatches.join('\n  '));
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
    'Some paintings have unsynced images (run sync_paintings_images.bat):\n  ' + unsynced.join('\n  ')
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

test('Translations use the same {placeholders} in every language', () => {
  // A missing placeholder in one language silently renders "{single} kr styck"
  Object.entries(keys).forEach(([key, langs]) => {
    const placeholdersFor = text => (String(text).match(/\{\w+\}/g) || []).sort().join(', ');
    const reference = placeholdersFor(langs.sv);

    Object.entries(langs).forEach(([lang, value]) => {
      assertEqual(placeholdersFor(value), reference,
        `Translation key "${key}" has different placeholders in "${lang}" than in "sv"`);
    });
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

// The prints dropdown lists every painting on purpose — a sold original can
// still be ordered as a print — so what matters is that each entry can render
// its preview image, which contact.js resolves through getPaintingImagePaths
test('Every painting in the prints dropdown has a resolvable preview image', () => {
  const root = path.join(__dirname, '..');
  const broken = [];

  paintings.forEach(p => {
    const explicit = p.images && Array.isArray(p.images.desktop) ? p.images.desktop[0] : null;
    const preview = explicit || `/images/paintings/${p.id}/desktop/01.jpg`;
    if (!fs.existsSync(path.join(root, preview.replace(/^\//, '')))) {
      broken.push(`${p.id}: ${preview}`);
    }
  });

  assert(broken.length === 0,
    'Selecting these in the prints dropdown shows a broken preview:\n  ' + broken.join('\n  '));
});

// ─────────────────────────────────────────────────────────────
// SUITE 6: Gallery Logic Validation
// ─────────────────────────────────────────────────────────────

console.log(colors.blue + '\n[6] GALLERY LOGIC VALIDATION' + colors.reset);

// Runs the real sortPaintings() from gallery.js rather than re-implementing it,
// so a change to the gallery's ordering rules is what makes this fail
function runRealSortPaintings(input) {
  const gallerySource = fs.readFileSync(path.join(__dirname, '../js/gallery.js'), 'utf8');
  const start = gallerySource.indexOf('function sortPaintings()');
  const end = gallerySource.indexOf('\n}', start);
  assert(start !== -1 && end !== -1, 'Could not extract sortPaintings() from js/gallery.js');

  const source = gallerySource.slice(start, end + 2);
  const factory = new Function('STATUS', 'hasPaintingDiscount', 'paintings',
    `${source}\nsortPaintings();\nreturn paintings;`);

  const hasPaintingDiscount = p =>
    typeof p.discountPercent === 'number' && p.discountPercent > 0 && p.discountPercent < 100;

  return factory(statuses, hasPaintingDiscount, input);
}

test('Gallery sort puts for-sale first, then biggest discounts, then sold', () => {
  // Synthetic input so the rules are exercised even when nothing is discounted
  const input = [
    { id: 'sold-a',       status: statuses.SOLD,     _randomGalleryOrder: 0 },
    { id: 'plain-a',      status: statuses.FOR_SALE, _randomGalleryOrder: 1 },
    { id: 'discount-10',  status: statuses.FOR_SALE, discountPercent: 10, _randomGalleryOrder: 2 },
    { id: 'sold-b',       status: statuses.SOLD,     _randomGalleryOrder: 3 },
    { id: 'discount-40',  status: statuses.FOR_SALE, discountPercent: 40, _randomGalleryOrder: 4 },
    { id: 'plain-b',      status: statuses.FOR_SALE, _randomGalleryOrder: 5 },
  ];

  const order = runRealSortPaintings(input).map(p => p.id);

  assertEqual(order.join(' → '), 'discount-40 → discount-10 → plain-a → plain-b → sold-a → sold-b',
    'Gallery sort order changed');
});

test('Gallery sort never shows a sold painting before an available one', () => {
  const sorted = runRealSortPaintings(paintings.map((p, i) => ({ ...p, _randomGalleryOrder: i })));

  let seenSold = null;
  sorted.forEach(p => {
    if (p.status === statuses.SOLD) {
      seenSold = seenSold || p.id;
    } else if (seenSold) {
      assert(false, `"${p.id}" (${p.status}) is sorted after sold painting "${seenSold}"`);
    }
  });
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

console.log(colors.blue + '\n[7] CART VALIDATION' + colors.reset);

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

  // Extract BOOKMARKS catalog
  let bookmarks = null;
  const bookmarksMatch = content.match(/const BOOKMARKS = \{([\s\S]*?)\n\};/);
  if (bookmarksMatch) {
    let bstr = `{${bookmarksMatch[1]}}`;
    bstr = bstr.replace(/\/\/.*$/gm, '');
    bstr = bstr.replace(/'([^']*)'/g, '"$1"');
    bstr = bstr.replace(/(\{|,)\s*([\w]+):/g, '$1"$2":');
    bstr = bstr.replace(/,(\s*[}\]])/g, '$1');
    bookmarks = JSON.parse(bstr);
  }

  // Extract shipping constants
  const freeShippingMatch = content.match(/const FREE_SHIPPING_THRESHOLD = (\d+)/);
  const shippingCostMatch = content.match(/const SHIPPING_COST_SE = (\d+)/);
  const shippingCostEUMatch = content.match(/const SHIPPING_COST_EU = (\d+)/);

  return {
    paintings: serverPaintings,
    bookmarks,
    freeShippingThreshold: freeShippingMatch ? parseInt(freeShippingMatch[1]) : null,
    shippingCost: shippingCostMatch ? parseInt(shippingCostMatch[1]) : null,
    shippingCostEU: shippingCostEUMatch ? parseInt(shippingCostEUMatch[1]) : null,
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
  // Bookmarks are priced per variant from the BOOKMARKS catalog instead
  paintings.filter(p => p.status === 'for_sale' && p.type !== 'bookmark').forEach(p => {
    assertIncludes(catalogIds, p.id,
      `For-sale painting "${p.id}" is missing from the checkout price catalog in create-checkout.js`);
  });
});

test('Checkout bookmark catalog matches bookmarks.json', () => {
  const product = paintings.find(p => p.type === 'bookmark');

  assert(catalog.bookmarks, 'Could not find BOOKMARKS catalog in create-checkout.js');
  assertEqual(catalog.bookmarks.id, product.id,
    'BOOKMARKS.id does not match the bookmark product id in paintings.js');
  assertEqual(catalog.bookmarks.price, product.originalPrice,
    `Bookmark price mismatch: catalog=${catalog.bookmarks.price}, paintings.js=${product.originalPrice}`);
  assertEqual(catalog.bookmarks.multiBuyPrice, bookmarksData.multiBuyPrice,
    'BOOKMARKS.multiBuyPrice is stale — run npm run build');
  assertEqual(catalog.bookmarks.multiBuyMinQuantity, bookmarksData.multiBuyMinQuantity,
    'BOOKMARKS.multiBuyMinQuantity is stale — run npm run build');
  assertEqual(catalog.bookmarks.imageDir, bookmarksData.imageDir,
    'BOOKMARKS.imageDir is stale — run npm run build');
  assertEqual(catalog.bookmarks.imageExtension, bookmarksData.imageExtension,
    'BOOKMARKS.imageExtension is stale — run npm run build');

  bookmarksData.variants.forEach(v => {
    assertEqual(catalog.bookmarks.variants[v.id], v.status,
      `Bookmark "${v.id}" is "${v.status}" in bookmarks.json but "${catalog.bookmarks.variants[v.id]}" in the checkout catalog — run npm run build`);
  });

  Object.keys(catalog.bookmarks.variants).forEach(id => {
    assert(bookmarksData.variants.some(v => v.id === id),
      `Checkout catalog has unknown bookmark "${id}" — remove it or add it to bookmarks.json`);
  });
});

test('Bookmarks are never sellable as a whole product', () => {
  const catalogIds = catalog.paintings.map(p => p.id);
  paintings.filter(p => p.type === 'bookmark').forEach(p => {
    assert(!catalogIds.includes(p.id),
      `"${p.id}" is in the PAINTINGS catalog — that would let the whole set be bought as one original`);
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
    if (cp.originalPrice !== undefined) {
      assertEqual(cp.originalPrice, p.originalPrice,
        `Painting "${cp.id}" originalPrice mismatch: catalog=${cp.originalPrice}, paintings.js=${p.originalPrice}`);
    }
    if (cp.framedPrice !== undefined) {
      assertEqual(cp.framedPrice, p.framedPrice,
        `Painting "${cp.id}" framedPrice mismatch: catalog=${cp.framedPrice}, paintings.js=${p.framedPrice}`);
    }
    if (cp.discountPercent !== undefined) {
      assertEqual(cp.discountPercent, p.discountPercent,
        `Painting "${cp.id}" discountPercent mismatch: catalog=${cp.discountPercent}, paintings.js=${p.discountPercent}`);
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

test('Checkout shipping constants match cart.js', () => {
  const cartContent = fs.readFileSync(path.join(__dirname, '../js/cart.js'), 'utf8');

  // The cart displays these and the server charges them — a mismatch means the
  // customer is billed something other than what the drawer showed
  const constants = [
    ['FREE_SHIPPING_THRESHOLD', catalog.freeShippingThreshold],
    ['SHIPPING_COST_SE', catalog.shippingCost],
    ['SHIPPING_COST_EU', catalog.shippingCostEU],
  ];

  constants.forEach(([name, serverValue]) => {
    assert(serverValue !== null && serverValue !== undefined,
      `${name} not found in create-checkout.js`);

    const match = cartContent.match(new RegExp(`const ${name} = (\\d+)`));
    assert(match, `${name} not found in cart.js — the server charges it, so the cart must use the same constant`);

    assertEqual(parseInt(match[1]), serverValue,
      `${name} mismatch: cart.js=${match[1]}, create-checkout.js=${serverValue}`);
  });
});

test('cart.js has no hardcoded shipping amounts left', () => {
  const cartContent = fs.readFileSync(path.join(__dirname, '../js/cart.js'), 'utf8');
  const values = [catalog.freeShippingThreshold, catalog.shippingCost, catalog.shippingCostEU];

  const offenders = [];
  cartContent.split('\n').forEach((line, i) => {
    // Skip the constant declarations themselves
    if (/^\s*const (FREE_SHIPPING_THRESHOLD|SHIPPING_COST_SE|SHIPPING_COST_EU) = /.test(line)) return;
    values.forEach(value => {
      if (new RegExp(`\\b${value}\\b`).test(line)) {
        offenders.push(`cart.js:${i + 1}: ${line.trim()}`);
      }
    });
  });

  assert(offenders.length === 0,
    'Shipping amounts are hardcoded instead of using the shared constants, so the ' +
    'sync test above cannot protect them:\n  ' + offenders.join('\n  '));
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
