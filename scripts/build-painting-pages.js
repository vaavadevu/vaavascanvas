#!/usr/bin/env node

// build-painting-pages.js — gives every work a page and a URL of its own.
//
// Until this existed the whole catalogue lived at /pages/view.html?painting=<id>:
// one title, one description and one share image for all of them. Nothing could
// rank for a motif and every shared link previewed the wrong painting.
//
// This writes one static page per work beside the shop at /pictures/,
// regenerates sitemap.xml, and rewrites the product structured data on the shop
// page itself. All three are generated from data/paintings.json so none of them
// can drift out of date — the hand-written shop markup had been advertising
// sold works as in stock and listing four paintings that no longer existed.
//
// Run through `npm run build`; it is called at the end of build-paintings.js.

const fs = require('fs');
const path = require('path');

const { keys } = require('../js/translations.js');
const {
  SHAPE,
  STATUS,
  TYPE,
  SHOP_DIR,
  SHOP_URL,
  paintingSlug,
  paintingPageUrl,
  paintingPageTitle,
  paintingDimensions,
  getPriceModel,
} = require('../js/paintings.js');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://vaavascanvas.se';
// /pictures/ holds the shop's own index.html plus one page per work
const PAGE_DIR = path.join(ROOT, SHOP_DIR.replace(/^\//, ''));
const SHOP_INDEX = 'index.html';
const ARTIST_ID = `${SITE}/#artist`;

// The generated pages sit one directory below the site root, the same depth as
// /pages/, so view.html's relative asset paths ("../js/…") resolve unchanged
// and the template can be reused verbatim. Moving the shop is a matter of
// changing SHOP_DIR in js/paintings.js — as long as it stays one level deep.
const TEMPLATE_PATH = path.join(ROOT, 'pages', 'view.html');

// ── Small helpers ─────────────────────────────────────────────

const sv = key => {
  const entry = keys[key];
  if (!entry || !entry.sv) throw new Error(`No Swedish translation for "${key}" in js/translations.js`);
  return entry.sv;
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Replaces the whole element or tag matched by `pattern`, and fails loudly if
// the template stops containing it — a silent miss would ship a page carrying
// another work's title.
function replaceOne(html, pattern, replacement, what) {
  const matches = html.match(pattern);
  if (!matches || matches.length !== 1) {
    throw new Error(
      `Expected exactly one ${what} in pages/view.html, found ${matches ? matches.length : 0}. ` +
      `The template changed shape — update scripts/build-painting-pages.js to match.`
    );
  }
  return html.replace(pattern, () => replacement);
}

// ── Facts about one work ──────────────────────────────────────

function firstImage(painting) {
  if (painting.images && Array.isArray(painting.images.desktop) && painting.images.desktop.length) {
    return painting.images.desktop[0];
  }
  return `/images/paintings/${painting.id}/desktop/01.jpg`;
}

function isSold(painting) {
  return painting.status === STATUS.SOLD;
}

// Meta descriptions get truncated by search engines around 155 characters, so
// the sentence that sells the work comes first and the facts follow.
function metaDescription(painting) {
  const price = getPriceModel(painting);
  const size = paintingDimensions(painting);

  const facts = [sv(painting.medium), size].filter(Boolean).join(', ');
  const availability = isSold(painting)
    ? 'Såld – beställ något liknande.'
    : price.status === 'priced'
      ? `${price.price} kr – köp direkt online.`
      : 'Kontakta mig för pris.';

  const sentence = sv(painting.descKey).trim();
  return `${sentence} ${facts}. ${availability}`.replace(/\s+/g, ' ').trim();
}

// ── Structured data ───────────────────────────────────────────

function offerSchema(painting, url) {
  const price = getPriceModel(painting);
  if (price.status !== 'priced') {
    // A sold one-off still gets an offer node, marked sold, so search results
    // stop advertising it as available
    if (!isSold(painting)) return null;
    return {
      '@type': 'Offer',
      url,
      priceCurrency: 'SEK',
      availability: 'https://schema.org/SoldOut',
      seller: { '@id': ARTIST_ID },
    };
  }

  return {
    '@type': 'Offer',
    url,
    price: String(price.price),
    priceCurrency: 'SEK',
    availability: isSold(painting) ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': ARTIST_ID },
  };
}

function measurement(value) {
  return { '@type': 'QuantitativeValue', value, unitCode: 'CMT' };
}

function workSchema(painting) {
  const url = `${SITE}${paintingPageUrl(painting)}`;

  // Bookmarks are a run of small printed pieces rather than a single artwork,
  // so they are described as a plain Product
  const isArtwork = painting.type !== TYPE.BOOKMARK;

  const node = {
    '@type': isArtwork ? 'VisualArtwork' : 'Product',
    '@id': `${url}#work`,
    name: painting.title,
    description: sv(painting.descKey),
    image: `${SITE}${firstImage(painting)}`,
    url,
  };

  if (isArtwork) {
    node.artMedium = sv(painting.medium);
    node.artform = 'Målning';
    node.creator = { '@type': 'Person', '@id': ARTIST_ID, name: 'Devika' };
    if (painting.shape === SHAPE.CIRCLE && painting.diameter) {
      node.size = `${painting.diameter} cm diameter`;
    }
    if (painting.width) node.width = measurement(painting.width);
    if (painting.height) node.height = measurement(painting.height);
  } else {
    node.brand = { '@type': 'Person', '@id': ARTIST_ID, name: 'Devika' };
  }

  const offers = offerSchema(painting, url);
  if (offers) node.offers = offers;

  return node;
}

function breadcrumbSchema(painting) {
  const url = `${SITE}${paintingPageUrl(painting)}`;
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startsida', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Butik', item: `${SITE}${SHOP_URL}` },
      { '@type': 'ListItem', position: 3, name: painting.title, item: url },
    ],
  };
}

