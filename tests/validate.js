#!/usr/bin/env node

/**
 * Comprehensive validation test suite for Vaavascanvas
 * Tests data consistency, translations, and logic before deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

  // Read the shop and its generated per-work pages, so the checks that sweep
  // all markup (translation keys, script order) cover them too
  const shopDir = path.join(__dirname, '../pictures');
  if (fs.existsSync(shopDir)) {
    fs.readdirSync(shopDir).forEach(file => {
      if (file.endsWith('.html')) {
        const filePath = path.join(shopDir, file);
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

test('No painting is still an unfilled placeholder', () => {
  // sync_paintings_images.bat writes a placeholder entry for any image folder
  // that has none, so a newly synced painting cannot be forgotten. The
  // placeholder is invalid on purpose — the price is 0 and its descKey points
  // at a translation that does not exist — and this test is what states the
  // reason in one message instead of leaving three scattered failures.
  const entries = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/paintings.json'), 'utf8'));
  const stubs = entries.filter(entry => entry._todo);

  assert(stubs.length === 0,
    'These paintings are still placeholders written by the image sync. Fill them in and ' +
    'delete their "_todo" line:\n  ' +
    stubs.map(stub => `${stub.id} — ${stub._todo}`).join('\n  '));
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

test('Portfolio medium labels are translated', () => {
  const source = fs.readFileSync(path.join(__dirname, '../js/portfolio-loader.js'), 'utf8');
  const block = source.match(/const portfolioMediums = \{([\s\S]*?)\n\};/);
  assert(block, 'Could not find portfolioMediums in js/portfolio-loader.js');

  // Commented-out lines start with "/" after the indent, so they never match
  const entries = [...block[1].matchAll(/^[ \t]*(\w+)\s*:\s*\{([^}]*)\}/gm)];
  assert(entries.length > 0, 'portfolioMediums has no entries');

  entries.forEach(([, name, body]) => {
    assert(!/\blabel\s*:/.test(body),
      `Portfolio medium "${name}" still has a "label" property — nothing reads it, ` +
      'the lightbox uses t(labelKey), so a hardcoded label silently shows "undefined"');

    const labelKey = body.match(/labelKey\s*:\s*['"]([^'"]+)['"]/);
    assert(labelKey,
      `Portfolio medium "${name}" has no labelKey — t(undefined) returns undefined and ` +
      'the lightbox caption reads "undefined"');

    assert(keys[labelKey[1]],
      `Portfolio medium "${name}" uses labelKey "${labelKey[1]}", which is not in translations.js`);
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

// A bookmark's images live in images/bookmarks/<id>/, the same shape as a
// painting's or a clay piece's, and it goes by "bookmark-<id>" in the catalogue
// — the folder name alone would not do, since "mallard" is a clay piece too
const BOOKMARK_ID_PREFIX = 'bookmark-';
const bookmarkCatalogId = id => `${BOOKMARK_ID_PREFIX}${id}`;
const bookmarkImageDir = id => path.join(__dirname, '..', 'images', 'bookmarks', id);
const bookmarkImagePath = (id, size) => `/images/bookmarks/${id}/${size}/01.jpg`;

test('bookmarks.json is a valid inventory', () => {
  assert(Array.isArray(bookmarksData.variants) && bookmarksData.variants.length > 0,
    'bookmarks.json needs a non-empty variants array');
  assert(typeof bookmarksData.multiBuyPrice === 'number' && bookmarksData.multiBuyPrice > 0,
    `bookmarks.json has an invalid multiBuyPrice: ${bookmarksData.multiBuyPrice}`);
  assert(Number.isInteger(bookmarksData.multiBuyMinQuantity) && bookmarksData.multiBuyMinQuantity >= 2,
    `bookmarks.json multiBuyMinQuantity must be an integer of 2 or more, got: ${bookmarksData.multiBuyMinQuantity}`);

  const root = path.join(__dirname, '..');
  const seen = new Set();

  bookmarksData.variants.forEach(v => {
    assert(v.id, 'bookmarks.json has a bookmark with no id');
    assert(!/[./\\]/.test(v.id),
      `Bookmark id "${v.id}" must be a bare name — it is the name of its image folder`);
    assert(!seen.has(v.id), `bookmarks.json lists "${v.id}" twice`);
    seen.add(v.id);

    // The title is what a buyer sees on the tile, in the cart and in search
    // results, so a bookmark without one would ship nameless
    assert(v.title && v.title.trim(),
      `Bookmark "${v.id}" has no title — it would be listed without a name`);

    assert(v.status === 'sold' || v.status === 'for_sale',
      `Bookmark "${v.id}" has invalid status "${v.status}" — use "sold" or "for_sale"`);

    ['original', 'desktop', 'mobile'].forEach(size => {
      const onDisk = path.join(root, bookmarkImagePath(v.id, size).replace(/^\//, ''));
      assert(fs.existsSync(onDisk),
        `bookmarks.json references missing image: ${bookmarkImagePath(v.id, size)}` +
        (size === 'original' ? '' : ' (run sync_paintings_images.bat)'));
    });
  });
});

test('Every bookmark image folder is listed in bookmarks.json', () => {
  const dir = path.join(__dirname, '..', 'images', 'bookmarks');
  const listed = new Set(bookmarksData.variants.map(v => v.id));

  fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .forEach(entry => {
      assert(listed.has(entry.name),
        `images/bookmarks/${entry.name}/ is not listed in bookmarks.json — it can never be bought or marked sold`);
    });
});

test('Generated bookmark data matches bookmarks.json', () => {
  const bookmarks = paintings.filter(p => p.type === 'bookmark');
  assertEqual(bookmarks.length, bookmarksData.variants.length,
    `paintings.js has ${bookmarks.length} bookmarks, bookmarks.json lists ${bookmarksData.variants.length} — run npm run build`);

  bookmarksData.variants.forEach(v => {
    const bookmark = bookmarks.find(p => p.id === bookmarkCatalogId(v.id));
    assert(bookmark, `No entry for bookmark "${v.id}" in paintings.js — run npm run build`);

    assertEqual(bookmark.title, v.title, `Bookmark "${v.id}" has a stale title — run npm run build`);
    assertEqual(bookmark.status, v.status, `Bookmark "${v.id}" has a stale status — run npm run build`);
    assertEqual(JSON.stringify(bookmark.images?.desktop), JSON.stringify([bookmarkImagePath(v.id, 'desktop')]),
      `Bookmark "${v.id}" has stale desktop images — run npm run build`);
    assertEqual(JSON.stringify(bookmark.images?.mobile), JSON.stringify([bookmarkImagePath(v.id, 'mobile')]),
      `Bookmark "${v.id}" has stale mobile images — run npm run build`);
    assertEqual(bookmark.multiBuyPrice, bookmarksData.multiBuyPrice,
      `Bookmark "${v.id}" has a stale multi-buy price — run npm run build`);
    assertEqual(bookmark.multiBuyMinQuantity, bookmarksData.multiBuyMinQuantity,
      `Bookmark "${v.id}" has a stale multi-buy threshold — run npm run build`);
    assert(bookmark.multiBuyPrice < bookmark.originalPrice,
      `The multi-buy price (${bookmark.multiBuyPrice}) must be below the single price (${bookmark.originalPrice}), ` +
      'otherwise buying more costs more');
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

// ─────────────────────────────────────────────────────────────
// Image build manifest
//
// The counting tests above catch a painting with the wrong NUMBER of built
// images. They cannot see a desktop/01.jpg that was compressed from an older
// original — same count, stale picture — which is exactly what an incremental
// rebuild risks. scripts/generate_mobile_images.py records a sha256 of every
// original it built from; re-hashing them here costs about a third of a second
// and turns that risk into a failing test.
// ─────────────────────────────────────────────────────────────

const paintingsImageDir = path.join(__dirname, '../images/paintings');
const manifestPath = path.join(paintingsImageDir, '.image-build.json');

function imageFolderIds() {
  if (!fs.existsSync(paintingsImageDir)) return [];
  return fs.readdirSync(paintingsImageDir)
    .filter(name => fs.statSync(path.join(paintingsImageDir, name)).isDirectory())
    .sort();
}

function originalNames(id) {
  const dir = path.join(paintingsImageDir, id, 'original');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
}

function loadImageManifest() {
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

test('Every painting folder is recorded in the image build manifest', () => {
  const manifest = loadImageManifest();
  assert(manifest !== null,
    'images/paintings/.image-build.json is missing — run sync_paintings_images.bat once to create it');

  const folders = imageFolderIds();
  const recorded = Object.keys(manifest.paintings || {}).sort();

  const unrecorded = folders.filter(id => originalNames(id).length > 0 && !recorded.includes(id));
  assert(unrecorded.length === 0,
    'These paintings have never been built by the image script, so nothing knows what their ' +
    'desktop/ and mobile/ images were made from (run sync_paintings_images.bat):\n  ' +
    unrecorded.join('\n  '));

  const orphans = recorded.filter(id => !folders.includes(id));
  assert(orphans.length === 0,
    'The build manifest still lists paintings whose folder is gone (run sync_paintings_images.bat):\n  ' +
    orphans.join('\n  '));
});

test('Built images match the originals they were built from', () => {
  const manifest = loadImageManifest();
  if (manifest === null) return; // already reported by the test above

  const stale = [];

  Object.entries(manifest.paintings || {}).forEach(([id, entry]) => {
    const originalDir = path.join(paintingsImageDir, id, 'original');
    if (!fs.existsSync(originalDir)) return; // already reported as an orphan above

    const recorded = entry.sources || {};
    const onDisk = {};
    originalNames(id).forEach(name => {
      onDisk[name] = crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(originalDir, name)))
        .digest('hex');
    });

    Object.keys(onDisk).forEach(name => {
      if (!(name in recorded)) stale.push(`${id}/${name}: added since the last build`);
      else if (recorded[name] !== onDisk[name]) stale.push(`${id}/${name}: the original has changed since it was built`);
    });
    Object.keys(recorded).forEach(name => {
      if (!(name in onDisk)) stale.push(`${id}/${name}: built once but the original is gone`);
    });

    // The built folders must hold exactly the originals, under the same names
    ['desktop', 'mobile'].forEach(variant => {
      const dir = path.join(paintingsImageDir, id, variant);
      const built = fs.existsSync(dir)
        ? fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort()
        : [];
      const expected = Object.keys(onDisk).sort();
      if (built.join(',') !== expected.join(',')) {
        stale.push(`${id}/${variant}: holds ${built.join(', ') || '(nothing)'} but original/ holds ${expected.join(', ')}`);
      }
    });
  });

  assert(stale.length === 0,
    'Some built images no longer match their originals — the site would serve the old picture ' +
    '(run sync_paintings_images.bat and pick [1]):\n  ' + stale.join('\n  '));
});

test('metadata.json aspect ratios match the images on disk', () => {
  // Read the frame size straight out of the JPEG: a stale aspect ratio makes the
  // gallery reserve the wrong height for a tile, which no count can reveal and
  // which only shows up as a grid that jumps while it loads
  const jpegSize = (file) => {
    const buf = fs.readFileSync(file);
    if (buf.length < 4 || buf.readUInt16BE(0) !== 0xFFD8) return null;
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xFF) { offset++; continue; }
      const marker = buf[offset + 1];
      const isStartOfFrame = marker >= 0xC0 && marker <= 0xCF &&
        marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC;
      if (isStartOfFrame) {
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
    return null;
  };

  const metadataPath = path.join(paintingsImageDir, 'metadata.json');
  assert(fs.existsSync(metadataPath),
    'images/paintings/metadata.json is missing (run sync_paintings_images.bat)');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const wrong = [];

  // Paintings, clay and bookmarks all keep their images in a folder of their
  // own; only where that folder lives differs
  const imageFolderFor = id => {
    if (id.startsWith(BOOKMARK_ID_PREFIX)) {
      return bookmarkImageDir(id.slice(BOOKMARK_ID_PREFIX.length));
    }
    const painting = path.join(paintingsImageDir, id);
    if (fs.existsSync(painting)) return painting;
    return path.join(__dirname, '..', 'images', 'lera', id);
  };

  imageFolderIds().forEach(id => {
    const first = path.join(paintingsImageDir, id, 'desktop', '01.jpg');
    if (!fs.existsSync(first)) return;

    if (!(id in metadata)) {
      wrong.push(`${id}: no entry, so the gallery has to guess how tall its tile is`);
      return;
    }

    const size = jpegSize(first);
    if (!size) return;

    const actual = Math.round((size.width / size.height) * 10000) / 10000;
    if (Math.abs(actual - metadata[id]) > 0.001) {
      wrong.push(`${id}: metadata.json says ${metadata[id]}, the image is ${actual} (${size.width}x${size.height})`);
    }
  });

  Object.keys(metadata).forEach(id => {
    if (!fs.existsSync(imageFolderFor(id))) {
      wrong.push(`${id}: listed in metadata.json but the folder is gone`);
    }
  });

  assert(wrong.length === 0,
    'metadata.json is out of date (run sync_paintings_images.bat):\n  ' + wrong.join('\n  '));
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

test('No translation is still a TODO placeholder', () => {
  // The image sync writes a desc_ entry for every new painting so the key
  // exists, but marks it TODO rather than inventing copy. A description that
  // reached the shop reading "TODO: skriv beskrivningen" would be worse than a
  // missing one, so it fails here until it is written.
  const todos = [];

  Object.entries(keys).forEach(([key, languages]) => {
    Object.entries(languages).forEach(([language, value]) => {
      if (typeof value === 'string' && value.includes('TODO:')) {
        todos.push(`${key} (${language})`);
      }
    });
  });

  assert(todos.length === 0,
    'These translations are still placeholders written by the image sync — write the real ' +
    'text in js/translations.js:\n  ' + todos.join('\n  '));
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
  assertEqual(catalog.bookmarks.price, product.originalPrice,
    `Bookmark price mismatch: catalog=${catalog.bookmarks.price}, paintings.js=${product.originalPrice}`);
  assertEqual(catalog.bookmarks.multiBuyPrice, bookmarksData.multiBuyPrice,
    'BOOKMARKS.multiBuyPrice is stale — run npm run build');
  assertEqual(catalog.bookmarks.multiBuyMinQuantity, bookmarksData.multiBuyMinQuantity,
    'BOOKMARKS.multiBuyMinQuantity is stale — run npm run build');

  // The catalog is keyed by the id the cart sends, so a mismatch here is the
  // difference between a bookmark being sellable and being rejected as unknown
  bookmarksData.variants.forEach(v => {
    const entry = catalog.bookmarks.variants[bookmarkCatalogId(v.id)];
    assert(entry, `Bookmark "${v.id}" is missing from the checkout catalog — run npm run build`);
    assertEqual(entry.status, v.status,
      `Bookmark "${v.id}" is "${v.status}" in bookmarks.json but "${entry.status}" in the checkout catalog — run npm run build`);
    assertEqual(entry.title, v.title,
      `Bookmark "${v.id}" has a stale title in the checkout catalog — run npm run build`);
    assertEqual(entry.image, bookmarkImagePath(v.id, 'desktop'),
      `Bookmark "${v.id}" has a stale image in the checkout catalog — Stripe would show the wrong picture`);
  });

  Object.keys(catalog.bookmarks.variants).forEach(id => {
    assert(bookmarksData.variants.some(v => bookmarkCatalogId(v.id) === id),
      `Checkout catalog has unknown bookmark "${id}" — remove it or add it to bookmarks.json`);
  });
});

test('Bookmarks are priced by the bookmark catalog, not as originals', () => {
  // A bookmark in PAINTINGS would be priced as a one-off, skipping the
  // multi-buy sum the drawer showed the buyer
  const catalogIds = catalog.paintings.map(p => p.id);
  paintings.filter(p => p.type === 'bookmark').forEach(p => {
    assert(!catalogIds.includes(p.id),
      `"${p.id}" is in the PAINTINGS catalog — it would be priced as a one-off original`);
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

test('_headers keeps code assets revalidating', () => {
  const headersPath = path.join(__dirname, '../_headers');
  assert(fs.existsSync(headersPath),
    'The _headers file is missing — without it Cloudflare caches CSS and JS for 4 hours, ' +
    'so visitors can run new HTML against stale code after a deploy');

  const content = fs.readFileSync(headersPath, 'utf8');

  // Every path that must not lag behind a deploy
  const mustRevalidate = ['/css/*', '/js/*', '/components/*'];

  // Anything the site fetches at runtime has to agree with the code that reads it
  const runtimeFetched = new Set();
  fs.readdirSync(path.join(__dirname, '../js'))
    .filter(f => f.endsWith('.js'))
    .forEach(f => {
      const js = fs.readFileSync(path.join(__dirname, '../js', f), 'utf8');
      for (const m of js.matchAll(/fetch\(\s*["'`]([^"'`]+)["'`]/g)) {
        const url = m[1].replace(/^\.\./, '');
        if (/\.json$/.test(url)) runtimeFetched.add(url.startsWith('/') ? url : '/' + url);
      }
    });

  [...mustRevalidate, ...runtimeFetched].forEach(rule => {
    const block = content.split(/\n(?=\S)/).find(b => b.trimStart().startsWith(rule));
    assert(block, `_headers has no rule for "${rule}" — it would keep Cloudflare's 4 hour default`);
    assert(/max-age=0/.test(block) && /must-revalidate/.test(block),
      `_headers rule for "${rule}" must use "max-age=0, must-revalidate"`);
  });
});

test('Checkout shipping constants match the cart', () => {
  // The cart declares these in js/cart-math.js and the server charges them — a
  // mismatch means the customer is billed something other than what the drawer
  // showed. tests/cart-math.js checks how they are applied; this checks the
  // numbers themselves still agree across the client/server split.
  const cartMath = fs.readFileSync(path.join(__dirname, '../js/cart-math.js'), 'utf8');

  const constants = [
    ['FREE_SHIPPING_THRESHOLD', catalog.freeShippingThreshold],
    ['SHIPPING_COST_SE', catalog.shippingCost],
    ['SHIPPING_COST_EU', catalog.shippingCostEU],
  ];

  constants.forEach(([name, serverValue]) => {
    assert(serverValue !== null && serverValue !== undefined,
      `${name} not found in create-checkout.js`);

    const match = cartMath.match(new RegExp(`const ${name} = (\\d+)`));
    assert(match, `${name} not found in cart-math.js — the server charges it, so the cart must use the same constant`);

    assertEqual(parseInt(match[1]), serverValue,
      `${name} mismatch: cart-math.js=${match[1]}, create-checkout.js=${serverValue}`);
  });
});

test('The cart has no hardcoded shipping amounts left', () => {
  const values = [catalog.freeShippingThreshold, catalog.shippingCost, catalog.shippingCostEU];
  const files = ['js/cart-math.js', 'js/cart.js'];

  const offenders = [];
  files.forEach(file => {
    const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    content.split('\n').forEach((line, i) => {
      // Skip the constant declarations themselves
      if (/^\s*const (FREE_SHIPPING_THRESHOLD|SHIPPING_COST_SE|SHIPPING_COST_EU) = /.test(line)) return;
      values.forEach(value => {
        if (new RegExp(`\\b${value}\\b`).test(line)) {
          offenders.push(`${file}:${i + 1}: ${line.trim()}`);
        }
      });
    });
  });

  assert(offenders.length === 0,
    'Shipping amounts are hardcoded instead of using the shared constants, so the ' +
    'sync test above cannot protect them:\n  ' + offenders.join('\n  '));
});

test('Every page that loads cart.js loads its dependencies first', () => {
  // cart.js calls calcSubtotal, resolveAdd, validateCheckout and friends as
  // globals, so a page that loads it alone throws on the first render
  const dependencies = ['cart-math', 'cart-rules'];

  const pages = htmlFiles.filter(f => /<script[^>]+src="[^"]*js\/cart\.js"/.test(f.content));
  assert(pages.length > 0, 'No page loads cart.js — the selector above is probably wrong');

  pages.forEach(file => {
    const name = path.basename(file.path);
    const cartAt = file.content.search(/<script[^>]+src="[^"]*js\/cart\.js"/);

    dependencies.forEach(dep => {
      const depAt = file.content.search(new RegExp(`<script[^>]+src="[^"]*js/${dep}\\.js"`));
      assert(depAt !== -1, `${name} loads cart.js without ${dep}.js`);
      assert(depAt < cartAt, `${name} loads ${dep}.js after cart.js — it has to come first`);
    });
  });
});

test('cart.js does not redeclare what its dependency modules export', () => {
  // A local copy would silently shadow the shared one and drift from the tests
  const cartContent = fs.readFileSync(path.join(__dirname, '../js/cart.js'), 'utf8');
  const shared = [
    'calcSubtotal', 'calcShipping', 'calcTotal', 'calcCount',
    'applyBookmarkPricing', 'cartItemOldPrice',
    'isUniqueItem', 'resolveAdd', 'withoutFrameVariants',
    'validateCheckout', 'buildOrderItems',
  ];

  const offenders = shared.filter(name =>
    new RegExp(`function\\s+${name}\\s*\\(`).test(cartContent));

  assert(offenders.length === 0,
    'cart.js redeclares functions that come from cart-math.js/cart-rules.js, ' +
    'so the tested version is not the one running:\n  ' + offenders.join('\n  '));
});

console.log(colors.blue + '\n[9] GENERATED WORK PAGE VALIDATION' + colors.reset);

// Everything checked here is written by scripts/build-painting-pages.js. The
// hand-maintained version of this markup had drifted badly — sold paintings
// were still advertised to Google as in stock and four entries named works
// that had been removed — so these tests exist to catch a stale build rather
// than a stale edit. If one fails, run `npm run build`.

const {
  paintingPageUrl, paintingSlug, getPriceModel, SHOP_DIR, SHOP_URL,
} = require('../js/paintings.js');

// The shop's own index.html sits in here alongside the generated work pages
const WORK_DIR = path.join(__dirname, '..', SHOP_DIR.replace(/^\//, ''));
const SHOP_INDEX = 'index.html';
const SITE = 'https://vaavascanvas.se';

function readWorkPage(painting) {
  const file = path.join(WORK_DIR, paintingSlug(painting) + '.html');
  assert(fs.existsSync(file), 'No generated page for "' + painting.id + '" — run `npm run build`');
  return fs.readFileSync(file, 'utf8');
}

// The <script type="application/ld+json"> payload of a page, as an object
function readSchema(html, what) {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(match, what + ' carries no structured data');
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    throw new Error(what + ' has structured data that is not valid JSON: ' + err.message);
  }
}

function expectedAvailability(painting) {
  return painting.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock';
}

test('Every work has a generated page', () => {
  paintings.forEach(painting => readWorkPage(painting));
});

test('No generated page is left behind for a work that no longer exists', () => {
  const expected = new Set([SHOP_INDEX, ...paintings.map(p => paintingSlug(p) + '.html')]);
  const orphans = fs.readdirSync(WORK_DIR).filter(f => f.endsWith('.html') && !expected.has(f));
  assert(orphans.length === 0,
    'These pages under ' + SHOP_URL + ' describe works that are not in paintings.json:\n  ' +
    orphans.join('\n  '));
});

test('Each work page describes itself and not another work', () => {
  // The generator builds every page from one template, so a missed
  // substitution would ship one work's page carrying another's title or
  // share image — invisible on screen, wrong in every link preview
  paintings.forEach(painting => {
    const html = readWorkPage(painting);
    const url = SITE + paintingPageUrl(painting);

    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assertEqual(canonical && canonical[1], url, painting.id + ': wrong canonical URL');

    const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/);
    assertEqual(ogUrl && ogUrl[1], url, painting.id + ': wrong og:url');

    const title = html.match(/<title>([^<]*)<\/title>/);
    assert(title && title[1].includes(painting.title),
      painting.id + ': <title> is "' + (title && title[1]) + '", which does not name the work');

    const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/);
    assert(ogImage && ogImage[1].startsWith(SITE),
      painting.id + ': og:image is not an absolute URL — link previews need one');
    assert(ogImage[1].includes('/' + painting.id + '/') || painting.type === 'bookmark',
      painting.id + ': og:image shows another work — ' + ogImage[1]);
  });
});

test('Work page structured data matches the catalog', () => {
  paintings.forEach(painting => {
    const html = readWorkPage(painting);
    const schema = readSchema(html, painting.id + "'s page");
    const work = schema['@graph'].find(node => node['@id'].endsWith('#work'));
    assert(work, painting.id + ': structured data has no work node');

    assertEqual(work.name, painting.title, painting.id + ': structured data names the wrong work');
    assertEqual(work.offers.availability, expectedAvailability(painting),
      painting.id + ': structured data advertises the wrong availability');

    // A sold one-off has no price to quote; an available one must quote the
    // same price the buyer is charged
    if (painting.status === 'sold') {
      assert(work.offers.price === undefined,
        painting.id + ': is sold but its structured data still quotes a price');
    } else {
      assertEqual(work.offers.price, String(getPriceModel(painting).price),
        painting.id + ': structured data price does not match the catalog');
    }
  });
});

test('Shop page structured data matches the catalog', () => {
  // This is the check that would have caught the drift: the shop page was
  // listing Skogsvila and Sommarstuga as in stock after both had sold, plus
  // four paintings that no longer existed at all
  const shop = htmlFiles.find(f => f.path === path.join(WORK_DIR, SHOP_INDEX));
  assert(shop, 'The shop page was not found at ' + SHOP_URL);

  const listed = readSchema(shop.content, 'the shop page').hasPart;
  assertEqual(listed.length, paintings.length,
    'The shop page lists a different number of products than the catalog holds');

  listed.forEach(entry => {
    const painting = paintings.find(p => SITE + paintingPageUrl(p) === entry.url);
    assert(painting, 'The shop page advertises "' + entry.name + '" at ' + entry.url +
      ', which is not a work page in paintings.json');
    assertEqual(entry.name, painting.title,
      'The shop page advertises ' + entry.url + ' under the wrong name');
    assertEqual(entry.offers.availability, expectedAvailability(painting),
      'The shop page advertises the wrong availability for "' + entry.name + '"');
  });

  paintings.forEach(painting => {
    assert(listed.some(entry => entry.url === SITE + paintingPageUrl(painting)),
      'The shop page does not list "' + painting.title + '"');
  });
});

test('No work page tells search engines to ignore it', () => {
  // The template these are built from carries noindex, because view.html is a
  // shell that redirects. Inheriting that tag would hide the entire catalogue
  // from search — the exact opposite of why these pages exist
  paintings.forEach(painting => {
    const html = readWorkPage(painting);
    assert(!/name="robots"[^>]*noindex/.test(html),
      painting.id + ': its page carries noindex — the generator failed to strip the template’s tag');
  });

  const shell = fs.readFileSync(path.join(__dirname, '../pages/view.html'), 'utf8');
  assert(/name="robots"[^>]*noindex/.test(shell),
    'pages/view.html lost its noindex — it duplicates a work page it only redirects to');
});

test('Every work page leads somewhere else', () => {
  // Without these each page is an island: a visitor who does not want this
  // particular painting has only the back button, and a crawler reaches the
  // catalogue through the shop page alone
  paintings.forEach(painting => {
    const html = readWorkPage(painting);

    const links = [...html.matchAll(/<a class="related-work" href="([^"]+)"/g)].map(m => m[1]);
    assert(links.length >= 4,
      painting.id + ': its page offers only ' + links.length + ' other works to go to');

    assert(!links.includes(paintingPageUrl(painting)),
      painting.id + ': its own page is listed among the works to go to next');

    const known = new Set(paintings.map(p => paintingPageUrl(p)));
    links.forEach(href => {
      assert(known.has(href), painting.id + ': links on to ' + href + ', which is not a work page');
    });

    assert(new Set(links).size === links.length,
      painting.id + ': lists the same work twice under "Fler verk"');
  });
});

test('A sold work offers a way on instead of ending at "Såld"', () => {
  // Sold works are the ones that prove the art sells, and a third of the
  // catalogue is sold — a page of theirs that stops at a red "Såld" converts
  // nobody
  const sold = paintings.filter(p => p.status === 'sold');
  assert(sold.length > 0, 'No sold paintings — this check would pass by matching nothing');

  sold.forEach(painting => {
    const html = readWorkPage(painting);
    const buttons = /<div id="pageview-buttons">([\s\S]*?)<\/div>/.exec(html);
    assert(buttons, painting.id + ': has no buttons container');

    assert(buttons[1].includes('type=Commissions&amp;ref=' + painting.id),
      painting.id + ': its commission link does not carry the work it came from');
    assert(/class="[^"]*subscribe-open/.test(buttons[1]),
      painting.id + ': offers no way to hear about new work');
  });

  // The control: an available work shows a buy button instead, rendered by
  // page-view.js, so its container stays empty in the markup
  const forSale = paintings.find(p => p.status === 'for_sale');
  assert(readWorkPage(forSale).includes('<div id="pageview-buttons"></div>'),
    forSale.id + ': is for sale but its page was pre-rendered with sold buttons');
});

test('Thumbnails show a painting in its own proportions', () => {
  // Every one of these used to be cropped to a fixed 3/4 box, so the picture
  // advertising a work was not the work — a near-square painting lost a fifth
  // of itself and a landscape one would lose half
  const ratios = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../images/paintings/metadata.json'), 'utf8'));

  const index = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const featured = [...index.matchAll(/<a class="featured-card" href="([^"]+)"[\s\S]*?<img([^>]*)>/g)];
  assertEqual(featured.length, 3, 'index.html does not feature three works');

  featured.forEach(([, href, attrs]) => {
    const painting = paintings.find(p => paintingPageUrl(p) === href);
    assert(/aspect-ratio:/.test(attrs),
      'The homepage card for "' + painting.title + '" has no aspect ratio and will be cropped');
    if (ratios[painting.id]) {
      assert(attrs.includes(String(ratios[painting.id])),
        'The homepage card for "' + painting.title + '" does not use its measured ratio');
    }
  });

  paintings.forEach(painting => {
    const html = readWorkPage(painting);
    const thumbs = [...html.matchAll(/<a class="related-work" href="([^"]+)"[\s\S]*?<img([^>]*)>/g)];
    thumbs.forEach(([, href, attrs]) => {
      assert(/aspect-ratio:/.test(attrs),
        painting.id + ': its "Fler verk" thumbnail for ' + href + ' has no aspect ratio');
    });
  });
});

test('The homepage cards come out about the same size', () => {
  // Showing true proportions means the cards differ in shape, but one painting
  // should not tower over another just for being a portrait. The build sizes
  // the columns so the areas match: area = width squared / ratio, so equal
  // area means width proportional to the square root of the ratio.
  const index = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const ratios = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../images/paintings/metadata.json'), 'utf8'));

  const declared = /--featured-columns:\s*([^"]+)"/.exec(index);
  assert(declared, 'index.html does not declare --featured-columns, so the cards will not be balanced');

  const widths = declared[1].trim().split(/\s+/).map(part => {
    const value = Number(part.replace('fr', ''));
    assert(Number.isFinite(value) && value > 0, 'Column width "' + part + '" is not a positive fr value');
    return value;
  });

  const featured = [...index.matchAll(/<a class="featured-card" href="([^"]+)"/g)].map(m => m[1]);
  assertEqual(widths.length, featured.length, '--featured-columns does not cover every featured card');

  const areas = featured.map((href, i) => {
    const painting = paintings.find(p => paintingPageUrl(p) === href);
    const ratio = ratios[painting.id] || (painting.width / painting.height) || 1;
    return (widths[i] * widths[i]) / ratio;
  });

  const spread = Math.max(...areas) / Math.min(...areas);
  assert(spread < 1.15,
    'The featured cards differ in area by ' + Math.round((spread - 1) * 100) + '% — ' +
    'the column widths are not balancing their shapes');
});

test('The "featured" positions in paintings.json are usable', () => {
  // The number is a seat in the homepage row, so two works cannot hold the
  // same one and there are only three seats
  const catalogue = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/paintings.json'), 'utf8'));
  const chosen = catalogue.filter(p => p.featured !== undefined);

  const seats = [];
  chosen.forEach(p => {
    assert(Number.isInteger(p.featured) && p.featured >= 1 && p.featured <= 3,
      p.id + ': "featured" is ' + JSON.stringify(p.featured) + ', not a position from 1 to 3');
    assert(!seats.includes(p.featured),
      p.id + ' and another work both claim featured position ' + p.featured);
    seats.push(p.featured);
  });

  assert(chosen.length <= 3, 'More than three works are marked featured — only three fit');
});

test('The homepage features work that is actually for sale', () => {
  // These were hand-picked and went stale — two of the three had sold, so the
  // strongest page on the site was showcasing work nobody could buy
  const index = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const grid = /<div class="featured-grid"[^>]*>([\s\S]*?)\n {8}<\/div>/.exec(index);
  assert(grid, 'Could not find the featured grid in index.html');

  const links = [...grid[1].matchAll(/<a class="featured-card" href="([^"]+)"/g)].map(m => m[1]);
  assertEqual(links.length, 3, 'index.html does not feature three works');

  const byUrl = new Map(paintings.map(p => [paintingPageUrl(p), p]));
  const available = paintings.filter(p => p.status === 'for_sale' && p.type !== 'bookmark');

  links.forEach(href => {
    const painting = byUrl.get(href);
    assert(painting, 'index.html features ' + href + ', which is not a work page');

    assert(painting.type !== 'bookmark',
      'index.html features the bookmarks, which have no artwork proportions to show at');

    // Sold work is only acceptable on the homepage when there is not enough
    // for sale to fill the row
    assert(painting.status === 'for_sale' || available.length < 3,
      'index.html features "' + painting.title + '", which is sold, while ' +
      available.length + ' works are for sale');
  });
});

test('The sitemap lists every work page', () => {
  const sitemap = fs.readFileSync(path.join(__dirname, '../sitemap.xml'), 'utf8');

  paintings.forEach(painting => {
    const url = SITE + paintingPageUrl(painting);
    assert(sitemap.includes('<loc>' + url + '</loc>'), 'sitemap.xml is missing ' + url);
  });

  // view.html is a redirecting shell now, so it has nothing of its own to index
  assert(!sitemap.includes('/pages/view.html'),
    'sitemap.xml still lists view.html, which now just redirects to a work page');
});

test('Nothing links to a work through the retired query-string URL', () => {
  // Those links still work, but they cost the visitor a redirect and split
  // a work between two addresses
  const offenders = [];

  fs.readdirSync(path.join(__dirname, '../js'))
    .filter(file => file.endsWith('.js'))
    .forEach(file => {
      // Comments still name the old URL, to explain why it is handled at all
      const code = fs.readFileSync(path.join(__dirname, '../js', file), 'utf8')
        .split(/\r?\n/)
        .filter(line => !line.trim().startsWith('//'))
        .join('\n');
      if (/view\.html\?painting=/.test(code)) offenders.push('js/' + file);
    });

  htmlFiles.forEach(file => {
    if (/href="[^"]*view\.html\?painting=/.test(file.content)) offenders.push(path.basename(file.path));
  });

  assert(offenders.length === 0,
    'These link to /pages/view.html?painting=… instead of the work’s own page:\n  ' +
    offenders.join('\n  '));
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
