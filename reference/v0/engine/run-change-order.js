// Proves the lock + change-order lifecycle: issue A0 on the bid-time default
// footing (F-2.5x6), lock it, correct it via CO1 to the engineered spec
// (F-3x9), approve, then prove A0's frozen lines never moved while a second
// correction (CO2) sequences correctly against CO1's result, not A0's.

const { openDb } = require('./db');
const { seed } = require('./seed');
const engine = require('./engine');

const money = (n) => `$${n.toFixed(2)}`;

async function issueBaseline(db) {
  const runId = engine.startCalculationRun(db, 'ver_A');
  const { project, soil } = engine.expand(db, runId, 'ver_A');
  engine.aggregate(db, runId);
  engine.priceProcurement(db, runId, 'mat_concrete', 'proc_ready_mix');
  engine.priceProcurement(db, runId, 'mat_cage_a', 'proc_cage_valley');
  engine.priceDisposition(db, runId, 'mat_spoils', 'ordinary', 'disp_haul_load', project, soil);
  engine.calculateCost(db, runId, 'ver_A');
  return engine.issueRendition(db, 'ver_A', { markupPct: 20.25, issuedBy: 'JB', sentTo: 'City of Gilbert' });
}

async function main() {
  const db = await openDb({ reset: true });
  seed(db);

  console.log('=== ISSUE BPCe 26-245A0 (bid-time default: F-2.5x6) ===');
  const rendition = await issueBaseline(db);
  console.log(`${rendition.reference} issued — total cost ${money(rendition.totalCost)}, contract value ${money(rendition.contractValue)}\n`);

  console.log('=== ATTEMPT A DIRECT SCOPE EDIT (should be refused — locked) ===');
  try {
    engine.assertDraft(db, 'ver_A');
    console.log('  (unexpected: edit was allowed)');
  } catch (e) {
    console.log(`  Refused, as it should be: "${e.message}"`);
  }

  console.log('\n=== CO1 — engineering confirms F-3x9 (post-PO correction) ===');
  const co1 = engine.createChangeOrder(db, rendition.renditionId, {
    reason: 'Owner-directed change',
    reference: 'City eng. letter 09/02/26',
    markupPct: 28.0,
    overrides: { pci1: { footingSpecOverrideId: 'spec_f3x9' } },
  });
  console.log(`${co1.coNumber} drafted — ${co1.lineCount} line(s) moved, cost delta ${money(co1.costDelta)}, price delta ${money(co1.priceDelta)}`);
  db.all(`SELECT * FROM change_order_lines WHERE change_order_id = ?`, [co1.id]).forEach((l) =>
    console.log(`  ${l.target_type.padEnd(14)} ${l.target_id.padEnd(14)} ${l.old_value}  ->  ${l.new_value}   (${money(l.cost_delta)})`)
  );

  engine.submitChangeOrder(db, co1.id);
  engine.approveChangeOrder(db, co1.id, { approvedBy: 'D. Kuratko' });
  console.log(`${co1.coNumber} approved.`);

  console.log('\n=== PROOF: A0 as issued never changed ===');
  const a0Lines = db.all(`SELECT cost_type, description, extended_cost FROM estimate_rendition_lines WHERE rendition_id = ? ORDER BY cost_type`, [rendition.renditionId]);
  const a0Total = a0Lines.reduce((s, l) => s + l.extended_cost, 0);
  console.log(`  estimate_rendition_lines for ${rendition.reference} still total ${money(a0Total)} (must equal the original ${money(rendition.totalCost)})`);
  console.log(`  Match: ${Math.abs(a0Total - rendition.totalCost) < 0.01 ? 'YES — immutable as designed' : 'NO — BUG'}`);

  let contracted = engine.getCurrentContractedValue(db, rendition.renditionId);
  console.log(`  Current contracted value: as issued ${money(contracted.asIssued)} + approved COs ${money(contracted.approvedChangeOrders)} = ${money(contracted.current)}`);

  console.log('\n=== CO2 — a further RFI deepens the footing again (F-3x9 -> F-3x10) ===');
  const co2 = engine.createChangeOrder(db, rendition.renditionId, {
    reason: 'Utility conflict RFI',
    reference: 'RFI-014',
    markupPct: 28.0,
    overrides: { pci1: { footingSpecOverrideId: 'spec_f3x10' } },
  });
  console.log(`${co2.coNumber} drafted — cost delta ${money(co2.costDelta)}, price delta ${money(co2.priceDelta)}`);
  console.log('  Sequencing check — CO2\'s "as issued" column should read CO1\'s F-3x9 numbers, not A0\'s F-2.5x6 numbers:');
  db.all(`SELECT * FROM change_order_lines WHERE change_order_id = ?`, [co2.id]).forEach((l) => {
    const chained = l.derived_from_co_line_id ? ' [chained to CO1 line]' : ' [new target, no prior CO]';
    console.log(`  ${l.target_type.padEnd(14)} ${l.target_id.padEnd(14)} ${l.old_value}  ->  ${l.new_value}   (${money(l.cost_delta)})${chained}`);
  });

  engine.submitChangeOrder(db, co2.id);
  engine.approveChangeOrder(db, co2.id, { approvedBy: 'D. Kuratko' });

  contracted = engine.getCurrentContractedValue(db, rendition.renditionId);
  console.log(`\n  Current contracted value after CO1 + CO2: ${money(contracted.current)}  (as issued ${money(contracted.asIssued)} + COs ${money(contracted.approvedChangeOrders)})`);

  console.log('\n=== Current contracted scope (what the crew actually builds) ===');
  console.table(engine.getCurrentContractedScope(db, rendition.renditionId));

  console.log('=== REOPEN INSTEAD, FOR COMPARISON ===');
  engine.reopenAsNewRendition(db, 'ver_A');
  const versionAfterReopen = db.get(`SELECT * FROM estimate_versions WHERE id = 'ver_A'`);
  console.log(`  Version A status is now '${versionAfterReopen.status}'; next issueRendition() will produce ${co1.coNumber.split(' ')[0].replace('BPCr', 'BPCe')}... A${versionAfterReopen.current_rendition_number}`);

  db.save();
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
