#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the paintings data from JSON
const paintingsPath = path.join(__dirname, '..', 'data', 'paintings.json');
const paintingsData = JSON.parse(fs.readFileSync(paintingsPath, 'utf8'));

// Read the per-variant bookmark inventory — the source of truth for which
// individual bookmarks are still available
const bookmarksPath = path.join(__dirname, '..', 'data', 'bookmarks.json');
const bookmarksData = JSON.parse(fs.readFileSync(bookmarksPath, 'utf8'));

const bookmarkImagePath = id => `${bookmarksData.imageDir}${id}${bookmarksData.imageExtension}`;
const bookmarkSoldVariants = bookmarksData.variants
  .filter(v => v.status === 'sold')
  .map(v => bookmarkImagePath(v.id));
const bookmarkImageList = [
  bookmarkImagePath(bookmarksData.cover),
  ...bookmarksData.variants.map(v => bookmarkImagePath(v.id)),
];
const allBookmarksSold = bookmarksData.variants.every(v => v.status === 'sold');

// Fold the bookmark inventory into the bookmark product entry so the rest of
// the pipeline sees one shape
paintingsData.forEach(painting => {
  if (painting.type !== 'bookmark') return;
  if (allBookmarksSold) painting.status = 'sold';
  painting.multiBuyDiscountPercent = bookmarksData.multiBuyDiscountPercent;
  painting.soldVariants = bookmarkSoldVariants;
  painting.images = { desktop: bookmarkImageList, mobile: bookmarkImageList };
});

// Transform each painting object to the server format. Bookmarks are priced
// per variant and get their own catalog below.
const serverPaintings = paintingsData.filter(painting => {
  // Only include paintings that have pricing
  return (painting.originalPrice || painting.framedPrice) && painting.type !== 'bookmark';
}).map(painting => {
  const serverPainting = {
    id: painting.id,
    status: painting.status
  };

  if (painting.originalPrice) {
    serverPainting.originalPrice = painting.originalPrice;
  }

  if (painting.framedPrice) {
    serverPainting.framedPrice = painting.framedPrice;
  }

  if (painting.framedOnly) {
    serverPainting.framedOnly = true;
  }

  if (painting.frameAvailable) {
    serverPainting.frameAvailable = true;
  }

  if (typeof painting.discountPercent === 'number') {
    serverPainting.discountPercent = painting.discountPercent;
  }

  return serverPainting;
});

// Generate the formatted PAINTINGS array
const formattedPaintings = serverPaintings.map(painting => {
  const parts = [`  { id: '${painting.id}'`];

  if (painting.originalPrice) {
    parts.push(`originalPrice: ${painting.originalPrice}`);
  }

  if (painting.framedPrice) {
    parts.push(`framedPrice: ${painting.framedPrice}`);
  }

  if (typeof painting.discountPercent === 'number') {
    parts.push(`discountPercent: ${painting.discountPercent}`);
  }

  if (painting.framedOnly) {
    parts.push('framedOnly: true');
  }

  if (painting.frameAvailable) {
    parts.push('frameAvailable: true');
  }

  parts.push(`status: '${painting.status}'`);

  return parts.join(', ') + ' },';
}).join('\n');

// Read the create-checkout.js file
const checkoutPath = path.join(__dirname, '..', 'functions', 'api', 'create-checkout.js');
let checkoutContent = fs.readFileSync(checkoutPath, 'utf8');

// Replace the PAINTINGS array
const paintingsRegex = /const PAINTINGS = \[[\s\S]*?\];/;
const newPaintingsArray = `const PAINTINGS = [
${formattedPaintings}
];`;

checkoutContent = checkoutContent.replace(paintingsRegex, newPaintingsArray);

// Replace the BOOKMARKS catalog so the server can price and reject variants itself
const bookmarkProduct = paintingsData.find(p => p.type === 'bookmark');
if (!bookmarkProduct) {
  throw new Error('No painting entry with type "bookmark" found in paintings.json');
}

const variantEntries = bookmarksData.variants
  .map(v => `    '${v.id}': '${v.status}',`)
  .join('\n');

