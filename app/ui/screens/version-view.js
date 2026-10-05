'use strict';

/**
 * VERSION VIEW — docs/09, final v3. The hub for one job.
 *
 * Built to the MAIN WINDOW TEMPLATE, docs/10: identity strip · status strip ·
 * body · status bar. Every MAIN screen answers the same three questions before
 * you look at anything else — whose job is this, where does it stand, what has
 * to happen next — and they live in fixed places so the app stops being a set
 * of tools and starts being one thing.
 *
 * ⛔ The body is ONE flex row with EXACTLY TWO children. The v2 render emitted
 *    the right column after </html> and cut off mid-box; docs/09 records that
 *    as a named failure mode. Boxes size to their content and stack from the
 *    top — they do not stretch.
 *
 * It is a STATUS PAGE, not a working surface. Almost everything is read-only;
 * the toolbar opens the dialogs that change things.
 */

import { openMain, openPopup } from '../shell.js';
import { openCostBreakdown } from './cost-breakdown.js';
import { openEstimate } from './estimate.js';
import { openSchedule } from '../dialogs/schedule.js';
import { openShipment } from '../dialogs/shipment.js';

// openMain raises an open window rather than rebuilding it, so a dialog that
// changed a fact has to say "draw this again" explicitly.
const bodies = new Map();

export async function refreshVersionView(versionId) {
  const body = bodies.get(versionId);
  if (!body?.isConnected) return;
  const d = await window.bpc.version(versionId);
  if (d) draw(body, d);
}

export async function openVersionView(versionId) {
  const d = await window.bpc.version(versionId);
  if (!d) return;

  return openMain({
    id: `version:${versionId}`,
    title: `Version ${d.tag} — ${d.name ?? ''}`,
    menu: ['File', 'Edit', 'Version', 'Documents', 'Tools', 'Window', 'Help'],
    width: 1000, height: 780,
    build: (body) => { bodies.set(versionId, body); draw(body, d); },
  });
}

function draw(body, d) {
  body.innerHTML = '';
  body.append(
    toolbar(d),
    identityStrip(d),
    statusStrip(d),
    columns(d),
    statusBar(d),
  );
}

/* ─── toolbar ───────────────────────────────────────────────────────────── */

function toolbar(d) {
  const el = div('w-toolbar');
  // docs/09 · Post cost is greyed until the job is complete.
  const postCostLive = !!d.money.paid;
  el.innerHTML = `
    <span class="w-btn" data-open="cost">Cost breakdown</span>
    <span class="w-btn" data-open="estimate">Estimate</span>
    <span class="w-sep"></span>
    <span class="w-btn" data-pop="approval">Record approval…</span>
    <span class="w-btn" data-pop="shipment">Record shipment…</span>
    <span class="w-btn" data-pop="schedule">Schedule…</span>
    <span class="w-btn" data-pop="invoice">Invoice…</span>
    <span class="w-sep"></span>
    <span class="w-btn"${postCostLive ? '' : ' aria-disabled="true"'}>Post cost</span>`;

  // §9b · these four open popups. The rooms are specified and not yet built,
  // so the route exists before the room does.
  el.querySelector('[data-open=cost]').addEventListener('click',
    () => openCostBreakdown(d.id));
  el.querySelector('[data-open=estimate]').addEventListener('click',
    () => openEstimate(d.id));

  el.querySelector('[data-pop=schedule]').addEventListener('click',
    () => openSchedule(d, () => refreshVersionView(d.id)));

  // §9b · the rest are specified and not yet built, so the route exists
  // before the room does.
  el.querySelector('[data-pop=shipment]').addEventListener('click',
    () => openShipment(d, () => refreshVersionView(d.id)));

  el.querySelectorAll('[data-pop]:not([data-pop=schedule]):not([data-pop=shipment])').forEach((b) =>
    b.addEventListener('click', () => notBuiltYet(b.textContent.replace('…', ''), b.dataset.pop)));
  return el;
}

