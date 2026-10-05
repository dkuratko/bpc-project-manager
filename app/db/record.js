'use strict';

/**
 * THE RECORD DIALOGS — docs/17 · 24 · 25 · 26.
 *
 * ★ These four are the ONLY place status changes in the whole application.
 *   There is no status column anywhere; all fourteen statuses are derived
 *   from independent facts, because reality does not enforce an order between
 *   them — a job can be scheduled before its equipment lands.
 *
 * ★ A LIVING RECORD, NOT A WIZARD. Every field stays editable, always.
 *   Correcting a fact is the entire mechanism by which a derived status gets
 *   fixed, so a dialog that locked earlier answers would break the model it
 *   serves.
 *
 * ⛔ NOTHING HERE BLOCKS. Scheduling a job whose equipment has not landed is
 *    the alert this application exists to raise — but the customer set that
 *    date, and reality does not care what the app thinks. An app that refused
 *    the date would simply be lied to.
 */

const { deriveStatus } = require('./status.js');

/** Everything the status engine needs, read fresh. */
function facts(db, versionId) {
  const est = db.prepare(
    `SELECT * FROM documents WHERE version_id = ? AND doc_type = 'e'`).get(versionId);
  const f = db.prepare(`SELECT * FROM version_facts WHERE version_id = ?`)
    .get(versionId) ?? {};
  const s = db.prepare(`SELECT * FROM version_schedule WHERE version_id = ?`)
    .get(versionId) ?? {};
  const w = db.prepare(`SELECT * FROM warranties WHERE version_id = ?`).get(versionId);
  const shipments = db.prepare(`SELECT * FROM shipments WHERE version_id = ?`)
    .all(versionId);
  const items = shipments.length ? db.prepare(`
    SELECT i.* FROM shipment_items i JOIN shipments s ON s.id = i.shipment_id
     WHERE s.version_id = ?`).all(versionId) : [];

  return {
    estimateCreatedAt: est?.created_at ?? null,
    estimateSentAt: est?.sent_at ?? null,
    approvedAt: f.approved_at ?? null,
    installDate: s.install_date ?? null,
    startedAt: s.started_at ?? null,
    completedAt: s.completed_at ?? null,
    invoiceSentAt: f.invoice_sent_at ?? null,
    paidAt: f.paid_at ?? null,
    warrantyExpiresAt: w?.expires_at ?? null,
    shipments: shipments.map((sh) => ({
      received: !!sh.received_at,
      items: items.filter((i) => i.shipment_id === sh.id),
    })),
    equipmentComplete: shipments.length > 0 && shipments.every((sh) => sh.received_at),
    openIssues: items.filter((i) => i.condition === 'issue').length,
  };
}

/**
 * What the status WOULD be if these facts were recorded. The dialog's record
 * block is a promise, so it has to be computed by the same function that will
 * compute it for real — not described in prose beside the fields.
 */
function preview(db, versionId, proposed, today) {
  return deriveStatus({ ...facts(db, versionId), ...proposed }, today);
}

/* ─── Schedule · docs/24 ────────────────────────────────────────────────── */

function scheduleView(db, versionId) {
  const s = db.prepare(`SELECT * FROM version_schedule WHERE version_id = ?`)
    .get(versionId) ?? {};

  // Read-only here, and present ONLY so a date cannot be set without seeing
  // it. Shipments are recorded in Record shipment… — docs/25.
  const shipments = db.prepare(
    `SELECT * FROM shipments WHERE version_id = ? ORDER BY sequence_no`).all(versionId);
  const items = db.prepare(`
    SELECT i.*, s.received_at FROM shipment_items i
      JOIN shipments s ON s.id = i.shipment_id
     WHERE s.version_id = ?`).all(versionId);

  const receivedLines = shipments.filter((s) => s.received_at).length;
  const outstanding = items
    .filter((i) => !i.received_at)
    .reduce((t, i) => t + (i.quantity_expected ?? 0) - (i.quantity_received ?? 0), 0);

  return {
    install: s.install_date ?? null,
    buffer: s.buffer_days ?? 0,
    started: s.started_at ?? null,
    completed: s.completed_at ?? null,
    equipment: {
      lines: shipments.length,
      receivedLines,
      outstanding,
      nothingArrived: shipments.length === 0 || receivedLines === 0,
    },
  };
}

function recordSchedule(db, versionId, { install, buffer, started, completed }) {
  db.prepare(`
    INSERT INTO version_schedule (version_id,install_date,started_at,completed_at,buffer_days)
    VALUES (?,?,?,?,?)
    ON CONFLICT(version_id) DO UPDATE SET
      install_date = excluded.install_date,
      started_at   = excluded.started_at,
      completed_at = excluded.completed_at,
      buffer_days  = excluded.buffer_days`)
    .run(versionId, install || null, started || null, completed || null, buffer ?? 0);

  // ⛔ Completed does NOT complete the job. It means the crew is off site; the
  //    job stays ACTIVE until the invoice goes out, because completion IS the
  //    invoice. There is no "completed, payment required" state, and this is
  //    the one removed status that keeps trying to reassert itself.
  return { ok: true };
}

module.exports = { facts, preview, scheduleView, recordSchedule };