const newBookmarksCatalog = `const BOOKMARKS = {
  id: '${bookmarkProduct.id}',
  price: ${bookmarkProduct.originalPrice},
  multiBuyDiscountPercent: ${bookmarksData.multiBuyDiscountPercent},
  imageDir: '${bookmarksData.imageDir}',
  imageExtension: '${bookmarksData.imageExtension}',
  variants: {
${variantEntries}
  },
};`;

const bookmarksRegex = /const BOOKMARKS = \{[\s\S]*?\n\};/;
if (!bookmarksRegex.test(checkoutContent)) {
  throw new Error('Could not find BOOKMARKS catalog in create-checkout.js');
}
checkoutContent = checkoutContent.replace(bookmarksRegex, newBookmarksCatalog);

// Write back the updated checkout file
fs.writeFileSync(checkoutPath, checkoutContent);

// Also update paintings.js with the full paintings data
const paintingsJsPath = path.join(__dirname, '..', 'js', 'paintings.js');
let paintingsJsContent = fs.readFileSync(paintingsJsPath, 'utf8');

// Serialize a nested value as JS literal, indented to sit inside a painting entry
function indentJson(value) {
  return JSON.stringify(value, null, 2)
    .replace(/^(\s*)"([A-Za-z_$][\w$]*)":/gm, '$1$2:')
    .split('\n')
    .map((line, i) => (i === 0 ? line : '    ' + line))
    .join('\n');
}

// Generate the full paintings array for client-side
const clientPaintings = paintingsData.map(painting => {
  const clientPainting = {
    id: `"${painting.id}"`,
    title: `"${painting.title}"`,
    descKey: `"${painting.descKey}"`,
    status: painting.status === 'sold' ? 'STATUS.SOLD' :
            painting.status === 'personal' ? 'STATUS.PERSONAL' : 'STATUS.FOR_SALE',
    medium: 'MEDIUM.ACRYLIC_CANVAS'
  };

  if (painting.width) clientPainting.width = painting.width;
  if (painting.height) clientPainting.height = painting.height;
  if (painting.diameter) clientPainting.diameter = painting.diameter;
  if (painting.shape) {
    clientPainting.shape = painting.shape === 'rectangular' ? 'SHAPE.RECTANGULAR' :
                          painting.shape === 'circle' ? 'SHAPE.CIRCLE' : 'SHAPE.RECTANGULAR';
  }
  if (painting.originalPrice) clientPainting.originalPrice = painting.originalPrice;
  if (painting.framedPrice) clientPainting.framedPrice = painting.framedPrice;
  if (typeof painting.discountPercent === 'number') clientPainting.discountPercent = painting.discountPercent;
  if (painting.framedOnly) clientPainting.framedOnly = true;
  if (painting.frameAvailable) clientPainting.frameAvailable = true;
  if (painting.type) {
    clientPainting.type = painting.type === 'clay' ? 'TYPE.CLAY' :
                          painting.type === 'bookmark' ? 'TYPE.BOOKMARK' : 'TYPE.PAINTING';
  }
  if (typeof painting.multiBuyDiscountPercent === 'number') {
    clientPainting.multiBuyDiscountPercent = painting.multiBuyDiscountPercent;
  }
  if (painting.soldVariants) clientPainting.soldVariants = indentJson(painting.soldVariants);
  if (painting.images) clientPainting.images = indentJson(painting.images);

  return clientPainting;
});

const formattedClientPaintings = clientPaintings.map(painting => {
  const parts = [`  {`];
  const entries = Object.entries(painting).map(([key, value]) => `    ${key}: ${value}`);
  parts.push(entries.join(',\n'));
  parts.push('  },');
  return parts.join('\n');
}).join('\n');

const clientPaintingsRegex = /const paintings = \[[\s\S]*?\];/;
const newClientPaintingsArray = `const paintings = [
${formattedClientPaintings}
];`;

paintingsJsContent = paintingsJsContent.replace(clientPaintingsRegex, newClientPaintingsArray);
fs.writeFileSync(paintingsJsPath, paintingsJsContent);

console.log(`Updated PAINTINGS array in create-checkout.js with ${serverPaintings.length} paintings`);
console.log(`Updated paintings array in paintings.js with ${clientPaintings.length} paintings`);