function pageSchema(painting) {
  return JSON.stringify(
    { '@context': 'https://schema.org', '@graph': [workSchema(painting), breadcrumbSchema(painting)] },
    null,
    2
  );
}

// ── Pre-rendered content ──────────────────────────────────────
//
// page-view.js fills these elements in on load. Writing the same values into
// the HTML means a crawler that does not run scripts still reads a real page,
// and a visitor sees the work instead of an empty frame while the scripts boot.

function priceSectionHtml(painting) {
  const price = getPriceModel(painting);

  if (price.status === 'sold') {
    return `<p style="color:red;">${escapeHtml(sv('status_sold'))}</p>`;
  }
  if (price.status === 'personal') {
    return `<p>${escapeHtml(sv('status_personal'))}</p>`;
  }
  if (price.status !== 'priced') return '';

  const lines = [`<p class="pageview-price">${price.price} kr</p>`];
  if (price.oldPrice !== null) {
    lines.push(`<p class="pageview-old-price">${price.oldPrice} kr</p>`);
    lines.push(
      `<p class="pageview-discount-note">-${price.discountPercent}% ${escapeHtml(sv('pageview_discount_text'))}</p>`
    );
  }
  return lines.join('\n          ');
}

function renderPage(template, painting) {
  const url = `${SITE}${paintingPageUrl(painting)}`;
  const title = paintingPageTitle(painting, sv(painting.medium));
  const description = metaDescription(painting);
  const image = `${SITE}${firstImage(painting)}`;
  const size = paintingDimensions(painting) || '';

  let html = template;

  html = replaceOne(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`, '<title>');

  html = replaceOne(
    html,
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    'description meta tag'
  );

  // The template is a shell that redirects, and carries noindex to say so. A
  // generated page is the real thing and must never inherit it.
  html = replaceOne(html, /\s*<meta name="robots"[^>]*>/, '', 'robots meta tag');
  html = replaceOne(
    html,
    /\s*<!-- This page is a shell:[\s\S]*?-->/,
    '',
    "comment explaining the shell's noindex"
  );

  html = replaceOne(
    html,
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${url}" />\n\n` +
      `  <!-- hreflang: one page serves both languages, switched in the browser -->\n` +
      `  <link rel="alternate" hreflang="sv" href="${url}" />\n` +
      `  <link rel="alternate" hreflang="en" href="${url}" />\n` +
      `  <link rel="alternate" hreflang="x-default" href="${url}" />`,
    'canonical link'
  );

  html = replaceOne(html, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="product" />`, 'og:type tag');
  html = replaceOne(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`, 'og:url tag');
  html = replaceOne(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeHtml(title)}" />`, 'og:title tag');
  html = replaceOne(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeHtml(description)}" />`, 'og:description tag');
  html = replaceOne(html, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}" />`, 'og:image tag');

  html = replaceOne(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`, 'twitter:title tag');
  html = replaceOne(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`, 'twitter:description tag');
  html = replaceOne(html, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}" />`, 'twitter:image tag');

  // Structured data goes right after </head>, where the other pages keep theirs
  html = replaceOne(
    html,
    /<\/head>/,
    `</head>\n\n<!-- Schema.org structured data -->\n<script type="application/ld+json">\n${pageSchema(painting)}\n</script>`,
    '</head>'
  );

  // Tells page-view.js which work this page is, so it needs no query string
  html = replaceOne(
    html,
    /<body id="main">/,
    `<body id="main" data-painting-id="${escapeHtml(painting.id)}">`,
    '<body> tag'
  );

  // Pre-render what page-view.js would otherwise paint in after boot
  html = replaceOne(
    html,
    /<img id="pageview-img" src="" alt="" \/>/,
    `<img id="pageview-img" src="${escapeHtml(firstImage(painting))}" alt="${escapeHtml(painting.title)}" />`,
    'page view image'
  );

  html = replaceOne(
    html,
    /<h3 id="pageview-title"><\/h3>/,
    `<h1 id="pageview-title">${escapeHtml(painting.title)}</h1>`,
    'page view title element'
  );

  html = replaceOne(
    html,
    /<div id="pageview-price-section"><\/div>/,
    `<div id="pageview-price-section">\n          ${priceSectionHtml(painting)}\n        </div>`,
    'price section'
  );

  html = replaceOne(html, /<p id="pageview-size"><\/p>/, `<p id="pageview-size">${escapeHtml(size)}</p>`, 'size element');
  html = replaceOne(
    html,
    /<p id="pageview-desc"><\/p>/,
    `<p id="pageview-desc">${escapeHtml(sv(painting.descKey))}</p>`,
    'description element'
  );
  html = replaceOne(
    html,
    /<p id="pageview-medium"><\/p>/,
    `<p id="pageview-medium">${escapeHtml(sv(painting.medium))}</p>`,
    'medium element'
  );

  const banner =
    '<!-- GENERATED FILE — do not edit.\n' +
    '     Written by scripts/build-painting-pages.js from data/paintings.json\n' +
    '     and pages/view.html. Run `npm run build` after changing either. -->\n';

  return banner + html;
}

