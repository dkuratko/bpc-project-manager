'use strict';

/**
 * EQUIPMENT — docs/18, a LIST WINDOW (docs/14). 1180 × 640.
 *
 * TWO TABS, because the columns differ. An owned unit has a VIN, a capacity,
 * a deck and a computed $/mi; a rental has a card rate, a minimum and a move.
 * In one list those headers would change under you depending on what you
 * clicked — a tab is a promise about what the columns are.
 *
 * v2 folded the 214px facet rail into the filter band and moved the
 * maintenance counters into the status bar. That was accepted and it stands:
 * it buys ~220px for the list, and two dropdowns filter simultaneously
 * exactly as two facet groups did.
 *
 * ⛔ No navy selection, no 11px type, no notes panel — docs/14's do-not-take
 *    list for the catalog reference.
 * ⛔ The detail pane REPLACES the screen strip. They answer the same question
 *    at different sizes, so this window has no strip.
 */

import { openMain, openPopup } from '../shell.js';

const OWNED_COLS = '14px minmax(0,1fr) 150px 80px 76px 100px 90px';
const RENT_COLS  = '14px minmax(0,1fr) 130px 160px 54px 76px';

const state = {
  tab: 'owned',
  owned: null,
  rented: null,
  selected: null,
  detail: null,
  expanded: new Set(),      // rented: supplier and type band keys
  find: '',
  type: 'All',
  showInactive: false,
  counterFilter: null,      // a maintenance counter, clicked
  sort: { col: 'name', dir: 1 },
};

export function openEquipment() {
  return openMain({
    id: 'equipment',
    title: 'Equipment',
    menu: ['File', 'Edit', 'View', 'Equipment', 'Window', 'Help'],
    width: 1180, height: 640,
    build: (body) => {
      body.innerHTML = `
        <div class="w-toolbar" data-part="toolbar"></div>
        <div class="w-band" data-part="filters"></div>
        <div data-part="tabs" style="display:flex;gap:1px;padding:4px 2px 0;flex:none"></div>
        <div data-part="panel" style="flex:1;min-height:0;display:flex;gap:4px;
             box-shadow:var(--sunken);background:#c0c0c0;padding:3px">
          <div style="flex:1;min-width:0;display:flex;flex-direction:column">
            <div class="w-list" style="flex:1;min-height:0;display:flex;flex-direction:column">
              <div class="w-list-head" data-part="head"></div>
              <div class="w-list-body" data-part="rows" style="overflow:auto;flex:1"></div>
            </div>
          </div>
          <div data-part="detail" style="width:330px;flex:none;overflow:auto;
               box-shadow:var(--raised);background:#c0c0c0;padding:7px"></div>
        </div>
        <div class="w-statusbar" data-part="status"></div>`;

      toolbar(body.querySelector('[data-part=toolbar]'));
      filters(body.querySelector('[data-part=filters]'), body);
      tabs(body.querySelector('[data-part=tabs]'), body);
      keys(body);
      load(body);
    },
  });
}

async function load(body) {
  const res = await window.bpc.equipment({ showInactive: state.showInactive });
  state.owned = res.owned;
  state.rented = res.rented;
  if (!state.selected) selectFirst();
  await refreshDetail();
  draw(body);
  body.querySelector('[data-part=rows]').focus();
}

function selectFirst() {
  state.selected = state.tab === 'owned'
    ? state.owned.units[0]?.id ?? null
    : state.rented.offerings[0]?.id ?? null;
}

async function refreshDetail() {
  state.detail = state.selected ? await window.bpc.equipmentDetail(state.selected) : null;
}

/* ─── chrome ────────────────────────────────────────────────────────────── */

