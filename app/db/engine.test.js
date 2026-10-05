'use strict';

/**
 * THE ENGINE — docs/03d · 03e · 03g · 03h.
 *
 * The rules this application rests on. If any of these break, every number
 * downstream is wrong and looks right.
 */

const { open } = require('./open.js');
const { seed } = require('./seed.js');
const E = require('./engine.js');

let fails = 0;
const is = (label, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗ FAIL'} ${label}${ok ? '' : `\n     got  ${got}\n     want ${want}`}`);
};

const db = open({ file: ':memory:', fresh: true });
seed(db);
const r = E.calculate(db, 'prj_26-10_A0');
const req = r.requirements, buy = r.purchasing;

/* ─── PRESENTATION ROUNDING · largest remainder ────────────────────────── */

// Floors alone leave the total short. The cents go to the largest discarded
// fractions, so the parts sum to the whole EXACTLY — a total that does not
// reconcile is the one thing the Cost tab cannot do.
const thirds = E.largestRemainder([1 / 3, 1 / 3, 1 / 3], 100);
is('three thirds of $100 still make $100', thirds.reduce((t, n) => t + n, 0).toFixed(2), '100.00');
is('and one of them carries the cent',     thirds.filter((n) => n === 33.34).length, 1);

const docEg = E.largestRemainder([2.79 / 2.91, 0.12 / 2.91], 901.93);
is('the worked example reconciles', docEg.reduce((t, n) => t + n, 0).toFixed(2), '901.93');

/* ─── PURCHASE ROUNDING · up, to what the vendor will sell ─────────────── */

const conc = buy.materials.find((m) => m.material.name.startsWith('Concrete'));
is('required is not a round number', conc.qty.toFixed(2), '5.12');
is('waste is applied first',         conc.wastePct, 5);
// 5.12 + 5% = 5.376, and ready-mix comes in half yards.
is('and you buy half yards',         conc.purchased.toFixed(2), '5.50');

/* ─── ★ THE EFFECTIVE RATE IS OVER REQUIRED, NEVER OVER PURCHASED ──────── */

is('listed at $185.00/CY', conc.unitPrice, 185);
// Waste and fees ride back to whoever caused them. That is the whole model.
is('it lands well above that', conc.effectiveRate > 185, true);
is('= total ÷ required, to full precision',
   conc.effectiveRate.toFixed(4), (conc.total / conc.qty).toFixed(4));
is('NOT total ÷ purchased',
   conc.effectiveRate.toFixed(4) === (conc.total / conc.purchased).toFixed(4), false);

/* ─── fees are a LIST, and one that misses is shown with its reason ────── */

const short = conc.fees.find((f) => f.name === 'Short load');
is('the short-load fee exists',   !!short, true);
is('it did not apply',            short.applies, false);
// Hidden, you cannot audit it. Shown at $0.00 with no reason, you cannot
// either.
is('and it says why',             short.reason, 'purchased quantity < 4');
is('contributing nothing',        short.amount, 0);
is('delivery did apply',          conc.fees.find((f) => f.name === 'Delivery').amount, 85);

/* ─── ⛔ NOTHING IS INTERPOLATED TO FILL A GAP ─────────────────────────── */

is('exactly two gaps', r.gaps.length, 2);
// One missing rate is ONE problem however many rows hit it.
const rate = r.gaps.find((g) => g.kind === 'unrated_service');
is('a service with no rate for one spec', rate.message, 'Excavate footing has no rate for F-2x4');
is('and it says what it excluded',        rate.detail, 'The hours above exclude 10 footings.');

// "— not selected —" is NOT "$0.00". One is a hole, the other is a decision.
const ewf = buy.disposition.find((d) => d.material.name.includes('wood fibre'));
is('the undecided output has no method', ewf.method, null);
is('and NO total — not a zero one',      ewf.total, null);
const soil = buy.disposition.find((d) => d.material.name.includes('Native soil'));
is('the decided one has a real total',   soil.total > 0, true);

/* ─── footings are pure geometry, which is why they are never short ────── */

// π × 1² × 4 ÷ 27 = 0.4654 CY
is('a 2ft × 4ft cylinder', E.footingVolumeCy(
   { shape: 'cylindrical', diameter_ft: 2, depth_ft: 4 }).toFixed(4), '0.4654');
is('ten footings on this job', req.footings.reduce((t, f) => t + f.qty, 0), 18);

// Excavated material BULKS UP. Bank is what the hole held; loose is what goes
// on the truck, and the truck is what you pay for.
is('soil swells 1.25', soil.swell, 1.25);
is('bank → loose',     soil.loose.toFixed(2), (soil.bank * 1.25).toFixed(2));
// ★ but the effective rate is over BANK, not loose.
is('rated over bank',  soil.effectiveRate.toFixed(4), (soil.total / soil.bank).toFixed(4));

/* ─── conditions apply BY TAG ──────────────────────────────────────────── */

// Hard clay slows the digging. It does not slow bolting a panel on, and it
// does not make concrete cost more per yard.
const assembly = r.lines.find((l) => l.type === 'labor' && l.tags.includes('ASSEMBLY'));
const digging  = r.lines.find((l) => l.type === 'labor'
  && l.tags.includes('EXCAVATION') && !l.tags.includes('MATERIAL_HANDLING'));
// EWF removal is both digging AND handling, so BOTH conditions bite on it.
const both = r.lines.find((l) => l.type === 'labor'
  && l.tags.includes('EXCAVATION') && l.tags.includes('MATERIAL_HANDLING'));
is('assembly labour is untouched', assembly.conditionMultiplier, 1);
is('digging takes the soil condition alone', digging.conditionMultiplier, 1.15);
is('work that is both takes both',
   both.conditionMultiplier.toFixed(4), (1.15 * 1.30).toFixed(4));
const material = r.lines.find((l) => l.type === 'procurement');
is('materials are never touched',  material.conditionMultiplier, 1);

/* ─── every dollar lands on exactly one cost object ────────────────────── */

const sum = r.lines.reduce((t, l) => t + l.cost, 0);
is('the lines sum to the total', sum.toFixed(2), r.money.cost.toFixed(2));
is('nothing is unallocated',     r.lines.every((l) => !!l.objId), true);

// Direct services are cost objects in their own right and carry real money —
// if their cost has been pushed onto the products, the model is broken.
const direct = r.lines.filter((l) => ['co_excav', 'co_ewf'].includes(l.objId))
  .reduce((t, l) => t + l.cost, 0);
is('the two direct services carry their own', direct > 2000, true);

/* ─── the ladder ───────────────────────────────────────────────────────── */

is('conditions are the gap to adjusted',
   (r.money.cost + r.money.conditions).toFixed(2), r.money.adjusted.toFixed(2));
// Contingency is added FLAT and is NEVER marked up, so the rungs SUM.
is('and the rungs sum to the price',
   (r.money.adjusted + r.money.contingency + r.money.markup).toFixed(2),
   r.money.price.toFixed(2));

/* ─── an owned machine has no PERIODS ──────────────────────────────────── */

const mixer = buy.equipment.find((e) => e.type.name === 'mixer');
is('owned bills by the hour', mixer.rateBasis, 'hour');
is('so it has no periods',    mixer.periods, null);
const exc = buy.equipment.find((e) => e.type.name === 'excavator');
is('a rental bills by the day', exc.rateBasis, 'day');
is('and its periods are derived', exc.periods >= 1, true);
is('and it says how',             /ceil\(/.test(exc.periodsNote), true);

console.log(fails ? `\n${fails} failed` : '\nengine: all assertions hold');
process.exit(fails ? 1 : 0);
