'use strict';

/**
 * RECORD SHIPMENT — docs/25. POPUP, 600 px.
 *
 * ONE DIALOG PER TRUCK. An event, recorded once per delivery — not a living
 * record. Three trucks means three of these, and completeness is cumulative
 * across them.
 *
 * ★ QUANTITY IS A FACT. APPROVED OR ISSUE IS A JUDGMENT. They are
 *   independent, and keeping them apart is what makes partial deliveries work:
 *
 *     4 of 6 · Approved   partial and fine — the rest is coming
 *     4 of 6 · Issue      partial and WRONG — six were promised on this truck
 *
 *   The app cannot tell those apart, because the difference is what the
 *   supplier promised for THIS truck, which nobody tracks and nobody should.
 *   So the numbers are recorded and YOU decide whether it is a problem.
 *
 * ⛔ RECORDING A TRUCK DOES NOT SCHEDULE A JOB. Three of the four outcomes
 *    hold the status exactly where it was; a dialog that claimed credit for a
 *    status it did not cause would teach the wrong model.
 */

import { openPopup } from '../shell.js';

export async function openShipment(version, onDone, shipmentId = null) {
  const d = await window.bpc.shipmentView(version.id, shipmentId);
  const draft = {
    sequenceNo: d.sequenceNo,
    receivedAt: d.receivedAt ?? '',
    destination: d.destination,
    truckLog: d.truckLog ?? '',
    lines: d.lines.map((l) => ({ ...l, qty: l.onThisTruck })),
  };

  return openPopup({
    title: `Record shipment — ${version.tag}`, width: 600,
    build: async (host, popup) => {
      const render = async () => {
        // What this truck WOULD make true, so the preview is honest about
        // which of the four outcomes this is.
        const after = projected(draft, d);
        const next = await window.bpc.previewStatus(version.id, {
          equipmentComplete: after.complete,
          openIssues: after.openIssues,
        });
        const moves = next.label !== version.status.label;

        host.innerHTML = `
          ${box('The truck', `
            ${row('Project', chip(version.identity.project))}
            ${row('Version', chip(version.tag) +
              ` <span style="color:#404040">${esc(version.identity.version)}</span>`)}
            ${row('Shipment', `<span class="w-field"><input data-f="sequenceNo"
                value="${draft.sequenceNo}" style="width:26px;text-align:right"></span>
              <span style="color:#808080">of ${d.expectedCount} expected</span>`)}
            ${row('Received', `<span class="w-field"><input data-f="receivedAt"
                value="${esc(draft.receivedAt)}" placeholder="dd Mmm yyyy"
                style="width:80px"></span>`, true)}
            ${row('Where', radio('destination', 'lot', 'Lot', draft.destination) +
              ' &nbsp; ' + radio('destination', 'site', 'Site', draft.destination))}
            ${row('Truck log', `<span class="w-field"><input data-f="truckLog"
                value="${esc(draft.truckLog)}" style="width:120px"></span>`)}`)}

          ${box('What was on it', itemList(draft))}

          <div class="w-tip">
            <span style="flex:none">💡</span>
            <span><b>Crates are not opened until they are on site.</b><br>
            Record what the truck delivered, not what the packing list claims.
            A part shortage found mid-install is normal in this business —
            reopen the shipment, switch the row, and the status corrects
            itself.</span>
          </div>

          ${recordBlock(version, next, moves, after)}

          <div class="w-buttons">
            <span class="w-btn w-btn--default" style="width:110px" data-ok>Record</span>
            <span class="w-btn" style="width:78px" data-cancel>Cancel</span>
          </div>`;

        host.querySelectorAll('[data-f]').forEach((i) =>
          i.addEventListener('change', (e) => {
            draft[e.target.dataset.f] = e.target.value.trim(); render();
          }));
        host.querySelectorAll('[data-r]').forEach((i) =>
          i.addEventListener('change', (e) => {
            draft[e.target.dataset.r] = e.target.value; render();
          }));
        host.querySelectorAll('[data-qty]').forEach((i) =>
          i.addEventListener('change', (e) => {
            const l = draft.lines[+e.target.dataset.qty];
            l.qty = Math.max(0, Math.min(l.outstanding || l.owed, Number(e.target.value) || 0));
            // ⛔ A row that received nothing shows NO condition selection —
            //    nothing arrived, so there is nothing to judge.
            if (!l.qty) { l.condition = 'approved'; l.issueText = null; }
            render();
          }));
        host.querySelectorAll('[data-cond]').forEach((i) =>
          i.addEventListener('change', (e) => {
            const [idx, val] = e.target.dataset.cond.split(':');
            draft.lines[+idx].condition = val;
            render();
          }));
        host.querySelectorAll('[data-issue]').forEach((i) =>
          i.addEventListener('input', (e) => {
            draft.lines[+e.target.dataset.issue].issueText = e.target.value;
          }));
        // Unloading a clean truck should be ONE CLICK — the checkboxes' one
        // virtue, and it should not be lost with them.
        host.querySelector('[data-all]')?.addEventListener('click', () => {
          draft.lines.forEach((l) => { l.qty = l.outstanding || l.owed; });
          render();
        });

        host.querySelector('[data-cancel]').addEventListener('click', () => popup.close(true));
        host.querySelector('[data-ok]').addEventListener('click', async () => {
          // ⛔ preload's unwrap THROWS on a domain refusal rather than
          //    returning it, so a refusal that is not caught leaves the dialog
          //    sitting there having silently done nothing. The one refusal
          //    this dialog makes is the one worth showing.
          try {
            await window.bpc.recordShipment(version.id, {
              shipmentId: d.editing,
              sequenceNo: Number(draft.sequenceNo) || 1,
              receivedAt: draft.receivedAt,
              destination: draft.destination,
              truckLog: draft.truckLog,
              lines: draft.lines,
            });
          } catch (err) {
            // A problem nobody described is a problem nobody can chase.
            return alertBlock(host, err.message);
          }
          popup.close();
          onDone?.();
        });
      };
      await render();
    },
  });
}

