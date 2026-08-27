const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

ipcMain.on('win:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on('win:toggle-maximize', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  w.isMaximized() ? w.unmaximize() : w.maximize();
});
ipcMain.on('win:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

// The window itself provides the Windows 2000 chrome (title bar, menus, etc.),
// so we use a frameless window and let the renderer draw everything.
function createWindow() {
  const win = new BrowserWindow({
    width: 1044,
    height: 812,
    minWidth: 900,
    minHeight: 640,
    frame: false,
    backgroundColor: '#008080',
    title: 'Build Play Contracting - Project Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // No native application menu; the app draws its own menu bar.
  Menu.setApplicationMenu(null);

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Diagnostic: surface renderer console + crashes in the terminal log.
  win.webContents.on('console-message', (_e, level, message, line, source) => {
    if (level >= 2) console.log(`[renderer:${level}] ${message} (${source}:${line})`);
  });
  win.webContents.on('render-process-gone', (_e, d) => console.log('[render-process-gone]', d));

  // TEMP: capture the rendered window once for verification.
  if (process.env.BPC_CAPTURE) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        if (process.env.BPC_EXEC) { try { await win.webContents.executeJavaScript(process.env.BPC_EXEC); } catch(e){ console.log('[exec-err]', e.message); } }
        await new Promise(r => setTimeout(r, 400));
        const img = await win.capturePage();
        require('fs').writeFileSync(process.env.BPC_CAPTURE, img.toPNG());
        console.log('[captured]', process.env.BPC_CAPTURE);
      }, 1200);
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
