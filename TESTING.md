# Vaavascanvas Testing Guide

This project includes four levels of automated testing:

1. **Data Validation Tests** - Check data consistency and structure (runs instantly)
2. **Cart Unit Tests** - Call the cart's money rules and add-to-cart rules directly, with no browser involved (runs instantly)
3. **Checkout Logic Tests** - Run the real payment function against a stubbed Stripe to check what customers can actually be charged (runs instantly)
4. **End-to-End (E2E) Tests** - Open actual pages in a browser, test user interactions, check for errors (takes ~30 seconds)

All four suites run on every push and pull request to catch issues before deployment.

## What Gets Tested

### 1. **Paintings Data Validation**
- All paintings have unique IDs
- All paintings have required fields (`id`, `title`, `descKey`, `size`, `status`)
- All painting statuses are valid (FOR_SALE, SOLD, or PERSONAL)
- FOR_SALE and SOLD paintings have a price (`originalPrice`)
- All painting description keys reference existing translations

### 2. **Image Inventory Validation**
- Every painting resolves to an image file that actually exists on disk
- All painting IDs in `counts.json` exist in `paintings.js`, and every painting using the folder convention has a `counts.json` entry
- `counts.json` matches the number of images actually on disk
- `bookmarks.json` is a valid inventory, and the generated copies in `paintings.js` and `create-checkout.js` are in sync with it

### 3. **Translation System Validation**
- All translation keys have both Swedish (`sv`) and English (`en`) versions
- No translation keys have unexpected languages
- Translation text is non-empty

### 4. **HTML & Translation References**
- All `data-i18n` attributes in HTML files reference existing translation keys
- All `data-i18n-ph` (placeholder) attributes reference existing translation keys

### 5. **Form Logic Validation**
- The "Prints" dropdown includes all paintings on purpose (a sold original can still be ordered as a print), so every entry must have a preview image that resolves

### 6. **Gallery Logic Validation**
- The real `sortPaintings()` from `gallery.js` puts for-sale first, biggest discounts first within that, then sold
- A sold painting is never sorted ahead of an available one
- Frame pricing is coherent (`framedPrice` above `originalPrice`, `framedOnly` has no `originalPrice`)

### 7. **Cart Math Unit Tests** (`tests/cart-math.js`)
Calls the functions in `js/cart-math.js` directly — no browser, no DOM, no data
files — so these check the arithmetic a buyer is shown in the cart drawer:
- Subtotals and the badge count, including items stored without an explicit quantity
- The free-shipping threshold, including the boundary itself (a cart landing exactly
  on the threshold ships free)
- EU orders always pay EU shipping, whatever the subtotal
- Bookmark group pricing: one piece pays full price, reaching the threshold reprices
  every piece, and a stray quantity does not unlock the discount
- Stale prices in a `localStorage` cart are overridden by the catalog, and the cart
  still totals sensibly when the catalog is missing entirely
- Which cart lines get a struck-through "was" price

### 8. **Cart Rules Unit Tests** (`tests/cart-rules.js`)
Calls the functions in `js/cart-rules.js` directly — these decide what may go in
the cart, as opposed to what it costs:
- A one-of-a-kind piece (an original, a bookmark variant) cannot be added twice
- Adding the framed version of a painting swaps out the unframed one rather than
  selling the same canvas twice, and vice versa — matched on the id's `-framed`
  suffix, so carts saved before `paintingBaseId` existed still work
- Replacing removes only the matching painting, leaving the rest of the cart alone
- Repeatable products raise their quantity, and two sizes stay two separate lines
- Checkout reports every blocker at once (no country, unaccepted terms, or both)
  so the buyer is not made to discover them one at a time

### 9. **Checkout Logic Tests** (`tests/checkout.js`)
Runs the real `functions/api/create-checkout.js` with Stripe stubbed out, so these
check behaviour rather than data:
- Client-supplied prices are ignored — the server charges its own catalog price
- Sold paintings and sold bookmarks are rejected; one sold item rejects the whole order
- Quantities are floored to whole positive numbers, and bookmarks are capped at one each
- The same bookmark cannot be ordered twice, and the set cannot be bought as a single product
- Multi-buy bookmark pricing (first full price, rest discounted) matches `bookmarks.json`
- Shipping matches the threshold, Swedish, and EU rates
- The pricing helpers duplicated in `js/paintings.js` and `create-checkout.js` produce identical results

