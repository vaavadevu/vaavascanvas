@echo off
REM Run only data validation tests (fast)

title Vaavascanvas - Data Validation Tests
color 0A
cls

echo.
echo ==================================================
echo VAAVASCANVAS - VALIDATION TESTS ONLY
echo (Fast - about 1 second, no browser tests)
echo ==================================================
echo.

cd /d "%~dp0\.."
if errorlevel 1 (
    color 0C
    echo ERROR: Could not change directory
    pause
    exit /b 1
)

echo.
echo Running validation tests...
echo.

call node tests/validate.js

if errorlevel 1 (
    color 0C
    echo.
    echo VALIDATION FAILED
) else (
    color 0B
    echo.
    echo VALIDATION PASSED
)

echo.
echo Press any key to close...
pause >nul
exit /b 0
