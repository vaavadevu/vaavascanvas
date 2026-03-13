@echo off
setlocal enabledelayedexpansion
REM Run only end-to-end browser tests

title Vaavascanvas - E2E Browser Tests
color 0A
cls

echo.
echo ══════════════════════════════════════════════════════════
echo VAAVASCANVAS - E2E TESTS ONLY
echo (Slow - ~30 seconds, opens actual browser)
echo ══════════════════════════════════════════════════════════
echo.

REM Check if Node.js is installed
echo Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ✗ ERROR: Node.js is not installed!
    echo Please install from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0\.."
if errorlevel 1 (
    color 0C
    echo ✗ ERROR: Could not change directory
    pause
    exit /b 1
)

echo ✓ Node.js found
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies first...
    echo Please wait...
    echo.
    call npm install
    if errorlevel 1 (
        color 0C
        echo ✗ Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
    echo.
)

REM Check if Playwright is installed
if not exist "node_modules\playwright" (
    echo Installing Playwright browsers... this may take a moment
    echo Please wait...
    echo.
    call npx playwright install chromium
    if errorlevel 1 (
        color 0C
        echo ✗ Failed to install Playwright
        echo.
        pause
        exit /b 1
    )
    echo ✓ Playwright installed
    echo.
)

echo Running E2E tests (this takes about 30 seconds)...
echo.

call node tests/e2e.js

if errorlevel 1 (
    color 0C
    echo.
    echo ✗ E2E TESTS FAILED
) else (
    color 0B
    echo.
    echo ✓ E2E TESTS PASSED
)

echo.
echo Press any key to close...
pause >nul
exit /b 0
