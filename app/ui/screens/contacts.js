'use strict';

/**
 * CONTACTS — docs/15, a LIST WINDOW (docs/14). 1000 × 640.
 *
 * The project browser's grouped list with different columns. The cursor, the
 * banding, the row rules and the type sizing are taken verbatim and are NOT
 * re-decided here — docs/14 says the selection colour was settled after four
 * rounds and is closed.
 *
 * ⛔ No counters. Counting contacts by kind is trivia, not a to-do list; the
 *    Kind dropdown does the same job without pretending to be urgent.
 * ⛔ No phone or email on a company row. A company is not a person.
 * ⛔ A collapsed company renders NO child rows — not even a "2 people"
 *    placeholder. A placeholder is a row you can select, which would need a
 *    selection rule and a keyboard behaviour, for something that is not data.
 * ⛔ The screen strip never collapses, or every selection change jogs the list.
 */

import { openMain, openPopup } from '../shell.js';

const COLS = '14px 20px minmax(0,1fr) 148px 108px 200px 36px 64px';

const state = {
  customers: [],
  counts: { customers: 0, people: 0 },
  selected: null,          // { kind: 'customer' | 'contact', id }
  expanded: new Set(),
  find: '',
  kind: 'All',
  showPeople: true,
  showInactive: false,
};

export function openContacts() {
  return openMain({
    id: 'contacts',
    title: 'Contacts',
    menu: ['File', 'Edit', 'View', 'Contact', 'Window', 'Help'],
    width: 1000, height: 640,
    build: (body) => {
      body.innerHTML = `
        <div class="w-toolbar" data-part="toolbar"></div>
        <div class="w-band" data-part="filters"></div>
        <div class="w-list" data-part="list" style="margin-top:3px">
          <div class="w-list-head" data-part="head"></div>
          <div class="w-list-body" data-part="rows" style="overflow:auto"></div>
        </div>
        <div data-part="strip"></div>
        <div class="w-statusbar" data-part="status"></div>`;

      toolbar(body.querySelector('[data-part=toolbar]'), body);
      filters(body.querySelector('[data-part=filters]'), body);
      head(body.querySelector('[data-part=head]'));
      keys(body);
      load(body);
    },
  });
}

async function load(body) {
  const res = await window.bpc.contacts({ showInactive: state.showInactive });
  state.customers = res.customers;
  state.counts = res.counts;
  if (!state.selected && state.customers.length) {
    // Open on the first company, expanded — the same courtesy the browser does.
    state.expanded.add(state.customers[0].id);
    state.selected = { kind: 'customer', id: state.customers[0].id };
  }
  draw(body);
  body.querySelector('[data-part=rows]').focus();
}

/* ─── chrome ────────────────────────────────────────────────────────────── */

function toolbar(el, body) {
  el.innerHTML = `
    <span class="w-btn" data-act="new-customer">New customer</span>
    <span class="w-btn" data-act="new-contact">New contact</span>
    <span class="w-sep"></span>
    <span class="w-btn" data-act="properties">Properties</span>
    <span class="w-btn" data-act="deactivate">Deactivate</span>`;
  // ⛔ No Delete here. Delete is right-click only, and only on a row nothing
  //    points at — docs/15.
  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act) action(act, body);
  });
}

function filters(el, body) {
  el.innerHTML = `
    <span>Find</span>
    <span class="w-field" style="width:190px"><input data-f="find" style="width:100%"></span>
    <span style="width:10px"></span>
    <span>Kind</span>
    <span class="w-field w-select" style="width:130px" data-f="kind">
      <span>All</span><span class="w-arrow"></span></span>
    <span style="width:14px"></span>
    <label class="w-check"><input type="checkbox" data-f="people" checked> Show people</label>
    <label class="w-check"><input type="checkbox" data-f="inactive"> Show inactive</label>`;

  el.querySelector('[data-f=find]').addEventListener('input', (e) => {
    state.find = e.target.value.trim().toLowerCase(); draw(body);
  });
  el.querySelector('[data-f=people]').addEventListener('change', (e) => {
    state.showPeople = e.target.checked; draw(body);
  });
  el.querySelector('[data-f=inactive]').addEventListener('change', (e) => {
    state.showInactive = e.target.checked; load(body);
  });
  el.querySelector('[data-f=kind]').addEventListener('click', () => cycleKind(el, body));
}

// One flat list of kinds, cycled in place. A real dropdown is a popup, and
// docs/15 holds this screen to one window with no dialogs open.
function cycleKind(el, body) {
  const kinds = ['All', ...new Set(state.customers.map((c) => c.kind).filter(Boolean))];
  state.kind = kinds[(kinds.indexOf(state.kind) + 1) % kinds.length];
  el.querySelector('[data-f=kind] span').textContent = state.kind;
  draw(body);
}

