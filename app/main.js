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
const fs = require('fs');
const { open, verify, DB_PATH } = require('./db/open');
const { seed } = require('./db/seed');
const { board, counters } = require('./db/board');
const { versionDetail } = require('./db/version');
const { contactList, setActive } = require('./db/contacts');
const EQ = require('./db/equipment');
const { costBreakdown } = require('./db/scope');
const { estimateDoc } = require('./db/estimate');
const ENGINE = require('./db/engine');

let db = null;

/**
 * `electron . --reseed` rebuilds the database from the schema and the seed,
 * then quits without opening a window.
 *
 * It lives HERE rather than in its own script for one reason: userData is
 * derived from the app name, and a bare `electron some-script.js` never reads
 * package.json, so it resolves a different folder — twice now I have watched a
 * reseed rebuild a database the app had never heard of. Run inside the app's
 * own entry point, the path is the same by construction.
 *
 * It DESTROYS the file. Safe only while it holds nothing but sample data,
 * which is true until the entry screens land — so it says what it is about to
 * throw away and refuses without --force.
 */
function reseed() {
  const target = DB_PATH();
  const force = process.argv.includes('--force');

  if (fs.existsSync(target)) {
    const old = new (require('better-sqlite3'))(target, { readonly: true });
    const n = (t) => { try { return old.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c; }
                       catch { return 0; } };
    const held = ['projects', 'versions', 'customers', 'contacts', 'documents']
      .map((t) => `${n(t)} ${t}`).join(' · ');
    old.close();

    console.log(`about to destroy ${target}\n  it holds: ${held}`);
    if (!force) return console.log('\nrun `npm run reseed -- --force` to go ahead.');

    for (const f of [target, target + '-wal', target + '-shm'])
      if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  const fresh = open();
  seed(fresh);
  const problems = verify(fresh);
  console.log(`reseeded ${target}\n  ` +
              (problems.length ? '✗ ' + problems.join(', ') : '✓ clean'));
}

function database() {
  if (db) return db;
  db = open();

  // Structural problems are cheap to find now and expensive to find later.
  const problems = verify(db);
  if (problems.length) console.error('database:\n  ' + problems.join('\n  '));

  // First run only. seed() is a no-op once there are projects.
  if (seed(db)) console.log('seeded sample data');

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

  // Renderer errors are otherwise silent — they go to a DevTools console
  // nobody has open. Forward them, so a screen that fails to draw says so.
  win.webContents.on('console-message', (_e, level, message, line, source) => {
    const tag = ['log', 'warn', 'error'][level - 1] ?? 'log';
    const where = source ? ` (${source.split('/').pop()}:${line})` : '';
    console[tag === 'error' ? 'error' : 'log'](`renderer ${tag}: ${message}${where}`);
  });
  win.webContents.on('render-process-gone', (_e, d) =>
    console.error('renderer gone:', d.reason));

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

/* The domain side of the bridge. Status is DERIVED, and the renderer has no
   Node access — so rather than duplicate the rules across the bridge, where
   two copies of a rule start disagreeing, the main process owns the domain
   and the renderer draws what it is handed. */
ipcMain.handle('domain:board', () => {
  try {
    const rows = board(database());
    return { projects: rows, counters: counters(rows) };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:contacts', (_e, opts) => {
  try { return { list: contactList(database(), opts) }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:contact-active', (_e, opts) => {
  try { return setActive(database(), opts); }
  catch (err) { return { error: err.message }; }
});

const today = () => new Date().toISOString().slice(0, 10);

ipcMain.handle('domain:equipment', (_e, opts = {}) => {
  try {
    const db = database();
    return { data: { owned: EQ.owned(db, today(), opts),
                     rented: EQ.rented(db, today(), opts) } };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:equipment-detail', (_e, id) => {
  try { return { detail: EQ.detail(database(), id, today()) }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:fuel-prices', () => {
  try { return { prices: EQ.fuelPrices(database()) }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:fuel-preview', (_e, prices) => {
  try { return { preview: EQ.fuelPreview(database(), prices ?? {}, today()) }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:fuel-apply', (_e, prices) => {
  try { return EQ.fuelApply(database(), prices ?? {}, today()); }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:cost-breakdown', (_e, id) => {
  try { return { data: costBreakdown(database(), id, today()) }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:estimate', (_e, id) => {
  try { return { doc: estimateDoc(database(), id, today()) }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:engine', (_e, id) => {
  try { return { result: ENGINE.calculate(database(), id) }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:recalculate', (_e, id) => {
  try {
    const db = database();
    const result = ENGINE.calculate(db, id);
    ENGINE.persist(db, id, result, { today: today() });
    return { result };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('domain:version', (_e, id) => {
  try { return { version: versionDetail(database(), id) }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('frame:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.handle('frame:maximize', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (w) w.isMaximized() ? w.unmaximize() : w.maximize();
});
ipcMain.handle('frame:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

app.whenReady().then(() => {
  // --reseed does its work and leaves. No window, no IPC, no frame.
  if (process.argv.includes('--reseed')) { reseed(); return app.quit(); }

  createFrame();
  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) createFrame();
  });
});

app.on('window-all-closed', () => {
  db?.close();
  if (process.platform !== 'darwin') app.quit();
});
