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

// ── Where a page leads ────────────────────────────────────────

// Six other works to end the page with. Without these each page is an island:
// a visitor who does not want this particular painting has only the back
// button, and a crawler reaches the catalogue through the shop page alone.
//
// Available work comes first, because that is what there is to sell, and the
// list starts from the neighbours of the work being shown so no two pages
// offer the same six. Walking the catalogue in order keeps it deterministic —
// a rebuild that changed nothing must not rewrite 34 files.
//
// Bookmarks are among them: each one is a piece of its own, photographed like
// the rest. Only the homepage's three featured cards leave them out.
function relatedWorks(painting, all, count = 6) {
  const others = all.filter(other => other.id !== painting.id);
  const from = all.indexOf(painting);
  const rotated = others.map((_, i) => others[(from + i) % others.length]);

  const available = rotated.filter(other => other.status === STATUS.FOR_SALE);
  const sold = rotated.filter(other => other.status !== STATUS.FOR_SALE);

  return [...available, ...sold].slice(0, count);
}

function relatedWorksHtml(painting, all) {
  const ratios = imageAspectRatios();

  const cards = relatedWorks(painting, all).map(other => {
    const soldFlag = other.status === STATUS.SOLD
      ? `\n          <span class="related-work-sold" data-i18n="modal_sold">${escapeHtml(sv('modal_sold'))}</span>`
      : '';

    // Same reason as the homepage cards: a thumbnail cropped to a common
    // shape shows a different painting than the one it links to
    const ratio = aspectRatioFor(other, ratios);
    const style = ratio ? ` style="aspect-ratio: ${ratio}"` : '';

    return [
      `        <a class="related-work" href="${paintingPageUrl(other)}">`,
      `          <img src="${escapeHtml(firstImage(other))}" alt="${escapeHtml(other.title)}"${style} loading="lazy" />${soldFlag}`,
      `          <span class="related-work-title">${escapeHtml(other.title)}</span>`,
      `        </a>`,
    ].join('\n');
  });

  return [
    '',
    '    <section class="related-works">',
    `      <h2 data-i18n="pageview_more_works">${escapeHtml(sv('pageview_more_works'))}</h2>`,
    '      <div class="related-works-grid">',
    ...cards,
    '      </div>',
    `      <a class="related-works-all" href="${SHOP_URL}" data-i18n="featured_see_all">${escapeHtml(sv('featured_see_all'))}</a>`,
    '    </section>',
    '  </main>',
  ].join('\n');
}

// page-view.js rebuilds these on load in the visitor's language; writing the
// Swedish version in means the way onward from a sold work is in the markup,
// not only in the script.
function buttonsHtml(painting) {
  if (painting.status !== STATUS.SOLD) return '';

  const commission =
    `<a class="btn btn-primary pageview-sold-btn" ` +
    `href="/pages/commissions.html?type=Commissions&amp;ref=${escapeHtml(painting.id)}#footer" ` +
    `data-i18n="pageview_sold_commission_btn">${escapeHtml(sv('pageview_sold_commission_btn'))}</a>`;

  const notify =
    `<button type="button" class="btn btn-secondary pageview-sold-btn subscribe-open" ` +
    `data-i18n="pageview_sold_notify_btn">${escapeHtml(sv('pageview_sold_notify_btn'))}</button>`;

  return `
          ${commission}
          ${notify}
        `;
}

function renderPage(template, painting, all) {
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
    /<div id="pageview-buttons"><\/div>/,
    `<div id="pageview-buttons">${buttonsHtml(painting)}</div>`,
    'buttons container'
  );

  html = replaceOne(
    html,
    /<p id="pageview-medium"><\/p>/,
    `<p id="pageview-medium">${escapeHtml(sv(painting.medium))}</p>`,
    'medium element'
  );

  // Ends the page with somewhere to go next, just inside </main>
  html = replaceOne(html, /\n  <\/main>/, relatedWorksHtml(painting, all), 'closing </main>');

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

// ── Homepage ──────────────────────────────────────────────────
//
// The three featured cards used to be hand-written markup, and went stale: two
// of the three had sold, so the strongest page on the site was showcasing work
// nobody could buy — and they were plain divs, linking nowhere.
//
// Which works appear is still a choice, made in data/paintings.json with
// `"featured": 1`, `2`, `3` — the number is the position in the row, and the
// first card is the wide one. What is no longer left to chance is that they
// are for sale: a featured work that sells drops out and the build says so, so
// the homepage cannot quietly advertise something that is gone.

const FEATURED_COUNT = 3;

