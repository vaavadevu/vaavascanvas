@echo off
setlocal enabledelayedexpansion
REM Run all validation and E2E tests for Vaavascanvas
REM This script can be double-clicked to run tests

title Vaavascanvas - Running All Tests
color 0A
cls

echo.
echo ==================================================
echo VAAVASCANVAS TEST RUNNER
echo ==================================================
echo.

REM Change to project directory (parent of tests folder)
echo Changing to project directory...
cd /d "%~dp0\.."
if errorlevel 1 (
    color 0C
    echo ERROR: Could not change directory!
    echo.
    pause
    exit /b 1
)
echo Project directory: %CD%
echo.

REM Install dependencies and run tests
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo.
    echo Installing dependencies - this may take a moment...
    echo.
    call npm install
    if errorlevel 1 (
        color 0C
        echo.
        echo Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo Dependencies installed
    echo.
)

REM Check if Playwright is installed, if not install it
if not exist "node_modules\playwright" (
    echo Installing Playwright browsers - this may take a moment...
    echo.
    call npx playwright install chromium
    if errorlevel 1 (
        color 0C
        echo.
        echo Failed to install Playwright
        echo.
        pause
        exit /b 1
    )
)
echo Playwright is ready
echo.

REM Run the tests
echo.
echo ==================================================
echo Starting tests (this will take about 35 seconds)
echo ==================================================
echo.

call npm test

REM Check test results
if errorlevel 1 (
    color 0C
    echo.
    echo ==================================================
    echo TESTS FAILED
    echo ==================================================
    echo.
    echo Please fix the issues shown above and run tests again.
    echo See TESTING.md for common issues and fixes.
    echo.
) else (
    color 0B
    echo.
    echo ==================================================
    echo ALL TESTS PASSED!
    echo ==================================================
    echo.
    echo Your site is ready to deploy!
    echo.
)

echo Press any key to close this window...
pause >nul
exit /b 0
