const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Enable hardware acceleration and GPU optimizations
app.commandLine.appendSwitch('--enable-gpu-rasterization');
app.commandLine.appendSwitch('--enable-zero-copy');
app.commandLine.appendSwitch('--enable-gpu-memory-buffer-video-frames');

// Determine if running in development mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow = null;
let pythonProcess = null;

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
  const pythonPath = isDev
    ? path.join(__dirname, '../../backend/main.py')
    : path.join(process.resourcesPath, 'backend/main.py');
  
  console.log('Starting Python backend server...');
  console.log('Python script path:', pythonPath);
  
  pythonProcess = spawn('python', [pythonPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: isDev ? path.join(__dirname, '../../') : process.resourcesPath
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
    console.log('Terminating Python backend process...');
    pythonProcess.kill();
  }
  // Windows-specific: quit when all windows are closed
  app.quit();
});

app.on('before-quit', () => {
  // Ensure Python process is killed on app quit
  if (pythonProcess) {
    console.log('Terminating Python backend process...');
    pythonProcess.kill();
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});