function notBuiltYet(title, which) {
  const BRIEF = { approval: 'docs/17', shipment: 'docs/25',
                  schedule: 'docs/24', invoice: 'docs/26' };
  openPopup({
    title, width: 480,
    build: (host, popup) => {
      host.innerHTML = `
        <div class="w-tip">
          <span style="flex:none">📋</span>
          <span><b>${title} — ${BRIEF[which]}, rendered and approved.</b><br>
          Not built yet. §9b has it opening from here, so the route exists
          before the room does.</span>
        </div>
        <div class="w-buttons"><span class="w-btn w-btn--default"
              style="width:78px" data-close>OK</span></div>`;
      host.querySelector('[data-close]').addEventListener('click', () => popup.close());
    },
  });
}

/* ─── identity strip · docs/10 · read-only on every screen ──────────────── */

function identityStrip(d) {
  const el = div('');
  el.style.cssText = 'box-shadow:var(--thin);padding:5px 8px;flex:none;' +
    'display:grid;grid-template-columns:1fr 1fr;gap:2px 18px';
  const cell = (label, value) =>
    `<span style="display:flex;gap:8px;min-width:0">
       <span style="color:var(--ink-3);width:58px;flex:none">${label}</span>
       <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${
         value ?? '<span class="w-na">—</span>'}</span></span>`;
  el.innerHTML =
    cell('Customer', join(d.identity.customer, d.identity.contact)) +
    cell('Project',  esc(d.identity.project)) +
    cell('Site',     esc(d.identity.site)) +
    cell('Version',  esc(d.identity.version));
  return el;
}

/* ─── status strip · the ONLY tinted region. docs/10 ────────────────────── */

function statusStrip(d) {
  const el = div('');
  el.style.cssText = `box-shadow:var(--thin);flex:none;display:flex;` +
    `align-items:stretch;background:${d.status.colour}`;
  el.innerHTML = `
    ${d.status.hasProblem ? '<span style="width:4px;flex:none;background:var(--lip)"></span>' : ''}
    <span style="padding:7px 10px;display:flex;align-items:baseline;gap:14px;flex:1;min-width:0">
      <span style="font-size:15px;font-weight:bold;white-space:nowrap">${titleCase(d.status.label)}</span>
      <span class="mono" style="color:var(--ink-2);white-space:nowrap">${
        d.status.when ? whenLabel(d.status, d) : ''}</span>
      <span style="flex:1"></span>
      ${d.status.hasProblem ? `<span style="color:var(--bad);text-align:right;line-height:1.45">
          ⚠ ${esc(d.status.alerts[0])}${d.next.detail ? `<br><span style="font-weight:normal">${esc(d.next.detail)}</span>` : ''}
        </span>` : ''}
    </span>`;
  return el;
}

const whenLabel = (s, d) =>
  s.label === 'SCHEDULED' ? `install ${s.when}`
  : s.label === 'SENT, AWAITING' ? `sent ${s.when}`
  : s.when;

/* ─── body · ONE row, EXACTLY TWO children ──────────────────────────────── */

function columns(d) {
  const row = div('');
  row.style.cssText = 'flex:1;min-height:0;display:flex;gap:6px;overflow:auto;padding:3px 0';

  const left = div('');
  left.style.cssText = 'width:430px;flex:none;display:flex;flex-direction:column;gap:10px';
  left.append(progressBox(d), shipmentsBox(d));

  const right = div('');
  right.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:10px';
  right.append(documentsBox(d), moneyBox(d), scheduleBox(d));

  row.append(left, right);   // two children. no more, no less.
  return row;
}

function groupBox(legend) {
  const el = div('w-group');
  el.style.flex = 'none';                 // boxes size to content — docs/09
  el.innerHTML = `<div class="legend">${legend}</div>`;
  return el;
}