function toolbar(el) {
  el.innerHTML = `
    <span class="w-btn" data-act="new-type">New type</span>
    <span class="w-btn" data-act="new-unit">New unit</span>
    <span class="w-btn" data-act="new-offering">New offering</span>
    <span class="w-btn" data-act="new-supplier">New supplier</span>
    <span class="w-sep"></span>
    <span class="w-btn" data-act="properties">Properties</span>
    <span class="w-btn" data-act="deactivate">Deactivate</span>
    <span class="w-sep"></span>
    <span class="w-btn" data-act="fuel">Fuel prices…</span>`;
  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'fuel') return openFuelPrices();
    if (act) notBuiltYet({
      'new-type': ['New type', 'docs/23'],
      'new-unit': ['Equipment properties', 'docs/18'],
      'new-offering': ['Rental offering', 'docs/21'],
      'new-supplier': ['New supplier', 'docs/20'],
      'properties': ['Equipment properties', 'docs/18'],
      'deactivate': ['Deactivate', 'docs/18'],
    }[act] ?? [act, 'docs/18']);
  });
}

function filters(el, body) {
  el.innerHTML = `
    <span>Find</span>
    <span class="w-field" style="width:170px"><input data-f="find" style="width:100%"></span>
    <span style="width:10px"></span>
    <span>Type</span>
    <span class="w-field w-select" style="width:130px" data-f="type">
      <span>All</span><span class="w-arrow"></span></span>
    <span style="width:14px"></span>
    <label class="w-check"><input type="checkbox" data-f="inactive"> Show inactive</label>
    <span style="flex:1"></span>
    <span data-f="clear" style="color:var(--ink-3)"></span>`;

  el.querySelector('[data-f=find]').addEventListener('input', (e) => {
    state.find = e.target.value.trim().toLowerCase(); draw(body);
  });
  el.querySelector('[data-f=inactive]').addEventListener('change', (e) => {
    state.showInactive = e.target.checked; load(body);
  });
  el.querySelector('[data-f=type]').addEventListener('click', () => {
    const types = ['All', ...new Set(rowsForTab().map((r) => r.typeName))];
    state.type = types[(types.indexOf(state.type) + 1) % types.length];
    el.querySelector('[data-f=type] span').textContent = state.type;
    draw(body);
  });
}

function tabs(el, body) {
  const tab = (id, label) =>
    `<span class="w-tab${state.tab === id ? ' is-active' : ''}" data-tab="${id}">${label}</span>`;
  el.innerHTML = tab('owned', 'Owned') + tab('rented', 'Rented');
  el.addEventListener('click', async (e) => {
    const id = e.target.closest('[data-tab]')?.dataset.tab;
    if (!id || id === state.tab) return;
    state.tab = id;
    state.type = 'All';
    state.counterFilter = null;
    selectFirst();
    await refreshDetail();
    tabs(el, body);
    draw(body);
  });
}

/* ─── draw ──────────────────────────────────────────────────────────────── */

function draw(body) {
  head(body.querySelector('[data-part=head]'), body);
  (state.tab === 'owned' ? ownedRows : rentedRows)(
    body.querySelector('[data-part=rows]'), body);
  detailPane(body.querySelector('[data-part=detail]'));
  statusBar(body.querySelector('[data-part=status]'), body);
  const clear = body.querySelector('[data-f=clear]');
  if (clear) clear.innerHTML = state.counterFilter
    ? `filtered: ${state.counterFilter} <span class="w-btn" data-clear
        style="margin-left:6px">Clear</span>` : '';
  clear?.querySelector('[data-clear]')?.addEventListener('click', () => {
    state.counterFilter = null; draw(body);
  });
}

function head(el, body) {
  const cols = state.tab === 'owned'
    ? [['name', 'NAME'], ['serial', 'VIN / SERIAL'], ['type', 'TYPE'],
       ['capacity', 'CAPACITY', 'num'], ['deck', 'DECK L × W'], ['rate', 'RATE', 'num']]
    : [['name', 'NAME'], ['card', 'CARD RATE'], ['paid', 'LAST PAID'],
       ['min', 'MIN'], ['move', 'MOVE']];
  el.style.gridTemplateColumns = state.tab === 'owned' ? OWNED_COLS : RENT_COLS;
  el.innerHTML = '<span></span>' + cols.map(([id, label, cls]) =>
    `<span class="${cls ?? ''}" data-sort="${id}" style="cursor:default">${label}${
      state.sort.col === id ? (state.sort.dir > 0 ? ' ▲' : ' ▼') : ''}</span>`).join('');

  // Any header sorts — the Owned tab is flat, so sorting is the whole
  // navigation. The Rented tab is grouped, so its headers do not sort.
  if (state.tab === 'owned') el.addEventListener('click', (e) => {
    const col = e.target.closest('[data-sort]')?.dataset.sort;
    if (!col) return;
    state.sort = { col, dir: state.sort.col === col ? -state.sort.dir : 1 };
    draw(body);
  }, { once: true });
}

