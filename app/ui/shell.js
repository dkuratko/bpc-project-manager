'use strict';

/**
 * The desk, and the windows on it.
 *
 * 00-TREE: "SHELL IS MDI — child windows in one Project Manager frame,
 * Window menu, Cascade, Ctrl+Tab. the teal desk is the client area." And as
 * of 04 Oct, each child owns its own menu and toolbar — so a window here is
 * a complete screen with chrome, not a panel in a shared frame.
 */

import { openProjectBrowser } from './screens/project-browser.js';

const desk = document.getElementById('desk');

/* ─── the frame's own three buttons ─────────────────────────────────────── */
document.querySelectorAll('[data-frame]').forEach((el) =>
  el.addEventListener('click', () => window.bpc.frame[el.dataset.frame]()));

/* ─── windows ───────────────────────────────────────────────────────────── */

const windows = new Map();   // id → { el, title, restore }
let topZ = 10;
let cascadeStep = 0;

export function openWindow({ id, title, width, height, build, menu, onFocus }) {
  // One window per screen. Asking twice raises the one that is open rather
  // than stacking a duplicate nobody asked for.
  const existing = windows.get(id);
  if (existing) { focusWindow(id); return existing.el; }

  const el = document.createElement('div');
  el.className = 'w-window';
  el.dataset.win = id;
  el.style.width = width + 'px';
  el.style.height = height + 'px';

  // Cascade from the top-left, stepping so a second window is findable.
  const step = (cascadeStep++ % 6) * 22;
  el.style.left = (18 + step) + 'px';
  el.style.top = (14 + step) + 'px';

  el.innerHTML = `
    <div class="w-titlebar">
      <span class="w-title"></span>
      <span style="display:flex;gap:2px;flex:none">
        <span class="w-titlebtn" data-act="minimize"><span style="display:block;width:7px;height:2px;background:#000;margin-top:5px"></span></span>
        <span class="w-titlebtn" data-act="maximize"><span style="display:block;width:8px;height:7px;border:1px solid #000;border-top-width:2px"></span></span>
        <span class="w-titlebtn" data-act="close">
          <span style="position:absolute;width:9px;height:1px;background:#000;transform:rotate(45deg)"></span>
          <span style="position:absolute;width:9px;height:1px;background:#000;transform:rotate(-45deg)"></span></span>
      </span>
    </div>
    <div class="w-menubar"></div>
    <div class="w-body" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:3px"></div>`;

  el.querySelector('.w-title').textContent = title;
  renderMenu(el.querySelector('.w-menubar'), menu ?? defaultMenu());

  desk.appendChild(el);
  windows.set(id, { el, title, restore: null, onFocus });

  dragBy(el.querySelector('.w-titlebar'), el);
  el.addEventListener('mousedown', () => focusWindow(id), true);
  el.querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', (e) => { e.stopPropagation(); windowAction(id, b.dataset.act); }));

  build(el.querySelector('.w-body'), el);
  focusWindow(id);
  return el;
}

function windowAction(id, act) {
  const w = windows.get(id);
  if (!w) return;
  const { el } = w;

  if (act === 'close') { el.remove(); windows.delete(id); focusTop(); return; }

  if (act === 'minimize') {
    // Minimised means out of the way, not gone — the Window menu still has it.
    el.style.display = el.style.display === 'none' ? '' : 'none';
    if (el.style.display === 'none') focusTop();
    return;
  }

  if (act === 'maximize') {
    if (w.restore) {
      Object.assign(el.style, w.restore);
      w.restore = null;
    } else {
      w.restore = { left: el.style.left, top: el.style.top,
                    width: el.style.width, height: el.style.height };
      Object.assign(el.style, { left: '0px', top: '0px',
                                width: '100%', height: '100%' });
    }
  }
}

export function focusWindow(id) {
  const w = windows.get(id);
  if (!w) return;
  w.el.style.zIndex = ++topZ;
  for (const [otherId, other] of windows) {
    other.el.querySelector('.w-titlebar')
         .classList.toggle('inactive', otherId !== id);
  }
  w.onFocus?.();
}

function focusTop() {
  let best = null, bestZ = -1;
  for (const [id, w] of windows) {
    if (w.el.style.display === 'none') continue;
    const z = Number(w.el.style.zIndex || 0);
    if (z > bestZ) { bestZ = z; best = id; }
  }
  if (best) focusWindow(best);
}

export function cascade() {
  let i = 0;
  for (const [, w] of windows) {
    w.restore = null;
    w.el.style.display = '';
    w.el.style.left = (18 + i * 22) + 'px';
    w.el.style.top = (14 + i * 22) + 'px';
    w.el.style.zIndex = ++topZ;
    i++;
  }
}

/* Ctrl+Tab through what is open, in the order it was opened. */
window.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey && e.key === 'Tab')) return;
  e.preventDefault();
  const ids = [...windows.keys()];
  if (ids.length < 2) return;
  const front = ids.reduce((a, b) =>
    Number(windows.get(a).el.style.zIndex || 0) > Number(windows.get(b).el.style.zIndex || 0) ? a : b);
  focusWindow(ids[(ids.indexOf(front) + 1) % ids.length]);
});

/* ─── menus ─────────────────────────────────────────────────────────────── */

function defaultMenu() {
  return ['File', 'Edit', 'View', 'Window', 'Help'];
}

function renderMenu(bar, items) {
  bar.innerHTML = '';
  for (const label of items) {
    const el = document.createElement('div');
    el.className = 'w-menu';
    // Win2000 underlines the accelerator. First letter unless told otherwise.
    el.innerHTML = `<u>${label[0]}</u>${label.slice(1)}`;
    if (label === 'Window') el.addEventListener('click', cascade);
    bar.appendChild(el);
  }
}

/* ─── dragging ──────────────────────────────────────────────────────────── */

function dragBy(handle, el) {
  handle.addEventListener('mousedown', (e) => {
    if (e.target.closest('[data-act]')) return;   // the three buttons
    const r = el.getBoundingClientRect();
    const d = desk.getBoundingClientRect();
    const dx = e.clientX - r.left, dy = e.clientY - r.top;
    el.classList.add('is-dragging');

    const move = (ev) => {
      // Keep at least the title bar reachable — a window dragged off the top
      // of the desk cannot be dragged back.
      const x = Math.min(Math.max(ev.clientX - d.left - dx, -r.width + 80), d.width - 80);
      const y = Math.min(Math.max(ev.clientY - d.top - dy, 0), d.height - 20);
      el.style.left = x + 'px';
      el.style.top = y + 'px';
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

/* ─── start ─────────────────────────────────────────────────────────────── */

// docs/07: the project browser is the frame. It opens with the app.
openProjectBrowser();