/** docs/09 · ✓ done · ⚠ reached but incomplete · ● current · future grey */
function progressBox(d) {
  const box = groupBox('Progress');
  const rows = d.progress.map((r) => {
    const mark = { done: '<span>✓</span>', warn: '<span style="color:var(--bad)">⚠</span>',
                   current: `<span style="width:9px;height:9px;background:${d.status.colour};
                             box-shadow:var(--thin);display:inline-block"></span>` }[r.mark] ?? '';
    const style = r.mark === 'current' ? 'font-weight:bold'
                : r.mark === 'warn'    ? 'color:var(--bad)'
                : r.future             ? 'color:#909090' : '';
    return `<div style="display:grid;grid-template-columns:16px 1fr 92px 1fr;
                        gap:0 8px;align-items:center;padding:2px 0;${style}">
      <span style="text-align:center">${mark}</span>
      <span style="white-space:nowrap">${r.label}</span>
      <span class="mono">${r.when ?? (r.mark === 'warn' ? '—' : '')}</span>
      <span style="color:${r.mark === 'warn' ? 'var(--bad)' : 'var(--ink-3)'}">${r.aside ?? ''}</span>
    </div>`;
  }).join('');
  box.insertAdjacentHTML('beforeend', `<div>${rows}</div>`);
  return box;
}

function shipmentsBox(d) {
  const box = groupBox('Shipments');
  if (!d.shipments.length) {
    box.insertAdjacentHTML('beforeend',
      `<div class="w-na">No shipment recorded yet.</div>`);
    return box;
  }
  const got = d.shipments.filter((s) => s.received).length;
  const items = d.shipments.map((s) => `
    <div style="display:grid;grid-template-columns:36px 1fr 1fr;gap:0 8px;padding:3px 0">
      <span class="mono">#${s.number}</span>
      <span class="mono" style="${s.received ? '' : 'color:var(--bad)'}">${
        s.received ? 'received ' + s.received : 'not received'}</span>
      <span style="${s.issues ? 'color:var(--bad)' : ''}">${
        s.issues ? '⚠ ' + esc(s.items.find((i) => i.condition === 'issue').description) : '✓'}</span>
    </div>
    <div style="color:var(--ink-3);padding:0 0 2px 44px">${
      esc(s.items.map((i) => i.description).join(' · '))}</div>`).join('');

  box.insertAdjacentHTML('beforeend', `
    <div>${items}</div>
    <div style="text-align:right;color:var(--ink-3);padding-top:4px">
      ${got} of ${d.shipments.length} shipment${d.shipments.length === 1 ? '' : 's'} received</div>`);
  return box;
}

/** docs/09 · a row with no document is NOT blank. It says what has not happened. */
function documentsBox(d) {
  const box = groupBox('Documents');
  const rows = d.documents.map((r) => `
    <div style="display:grid;grid-template-columns:140px 1fr 84px 84px 1fr;
                gap:0 8px;padding:2px 0;align-items:baseline">
      <span class="mono">${r.reference ?? ''}</span>
      <span style="${r.missing ? 'color:#909090' : ''}">${r.what}</span>
      <span class="mono" style="color:var(--ink-2)">${r.created ?? '—'}</span>
      <span class="mono" style="color:var(--ink-2)">${r.sent ?? '—'}</span>
      <span style="${r.missing ? 'color:#909090' : 'color:var(--ink-2)'}">${esc(r.state)}</span>
    </div>`).join('');
  box.insertAdjacentHTML('beforeend', `<div>${rows}</div>`);
  return box;
}

