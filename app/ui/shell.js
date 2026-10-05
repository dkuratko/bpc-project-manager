'use strict';

/**
 * The desk, and the windows on it.
 *
 * Built to 00-TREE §9b, which is the record of how every screen reaches every
 * other one. Three of its rules shape this file:
 *
 *   · The PROJECT BROWSER is the client area and never closes — no close
 *     button at all, not a disabled one. It opens filling the desk.
 *   · Asking for a MAIN window twice RAISES the one that is open. It never
 *     stacks a duplicate nobody asked for.
 *   · Popups BLOCK, then close back. A popup opened from a popup stays modal
 *     to its PARENT, so cancelling Line items returns to Record approval
 *     rather than to the version view behind it.
 */

import { openProjectBrowser } from './screens/project-browser.js';

const desk = document.getElementById('desk');

document.querySelectorAll('[data-frame]').forEach((el) =>
  el.addEventListener('click', () => window.bpc.frame[el.dataset.frame]()));

const mains = new Map();    // id → { el, title, restore, closable }
const modals = [];          // a stack: the last one has focus
let topZ = 10;
let cascadeStep = 0;

/* ═══ MAIN WINDOWS ══════════════════════════════════════════════════════ */

export function openMain({ id, title, menu, width = 1000, height = 620,
                           fillDesk = false, closable = true, build }) {
  const open = mains.get(id);
  if (open) { raise(id); return open.el; }   // §9b · raise, never duplicate

  const el = document.createElement('div');
  el.className = 'w-window';
  el.dataset.win = id;

  if (fillDesk) {
    Object.assign(el.style, { left: '0px', top: '0px', width: '100%', height: '100%' });
  } else {
    const step = (cascadeStep++ % 6) * 22;
    Object.assign(el.style, {
      left: (18 + step) + 'px', top: (14 + step) + 'px',
      width: width + 'px', height: height + 'px',
    });
  }

  el.innerHTML = `
    <div class="w-titlebar">
      <span class="w-title"></span>
      <span class="w-titlebtns" style="display:flex;gap:2px;flex:none"></span>
    </div>
    <div class="w-menubar"></div>
    <div class="w-body" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:3px"></div>`;

  el.querySelector('.w-title').textContent = title;
  chromeButtons(el.querySelector('.w-titlebtns'), closable);
  renderMenu(el.querySelector('.w-menubar'), menu ?? ['File', 'Edit', 'View', 'Window', 'Help']);

  desk.appendChild(el);
  // A window that fills the desk still needs somewhere to go when restored.
  mains.set(id, { el, title, closable,
                  restore: fillDesk ? { left: '40px', top: '30px',
                                        width: width + 'px', height: height + 'px' } : null });

  dragBy(el.querySelector('.w-titlebar'), el);
  el.addEventListener('mousedown', () => raise(id), true);
  el.querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', (e) => { e.stopPropagation(); act(id, b.dataset.act); }));

  build(el.querySelector('.w-body'), el);
  raise(id);
  return el;
}

function chromeButtons(host, closable) {
  const btn = (act, inner) =>
    `<span class="w-titlebtn" data-act="${act}">${inner}</span>`;
  host.innerHTML =
    btn('minimize', `<span style="display:block;width:7px;height:2px;background:#000;margin-top:5px"></span>`) +
    btn('maximize', `<span style="display:block;width:8px;height:7px;border:1px solid #000;border-top-width:2px"></span>`) +
    // §9b: the browser has NO close button. Not a disabled one — absent.
    (closable ? btn('close',
      `<span style="position:absolute;width:9px;height:1px;background:#000;transform:rotate(45deg)"></span>
       <span style="position:absolute;width:9px;height:1px;background:#000;transform:rotate(-45deg)"></span>`) : '');
}

function act(id, what) {
  const w = mains.get(id);
  if (!w) return;

  if (what === 'close') {
    if (!w.closable) return;
    w.el.remove(); mains.delete(id); raiseTop(); return;
  }
  if (what === 'minimize') {
    w.el.style.display = 'none';      // still in the Window menu
    raiseTop(); return;
  }
  if (what === 'maximize') {
    const filling = w.el.style.width === '100%';
    if (filling) { Object.assign(w.el.style, w.restore); }
    else {
      w.restore = { left: w.el.style.left, top: w.el.style.top,
                    width: w.el.style.width, height: w.el.style.height };
      Object.assign(w.el.style, { left: '0px', top: '0px', width: '100%', height: '100%' });
    }
  }
}

export function raise(id) {
  const w = mains.get(id);
  if (!w) return;
  w.el.style.display = '';
  w.el.style.zIndex = ++topZ;
  for (const [other, o] of mains)
    o.el.querySelector('.w-titlebar').classList.toggle('inactive', other !== id);
}

function raiseTop() {
  let best = null, bestZ = -1;
  for (const [id, w] of mains) {
    if (w.el.style.display === 'none') continue;
    const z = Number(w.el.style.zIndex || 0);
    if (z > bestZ) { bestZ = z; best = id; }
  }
  if (best) raise(best);
}

export function cascade() {
  let i = 0;
  for (const [, w] of mains) {
    w.el.style.display = '';
    if (w.el.style.width === '100%') Object.assign(w.el.style, w.restore);
    Object.assign(w.el.style, { left: (18 + i * 22) + 'px', top: (14 + i * 22) + 'px' });
    w.el.style.zIndex = ++topZ;
    i++;
  }
}

