'use strict';

/**
 * TRACKERS — docs/27, a LIST WINDOW (docs/14). 1000 × 600.
 *
 * ⛔ A TRACKER ROW IS NEVER TINTED. docs/08 says a red ROW always means
 *    FINISHED; here red means lapsed, and the two do not fight because the
 *    colour is on a CHIP, not a row:
 *
 *      ROW TINT   the status ramp — a progression through a job's life
 *      CHIP       whatever that chip measures — red is the bad end of its scale
 *
 * ⛔ NO NUMBERS IN THE LEGEND. With per-item thresholds no single number is
 *    true.
 * ⛔ A lapsed tracker NEVER lips a project row. Company obligations are not
 *    version problems, and making the browser's red lip mean two unrelated
 *    things would stop it meaning either.
 */

import { openMain, openPopup } from '../shell.js';

const COLS = '14px 20px minmax(0,1fr) 160px 110px 92px 64px';

const state = {
  data: null, detail: null, selected: null,
  collapsed: new Set(), find: '', category: 'All',
  showEquipment: true, showInactive: false, counterFilter: null,
};

export function openTrackers() {
  return openMain({
    id: 'trackers',
    title: 'Trackers',
    menu: ['File', 'Edit', 'View', 'Tracker', 'Window', 'Help'],
    width: 1000, height: 600,
    build: (body) => {
      body.innerHTML = `
        <div class="w-toolbar" data-part="toolbar"></div>
        <div class="w-band" data-part="filters"></div>
        <div style="flex:1;min-height:0;display:flex;gap:4px">
          <div class="w-list" style="flex:1;min-width:0;display:flex;flex-direction:column">
            <div class="w-list-head" data-part="head"></div>
            <div class="w-list-body" data-part="rows" style="overflow:auto;flex:1"></div>
          </div>
          <div data-part="detail" style="width:330px;flex:none;overflow:auto;
               box-shadow:var(--raised);background:#c0c0c0;padding:7px"></div>
        </div>
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
  state.data = await window.bpc.trackers({
    showEquipment: state.showEquipment, showInactive: state.showInactive });
  if (!state.selected || !state.data.items.some((i) => i.id === state.selected)) {
    // The first row AS DRAWN, not the first the query returned — the groups
    // are ordered insurance-first, the query is ordered alphabetically, and
    // opening with the cursor on one row and the detail on another is just
    // confusing.
    state.selected = state.data.groups[0]?.items[0]?.id ?? null;
  }
  state.detail = state.selected ? await window.bpc.trackerDetail(state.selected) : null;
  draw(body);
  body.querySelector('[data-part=rows]').focus();
}

/* ─── chrome ────────────────────────────────────────────────────────────── */

function toolbar(el, body) {
  el.innerHTML = `
    <span class="w-btn" data-act="new">New tracker</span>
    <span class="w-btn" data-act="renew">Record renewal…</span>
    <span class="w-sep"></span>
    <span class="w-btn" data-act="props">Properties</span>
    <span class="w-btn" data-act="deactivate">Deactivate</span>`;
  el.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'renew') return openRenewal(body);
    if (act) notBuiltYet(act === 'new' ? 'New tracker' : 'Tracker properties');
  });
}

function filters(el, body) {
  // The legend carries NO NUMBERS — lead times differ per item.
  const swatch = (c, label) =>
    `<span style="display:inline-flex;align-items:center;gap:3px">
       <span style="width:9px;height:9px;background:${c};box-shadow:var(--thin);
             display:inline-block"></span>${label}</span>`;
  el.innerHTML = `
    <span>Find</span>
    <span class="w-field" style="width:150px"><input data-f="find" style="width:100%"></span>
    <span style="width:8px"></span>
    <span>Category</span>
    <span class="w-field w-select" style="width:120px" data-f="cat">
      <span>All</span><span class="w-arrow"></span></span>
    <span style="width:10px"></span>
    <label class="w-check"><input type="checkbox" data-f="equip" checked> Show equipment</label>
    <label class="w-check"><input type="checkbox" data-f="inactive"> Show inactive</label>
    <span style="flex:1"></span>
    <span style="display:flex;gap:8px;color:var(--ink-3)">
      ${swatch('#E89494', 'lapsed')}${swatch('#F0B778', 'due')}
      ${swatch('#F5E183', 'notice')}${swatch('#B5E3B5', 'ok')}</span>`;

  el.querySelector('[data-f=find]').addEventListener('input', (e) => {
    state.find = e.target.value.trim().toLowerCase(); draw(body);
  });
  el.querySelector('[data-f=equip]').addEventListener('change', (e) => {
    state.showEquipment = e.target.checked; load(body);
  });
  el.querySelector('[data-f=inactive]').addEventListener('change', (e) => {
    state.showInactive = e.target.checked; load(body);
  });
  el.querySelector('[data-f=cat]').addEventListener('click', () => {
    const cats = ['All', ...new Set(state.data.items.map((i) => i.category))];
    state.category = cats[(cats.indexOf(state.category) + 1) % cats.length];
    el.querySelector('[data-f=cat] span').textContent = state.category;
    draw(body);
  });
}

function head(el) {
  el.style.gridTemplateColumns = COLS;
  el.innerHTML = `<span></span><span></span><span>NAME</span><span>ISSUER</span>
    <span>REFERENCE</span><span>EXPIRES</span><span class="num">DAYS</span>`;
}

/* ─── the list ──────────────────────────────────────────────────────────── */

function draw(body) {
  rows(body.querySelector('[data-part=rows]'), body);
  detailPane(body.querySelector('[data-part=detail]'));
  statusBar(body.querySelector('[data-part=status]'), body);
}

function matches(i) {
  if (state.category !== 'All' && i.category !== state.category) return false;
  if (state.counterFilter && i.band !== state.counterFilter) return false;
  if (!state.find) return true;
  const q = state.find;
  return [i.name, i.issuer, i.reference].some((s) => (s ?? '').toLowerCase().includes(q));
}

function rows(host, body) {
  host.innerHTML = '';
  let drew = 0;

  for (const g of state.data.groups) {
    const items = g.items.filter(matches);
    if (!items.length) continue;
    const open = !state.collapsed.has(g.key);
    const inGroup = items.some((i) => i.id === state.selected);

    const group = document.createElement('div');
    group.style.position = 'relative';
    if (inGroup) group.innerHTML =
      '<span style="position:absolute;left:0;top:0;bottom:0;width:3px;background:#000"></span>';

    const band = document.createElement('div');
    band.className = 'w-row';
    band.style.gridTemplateColumns = COLS;
    band.style.background = '#f4f4f4';
    band.style.fontWeight = 'bold';
    band.innerHTML = `<span class="w-gutter"></span>
      <span class="w-expand" data-x>${open ? '−' : '+'}</span>
      <span style="grid-column:3/-1">${esc(g.label)}${open ? ''
        : `<span style="color:#808080;font-weight:normal"> (${items.length})</span>`}</span>`;
    band.querySelector('[data-x]').addEventListener('click', () => {
      state.collapsed.has(g.key) ? state.collapsed.delete(g.key) : state.collapsed.add(g.key);
      draw(body);
    });
    group.appendChild(band);

    if (open) for (const i of items) { group.appendChild(itemRow(i, body)); drew++; }
    host.appendChild(group);
  }

  if (!drew && !host.children.length) {
    const el = document.createElement('div');
    el.style.cssText = 'padding:14px;color:var(--ink-3)';
    el.textContent = state.find ? `Nothing matches “${state.find}”.` : 'Nothing tracked yet.';
    host.appendChild(el);
  }
}

function itemRow(i, body) {
  const el = document.createElement('div');
  el.className = 'w-row';
  el.style.gridTemplateColumns = COLS;
  const sel = state.selected === i.id;
  if (sel) el.dataset.cursor = '1';
  // ⛔ The ROW is never tinted. A negative countdown is not a small number, it
  //    is a DIFFERENT STATE, so the row says so in #a00 rather than expecting
  //    anyone to notice a minus sign.
  const bad = i.lapsed ? 'color:var(--bad)' : '';
  const dim = i.active ? '' : 'color:#808080';

  el.innerHTML = `
    <span class="w-gutter">${sel ? '<span class="w-caret"></span>' : ''}</span>
    <span></span>
    <span style="padding-left:14px;${bad || dim}">${esc(i.name)}</span>
    <span style="${bad || dim || 'color:#404040'}">${esc(i.issuer ?? '')}</span>
    <span class="mono" style="${bad || dim}">${i.reference
      ? esc(i.reference) : '<span class="w-na">—</span>'}</span>
    <span class="mono" style="${bad || dim}">${i.expires
      ? date(i.expires) : '<span class="w-na">—</span>'}</span>
    <span style="text-align:right">${chip(i)}</span>`;

  el.addEventListener('click', async () => {
    state.selected = i.id;
    state.detail = await window.bpc.trackerDetail(i.id);
    draw(body);
  });
  el.addEventListener('dblclick', () => notBuiltYet('Tracker properties'));
  return el;
}

/** Every countdown sits in a tinted chip, so the list is scannable without
 *  reading a single number. */
function chip(i) {
  if (i.days == null) return '<span class="w-na">—</span>';
  return `<span style="display:inline-block;min-width:38px;text-align:center;
    background:${i.colour};box-shadow:var(--thin);padding:0 4px"
    class="mono">${i.days}</span>`;
}

/* ─── detail pane ───────────────────────────────────────────────────────── */

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

  out.push(section('CURRENT TERM', `
    <div class="mono">${d.effective ? date(d.effective) : '—'} &nbsp;→&nbsp; ${
      d.expires ? date(d.expires) : '<span class="w-na">does not lapse</span>'}
      ${d.days != null ? `<span style="float:right;${d.lapsed ? 'color:var(--bad)' : ''}">${
        d.lapsed ? Math.abs(d.days) + ' days ago' : d.days + ' days left'}</span>` : ''}</div>
    ${d.reference || d.cost ? `<div style="padding-top:2px">${
      d.reference ? esc(d.reference) : ''}${d.cost
        ? ` · $${money(d.cost)}${d.renewalMonths === 12 ? ' /yr' : ' /term'}` : ''}</div>` : ''}
    ${d.attachment ? `<div style="color:#404040">${esc(d.attachment)}</div>` : ''}`));

  // ★ A premium rising 6% a year is a fact you only see when the renewals are
  //   in one place. The app does not act on it; it stops it being invisible.
  if (d.history.length) out.push(section('RENEWAL HISTORY', d.history.map((h) => `
    <div style="display:flex;gap:8px">
      <span class="mono" style="width:94px">${date(h.renewed_at)}</span>
      <span class="num mono" style="width:76px">${h.cost == null ? '' : '$' + money(h.cost)}</span>
      <span class="num mono" style="flex:1;color:${
        h.changePct == null ? '#808080' : h.changePct > 0 ? '#a00' : '#060'}">${
        h.changePct == null ? '' : (h.changePct > 0 ? '+' : '') + h.changePct.toFixed(1) + '%'}</span>
    </div>`).join('')));

  // Two numbers, because the answer differs per obligation.
  out.push(section('REMINDS', d.expires
    ? `<div>Notice <b>${d.noticeDays}</b> days before expiry
         <span style="color:#606060">· start thinking</span></div>
       <div>Due <b>${d.dueDays}</b> days before expiry
         <span style="color:#606060">· do it now</span></div>`
    : '<span style="color:#808080">nothing to count down to</span>'));

  out.push(`
    <div style="display:flex;gap:4px;margin-top:9px">
      <span class="w-btn" style="flex:1;text-align:center" data-d="renew">Record renewal…</span>
      <span class="w-btn" style="flex:1;text-align:center" data-d="edit">Edit tracker…</span>
    </div>`);

  el.innerHTML = out.join('');
  el.querySelector('[data-d=edit]').addEventListener('click',
    () => notBuiltYet('Tracker properties'));
  el.querySelector('[data-d=renew]').addEventListener('click',
    () => openRenewal(el.closest('.w-body')));
}

function statusBar(el, body) {
  const c = state.data.counters, n = state.data.next;
  const counter = (label, v, key) => `<span class="w-btn" data-counter="${key}"
    style="border:none;background:none;padding:0 8px 0 0;color:${
      v ? 'var(--bad)' : '#808080'}">${v ? '⚠ ' : ''}${label} ${v}</span>`;
  el.innerHTML = `
    <div class="grow">
      ${counter('Lapsed', c.lapsed, 'lapsed')}
      ${counter('Due', c.due, 'due')}
      <span style="color:var(--ink-3)">${c.tracked} tracked</span>
    </div>
    <div style="flex:none">${n
      ? `next renewal — ${esc(n.rawName)}, ${date(n.expires)}`
      : '<span class="w-na">nothing scheduled</span>'}</div>`;
  el.querySelectorAll('[data-counter]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.dataset.counter;
      state.counterFilter = state.counterFilter === k ? null : k;
      draw(body);
    }));
}