/** docs/09 · the ladder. Cost in #606060 — internal, never on a customer document. */
function moneyBox(d) {
  const m = d.money;
  const line = (label, aside, value, opts = {}) => `
    <div style="display:grid;grid-template-columns:1fr 150px 110px;gap:0 8px;
                padding:2px 0;${opts.bold ? 'font-weight:bold' : ''}${opts.rule ? ';border-top:1px solid var(--edge);margin-top:3px;padding-top:4px' : ''}">
      <span>${label}</span>
      <span style="color:var(--ink-3)">${aside ?? ''}</span>
      <span class="num mono">${value == null ? '<span class="w-na">—</span>' : money(value)}</span>
    </div>`;

  const box = groupBox('Money');
  box.insertAdjacentHTML('beforeend', `
    <div>
      ${line('Quoted', null, m.quoted)}
      ${line('Approved', m.approvalRef ? `PO ${m.approvalRef}` : null, m.approved)}
      ${line('Change orders', m.changeOrders ? null : 'none', m.changeOrders)}
      ${line('Revised contract', null, m.revised, { rule: true, bold: true })}
      ${line('Invoiced', null, m.invoiced)}
      ${line('Paid', null, m.paid)}
      ${line('Outstanding', null, m.outstanding, { rule: true, bold: true })}
      <div style="color:#606060;padding-top:6px">
        Cost ${m.cost == null ? '<span class="w-unknown">[?]</span>' : money(m.cost)}
        &nbsp;·&nbsp; margin ${m.margin == null ? '<span class="w-unknown">[?]</span>'
                                                : m.margin.toFixed(1) + '%'}</div>
    </div>`);
  return box;
}

/** docs/09 · warranty folds in here as three rows. It does not earn a box. */
function scheduleBox(d) {
  const s = d.schedule;
  const row = (label, value, aside) => `
    <div style="display:grid;grid-template-columns:150px 120px 1fr;gap:0 8px;padding:2px 0">
      <span>${label}</span>
      <span class="mono">${value ?? '<span class="w-na">—</span>'}</span>
      <span style="color:var(--ink-3)">${aside ?? ''}</span>
    </div>`;

  const box = groupBox('Schedule');
  box.insertAdjacentHTML('beforeend', `
    <div>
      ${row('Install date', s.install, s.buffer ? `${s.buffer} day buffer` : null)}
      ${row('Started', s.started)}
      ${row('Off site', s.completed, s.completed ? 'completion IS the invoice' : null)}
      ${row('Distance', s.distance ? `${s.distance} mi` : null,
            s.driveTime ? `${(s.driveTime / 60).toFixed(1)} hr each way` : null)}
      <div style="border-top:1px solid var(--cell-rule);margin:5px 0 3px"></div>
      ${row('Warranty starts', s.warrantyStarts, s.warrantyStarts ? null : 'on invoice — not yet started')}
      ${row('Warranty term', `${s.warrantyMonths} months`)}
      ${row('Warranty expires', s.warrantyExpires)}
    </div>`);
  return box;
}

/* ─── status bar · docs/10 · three segments ─────────────────────────────── */

function statusBar(d) {
  const el = div('w-statusbar');
  // A problem always displaces the ordinary next step — docs/10.
  const next = d.next.problem
    ? `<span style="color:var(--bad)">⚠ Next — ${esc(d.next.text)}${
        d.next.detail ? ' · ' + esc(d.next.detail) : ''}</span>`
    : `Next — ${esc(d.next.text)}`;
  el.innerHTML = `
    <div class="grow">${next}</div>
    <div style="width:210px;flex:none">${
      d.locked ? `Estimate locked ${d.locked}` : '<span class="w-na">not locked</span>'}</div>
    <div style="width:190px;flex:none"><span class="w-na">—</span></div>`;
  return el;
}

/* ─── bits ──────────────────────────────────────────────────────────────── */

function div(cls) { const el = document.createElement('div'); if (cls) el.className = cls; return el; }
const join = (...xs) => xs.filter(Boolean).map(esc).join(' · ') || null;
const titleCase = (s) => s.charAt(0) + s.slice(1).toLowerCase();
const money = (n) => '$' + Number(n ?? 0).toLocaleString('en-US',
  { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s) => s == null ? '' : String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
