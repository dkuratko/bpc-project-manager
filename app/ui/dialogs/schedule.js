'use strict';

/**
 * SCHEDULE — docs/24. POPUP, 600 px. From the Version View toolbar.
 *
 * One of the FOUR dialogs that are the only place status changes in the whole
 * application.
 *
 * ⛔ NO STATUS DROPDOWN. Status is derived; a dialog that let you pick one
 *    would break the entire model.
 * ⛔ NO WIZARD BEHAVIOUR. Nothing greys out, nothing locks once entered.
 *    Correcting a fact is how a wrong status gets fixed.
 * ⛔ NO COMPUTED END DATE. The customer picks the day; the schedule follows.
 * ⛔ IT DOES NOT BLOCK. Scheduling a job whose equipment is not on the lot is
 *    the alert this application exists to raise — and it is still recorded.
 *    An app that refused the date would simply be lied to.
 */

import { openPopup } from '../shell.js';

export async function openSchedule(version, onDone) {
  const d = await window.bpc.schedule(version.id);
  const draft = { install: d.install, buffer: d.buffer,
                  started: d.started, completed: d.completed };

  return openPopup({
    title: `Schedule — ${version.tag}`, width: 600,
    build: async (host, popup) => {
      const render = async () => {
        // The record block is a PROMISE, so it is computed by the same
        // function that will compute it for real.
        const next = await window.bpc.previewStatus(version.id, {
          installDate: draft.install || null,
          startedAt: draft.started || null,
          completedAt: draft.completed || null,
        });

        host.innerHTML = `
          ${box('The dates', `
            ${fieldRow('Project', chip(version.identity.project))}
            ${fieldRow('Version', chip(version.tag) +
              ` <span style="color:#404040">${esc(version.identity.version)}</span>`)}
            ${fieldRow('Install', dateField('install', draft.install), true)}
            ${explain('the customer sets this date, you do not')}
            ${fieldRow('Buffer', `<span class="w-field"><input data-f="buffer"
               value="${draft.buffer ?? 0}" style="width:34px;text-align:right"></span> days`)}
            ${explain('how long you are holding either side')}
            ${fieldRow('Started', dateField('started', draft.started))}
            ${explain('when the crew is on site')}
            ${fieldRow('Completed', dateField('completed', draft.completed))}
            ${explain('off site and not coming back')}`)}

          ${box('Equipment', `
            <div>${d.equipment.receivedLines} of ${d.equipment.lines} line${
              d.equipment.lines === 1 ? '' : 's'} complete${
              d.equipment.outstanding ? ` · ${fmt(d.equipment.outstanding)} items outstanding` : ''}</div>
            ${d.equipment.nothingArrived
              ? '<div style="color:var(--bad)">⚠ nothing has arrived</div>' : ''}
            <div style="color:#808080">recorded in Record shipment… — read-only here</div>`)}

          <div class="w-tip">
            <span style="flex:none">💡</span>
            <span><b>Completed does not complete the job.</b><br>
            Filling in <b>Completed</b> means the crew is off site. The job stays
            ACTIVE until the invoice goes out, because completion IS the invoice
            — there is no “completed, payment required” state. Use
            <b>Invoice…</b> when you bill it.</span>
          </div>

          ${recordBlock(version, next)}

          <div class="w-buttons">
            <span class="w-btn w-btn--default" style="width:110px" data-ok>Record</span>
            <span class="w-btn" style="width:78px" data-cancel>Cancel</span>
          </div>`;

        host.querySelectorAll('[data-f]').forEach((i) =>
          i.addEventListener('change', (e) => {
            draft[e.target.dataset.f] = e.target.value.trim();
            render();
          }));
        host.querySelector('[data-cancel]').addEventListener('click', () => popup.close(true));
        host.querySelector('[data-ok]').addEventListener('click', async () => {
          await window.bpc.recordSchedule(version.id, {
            install: draft.install, buffer: Number(draft.buffer) || 0,
            started: draft.started, completed: draft.completed,
          });
          popup.close();
          onDone?.();
        });
      };
      await render();
    },
  });
}

/* ─── the dialog grammar · docs/24 ──────────────────────────────────────── */

const box = (legend, inner) => `
  <div class="w-group" style="margin-bottom:10px">
    <div class="legend">${legend}</div>${inner}</div>`;

const fieldRow = (label, value, required) => `
  <div style="display:grid;grid-template-columns:100px 1fr;gap:4px 8px;
              align-items:baseline;padding:1px 0">
    <span>${label}${required ? ' <span style="color:var(--bad)">★</span>' : ''}</span>
    <span>${value}</span></div>`;

/** The explanation sits in the VALUE column with an empty label beside it. */
const explain = (text) => `
  <div style="display:grid;grid-template-columns:100px 1fr;gap:4px 8px;padding:0 0 3px">
    <span></span>
    <span style="color:#404040;line-height:1.5">${esc(text)}</span></div>`;

/** A read-only value is a CHIP — #c0c0c0 ground, raised bevel, #404040 text. */
const chip = (text) => `<span style="display:inline-block;background:#c0c0c0;
  box-shadow:var(--thin);padding:1px 6px;color:#404040">${esc(text)}</span>`;

// 80 px, never 56 — and always dd Mmm yyyy.
const dateField = (name, value) => `<span class="w-field">
  <input data-f="${name}" value="${value ?? ''}" placeholder="dd Mmm yyyy"
         style="width:80px"></span>`;

/**
 * ★ GREEN WITH A RED LIP IS THE WHOLE POINT. The job's real phase is
 *   SCHEDULED and it stays green; the lip says something about it is wrong.
 *   A red row would mean FINISHED.
 */
function recordBlock(version, next) {
  const alert = next.alerts?.[0] ?? null;
  return `
    <div class="w-record" style="margin-top:10px">
      <span style="flex:none">📋</span>
      <div style="flex:1">
        <div>${esc(version.tag)} becomes</div>
        <div style="display:flex;gap:9px;align-items:center;padding:3px 0 2px">
          <span style="display:inline-flex;background:${next.colour};
                box-shadow:var(--thin);align-items:stretch">
            ${alert ? '<span style="width:4px;background:var(--lip)"></span>' : ''}
            <span style="padding:2px 8px;font-size:11px;font-weight:bold">${
              esc(next.label)}${next.when ? ` <span style="font-weight:normal">${
              esc(next.when)}</span>` : ''}</span></span>
          ${alert ? `<span style="color:var(--bad)">⚠ ${esc(alert)}</span>` : ''}
        </div>
        <div style="border-top:1px solid #808080;margin:3px 0;width:120px"></div>
        <div style="color:#404040;line-height:1.5">${
          alert
            ? 'Scheduling a job whose equipment is not on the lot is the alert ' +
              'this application exists to raise. The date is not blocked — the ' +
              'job just carries the warning until the last crate lands.'
            : 'The date is recorded as given. Nothing here blocks.'}</div>
      </div>
    </div>`;
}

const fmt = (n) => Number(n).toLocaleString('en-US');
const esc = (s) => s == null ? '' : String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