function featuredWorks(paintings) {
  const eligible = paintings.filter(p => p.type !== TYPE.BOOKMARK);
  const available = eligible.filter(p => p.status === STATUS.FOR_SALE);

  const chosen = eligible
    .filter(p => typeof p.featured === 'number')
    .sort((a, b) => a.featured - b.featured);

  const sold = chosen.filter(p => p.status !== STATUS.FOR_SALE);
  const showing = chosen.filter(p => p.status === STATUS.FOR_SALE);

  if (sold.length > 0) {
    console.log(
      `  Note: ${sold.map(p => p.title).join(', ')} ` +
      `${sold.length === 1 ? 'is' : 'are'} marked "featured" but sold — ` +
      `pick another in data/paintings.json`
    );
  }

  // Newest first, because the stub script appends new works to the end of the
  // catalogue. Only used to fill seats the choices left empty.
  const fallback = [...available].reverse().filter(p => !showing.includes(p));

  return [...showing, ...fallback].slice(0, FEATURED_COUNT);
}

// Measured from the image files by the image sync. The gallery already sizes
// its tiles from these; the homepage used to crop every painting to 3:4, which
// cost a near-square work like Min mamma a fifth of itself and would take half
// of a landscape one.
function imageAspectRatios() {
  const file = path.join(ROOT, 'images', 'paintings', 'metadata.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}

function aspectRatioFor(painting, ratios) {
  if (ratios[painting.id]) return String(ratios[painting.id]);
  if (painting.shape === SHAPE.CIRCLE) return '1 / 1';
  // A painting's photo is the painting, so its measurements are the shape of
  // the picture too. A bookmark is photographed lying on a table, so its
  // 5×15 cm say nothing about the shape of the photo — the measured ratio
  // above is the only thing that does.
  if (painting.type === TYPE.BOOKMARK) return null;
  if (painting.width && painting.height) return `${painting.width} / ${painting.height}`;
  return null;
}

// As a number, for working out how wide a card wants to be
function aspectRatioValue(painting, ratios) {
  if (ratios[painting.id]) return Number(ratios[painting.id]);
  if (painting.shape === SHAPE.CIRCLE) return 1;
  if (painting.type === TYPE.BOOKMARK) return 1;
  if (painting.width && painting.height) return painting.width / painting.height;
  return 1;
}

// Column widths that give the three cards roughly equal area, so a portrait
// and a near-square painting carry the same visual weight instead of one
// towering over the other. Area is width x height and height is width/ratio,
// so area = width² / ratio — equal area therefore means width ∝ √ratio.
//
// This is the compromise between the two things that both matter: nothing gets
// cropped, and no painting dominates the row just because of its shape. Widths
// go out as a custom property rather than as grid-template-columns, because
// responsive.css restacks this grid at two breakpoints and an inline property
// would win against those media queries.
function featuredColumns(chosen, ratios) {
  const weights = chosen.map(painting => Math.sqrt(aspectRatioValue(painting, ratios)));
  const total = weights.reduce((sum, w) => sum + w, 0);

  return weights.map(w => `${(w / total).toFixed(4)}fr`).join(' ');
}

function featuredCardHtml(painting, ratios) {
  const desktop = firstImage(painting);
  const mobile = desktop.replace('/desktop/', '/mobile/');
  const ratio = aspectRatioFor(painting, ratios);
  const style = ratio ? ` style="aspect-ratio: ${ratio}"` : '';

  return [
    `          <a class="featured-card" href="${paintingPageUrl(painting)}">`,
    '            <picture>',
    `              <source media="(max-width: 768px)" srcset="${escapeHtml(mobile)}">`,
    `              <img src="${escapeHtml(desktop)}" alt="${escapeHtml(painting.title)}"${style} />`,
    '            </picture>',
    `            <div class="featured-card-label">${escapeHtml(painting.title)}</div>`,
    '          </a>',
  ].join('\n');
}

function updateHomepageFeatured(paintings) {
  const indexPath = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  const chosen = featuredWorks(paintings);
  const ratios = imageAspectRatios();
  const grid = [
    `<div class="featured-grid" style="--featured-columns: ${featuredColumns(chosen, ratios)}">`,
    ...chosen.map(painting => featuredCardHtml(painting, ratios)),
    '        </div>',
  ].join('\n');

  // Matches the grid whether or not it already carries the column widths this
  // function writes — the build has to be able to run twice
  const pattern = /<div class="featured-grid"[^>]*>[\s\S]*?\n        <\/div>/;
  if (!pattern.test(html)) {
    throw new Error('Could not find the featured grid in index.html');
  }

  html = html.replace(pattern, () => grid);
  fs.writeFileSync(indexPath, html);
  return chosen;
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
    fs.writeFileSync(
      path.join(PAGE_DIR, `${paintingSlug(painting)}.html`),
      renderPage(template, painting, paintings)
    );
  });

  const shopEntries = updateShopSchema(paintings);
  const featured = updateHomepageFeatured(paintings);
  const sitemapEntries = writeSitemap(paintings);

  console.log(`Wrote ${paintings.length} work pages to ${SHOP_URL}`);
  console.log(`Updated hasPart structured data in ${SHOP_URL}${SHOP_INDEX} with ${shopEntries} products`);
  console.log(`Featured on the homepage: ${featured.map(p => p.title).join(', ')}`);
  console.log(`Wrote sitemap.xml with ${sitemapEntries} URLs`);
}

module.exports = { buildPaintingPages, paintingSlug, workSchema, metaDescription, featuredWorks };