### 10. **End-to-End Browser Tests** (E2E)
- Main page loads without JavaScript console errors
- Hero section renders correctly
- Gallery displays all paintings
- All gallery images load without 404 errors
- Clicking a painting navigates to page view
- Language switching works (Swedish ↔ English)
- Contact form is present and accessible
- Paintings page loads without errors

## Running Tests Locally

### Prerequisites
- Node.js 18+ installed
- npm (comes with Node.js)

### First Time Setup
```bash
npm install
npx playwright install chromium
```

### Run All Tests
```bash
npm test
```

This runs validation, cart math, cart rules, checkout, and E2E tests sequentially.

### Run Only Validation Tests (Fast)
```bash
node tests/validate.js
```

### Run Only Cart Unit Tests (Fast)
```bash
node tests/cart-math.js
node tests/cart-rules.js
```

### Run Only Checkout Tests (Fast)
```bash
node tests/checkout.js
```

### Run Only E2E Tests (Slower)
```bash
node tests/e2e.js
```

### Expected Output
When all tests pass, you should see:
```
═══════════════════════════════════════════════════════════
VAAVASCANVAS PRE-DEPLOYMENT VALIDATION TESTS
═══════════════════════════════════════════════════════════

[1] PAINTINGS DATA VALIDATION
✓ All paintings have unique IDs
✓ All paintings have required fields
✓ All painting statuses are valid
...

✓ All validation tests passed! Site is ready to deploy.

═══════════════════════════════════════════════════════════
VAAVASCANVAS END-TO-END TESTS
═══════════════════════════════════════════════════════════

[1] MAIN PAGE TESTS
✓ Main page loads without console errors
✓ Hero section is rendered
✓ Gallery renders all 17 paintings
✓ Gallery images load successfully

[2] PAGE VIEW TESTS
✓ Page view loads when clicking a painting
✓ Page view images load without 404 errors

[3] LANGUAGE SWITCHING TESTS
✓ Language switching to English works

[4] FORM TESTS
✓ Contact form is present
✓ Paintings page loads without errors

═══════════════════════════════════════════════════════════
E2E TEST RESULTS
═══════════════════════════════════════════════════════════

Total tests: 9
Passed: 9
Failed: 0

✓ All E2E tests passed!
```

## Why Several Types of Tests?

### Unit Tests (Fast - well under a second)
✓ Call one function directly with fixed inputs
✓ Pin down boundaries and edge cases cheaply (thresholds, empty carts, missing fields)
✓ Fail with a message naming the exact rule that broke

✗ Won't catch anything about how the function is wired into a page
✗ Only cover code that has been separated out from the DOM (currently `js/cart-math.js` and `js/cart-rules.js`)

### Data Validation Tests (Fast - ~1 second)
✓ Catch data structure problems (missing fields, wrong types)
✓ Find translation/reference mismatches
✓ Verify data consistency

✗ Won't catch runtime JavaScript errors
✗ Won't catch broken image paths that return 404
✗ Won't catch missing DOM elements
✗ Won't catch runtime interaction bugs

### E2E Tests (Slower - ~30 seconds)
✓ Actually opens pages in a real browser
✓ Catches JavaScript console errors
✓ Verifies images load (404 detection)
✓ Tests page view navigation
✓ Tests language switching
✓ Tests form presence and accessibility
✓ Catches runtime bugs that data tests miss

Together, they provide comprehensive coverage before deployment.

## Automated Testing with GitHub Actions

Tests automatically run:
- On every **push** to the `main` branch
- On every **pull request** to the `main` branch

### View Test Results
1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Pre-deployment Validation** workflow
4. Check the status of your latest run

### Failing Tests
If a test fails, the workflow will:
- Show a clear error message indicating what failed
- Block the deployment until the issue is fixed

## Debugging Test Failures

### Running Tests with More Details
If a test fails, you can get more information by:
1. Running tests locally with `npm test`
2. Looking at the specific error message
3. Checking the browser console for JavaScript errors

