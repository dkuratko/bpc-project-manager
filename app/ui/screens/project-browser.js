'use strict';

/**
 * PROJECT BROWSER — docs/07, final at v14.
 *
 * §9b: it IS the client area. It never closes, so it has no close button at
 * all, and it opens filling the desk.
 *
 * Every column, colour and rule below traces to the brief. The ones that took
 * arguing over, so nobody undoes them:
 *
 *   · THE CURSOR IS ▶ AND A SPINE. Settled after four rounds. Selection never
 *     greys, washes or fills a row — the row keeps its own status colour,
 *     selected or not.
 *   · A PROBLEM IS A LIP, never a tint. A red row always means FINISHED, so
 *     26-09 is green with a red lip: its real phase, visibly wrong.
 *   · VALUE AND GM% ARE BLANK ON A PROJECT ROW. A project has no value — its
 *     versions do. Expand to see money.
 *   · SORTING BY STATUS sorts by lifecycle position, not alphabetically, so
 *     the list comes out as the ramp itself.
 */

import { openMain } from '../shell.js';

const COLS = '14px 20px 112px 190px minmax(0,1fr) 150px 130px 112px 58px 104px 54px 44px';

const TIER_ORDER = ['quoting', 'accepted', 'received', 'scheduled',
                    'active', 'invoiced', 'closed'];

const state = {
  projects: [],
  counters: [],
  selected: null,        // project id
  expanded: new Set(),
  sort: { col: 'number', dir: 1 },
  find: '',
  showVersions: true,
};

export function openProjectBrowser() {
  return openMain({
    id: 'project-browser',
    title: 'Build Play Contracting — Project Manager',
    menu: ['File', 'Edit', 'View', 'Project', 'Version', 'Catalog', 'Reports', 'Window', 'Help'],
    fillDesk: true,
    closable: false,          // §9b · it never closes
    build: (body) => {
      body.innerHTML = `
        <div class="w-toolbar" data-part="toolbar"></div>
        <div class="w-band" data-part="filters"></div>
        <div data-part="counters" style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px;flex:none"></div>
        <div class="w-list" data-part="list" style="margin-top:3px">
          <div class="w-list-head" data-part="head"></div>
          <div class="w-list-body" data-part="rows" style="overflow:auto"></div>
        </div>
        <div class="w-statusbar" data-part="status"></div>`;

      toolbar(body.querySelector('[data-part=toolbar]'));
      filters(body.querySelector('[data-part=filters]'), body);
      head(body.querySelector('[data-part=head]'), body);
      load(body);
    },
  });
}

async function load(body) {
  const res = await window.bpc.board();
  state.projects = res.projects;
  state.counters = res.counters;
  if (!state.selected && state.projects.length) {
    // The render opens with 26-10 selected and expanded.
    const first = state.projects.find((p) => p.number === '26-10') ?? state.projects[0];
    state.selected = first.id;
    state.expanded.add(first.id);
  }
  draw(body);
}

/* ─── chrome ────────────────────────────────────────────────────────────── */

function toolbar(bar) {
  const btn = (label) => `<span class="w-btn">${label}</span>`;
  bar.innerHTML =
    btn('New project') + btn('New option') + btn('New version') +
    `<span class="w-sep"></span>` + btn('Open') + btn('Duplicate…') +
    `<span class="w-sep"></span>` +
    btn('Catalog ▸') + btn('Contacts') + btn('Equipment') + btn('Trackers') +
    `<span style="flex:1"></span>
     <span style="color:var(--ink-3)">Estimator</span>
     <span class="w-field w-select" style="width:150px">
       <span>DK — Damian Kuratko</span><span class="w-arrow"></span></span>`;
}

function filters(band, body) {
  band.innerHTML = `
    <span style="color:var(--ink-3)">Find</span>
    <span class="w-field" style="width:170px"><input data-find
      style="all:unset;width:100%;font:inherit;letter-spacing:inherit"></span>
    <span class="w-sep"></span>
    <span style="color:var(--ink-3)">Customer</span>
    <span class="w-field w-select" style="width:140px"><span>All</span><span class="w-arrow"></span></span>
    <span style="color:var(--ink-3)">Status</span>
    <span class="w-field w-select" style="width:120px"><span>All</span><span class="w-arrow"></span></span>
    <span class="w-sep"></span>
    <label class="w-checkrow"><span class="w-check" data-versions>✓</span>Show versions</label>
    <label class="w-checkrow"><span class="w-check"></span>Show completed</label>
    <span style="flex:1"></span>
    <span class="w-btn w-btn--sm">Saved views ▼</span>`;

  band.querySelector('[data-find]').addEventListener('input', (e) => {
    state.find = e.target.value.trim().toLowerCase();
    draw(body);
  });
  band.querySelector('[data-versions]').addEventListener('click', (e) => {
    state.showVersions = !state.showVersions;
    e.target.textContent = state.showVersions ? '✓' : '';
    draw(body);
  });
}

