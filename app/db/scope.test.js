'use strict';

/**
 * COST BREAKDOWN · SCOPE — docs/03a · 03b · 03c · 03j.
 */

const { open } = require('./open.js');
const { seed } = require('./seed.js');
const { costBreakdown } = require('./scope.js');

let fails = 0;
const is = (label, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗ FAIL'} ${label}${ok ? '' : `\n     got  ${got}\n     want ${want}`}`);
};

const db = open({ file: ':memory:', fresh: true });
seed(db);
const d = costBreakdown(db, 'prj_26-10_A0', '2026-10-05');
const all = [...d.scope.groups.flatMap((g) => g.lines), ...d.scope.ungrouped];

is('the document is BPCc-', d.reference, 'BPCc-26-10A0');

/* ─── ⛔ NO MONEY ANYWHERE IN THE BASE SCOPE ────────────────────────────── */

// docs/03a says it three times: if a component row shows a cost, the model has
// been violated. The only money on the tab is the two add-option prices and
// the price ladder.
const moneyFields = all.flatMap((l) => Object.entries(l))
  .filter(([k]) => /price|cost|rate|amount|total/i.test(k));
is('no priced field on any scope row', moneyFields.length, 0);
is('and none on a group header',
   d.scope.groups.some((g) => 'price' in g || 'total' in g), false);

/* ─── a service is GENUINELY BLANK where a component has identity ──────── */

const svc = all.find((l) => l.name === 'Site excavation');
const cmp = all.find((l) => l.name === 'Deck, square 48"');

is('a service has no manufacturer', svc.manufacturer, null);
is('no part number',                svc.partNumber, null);
is('no method',                     svc.method, null);
is('no footing',                    svc.footing, null);
// ⛔ Not a dash and not an empty dropdown — absent.
is('but it does have a category',   svc.category, 'Earthwork');

is('a component carries its maker', cmp.manufacturer, 'Landscape Structures');
is('and its part number',           cmp.partNumber, 'PB-D4848');
is('and its method',                cmp.method, 'DB — Direct bury');
// Direct bury places a footing, so the catalog's spec stands; bolt-on does not.
is('direct bury takes the catalog footing', cmp.footing, '— catalog —');
is('bolt on places none',
   all.find((l) => l.name === 'Slide, 6 ft spiral').footing, '— none —');

/* ─── groups are presentational, one level, and fold completely ────────── */

is('two groups',            d.scope.groups.length, 2);
is('six in the first',      d.scope.groups[0].lines.length, 6);
is('its note is the maker', d.scope.groups[0].note, 'Landscape Structures');
is('the second is collapsed', d.scope.groups[1].collapsed, true);
// A collapsed group still KNOWS its children — it just does not draw them.
// The count on the band comes from here.
is('and still knows its two', d.scope.groups[1].lines.length, 2);
// An ungrouped row is just a row. There is no "Ungrouped" header.
is('two loose rows',        d.scope.ungrouped.length, 2);
is('both are services',     d.scope.ungrouped.every((l) => l.kind === 'service'), true);

/* ─── add options ──────────────────────────────────────────────────────── */

const [footing, locate] = d.scope.addOptions;
is('one attaches to a line', footing.attachesTo, 'line');
// It still reads "line: 24x24x12 Hip Shade" even though that row now lives
// inside the COLLAPSED group — correct and intentional, docs/03c.
is('and names it',           footing.attachedLine, '24x24x12 Hip Shade');
is('the other is job level', locate.attachesTo, 'job');
is('prices are the deltas',  `${footing.price}/${locate.price}`, '1045/1200');
is('and they carry cost too, which the tab never shows',
   footing.cost != null, true);

/* ─── the ladder is the ENGINE's, and the engine has not run ───────────── */

// The ladder has to ADD UP, and that is the whole reason it is a ladder.
is('cost is the assigned objects', d.money.cost.toFixed(2), '12462.07');
is('conditions lift it',           d.money.conditions.toFixed(2), '2482.08');
is('to the adjusted cost',         d.money.adjusted.toFixed(2), '14944.15');
is('contingency is 5% of adjusted', d.money.contingency.toFixed(2), '747.21');
is('markup is 20% of adjusted',     d.money.markup.toFixed(2), '2988.83');
// ⛔ Contingency is added FLAT and is NEVER marked up — so the rungs SUM,
//    they do not compound.
is('and the rungs sum to the price',
   (d.money.adjusted + d.money.contingency + d.money.markup).toFixed(2),
   d.money.price.toFixed(2));
// The percentages are version facts and ARE known, even with no run.
is('contingency is still 5%',    d.money.contingencyPct, 5);
is('markup is still 20%',        d.money.markupPct, 20);
is('a run exists, so no problem', d.problems.length, 0);

/* ─── conditions left the identity strip for the body ──────────────────── */

is('native material is known', d.conditions.nativeMaterial, 'Native soil — hard clay');
is('two conditions',           d.conditions.conditions.length, 2);

console.log(fails ? `\n${fails} failed` : '\nscope: all assertions hold');
process.exit(fails ? 1 : 0);
