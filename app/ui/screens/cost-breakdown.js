'use strict';

/**
 * COST BREAKDOWN — docs/03a · 03b · 03c · 03j. Four tabs, 1180 × 720.
 *
 * Built to the MAIN WINDOW TEMPLATE (docs/10) via docs/03j, which is chrome
 * only and identical on every tab:
 *
 *   identity strip   Customer · Project  /  Site · Version
 *   status strip     the version's colour, the lip, the alert
 *   tab strip        between the status strip and the body
 *   body             the tab
 *   screen strip     the PRICE LADDER
 *   status bar       ⚠ Next · lock state · changed
 *
 * ⛔ The "2 problems" chip LEAVES the tab strip and becomes the status
 *    strip's alert. The red "Cannot issue estimate" line is DELETED — the
 *    status strip and status bar said it twice over.
 * ⛔ Native material and Conditions left the identity strip for the Scope
 *    tab's own body. They are scope facts, not identity.
 */

import { openMain, openPopup } from '../shell.js';

// docs/03b · fixed columns total 729px, Item takes the remainder.
const COLS = '26px minmax(0,1fr) 115px 105px 105px 150px 110px 58px 38px 22px';

const state = { versionId: null, data: null, tab: 1, collapsed: new Set() };

export async function openCostBreakdown(versionId) {
  state.versionId = versionId;
  state.data = await window.bpc.costBreakdown(versionId);
  if (!state.data) return;
  const d = state.data;

  return openMain({
    id: `cost-breakdown:${versionId}`,
    title: `Cost Breakdown ${d.reference} — BPC-${d.identity.projectNumber} ${d.identity.projectTitle}`,
    menu: ['File', 'Edit', 'Scope', 'Pricing', 'View', 'Tools', 'Help'],
    width: 1180, height: 720,
    build: (body) => draw(body, d),
  });
}

function draw(body, d) {
  body.innerHTML = '';
  body.append(toolbar(d), identityStrip(d), statusStrip(d),
              tabStrip(body, d), tabBody(d), priceLadder(d), statusBar(d));
}

/* ─── chrome ────────────────────────────────────────────────────────────── */

function toolbar(d) {
  const el = div('w-toolbar');
  // Issue estimate is disabled while there are unresolved problems.
  el.innerHTML = `
    <span class="w-btn">Add component ▾</span>
    <span class="w-btn">Add service ▾</span>
    <span class="w-btn">New one-time…</span>
    <span class="w-sep"></span>
    <span class="w-btn">Recalculate</span>
    <span class="w-sep"></span>
    <span class="w-btn"${d.problems.length ? ' aria-disabled="true"' : ''}>Issue estimate</span>`;
  return el;
}

function identityStrip(d) {
  const el = div('');
  el.style.cssText = 'box-shadow:var(--thin);padding:5px 8px;flex:none;' +
    'display:grid;grid-template-columns:1fr 1fr;gap:2px 18px';
  const cell = (label, value) => `
    <span style="display:flex;gap:8px;min-width:0">
      <span style="color:var(--ink-3);width:54px;flex:none">${label}</span>
      <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;
                   white-space:nowrap">${value ?? '<span class="w-na">—</span>'}</span></span>`;
  const i = d.identity;
  el.innerHTML =
    cell('Customer', esc([i.customer, i.contact].filter(Boolean).join(' · '))) +
    cell('Project',  esc(`${i.projectNumber} ${i.projectTitle}`)) +
    cell('Site',     esc(i.site)) +
    cell('Version',  esc(i.version));
  return el;
}

function statusStrip(d) {
  const el = div('');
  el.style.cssText = `box-shadow:var(--thin);flex:none;display:flex;` +
    `align-items:stretch;background:${d.status.colour}`;
  el.innerHTML = `
    ${d.problems.length ? '<span style="width:4px;flex:none;background:var(--lip)"></span>' : ''}
    <span style="padding:7px 10px;display:flex;align-items:baseline;gap:14px;flex:1;min-width:0">
      <span style="font-size:15px;font-weight:bold;white-space:nowrap">${title(d.status.label)}</span>
      <span class="mono" style="color:var(--ink-2)">${d.created ? 'created ' + date(d.created) : ''}</span>
      <span style="flex:1"></span>
      ${d.problems.length ? `<span style="color:var(--bad);text-align:right;line-height:1.45">
        ⚠ ${d.problems.length} problem${d.problems.length === 1 ? '' : 's'} — ${
          d.problems.map(esc).join(' · ')}</span>` : ''}
    </span>`;
  return el;
}