function head(el) {
  el.style.gridTemplateColumns = COLS;
  // Both leading columns are unlabelled — the gutter holds the spine and ▶,
  // the expand column holds − / +.
  el.innerHTML = `
    <span></span><span></span>
    <span>NAME</span><span>TITLE / KIND</span><span>PHONE</span><span>EMAIL</span>
    <span style="text-align:center">AUTO</span>
    <span class="num">PROJECTS</span>`;
}

/* ─── the list ──────────────────────────────────────────────────────────── */

function draw(body) {
  rows(body.querySelector('[data-part=rows]'), body);
  strip(body.querySelector('[data-part=strip]'));
  statusBar(body.querySelector('[data-part=status]'));
}

function visible() {
  let list = state.customers;
  if (state.kind !== 'All') list = list.filter((c) => c.kind === state.kind);
  if (!state.find) return list;

  const q = state.find;
  const hit = (s) => (s ?? '').toLowerCase().includes(q);
  // A company matches on its own fields OR on any of its people — otherwise
  // searching for a person would hide the company they work at.
  return list
    .map((c) => ({ ...c, people: c.people.filter(
      (p) => hit(p.name) || hit(p.title) || hit(p.email) || hit(p.phone)) }))
    .filter((c) => hit(c.name) || hit(c.kind) || c.people.length);
}

function isSel(kind, id) {
  return state.selected?.kind === kind && state.selected?.id === id;
}

function rows(host, body) {
  host.innerHTML = '';
  const list = visible();

  for (const c of list) {
    const isOpen = state.expanded.has(c.id);
    // The spine marks the GROUP, so it is on whenever the cursor is anywhere
    // inside this company — the company row or any of its people.
    const inGroup = isSel('customer', c.id)
      || c.people.some((p) => isSel('contact', p.id));

    const group = document.createElement('div');
    group.style.position = 'relative';
    // An absolutely-positioned bar down the full height of the group wrapper.
    // A position:relative wrapper with no bar in it is v1's exact failure.
    if (inGroup) group.innerHTML =
      '<span style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#000"></span>';

    group.appendChild(customerRow(c, isOpen, inGroup, body));
    if (isOpen && state.showPeople) {
      c.people.forEach((p, i) => group.appendChild(contactRow(p, i, inGroup, body)));
    }
    host.appendChild(group);
  }

  if (!list.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:14px;color:var(--ink-3)';
    empty.textContent = state.find ? `Nothing matches “${state.find}”.` : 'No contacts yet.';
    host.appendChild(empty);
  }
}

function customerRow(c, isOpen, inGroup, body) {
  const el = document.createElement('div');
  el.className = 'w-row';
  el.style.gridTemplateColumns = COLS;
  const cursor = isSel('customer', c.id);
  if (cursor) el.dataset.cursor = '1';

  el.innerHTML = `
    <span class="w-gutter">${cursor ? '<span class="w-caret"></span>' : ''}</span>
    <span class="w-expand">${isOpen ? '−' : '+'}</span>
    <span style="font-weight:bold${c.active ? '' : ';color:#808080'}">${esc(c.name)}</span>
    <span style="color:#606060">${esc(c.kind ?? '')}</span>
    <span></span><span></span>
    <span style="text-align:center;color:#404040">${c.auto ? 'cc' : ''}</span>
    <span class="num mono">${c.projects}</span>`;

  el.addEventListener('click', () => {
    state.selected = { kind: 'customer', id: c.id }; draw(body);
  });
  el.querySelector('.w-expand').addEventListener('click', (e) => {
    e.stopPropagation();
    state.expanded.has(c.id) ? state.expanded.delete(c.id) : state.expanded.add(c.id);
    state.selected = { kind: 'customer', id: c.id };
    draw(body);
  });
  el.addEventListener('dblclick', () => notBuiltYet('Customer properties', 'docs/16'));
  return el;
}

function contactRow(p, i, inGroup, body) {
  const el = document.createElement('div');
  el.className = 'w-row';
  el.style.gridTemplateColumns = COLS;
  if (i % 2) el.style.background = '#fafafa';   // alternating tint on children
  const cursor = isSel('contact', p.id);
  if (cursor) el.dataset.cursor = '1';
  const dim = p.active ? '' : 'color:#808080';

  el.innerHTML = `
    <span class="w-gutter">${cursor ? '<span class="w-caret"></span>' : ''}</span>
    <span></span>
    <span style="padding-left:16px;${dim}">${esc(p.name)}</span>
    <span style="${dim || 'color:#404040'}">${esc(p.title ?? '')}</span>
    <span class="mono" style="${dim}">${esc(p.phone ?? '')}</span>
    <span style="${dim || 'color:#404040'};overflow:hidden;text-overflow:ellipsis">${esc(p.email ?? '')}</span>
    <span style="text-align:center;color:#404040">${p.auto ? 'cc' : ''}</span>
    <span class="num mono" style="${dim}">${p.projects}</span>`;

  el.addEventListener('click', () => {
    state.selected = { kind: 'contact', id: p.id }; draw(body);
  });
  el.addEventListener('dblclick', () => notBuiltYet('Contact properties', 'docs/16'));
  return el;
}

