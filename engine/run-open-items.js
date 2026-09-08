// Exercises five more SPEC-02 open items with real code, not just schema:
// partial stock draws, contaminated-spoils splitting, density-per-output-type,
// catalog drift detection, and voiding a rendition.

const { openDb } = require('./db');
const { seed } = require('./seed');
const engine = require('./engine');

const money = (n) => `$${n.toFixed(2)}`;
const qty = (n, u) => `${n.toFixed(2)} ${u}`;

async function main() {
  const db = await openDb({ reset: true });
  seed(db);

  console.log('=== A. PARTIAL STOCK DRAW (2 in stock, 4 needed) ===');
  let runId = engine.startCalculationRun(db, 'ver_A');
  let { project, soil } = engine.expand(db, runId, 'ver_A');
  engine.aggregate(db, runId);
  const cage = engine.priceProcurement(db, runId, 'mat_cage_a', 'proc_cage_stock');
  console.log(`  Required ${qty(cage.requiredQuantity, 'EA')}, split = ${cage.split}`);
  console.log(`    Stock draw:    ${qty(cage.stock.quantity, 'EA')} @ last purchase -> ${money(cage.stock.cost)}`);
  console.log(`    Purchase rest: ${qty(cage.purchase.quantity, 'EA')} @ Valley Rebar  -> ${money(cage.purchase.cost)}`);
  console.log(`    Total: ${money(cage.totalCost)}  (both lines traceable to the same mat_cage_a requirement)`);

  console.log('\n=== B. CONTAMINATED SPOILS SPLIT (30% bid-time allowance) ===');
  db.run(`UPDATE projects SET contamination_status = 'suspected', contamination_split_pct = 0.30 WHERE id = 'proj_26245'`);
  runId = engine.startCalculationRun(db, 'ver_A');
  ({ project, soil } = engine.expand(db, runId, 'ver_A'));
  engine.aggregate(db, runId);
  const outputs = db.all(`SELECT * FROM project_output_totals WHERE calculation_run_id = ?`, [runId]);
  outputs.forEach((o) => console.log(`  ${o.output_material_id} [${o.output_subtype}]  ${qty(o.generated_quantity, o.unit)}`));
  const sum = outputs.reduce((s, o) => s + o.generated_quantity, 0);
  console.log(`  Sums to ${qty(sum, 'CY')} — must equal the undivided total (4 x F-2.5x6 excavation) so nothing is hauled twice or lost.`);

  console.log('\n=== C. DENSITY PER OUTPUT TYPE (debris uses its own density, not soil\'s) ===');
  engine.priceDisposition(db, runId, 'mat_spoils', 'ordinary', 'disp_haul_ton', project, soil);
  const spoilsSel = db.get(`SELECT * FROM project_disposition_selections WHERE calculation_run_id = ? AND output_material_id = 'mat_spoils'`, [runId]);
  console.log(`  Spoils   -> density used ${spoilsSel.density_used_lb_per_cy} lb/CY (falls back to soil: Caliche)`);
  // Fabricate a small debris total directly to show the material-level density path independent of any real demolition scope:
  db.run(`INSERT INTO project_generated_outputs (id,calculation_run_id,source_requirement_instance_id,output_material_id,output_subtype,quantity,unit) VALUES (?,?,?,?,?,?,?)`,
    [require('./db').newId('pgo'), runId, null, 'mat_debris', 'ordinary', 5.0, 'CY']);
  db.run(`INSERT INTO project_output_totals (calculation_run_id, output_material_id, output_subtype, generated_quantity, unit) VALUES (?,?,?,?,?)`,
    [runId, 'mat_debris', 'ordinary', 5.0, 'CY']);
  db.run(`INSERT INTO disposition_methods (id,output_material_id,name,method_type,billing_basis,tipping_rate_per_ton,transport_flat_fee) VALUES
    ('disp_debris_ton','mat_debris','Concrete recycler — per ton','dispose','per_ton',38.00,120.00)`);
  const debrisSel = engine.priceDisposition(db, runId, 'mat_debris', 'ordinary', 'disp_debris_ton', project, soil);
  const debrisRow = db.get(`SELECT * FROM project_disposition_selections WHERE calculation_run_id = ? AND output_material_id = 'mat_debris'`, [runId]);
  console.log(`  Debris   -> density used ${debrisRow.density_used_lb_per_cy} lb/CY (its own catalog value, not Caliche's 3150) -> ${qty(debrisSel.tonnage, 'ton')} -> ${money(debrisSel.disposalCost)}`);

  console.log('\n=== D. CATALOG DRIFT DETECTION ===');
  engine.priceProcurement(db, runId, 'mat_concrete', 'proc_ready_mix');
  engine.priceProcurement(db, runId, 'mat_cage_a', 'proc_cage_valley');
  engine.priceDisposition(db, runId, 'mat_spoils', 'contaminated', 'disp_haul_ton', project, soil);
  engine.calculateCost(db, runId, 'ver_A');
  const rendition = engine.issueRendition(db, 'ver_A', { markupPct: 20.25 });
  console.log(`  ${rendition.reference} issued against today's F-2.5x6 geometry.`);

  let drift = engine.detectCatalogDrift(db, rendition.renditionId);
  console.log(`  Drift check right after issuance: ${drift.length === 0 ? 'none, as expected' : JSON.stringify(drift)}`);

  console.log('  ...an estimator now edits F-2.5x6\'s depth in the catalog (6\' -> 7\'), unrelated to this rendition...');
  db.run(`UPDATE footing_specs SET depth_ft = 7.0 WHERE id = 'spec_f25x6'`);
  drift = engine.detectCatalogDrift(db, rendition.renditionId);
  console.log(`  Drift check after the catalog edit:`);
  drift.forEach((d) => console.log(`    ${d.specId}: ${d.issue}`));
  drift.forEach((d) => console.log(`      as issued: exc ${d.asIssued.excavationCy.toFixed(3)} CY, conc ${d.asIssued.concreteCy.toFixed(3)} CY`));
  drift.forEach((d) => console.log(`      catalog today: exc ${d.catalogToday.excavationCy.toFixed(3)} CY, conc ${d.catalogToday.concreteCy.toFixed(3)} CY`));
  console.log(`  ${rendition.reference}'s own numbers are unaffected — this only flags that a reviewer should notice the mismatch.`);

  console.log('\n=== E. VOIDING A RENDITION ===');
  engine.voidRendition(db, rendition.renditionId, 'Sent to the wrong customer — Sunset Park was meant for a different bid package.');
  const voided = db.get(`SELECT * FROM estimate_renditions WHERE id = ?`, [rendition.renditionId]);
  console.log(`  ${voided.reference} status = '${voided.status}', reason: "${voided.void_reason}"`);
  console.log(`  Row still exists (voided_at ${voided.voided_at}) — it's a status, never a delete.`);

  db.save();
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
