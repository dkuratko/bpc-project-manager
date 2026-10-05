'use strict';

/**
 * ESTIMATE EDITOR — docs/05f (v10 body) · 05g (chrome) · 05h (box grammar).
 *
 * The document the customer sees.
 *
 * ⛔ COST APPEARS ONLY INSIDE A ROW EXPANSION. Never in the document body,
 *    never on the printed estimate. The REF column is editor-only and does
 *    not print either.
 * ⛔ SUB-ITEMS ARE INCLUSIVE AND PARTIAL — they break down a total that
 *    already contains them, and they do NOT have to sum to it. They carry no
 *    amount of their own.
 * ⛔ OPTIONS ARE EXCLUDED FROM THE TOTAL. The headline says so in as many
 *    words: "BASE SCOPE, OPTIONS EXCLUDED".
 */

/**
 * Every priced row gets a reference, and that is what made cost objects
 * assignable to sub-items and options rather than only to lines:
 *
 *   01      line
 *   01.1    sub-item of line 01
 *   02.O1   option 1 on line 02
 *   J.O1    job-level option
 */
function reference(line, parentRef, index) {
  if (line.section === 'job_add_option') return `J.O${index + 1}`;
  if (line.line_number != null) return String(line.line_number).padStart(2, '0');
  return `${parentRef}.${index + 1}`;
}

function estimateDoc(db, versionId, today) {
  const doc = db.prepare(`
    SELECT * FROM documents WHERE version_id = ? AND doc_type = 'e'`).get(versionId);
  if (!doc) return null;

  const rows = db.prepare(`
    SELECT * FROM document_lines WHERE document_id = ? ORDER BY sequence_no`)
    .all(doc.id);

  const objects = db.prepare(`
    SELECT o.*, c.name AS component_name, s.name AS service_name,
           co.quantity, co.unit, co.delta_id
      FROM document_line_objects o
      JOIN cost_objects co  ON co.id = o.cost_object_id
      LEFT JOIN components c ON c.id = co.component_id
      LEFT JOIN services s   ON s.id = co.service_id
     WHERE o.document_id = ?
     ORDER BY co.sequence_no`).all(doc.id);   // scope order, not alphabetical

  const notes = db.prepare(
    `SELECT * FROM document_notes WHERE document_id = ? ORDER BY sequence_no`)
    .all(doc.id);

  const build = (parentId, parentRef) => rows
    .filter((r) => r.parent_id === parentId && r.section === 'scope')
    .map((r, i) => {
      // A child carrying a delta is a LINE-SPECIFIC add option — 02.O1 — and
      // it renders as ↳ (Optional). It is excluded from the total exactly as
      // a job-level option is; only the attachment differs.
      const isOption = r.delta_id != null && parentId != null;
      const ref = isOption ? `${parentRef}.O1` : reference(r, parentRef, i);
      const kids = build(r.id, ref);
      const own = objects.filter((o) => o.document_line_id === r.id);
      // A line's cost is everything assigned to it OR to anything beneath it.
      const cost = own.reduce((t, o) => t + (o.allocated_cost ?? 0), 0)
                 + kids.filter((k) => !k.isOption)
                       .reduce((t, k) => t + (k.cost ?? 0), 0);
      // ⛔ A line with NOTHING assigned has an UNKNOWN cost, not a zero one.
      //    Mobilization reading "margin 100.0%" would say it is pure profit;
      //    what it actually means is that nobody has assigned its cost yet.
      //    docs/05f: expanded, such a row reads "— no cost objects —".
      const hasCost = own.length > 0 || kids.some((k) => k.hasCost && !k.isOption);
      return {
        id: r.id, ref, number: r.line_number,
        label: r.label, designNo: r.design_no,
        qty: r.quantity, unit: r.unit,
        unitPrice: r.unit_price, amount: r.amount,
        isSubItem: parentId != null && !isOption,
        isOption,
        children: kids,
        objects: own.map((o) => ({
          id: o.cost_object_id,
          name: o.component_name ?? o.service_name,
          qty: o.quantity, unit: o.unit, cost: o.allocated_cost,
        })),
        // Read-only, grey, and the ONE place cost shows.
        hasCost,
        cost: hasCost ? cost : null,
        margin: hasCost && r.amount ? (r.amount - cost) / r.amount * 100 : null,
        notes: notes.filter((n) => n.line_id === r.id),
      };
    });

  const lines = build(null, null);
  // ⛔ OPTIONS ARE EXCLUDED FROM THE TOTAL — only top-level scope lines count.
  //    The headline says so: "BASE SCOPE, OPTIONS EXCLUDED".
  const subtotal = lines.reduce((t, l) => t + (l.amount ?? 0), 0);

  const addOns = rows.filter((r) => r.section === 'job_add_option').map((r, i) => ({
    id: r.id, ref: `J.O${i + 1}`, label: r.label, amount: r.amount,
    deltaId: r.delta_id,
    // Ticked when the PO comes back naming it. NOT a UI toggle for you.
    accepted: !!db.prepare(`SELECT accepted FROM scope_deltas WHERE id = ?`)
      .get(r.delta_id)?.accepted,
  }));

  /* ── the price bar · COMPUTED against QUOTED ─────────────────────────── */
  const computed = doc.computed_price;
  const quoted = doc.quoted_price;
  const markupPct = db.prepare(`SELECT markup_pct FROM versions WHERE id = ?`)
    .get(versionId)?.markup_pct ?? 0;
  // The base the markup was applied to. Backing it out of the computed price
  // is the only way to say what the QUOTED price marks up by.
  // Contingency rides on the same adjusted base and is NOT marked up, so it
  // has to come out of the divisor too — otherwise the effective markup is
  // overstated by the contingency.
  const contingencyPct = db.prepare(
    `SELECT contingency_pct FROM versions WHERE id = ?`).get(versionId)?.contingency_pct ?? 0;
  const markedUpBase = computed != null && (markupPct || contingencyPct)
    ? computed / (1 + markupPct / 100 + contingencyPct / 100) : null;

  return {
    versionId,
    documentId: doc.id,
    reference: doc.reference,
    created: doc.created_at, sent: doc.sent_at, expires: doc.expires_at,
    locked: !!doc.locked,
    lines, addOns,
    costObjects: objects,
    totals: {
      subtotal,
      // Tax is "Included" — a string, not a number, because that is what the
      // document says.
      tax: 'Included',
      total: subtotal,
    },
    price: {
      computed, quoted, markupPct,
      delta: computed != null && quoted != null ? quoted - computed : null,
      effectiveMarkupPct: markedUpBase && quoted != null
        ? (quoted - markedUpBase) / markedUpBase * 100 : null,
    },
    // Base scope and options are counted SEPARATELY — two footers, because
    // option cost is not part of the base total any more than option price is
    // part of the estimate total. Hard-coding a line id here was the bug:
    // option objects are identified by their delta, not by which row they
    // happen to sit on.
    assigned: {
      of: db.prepare(`SELECT COUNT(*) c FROM cost_objects
                       WHERE version_id = ? AND delta_id IS NULL`).get(versionId).c,
      done: objects.filter((o) => o.delta_id == null).length,
    },
    notes: notes.filter((n) => !n.line_id),
  };
}

module.exports = { estimateDoc, reference };