/* ─── screen strip · two labelled segments, never collapses ─────────────── */

function strip(el) {
  const row = selectedRow();
  el.className = '';
  el.style.cssText = 'box-shadow:var(--sunken);background:#fff;flex:none;' +
    'display:flex;align-items:center;gap:0;padding:3px 6px;margin-top:3px';

  const seg = (label, value, grey) => `
    <span style="display:flex;gap:7px;align-items:baseline;min-width:0;flex:1">
      <span style="color:var(--ink-3);flex:none">${label}</span>
      <span style="${grey ? 'color:#808080' : ''};overflow:hidden;
                   text-overflow:ellipsis;white-space:nowrap">${value}</span></span>`;

  // Both segments hold their place with a dash. The strip holding its height
  // is the whole point — otherwise every selection change jogs the list.
  const auto = row?.auto ?? null;
  const note = row?.notes ?? null;
  el.innerHTML =
    seg('Always', auto ? esc(auto) : '—', !auto) +
    '<span style="color:#c0c0c0;padding:0 10px">│</span>' +
    seg('Note', note ? esc(note) : '— no note —', !note);
}

function selectedRow() {
  if (!state.selected) return null;
  for (const c of state.customers) {
    if (state.selected.kind === 'customer' && c.id === state.selected.id) return c;
    const p = c.people.find((x) => x.id === state.selected.id);
    if (state.selected.kind === 'contact' && p) return p;
  }
  return null;
}

function statusBar(el) {
  const { customers, people } = state.counts;
  el.innerHTML = `
    <div class="grow">double-click to edit · a contact on a project cannot be deleted</div>
    <div style="flex:none">${customers} customer${customers === 1 ? '' : 's'} ·
      ${people} ${people === 1 ? 'person' : 'people'}</div>`;
}

/* ─── the keyboard, same grammar as the browser ─────────────────────────── */

function keys(body) {
  const host = body.querySelector('[data-part=rows]');
  host.tabIndex = 0;

  host.addEventListener('keydown', (e) => {
    const flat = [];
    for (const c of visible()) {
      flat.push({ kind: 'customer', id: c.id });
      if (state.expanded.has(c.id) && state.showPeople) {
        c.people.forEach((p) => flat.push({ kind: 'contact', id: p.id }));
      }
    }
    if (!flat.length) return;

    const at = Math.max(0, flat.findIndex(
      (r) => r.kind === state.selected?.kind && r.id === state.selected?.id));
    const move = (to) => {
      state.selected = flat[Math.min(flat.length - 1, Math.max(0, to))];
      draw(body);
      host.querySelector('[data-cursor]')?.scrollIntoView({ block: 'nearest' });
    };
    const company = () => state.selected?.kind === 'customer'
      ? state.selected.id
      : state.customers.find((c) => c.people.some((p) => p.id === state.selected?.id))?.id;

    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(at + 1); break;
      case 'ArrowUp':   e.preventDefault(); move(at - 1); break;
      case 'ArrowRight':
        e.preventDefault();
        if (state.selected?.kind === 'customer') { state.expanded.add(state.selected.id); draw(body); }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (state.selected?.kind === 'contact') state.selected = { kind: 'customer', id: company() };
        else state.expanded.delete(state.selected.id);
        draw(body);
        break;
      case 'Enter':
        e.preventDefault();
        action('properties', body);
        break;
    }
  });
}

/* ─── actions ───────────────────────────────────────────────────────────── */

async function action(act, body) {
  const row = selectedRow();
  if (act === 'new-customer') return notBuiltYet('New customer', 'docs/16');
  // New contact creates the person under whichever customer is selected — if
  // a person is selected, their company. docs/15.
  if (act === 'new-contact')  return notBuiltYet('New contact', 'docs/16');
  if (act === 'properties') {
    return notBuiltYet(state.selected?.kind === 'customer'
      ? 'Customer properties' : 'Contact properties', 'docs/16');
  }
  if (act === 'deactivate' && row) {
    await window.bpc.setContactActive({
      kind: state.selected.kind, id: row.id, active: !row.active });
    return load(body);
  }
}

function notBuiltYet(title, brief) {
  openPopup({
    title, width: 480,
    build: (host, popup) => {
      host.innerHTML = `
        <div class="w-tip">
          <span style="flex:none">📋</span>
          <span><b>${title} — ${brief}.</b><br>
          Briefed, not built yet. The route exists before the room does.</span>
        </div>
        <div class="w-buttons"><span class="w-btn w-btn--default"
             style="width:78px" data-close>OK</span></div>`;
      host.querySelector('[data-close]').addEventListener('click', () => popup.close());
    },
  });
}

const esc = (s) => s == null ? '' : String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