const HEADERS = [
  ['', ''], ['', ''],
  ['number', 'PROJECT'], ['status', 'STATUS'], ['title', 'NAME'],
  ['customer', 'CUSTOMER'], ['contact', 'CONTACT'], ['location', 'LOCATION'],
  ['versions', 'VERS'], ['value', 'VALUE'], ['margin', 'GM%'], ['', 'FLAGS'],
];

function head(host, body) {
  host.style.gridTemplateColumns = COLS;
  host.innerHTML = HEADERS.map(([key, label]) =>
    `<span data-sort="${key}" style="${key ? 'cursor:default' : ''}">${label}${
      state.sort.col === key ? (state.sort.dir > 0 ? ' ▲' : ' ▼') : ''}</span>`).join('');

  host.querySelectorAll('[data-sort]').forEach((el) => {
    const key = el.dataset.sort;
    if (!key) return;
    el.addEventListener('click', () => {
      state.sort = state.sort.col === key
        ? { col: key, dir: -state.sort.dir }
        : { col: key, dir: 1 };
      head(host, body);
      draw(body);
    });
  });
}

/* ─── the list ──────────────────────────────────────────────────────────── */

function draw(body) {
  counterTiles(body.querySelector('[data-part=counters]'));
  rows(body.querySelector('[data-part=rows]'), body);
  statusBar(body.querySelector('[data-part=status]'));
}

function visible() {
  let list = state.projects;
  if (state.find) {
    const q = state.find;
    list = list.filter((p) => [p.number, p.title, p.customer, p.contact, p.location]
      .some((f) => f && String(f).toLowerCase().includes(q)));
  }
  return [...list].sort(compare);
}

function compare(a, b) {
  const d = state.sort.dir;
  switch (state.sort.col) {
    // docs/07 · by LIFECYCLE position, not alphabetically. The list comes
    // out as the ramp itself.
    case 'status':   return d * (TIER_ORDER.indexOf(a.status.tier) - TIER_ORDER.indexOf(b.status.tier));
    case 'versions': return d * (a.versions.length - b.versions.length);
    case 'value':    return d * (sumOf(a) - sumOf(b));
    case 'margin':   return d * ((marginOf(a) ?? -1) - (marginOf(b) ?? -1));
    case 'number':   return d * (a.sequence - b.sequence);
    default: {
      const k = state.sort.col;
      return d * String(a[k] ?? '').localeCompare(String(b[k] ?? ''));
    }
  }
}

const sumOf = (p) => p.versions.reduce((t, v) => t + (v.value ?? 0), 0);
const marginOf = (p) => {
  const m = p.versions.map((v) => v.margin).filter((x) => x != null);
  return m.length ? m.reduce((t, x) => t + x, 0) / m.length : null;
};

function rows(host, body) {
  host.innerHTML = '';
  const list = visible();

  for (const p of list) {
    const isOpen = state.expanded.has(p.id);
    const isSel = state.selected === p.id;
    host.appendChild(projectRow(p, isOpen, isSel, body));

    if (!isOpen || !state.showVersions) continue;

    p.versions.forEach((v, i) => {
      const prev = p.versions[i - 1];
      // docs/07 · 1px #d0d0d0 between versions; a heavier rule and spacing
      // where one option ends and the next begins.
      if (prev && prev.letter !== v.letter) host.appendChild(optionBreak(isSel));
      else if (prev) host.appendChild(versionRule(isSel));
      host.appendChild(versionRow(p, v, isSel, body));
    });
  }

  if (!list.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:14px;color:var(--ink-3)';
    empty.textContent = state.find ? `Nothing matches “${state.find}”.` : 'No projects yet.';
    host.appendChild(empty);
  }
}

function projectRow(p, isOpen, isSel, body) {
  const el = document.createElement('div');
  el.className = 'w-row';
  el.style.gridTemplateColumns = COLS;
  // The row keeps its STATUS colour. Selection never tints it.
  el.style.background = p.status.colour;
  if (p.status.hasProblem) el.classList.add('w-row--problem');

  el.innerHTML = `
    <span class="w-gutter">${isSel ? '<span class="w-spine"></span>' : ''}${
      p.status.hasProblem && !isSel ? '<span class="w-problem-lip"></span>' : ''}${
      isSel ? '<span class="w-caret"></span>' : ''}</span>
    <span style="display:flex;align-items:center;justify-content:center">
      <span class="w-expand">${isOpen ? '−' : '+'}</span></span>
    <span class="mono">${p.number}</span>
    <span${p.status.hasProblem ? ' style="color:var(--bad)"' : ''}>${label(p.status)}</span>
    <span>${esc(p.title)}</span>
    <span>${esc(p.customer ?? '')}</span>
    <span>${esc(p.contact ?? '')}</span>
    <span>${esc(p.location ?? '')}</span>
    <span class="num mono">${p.versions.length}</span>
    <span class="w-na">—</span>
    <span class="w-na">—</span>
    <span style="text-align:center">${p.flags.join(' ')}</span>`;

  el.addEventListener('click', () => { state.selected = p.id; draw(body); });
  el.querySelector('.w-expand').addEventListener('click', (e) => {
    e.stopPropagation();
    state.expanded.has(p.id) ? state.expanded.delete(p.id) : state.expanded.add(p.id);
    state.selected = p.id;
    draw(body);
  });
  return el;
}

