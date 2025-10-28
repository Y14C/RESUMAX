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
let isQuitting = false;

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
    fullscreen: false,
    maximizable: true,
    minimizable: true,
    closable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: !isDev, // Enable web security in production
      allowRunningInsecureContent: isDev, // Only allow in development
      preload: path.join(__dirname, 'preload.js'),
      hardwareAcceleration: true,
      enableWebGL: true,
      devTools: isDev, // Disable devTools in production
    },
    show: false,
    backgroundColor: '#FAFAFA',
  });

  // Remove the menu bar
  mainWindow.removeMenu();

  // Disable F12 and DevTools shortcuts in production
  if (!isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J
      if (
        input.control && input.shift && input.key.toLowerCase() === 'i' ||
        input.control && input.shift && input.key.toLowerCase() === 'c' ||
        input.control && input.shift && input.key.toLowerCase() === 'j' ||
        input.key === 'F12'
      ) {
        event.preventDefault();
      }
      // Disable right-click context menu
      if (input.button === 2) {
        event.preventDefault();
      }
    });
  }

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, dist files are unpacked to app.asar.unpacked/dist/
    // electron.cjs is in app.asar/public/
    // Need to go to app.asar.unpacked/dist/index.html
    const unpackedPath = __dirname.replace('app.asar', 'app.asar.unpacked');
    const indexPath = path.join(unpackedPath, '../dist/index.html');
    console.log('Loading index.html from:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle window close event - prevent default and trigger proper app quit
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      app.quit();
    }
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
  // Guard: prevent multiple backend spawns
  if (pythonProcess && !pythonProcess.killed) {
    console.log('Backend already running, skipping spawn');
    return;
  }
  
  const backendExe = isDev
    ? 'python'  // Dev mode: use Python interpreter
    : path.join(process.resourcesPath, 'backend', 'ResumaxBackend.exe');
  
  const backendArgs = isDev ? [path.join(__dirname, '../../backend/main.py')] : [];
  const backendCwd = isDev 
    ? path.join(__dirname, '../../') 
    : path.dirname(process.resourcesPath); // Installation root (one level up from resources/)
  
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

/**
 * Kill Python backend process and all its children (Windows-specific)
 * Returns a Promise that resolves when the backend is killed
 */
function killPythonBackend() {
  return new Promise((resolve) => {
    if (!pythonProcess || pythonProcess.killed) {
      console.log('Backend process already killed or not running');
      resolve();
      return;
    }
    
    const pid = pythonProcess.pid;
    console.log(`Killing backend process tree (PID: ${pid})...`);
    
    // Try graceful termination first
    try {
      // On Windows, send CTRL_BREAK_EVENT for graceful shutdown
      pythonProcess.kill('SIGTERM');
      console.log('Sent SIGTERM signal for graceful shutdown');
    } catch (error) {
      console.log('Failed to send SIGTERM, will use force kill:', error.message);
    }
    
    // Wait 2 seconds for graceful shutdown
    setTimeout(() => {
      if (pythonProcess && !pythonProcess.killed) {
        console.log('Graceful shutdown timeout, using force kill...');
        
        // Windows-specific: Use taskkill to kill entire process tree
        const killProcess = spawn('taskkill', ['/F', '/T', '/PID', pid.toString()], {
          windowsHide: true,
          shell: false
        });
        
        killProcess.on('close', (code) => {
          console.log(`Backend process killed with code ${code}`);
          pythonProcess = null;
          resolve();
        });
        
        killProcess.on('error', (error) => {
          console.error('Failed to kill backend process:', error);
          // Fallback: try regular kill
          try {
            pythonProcess.kill('SIGKILL');
            pythonProcess = null;
          } catch (e) {
            console.error('Fallback kill failed:', e);
          }
          resolve();
        });
        
        // Timeout protection - force resolve after 3 more seconds
        setTimeout(() => {
          console.log('Force kill timeout reached, resolving anyway');
          pythonProcess = null;
          resolve();
        }, 3000);
      } else {
        console.log('Backend process terminated gracefully');
        pythonProcess = null;
        resolve();
      }
    }, 2000);
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

app.on('window-all-closed', async () => {
  // Kill Python backend process before quitting
  await killPythonBackend();
  // Windows-specific: quit when all windows are closed
  app.quit();
});

app.on('before-quit', async (event) => {
  if (!isQuitting) {
    event.preventDefault();
    isQuitting = true;
    
    // Ensure Python process is killed on app quit
    await killPythonBackend();
    
    // Let the app quit naturally - don't call app.quit() recursively
    // Force exit after cleanup
    process.exit(0);
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});


