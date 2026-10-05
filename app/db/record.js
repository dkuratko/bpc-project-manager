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

/* ─── Invoice · docs/26 ─────────────────────────────────────────────────── */

/**
 * ★ A DRAW IS NOT THE INVOICE, and this is the thing the brief got wrong
 *   until it was drawn.
 *
 *   The warranty clock starts when the invoice is SENT — but with draws,
 *   WHICH invoice? A deposit goes out before anyone turns up. If it started
 *   the warranty you would be covering a job you have not built.
 *
 *     draw 1 of 3   a deposit. the job has not started.
 *     draw 2 of 3   progress. the crew is on site.
 *     draw 3 of 3   THE INVOICE. warranty starts here.
 *
 *   Only the FINAL draw moves the status and starts the clock. Every earlier
 *   one leaves the job exactly where it was — the same shape as Record
 *   shipment, where three of four outcomes hold the status.
 */
function invoiceView(db, versionId) {
  const inv = db.prepare(
    `SELECT * FROM documents WHERE version_id = ? AND doc_type = 'i'`).get(versionId);
  const f = db.prepare(`SELECT * FROM version_facts WHERE version_id = ?`)
    .get(versionId) ?? {};
  const w = db.prepare(`SELECT * FROM warranties WHERE version_id = ?`).get(versionId);
  const draws = db.prepare(
    `SELECT * FROM billing_draws WHERE version_id = ? ORDER BY sequence_no`).all(versionId);

  const approval = db.prepare(
    `SELECT * FROM approvals WHERE version_id = ? ORDER BY received_at DESC LIMIT 1`)
    .get(versionId);
  const est = db.prepare(
    `SELECT * FROM documents WHERE version_id = ? AND doc_type = 'e'`).get(versionId);
  const changeOrders = db.prepare(`
    SELECT COALESCE(SUM(price_delta), 0) t FROM scope_deltas
     WHERE version_id = ? AND kind = 'change_order' AND accepted = 1`).get(versionId).t;

  // Approved scope plus change orders.
  const jobTotal = (approval?.po_amount ?? est?.quoted_price ?? 0) + changeOrders;
  const scheduled = draws.reduce((t, d) => t + (d.amount ?? 0), 0);

  const tag = db.prepare(`
    SELECT p.number || v.option_letter || v.version_number AS tag
      FROM versions v JOIN projects p ON p.id = v.project_id WHERE v.id = ?`)
    .get(versionId).tag;

  return {
    reference: inv?.reference ?? null,     // assigned on save
    sent: inv?.sent_at ?? f.invoice_sent_at ?? null,
    paid: f.paid_at ?? null,
    amount: inv?.quoted_price ?? jobTotal,
    jobTotal,
    warranty: {
      starts: w?.starts_at ?? null,
      months: w?.months ?? 12,
      expires: w?.expires_at ?? null,
    },
    progress: draws.length > 0,
    draws: draws.map((d) => ({
      id: d.id, no: d.sequence_no, of: draws.length, label: d.label,
      percent: d.percent, amount: d.amount, isFinal: !!d.is_final,
      // SENT and PAID are DERIVED — they come from each draw's own invoice,
      // never typed into the schedule.
      sent: d.document_id ? db.prepare(`SELECT sent_at FROM documents WHERE id = ?`)
        .get(d.document_id)?.sent_at ?? null : null,
      paid: null,
    })),
    scheduled,
    // ⛔ A billing schedule that does not add up to the work is money you will
    //    never send an invoice for.
    schedulePlh: Math.round((jobTotal - scheduled) * 100) / 100,
    tag,
  };
}

/** Starts + Length. Derived, never typed. */
function warrantyExpiry(starts, months) {
  if (!starts || !months) return null;
  const d = new Date(starts + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function recordInvoice(db, versionId, { sent, paid, amount, warrantyMonths,
                                        drawNo = null, isFinal = true }) {
  const v = invoiceView(db, versionId);
  // ★ Only the final draw IS the invoice. An earlier one records the money
  //   going out and nothing else.
  const theInvoice = !v.progress || isFinal;

  db.transaction(() => {
    if (theInvoice) {
      const ref = v.reference ?? `BPCi-${v.tag}`;
      db.prepare(`
        INSERT INTO documents (id,version_id,doc_type,reference,created_at,sent_at,
                               locked,quoted_price)
        VALUES (?,?,'i',?,?,?,1,?)
        ON CONFLICT(id) DO UPDATE SET sent_at = excluded.sent_at,
                                      quoted_price = excluded.quoted_price`)
        .run(`doc_i_${versionId}`, versionId, ref, sent || null, sent || null,
             amount ?? null);

      // SENDING THE INVOICE STARTS THE WARRANTY CLOCK. That is a real
      // consequence of this dialog, not a detail hidden on another screen.
      const months = warrantyMonths ?? 12;
      db.prepare(`
        INSERT INTO warranties (version_id,starts_at,months,expires_at)
        VALUES (?,?,?,?)
        ON CONFLICT(version_id) DO UPDATE SET
          starts_at = excluded.starts_at, months = excluded.months,
          expires_at = excluded.expires_at`)
        .run(versionId, sent || null, months, warrantyExpiry(sent, months));
    }

    db.prepare(`
      INSERT INTO version_facts (version_id,invoice_sent_at,paid_at)
      VALUES (?,?,?)
      ON CONFLICT(version_id) DO UPDATE SET
        invoice_sent_at = CASE WHEN ? THEN excluded.invoice_sent_at
                               ELSE version_facts.invoice_sent_at END,
        paid_at = excluded.paid_at`)
      .run(versionId, theInvoice ? (sent || null) : null, paid || null,
           theInvoice ? 1 : 0);

    if (drawNo != null) {
      db.prepare(`UPDATE billing_draws SET document_id = ?
                   WHERE version_id = ? AND sequence_no = ?`)
        .run(theInvoice ? `doc_i_${versionId}` : null, versionId, drawNo);
    }
  })();
  return { ok: true };
}

module.exports = { facts, preview, scheduleView, recordSchedule,
                   outstanding, shipmentView, recordShipment,
                   invoiceView, recordInvoice, warrantyExpiry };
