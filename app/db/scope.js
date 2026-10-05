'use strict';

/**
 * COST BREAKDOWN · tab 1 — SCOPE. docs/03a + 03b + 03c.
 *
 * What the job IS, before anything is priced.
 *
 * ⛔ NO MONEY ANYWHERE IN THE BASE SCOPE. Components, footings and services
 *    carry no price here — not on a row, not on a group header. The only
 *    money on the tab is the two add-option prices and the price ladder.
 *    docs/03a says it three times; if a component row shows a cost, the model
 *    has been violated.
 *
 * ⛔ A SERVICE ROW IS GENUINELY BLANK where a component has identity. No
 *    dashes, no empty dropdowns — manufacturer, part number, method and
 *    footing are absent on a service, because a service has none of them.
 */

function scope(db, versionId) {
  const rows = db.prepare(`
    SELECT o.*, c.name AS component_name, c.manufacturer, c.part_number,
           c.type AS component_type,
           s.name AS service_name, s.category AS service_category,
           s.default_unit,
           im.code AS method_code, im.name AS method_name,
           f.name AS footing_override
      FROM cost_objects o
      LEFT JOIN components c            ON c.id = o.component_id
      LEFT JOIN services s              ON s.id = o.service_id
      LEFT JOIN installation_methods im ON im.id = o.installation_method_id
      LEFT JOIN footing_specs f         ON f.id = o.footing_override_id
     WHERE o.version_id = ?
     ORDER BY o.sequence_no`).all(versionId);

  const groups = db.prepare(`
    SELECT * FROM scope_groups WHERE version_id = ? ORDER BY sequence_no`)
    .all(versionId);

  const deltas = db.prepare(`
    SELECT * FROM scope_deltas
     WHERE version_id = ? AND kind = 'add_option' ORDER BY sequence_no`)
    .all(versionId);

  const line = (o) => {
    const isComponent = o.kind === 'scope_row';
    return {
      id: o.id,
      kind: isComponent ? 'component' : 'service',
      // The icon is the type. A filled navy square is a component, a hollow
      // grey one a service — drawn as squares, never as the letters C and S.
      name: isComponent ? o.component_name : o.service_name,
      manufacturer: isComponent ? o.manufacturer : null,
      partNumber: isComponent ? o.part_number : null,
      category: isComponent ? o.component_type : o.service_category,
      method: isComponent && o.method_code
        ? `${o.method_code} — ${o.method_name}` : null,
      // "— catalog —" means the method's own footing stands. "— none —" means
      // the method does not place one. An override names a spec instead.
      footing: !isComponent ? null
        : o.footing_override ? o.footing_override
        : o.method_code === 'DB' ? '— catalog —'
        : '— none —',
      qty: o.quantity,
      unit: o.unit ?? o.default_unit,
      groupId: o.group_id,
      deltaId: o.delta_id,
    };
  };

  const base = rows.filter((o) => !o.delta_id).map(line);

  // Groups are PURELY PRESENTATIONAL — created by hand on every version,
  // carrying no data, changing nothing about how anything is priced. Folders
  // in a list. One level only; they do not nest.
  const grouped = groups.map((g) => ({
    id: g.id, name: g.name, note: g.note,
    collapsed: !!g.collapsed,
    lines: base.filter((l) => l.groupId === g.id),
  }));

  // An ungrouped row is just a row. There is no "Ungrouped" header.
  const ungrouped = base.filter((l) => !l.groupId);

  return {
    groups: grouped,
    ungrouped,
    // Interleaved in sequence, which is how the tab draws it: groups and
    // loose rows mixed in whatever order they sit.
    order: [
      ...grouped.map((g) => ({ type: 'group', ...g })),
      ...ungrouped.map((l) => ({ type: 'line', ...l })),
    ],
    addOptions: deltas.map((d) => ({
      id: d.id, name: d.name,
      // 'line' attaches to one estimate line; 'job' sits at job level.
      attachesTo: d.attaches_to,
      attachedLine: d.estimate_line_id
        ? base.find((l) => l.id === d.estimate_line_id)?.name ?? null : null,
      price: d.price_delta,
      cost: d.cost_delta,
      accepted: !!d.accepted,
      lines: rows.filter((o) => o.delta_id === d.id).map(line),
    })),
    counts: { base: base.length, groups: grouped.length },
  };
}

/**
 * Site conditions. They moved OUT of the identity strip and into the Scope
 * tab's body, because they are scope facts rather than identity — docs/03j.
 */