function tabStrip(body, d) {
  const el = div('');
  el.style.cssText = 'display:flex;gap:1px;padding:4px 2px 0;flex:none';
  // ⛔ No problems chip here. It became the status strip's alert.
  el.innerHTML = ['1 · Scope', '2 · Requirements', '3 · Purchasing', '4 · Cost']
    .map((label, i) => `<span class="w-tab${state.tab === i + 1 ? ' is-active' : ''}"
           data-tab="${i + 1}">${label}</span>`).join('');
  el.addEventListener('click', (e) => {
    const n = Number(e.target.closest('[data-tab]')?.dataset.tab);
    if (n && n !== state.tab) { state.tab = n; draw(body, d); }
  });
  return el;
}

/* ─── the body ──────────────────────────────────────────────────────────── */

function tabBody(d) {
  const el = div('');
  el.style.cssText = 'flex:1;min-height:0;overflow:auto;display:flex;' +
    'flex-direction:column;gap:7px;padding:3px 0';
  if (state.tab === 1) el.append(baseScope(d), addOptions(d), siteConditions(d), tip());
  else el.append(needsEngine(state.tab));
  return el;
}

/* ── tab 1 · Base scope ─────────────────────────────────────────────────── */

function baseScope(d) {
  const box = group('Base scope');
  const table = div('w-list');
  table.style.cssText = 'margin:0';

  const head = div('w-list-head');
  head.style.gridTemplateColumns = COLS;
  head.innerHTML = `<span></span><span>Item</span><span>Manufacturer</span>
    <span>Part number</span><span>Category</span><span>Method</span>
    <span>Footing</span><span class="num">Qty</span><span>Unit</span><span></span>`;

  const rows = div('');
  for (const node of d.scope.order) {
    if (node.type === 'line') { rows.appendChild(scopeRow(node, false)); continue; }

    const open = !state.collapsed.has(node.id) && !node.collapsed;
    rows.appendChild(groupHeader(node, open, rows, d));
    // A collapsed group renders NO child rows. The triangle is the whole
    // indication — a placeholder would be a row you could select.
    if (open) node.lines.forEach((l) => rows.appendChild(scopeRow(l, true)));
  }

  // The footer is part of the table, on #dfdfdf, spanning every column.
  const footer = div('');
  footer.style.cssText = 'background:#dfdfdf;box-shadow:var(--thin);' +
    'padding:3px 4px;display:flex;gap:4px';
  footer.innerHTML = `
    <span class="w-btn">＋ Add component ▾</span>
    <span class="w-btn">＋ Add direct service ▾</span>
    <span class="w-btn">＋ New one-time component…</span>
    <span class="w-btn">＋ New group…</span>`;

  table.append(head, rows, footer);
  box.appendChild(table);
  return box;
}

/**
 * The group header reuses the Add options band — same #dfdfdf, same bevel,
 * same triangle. NO MONEY ON IT: no subtotal, no price. This is the Scope tab.
 */
function groupHeader(g, open, rows, d) {
  const el = div('');
  el.style.cssText = 'background:#dfdfdf;box-shadow:var(--thin);padding:2px 4px;' +
    'display:flex;align-items:center;gap:7px';
  el.innerHTML = `
    <span data-x style="width:10px;cursor:default">${triangle(open)}</span>
    <span style="font-weight:bold">${esc(g.name)}</span>
    <span style="color:#404040;flex:1">${esc(g.note ?? '')}</span>
    <span style="color:#404040">${g.lines.length} item${g.lines.length === 1 ? '' : 's'}</span>`;
  el.querySelector('[data-x]').addEventListener('click', () => {
    state.collapsed.has(g.id) ? state.collapsed.delete(g.id) : state.collapsed.add(g.id);
    // redraw just the list
    const win = rows.closest('.w-body');
    draw(win, d);
  });
  return el;
}

/** A small filled triangle, drawn — never the character ▾ printed into text. */
const triangle = (open) => `<span style="display:inline-block;width:0;height:0;
  border-left:4px solid transparent;border-right:4px solid transparent;
  ${open ? 'border-top:5px solid #000;margin-top:2px'
         : 'border-left:5px solid #000;border-top:4px solid transparent;' +
           'border-bottom:4px solid transparent;border-right:0'}"></span>`;

