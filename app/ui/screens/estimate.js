'use strict';

/**
 * ESTIMATE EDITOR — docs/05f (body) · 05g (chrome) · 05h (box grammar).
 * 1180 × 800.
 *
 * v12 rebuilt the body in the VERSION VIEW's box grammar, and the thing it
 * settled is bigger than this screen: the box grammar is not only for status
 * pages, it holds on a document too. The app now has ONE body grammar
 * everywhere, which is why the invoice and post-cost screens can be designed
 * the same way instead of inventing a second convention.
 *
 *   BODY — one flex row, exactly two children
 *   LEFT   430px  Cost objects
 *   RIGHT  flex:1 Estimate of work · Optional add-ons · Totals
 *
 * ⛔ NO NAVY. Selection is #c0c0c0.
 * ⛔ NO BOX ON A CELL THAT IS NOT BEING EDITED. Plain text on white until
 *    double-click, then a sunken field, then plain text again.
 * ⛔ COST APPEARS ONLY INSIDE A ROW EXPANSION, and never prints.
 */

import { openMain, openPopup } from '../shell.js';

const LINE_COLS = '42px minmax(0,1fr) 58px 92px 100px';

const state = { versionId: null, doc: null, cb: null, expanded: new Set(), selected: null };

export async function openEstimate(versionId) {
  state.versionId = versionId;
  const [doc, cb] = await Promise.all([
    window.bpc.estimate(versionId),
    window.bpc.costBreakdown(versionId),
  ]);
  if (!doc) return;
  state.doc = doc; state.cb = cb;
  if (!state.expanded.size) state.expanded.add(doc.lines[0]?.id);

  return openMain({
    id: `estimate:${versionId}`,
    title: `Estimate ${doc.reference} — BPC-${cb.identity.projectNumber} ${cb.identity.projectTitle}`,
    menu: ['File', 'Edit', 'Estimate', 'Lines', 'View', 'Tools', 'Help'],
    width: 1180, height: 800,
    build: (body) => draw(body),
  });
}

function draw(body) {
  const { doc, cb } = state;
  body.innerHTML = '';
  body.append(toolbar(doc), identityStrip(cb), statusStrip(doc, cb),
              columns(doc), priceBar(doc), statusBar(doc, cb));
}

/* ─── chrome · docs/05g ─────────────────────────────────────────────────── */

function toolbar(doc) {
  const el = div('w-toolbar');
  el.innerHTML = `
    <span class="w-btn">Add line</span>
    <span class="w-btn">Add sub-item</span>
    <span class="w-btn">Add note ▾</span>
    <span class="w-sep"></span>
    <span class="w-btn">Print…</span>
    <span class="w-btn">Send…</span>
    <span class="w-sep"></span>
    <span class="w-btn"${doc.locked ? ' aria-disabled="true"' : ''}>Lock &amp; issue</span>`;
  return el;
}

function identityStrip(cb) {
  const el = div('');
  el.style.cssText = 'box-shadow:var(--thin);padding:5px 8px;flex:none;' +
    'display:grid;grid-template-columns:1fr 1fr;gap:2px 18px';
  const cell = (label, value) => `
    <span style="display:flex;gap:8px;min-width:0">
      <span style="color:var(--ink-3);width:54px;flex:none">${label}</span>
      <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;
                   white-space:nowrap">${value}</span></span>`;
  const i = cb.identity;
  el.innerHTML =
    cell('Customer', esc([i.customer, i.contact].filter(Boolean).join(' · '))) +
    cell('Project',  esc(`${i.projectNumber} ${i.projectTitle}`)) +
    cell('Site',     esc(i.site)) +
    cell('Version',  esc(i.version));
  return el;
}

/**
 * Tinted with the ESTIMATE's own state. "Not sent" is white — so the strip is
 * white here and the #CC0000 lip is what carries the problem.
 */
