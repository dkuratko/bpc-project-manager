'use strict';

/**
 * The frame.
 *
 * One Electron window. It has no menu and no toolbar of its own — each child
 * window carries those, which is what all 29 approved renders show and what
 * 00-TREE settled on 04 Oct 2026. So this process owns three things only:
 * the window, the database, and the bridge between them.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { open, verify } = require('./db/open');

let db = null;

function database() {
  if (db) return db;
  db = open();

  // Structural problems are cheap to find now and expensive to find later.
  const problems = verify(db);
  if (problems.length) console.error('database:\n  ' + problems.join('\n  '));

  return db;
}

function createFrame() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    frame: false,                 // the title bar is drawn, like everything else
    backgroundColor: '#008080',   // the desk, so there is no white flash
    title: 'Build Play Contracting — Project Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, 'ui', 'shell.html'));
  return win;
}

/* ─── the bridge ────────────────────────────────────────────────────────
   Two channels, not one per screen. A screen asks for rows or runs a
   statement; it never reaches the file. Adding a screen does not mean
   adding IPC.
   ──────────────────────────────────────────────────────────────────── */

ipcMain.handle('db:all', (_e, sql, params = []) => {
  try { return { rows: database().prepare(sql).all(params) }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('db:get', (_e, sql, params = []) => {
  try { return { row: database().prepare(sql).get(params) ?? null }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('db:run', (_e, sql, params = []) => {
  try {
    const r = database().prepare(sql).run(params);
    return { changes: r.changes, lastInsertRowid: String(r.lastInsertRowid) };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('frame:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.handle('frame:maximize', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w) w.isMaximized() ? w.unmaximize() : w.maximize();
});
ipcMain.handle('frame:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

app.whenReady().then(() => {
  createFrame();
  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) createFrame();
  });
});

app.on('window-all-closed', () => {
  db?.close();
  if (process.platform !== 'darwin') app.quit();
});