function scopeRow(l, indented) {
  const el = div('w-row');
  el.style.gridTemplateColumns = COLS;
  const isC = l.kind === 'component';

  // Filled navy square = component, hollow grey square = service. Drawn as
  // squares, never as the letters C and S.
  const icon = isC
    ? '<span style="display:inline-block;width:7px;height:7px;background:#000080"></span>'
    : '<span style="display:inline-block;width:7px;height:7px;border:1px solid #808080"></span>';

  // On a service row manufacturer, part number, method and footing are
  // GENUINELY BLANK — not dashes, not empty dropdowns.
  el.innerHTML = `
    <span style="text-align:center">${icon}</span>
    <span style="padding-left:${indented ? 12 : 0}px">${esc(l.name)}</span>
    <span>${esc(l.manufacturer ?? '')}</span>
    <span class="mono">${esc(l.partNumber ?? '')}</span>
    <span style="color:#404040">${esc(l.category ?? '')}</span>
    <span>${l.method ? field(l.method) : ''}</span>
    <span>${l.footing ? field(l.footing) : ''}</span>
    <span class="num mono">${qty(l.qty)}</span>
    <span>${esc(l.unit ?? '')}</span>
    <span style="text-align:center;color:#808080;cursor:default">✕</span>`;
  return el;
}

// A dropdown is a sunken field with a raised button carrying a small arrow.
const field = (text) => `<span class="w-field w-select" style="width:100%">
  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(text)}</span>
  <span class="w-arrow"></span></span>`;

const qty = (n) => Number.isInteger(n) ? String(n)
  : n >= 1000 ? Number(n).toLocaleString('en-US')
  : n.toFixed(2);

/* ── tab 1 · Add options ────────────────────────────────────────────────── */

function addOptions(d) {
  const box = group('Add options');
  for (const o of d.scope.addOptions) {
    const open = !state.collapsed.has(o.id);
    const band = div('');
    band.style.cssText = 'background:#dfdfdf;box-shadow:var(--thin);padding:2px 4px;' +
      'display:flex;align-items:center;gap:7px';
    band.innerHTML = `
      <span data-x style="width:10px;cursor:default">${triangle(open)}</span>
      <span style="font-weight:bold">${esc(o.name)}</span>
      <span style="color:#404040;flex:1">${o.attachesTo === 'line'
        ? 'line: ' + esc(o.attachedLine ?? '') : 'job level'}</span>
      <span class="num mono">${money(o.price)}</span>`;
    band.querySelector('[data-x]').addEventListener('click', () => {
      state.collapsed.has(o.id) ? state.collapsed.delete(o.id) : state.collapsed.add(o.id);
      draw(band.closest('.w-body'), d);
    });
    box.appendChild(band);

    if (open) {
      const sub = div('');
      // Same columns, same widths, so the sub-table lines up under the main one.
      o.lines.forEach((l) => sub.appendChild(scopeRow(l, true)));
      box.appendChild(sub);
    }
  }
  const add = div('');
  add.style.cssText = 'padding:4px 2px 0';
  add.innerHTML = '<span class="w-btn">＋ New add option…</span>';
  box.appendChild(add);
  return box;
}

/* ── tab 1 · Site conditions — they live HERE, not in the identity strip ── */

function siteConditions(d) {
  const box = group('Site conditions');
  const c = d.conditions;
  box.insertAdjacentHTML('beforeend', `
    <div style="display:flex;gap:8px;padding:1px 0">
      <span style="color:var(--ink-3);width:110px;flex:none">Native material</span>
      <span>${c?.nativeMaterial ? esc(c.nativeMaterial) : '<span class="w-unknown">[?]</span>'}</span>
    </div>
    <div style="display:flex;gap:8px;padding:1px 0">
      <span style="color:var(--ink-3);width:110px;flex:none">Conditions</span>
      <span>${c?.conditions.length
        ? c.conditions.map((x) => `${esc(x.name)} <span class="mono">×${x.multiplier}</span>`).join(' · ')
        : '<span class="w-na">—</span>'}</span>
    </div>`);
  return box;
}

function tip() {
  const el = div('w-tip');
  el.innerHTML = `<span style="flex:none">💡</span>
    <span><b>Add options are priced as a marginal recompute</b> — what the job
    costs with them, minus what it costs without. That is why an option can
    come out cheaper than pricing it on its own: it rides on the same concrete
    truck.</span>`;
  return el;
}