function rowsForTab() {
  return state.tab === 'owned' ? (state.owned?.units ?? []) : (state.rented?.offerings ?? []);
}

function matches(r) {
  if (state.type !== 'All' && r.typeName !== state.type) return false;
  if (state.counterFilter && !counterHit(r)) return false;
  if (!state.find) return true;
  const q = state.find;
  return [r.name, r.serial, r.typeName, r.supplierName]
    .some((s) => (s ?? '').toLowerCase().includes(q));
}

function counterHit(r) {
  switch (state.counterFilter) {
    case 'stale rate':   return r.problems?.some((p) => p.startsWith('rate computed'));
    case 'registration': return r.problems?.some((p) => !p.startsWith('rate computed'));
    case 'card differs': return r.hasProblem;
    case 'unconfirmed':  return r.unconfirmed;
    case 'never rented': return r.neverRented;
    default: return true;
  }
}

/* ─── OWNED · flat and sortable. No grouping, no expand column ──────────── */

function ownedRows(host, body) {
  host.innerHTML = '';
  const dir = state.sort.dir;
  const key = {
    name: (u) => u.name, serial: (u) => u.serial ?? '', type: (u) => u.typeName,
    capacity: (u) => u.capacity ?? -1, deck: (u) => u.deck ?? '',
    rate: (u) => u.rateBasis === 'mile' ? u.rate : u.rate / 1000,
  }[state.sort.col] ?? ((u) => u.name);

  const list = state.owned.units.filter(matches).sort((a, b) => {
    const x = key(a), y = key(b);
    return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * dir;
  });

  for (const u of list) {
    const el = document.createElement('div');
    el.className = 'w-row';
    el.style.gridTemplateColumns = OWNED_COLS;
    const sel = state.selected === u.id;
    if (sel) el.dataset.cursor = '1';
    // This is a catalog, not a job list — there is no status ramp to conflict
    // with, so #a00 TEXT means "this row has a problem". Never a row tint.
    const bad = u.hasProblem ? 'color:var(--bad)' : '';
    const dim = u.active ? '' : 'color:#808080';

    el.innerHTML = `
      <span class="w-gutter">${sel ? '<span class="w-caret"></span>' : ''}</span>
      <span style="${bad || dim}">${esc(u.name)}</span>
      <span class="mono" style="${dim}">${esc(u.serial ?? '')}</span>
      <span style="${dim || 'color:#404040'}">${esc(u.typeName)}</span>
      <span class="num mono">${u.capacity == null
        ? '<span class="w-na">—</span>' : num(u.capacity) + ' lb'}</span>
      <span class="mono">${u.deck ?? '<span class="w-na">—</span>'}</span>
      <span class="num mono" style="${bad}">${u.rateLabel}</span>`;

    el.addEventListener('click', () => select(u.id, body));
    el.addEventListener('dblclick', () => notBuiltYet(['Equipment properties', 'docs/18']));
    host.appendChild(el);

    // The reason sits beneath the row it belongs to, in its own colour.
    if (u.hasProblem) {
      const why = document.createElement('div');
      why.style.cssText = 'color:var(--bad);padding:0 0 3px 58px';
      why.textContent = '⚠ ' + u.problems.join(' · ');
      host.appendChild(why);
    }
  }

  if (!list.length) empty(host);
}

/* ─── RENTED · two band tiers, supplier then type ───────────────────────── */

