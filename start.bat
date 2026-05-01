@echo off
setlocal enabledelayedexpansion
title Salam Journey - Local Dev Server

cd /d "%~dp0"

echo ============================================================
echo   Salam Journey - Local Dev Server
echo ============================================================
echo.

REM --- 1. Check Node.js ---------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed.
    echo.
    echo Please install Node.js 20 or newer from:
    echo     https://nodejs.org/
    echo.
    echo After installing, double-click start.bat again.
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Node.js detected: !NODE_VERSION!

REM --- 2. Check / install pnpm -------------------------------------------
where pnpm >nul 2>nul
if errorlevel 1 (
    echo [INFO] pnpm not found. Installing it globally via npm...
    call npm install -g pnpm
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install pnpm automatically.
        echo Try running this command manually in a new terminal:
        echo     npm install -g pnpm
        echo.
        pause
        exit /b 1
    )
)

for /f "tokens=*" %%v in ('pnpm -v') do set PNPM_VERSION=%%v
echo [OK] pnpm detected: !PNPM_VERSION!
echo.

REM --- 3. Install project dependencies if missing -------------------------
if not exist "node_modules" goto install_deps
if not exist "artifacts\salam-journey\node_modules" goto install_deps
goto deps_ok

:install_deps
echo [INFO] Installing project dependencies. This may take a few minutes the first time...
echo.
call pnpm install
if errorlevel 1 (
    echo.
    echo [ERROR] pnpm install failed. Please check the messages above.
    echo.
    pause
    exit /b 1
)
echo.

:deps_ok
echo [OK] Dependencies are ready.
echo.

REM --- 4. Open the browser shortly after the server starts ----------------
start "" cmd /c "timeout /t 6 /nobreak >nul && start http://localhost:5173"

echo ============================================================
echo   Starting the dev server...
echo   The site will open automatically in your browser.
echo   URL: http://localhost:5173
echo.
echo   Press Ctrl+C in this window to stop the server.
echo ============================================================
echo.

REM --- 5. Run the frontend dev server -------------------------------------
call pnpm --filter @workspace/salam-journey run dev

echo.
echo Server stopped.
pause