/* ═══ POPUPS ════════════════════════════════════════════════════════════
   Modal, on a scrim, over whatever opened them. A popup opened from a popup
   gets its own scrim above the first — so the stack unwinds one at a time
   and cancelling returns to the parent, not to the bottom.
   ═══════════════════════════════════════════════════════════════════════ */

export function openPopup({ title, width = 600, build, onCancel }) {
  const scrim = document.createElement('div');
  scrim.className = 'w-scrim';
  Object.assign(scrim.style, {
    position: 'absolute', inset: '0', minHeight: '0',
    alignItems: 'flex-start', justifyContent: 'center',
    padding: '34px 24px', zIndex: ++topZ,
  });

  const dlg = document.createElement('div');
  dlg.className = 'w-dialog';
  dlg.style.width = width + 'px';
  dlg.style.flex = 'none';
  dlg.innerHTML = `
    <div class="w-titlebar">
      <span class="w-title"></span>
      <span class="w-titlebtn" data-act="cancel">
        <span style="position:absolute;width:9px;height:1px;background:#000;transform:rotate(45deg)"></span>
        <span style="position:absolute;width:9px;height:1px;background:#000;transform:rotate(-45deg)"></span></span>
    </div>
    <div class="w-dialog-body"></div>`;
  dlg.querySelector('.w-title').textContent = title;

  scrim.appendChild(dlg);
  desk.appendChild(scrim);

  const handle = { close };
  modals.push(handle);

  function close(cancelled = false) {
    if (modals[modals.length - 1] !== handle) return;   // unwind in order
    modals.pop();
    scrim.remove();
    if (cancelled) onCancel?.();
    if (!modals.length) raiseTop();
  }

  dlg.querySelector('[data-act="cancel"]').addEventListener('click', () => close(true));
  // The scrim swallows clicks. A modal that dismissed on a stray click would
  // lose whatever had been typed into it.
  scrim.addEventListener('mousedown', (e) => { if (e.target === scrim) e.stopPropagation(); });

  build(dlg.querySelector('.w-dialog-body'), handle);
  return handle;
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modals.length) {
    e.preventDefault();
    modals[modals.length - 1].close(true);
    return;
  }
  if (e.ctrlKey && e.key === 'Tab') {
    if (modals.length) return;        // a modal owns the keyboard
    e.preventDefault();
    const ids = [...mains.keys()];
    if (ids.length < 2) return;
    const front = ids.reduce((a, b) =>
      Number(mains.get(a).el.style.zIndex || 0) > Number(mains.get(b).el.style.zIndex || 0) ? a : b);
    raise(ids[(ids.indexOf(front) + 1) % ids.length]);
  }
});

/* ═══ MENUS ═════════════════════════════════════════════════════════════ */

function renderMenu(bar, items) {
  bar.innerHTML = '';
  for (const label of items) {
    const el = document.createElement('div');
    el.className = 'w-menu';
    el.innerHTML = `<u>${label[0]}</u>${label.slice(1)}`;
    if (label === 'Window') el.addEventListener('click', windowMenu);
    bar.appendChild(el);
  }
}

/** The Window menu is on every child, because every render shows it there. */
function windowMenu(e) {
  const old = document.querySelector('.w-dropdown');
  if (old) { old.remove(); return; }

  const r = e.currentTarget.getBoundingClientRect();
  const d = desk.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'w-dropdown';
  Object.assign(menu.style, {
    position: 'absolute', left: (r.left - d.left) + 'px', top: (r.bottom - d.top) + 'px',
    background: 'var(--chrome)', boxShadow: 'var(--raised)', padding: '2px',
    zIndex: ++topZ, minWidth: '180px',
  });

  const row = (label, fn) => {
    const i = document.createElement('div');
    i.className = 'w-menu';
    i.textContent = label;
    i.addEventListener('click', () => { menu.remove(); fn(); });
    menu.appendChild(i);
  };

  row('Cascade', cascade);
  const rule = document.createElement('div');
  rule.style.cssText = 'height:0;margin:2px 4px;box-shadow:var(--thin)';
  menu.appendChild(rule);
  for (const [id, w] of mains) row(w.title, () => raise(id));

  desk.appendChild(menu);
  setTimeout(() => window.addEventListener('mousedown', function off(ev) {
    if (!menu.contains(ev.target)) { menu.remove(); window.removeEventListener('mousedown', off); }
  }), 0);
}

/* ═══ DRAGGING ══════════════════════════════════════════════════════════ */

function dragBy(handle, el) {
  handle.addEventListener('mousedown', (e) => {
    if (e.target.closest('[data-act]')) return;
    if (el.style.width === '100%') return;     // nothing to drag when filling
    const r = el.getBoundingClientRect(), d = desk.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    el.classList.add('is-dragging');

    const move = (ev) => {
      // Keep 80px of title bar on the desk. A window dragged off the top
      // cannot be dragged back.
      el.style.left = Math.min(Math.max(ev.clientX - d.left - dx, -r.width + 80), d.width - 80) + 'px';
      el.style.top  = Math.min(Math.max(ev.clientY - d.top  - dy, 0), d.height - 20) + 'px';
    };
    const up = () => {
      el.classList.remove('is-dragging');
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });
}

/* ═══ START ═════════════════════════════════════════════════════════════ */

// §9b: the browser IS the client area. It opens with the app, filling the
// desk, and has no close button.
openProjectBrowser();