function conditions(db, versionId) {
  const p = db.prepare(`
    SELECT p.id, m.name AS native_material
      FROM versions v JOIN projects p ON p.id = v.project_id
      LEFT JOIN materials m ON m.id = p.native_material_id
     WHERE v.id = ?`).get(versionId);
  if (!p) return null;
  return {
    nativeMaterial: p.native_material,
    conditions: db.prepare(`
      SELECT name, multiplier, affects_equipment FROM project_conditions
       WHERE project_id = ? ORDER BY sequence_no`).all(p.id),
  };
}


/**
 * Everything the Cost Breakdown window needs, in one call.
 *
 * The PRICE LADDER is the engine's output. With no calculation run every rung
 * is null, and the screen renders [?] — docs/22: unknown AND IT MATTERS. A
 * zero would read as "this job costs nothing", which is a different claim.
 */
function costBreakdown(db, versionId, today) {
  const { deriveStatus } = require('./status.js');
  const v = db.prepare(`
    SELECT v.*, p.number AS project_number, p.title AS project_title,
           p.city, p.state, c.name AS customer,
           (SELECT ct.name FROM project_contacts pc
              JOIN contacts ct ON ct.id = pc.contact_id
             WHERE pc.project_id = p.id AND pc.role = 'primary' LIMIT 1) AS contact
      FROM versions v
      JOIN projects p ON p.id = v.project_id
      LEFT JOIN customers c ON c.id = p.customer_id
     WHERE v.id = ?`).get(versionId);
  if (!v) return null;

  const tag = `${v.project_number}${v.option_letter}${v.version_number}`;
  const doc = db.prepare(
    `SELECT * FROM documents WHERE version_id = ? AND doc_type = 'c'`).get(versionId);

  const facts = db.prepare(`SELECT * FROM version_facts WHERE version_id = ?`)
    .get(versionId) ?? {};
  const sched = db.prepare(`SELECT * FROM version_schedule WHERE version_id = ?`)
    .get(versionId) ?? {};
  const est = db.prepare(
    `SELECT * FROM documents WHERE version_id = ? AND doc_type = 'e'`).get(versionId);

  const status = deriveStatus({
    estimateSentAt: est?.sent_at ?? null,
    approvedAt: facts.approved_at ?? null,
    installDate: sched.install_date ?? null,
    startedAt: sched.started_at ?? null,
    completedAt: sched.completed_at ?? null,
    invoiceSentAt: facts.invoice_sent_at ?? null,
    paidAt: facts.paid_at ?? null,
    shipments: [], warrantyExpiresAt: null,
  }, today);

  const s = scope(db, versionId);

  /* ── problems · completeness gates, not a workflow ──────────────────────
     A gate asks "is this answerable yet", never "has someone signed off". */
  const problems = [];
  // A gap belongs to a RUN, not to a version — it is what one calculation
  // could not answer, which is why it disappears when the answer is supplied
  // and the job is recalculated.
  const run = db.prepare(`
    SELECT * FROM calculation_runs
     WHERE version_id = ? AND purpose = 'base' AND status = 'complete'
     ORDER BY run_number DESC LIMIT 1`).get(versionId);

  if (!run) problems.push('no calculation has run');
  else for (const g of db.prepare(
    `SELECT message FROM calculation_gaps WHERE run_id = ?`).all(run.id)) {
    problems.push(g.message);
  }

  return {
    versionId, tag,
    reference: doc?.reference ?? `BPCc-${tag}`,
    created: doc?.created_at ?? null,
    locked: doc?.locked ? doc.created_at : null,
    changedAt: doc?.created_at ?? null,
    changedBy: null,
    identity: {
      customer: v.customer, contact: v.contact,
      projectNumber: v.project_number, projectTitle: v.project_title,
      site: [v.city, v.state].filter(Boolean).join(' '),
      version: `Option ${v.option_letter} · version ${v.version_number}`,
    },
    status,
    scope: s,
    conditions: conditions(db, versionId),
    // Every rung is the engine's. Without a run they are all null and the
    // screen renders [?] — a zero would read as "this job costs nothing".
    money: ladder(run, v),
    problems,
  };
}

function ladder(run, v) {
  const pct = { contingencyPct: v.contingency_pct ?? null,
                markupPct: v.markup_pct ?? null };
  if (!run) return { cost: null, conditions: null, adjusted: null,
                     contingency: null, markup: null, price: null, ...pct };

  const cost = run.total_cost, adjusted = run.adjusted_cost;
  const contingency = adjusted * (v.contingency_pct ?? 0) / 100;
  const markup = adjusted * (v.markup_pct ?? 0) / 100;
  return {
    cost,
    conditions: adjusted != null && cost != null ? adjusted - cost : null,
    adjusted,
    // Contingency is added FLAT and is NEVER marked up — schema §versions.
    contingency, markup,
    price: run.computed_price,
    ...pct,
  };
}

module.exports = { scope, conditions, costBreakdown };
