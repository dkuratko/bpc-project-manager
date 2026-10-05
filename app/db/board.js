'use strict';

/**
 * The board — every project, its versions, and the status of each.
 *
 * ── Why this is not just SQL from the renderer ──────────────────────────
 * Status is derived, not stored, and the derivation lives in status.js. The
 * renderer has no Node access at all, so it cannot load that module. Rather
 * than duplicate the rules on the far side of the bridge — which is how two
 * copies of a rule start disagreeing — the main process owns the domain and
 * the renderer draws what it is handed.
 *
 * So the bridge has two kinds of call: `all/get/run` for plain reads, and a
 * domain function wherever a derivation is involved. This is the first of
 * those.
 */

const { deriveStatus, rollUp } = require('./status');

const ROWS = `
  SELECT p.id            AS project_id,
         p.number, p.sequence_no, p.title,
         p.city, p.state,
         c.name          AS customer,
         (SELECT ct.name FROM project_contacts pc
            JOIN contacts ct ON ct.id = pc.contact_id
           WHERE pc.project_id = p.id AND pc.role = 'primary'
           ORDER BY pc.sequence_no LIMIT 1) AS contact,
         v.id            AS version_id,
         v.option_letter AS letter,
         v.version_number AS vnum,
         v.name          AS version_name,
         f.approved_at, f.invoice_sent_at, f.paid_at,
         s.install_date, s.started_at, s.completed_at,
         w.expires_at    AS warranty_expires,
         d.sent_at       AS estimate_sent,
         d.created_at    AS estimate_created,
         d.quoted_price, d.computed_price, d.expires_at AS quote_expires,
         (SELECT count(*) FROM shipment_items si
            JOIN shipments sh ON sh.id = si.shipment_id
           WHERE sh.version_id = v.id
             AND si.condition = 'issue'
             AND si.issue_resolved_at IS NULL)        AS open_issues,
         (SELECT count(*) FROM shipments sh
           WHERE sh.version_id = v.id)                AS trucks,
         (SELECT count(*) FROM scope_deltas sd
           WHERE sd.version_id = v.id
             AND sd.kind = 'change_order'
             AND sd.accepted = 0)                     AS pending_cos
  FROM projects p
  LEFT JOIN customers c          ON c.id = p.customer_id
  JOIN versions v                ON v.project_id = p.id
  LEFT JOIN version_facts f      ON f.version_id = v.id
  LEFT JOIN version_schedule s   ON s.version_id = v.id
  LEFT JOIN warranties w         ON w.version_id = v.id
  LEFT JOIN documents d          ON d.version_id = v.id AND d.doc_type = 'e'
  ORDER BY p.sequence_no, v.option_letter, v.version_number`;

function board(db, today = new Date().toISOString().slice(0, 10)) {
  const rows = db.prepare(ROWS).all();
  const projects = new Map();

  for (const r of rows) {
    const status = deriveStatus({
      estimateCreatedAt: r.estimate_created,
      estimateSentAt: r.estimate_sent,
      approvedAt: r.approved_at,
      // Two independent gates — docs/25. Quantities in AND no issue open.
      equipmentComplete: r.trucks > 0 && r.open_issues === 0,
      openIssues: r.open_issues,
      installDate: r.install_date,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      invoiceSentAt: r.invoice_sent_at,
      paidAt: r.paid_at,
      warrantyExpiresAt: r.warranty_expires,
    }, today);

    if (!projects.has(r.project_id)) {
      projects.set(r.project_id, {
        id: r.project_id,
        number: r.number,
        sequence: r.sequence_no,
        title: r.title,
        customer: r.customer,
        contact: r.contact,
        location: r.city ? `${r.city}, ${r.state}` : null,
        versions: [],
      });
    }

    projects.get(r.project_id).versions.push({
      id: r.version_id,
      tag: `${r.number}${r.letter}${r.vnum}`,
      letter: r.letter,
      number: r.vnum,
      name: r.version_name,
      // A version's money is its own. A project has none — docs/07.
      value: r.quoted_price ?? r.computed_price ?? null,
      margin: marginPct(r.quoted_price, r.computed_price),
      status,
      flags: versionFlags(r, status, today),
    });
  }

  for (const p of projects.values()) {
    p.status = rollUp(p.versions.map((v) => v.status));
    p.flags = [...new Set(p.versions.flatMap((v) => v.flags))];
  }

  return [...projects.values()];
}

/** docs/07 · ! blocked or overdue · ⚑ change order · $ quote expiring */
function versionFlags(r, status, today) {
  const flags = [];
  if (status.hasProblem) flags.push('!');
  if (r.pending_cos > 0) flags.push('⚑');
  if (r.quote_expires && !r.approved_at && r.quote_expires >= today) {
    const left = Math.round((new Date(r.quote_expires) - new Date(today)) / 86400000);
    if (left <= 7) flags.push('$');
  }
  return flags;
}

/**
 * Gross margin, as a percentage of price. Null unless BOTH numbers exist —
 * a margin computed against a missing cost is a number that looks right and
 * is not. docs/22: show what is known, never invent.
 */
function marginPct(price, cost) {
  if (price == null || cost == null || price === 0) return null;
  return ((price - cost) / price) * 100;
}

/** The five counter tiles. Each one is also a filter — docs/07. */
function counters(projects, today = new Date().toISOString().slice(0, 10)) {
  const versions = projects.flatMap((p) => p.versions);
  const sum = (list) => list.reduce((t, v) => t + (v.value ?? 0), 0);

  const awaiting = versions.filter((v) => v.status.label === 'SENT, AWAITING');
  const won = versions.filter((v) =>
    ['accepted', 'received', 'scheduled', 'active'].includes(v.status.tier));
  const weekOut = addDays(today, 7);
  const soon = versions.filter((v) =>
    v.status.label === 'SCHEDULED' && v.status.when >= today && v.status.when <= weekOut);
  const unpaid = versions.filter((v) => v.status.tier === 'invoiced');
  const problems = versions.filter((v) => v.status.hasProblem);

  const oldest = awaiting
    .map((v) => v.status.when).filter(Boolean).sort()[0] ?? null;

  return [
    { label: 'Awaiting answer', value: money(sum(awaiting)),
      sub: `${awaiting.length} sent${oldest ? ` · oldest ${oldest}` : ''}` },
    { label: 'Won, in progress', value: money(sum(won)),
      sub: `${won.length} job${won.length === 1 ? '' : 's'}` },
    { label: 'Scheduled this week', value: `${soon.length} job${soon.length === 1 ? '' : 's'}`,
      sub: soon.map((v) => `${v.status.when}${v.status.hasProblem ? ' · ' + v.status.alerts[0] : ''}`).join(' · ') || '—',
      warn: soon.some((v) => v.status.hasProblem) },
    { label: 'Unpaid', value: money(sum(unpaid)),
      sub: `${unpaid.length} invoice${unpaid.length === 1 ? '' : 's'}` },
    { label: 'Problems', value: String(problems.length),
      sub: problems.map((v) => v.status.alerts[0]).join(' · ') || 'none',
      warn: problems.length > 0 },
  ];
}

/** docs/03f · $ and two decimals, always. */
const money = (n) =>
  '$' + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2,
                                                 maximumFractionDigits: 2 });

function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

module.exports = { board, counters, money, marginPct };
