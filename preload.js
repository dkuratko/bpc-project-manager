const { contextBridge, ipcRenderer } = require('electron');

// Bridge the frameless-window controls (minimise / maximise / close) to the
// main process so the renderer's own title-bar buttons behave like the real ones.
contextBridge.exposeInMainWorld('winControls', {
  minimize: () => ipcRenderer.send('win:minimize'),
  toggleMaximize: () => ipcRenderer.send('win:toggle-maximize'),
  close: () => ipcRenderer.send('win:close')
});
