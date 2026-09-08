// Proves two genuinely different, unrelated components pool correctly: the
// Hip Shade (premade cages, F-2.5x6) and six Playground Posts (F-2x5, a real
// field-fabricated rebar takeoff) sit in the same version and must aggregate
// concrete/spoils/labor into ONE project total, priced ONCE.

const { openDb } = require('./db');
const { seed, addPlaygroundPosts } = require('./seed');
const engine = require('./engine');

const money = (n) => `$${n.toFixed(2)}`;
const qty = (n, u) => `${n.toFixed(3)} ${u}`;

async function main() {
  const db = await openDb({ reset: true });
  seed(db);
  addPlaygroundPosts(db);

  console.log('=== SCOPE — two unrelated components, one version ===');
  console.table(db.all(`SELECT pc.id, c.name, pc.quantity FROM project_components pc JOIN components c ON c.id = pc.component_id WHERE pc.version_id = 'ver_A'`));

  const runId = engine.startCalculationRun(db, 'ver_A');
  const { project, soil } = engine.expand(db, runId, 'ver_A');
  engine.aggregate(db, runId);

  console.log('\n=== AGGREGATED MATERIAL TOTALS (both components pooled) ===');
  db.all(`SELECT * FROM project_material_totals WHERE calculation_run_id = ?`, [runId]).forEach((m) =>
    console.log(`  ${m.material_id.padEnd(14)} ${qty(m.required_quantity, m.unit)}`)
  );
  console.log('  Expect mat_concrete ≈ 7.454 CY (shade 4.203 + 6 posts × 0.542), mat_rebar_4 ≈ 48.096 lb (field-fabricated, posts only), mat_cage_a = 4 EA (shade only)');

  console.log('\n=== FIELD-FABRICATED TAKEOFF CHECK (post rebar, never touched by the premade path) ===');
  const rebarReq = db.get(`SELECT * FROM project_material_totals WHERE calculation_run_id = ? AND material_id = 'mat_rebar_4'`, [runId]);
  console.log(`  3 x #4 x 4.0ft x 6 posts x 0.668 lb/ft = ${(3 * 4.0 * 6 * 0.668).toFixed(3)} lb  ->  engine says ${rebarReq.required_quantity.toFixed(3)} lb`);

  console.log('\n=== POOLED LABOR/EQUIPMENT (summed across both components\' services) ===');
  const labor = db.all(
    `SELECT inst.catalog_ref_id AS service_id, SUM(lr.hours) AS hours
     FROM project_labor_requirements lr JOIN project_requirement_instances inst ON inst.id = lr.source_requirement_instance_id
     WHERE lr.calculation_run_id = ? GROUP BY inst.catalog_ref_id`, [runId]
  );
  labor.forEach((l) => console.log(`  ${l.service_id.padEnd(16)} ${l.hours.toFixed(3)} labor hr (shade's 1.15 complexity + posts' 1.0, both folded in)`));

  console.log('\n=== PROCUREMENT — priced ONCE against the pooled total ===');
  const concrete = engine.priceProcurement(db, runId, 'mat_concrete', 'proc_ready_mix');
  console.log(`  Concrete: required ${qty(concrete.requiredQuantity, 'CY')} -> purchased ${qty(concrete.purchased, 'CY')} -> ${money(concrete.totalCost)}`);
  const rebar = engine.priceProcurement(db, runId, 'mat_rebar_4', 'proc_rebar4');
  console.log(`  #4 Rebar: required ${qty(rebar.requiredQuantity, 'LB')} -> purchased ${qty(rebar.purchased, 'LB')} -> ${money(rebar.totalCost)}`);
  const cage = engine.priceProcurement(db, runId, 'mat_cage_a', 'proc_cage_valley');
  console.log(`  Rebar Cage A: ${qty(cage.purchased, 'EA')} -> ${money(cage.totalCost)}  (posts contribute zero — they don't use cages)`);

  engine.priceDisposition(db, runId, 'mat_spoils', 'ordinary', 'disp_haul_load', project, soil);

  console.log('\n=== COST ===');
  const { totals } = engine.calculateCost(db, runId, 'ver_A');
  Object.entries(totals).forEach(([k, v]) => console.log(`  ${k.padEnd(12)} ${money(v)}`));

  const rendition = engine.issueRendition(db, 'ver_A', { markupPct: 20.25 });
  console.log(`\n${rendition.reference} issued — total cost ${money(rendition.totalCost)}, contract value ${money(rendition.contractValue)}`);

  db.save();
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
