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

const state = { versionId: null, data: null, tab: 1,
                collapsed: new Set(), costView: 'component' };

export async function openCostBreakdown(versionId) {
  state.versionId = versionId;
  state.data = await window.bpc.costBreakdown(versionId);
  if (!state.data) return;
  const d = state.data;
  // The engine's output feeds tabs 2, 3 and 4. It is recomputed on open
  // rather than read back, because scope may have changed since the last run.
  d.engine = await window.bpc.engine(versionId);
  d.problems = d.engine?.gaps.map((g) => g.message) ?? d.problems;

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
    <span class="w-btn" data-act="recalc">Recalculate</span>
    <span class="w-sep"></span>
    <span class="w-btn"${d.problems.length ? ' aria-disabled="true"' : ''}>Issue estimate</span>`;

  el.querySelector('[data-act=recalc]')?.addEventListener('click', async () => {
    d.engine = await window.bpc.recalculate(d.versionId);
    d.problems = d.engine.gaps.map((g) => g.message);
    d.money = d.engine.money;
    draw(el.closest('.w-body'), d);
  });
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
  else if (state.tab === 2) el.append(requirementsTab(d));
  else if (state.tab === 3) el.append(purchasingTab(d));
  else el.append(costTab(d));
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

/* ═══ tab 2 · REQUIREMENTS · docs/03d ══════════════════════════════════════
 *
 * Everything here is COMPUTED AND READ-ONLY. It must look like output, not
 * input: no editable fields, no dropdowns, no ✕ buttons.
 *
 * ⛔ NO DOLLAR FIGURE APPEARS ANYWHERE ON THIS TAB. Not one. Prices exist
 *    from tab 3 onward. If a footing, material, output, hour or product shows
 *    a cost, the model has been violated.
 *
 * ⛔ NEVER SHOW AN INFERRED NUMBER. Where a rate is missing the panel shows
 *    the hours that ARE known and states what is missing. It does not blank
 *    out and it does not interpolate.
 *
 * Two columns, and the columns MEAN something, so reading down either one
 * makes sense. The first attempt interleaved them and the reading order came
 * out scrambled.
 */
function requirementsTab(d) {
  const r = d.engine?.requirements;
  const el = div('');
  el.style.cssText = 'display:flex;gap:7px;align-items:flex-start';
  if (!r) { el.appendChild(noRun()); return el; }

  const col = (w) => {
    const c = div('');
    c.style.cssText = `flex:1;min-width:0;display:flex;flex-direction:column;gap:7px`;
    return c;
  };
  const left = col(), right = col();

  /* ── LEFT · what the job consumes and produces ─────────────────────── */

  const fb = group('Footings');
  fb.insertAdjacentHTML('beforeend', r.footings.length ? r.footings.map((f) => `
    <div style="display:flex;gap:10px;padding:1px 0">
      <span class="mono" style="width:60px;flex:none">${esc(f.spec.name)}</span>
      <span style="color:#404040;width:150px;flex:none">${geometry(f.spec)}</span>
      <span class="num mono" style="width:50px;flex:none">${f.qty} EA</span>
      <span style="color:#404040;flex:1">from ${f.from.map(
        (x) => esc(x.label) + ' ×' + fmtQ(x.qty)).join(' · ')}</span>
    </div>`).join('') : none());
  left.appendChild(fb);

  const mb = group('Materials required — pooled across the whole job');
  mb.insertAdjacentHTML('beforeend', r.materials.length ? r.materials.map((m) => `
    <div style="display:flex;gap:10px;padding:1px 0">
      <span style="flex:1">${esc(m.material.name)}</span>
      <span class="num mono" style="width:80px;flex:none">${fmtQ(m.qty)} ${m.material.base_unit}</span>
      <span style="color:#404040;width:210px;flex:none;overflow:hidden;
                   text-overflow:ellipsis;white-space:nowrap">${m.by.map(
        (b) => esc(b.label) + ' ' + fmtQ(b.qty)).join(' · ')}</span>
    </div>`).join('') : none());
  left.appendChild(mb);

  const ob = group('Generated output');
  // Two lines per output: quantities on the first, contributors in grey below.
  ob.insertAdjacentHTML('beforeend', r.outputs.length ? r.outputs.map((o) => `
    <div style="padding:2px 0">
      <div style="display:flex;gap:10px">
        <span style="flex:1">${esc(o.material.name)}</span>
        <span class="num mono" style="width:92px;flex:none">${fmtQ(o.bank)} CY bank</span>
        <span style="color:#404040;width:16px;text-align:center;flex:none">→</span>
        <span class="num mono" style="width:94px;flex:none">${fmtQ(o.loose)} CY loose</span>
        <span style="color:#404040;width:74px;flex:none">swell ${o.swell}</span>
      </div>
      <div style="color:#404040;padding-left:2px">${o.by.map(
        (b) => esc(b.label) + ' ' + fmtQ(b.qty)).join(' · ')}</div>
    </div>`).join('') : none());
  left.appendChild(ob);

  /* ── RIGHT · what it takes to do it ────────────────────────────────── */

  const lb = group('Labor — duration, and man-hours derived');
  lb.insertAdjacentHTML('beforeend', r.labour.length ? r.labour.map((l) => `
    <div style="display:flex;gap:10px;padding:1px 0">
      <span style="flex:1">${esc(l.role.name)}</span>
      <span class="num mono" style="width:96px;flex:none">${l.duration.toFixed(1)} hr</span>
      <span style="color:#404040;width:58px;flex:none">duration</span>
      <span class="num mono" style="width:60px;flex:none">× ${l.crew} crew</span>
      <span class="num mono" style="width:66px;flex:none">${l.manHours.toFixed(1)}</span>
      <span style="color:#404040;width:52px;flex:none">man-hr</span>
    </div>`).join('') : none());
  // The error row lives INSIDE the panel it belongs to, never floating
  // between panels.
  for (const g of d.engine.gaps.filter((x) => x.kind === 'unrated_service')) {
    lb.appendChild(errorRow(`⚠  ${g.message}`, g.detail, true));
  }
  right.appendChild(lb);

  const eb = group('Equipment');
  eb.insertAdjacentHTML('beforeend', r.equipment.length ? r.equipment.map((e) => `
    <div style="display:flex;gap:10px;padding:1px 0">
      <span style="flex:1">${esc(e.type.name)}</span>
      <span class="num mono" style="width:80px;flex:none">${e.hours.toFixed(2)} hr</span>
    </div>`).join('') : none());
  for (const g of d.engine.gaps.filter((x) => x.kind === 'unrated_service')) {
    // No Fix… button here — it is the SAME gap, already actionable above.
    eb.appendChild(errorRow(
      `⚠  Excavator hours for ${g.count ?? ''} footings not included — ${g.message}.`, null, false));
  }
  right.appendChild(eb);

  const pb = group('Products');
  pb.insertAdjacentHTML('beforeend',
    `<div style="color:#808080;text-align:center;padding:3px">— none —&nbsp;
      the customer furnishes the equipment on this job</div>`);
  right.appendChild(pb);

  el.append(left, right);
  return el;
}

function geometry(spec) {
  if (spec.shape === 'cylindrical')
    return `${spec.diameter_ft}′ dia × ${spec.depth_ft}′ deep`;
  if (spec.shape === 'rectangular')
    return `${spec.width_ft}′ × ${spec.length_ft}′ × ${spec.depth_ft}′ deep`;
  return `${spec.depth_ft}′ deep`;
}

function errorRow(text, detail, withFix) {
  const el = div('');
  el.style.cssText = 'background:#ffe0e0;box-shadow:var(--thin);color:#a00;' +
    'padding:3px 5px;margin-top:4px;display:flex;gap:8px;align-items:flex-start';
  el.innerHTML = `
    <span style="flex:1">${esc(text)}${detail
      ? `<br><span style="padding-left:16px">${esc(detail)}</span>` : ''}</span>
    ${withFix ? '<span class="w-btn" style="flex:none">Fix…</span>' : ''}`;
  return el;
}

const none = () => '<div style="color:#808080;text-align:center;padding:3px">— none —</div>';

/* ═══ tab 3 · PURCHASING · docs/03e ════════════════════════════════════════
 *
 * Four INDEPENDENT tables. They do not share a column grid and must not be
 * forced to align — each gets the widths its own content needs.
 *
 * ★ Every price, method and quantity cell is editable. The catalog supplies
 *   the default; nothing here is a commitment.
 */
function purchasingTab(d) {
  const p = d.engine?.purchasing;
  const el = div('');
  el.style.cssText = 'display:flex;flex-direction:column;gap:7px';
  if (!p) { el.appendChild(noRun()); return el; }

  /* ── pooled materials ──────────────────────────────────────────────── */
  const mb = group('Pooled materials');
  const MCOL = '16px minmax(0,1fr) 78px 150px 46px 78px 74px 74px 82px 88px';
  mb.insertAdjacentHTML('beforeend', `
    <div style="display:grid;grid-template-columns:${MCOL};gap:0 6px;color:var(--ink-3);padding:1px 2px">
      <span></span><span>Material</span><span class="num">Required</span><span>Method</span>
      <span class="num">Waste</span><span class="num">Purchased</span><span class="num">Unit price</span>
      <span class="num">Fees</span><span class="num">Total</span><span class="num">Eff. rate</span></div>`);

  for (const m of p.materials) {
    const open = !state.collapsed.has('m:' + m.material.id);
    const row = div('w-row');
    row.style.gridTemplateColumns = MCOL;
    row.innerHTML = `
      <span data-x style="cursor:default">${triangle(open)}</span>
      <span>${esc(m.material.name)}</span>
      <span class="num mono">${fmtQ(m.qty)} ${m.material.base_unit}</span>
      <span>${m.method ? sel(m.method.name) : '<span style="color:var(--bad)">— not selected —</span>'}</span>
      <span class="num">${edit(m.wastePct + '%')}</span>
      <span class="num">${edit(fmtQ(m.purchased))}</span>
      <span class="num">${edit(money(m.unitPrice))}</span>
      <span class="num mono">${money(m.feeTotal)}</span>
      <span class="num mono">${money(m.total)}</span>
      <span class="num mono">${money(m.effectiveRate, 4)} /${m.unit}</span>`;
    row.querySelector('[data-x]').addEventListener('click', () => {
      toggle('m:' + m.material.id); redraw(row);
    });
    mb.appendChild(row);

    // Fees are a LIST, not columns. One that does not apply is shown GREYED
    // WITH ITS REASON — you cannot audit a fee you cannot see.
    if (open) for (const f of m.fees) {
      const fr = div('');
      fr.style.cssText = 'display:grid;grid-template-columns:96px 90px 92px minmax(0,1fr);' +
        'gap:0 6px;padding:1px 2px 1px 28px;background:#f4f4f4;' +
        (f.applies ? '' : 'color:#808080');
      fr.innerHTML = `
        <span>${esc(f.name)}</span>
        <span>${f.basis}</span>
        <span class="num mono">${f.basis === 'percent' ? f.rate + '%' : money(f.rate)}</span>
        <span>${f.applies
          ? `<span class="num mono">${money(f.amount)}</span>`
          : `not applied — ${esc(f.reason ?? '')}`}</span>`;
      mb.appendChild(fr);
    }
  }
  el.appendChild(mb);

  /* ── equipment ─────────────────────────────────────────────────────── */
  const eb = group('Equipment');
  const ECOL = 'minmax(0,1fr) 78px 160px 88px 100px 74px 82px 88px';
  eb.insertAdjacentHTML('beforeend', `
    <div style="display:grid;grid-template-columns:${ECOL};gap:0 6px;color:var(--ink-3);padding:1px 2px">
      <span>Equipment</span><span class="num">Required</span><span>Sourcing</span>
      <span class="num">Periods</span><span class="num">Rate</span><span class="num">Fees</span>
      <span class="num">Total</span><span class="num">Eff. rate</span></div>` +
    p.equipment.map((e) => `
    <div class="w-row" style="grid-template-columns:${ECOL}">
      <span>${esc(e.type.name)}</span>
      <span class="num mono">${e.hours.toFixed(2)} hr</span>
      <span>${e.method ? sel(e.method.kind === 'owned' ? 'Owned'
        : (e.method.name ?? 'Rented')) : '<span style="color:var(--bad)">— not selected —</span>'}</span>
      <span class="num">${e.periods == null
        ? '<span class="w-na">—</span>'
        : `<span title="${esc(e.periodsNote ?? '')}">${edit(e.periods + ' days')} ✎</span>`}</span>
      <span class="num mono">${money(e.rate)} /${e.rateBasis}</span>
      <span class="num mono">${money(e.feeTotal)}</span>
      <span class="num mono">${money(e.total)}</span>
      <span class="num mono">${money(e.effectiveRate, 4)} /hr</span>
    </div>`).join(''));
  el.appendChild(eb);

  /* ── disposition ───────────────────────────────────────────────────── */
  const db_ = group('Disposition');
  const DCOL = '16px minmax(0,1fr) 78px 78px 170px 72px 78px 74px 82px 96px';
  db_.insertAdjacentHTML('beforeend', `
    <div style="display:grid;grid-template-columns:${DCOL};gap:0 6px;color:var(--ink-3);padding:1px 2px">
      <span></span><span>Output</span><span class="num">Bank</span><span class="num">Loose</span>
      <span>Method</span><span>Basis</span><span class="num">Tons / Loads</span>
      <span class="num">Fees</span><span class="num">Total</span><span class="num">Eff. rate</span></div>`);

  for (const o of p.disposition) {
    const bad = !o.method;
    const row = div('w-row');
    row.style.gridTemplateColumns = DCOL;
    // ⛔ "— not selected —" MUST look different from "$0.00". One is a hole,
    //    the other is a decision.
    if (bad) row.style.cssText += ';background:#ffe0e0;color:#a00';
    row.innerHTML = `
      <span style="text-align:center">${bad ? '⚠' : ''}</span>
      <span>${esc(o.material.name)}</span>
      <span class="num mono">${fmtQ(o.bank)} CY</span>
      <span class="num mono">${fmtQ(o.loose)} CY</span>
      <span>${bad ? sel('— not selected —') : sel(o.method.name)}</span>
      <span>${bad ? '—' : o.basis.replace('_', ' ')}</span>
      <span class="num mono">${bad ? '—' : o.basis === 'per_ton'
        ? o.tons.toFixed(2) + ' T' : o.loads + ' loads'}</span>
      <span class="num mono">${bad ? '—' : money(o.feeTotal)}</span>
      <span class="num mono">${bad ? '—' : money(o.total)}</span>
      <span class="num mono">${bad ? '—' : money(o.effectiveRate, 4) + ' /CY bank'}</span>`;
    db_.appendChild(row);
  }
  db_.appendChild(tipBlock(`<b>— not selected —</b> is not <b>$0.00</b>. An output
    with no disposition is a hole in the estimate, not a free one. Choose
    <b>Leave on site</b> if it genuinely costs nothing.`));
  el.appendChild(db_);

  const pb = group('Products');
  pb.insertAdjacentHTML('beforeend',
    `<div style="color:#808080;text-align:center;padding:3px">— none.
      Equipment furnished by the customer on this job. —</div>`);
  el.appendChild(pb);

  /* ── the tip that explains the whole model ─────────────────────────── */
  const conc = p.materials[0];
  if (conc) el.appendChild(tipBlock(
    `<b>The effective rate is computed over what was REQUIRED, not what was
     purchased.</b> ${esc(conc.material.name)} lists at ${money(conc.unitPrice)}/${conc.unit}
     and lands at <b>${money(conc.effectiveRate, 4)}/${conc.unit}</b>, because
     ${fmtQ(conc.qty)} ${conc.unit} is a small order carrying its fees across very
     little volume.<br>That number is not a mistake — it is the real cost of
     buying ${esc(conc.material.name.toLowerCase())} twice.`));
  return el;
}

const sel = (text) => `<span class="w-field w-select" style="width:100%">
  <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(text)}</span>
  <span class="w-arrow"></span></span>`;
const edit = (text) => `<span class="w-field" style="width:100%;text-align:right">${esc(text)}</span>`;

function tipBlock(html) {
  const el = div('w-tip');
  el.style.marginTop = '5px';
  el.innerHTML = `<span style="flex:none">💡</span><span>${html}</span>`;
  return el;
}

/* ═══ tab 4 · COST · docs/03g + 03h ════════════════════════════════════════
 *
 * ★ EVERY DOLLAR LANDS ON EXACTLY ONE COST OBJECT. Nothing unallocated,
 *   nothing smeared. The two views must total identically.
 *
 * ★ A COLLAPSED ROW ALWAYS KEEPS ITS SUBTOTAL. Collapsing hides detail,
 *   never money — every level still adds up on screen.
 */
function costTab(d) {
  const el = div('');
  el.style.cssText = 'display:flex;flex-direction:column;gap:5px';
  if (!d.engine) { el.appendChild(noRun()); return el; }

  const byObject = new Map();
  for (const l of d.engine.lines) {
    if (!byObject.has(l.objId)) byObject.set(l.objId, []);
    byObject.get(l.objId).push(l);
  }
  const objTotal = (id) => (byObject.get(id) ?? [])
    .reduce((t, l) => t + l.extendedCost, 0);

  /* ── the view toggle, and the reconciliation chip ──────────────────── */
  const total = d.engine.money.adjusted;
  const head = div('');
  head.style.cssText = 'display:flex;gap:16px;align-items:center;padding:2px 4px';
  head.innerHTML = `
    <label class="w-check"><input type="radio" name="costview"${
      state.costView === 'purchase' ? ' checked' : ''} data-v="purchase"> By purchase</label>
    <label class="w-check"><input type="radio" name="costview"${
      state.costView !== 'purchase' ? ' checked' : ''} data-v="component"> By component</label>
    <span style="flex:1"></span>
    <span style="box-shadow:var(--thin);background:#fff;padding:1px 7px">
      both views <span class="num mono">$${money(total)}</span>
      <span style="color:#060">✓ reconciles</span></span>`;
  head.querySelectorAll('[data-v]').forEach((r) => r.addEventListener('change', () => {
    state.costView = r.dataset.v; redraw(head);
  }));
  el.appendChild(head);

  const panel = div('w-list');
  panel.style.cssText = 'flex:none;padding:2px 0';

  if (state.costView === 'purchase') {
    // By purchase: one row per thing bought, which is how you check an invoice.
    const types = ['procurement', 'equipment', 'disposition', 'labor'];
    for (const t of types) {
      const lines = d.engine.lines.filter((l) => l.type === t);
      if (!lines.length) continue;
      const sub = lines.reduce((a, l) => a + l.extendedCost, 0);
      panel.appendChild(bandRow(t.toUpperCase(), sub, 0, null));
      const byDesc = new Map();
      for (const l of lines) {
        if (!byDesc.has(l.description)) byDesc.set(l.description, { qty: 0, cost: 0, unit: l.unit });
        const e = byDesc.get(l.description); e.qty += l.qty; e.cost += l.extendedCost;
      }
      for (const [desc, v] of byDesc) {
        panel.appendChild(costLineRow(`${desc}`, `${fmtQ(v.qty)} ${v.unit}`, v.cost, 1));
      }
    }
  } else {
    for (const g of d.scope.groups) {
      const open = !state.collapsed.has('c:' + g.id);
      const sub = g.lines.reduce((t, l) => t + objTotal(l.id), 0);
      panel.appendChild(bandRow(g.name, sub, 0, 'c:' + g.id, open, panel, d));
      if (!open) continue;
      for (const l of g.lines) panel.appendChild(...objectRows(l, byObject, objTotal, panel, d));
    }
    // ⛔ "Direct services" is NOT a scope group — it is the ungrouped cost
    //    objects, and they carry a fifth of this job. If their cost has been
    //    pushed onto the products, the model is broken.
    if (d.scope.ungrouped.length) {
      const open = !state.collapsed.has('c:direct');
      const sub = d.scope.ungrouped.reduce((t, l) => t + objTotal(l.id), 0);
      panel.appendChild(bandRow('Direct services', sub, 0, 'c:direct', open, panel, d));
      if (open) for (const l of d.scope.ungrouped) {
        panel.appendChild(...objectRows(l, byObject, objTotal, panel, d));
      }
    }
  }

  const foot = div('');
  foot.style.cssText = 'display:flex;padding:3px 6px;border-top:1px solid #000;' +
    'font-weight:bold;margin-top:2px';
  foot.innerHTML = `<span style="flex:1;text-align:right;padding-right:14px">TOTAL</span>
    <span class="num mono" style="width:110px">$${money(total)}</span>`;
  panel.appendChild(foot);
  el.appendChild(panel);

  /* ── cost-type summary strip ───────────────────────────────────────── */
  const byType = {};
  for (const l of d.engine.lines) byType[l.type] = (byType[l.type] ?? 0) + l.extendedCost;
  const strip = div('');
  strip.style.cssText = 'box-shadow:var(--sunken);background:#fff;padding:3px 7px;' +
    'display:flex;gap:0;flex:none';
  strip.innerHTML = ['labor', 'equipment', 'procurement', 'disposition', 'product']
    .map((t) => `<span style="flex:1;text-align:center">
      ${t.charAt(0).toUpperCase() + t.slice(1)}
      <span class="mono">$${money(byType[t] ?? 0)}</span></span>`)
    .join('<span style="color:#c0c0c0">│</span>');
  el.appendChild(strip);
  return el;
}

function objectRows(l, byObject, objTotal, panel, d) {
  const open = !state.collapsed.has('o:' + l.id);
  const rows = [objectRow(l, objTotal(l.id), open, panel, d)];
  if (!open) return rows;
  for (const cl of byObject.get(l.id) ?? []) {
    rows.push(costLineRow(
      `${cl.type}`, `${esc(cl.description)}  ${fmtQ(cl.qty)} ${cl.unit} × $${money(cl.unitCost, 4)}`,
      cl.extendedCost, 2));
  }
  if (!(byObject.get(l.id) ?? []).length) {
    rows.push(costLineRow('', '<span style="color:#808080">— nothing costed —</span>', null, 2));
  }
  return rows;
}

function bandRow(name, total, depth, key, open, panel, d) {
  const el = div('');
  el.style.cssText = 'background:#f4f4f4;border-top:1px solid #d4d4d4;font-weight:bold;' +
    'display:flex;gap:7px;padding:2px 6px';
  el.innerHTML = `
    ${key ? `<span data-x style="cursor:default;width:10px">${triangle(open)}</span>` : '<span style="width:10px"></span>'}
    <span style="flex:1">${esc(name)}</span>
    <span class="num mono" style="width:110px">$${money(total)}</span>`;
  if (key) el.querySelector('[data-x]').addEventListener('click', () => {
    toggle(key); redraw(panel);
  });
  return el;
}

function objectRow(l, total, open, panel, d) {
  const el = div('');
  el.style.cssText = 'display:flex;gap:7px;padding:2px 6px 2px 18px;align-items:baseline';
  // A row that says only "Post, 5″ × 12′" does not identify what was priced.
  el.innerHTML = `
    <span data-x style="cursor:default;width:10px">${triangle(open)}</span>
    <span style="width:168px;overflow:hidden;text-overflow:ellipsis;
                 white-space:nowrap">${esc(l.name)}</span>
    <span style="width:120px;color:#404040">${esc(l.manufacturer ?? '')}</span>
    <span class="mono" style="width:86px">${esc(l.partNumber ?? '')}</span>
    <span class="num mono" style="width:54px">${l.unit === 'EA'
      ? '×' + fmtQ(l.qty) : fmtQ(l.qty) + ' ' + (l.unit ?? '')}</span>
    <span style="flex:1"></span>
    <span class="num mono" style="width:110px">$${money(total)}</span>`;
  el.querySelector('[data-x]').addEventListener('click', () => {
    toggle('o:' + l.id); redraw(panel);
  });
  return el;
}

function costLineRow(type, detail, cost, depth) {
  const el = div('');
  el.style.cssText = `display:flex;gap:7px;padding:1px 6px 1px ${18 + depth * 14}px;` +
    'color:#404040';
  el.innerHTML = `
    <span style="width:84px">${esc(type)}</span>
    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${detail}</span>
    <span class="num mono" style="width:110px">${cost == null
      ? '<span style="color:#808080">not costed</span>' : '$' + money(cost)}</span>`;
  return el;
}

function noRun() {
  const el = div('w-alarm');
  el.innerHTML = `<span style="flex:none">⚠</span>
    <span><b>No calculation has run for this version.</b><br>
    Press <b>Recalculate</b> to compute it.</span>`;
  return el;
}

const toggle = (k) => state.collapsed.has(k) ? state.collapsed.delete(k) : state.collapsed.add(k);
const fmtQ = (n) => n == null ? '' : Number.isInteger(n) ? String(n)
  : n >= 1000 ? Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })
  : n.toFixed(2);

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

  const m = d.engine?.money ?? d.money;
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

function redraw(node) { draw(node.closest('.w-body'), state.data); }

function div(cls) { const el = document.createElement('div'); if (cls) el.className = cls; return el; }
const title = (s) => s.charAt(0) + s.slice(1).toLowerCase();
const money = (n) => Number(n).toLocaleString('en-US',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => s == null ? '' : String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