// ── Shop page structured data ─────────────────────────────────
//
// The hasPart list on the shop page used to be maintained by hand and had
// drifted: two sold paintings were still advertised as in stock and four
// entries named works that had been removed from the catalogue. Generating it
// keeps Google's copy of the prices honest.

function updateShopSchema(paintings) {
  const shopPath = path.join(PAGE_DIR, SHOP_INDEX);
  let html = fs.readFileSync(shopPath, 'utf8');

  const hasPart = paintings.map(painting => {
    const node = workSchema(painting);
    // The shop page links each entry to the page that describes it in full
    return { '@type': node['@type'], name: node.name, url: node.url, image: node.image, offers: node.offers };
  });

  const block = JSON.stringify(hasPart, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : '  ' + line))
    .join('\n');

  const pattern = /"hasPart": \[[\s\S]*?\n  \]/;
  if (!pattern.test(html)) {
    throw new Error(`Could not find the hasPart list in ${SHOP_URL}${SHOP_INDEX}`);
  }

  html = html.replace(pattern, () => `"hasPart": ${block}`);
  fs.writeFileSync(shopPath, html);
  return hasPart.length;
}

// ── Sitemap ───────────────────────────────────────────────────

function writeSitemap(paintings) {
  const today = new Date().toISOString().slice(0, 10);

  // view.html is deliberately absent: it is now a shell that redirects to the
  // work's own page, so it has nothing of its own to index.
  const staticPages = [
    { loc: `${SITE}/`, changefreq: 'monthly', priority: '1.0' },
    { loc: `${SITE}${SHOP_URL}`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE}/pages/commissions.html`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${SITE}/pages/portfolio.html`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE}/pages/blog.html`, changefreq: 'weekly', priority: '0.6' },
  ];

  const workPages = paintings.map(painting => ({
    loc: `${SITE}${paintingPageUrl(painting)}`,
    changefreq: 'weekly',
    // Available work is what there is to sell, so it is what crawlers should
    // revisit first
    priority: painting.status === STATUS.FOR_SALE ? '0.8' : '0.5',
  }));

  const entries = [...staticPages, ...workPages]
    .map(
      page =>
        `  <url>\n` +
        `    <loc>${page.loc}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        `    <changefreq>${page.changefreq}</changefreq>\n` +
        `    <priority>${page.priority}</priority>\n` +
        `  </url>`
    )
    .join('\n\n');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!-- GENERATED FILE — written by scripts/build-painting-pages.js. Run \`npm run build\`. -->\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n` +
    `${entries}\n\n` +
    `</urlset>\n`;

  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  return staticPages.length + workPages.length;
}

// ── Entry point ───────────────────────────────────────────────

function buildPaintingPages(paintings) {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // Slugs become URLs, so a collision would silently overwrite a work's page
  const bySlug = new Map();
  paintings.forEach(painting => {
    const slug = paintingSlug(painting);
    if (bySlug.has(slug)) {
      throw new Error(`Paintings "${bySlug.get(slug)}" and "${painting.id}" both slugify to "${slug}"`);
    }
    bySlug.set(slug, painting.id);
  });

  fs.mkdirSync(PAGE_DIR, { recursive: true });

  // Clear out pages for works that have since been removed from the catalogue
  // SHOP_INDEX is the shop itself, not a generated work page — it lives here
  // so the listing and the things it lists share one address space
  const wanted = new Set([SHOP_INDEX, ...[...bySlug.keys()].map(slug => `${slug}.html`)]);
  fs.readdirSync(PAGE_DIR)
    .filter(file => file.endsWith('.html') && !wanted.has(file))
    .forEach(file => fs.unlinkSync(path.join(PAGE_DIR, file)));

  paintings.forEach(painting => {
    fs.writeFileSync(path.join(PAGE_DIR, `${paintingSlug(painting)}.html`), renderPage(template, painting));
  });

  const shopEntries = updateShopSchema(paintings);
  const sitemapEntries = writeSitemap(paintings);

  console.log(`Wrote ${paintings.length} work pages to ${SHOP_URL}`);
  console.log(`Updated hasPart structured data in ${SHOP_URL}${SHOP_INDEX} with ${shopEntries} products`);
  console.log(`Wrote sitemap.xml with ${sitemapEntries} URLs`);
}

module.exports = { buildPaintingPages, paintingSlug, workSchema, metaDescription };