function rentedRows(host, body) {
  host.innerHTML = '';
  let drew = 0;

  for (const s of state.rented.suppliers) {
    const types = s.types
      .map((t) => ({ ...t, offerings: t.offerings.filter(matches) }))
      .filter((t) => t.offerings.length);
    if (!types.length) continue;

    const sKey = `s:${s.id}`;
    const sOpen = !state.expanded.has(sKey);        // open by default
    const count = types.reduce((t, x) => t + x.offerings.length, 0);

    // The spine runs down the OUTERMOST group — the one that answers "where
    // am I", not "what is directly above me".
    const inGroup = types.some((t) => t.offerings.some((o) => o.id === state.selected));
    const group = document.createElement('div');
    group.style.position = 'relative';
    if (inGroup) group.innerHTML =
      '<span style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#000"></span>';

    group.appendChild(band(1, s.name, sOpen, sOpen ? null : count, () => {
      toggle(sKey); draw(body);
    }));

    if (sOpen) for (const t of types) {
      const tKey = `t:${s.id}:${t.id}`;
      const tOpen = !state.expanded.has(tKey);
      group.appendChild(band(2, t.name, tOpen, tOpen ? null : t.offerings.length, () => {
        toggle(tKey); draw(body);
      }));
      if (tOpen) for (const o of t.offerings) {
        group.appendChild(offeringRow(o, body));
        drew++;
      }
    }
    host.appendChild(group);
  }
  if (!drew && !host.children.length) empty(host);
}

const toggle = (k) => state.expanded.has(k) ? state.expanded.delete(k) : state.expanded.add(k);

/**
 * Band 1 is filled, band 2 is not. Two heavy fills compete with each other;
 * the indent carries the hierarchy. docs/14's two-tier rule, and the reason
 * the fixed 20px expand column is dropped here — a second tier cannot share
 * one fixed position with the first.
 */
function band(tier, label, open, count, onToggle) {
  const el = document.createElement('div');
  el.style.cssText = tier === 1
    ? 'background:#f4f4f4;border-top:1px solid #d4d4d4;font-weight:bold;color:#000;padding:2px 0'
    : 'border-top:1px solid #ececec;font-weight:bold;color:#404040;padding:2px 0';
  el.innerHTML = `<span style="padding-left:${tier === 1 ? 0 : 16}px">
      <span class="mono" style="display:inline-block;width:14px;text-align:center;cursor:default"
            data-x>${open ? '−' : '+'}</span>${esc(label)}${
      count != null ? `<span style="color:#808080;font-weight:normal"> (${count})</span>` : ''}
    </span>`;
  el.querySelector('[data-x]').addEventListener('click', onToggle);
  return el;
}

function offeringRow(o, body) {
  const el = document.createElement('div');
  el.className = 'w-row';
  el.style.gridTemplateColumns = RENT_COLS;
  const sel = state.selected === o.id;
  if (sel) el.dataset.cursor = '1';
  const bad = o.hasProblem ? 'color:var(--bad)' : '';

  el.innerHTML = `
    <span class="w-gutter">${sel ? '<span class="w-caret"></span>' : ''}</span>
    <span style="padding-left:46px;${bad}">${esc(o.name)}</span>
    <span class="mono">${o.cardLabel}${o.brackets.length
      ? '<span style="color:#606060">  +wk</span>' : ''}</span>
    <span class="mono" style="${o.neverRented ? 'color:#808080' : ''}">${
      o.neverRented ? 'never rented'
        : `$${o.lastPaid.toFixed(2)} · ${o.lastPaidAt}`}</span>
    <span class="mono">${o.minimum ? o.minimum + ' day' : '1 day'}</span>
    <span style="color:#404040">${o.move ?? ''}</span>`;

  el.addEventListener('click', () => select(o.id, body));
  el.addEventListener('dblclick', () => notBuiltYet(['Rental offering', 'docs/21']));
  return el;
}

function empty(host) {
  const el = document.createElement('div');
  el.style.cssText = 'padding:14px;color:var(--ink-3)';
  el.textContent = state.find ? `Nothing matches “${state.find}”.` : 'Nothing here yet.';
  host.appendChild(el);
}

async function select(id, body) {
  state.selected = id;
  await refreshDetail();
  draw(body);
}

/* ─── the detail pane · 330px, the selected machine in full ─────────────── */