function statusStrip(doc, cb) {
  const sent = !!doc.sent;
  const colour = sent ? '#ffffff' : '#ffffff';
  const el = div('');
  el.style.cssText = `box-shadow:var(--thin);flex:none;display:flex;` +
    `align-items:stretch;background:${colour}`;
  el.innerHTML = `
    ${cb.problems.length ? '<span style="width:4px;flex:none;background:var(--lip)"></span>' : ''}
    <span style="padding:7px 10px;display:flex;align-items:baseline;gap:14px;flex:1;min-width:0">
      <span style="font-size:15px;font-weight:bold">${sent ? 'Sent' : 'Not sent'}</span>
      <span class="mono" style="color:var(--ink-2)">created ${date(doc.created)}${
        doc.sent ? ' · sent ' + date(doc.sent) : ''}${
        doc.expires ? ' · expires ' + date(doc.expires) : ''}</span>
      <span style="flex:1"></span>
      ${cb.problems.length ? `<span style="color:var(--bad);text-align:right">
        ⚠ ${cb.problems.length} problem${cb.problems.length === 1 ? '' : 's'}
        in the cost breakdown<br>
        <span style="font-weight:normal">${cb.problems.map(esc).join(' · ')}</span></span>` : ''}
    </span>`;
  return el;
}

/* ─── body · ONE row, EXACTLY TWO children ──────────────────────────────── */

function columns(doc) {
  const row = div('');
  row.style.cssText = 'flex:1;min-height:0;display:flex;gap:6px;overflow:auto;padding:3px 0';

  const left = div('');
  left.style.cssText = 'width:430px;flex:none;display:flex;flex-direction:column;gap:10px';
  left.append(costObjectsBox(doc));

  const right = div('');
  right.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:10px';
  right.append(estimateOfWork(doc), addOnsBox(doc), totalsBox(doc));

  row.append(left, right);
  return row;
}

/* ── LEFT · Cost objects ────────────────────────────────────────────────── */

function costObjectsBox(doc) {
  const box = group('Cost objects');
  const scope = state.cb.scope;

  const band = (text) => `<div style="background:#dfdfdf;box-shadow:var(--thin);
    padding:2px 5px;font-weight:bold;margin-top:3px">${esc(text)}</div>`;

  const row = (o, assignedRef) => `
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 62px 76px 54px;
                gap:0 6px;padding:1px 4px">
      <span style="padding-left:10px;overflow:hidden;text-overflow:ellipsis;
                   white-space:nowrap">${esc(o.name)}</span>
      <span class="num mono" style="color:#404040">${o.unit === 'EA'
        ? '×' + o.qty : fmtQty(o.qty) + ' ' + (o.unit ?? '')}</span>
      <span class="num mono">${o.cost == null
        ? '<span class="w-unknown">[?]</span>' : money(o.cost)}</span>
      <span class="mono" style="color:#404040">${assignedRef ?? '<span class="w-na">—</span>'}</span>
    </div>`;

  const byObject = new Map(doc.costObjects.map((o) => [o.cost_object_id, o]));
  const refOf = (id) => {
    const o = byObject.get(id);
    if (!o) return null;
    const find = (ls) => {
      for (const l of ls) {
        if (l.id === o.document_line_id) return l.ref;
        const r = find(l.children); if (r) return r;
      }
      const a = doc.addOns.find((x) => x.id === o.document_line_id);
      return a?.ref ?? null;
    };
    return find(doc.lines);
  };

  let html = `<div style="display:grid;grid-template-columns:minmax(0,1fr) 62px 76px 54px;
      gap:0 6px;padding:1px 4px;color:var(--ink-3)">
      <span>Item</span><span class="num">Qty</span>
      <span class="num">Cost</span><span>Assigned</span></div>`;

  html += band('BASE SCOPE');
  let baseCost = 0, baseN = 0;
  for (const g of scope.groups) {
    html += `<div style="font-weight:bold;padding:2px 5px 0">${esc(g.name)}</div>`;
    for (const l of g.lines) {
      const o = byObject.get(l.id);
      html += row({ name: l.name, qty: l.qty, unit: l.unit, cost: o?.allocated_cost ?? null },
                  refOf(l.id));
      baseCost += o?.allocated_cost ?? 0; baseN++;
    }
  }
  if (scope.ungrouped.length) {
    html += `<div style="font-weight:bold;padding:2px 5px 0">Direct services</div>`;
    for (const l of scope.ungrouped) {
      const o = byObject.get(l.id);
      html += row({ name: l.name, qty: l.qty, unit: l.unit, cost: o?.allocated_cost ?? null },
                  refOf(l.id));
      baseCost += o?.allocated_cost ?? 0; baseN++;
    }
  }
  const assignedBase = [...byObject.values()].filter(
    (o) => scope.groups.flatMap((g) => g.lines).concat(scope.ungrouped)
      .some((l) => l.id === o.cost_object_id)).length;
  html += footerLine(assignedBase, baseN, baseCost);

  // Two separate footers — option cost is not part of the base total, exactly
  // as option price is not part of the estimate total.
  for (const d of scope.addOptions) {
    html += band(`ADD OPTION — ${d.name}`);
    let c = 0;
    for (const l of d.lines) {
      const o = byObject.get(l.id);
      html += row({ name: l.name, qty: l.qty, unit: l.unit, cost: o?.allocated_cost ?? null },
                  refOf(l.id));
      c += o?.allocated_cost ?? 0;
    }
    html += footerLine(d.lines.filter((l) => byObject.has(l.id)).length, d.lines.length, c);
  }

  box.insertAdjacentHTML('beforeend', html);
  return box;
}

