// Proves the vertical slice end-to-end: expand -> aggregate -> procurement ->
// disposition -> cost -> issue rendition, against the seeded 20x20x12 Hip
// Shade / F-3x9 / Rebar Cage A (premade) / Caliche soil example.

const { openDb } = require('./db');
const { seed } = require('./seed');
const engine = require('./engine');

const money = (n) => `$${n.toFixed(2)}`;
const qty = (n, u) => `${n.toFixed(2)} ${u}`;

async function main() {
  const db = await openDb({ reset: true });
  seed(db);

  console.log('\n=== 1. EXPANSION ===');
  const runId = engine.startCalculationRun(db, 'ver_A');
  const { project, soil } = engine.expand(db, runId, 'ver_A');
  console.log(`Project ${project.project_number} · soil = ${soil.name} (swell ${soil.swell_factor}, density ${soil.density_lb_per_cy} lb/CY, dig factor ${soil.dig_factor})`);

  const instances = db.all(`SELECT requirement_type, catalog_ref_id, quantity, unit, binding_key FROM project_requirement_instances WHERE calculation_run_id = ?`, [runId]);
  console.table(instances);

  console.log('\n=== 2. AGGREGATION ===');
  engine.aggregate(db, runId);
  const materialTotals = db.all(`SELECT * FROM project_material_totals WHERE calculation_run_id = ?`, [runId]);
  const outputTotals = db.all(`SELECT * FROM project_output_totals WHERE calculation_run_id = ?`, [runId]);
  console.log('Material requirements:');
  materialTotals.forEach((m) => console.log(`  ${m.material_id.padEnd(14)} ${qty(m.required_quantity, m.unit)}`));
  console.log('Generated outputs (in place, before swell):');
  outputTotals.forEach((o) => console.log(`  ${o.output_material_id} [${o.output_subtype}]  ${qty(o.generated_quantity, o.unit)}`));

  console.log('\n=== 3. PROCUREMENT (pooled) ===');
  const concrete = engine.priceProcurement(db, runId, 'mat_concrete', 'proc_ready_mix');
  console.log(`Concrete — required ${qty(concrete.requiredQuantity, 'CY')} -> purchased ${qty(concrete.purchased, 'CY')} @ Ready Mix -> ${money(concrete.totalCost)}`);
  const cage = engine.priceProcurement(db, runId, 'mat_cage_a', 'proc_cage_valley');
  console.log(`Rebar Cage A (premade, EA) — required ${qty(cage.requiredQuantity, 'EA')} -> purchased ${qty(cage.purchased, 'EA')} @ Valley Rebar -> ${money(cage.totalCost)}`);

  console.log('\n=== 4. DISPOSITION (both billing bases, per-load selected) ===');
  const perLoad = engine.priceDisposition(db, runId, 'mat_spoils', 'ordinary', 'disp_haul_load', project, soil);
  console.log(`Spoils — in place ${qty(perLoad.generatedQuantity, 'CY')} -> loose ${qty(perLoad.looseQuantity, 'CY')} -> ${perLoad.estimatedLoads} loads -> ${money(perLoad.disposalCost)}  [per_load, SELECTED]`);
  // Prove the per-ton path computes independently without double-selecting it for cost:
  const dryRunTon = (() => {
    const density = soil.density_lb_per_cy;
    const tonnage = (perLoad.looseQuantity * density) / 2000;
    const method = db.get(`SELECT * FROM disposition_methods WHERE id = 'disp_haul_ton'`);
    return { tonnage, cost: tonnage * method.tipping_rate_per_ton + method.transport_flat_fee };
  })();
  console.log(`  (per_ton alternative, not selected: ${qty(dryRunTon.tonnage, 'ton')} -> ${money(dryRunTon.cost)})`);

  console.log('\n=== 5. COST ===');
  const { lines, totals } = engine.calculateCost(db, runId, 'ver_A');
  lines.forEach((l) => console.log(`  ${l.cost_type.padEnd(12)} ${l.description.padEnd(30)} ${money(l.extended_cost)}`));
  console.log('  ' + '-'.repeat(56));
  Object.entries(totals).filter(([k]) => k !== 'total').forEach(([k, v]) => console.log(`  ${k.padEnd(12)} subtotal ${money(v)}`));
  console.log(`  TOTAL COST  ${money(totals.total)}`);

  console.log('\n=== 6. ISSUE RENDITION ===');
  const rendition = engine.issueRendition(db, 'ver_A', { markupPct: 20.25, issuedBy: 'JB', sentTo: 'City of Gilbert' });
  console.log(`${rendition.reference}  issued`);
  console.log(`  Total cost:     ${money(rendition.totalCost)}`);
  console.log(`  Markup:         20.25%`);
  console.log(`  Contract value: ${money(rendition.contractValue)}`);

  const version = db.get(`SELECT * FROM estimate_versions WHERE id = 'ver_A'`);
  console.log(`\nVersion A status is now '${version.status}' — scope is locked; next edit needs "reopen as new rendition" or a change order.`);

  db.save();
  console.log(`\nSaved to ${require('./db').DB_PATH}`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
