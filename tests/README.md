# Test Scripts

Quick batch scripts to run tests on Windows. Simply double-click any of these files from File Explorer.

## Available Scripts

### `run-all-tests.bat`
**Recommended** - Runs both validation and E2E tests.
- Takes: ~35 seconds total
- Tests everything before deployment
- Double-click to run

### `run-validation-only.bat`
Runs only fast data validation tests (no browser).
- Takes: ~1 second
- Quick check of data structure
- Good for rapid iteration

### `run-e2e-only.bat`
Runs only browser/interaction tests.
- Takes: ~30 seconds
- Tests actual page behavior
- Requires Playwright (auto-installs on first run)

## How to Use

### Option 1: Double-Click
Simply double-click any `.bat` file in File Explorer to run tests.

### Option 2: From Command Line
```bash
cd tests
run-all-tests.bat
```

## What Gets Tested

See [TESTING.md](../TESTING.md) for detailed information about what each test checks.

## Troubleshooting

### "Node.js is not installed"
Install Node.js from https://nodejs.org/ (version 18 or later)

### Slow first run
First run downloads Playwright browser (~100MB). Subsequent runs are faster.

### Tests won't run from double-click
Try running from Command Prompt instead (see Option 2 above)

### Permission denied errors
Right-click the `.bat` file → Run as Administrator

## Notes

- Tests automatically install dependencies on first run
- Keep the command window open to see results (scripts pause at the end)
- All output is color-coded:
  - 🟢 Green = Tests passed
  - 🔴 Red = Tests failed
  - 🟡 Yellow = Running tests

Run tests before pushing to GitHub to catch issues early!
