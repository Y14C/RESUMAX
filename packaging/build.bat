@echo off
echo ========================================
echo    RESUMAX PRODUCTION BUILD
echo ========================================
echo.

echo [1/4] Checking dependencies...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found
    pause
    exit /b 1
)

pyinstaller --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: PyInstaller not installed. Run: pip install pyinstaller
    pause
    exit /b 1
)

cd ..\frontend
call npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js/npm not found
    cd ..\packaging
    pause
    exit /b 1
)
cd ..\packaging

echo [2/4] Building Python backend...
pyinstaller resumax-backend.spec --clean --noconfirm
if errorlevel 1 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)
echo    ✓ Backend built: packaging\dist\ResumaxBackend.exe

echo [3/4] Building React frontend...
cd ..\frontend
call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    cd ..\packaging
    pause
    exit /b 1
)
echo    ✓ Frontend built: packaging\frontend-dist\
cd ..\packaging

echo [4/4] Packaging Electron app...
cd ..\frontend
call npm run build:electron
if errorlevel 1 (
    echo ERROR: Electron packaging failed
    cd ..\packaging
    pause
    exit /b 1
)
echo    ✓ Installer created: packaging\release\
cd ..\packaging

echo.
echo ========================================
echo    BUILD COMPLETE
echo ========================================
echo.
echo Output: packaging\release\Resumax Setup 1.0.0.exe (~580MB)
echo.
echo All build artifacts are in the packaging folder:
echo - packaging\dist\ResumaxBackend.exe (Backend)
echo - packaging\frontend-dist\ (React build)
echo - packaging\release\ (Installer)
echo.
pause
