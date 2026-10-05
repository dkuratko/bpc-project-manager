'use strict';

/**
 * One version, in full — what the VERSION VIEW draws. docs/09, final v3.
 *
 * Like board.js this lives in the main process because status is derived and
 * the renderer has no Node access. Everything here is read; the toolbar's
 * four popups are what write.
 */

const { deriveStatus } = require('./status');

/** docs/09 · the lifecycle from Accepted onward. The spine of the screen. */
const PROGRESS = [
  'Accepted', 'Awaiting delivery', 'Equipment received', 'Scheduled',
  'Active', 'Invoice sent', 'Completed, paid', 'Warranty', 'Completed',
];

function versionDetail(db, versionId, today = new Date().toISOString().slice(0, 10)) {
  const v = db.prepare(`
    SELECT v.id, v.option_letter AS letter, v.version_number AS vnum,
           v.name, v.note, v.markup_pct, v.contingency_pct,
           p.id AS project_id, p.number AS project_number, p.title AS project_title,
           p.address, p.city, p.state, p.distance_mi, p.drive_time_min,
           c.name AS customer,
           (SELECT ct.name FROM project_contacts pc
              JOIN contacts ct ON ct.id = pc.contact_id
             WHERE pc.project_id = p.id AND pc.role = 'primary'
             ORDER BY pc.sequence_no LIMIT 1) AS contact,
           f.approved_at, f.invoice_sent_at, f.paid_at,
           s.install_date, s.started_at, s.completed_at, s.buffer_days,
           w.starts_at AS warranty_starts, w.months AS warranty_months,
           w.expires_at AS warranty_expires
    FROM versions v
    JOIN projects p            ON p.id = v.project_id
    LEFT JOIN customers c      ON c.id = p.customer_id
    LEFT JOIN version_facts f  ON f.version_id = v.id
    LEFT JOIN version_schedule s ON s.version_id = v.id
    LEFT JOIN warranties w     ON w.version_id = v.id
    WHERE v.id = ?`).get(versionId);

  if (!v) return null;

  const docs = db.prepare(`
    SELECT doc_type, reference, revision_no, created_at, sent_at, locked,
           expires_at, quoted_price, computed_price
    FROM documents WHERE version_id = ?
    ORDER BY created_at, doc_type`).all(versionId);

  const shipments = db.prepare(`
    SELECT id, sequence_no, expected_ship_date, received_at, destination, truck_log_ref
    FROM shipments WHERE version_id = ? ORDER BY sequence_no`).all(versionId);

  for (const sh of shipments) {
    sh.items = db.prepare(`
      SELECT description, quantity_received, condition, issue_text
      FROM shipment_items WHERE shipment_id = ? ORDER BY id`).all(sh.id);
  }

  const openIssues = shipments
    .flatMap((s) => s.items)
    .filter((i) => i.condition === 'issue').length;

  const approval = db.prepare(`
    SELECT method, reference, received_at, po_amount
    FROM approvals WHERE version_id = ? ORDER BY received_at DESC LIMIT 1`).get(versionId);

  const estimate = docs.find((d) => d.doc_type === 'e');

  const status = deriveStatus({
    estimateCreatedAt: estimate?.created_at,
    estimateSentAt: estimate?.sent_at,
    approvedAt: v.approved_at,
    equipmentComplete: shipments.length > 0 && openIssues === 0,
    openIssues,
    installDate: v.install_date,
    startedAt: v.started_at,
    completedAt: v.completed_at,
    invoiceSentAt: v.invoice_sent_at,
    paidAt: v.paid_at,
    warrantyExpiresAt: v.warranty_expires,
  }, today);

  return {
    id: v.id,
    tag: `${v.project_number}${v.letter}${v.vnum}`,
    name: v.name,
    note: v.note,
    identity: {
      customer: v.customer,
      contact: v.contact,
      site: [v.address, v.city && `${v.city} ${v.state}`].filter(Boolean).join(', ') || null,
      project: `${v.project_number} ${v.project_title}`,
      version: `Option ${v.letter} · version ${v.vnum}`,
    },
    status,
    progress: progress(v, status, shipments, openIssues, approval),
    shipments: shipments.map((sh) => ({
      number: sh.sequence_no,
      expected: sh.expected_ship_date,
      received: sh.received_at,
      destination: sh.destination,
      log: sh.truck_log_ref,
      items: sh.items,
      issues: sh.items.filter((i) => i.condition === 'issue').length,
    })),
    documents: documentRows(docs, v),
    money: money(docs, v, approval),
    schedule: {
      install: v.install_date,
      buffer: v.buffer_days,
      started: v.started_at,
      completed: v.completed_at,
      distance: v.distance_mi,
      driveTime: v.drive_time_min,
      // Warranty folds in here as three rows — docs/09, it does not earn a box.
      warrantyStarts: v.warranty_starts,
      warrantyMonths: v.warranty_months ?? 12,
      warrantyExpires: v.warranty_expires,
    },
    next: next(v, status, shipments, today),
    locked: estimate?.locked ? estimate.sent_at : null,
  };
}

/**
 * The lifecycle rows. docs/09:
 *   ✓ done · ⚠ reached but incomplete · ● current · future in #909090
 */
