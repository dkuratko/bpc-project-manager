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
  const o = outstanding(db, versionId);

  // Read-only here, and present ONLY so a date cannot be set without seeing
  // it. Shipments are recorded in Record shipment… — docs/25.
  return {
    install: s.install_date ?? null,
    buffer: s.buffer_days ?? 0,
    started: s.started_at ?? null,
    completed: s.completed_at ?? null,
    equipment: {
      lines: o.lines.length,
      receivedLines: o.lines.filter((l) => l.outstanding === 0).length,
      outstanding: o.totalOutstanding,
      issues: o.openIssues.length,
      nothingArrived: o.lines.every((l) => l.received === 0),
    },
  };
}

/* ─── Record shipment · docs/25 ─────────────────────────────────────────── */

/**
 * ★ Completeness is CUMULATIVE AT COMPONENT LEVEL. A line arrives across
 *   several trucks and that is normal, so what is owed comes from the SCOPE
 *   and what has arrived is summed across every shipment recorded so far.
 *   The dialog then lists only what is still outstanding — never what has
 *   already arrived.
 */
function outstanding(db, versionId) {
  const objects = db.prepare(`
    SELECT o.id, o.quantity, o.unit,
           COALESCE(c.name, s.name) AS name
      FROM cost_objects o
      LEFT JOIN components c ON c.id = o.component_id
      LEFT JOIN services s   ON s.id = o.service_id
     WHERE o.version_id = ? AND o.delta_id IS NULL AND o.kind = 'scope_row'
     ORDER BY o.sequence_no`).all(versionId);

  const items = db.prepare(`
    SELECT i.*, sh.sequence_no FROM shipment_items i
      JOIN shipments sh ON sh.id = i.shipment_id
     WHERE sh.version_id = ?`).all(versionId);

  const lines = objects.map((o) => {
    const mine = items.filter((i) => i.cost_object_id === o.id);
    const received = mine.reduce((t, i) => t + (i.quantity_received ?? 0), 0);
    return {
      objectId: o.id, name: o.name, owed: o.quantity, unit: o.unit,
      received,
      outstanding: Math.max(0, o.quantity - received),
      // An issue is OPEN until someone reopens that shipment and switches the
      // row to Approved. Resolving it is correcting the fact, not filing a
      // second record about it.
      issue: mine.find((i) => i.condition === 'issue' && !i.issue_resolved_at) ?? null,
    };
  });

  return {
    lines,
    totalOutstanding: lines.reduce((t, l) => t + l.outstanding, 0),
    openIssues: lines.filter((l) => l.issue).map((l) => ({
      line: l.name, text: l.issue.issue_text,
    })),
    // ★ EQUIPMENT RECEIVED needs BOTH gates. Six benches all present with an
    //   open damage issue is not received equipment, and neither is a clean
    //   truck that brought four of six.
    complete: lines.length > 0 && lines.every((l) => l.outstanding === 0)
              && !lines.some((l) => l.issue),
  };
}

function shipmentView(db, versionId, shipmentId = null) {
  const shipments = db.prepare(
    `SELECT * FROM shipments WHERE version_id = ? ORDER BY sequence_no`).all(versionId);
  const o = outstanding(db, versionId);

  // Reopening an existing truck shows what IT carried, so an issue can be
  // switched to Approved. A new truck shows what is still outstanding.
  const editing = shipmentId
    ? shipments.find((s) => s.id === shipmentId) ?? null : null;
  const mine = editing ? db.prepare(
    `SELECT * FROM shipment_items WHERE shipment_id = ?`).all(editing.id) : [];

  return {
    editing: editing?.id ?? null,
    sequenceNo: editing?.sequence_no ?? shipments.length + 1,
    expectedCount: Math.max(shipments.length + 1, 1),
    receivedAt: editing?.received_at ?? null,
    destination: editing?.destination ?? 'lot',
    truckLog: editing?.truck_log_ref ?? null,
    lines: (editing
      ? o.lines.map((l) => {
          const it = mine.find((i) => i.cost_object_id === l.objectId);
          return { ...l, onThisTruck: it?.quantity_received ?? 0,
                   condition: it?.condition ?? 'approved',
                   issueText: it?.issue_text ?? null };
        })
      // ⛔ Outstanding only. Listing what has already arrived would make a
      //    second truck a re-run of the first.
      : o.lines.filter((l) => l.outstanding > 0 || l.issue)
          .map((l) => ({ ...l, onThisTruck: 0, condition: 'approved', issueText: null }))),
    summary: {
      linesComplete: o.lines.filter((l) => l.outstanding === 0).length,
      lines: o.lines.length,
      outstanding: o.totalOutstanding,
      openIssues: o.openIssues.length,
    },
  };
}

/**
 * ⛔ RECORDING A TRUCK DOES NOT SCHEDULE A JOB. The install date did that, in
 *    the Schedule dialog. What a truck changes is whether the equipment is
 *    there — which moves the ALARM, not the status. Three of the four
 *    outcomes hold the status exactly where it was.
 */
function recordShipment(db, versionId, { shipmentId, sequenceNo, receivedAt,
                                         destination, truckLog, lines = [] }) {
  // ⛔ A problem nobody described is a problem nobody can chase.
  const undescribed = lines.find(
    (l) => l.condition === 'issue' && !(l.issueText ?? '').trim());
  if (undescribed) {
    return { error: `${undescribed.name}: an issue needs a description` };
  }

  const id = shipmentId ?? `shp_${versionId}_${sequenceNo}`;
  db.transaction(() => {
    db.prepare(`
      INSERT INTO shipments (id,version_id,sequence_no,received_at,destination,truck_log_ref)
      VALUES (?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET
        sequence_no = excluded.sequence_no, received_at = excluded.received_at,
        destination = excluded.destination, truck_log_ref = excluded.truck_log_ref`)
      .run(id, versionId, sequenceNo, receivedAt || null, destination ?? 'lot',
           truckLog || null);

    db.prepare(`DELETE FROM shipment_items WHERE shipment_id = ?`).run(id);
    const IT = db.prepare(`INSERT INTO shipment_items
      (id,shipment_id,cost_object_id,description,quantity_received,condition,
       issue_text,issue_opened_at,issue_resolved_at)
      VALUES (?,?,?,?,?,?,?,?,?)`);

    lines.filter((l) => l.qty > 0 || l.condition === 'issue').forEach((l, i) =>
      IT.run(`${id}_${i}`, id, l.objectId, l.name, l.qty ?? 0,
             l.condition ?? 'approved',
             l.condition === 'issue' ? l.issueText : null,
             l.condition === 'issue' ? (receivedAt || null) : null,
             // Switching a row back to Approved is how an issue closes. No
             // second dialog — correct the fact, not the conclusion.
             l.condition === 'issue' ? null : (receivedAt || null)));
  })();
  return { ok: true };
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

module.exports = { facts, preview, scheduleView, recordSchedule,
                   outstanding, shipmentView, recordShipment };