const footerLine = (done, of, cost) => `
  <div style="display:flex;gap:6px;padding:2px 4px;border-top:1px solid var(--cell-rule)">
    <span style="flex:1"></span>
    <span style="color:${done === of ? '#000' : 'var(--bad)'}">${done} of ${of} assigned${
      done === of ? ' ✓' : ''}</span>
    <span class="num mono" style="width:76px">${money(cost)}</span>
  </div>`;

/* ── RIGHT · Estimate of work ───────────────────────────────────────────── */

function estimateOfWork(doc) {
  const box = group('Estimate of work');
  const head = div('');
  head.style.cssText = `display:grid;grid-template-columns:${LINE_COLS};gap:0 6px;` +
    'padding:1px 4px;color:var(--ink-3)';
  head.innerHTML = `<span>REF</span><span>ACTIVITY</span><span class="num">QTY</span>
    <span class="num">UNIT PRICE</span><span class="num">AMOUNT</span>`;
  box.appendChild(head);

  const draw1 = (l, depth) => {
    box.appendChild(lineRow(l, depth));
    if (state.expanded.has(l.id)) box.appendChild(expansion(l));
    l.children.forEach((c) => draw1(c, depth + 1));
    l.notes.forEach((n) => box.appendChild(noteRow(n)));
  };
  doc.lines.forEach((l) => draw1(l, 0));

  const footer = div('');
  footer.style.cssText = 'background:#dfdfdf;box-shadow:var(--thin);padding:3px 4px;' +
    'display:flex;gap:4px;margin-top:3px';
  // ⛔ This footer's ＋ Option is LINE-SPECIFIC — it attaches to the selected
  //    line and renders as ↳ (Optional) inside the table. The add-ons box's
  //    ＋ Add option is JOB-LEVEL. Both are scope deltas; only the attachment
  //    differs.
  footer.innerHTML = `<span class="w-btn">＋ Line</span>
    <span class="w-btn">＋ Sub-item</span>
    <span class="w-btn">＋ Option</span>
    <span class="w-btn">＋ Note ▾</span>`;
  box.appendChild(footer);
  return box;
}