function progress(v, status, shipments, openIssues, approval) {
  const reached = {
    'Accepted': v.approved_at,
    'Awaiting delivery': v.approved_at,
    'Equipment received': shipments.length && !openIssues ? lastReceived(shipments) : null,
    'Scheduled': v.install_date,
    'Active': v.started_at,
    'Invoice sent': v.invoice_sent_at,
    'Completed, paid': v.paid_at,
    'Warranty': v.paid_at ? v.warranty_starts : null,
    'Completed': v.warranty_expires && v.paid_at ? v.warranty_expires : null,
  };

  const current = {
    accepted: v.install_date ? 'Scheduled' : 'Awaiting delivery',
    received: 'Equipment received',
    scheduled: 'Scheduled',
    active: 'Active',
    invoiced: 'Invoice sent',
    closed: v.warranty_expires && v.warranty_expires > todayish() ? 'Warranty' : 'Completed',
    quoting: null,
  }[status.tier];

  return PROGRESS.map((label) => {
    const when = reached[label] ?? null;
    const isCurrent = label === current;
    // Reached but incomplete: the row the lip is about. docs/09 shows
    // "Equipment received — 1 of 2 shipments" at ⚠.
    const incomplete = label === 'Equipment received'
      && shipments.length > 0 && openIssues > 0;

    let mark = '';
    if (incomplete) mark = 'warn';
    else if (isCurrent) mark = 'current';
    else if (when) mark = 'done';

    let aside = null;
    if (label === 'Accepted' && approval?.reference) aside = `PO ${approval.reference}`;
    if (incomplete) {
      // Two different incompletenesses, and they read differently. A truck
      // that has not arrived is "1 of 2 shipments"; a truck that arrived with
      // something wrong on it is an issue, not a missing shipment — saying
      // "1 of 1 shipment" there would look like nothing was outstanding.
      const waiting = shipments.filter((s) => !s.received_at).length;
      aside = waiting > 0
        ? `${shipments.length - waiting} of ${shipments.length} shipments`
        : `${openIssues} issue${openIssues === 1 ? '' : 's'} open`;
    }

    return { label, when: incomplete ? null : when, mark, aside,
             future: !when && !isCurrent && !incomplete };
  });
}

const lastReceived = (ships) =>
  ships.map((s) => s.received_at).filter(Boolean).sort().pop() ?? null;

const todayish = () => new Date().toISOString().slice(0, 10);

/**
 * docs/09 · a document row with no document is NOT blank. It names the type
 * in grey and says what state it is in, so you can see what has not happened.
 */
function documentRows(docs, v) {
  const TYPES = [
    ['c',  'Cost breakdown'],
    ['e',  'Estimate'],
    ['co', 'Change orders'],
    ['i',  'Invoice'],
    ['pc', 'Post cost'],
  ];
  const EMPTY = { c: 'not started', e: 'not created', co: 'none',
                  i: 'not raised', pc: 'not started' };

  return TYPES.map(([type, what]) => {
    const d = docs.find((x) => x.doc_type === type);
    if (!d) return { type, what, missing: true, state: EMPTY[type] };

    let state = d.locked ? 'locked' : 'open';
    if (type === 'e') {
      if (v.approved_at) state = `accepted ${v.approved_at}`;
      else if (d.sent_at) state = 'sent, awaiting';
      else state = 'not sent';
    }
    if (type === 'i' && v.paid_at) state = `paid ${v.paid_at}`;

    return { type, reference: d.reference + (d.revision_no ? ` REV${d.revision_no}` : ''),
             what, created: d.created_at, sent: d.sent_at, state, missing: false };
  });
}

/** docs/09 · the money ladder. Cost in #606060 — internal, never on paper. */
function money(docs, v, approval) {
  const est = docs.find((d) => d.doc_type === 'e');
  const quoted = est?.quoted_price ?? null;
  const cost = est?.computed_price ?? null;
  const approved = v.approved_at ? (approval?.po_amount ?? quoted) : null;
  const changeOrders = 0;
  const revised = approved == null ? null : approved + changeOrders;
  const invoiced = v.invoice_sent_at ? revised : 0;
  const paid = v.paid_at ? invoiced : 0;

  return {
    quoted, approved, approvalRef: approval?.reference ?? null,
    changeOrders, revised, invoiced, paid,
    outstanding: (invoiced ?? 0) - (paid ?? 0),
    cost,
    margin: quoted != null && cost != null && quoted !== 0
      ? ((quoted - cost) / quoted) * 100 : null,
  };
}

/**
 * ★ The derived `Next`. docs/09 calls it the single most useful line on the
 * screen: what has to happen for this job to move. Never typed.
 *
 * A problem always displaces the ordinary next step — docs/10.
 */
function next(v, status, shipments, today) {
  if (status.hasProblem) {
    const outstanding = shipments
      .flatMap((s) => s.items)
      .find((i) => i.condition === 'issue');
    if (outstanding) {
      return { text: `receive ${outstanding.description}`,
               detail: outstanding.issue_text, problem: true };
    }
    return { text: status.alerts[0], problem: true };
  }

  switch (status.label) {
    case 'QUOTING':            return { text: 'Build the cost breakdown' };
    case 'ESTIMATE CREATED':   return { text: 'Send the estimate' };
    case 'SENT, AWAITING':     return { text: `Awaiting answer — sent ${status.when}, ${daysBetween(status.when, today)} days` };
    case 'AWAITING DELIVERY':  return { text: 'Waiting on equipment' };
    case 'EQUIPMENT RECEIVED': return { text: 'Set an install date' };
    case 'SCHEDULED':          return { text: `Install ${status.when}` };
    case 'ACTIVE':             return { text: 'Raise the invoice when work is complete' };
    case 'INVOICE SENT, PAYMENT REQUIRED':
      return { text: `Awaiting payment — ${daysBetween(v.invoice_sent_at, today)} days` };
    case 'WARRANTY':           return { text: `Under warranty to ${v.warranty_expires}` };
    case 'COMPLETED':          return { text: '—' };
    default:                   return { text: '—' };
  }
}

const daysBetween = (a, b) =>
  Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));

module.exports = { versionDetail, PROGRESS };