function detailPane(el) {
  const d = state.detail;
  if (!d) { el.innerHTML = '<div class="w-na">Nothing selected.</div>'; return; }

  const section = (label, inner) => `
    <div style="margin-top:8px">
      <div style="font-weight:bold;letter-spacing:.08em;color:#404040;padding-bottom:3px">${label}</div>
      <div style="box-shadow:var(--sunken);background:#fff;padding:5px 6px">${inner}</div>
    </div>`;

  const out = [`
    <div style="font-size:12px;font-weight:bold">${esc(d.name)}</div>
    <div style="color:#404040;padding-top:1px">${esc(d.subtitle)}</div>`];

  // FIT — only where it means something. A lift is cargo, not a carrier.
  const f = d.fit;
  if (f.capacity != null || f.shipWeight != null) {
    const bits = [];
    if (f.capacity != null) bits.push(`Capacity ${num(f.capacity)} lb${
      f.capacityIs === 'bed' ? ' <span style="color:#606060">(bed)</span>' : ''}`);
    if (f.tow != null) bits.push(`Tow ${num(f.tow)} lb`);
    if (f.tare != null) bits.push(`Tare ${num(f.tare)} lb`);
    if (f.deckL) bits.push(`Deck ${f.deckL.toFixed(1)} × ${f.deckW.toFixed(1)} ft`);
    if (f.shipWeight != null) bits.push(`Ships at ${num(f.shipWeight)} lb`);
    out.push(section('FIT', bits.join(' &nbsp;·&nbsp; ')));
  }

  // RATE — four decimals here, two in the column. The components have to
  // visibly sum, and the detail pane is where that is checked.
  const r = d.rate;
  if (r.buildUp && r.buildUp.lines.length) {
    const lines = r.buildUp.lines.map((l) => `
      <div style="display:flex;gap:6px">
        <span style="width:84px;flex:none">${l.label}</span>
        <span style="flex:1;color:#606060">${esc(l.detail)}</span>
        <span class="num mono" style="width:58px;flex:none">${l.value.toFixed(4)}</span>
      </div>`).join('');
    out.push(section(`RATE &nbsp;$${r.buildUp.total.toFixed(4)} /${r.basis === 'mile' ? 'mi' : r.basis}`,
      lines + `
      <div style="display:flex;border-top:1px solid #000;margin-top:3px;padding-top:2px">
        <span style="flex:1;color:#606060">computed ${r.buildUp.computedAt ?? '—'}</span>
        <span class="num mono" style="width:58px;flex:none;font-weight:bold">${
          r.buildUp.total.toFixed(4)}</span></div>`));
  } else {
    out.push(section('RATE', `<b>${r.label}</b> &nbsp;<span style="color:#606060">typed —
      there is no mileage to divide by</span>`));
  }

  if (d.lastPaid) {
    const gap = d.lastPaid.rate - d.rate.value;
    out.push(section('LAST PAID', `
      $${d.lastPaid.rate.toFixed(2)} &nbsp;·&nbsp; ${d.lastPaid.at}
      <span style="color:#606060">(${esc(d.lastPaid.source ?? '')})</span>
      ${gap ? `<div style="color:var(--bad);padding-top:2px">⚠ Card is $${
        Math.abs(gap).toFixed(2)} ${gap > 0 ? 'under' : 'over'} the last invoice</div>` : ''}`));
  }

  if (d.specs.length) out.push(section('SPECIFICATIONS',
    d.specs.map((s) => `${s.name} <b>${esc(s.value)}</b>${s.unit ? ' ' + s.unit : ''}`)
      .join(' &nbsp;·&nbsp; ')));

  if (d.unit) {
    const u = d.unit;
    out.push(section('THIS UNIT', `
      <div class="mono">${esc(u.serial ?? '')}</div>
      ${u.odometer != null ? `<div>Odometer ${num(u.odometer)} mi</div>` : ''}
      ${u.compliance.map((c) => `<div>${esc(c.name)} expires ${c.expires_at}</div>`).join('')}`));
  }

  if (d.supplier) out.push(section('SUPPLIER',
    `${esc(d.supplier.name)}${d.supplier.phone ? ' · ' + esc(d.supplier.phone) : ''}${
      d.supplier.account ? ' · account ' + esc(d.supplier.account) : ''}`));

  // USED ON reads calculation runs, and the engine has not run. Saying
  // "0 versions" would read as "nobody uses this", which is a different claim.
  out.push(section('USED ON', d.used.versions
    ? `${d.used.versions} version${d.used.versions === 1 ? '' : 's'} · last ${d.used.last}`
    : '<span style="color:#808080">nothing costed yet — no calculation has run</span>'));

  out.push(`
    <div style="display:flex;gap:4px;margin-top:9px">
      <span class="w-btn" style="flex:1;text-align:center" data-d="edit">Edit equipment…</span>
      <span class="w-btn" style="flex:1;text-align:center" data-d="recompute">${
        d.lastPaid ? 'Update card' : 'Recompute rate'}</span>
    </div>`);

  el.innerHTML = out.join('');
  el.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click',
    () => notBuiltYet([b.textContent.replace('…', ''), 'docs/18'])));
}

