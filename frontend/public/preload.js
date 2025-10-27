/**
 * Preload script for Electron main process
 * This script runs in the renderer process with access to Node.js APIs
 * but in a secure context isolated from the main world
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any IPC methods here if needed in the future
  // For now, we just need to ensure the preload script exists
  // to satisfy Electron's security requirements
});
