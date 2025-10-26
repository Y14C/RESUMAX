@echo off
setlocal enabledelayedexpansion

:: Set development environment
set NODE_ENV=development

:: Set console title and color
title Resumax Developer Launcher
color 0A

:: Store project root directory
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

echo.
echo ========================================
echo    RESUMAX DEVELOPER LAUNCHER
echo ========================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python and ensure it's in your system PATH
    pause
    exit /b 1
)

:: Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and ensure it's in your system PATH
    pause
    exit /b 1
)

:: Check if npm dependencies are installed
if not exist "frontend\node_modules" (
    echo ERROR: Frontend dependencies not installed
    echo Please run 'npm install' in the frontend directory first
    pause
    exit /b 1
)

echo [1/4] Starting Python Flask backend server...
start /B "Python Backend" python backend\main.py
if errorlevel 1 (
    echo ERROR: Failed to start Python backend
    pause
    exit /b 1
)
echo    ✓ Backend server starting on http://localhost:54782

:: Wait a moment for backend to initialize
timeout /t 2 /nobreak >nul

echo [2/4] Starting Vite development server...
pushd frontend
start /B "Vite Dev Server" npm run dev
if errorlevel 1 (
    echo ERROR: Failed to start Vite dev server
    popd
    pause
    exit /b 1
)
echo    ✓ Vite dev server starting on http://localhost:5173
popd

:: Wait for servers to fully initialize
echo [3/4] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo [4/4] Launching Electron application...
echo.
echo ========================================
echo    LAUNCHER READY - ELECTRON STARTING
echo ========================================
echo.
echo Backend:  http://localhost:54782
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop all services
echo.

:: Launch Electron (this runs in foreground)
pushd frontend
npx electron .
popd

:: Cleanup when Electron closes
echo.
echo ========================================
echo    CLEANING UP SERVICES
echo ========================================
echo.

:: Kill Python backend process
echo Stopping Python backend...
taskkill /F /FI "WINDOWTITLE eq Python Backend*" >nul 2>&1
taskkill /F /IM python.exe /FI "WINDOWTITLE eq Python Backend*" >nul 2>&1

:: Kill Vite dev server process
echo Stopping Vite dev server...
taskkill /F /FI "WINDOWTITLE eq Vite Dev Server*" >nul 2>&1
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Vite Dev Server*" >nul 2>&1

echo.
echo All services stopped. Launcher exiting.
echo.
pause