function versionRow(p, v, isSel, body) {
  const el = document.createElement('div');
  el.className = 'w-row';
  el.style.gridTemplateColumns = COLS;
  el.style.background = v.status.colour;
  if (v.status.hasProblem) el.classList.add('w-row--problem');

  el.innerHTML = `
    <span class="w-gutter">${isSel ? '<span class="w-spine"></span>' : ''}${
      v.status.hasProblem && !isSel ? '<span class="w-problem-lip"></span>' : ''}</span>
    <span></span>
    <span class="mono" style="padding-left:16px">${v.tag}</span>
    <span${v.status.hasProblem ? ' style="color:var(--bad)"' : ''}>${label(v.status)}</span>
    <span>${esc(v.name ?? '')}</span>
    <span style="color:#606060">${esc(p.customer ?? '')}</span>
    <span style="color:#606060">${esc(p.contact ?? '')}</span>
    <span style="color:#606060">${esc(p.location ?? '')}</span>
    <span></span>
    <span class="num mono">${v.value == null ? '<span class="w-na">—</span>' : money(v.value)}</span>
    <span class="num mono">${v.margin == null ? '<span class="w-na">—</span>' : v.margin.toFixed(1)}</span>
    <span style="text-align:center">${v.flags.join(' ')}</span>`;

  el.addEventListener('click', () => { state.selected = p.id; draw(body); });
  // §9b · double-click a version opens the VERSION VIEW.
  el.addEventListener('dblclick', () => openVersionView(v));
  return el;
}

function versionRule(isSel) {
  const el = document.createElement('div');
  el.style.cssText = `display:grid;grid-template-columns:${COLS}`;
  el.innerHTML = `<span class="w-gutter">${isSel ? '<span class="w-spine"></span>' : ''}</span>
    <span style="grid-column:2/-1;border-top:1px solid #d0d0d0"></span>`;
  return el;
}

function optionBreak(isSel) {
  const el = document.createElement('div');
  el.style.cssText = `display:grid;grid-template-columns:${COLS};height:5px`;
  el.innerHTML = `<span class="w-gutter">${isSel ? '<span class="w-spine"></span>' : ''}</span>
    <span style="grid-column:2/-1;border-top:1px solid var(--edge);margin-top:2px"></span>`;
  return el;
}

/* ─── counters · each one is a filter ───────────────────────────────────── */

function counterTiles(host) {
  host.innerHTML = state.counters.map((c) => `
    <div style="background:var(--chrome);box-shadow:var(--raised);
                border-top:2px solid var(--edge);padding:5px 8px 6px;cursor:default">
      <div style="color:var(--ink-3);white-space:nowrap;overflow:hidden;
                  text-overflow:ellipsis">${esc(c.label)}</div>
      <div class="mono" style="font-size:19px;line-height:1.25">${esc(c.value)}</div>
      <div style="color:${c.warn ? 'var(--bad)' : 'var(--ink-3)'};white-space:nowrap;
                  overflow:hidden;text-overflow:ellipsis">${esc(c.sub)}</div>
    </div>`).join('');
}

function statusBar(host) {
  const shown = visible().length;
  const total = state.projects.length;
  host.innerHTML = `
    <div class="grow">Enter opens a version · → expands · Ctrl+N new project
      &nbsp;&nbsp;│&nbsp;&nbsp;
      <span style="color:var(--bad)">!</span> blocked or overdue ·
      <span>⚑</span> change order · <span>$</span> quote expiring</div>
    <div style="width:200px;flex:none">${shown} of ${total} · view: Open</div>`;
}

/* ─── bits ──────────────────────────────────────────────────────────────── */

// docs/07 · the ramp is a progression, so the label is sentence case while
// quoting and shouted once the job is real. Matching the render.
const label = (s) => s.tier === 'quoting'
  ? s.label.charAt(0) + s.label.slice(1).toLowerCase()
  : s.label;

const money = (n) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const esc = (s) => String(s ?? '').replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function openVersionView(v) {
  // The hub for one job — docs/09. Not built yet; this is the hook §9b names.
  openMain({
    id: `version:${v.id}`,
    title: `Version ${v.tag} — ${v.name ?? ''}`,
    menu: ['File', 'Edit', 'Version', 'Documents', 'Tools', 'Window', 'Help'],
    width: 1000, height: 780,
    build: (body) => {
      body.innerHTML = `<div style="padding:12px;color:var(--ink-2);line-height:1.6">
        <b>Version view — docs/09, FINAL v3.</b><br>
        Not built yet. §9b has it opening from here, so the route exists
        before the room does.</div>`;
    },
  });
}