/* ── tabs 2–4 · they display the output of a calculation ────────────────── */

/**
 * Requirements, Purchasing and Cost are not data entry — they are what the
 * engine produced. Saying so is better than drawing an empty table that looks
 * like a job with nothing in it.
 */
function needsEngine(tab) {
  const name = { 2: 'Requirements', 3: 'Purchasing', 4: 'Cost' }[tab];
  const brief = { 2: 'docs/03d', 3: 'docs/03e', 4: 'docs/03g + 03h' }[tab];
  const el = div('');
  el.style.cssText = 'padding:10px';
  el.innerHTML = `
    <div class="w-alarm">
      <span style="flex:none">⚠</span>
      <span><b>No calculation has run for this version.</b><br>
      ${name} shows what the engine produced — ${tab === 2
        ? 'the labour, material and equipment each scope row requires'
        : tab === 3
        ? 'how each requirement is sourced, and the pooled effective rates'
        : 'the cost lines, the conditions, contingency and markup'}.
      There is nothing to show until <b>Recalculate</b> has something to
      calculate with.</span>
    </div>
    <div class="w-tip" style="margin-top:9px">
      <span style="flex:none">📋</span>
      <span><b>${name} — ${brief}, rendered and approved.</b><br>
      The tab is specified in full; it is the engine behind it that does not
      exist yet. Scope and the catalog had to come first — you cannot calculate
      a job before you can describe one.</span>
    </div>`;
  return el;
}

/* ─── the price ladder · the SCREEN STRIP ───────────────────────────────── */

/**
 * Every figure here is the engine's. With no calculation run there is no cost,
 * and [?] is the honest rendering — docs/22: unknown AND IT MATTERS. A zero
 * would read as "this job costs nothing".
 */
function priceLadder(d) {
  const el = div('');
  el.style.cssText = 'box-shadow:var(--sunken);background:#c0c0c0;flex:none;' +
    'display:flex;align-items:stretch;gap:0;padding:3px 4px';

  const m = d.money;
  const cell = (label, value, strong) => `
    <span style="flex:1;min-width:0;padding:1px 6px;${
      strong ? 'box-shadow:var(--thin);background:#fff;border:1px solid #000' : ''}">
      <span style="display:block;color:var(--ink-3)">${label}</span>
      <span class="num mono" style="display:block;${strong ? 'font-weight:bold' : ''}">${
        value == null ? '<span class="w-unknown">[?]</span>' : money(value)}</span></span>`;
  const arrow = '<span style="align-self:center;color:#404040;padding:0 2px">→</span>';

  el.innerHTML = [
    cell('Cost', m.cost),
    arrow, cell('+ conditions', m.conditions),
    arrow, cell('= adjusted', m.adjusted),
    arrow, cell(`+ contingency ${pct(m.contingencyPct)}`, m.contingency),
    arrow, cell(`+ markup ${pct(m.markupPct)}`, m.markup),
    arrow, cell('COMPUTED PRICE', m.price, true),
  ].join('');
  return el;
}

const pct = (n) => n == null ? '' : `${n}%`;

/* ─── status bar ────────────────────────────────────────────────────────── */

function statusBar(d) {
  const el = div('w-statusbar');
  el.innerHTML = `
    <div class="grow">${d.problems.length
      ? `<span style="color:var(--bad)">⚠ Next — fix ${d.problems.length} problem${
          d.problems.length === 1 ? '' : 's'} before issuing</span>`
      : 'Next — issue the estimate'}</div>
    <div style="width:150px;flex:none">${d.locked
      ? 'Locked ' + date(d.locked) : 'Draft · not locked'}</div>
    <div style="width:190px;flex:none">${d.changedAt
      ? `changed ${date(d.changedAt)} · ${d.changedBy ?? 'DK'}` : '<span class="w-na">—</span>'}</div>`;
  return el;
}

/* ─── bits ──────────────────────────────────────────────────────────────── */

function group(legend) {
  const el = div('w-group');
  el.style.flex = 'none';
  el.innerHTML = `<div class="legend">${legend}</div>`;
  return el;
}

// Every date carries its year — docs/11.
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function date(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d} ${MONTHS[+m - 1]} ${y}`;
}

function div(cls) { const el = document.createElement('div'); if (cls) el.className = cls; return el; }
const title = (s) => s.charAt(0) + s.slice(1).toLowerCase();
const money = (n) => Number(n).toLocaleString('en-US',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => s == null ? '' : String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
