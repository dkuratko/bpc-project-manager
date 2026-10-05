'use strict';

/**
 * INVOICE — docs/26. POPUP, 600 px. TWO MODES OF ONE LIVING RECORD.
 *
 *   sent  →  paid
 *
 * You record the invoice going out, and come back weeks later to record the
 * money arriving. BOTH moments change the status, which makes this the only
 * record dialog whose preview says "becomes" twice.
 *
 * ★ SENDING THE INVOICE STARTS THE WARRANTY CLOCK. A real consequence of this
 *   dialog rather than a detail hidden on another screen — so `Starts` is a
 *   CHIP, not a field. It IS `Sent`, and a field you could type into would
 *   suggest otherwise.
 *
 * ★ A DRAW IS NOT THE INVOICE. A deposit goes out before anyone turns up; if
 *   it started the warranty you would be covering a job you have not built.
 *   Only the FINAL draw moves the status and starts the clock.
 *
 * ⛔ `Paid` is not the app chasing money. It exists so the STATUS can move.
 *    Receivables — ageing, reminders, part payments — were ruled out on day
 *    one and stay out. QuickBooks.
 */

import { openPopup } from '../shell.js';

export async function openInvoice(version, onDone) {
  const d = await window.bpc.invoiceView(version.id);
  const draft = {
    sent: d.sent ?? '', paid: d.paid ?? '',
    amount: d.amount ?? 0,
    months: d.warranty.months,
    progress: d.progress,
    drawNo: d.draws.find((x) => !x.sent)?.no ?? d.draws.length,
  };

  return openPopup({
    title: `Invoice — ${version.tag}`, width: 600,
    build: async (host, popup) => {
      const render = async () => {
        const draw = d.draws.find((x) => x.no === draft.drawNo) ?? null;
        const isFinal = !draft.progress || !!draw?.isFinal;
        const starts = isFinal ? (draft.sent || null) : null;
        const expires = starts ? addMonths(starts, Number(draft.months) || 12) : null;

        const next = await window.bpc.previewStatus(version.id, {
          invoiceSentAt: isFinal ? (draft.sent || null) : null,
          paidAt: draft.paid || null,
          warrantyExpiresAt: expires,
        });
        const moves = next.label !== version.status.label;

        host.innerHTML = `
          ${box('The invoice', `
            ${row('Project', chip(version.identity.project))}
            ${row('Version', chip(version.tag) +
              ` <span style="color:#404040">${esc(version.identity.version)}</span>`)}
            ${row('Reference', d.reference
              ? chip(d.reference + (draft.progress && draw
                  ? `-${draw.no}/${draw.of}` : ''))
              : `${chip('BPCi-' + version.tag + (draft.progress && draw
                  ? `-${draw.no}/${draw.of}` : ''))}
                 <span style="color:#808080"> assigned on save</span>`)}
            ${row('Sent', dateField('sent', draft.sent), true)}
            ${row('Amount', `<span class="w-field"><input data-f="amount"
                value="${draft.amount}" style="width:94px;text-align:right"></span>`)}
            ${explain(draft.progress && draw
              ? `draw ${draw.no} of ${draw.of} · job total $${money(d.jobTotal)}`
              : 'approved scope plus change orders')}
            ${row('Paid', dateField('paid', draft.paid))}
            ${explain('receivables live in QuickBooks')}`)}

          ${box('Progress billing', `
            <label class="w-check"><input type="checkbox" data-p${
              draft.progress ? ' checked' : ''}> This is one draw of several</label>
            ${draft.progress ? drawSchedule(d, draft) : ''}`)}

          ${box('Warranty', `
            ${row('Starts', starts ? chip(date(starts))
              : '<span class="w-na">—</span> <span style="color:#808080">not yet</span>')}
            ${!isFinal ? explain(`the clock starts when draw ${draw?.of ?? ''} of ${
              draw?.of ?? ''} is sent`) : ''}
            ${row('Length', `<span class="w-field"><input data-f="months"
                value="${draft.months}" style="width:28px;text-align:right"></span> months`)}
            ${row('Expires', expires ? chip(date(expires))
              : '<span class="w-na">—</span>')}`)}

          ${recordBlock(version, next, moves, { isFinal, expires, paid: draft.paid, draw })}

          <div class="w-buttons">
            <span class="w-btn w-btn--default" style="width:110px" data-ok>Record</span>
            <span class="w-btn" style="width:78px" data-cancel>Cancel</span>
          </div>`;

        host.querySelectorAll('[data-f]').forEach((i) =>
          i.addEventListener('change', (e) => {
            draft[e.target.dataset.f] = e.target.value.trim(); render();
          }));
        host.querySelector('[data-p]').addEventListener('change', (e) => {
          draft.progress = e.target.checked; render();
        });
        host.querySelectorAll('[data-draw]').forEach((b) =>
          b.addEventListener('click', () => {
            draft.drawNo = Number(b.dataset.draw); render();
          }));
        host.querySelector('[data-cancel]').addEventListener('click', () => popup.close(true));
        host.querySelector('[data-ok]').addEventListener('click', async () => {
          try {
            await window.bpc.recordInvoice(version.id, {
              sent: draft.sent, paid: draft.paid,
              amount: Number(draft.amount) || null,
              warrantyMonths: Number(draft.months) || 12,
              drawNo: draft.progress ? draft.drawNo : null,
              isFinal,
            });
          } catch (err) { return alertBlock(host, err.message); }
          popup.close();
          onDone?.();
        });
      };
      await render();
    },
  });
}