function lineRow(l, depth) {
  const el = div('');
  const sel = state.selected === l.id;
  // Selection is GREY. No navy anywhere on this screen.
  el.style.cssText = `display:grid;grid-template-columns:${LINE_COLS};gap:0 6px;` +
    `padding:2px 4px;min-height:17px;align-items:baseline;` +
    (sel ? 'background:#c0c0c0' : '');

  const indent = depth * 12;
  el.innerHTML = `
    <span class="mono" style="color:#808080">${l.ref}</span>
    <span style="padding-left:${indent}px;display:flex;gap:5px;align-items:baseline">
      ${l.amount != null ? `<span data-x style="cursor:default;flex:none">${
        triangle(state.expanded.has(l.id))}</span>` : '<span style="width:8px;flex:none"></span>'}
      <span style="${l.isSubItem ? 'color:#404040' : ''};overflow:hidden;
                   text-overflow:ellipsis;white-space:nowrap">${
        l.isSubItem ? '↳ ' : ''}${esc(l.label)}</span></span>
    <span class="num mono">${l.qty != null ? fmtQty(l.qty) + ' ' + (l.unit ?? '') : ''}</span>
    <span class="num mono">${l.unitPrice != null && l.qty > 1 ? money(l.unitPrice) : ''}</span>
    <span class="num mono">${l.amount != null ? money(l.amount) : ''}</span>`;

  el.addEventListener('click', () => { state.selected = l.id; redraw(el); });
  el.querySelector('[data-x]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.expanded.has(l.id) ? state.expanded.delete(l.id) : state.expanded.add(l.id);
    redraw(el);
  });
  return el;
}

/**
 * The ONE place cost appears. Grey, indented, read-only, and it never prints.
 */
function expansion(l) {
  const el = div('');
  el.style.cssText = 'padding:1px 4px 4px 56px;color:#404040';
  if (!l.objects.length && !l.children.some((c) => c.objects.length)) {
    // A real state: Mobilization has nothing assigned to it.
    el.innerHTML = '<span style="color:#808080">— no cost objects —</span>';
    return el;
  }
  const objects = [...l.objects, ...l.children.flatMap((c) => c.objects)];
  el.innerHTML = objects.map((o) => `
    <div style="display:grid;grid-template-columns:minmax(0,1fr) 62px 86px;gap:0 6px">
      <span>${esc(o.name)}</span>
      <span class="num mono">${o.unit === 'EA' ? '×' + o.qty : fmtQty(o.qty) + ' ' + o.unit}</span>
      <span class="num mono">${money(o.cost)}</span>
    </div>`).join('') + `
    <div style="border-top:1px solid var(--cell-rule);margin-top:2px;padding-top:2px">
      cost ${money(l.cost)} &nbsp;·&nbsp; price ${money(l.amount)}
      &nbsp;·&nbsp; margin ${l.margin == null
        ? '<span class="w-unknown">[?]</span>' : l.margin.toFixed(1) + '%'}</div>`;
  return el;
}

function noteRow(n) {
  const el = div('');
  el.style.cssText = 'background:#ffffe1;box-shadow:var(--thin);margin:1px 4px 2px 56px;' +
    'padding:2px 5px';
  el.innerHTML = `<span style="color:#808080;text-transform:uppercase">${n.kind}</span>
    &nbsp; ${esc(n.text)}`;
  return el;
}

/* ── RIGHT · Optional add-ons · JOB-LEVEL, and created here ─────────────── */

function addOnsBox(doc) {
  const box = group('Optional add-ons');
  for (const a of doc.addOns) {
    const el = div('');
    el.style.cssText = 'display:flex;gap:8px;align-items:baseline;padding:2px 4px';
    // The checkbox is whether the CUSTOMER ACCEPTED it — ticked when the PO
    // comes back naming it. It is not a UI toggle for you.
    el.innerHTML = `
      <label class="w-check" style="flex:none"><input type="checkbox"${
        a.accepted ? ' checked' : ''} disabled></label>
      <span style="flex:1">${esc(a.label)}</span>
      <span class="num mono">+ ${money(a.amount)}</span>`;
    box.appendChild(el);
  }
  const footer = div('');
  footer.style.cssText = 'background:#dfdfdf;box-shadow:var(--thin);padding:3px 4px;margin-top:3px';
  footer.innerHTML = '<span class="w-btn">＋ Add option</span>';
  box.appendChild(footer);
  return box;
}