/* ─── status bar · the maintenance audit lives here now ─────────────────── */

function statusBar(el, body) {
  const counter = (label, n, key) =>
    `<span class="w-btn" data-counter="${key}" style="border:none;background:none;
       color:${n ? 'var(--bad)' : '#808080'};padding:0 7px 0 0">${
      n ? '⚠ ' : ''}${label} ${n}</span>`;

  if (state.tab === 'owned') {
    const c = state.owned.counters;
    el.innerHTML = `
      <div style="flex:none">${state.owned.units.length} owned</div>
      <div class="grow" style="padding-left:12px">
        <span style="color:var(--ink-3)">Maintenance</span>
        ${counter('Rate over 12 months old', c.staleRate, 'stale rate')}
        ${counter('Registration expiring', c.registration, 'registration')}
        ${counter('Unused 12 months', c.unused, 'unused')}
        ${c.unusedMeaningless ? '<span style="color:#808080">· nothing costed yet</span>' : ''}
      </div>
      <div style="flex:none">rates: computed</div>`;
  } else {
    const c = state.rented.counters, t = state.rented.totals;
    el.innerHTML = `
      <div style="flex:none">${t.offerings} offerings · ${t.suppliers} suppliers · ${t.types} types</div>
      <div class="grow" style="padding-left:12px">
        <span style="color:var(--ink-3)">Maintenance</span>
        ${counter('Card differs from last paid', c.cardDiffers, 'card differs')}
        ${counter('Card unconfirmed 12 months', c.unconfirmed, 'unconfirmed')}
        ${counter('Never rented', c.neverRented, 'never rented')}
      </div>
      <div style="flex:none">${state.owned.units.length} owned</div>`;
  }

  // Each counter is clickable and filters the list — an audit you cannot act
  // on from where you read it is just a number.
  el.querySelectorAll('[data-counter]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.dataset.counter;
      state.counterFilter = state.counterFilter === k ? null : k;
      draw(body);
    }));
}

/* ─── keyboard ──────────────────────────────────────────────────────────── */

function keys(body) {
  const host = body.querySelector('[data-part=rows]');
  host.tabIndex = 0;
  host.addEventListener('keydown', async (e) => {
    const flat = state.tab === 'owned'
      ? [...host.querySelectorAll('.w-row')].map((r) => r)
      : [...host.querySelectorAll('.w-row')];
    if (!flat.length) return;
    const ids = state.tab === 'owned'
      ? state.owned.units.filter(matches).map((u) => u.id)
      : state.rented.offerings.filter(matches).map((o) => o.id);
    const at = Math.max(0, ids.indexOf(state.selected));

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const to = Math.min(ids.length - 1, Math.max(0, at + (e.key === 'ArrowDown' ? 1 : -1)));
      await select(ids[to], body);
      host.querySelector('[data-cursor]')?.scrollIntoView({ block: 'nearest' });
    }
  });
}

/* ─── Fuel prices — one place to change fuel ────────────────────────────── */

/**
 * The PREVIEW is the point. A button that silently rewrote every rate would be
 * the kind of thing you stop trusting, so the dialog shows the rates that move
 * and the one that does not before anything is written.
 */
