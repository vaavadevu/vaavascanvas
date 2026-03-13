# Vaavascanvas Testing Guide

This project includes two levels of automated testing:

1. **Data Validation Tests** - Check data consistency and structure (runs instantly)
2. **End-to-End (E2E) Tests** - Open actual pages in a browser, test user interactions, check for errors (takes ~30 seconds)

Both test suites run on every push and pull request to catch issues before deployment.

## What Gets Tested

### 1. **Paintings Data Validation**
- All paintings have unique IDs
- All paintings have required fields (`id`, `title`, `descKey`, `size`, `status`)
- All painting statuses are valid (FOR_SALE, SOLD, or PERSONAL)
- FOR_SALE and SOLD paintings have a price (`originalPrice`)
- All painting description keys reference existing translations

### 2. **Image Inventory Validation**
- All painting IDs in `counts.json` exist in `paintings.js`
- All image counts in `counts.json` are valid (positive numbers)
- Explicit `imageCount` properties in paintings match `counts.json`

### 3. **Translation System Validation**
- All translation keys have both Swedish (`sv`) and English (`en`) versions
- No translation keys have unexpected languages
- Translation text is non-empty

### 4. **HTML & Translation References**
- All `data-i18n` attributes in HTML files reference existing translation keys
- All `data-i18n-ph` (placeholder) attributes reference existing translation keys

### 5. **Form Logic Validation**
- "Originals" dropdown only includes FOR_SALE paintings
- "Prints" dropdown includes all paintings
- All FOR_SALE paintings have valid pricing for display

### 6. **Gallery Logic Validation**
- Paintings can be sorted correctly by status and price
- All paintings have valid filter status

### 7. **End-to-End Browser Tests** (E2E)
- Main page loads without JavaScript console errors
- Hero section renders correctly
- Gallery displays all paintings
- All gallery images load without 404 errors
- Modal opens when clicking a painting
- Modal images load successfully
- Modal closes properly
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

This runs both validation tests and E2E tests sequentially.

### Run Only Validation Tests (Fast)
```bash
node tests/validate.js
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

[2] MODAL TESTS
✓ Modal opens when clicking first painting
✓ Modal images load without 404 errors
✓ Modal closes properly

[3] LANGUAGE SWITCHING TESTS
✓ Language switching to English works

[4] FORM TESTS
✓ Contact form is present
✓ Paintings page loads without errors

═══════════════════════════════════════════════════════════
E2E TEST RESULTS
═══════════════════════════════════════════════════════════

Total tests: 10
Passed: 10
Failed: 0

✓ All E2E tests passed!
```

## Why Two Types of Tests?

### Data Validation Tests (Fast - ~1 second)
✓ Catch data structure problems (missing fields, wrong types)
✓ Find translation/reference mismatches
✓ Verify data consistency

✗ Won't catch runtime JavaScript errors
✗ Won't catch broken image paths that return 404
✗ Won't catch missing DOM elements
✗ Won't catch modal/interaction bugs

### E2E Tests (Slower - ~30 seconds)
✓ Actually opens pages in a real browser
✓ Catches JavaScript console errors
✓ Verifies images load (404 detection)
✓ Tests modal opening/closing
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
- Verify modal.js, gallery.js, i18n.js are properly initialized

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

### Issue: "Modal opens when clicking painting - Modal did not open"
**Fix:** Check modal functionality:
- Verify `.modal` element exists in the HTML
- Check that gallery items have click handlers
- Ensure `openModal()` function is defined in modal.js

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

- `tests/validate.js` - Data validation test suite (19 tests)
- `tests/e2e.js` - End-to-end browser tests (10 tests)
- `package.json` - npm configuration with dependencies and test scripts
- `.github/workflows/tests.yml` - GitHub Actions workflow configuration

## Questions?

If a test is unclear or you need to modify the test logic, check `tests/validate.js` for detailed comments on each test suite.