/* ─── the draw schedule · display-only ──────────────────────────────────── */

/**
 * DRAW, SENT and PAID are DERIVED — sent and paid come from each draw's own
 * invoice — so only LABEL and AMOUNT are ever typed, in a row editor.
 * docs/12's no-rows-of-inputs rule.
 */
function drawSchedule(d, draft) {
  if (!d.draws.length) {
    return `<div style="color:#808080;padding:4px 0">
      No schedule yet. <span class="w-btn">＋ Add a draw…</span></div>`;
  }
  const COLS = '54px minmax(0,1fr) 104px 96px 96px';
  const rows = d.draws.map((x) => `
    <div style="display:grid;grid-template-columns:${COLS};gap:0 8px;padding:1px 0;
                ${x.no === draft.drawNo ? 'background:#c0c0c0' : ''}"
         data-draw="${x.no}">
      <span class="mono">${x.no}/${x.of}</span>
      <span>${esc(x.label)}</span>
      <span class="num mono">$${money(x.amount)}</span>
      <span class="mono">${x.sent ? date(x.sent) : '<span class="w-na">—</span>'}</span>
      <span class="mono">${x.paid ? date(x.paid) : '<span class="w-na">—</span>'}</span>
    </div>`).join('');

  // ⛔ A billing schedule that does not add up to the work is money you will
  //    never send an invoice for.
  const short = Math.abs(d.schedulePlh) > 0.005;
  return `
    <div style="margin-top:5px">
      <div style="display:grid;grid-template-columns:${COLS};gap:0 8px;color:#404040">
        <span>DRAW</span><span>LABEL</span><span class="num">AMOUNT</span>
        <span>SENT</span><span>PAID</span></div>
      ${rows}
      <div style="padding-top:2px"><span class="w-btn">＋ Add a draw…</span></div>
      <div style="border-top:1px solid var(--cell-rule);margin-top:3px;padding-top:2px;
                  display:grid;grid-template-columns:${COLS};gap:0 8px;${
        short ? 'color:var(--bad)' : ''}">
        <span></span><span>${short ? '⚠ draws total' : 'Scheduled'}</span>
        <span class="num mono">$${money(d.scheduled)}</span>
        <span style="grid-column:4/-1">${short
          ? `$${money(Math.abs(d.schedulePlh))} ${d.schedulePlh > 0 ? 'short of' : 'over'} the job`
          : 'matches the job'}</span>
      </div>
    </div>`;
}

/* ─── the preview — "becomes", twice ────────────────────────────────────── */

function recordBlock(version, next, moves, { isFinal, expires, paid, draw }) {
  // ⛔ NO LIP on either state. Neither is a problem.
  let why;
  if (!isFinal) {
    why = `A draw is not the invoice. The job stays ${next.label} and the
           warranty clock does not start until draw ${draw?.of ?? ''} of ${
           draw?.of ?? ''} goes out.`;
  } else if (paid) {
    const left = expires ? days(new Date().toISOString().slice(0, 10), expires) : null;
    why = `Paid ${date(paid)}.${left != null && left > 0
      ? ` Covered for another ${left} days, then the job goes COMPLETED on its
          own with nothing to record.` : ''}`;
  } else {
    why = `Warranty runs to ${expires ? date(expires) : '—'}.
           Record <b>Paid</b> here when it clears.`;
  }

  return `
    <div class="w-record" style="margin-top:10px">
      <span style="flex:none">📋</span>
      <div style="flex:1">
        <div>${esc(version.tag)}${moves ? ' becomes' : ' — status does not change'}</div>
        <div style="padding:3px 0 2px">
          <span style="display:inline-block;background:${next.colour};
                box-shadow:var(--thin);padding:2px 8px;font-size:11px;font-weight:bold">${
            esc(next.label)}${next.when
              ? ` <span style="font-weight:normal">${esc(next.when)}</span>` : ''}</span>
        </div>
        <div style="border-top:1px solid #808080;margin:3px 0;width:120px"></div>
        <div style="color:#404040;line-height:1.5">${why}</div>
      </div>
    </div>`;
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

const explain = (text) => `
  <div style="display:grid;grid-template-columns:100px 1fr;gap:4px 8px;padding:0 0 3px">
    <span></span><span style="color:#404040;line-height:1.5">${text}</span></div>`;

const chip = (text) => `<span style="display:inline-block;background:#c0c0c0;
  box-shadow:var(--thin);padding:1px 6px;color:#404040">${esc(text)}</span>`;

const dateField = (name, value) => `<span class="w-field">
  <input data-f="${name}" value="${esc(value)}" placeholder="dd Mmm yyyy"
         style="width:80px"></span>`;

function alertBlock(host, message) {
  const el = document.createElement('div');
  el.className = 'w-alarm';
  el.style.marginTop = '8px';
  el.innerHTML = `<span style="flex:none">⚠</span><span>${esc(message)}</span>`;
  host.querySelector('.w-buttons').before(el);
}

function addMonths(iso, months) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

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