### Common Data Validation Issues & Fixes

### Issue: "Painting XYZ: descKey not found in translations"
**Fix:** Add the missing translation key to `js/translations.js`
```javascript
desc_myPainting: {
  sv: "Swedish description here",
  en: "English description here"
}
```

### Issue: "counts.json contains unknown painting ID"
**Fix:** Either:
- Remove the ID from `counts.json` if the painting was deleted, OR
- Add the painting to `paintings.js` in `js/paintings.js`

### Issue: "FOR_SALE painting missing originalPrice"
**Fix:** Add `originalPrice` to any FOR_SALE or SOLD paintings:
```javascript
{
  id: "myPainting",
  title: "My Painting",
  descKey: "desc_myPainting",
  size: "42 x 59 cm",
  originalPrice: 1500,  // Add this!
  status: STATUS.FOR_SALE,
}
```

### Issue: "Translation key missing English (en) version"
**Fix:** Add the English version to any incomplete translation keys in `js/translations.js`

### Issue: "HTML file references unknown translation key"
**Fix:** Either:
- Add the missing translation key to `js/translations.js`, OR
- Remove/update the `data-i18n` attribute in your HTML file

## Common E2E Test Issues & Fixes

### Issue: "Main page loads without console errors - Console errors found"
**Fix:** Check the browser console for JavaScript errors:
- Look for undefined variables or functions
- Check that all required JS files are loaded
- Verify utilities.js, gallery.js, i18n.js are properly initialized

### Issue: "Gallery renders all paintings - Gallery item count mismatch"
**Fix:** Make sure:
- All paintings in `js/paintings.js` have unique IDs
- The gallery container exists with ID `gallery`
- Gallery is being populated in the page initialization

### Issue: "Gallery images load successfully - Failed to load images"
**Fix:** Verify image paths:
- Check that image directories exist: `images/paintings/{paintingId}/desktop/`
- Confirm image files are named correctly: `01.jpg`, `02.jpg`, etc.
- Ensure the image counts in `counts.json` match actual files

### Issue: "Clicking a painting - Navigation did not work"
**Fix:** Check page view functionality:
- Verify gallery items have click handlers
- Check that view.html page exists
- Ensure `USE_PAGE_VIEW` is set to true in gallery.js

### Issue: "Language switching to English works - Language did not switch"
**Fix:** Make sure:
- Language buttons exist with `data-lang` attribute
- `setLanguage()` function updates the DOM correctly
- HTML elements have `data-i18n` attributes for translation keys

## Adding New Paintings

When adding a new painting, you need to:

1. **Add to `js/paintings.js`:**
```javascript
{
  id: "newPainting",
  title: "New Painting",
  descKey: "desc_newPainting",
  size: "42 x 59 cm",
  originalPrice: 1500,
  status: STATUS.FOR_SALE,
}
```

2. **Add translations to `js/translations.js`:**
```javascript
desc_newPainting: {
  sv: "Swedish description",
  en: "English description"
}
```

3. **Add image count to `images/paintings/counts.json`:**
```json
{
  "newPainting": 3
}
```

4. **Create image files:**
```
images/paintings/newPainting/desktop/01.jpg
images/paintings/newPainting/desktop/02.jpg
images/paintings/newPainting/desktop/03.jpg
images/paintings/newPainting/mobile/01.jpg
images/paintings/newPainting/mobile/02.jpg
images/paintings/newPainting/mobile/03.jpg
```

Then run `npm test` to verify everything is correct.

## Test Files

- `tests/validate.js` - Data validation test suite (42 tests)
- `tests/cart-math.js` - Cart math unit tests (29 tests)
- `tests/cart-rules.js` - Cart rules unit tests (24 tests)
- `tests/checkout.js` - Checkout logic tests against the real Cloudflare function (21 tests)
- `tests/e2e.js` - End-to-end browser tests (21 tests)
- `package.json` - npm configuration with dependencies and test scripts
- `.github/workflows/tests.yml` - GitHub Actions workflow configuration

## Questions?

If a test is unclear or you need to modify the test logic, check `tests/validate.js` for detailed comments on each test suite.
