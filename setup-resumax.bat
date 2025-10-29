@echo off
setlocal enabledelayedexpansion

:: Configuration
set "REPO_URL=https://github.com/y14c/resumax.git"
set "PROJECT_NAME=resumax"
set "LOG_FILE=setup-log.txt"

:: Initialize log
echo Setup started: %date% %time% > "%LOG_FILE%"

echo.
echo ==========================================
echo   Resumax Development Setup Script
echo ==========================================
echo.

:: Check if project folder exists
if exist "%PROJECT_NAME%" (
    echo WARNING: '%PROJECT_NAME%' folder already exists!
    set /p "cleanup=Delete it and start fresh? (Y/N): "
    if /i "!cleanup!"=="Y" (
        echo Removing existing folder...
        rmdir /s /q "%PROJECT_NAME%" 2>nul
        if exist "%PROJECT_NAME%" (
            echo ERROR: Could not remove folder. Delete it manually.
            pause
            exit /b 1
        )
        echo Folder removed.
    ) else (
        echo Setup cancelled.
        pause
        exit /b 1
    )
    echo.
)

:: Check winget availability
echo Checking for winget...
winget --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: winget not found. Install it from Microsoft Store.
    pause
    exit /b 1
)
echo winget found.
echo.

:: Check and install Git
echo Checking Git...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Git...
    winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements --silent
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Git.
        pause
        exit /b 1
    )
    echo Git installed. Close and reopen terminal, then run script again.
    pause
    exit /b 0
) else (
    echo Git already installed.
)
echo.

:: Check and install Python
echo Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Python 3.12...
    winget install --id Python.Python.3.12 -e --accept-source-agreements --accept-package-agreements --silent
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Python.
        pause
        exit /b 1
    )
    echo Python installed. Close and reopen terminal, then run script again.
    pause
    exit /b 0
) else (
    for /f "tokens=2" %%i in ('python --version 2^>^&1') do set "py_ver=%%i"
    echo Python !py_ver! found.
)
echo.

:: Check and install Node.js
echo Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Node.js LTS...
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements --silent
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Node.js.
        pause
        exit /b 1
    )
    echo Node.js installed. Close and reopen terminal, then run script again.
    pause
    exit /b 0
) else (
    for /f "tokens=1" %%i in ('node --version 2^>^&1') do set "node_ver=%%i"
    echo Node.js !node_ver! found.
)
echo.

:: Clone repository
echo Cloning repository...
git clone %REPO_URL% %PROJECT_NAME%
if %errorlevel% neq 0 (
    echo ERROR: Failed to clone repository.
    echo Check your internet connection.
    pause
    exit /b 1
)
echo Repository cloned.
echo.

:: Enter project directory
cd %PROJECT_NAME%
if %errorlevel% neq 0 (
    echo ERROR: Could not enter project directory.
    pause
    exit /b 1
)

:: Verify essential packages
echo Verifying essential packages...
if not exist "essentialpackage\Tesseract-OCR" (
    echo ERROR: Tesseract-OCR folder not found.
    pause
    exit /b 1
)
if not exist "essentialpackage\TinyTeX" (
    echo ERROR: TinyTeX folder not found.
    pause
    exit /b 1
)
echo Essential packages verified.
echo.

:: Install Python dependencies
echo Installing Python packages...
echo This may take a few minutes...
python -m pip install --upgrade pip >nul 2>&1
python -m pip install Flask>=2.3.3 Flask-Cors>=4.0.0 python-dotenv>=1.0.0 anthropic>=0.71.0 google-generativeai>=0.8.2 openai>=2.6.1 python-docx>=1.1.0 pypandoc>=1.15 PyMuPDF>=1.26.5 pytesseract>=0.3.13 Pillow>=10.4.0 requests>=2.31.0
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python packages.
    pause
    exit /b 1
)
echo Python packages installed.
echo.

:: Install Node.js dependencies
echo Installing Node.js packages...
echo This may take several minutes...
cd frontend
if %errorlevel% neq 0 (
    echo ERROR: Frontend directory not found.
    pause
    exit /b 1
)

npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js packages.
    pause
    exit /b 1
)
echo Node.js packages installed.
cd ..
echo.

:: Final verification
echo Verifying installation...
where git >nul 2>&1 && echo [OK] Git || echo [FAIL] Git
where python >nul 2>&1 && echo [OK] Python || echo [FAIL] Python
where node >nul 2>&1 && echo [OK] Node.js || echo [FAIL] Node.js
where npm >nul 2>&1 && echo [OK] npm || echo [FAIL] npm
if exist "frontend\node_modules" (echo [OK] Node packages) else (echo [FAIL] Node packages)
echo.

echo ==========================================
echo   Setup Complete!
echo ==========================================
echo.
echo Project Location: %CD%
echo.
echo To start development:
echo   1. Backend:  python main.py
echo   2. Frontend: cd frontend ^&^& npm run electron:dev
echo.
echo Configure AI Provider:
echo   - Edit .env file with your API keys
echo   - Or use LM Studio for local AI
echo.
echo Need help? Check setup-log.txt
echo.

echo Setup completed: %date% %time% >> "%LOG_FILE%"

pause
endlocal