async function openFuelPrices() {
  const prices = await window.bpc.fuelPrices();
  const draft = {};

  openPopup({
    title: 'Fuel prices', width: 480,
    build: async (host, popup) => {
      const types = Object.keys(prices).filter((k) => k !== 'set_at');
      const render = async () => {
        const preview = await window.bpc.fuelPreview(draft);
        const changing = preview.filter((p) => p.changes).length;

        host.innerHTML = `
          <div style="font-weight:bold;letter-spacing:.08em;color:#404040">PRICES</div>
          <div style="box-shadow:var(--sunken);background:#fff;padding:5px 6px;margin-bottom:9px">
            ${types.map((t) => `
              <div style="display:flex;align-items:center;gap:8px;padding:2px 0">
                <span style="width:80px;text-transform:capitalize">${t}</span>
                <span style="color:#606060;flex:1">current $${Number(prices[t]).toFixed(2)} /gal</span>
                <span>new</span>
                <span class="w-field" style="width:72px">
                  <input data-fuel="${t}" value="${draft[t] ?? ''}"
                         placeholder="${Number(prices[t]).toFixed(2)}"
                         style="width:100%;text-align:right"></span>
              </div>`).join('')}
            <div style="text-align:right;color:#606060;padding-top:2px">set ${
              prices.set_at ?? '—'}</div>
          </div>

          <div style="font-weight:bold;letter-spacing:.08em;color:#404040">WHAT THIS RECOMPUTES</div>
          <div style="box-shadow:var(--sunken);background:#fff;padding:5px 6px">
            ${preview.map((p) => `
              <div style="display:flex;gap:8px;padding:1px 0">
                <span style="flex:1">${esc(p.name)}</span>
                <span class="mono" style="color:#606060">$${p.before.toFixed(4)} →</span>
                <span class="mono" style="width:62px;text-align:right">$${p.after.toFixed(4)}</span>
                <span class="mono" style="width:86px;text-align:right;color:${
                  p.changes ? '#000' : '#808080'}">${
                  p.noEngine ? 'no engine' : p.changes
                    ? (p.delta > 0 ? '+' : '') + '$' + p.delta.toFixed(4) : 'unchanged'}</span>
              </div>`).join('')}
            <div style="text-align:right;color:#606060;padding-top:3px">
              ${preview.length} of ${preview.length} computed units ·
              ${changing} rate${changing === 1 ? '' : 's'} change${changing === 1 ? 's' : ''}</div>
          </div>

          <div class="w-tip" style="margin-top:9px">
            <span style="flex:none">💡</span>
            <span><b>Rates already on a sent estimate do not move.</b><br>
            A recompute reaches the next calculation, never a document you have
            issued — the same rule as every other template in the app.</span>
          </div>

          <div class="w-buttons">
            <span class="w-btn w-btn--default" style="width:160px" data-go>Update &amp; recompute</span>
            <span class="w-btn" style="width:78px" data-cancel>Cancel</span>
          </div>`;

        host.querySelectorAll('[data-fuel]').forEach((i) =>
          i.addEventListener('change', (e) => {
            const v = parseFloat(e.target.value);
            if (isFinite(v)) draft[e.target.dataset.fuel] = v;
            else delete draft[e.target.dataset.fuel];
            render();
          }));
        host.querySelector('[data-cancel]').addEventListener('click', () => popup.close(true));
        host.querySelector('[data-go]').addEventListener('click', async () => {
          if (Object.keys(draft).length) await window.bpc.fuelApply(draft);
          popup.close();
          location.reload();   // every rate on screen just changed
        });
      };
      await render();
    },
  });
}

function notBuiltYet([title, brief]) {
  openPopup({
    title, width: 480,
    build: (host, popup) => {
      host.innerHTML = `
        <div class="w-tip"><span style="flex:none">📋</span>
          <span><b>${title} — ${brief}.</b><br>
          Briefed, not built yet. The route exists before the room does.</span></div>
        <div class="w-buttons"><span class="w-btn w-btn--default"
             style="width:78px" data-close>OK</span></div>`;
      host.querySelector('[data-close]').addEventListener('click', () => popup.close());
    },
  });
}

const num = (n) => Number(n).toLocaleString('en-US');
const esc = (s) => s == null ? '' : String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
