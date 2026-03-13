@echo off
REM Run only data validation tests (fast)

title Vaavascanvas - Data Validation Tests
color 0A
cls

echo.
echo ══════════════════════════════════════════════════════════
echo VAAVASCANVAS - VALIDATION TESTS ONLY
echo (Fast - ~1 second, no browser tests)
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
echo Running validation tests...
echo.

call node tests/validate.js

if errorlevel 1 (
    color 0C
    echo.
    echo ✗ VALIDATION FAILED
) else (
    color 0B
    echo.
    echo ✓ VALIDATION PASSED
)

echo.
echo Press any key to close...
pause >nul
exit /b 0