function keys(body) {
  const host = body.querySelector('[data-part=rows]');
  host.tabIndex = 0;
  host.addEventListener('keydown', async (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const ids = state.data.groups
      .filter((g) => !state.collapsed.has(g.key))
      .flatMap((g) => g.items.filter(matches).map((i) => i.id));
    const at = ids.indexOf(state.selected);
    const to = Math.min(ids.length - 1, Math.max(0, at + (e.key === 'ArrowDown' ? 1 : -1)));
    state.selected = ids[to];
    state.detail = await window.bpc.trackerDetail(state.selected);
    draw(body);
    host.querySelector('[data-cursor]')?.scrollIntoView({ block: 'nearest' });
  });
}

/* ─── Record renewal — a separate, smaller dialog ───────────────────────── */

/**
 * ⛔ RENEWING IS NOT EDITING. Overtyping the expiry on the properties dialog
 *    would silently lose the history, and the history is the only reason the
 *    rising premium is visible.
 */
function openRenewal(body) {
  const d = state.detail;
  if (!d) return;

  openPopup({
    title: `Record renewal — ${d.name}`, width: 480,
    build: (host, popup) => {
      const today = new Date().toISOString().slice(0, 10);
      const expiry = d.renewalMonths ? addMonths(today, d.renewalMonths) : '';
      host.innerHTML = `
        <div class="w-fields">
          <label>Renewed on</label>
          <span class="w-field"><input data-f="on" value="${today}" style="width:110px"></span>
          <label>New expiry</label>
          <span class="w-field"><input data-f="exp" value="${expiry}" style="width:110px"></span>
          <label>Cost</label>
          <span style="display:flex;gap:8px;align-items:baseline">
            <span class="w-field"><input data-f="cost" style="width:90px"></span>
            <span style="color:#606060">${d.cost == null ? ''
              : 'was $' + money(d.cost)}</span>
            <span data-delta style="color:#606060"></span></span>
          <label>Document</label>
          <span><span class="w-btn">Browse…</span></span>
        </div>
        <div class="w-tip" style="margin-top:9px">
          <span style="flex:none">💡</span>
          <span><b>Renewing is not editing.</b><br>
          This writes the new term and pushes the old one into history — which
          is the only reason a premium rising 6% a year is visible at all.</span>
        </div>
        <div class="w-buttons">
          <span class="w-btn w-btn--default" style="width:92px" data-ok>Record</span>
          <span class="w-btn" style="width:78px" data-cancel>Cancel</span>
        </div>`;

      const costEl = host.querySelector('[data-f=cost]');
      costEl.addEventListener('input', () => {
        const v = parseFloat(costEl.value);
        const was = d.cost;
        host.querySelector('[data-delta]').textContent =
          isFinite(v) && was ? `· ${v > was ? '+' : ''}${((v - was) / was * 100).toFixed(1)}%` : '';
      });
      host.querySelector('[data-cancel]').addEventListener('click', () => popup.close(true));
      host.querySelector('[data-ok]').addEventListener('click', async () => {
        await window.bpc.recordRenewal({
          trackerId: d.id,
          renewedAt: host.querySelector('[data-f=on]').value,
          newExpiry: host.querySelector('[data-f=exp]').value || null,
          cost: parseFloat(costEl.value) || null,
        });
        popup.close();
        load(body);
      });
    },
  });
}

function addMonths(iso, months) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function notBuiltYet(title) {
  openPopup({
    title, width: 480,
    build: (host, popup) => {
      host.innerHTML = `
        <div class="w-tip"><span style="flex:none">📋</span>
          <span><b>${title} — docs/27.</b><br>
          Specified in the brief, not built yet.</span></div>
        <div class="w-buttons"><span class="w-btn w-btn--default"
             style="width:78px" data-close>OK</span></div>`;
      host.querySelector('[data-close]').addEventListener('click', () => popup.close());
    },
  });
}

// Every date carries its year — docs/11.
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function date(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d} ${MONTHS[+m - 1]} ${y}`;
}
const money = (n) => Number(n ?? 0).toLocaleString('en-US',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => s == null ? '' : String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