/* ─── the item list ─────────────────────────────────────────────────────── */

function itemList(draft) {
  const head = `
    <div style="display:grid;grid-template-columns:72px minmax(0,1fr) 148px;
                gap:0 10px;color:#404040;padding-bottom:2px">
      <span>RECEIVED / OWED</span><span></span>
      <span style="text-align:right"><span class="w-btn" data-all>Receive all</span></span>
    </div>`;

  const rows = draft.lines.map((l, i) => {
    const remaining = (l.outstanding || l.owed) - l.qty;
    // ★ ONE FRACTION CELL, NOT TWO COLUMNS. The input is what arrived; the
    //   grey /n is what was owed. 0 /4 says "not on this truck" without a word.
    return `
      <div style="border-top:1px solid #f2f2f2;padding:2px 0">
        <div style="display:grid;grid-template-columns:72px minmax(0,1fr) 148px;
                    gap:0 10px;align-items:baseline">
          <span><span class="w-field"><input data-qty="${i}" value="${l.qty}"
                style="width:30px;text-align:right"></span>
            <span style="color:#808080">/${fmt(l.outstanding || l.owed)}</span></span>
          <span>${esc(l.name)}${remaining > 0 && l.qty > 0
            ? `<span style="color:#808080"> &nbsp;${fmt(remaining)} remaining after this truck</span>`
            : ''}</span>
          <span style="text-align:right">${l.qty > 0
            ? cond(i, l.condition)
            : '<span style="color:#808080">— not on this truck</span>'}</span>
        </div>
        ${l.qty > 0 && l.condition === 'issue' ? `
          <div style="display:flex;gap:6px;padding:2px 0 2px 10px">
            <span style="color:var(--bad);flex:none">⚠</span>
            <span class="w-field" style="flex:1"><input data-issue="${i}"
              value="${esc(l.issueText ?? '')}"
              placeholder="say what is wrong" style="width:100%"></span>
          </div>` : ''}
      </div>`;
  }).join('');

  const done = draft.lines.filter((l) => (l.outstanding || l.owed) - l.qty === 0).length;
  const out = draft.lines.reduce((t, l) => t + Math.max(0, (l.outstanding || l.owed) - l.qty), 0);
  const issues = draft.lines.filter((l) => l.qty > 0 && l.condition === 'issue').length;

  return head + rows + `
    <div style="border-top:1px solid #f2f2f2;padding-top:3px;text-align:center;color:#404040">
      ${done} of ${draft.lines.length} line${draft.lines.length === 1 ? '' : 's'} complete ·
      ${fmt(out)} item${out === 1 ? '' : 's'} outstanding ·
      <span style="${issues ? 'color:var(--bad)' : ''}">${issues} issue${
        issues === 1 ? '' : 's'} open</span>
    </div>`;
}