/* ── RIGHT · Totals ─────────────────────────────────────────────────────── */

function totalsBox(doc) {
  const box = group('Totals');
  const t = doc.totals;
  const line = (label, value, rule) => `
    <div style="display:flex;padding:2px 4px;${rule
      ? 'border-top:1px solid #000;margin-top:3px;font-weight:bold' : ''}">
      <span style="flex:1;color:${rule ? '#000' : 'var(--ink-3)'}">${label}</span>
      <span class="num mono">${value}</span></div>`;
  box.insertAdjacentHTML('beforeend',
    line('Subtotal', money(t.subtotal)) +
    // Tax is a word here, not a number, because that is what the document says.
    line('Tax', t.tax) +
    line('Total', money(t.total), true));
  return box;
}

/* ─── screen strip · the price bar ──────────────────────────────────────── */

function priceBar(doc) {
  const p = doc.price;
  const el = div('');
  el.style.cssText = 'box-shadow:var(--sunken);background:#fff;flex:none;padding:3px 7px';
  const row = (label, amount, right) => `
    <div style="display:flex;gap:12px;align-items:baseline">
      <span style="color:var(--ink-3);width:74px;flex:none">${label}</span>
      <span class="num mono" style="width:94px;font-weight:bold">${
        amount == null ? '<span class="w-unknown">[?]</span>' : '$' + money(amount)}</span>
      <span style="flex:1;color:var(--ink-2)">${right}</span></div>`;
  el.innerHTML =
    row('COMPUTED', p.computed, `markup ${p.markupPct.toFixed(2)}%`) +
    row('QUOTED', p.quoted,
        `effective markup ${p.effectiveMarkupPct == null ? '[?]'
          : p.effectiveMarkupPct.toFixed(2) + '%'}` +
        (p.delta ? `<span style="float:right;color:${p.delta < 0 ? 'var(--bad)' : '#000'}">${
          p.delta < 0 ? '▼ −$' : '▲ +$'}${money(Math.abs(p.delta))}</span>` : ''));
  return el;
}

function statusBar(doc, cb) {
  const el = div('w-statusbar');
  el.innerHTML = `
    <div class="grow">${cb.problems.length
      ? `<span style="color:var(--bad)">⚠ Next — fix ${cb.problems.length} problem${
          cb.problems.length === 1 ? '' : 's'} in the cost breakdown before issuing</span>`
      : 'Next — send the estimate'}</div>
    <div style="width:190px;flex:none">${doc.locked ? 'Locked' : 'Draft · not locked'}</div>
    <div style="width:190px;flex:none">changed ${date(doc.created)} · DK</div>`;
  return el;
}

/* ─── bits ──────────────────────────────────────────────────────────────── */

function redraw(node) { draw(node.closest('.w-body')); }

const triangle = (open) => `<span style="display:inline-block;width:0;height:0;
  border-left:4px solid transparent;border-right:4px solid transparent;
  ${open ? 'border-top:5px solid #000'
         : 'border-left:5px solid #000;border-top:4px solid transparent;' +
           'border-bottom:4px solid transparent;border-right:0'}"></span>`;

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

const fmtQty = (n) => Number.isInteger(n) ? String(n)
  : n >= 1000 ? Number(n).toLocaleString('en-US') : n.toFixed(2);
const money = (n) => Number(n ?? 0).toLocaleString('en-US',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function div(cls) { const el = document.createElement('div'); if (cls) el.className = cls; return el; }
const esc = (s) => s == null ? '' : String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
