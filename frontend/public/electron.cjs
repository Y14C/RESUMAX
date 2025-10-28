const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Enable hardware acceleration and GPU optimizations
app.commandLine.appendSwitch('--enable-gpu-rasterization');
app.commandLine.appendSwitch('--enable-zero-copy');
app.commandLine.appendSwitch('--enable-gpu-memory-buffer-video-frames');

// Determine if running in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;
let pythonProcess = null;

/**
 * Verify essentialpackage dependencies exist
 * @returns {boolean} true if all dependencies are present
 */
function verifyDependencies() {
  const essentialPackageDir = isDev
    ? path.join(__dirname, '../../essentialpackage')
    : path.join(process.resourcesPath, 'essentialpackage');
  
  const tesseractPath = path.join(essentialPackageDir, 'Tesseract-OCR', 'tesseract.exe');
  const tinyTexPath = path.join(essentialPackageDir, 'TinyTeX', 'bin', 'windows', 'pdflatex.exe');
  
  console.log('Checking dependencies...');
  console.log('essentialpackage directory:', essentialPackageDir);
  console.log('Tesseract path:', tesseractPath);
  console.log('TinyTeX path:', tinyTexPath);
  
  const tesseractExists = fs.existsSync(tesseractPath);
  const tinyTexExists = fs.existsSync(tinyTexPath);
  
  if (!tesseractExists) {
    console.error('Tesseract not found at:', tesseractPath);
  }
  if (!tinyTexExists) {
    console.error('TinyTeX not found at:', tinyTexPath);
  }
  
  return tesseractExists && tinyTexExists;
}

/**
 * Creates the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: 'Resumax',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Disable web security for development
      allowRunningInsecureContent: true,
      preload: path.join(__dirname, 'preload.js'),
      hardwareAcceleration: true,
      enableWebGL: true
    },
    show: false,
    backgroundColor: '#FAFAFA',
  });

  // Remove the menu bar
  mainWindow.removeMenu();

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links - open in default browser instead of new Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/**
 * Start Python Flask backend server
 */
function startPythonBackend() {
  const backendExe = isDev
    ? 'python'  // Dev mode: use Python interpreter
    : path.join(process.resourcesPath, 'backend', 'ResumaxBackend.exe');
  
  const backendArgs = isDev ? [path.join(__dirname, '../../backend/main.py')] : [];
  const backendCwd = isDev 
    ? path.join(__dirname, '../../') 
    : path.dirname(process.execPath); // Installation directory
  
  console.log('Starting backend:', backendExe);
  console.log('Backend working directory:', backendCwd);
  
  pythonProcess = spawn(backendExe, backendArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: backendCwd,
    windowsHide: true,  // Critical: hide console window
    detached: false,
    shell: false
  });
  
  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python Backend: ${data}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Backend Error: ${data}`);
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`Python backend process exited with code ${code}`);
  });
  
  pythonProcess.on('error', (error) => {
    console.error('Failed to start Python backend:', error);
  });
}

// App lifecycle events
app.whenReady().then(() => {
  // Verify dependencies are present
  if (!verifyDependencies()) {
    dialog.showErrorBox(
      'Missing Dependencies',
      'Required dependencies (Tesseract-OCR or TinyTeX) are missing.\n\n' +
      'This usually means the installation was incomplete or corrupted.\n' +
      'Please reinstall the application.'
    );
    app.quit();
    return;
  }
  
  // Start Python backend first
  startPythonBackend();
  
  // Wait a moment for backend to start, then create window
  setTimeout(() => {
    createWindow();
  }, 100);

  app.on('activate', () => {
    // On macOS (though we're Windows-only, keep standard pattern)
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Kill Python backend process before quitting
  if (pythonProcess) {
    console.log('Terminating backend process...');
    // Force kill after timeout
    pythonProcess.kill('SIGTERM');
    setTimeout(() => {
      if (pythonProcess && !pythonProcess.killed) {
        console.log('Force killing backend process...');
        pythonProcess.kill('SIGKILL');
      }
    }, 3000);
  }
  // Windows-specific: quit when all windows are closed
  app.quit();
});

app.on('before-quit', () => {
  // Ensure Python process is killed on app quit
  if (pythonProcess) {
    console.log('Terminating backend process...');
    pythonProcess.kill('SIGTERM');
    setTimeout(() => {
      if (pythonProcess && !pythonProcess.killed) {
        console.log('Force killing backend process...');
        pythonProcess.kill('SIGKILL');
      }
    }, 3000);
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});