/** Two options, not three. You should not have to pre-categorise a problem
 *  before describing it, and ok/damaged/short was never exhaustive anyway. */
const cond = (i, v) => `
  <label class="w-check" style="display:inline-flex"><input type="radio"
    name="cond${i}" value="approved" data-cond="${i}:approved"${
    v === 'approved' ? ' checked' : ''}> Approved</label>
  <label class="w-check" style="display:inline-flex"><input type="radio"
    name="cond${i}" value="issue" data-cond="${i}:issue"${
    v === 'issue' ? ' checked' : ''}> Issue</label>`;

/* ─── the preview · and why it usually says NOTHING changed ─────────────── */

function projected(draft, d) {
  const lines = draft.lines.map((l) => ({
    left: Math.max(0, (l.outstanding || l.owed) - l.qty),
    issue: l.qty > 0 && l.condition === 'issue',
  }));
  const untouched = d.summary.lines - draft.lines.length;   // already complete
  return {
    complete: untouched >= 0 && lines.every((l) => l.left === 0 && !l.issue),
    openIssues: lines.filter((l) => l.issue).length,
    outstanding: lines.reduce((t, l) => t + l.left, 0),
  };
}

function recordBlock(version, next, moves, after) {
  const alert = next.alerts?.[0] ?? null;
  return `
    <div class="w-record" style="margin-top:10px">
      <span style="flex:none">📋</span>
      <div style="flex:1">
        <div>${esc(version.tag)}${moves ? ' becomes' : ' — status does not change'}</div>
        <div style="display:flex;gap:9px;align-items:center;padding:3px 0 2px">
          <span style="display:inline-flex;background:${next.colour};
                box-shadow:var(--thin);align-items:stretch">
            ${alert ? '<span style="width:4px;background:var(--lip)"></span>' : ''}
            <span style="padding:2px 8px;font-size:11px;font-weight:bold">${esc(next.label)}${
              next.when ? ` <span style="font-weight:normal">${esc(next.when)}</span>` : ''}</span>
          </span>
          ${alert ? `<span style="color:var(--bad)">⚠ ${esc(alert)}</span>` : ''}
        </div>
        <div style="border-top:1px solid #808080;margin:3px 0;width:120px"></div>
        <div style="color:#404040;line-height:1.5">${
          moves
            ? 'Every quantity is in and no issue remains, so the equipment is received.'
            : `Recording a truck does not change the status — the install date does
               that. What this moves: ${after.outstanding
                 ? `${fmt(after.outstanding)} item${after.outstanding === 1 ? '' : 's'} still outstanding`
                 : 'every quantity is in'}${after.openIssues
                 ? ` and ${after.openIssues} issue${after.openIssues === 1 ? '' : 's'} open,
                     so the red lip stays.` : '.'}`}</div>
      </div>
    </div>`;
}

function alertBlock(host, message) {
  const el = document.createElement('div');
  el.className = 'w-alarm';
  el.style.marginTop = '8px';
  el.innerHTML = `<span style="flex:none">⚠</span><span>${esc(message)}</span>`;
  host.querySelector('.w-buttons').before(el);
}

/* ─── shared grammar ────────────────────────────────────────────────────── */

const box = (legend, inner) => `
  <div class="w-group" style="margin-bottom:10px">
    <div class="legend">${legend}</div>${inner}</div>`;

const row = (label, value, required) => `
  <div style="display:grid;grid-template-columns:100px 1fr;gap:4px 8px;
              align-items:baseline;padding:1px 0">
    <span>${label}${required ? ' <span style="color:var(--bad)">★</span>' : ''}</span>
    <span>${value}</span></div>`;

const chip = (text) => `<span style="display:inline-block;background:#c0c0c0;
  box-shadow:var(--thin);padding:1px 6px;color:#404040">${esc(text)}</span>`;

const radio = (name, value, label, current) => `
  <label class="w-check" style="display:inline-flex"><input type="radio"
    name="${name}" value="${value}" data-r="${name}"${
    current === value ? ' checked' : ''}> ${label}</label>`;

const fmt = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
const esc = (s) => s == null ? '' : String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
