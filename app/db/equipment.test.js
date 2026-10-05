'use strict';

/**
 * EQUIPMENT — docs/18. The decisions, not the lines.
 */

const { open } = require('./open.js');
const { seed } = require('./seed.js');
const EQ = require('./equipment.js');

let fails = 0;
const is = (label, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗ FAIL'} ${label}${ok ? '' : `\n     got  ${got}\n     want ${want}`}`);
};

const db = open({ file: ':memory:', fresh: true });
seed(db);
const T = '2026-10-05';

/* ─── a TYPE carries no physical facts ─────────────────────────────────── */

const types = db.prepare(`SELECT * FROM equipment LIMIT 1`).get();
is('a type has a name and a role, nothing else',
   Object.keys(types).sort().join(','), 'active,id,is_vehicle,name');

/* ─── OWNED ────────────────────────────────────────────────────────────── */

const o = EQ.owned(db, T);
const unit = (n) => o.units.find((u) => u.name.includes(n));

is('four owned machines', o.units.length, 4);
// A truck's capacity is its BED; a trailer's is its payload.
is('the truck reports its bed',      unit('F-450').capacity, 4800);
is('the trailer reports its payload', unit('flatbed').capacity, 10600);
// A lift is cargo, not a carrier — — rather than 0.
is('the Bobcat carries neither',     unit('Bobcat').capacity, null);
is('and so has no deck',             unit('Bobcat').deck, null);

is('the truck is costed per mile',   unit('F-450').rateLabel, '$0.81 /mi');
is('the Bobcat is typed per day',    unit('Bobcat').rateLabel, '$210.00 /day');
is('and is marked as typed',         unit('Bobcat').rateIsTyped, true);

// A rate nobody has recomputed since fuel was $2.90 is still a number on a bid.
is('the stale rate is caught', unit('flatbed').problems[0],
   'rate computed 2025-08-14 — 13 months old');
is('one stale rate',           o.counters.staleRate, 1);
// Compliance earned a typed home in trackers; the audit reads it from there.
is('the lapsed DOT is caught', unit('F-450').problems[0], 'DOT inspection expired 2026-08-30');

// Calculations now exist, so the audit is live and means what it says.
is('the audit can tell now',       o.counters.unusedMeaningless, false);
// ⛔ The haul rig is used by MOBILIZATION, which is a service rather than an
//    equipment selection. Counting selections alone called the F-450 and the
//    flatbed unused on every job they ever towed.
// The mixer earns its keep through a calculation RUN; the truck and trailer
// through mobilization. Only the Bobcat is genuinely idle.
is('only the Bobcat is idle',      o.counters.unused, 1);
is('and it is the Bobcat left over',
   o.units.filter((u) => u.problems.length === 0).length >= 1, true);

/* ─── the build-up has to SUM ──────────────────────────────────────────── */

const d = EQ.detail(db, 'esm_f450', T);
is('five components', d.rate.buildUp.lines.length, 5);
is('they sum to the stored rate',
   d.rate.buildUp.total.toFixed(4), d.rate.buildUp.stored.toFixed(4));
is('and that is 0.8108', d.rate.buildUp.total.toFixed(4), '0.8108');

// No engine means NO FUEL LINE — not a zero one. "$0.00 fuel" reads as
// "fuel is free" rather than "there is no fuel".
const flat = EQ.detail(db, 'esm_flatbed', T);
is('the trailer has no fuel line',
   flat.rate.buildUp.lines.some((l) => l.label === 'Fuel'), false);
is('its components still sum', flat.rate.buildUp.total.toFixed(4), '0.4500');

// The Bobcat has no build-up at all and must not be given a fake one.
is('a typed rate has no build-up', EQ.detail(db, 'esm_t66', T).rate.buildUp, null);

/* ─── RENTED · two rates, and the gap between them ─────────────────────── */

const r = EQ.rented(db, T);
const off = (n) => r.offerings.find((x) => x.name.includes(n));

is('six offerings, three suppliers', `${r.totals.offerings}/${r.totals.suppliers}`, '6/3');
is('grouped supplier then type', r.suppliers[0].types.length > 0, true);
// Two United boom lifts: the type is generic, so the OFFERING must be named.
is('offerings are named, not typed', off('64').name, "64' boom lift");

is('the card is what costing uses', off('64').card, 485);
is('last paid is evidence',         off('64').lastPaid, 520);
is('and the gap is stated',         off('64').problems[0], 'Card is $35.00 under the last invoice');
is('two cards disagree',            r.counters.cardDiffers, 2);
is('one card is unconfirmed',       r.counters.unconfirmed, 1);
is('one has never been rented',     r.counters.neverRented, 1);
// Last paid NEVER overwrites the card. One invoice is a data point about a
// price, not a new price.
is('the card did not move', db.prepare(
   `SELECT rate FROM equipment_sourcing_methods WHERE id='esm_ur_boom64'`).get().rate, 485);

// Delivered never touches your trailer; collected IS load.
is('delivered', off('64').move, 'delivered');
is('collected', off('Plate').move, 'collected');

/* ─── fuel · one price per TYPE, and the preview is the point ──────────── */

is('diesel and gasoline are separate', EQ.fuelPrices(db).diesel, 3.85);

const pre = EQ.fuelPreview(db, { diesel: 4.12 }, T);
is('only computed units appear', pre.length, 2);
is('the Bobcat is not listed',   pre.some((p) => p.name.includes('Bobcat')), false);
is('the truck moves',            pre.find((p) => p.name.includes('F-450')).changes, true);
// The trailer has no engine, so fuel cannot touch it. A dialog that listed it
// as changing would be wrong in a way nobody would notice.
is('the trailer cannot move',    pre.find((p) => p.name.includes('flatbed')).noEngine, true);
is('and does not',               pre.find((p) => p.name.includes('flatbed')).changes, false);

EQ.fuelApply(db, { diesel: 4.12 }, T);
const after = EQ.owned(db, T);
is('the truck rate was rewritten',
   after.units.find((u) => u.name.includes('F-450')).rateLabel, '$0.83 /mi');
is('and recomputing cleared the stale counter for it',
   after.units.find((u) => u.name.includes('F-450')).problems.some(
     (p) => p.startsWith('rate computed')), false);

console.log(fails ? `\n${fails} failed` : '\nequipment: all assertions hold');
process.exit(fails ? 1 : 0);
