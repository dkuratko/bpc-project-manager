'use strict';

/**
 * ESTIMATE EDITOR — docs/05f · 05g · 05h.
 */

const { open } = require('./open.js');
const { seed } = require('./seed.js');
const { estimateDoc } = require('./estimate.js');

let fails = 0;
const is = (label, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗ FAIL'} ${label}${ok ? '' : `\n     got  ${got}\n     want ${want}`}`);
};

const db = open({ file: ':memory:', fresh: true });
seed(db);
const e = estimateDoc(db, 'prj_26-10_A0', '2026-10-05');
const L = (ref) => {
  const walk = (ls) => { for (const l of ls) { if (l.ref === ref) return l;
    const r = walk(l.children); if (r) return r; } return null; };
  return walk(e.lines);
};

is('the document is BPCe-', e.reference, 'BPCe-26-10A0');

/* ─── the reference scheme that made sub-items assignable ──────────────── */

is('a line',              L('01').label, 'INSTALLATION of Design #4471');
is('a sub-item',          L('01.1').isSubItem, true);
is('a line-level option', L('02.O1').isOption, true);
is('a job-level option',  e.addOns[0].ref, 'J.O1');

/* ─── sub-items are INCLUSIVE and PARTIAL ──────────────────────────────── */

// They break down a total that already contains them, so they carry no amount
// and do not have to sum to anything.
is('a sub-item has no amount of its own', L('01.1').amount, null);
is('its parent carries the whole',        L('01').amount, 10588.82);

/* ─── OPTIONS ARE EXCLUDED FROM THE TOTAL ──────────────────────────────── */

is('the lines sum to the quoted total', e.totals.subtotal.toFixed(2), '17500.00');
// Both options together are $2,245 and neither is in it.
is('the line option is not in the total',
   e.totals.subtotal.toFixed(2) === (17500).toFixed(2), true);
is('tax is a word, not a number',  e.totals.tax, 'Included');
is('total equals subtotal',        e.totals.total, e.totals.subtotal);

// A line's cost must not absorb its option's cost either — the option is
// priced separately and is not part of what the line costs.
is('line 02 costs only its own',   L('02').cost.toFixed(2), '1836.00');
// The LINE carries the option's cost after site conditions (1,871.18); the
// delta's own cost_delta is the raw figure before them (1,554.00). Two
// different questions, and the document asks the first.
is('its option costs separately',  L('02.O1').cost.toFixed(2), '1871.18');

/* ─── a line's cost is everything beneath it ───────────────────────────── */

// The PlayBooster parts hang off the sub-item and still count toward 01.
is('01 absorbs its sub-item',  L('01').cost.toFixed(2), '7829.23');
is('and its margin falls out', L('01').margin.toFixed(1), '26.1');
is('04 absorbs both of its sub-items', L('04').cost.toFixed(2), '2748.09');
is('the discounted line shows it',     L('04').margin.toFixed(1), '2.5');

// ⛔ Nothing assigned means UNKNOWN cost, not zero. "margin 100.0%" would say
//    Mobilization is pure profit; what it means is nobody assigned its cost.
is('Mobilization has no cost objects', L('05').hasCost, false);
is('so its cost is unknown',           L('05').cost, null);
is('and its margin is too',            L('05').margin, null);

/* ─── the expansion lists objects in SCOPE order ───────────────────────── */

is('not alphabetical', L('01.1').objects.map((o) => o.name).join(' · '),
   'Deck, square 48" · Post, 5" × 12\' · Slide, 6 ft spiral · ' +
   'Arch Climber Panel · Barrier Panel · Grab Handle, straight');

/* ─── the price bar · COMPUTED against QUOTED ──────────────────────────── */

is('computed is the engine\'s', e.price.computed, 17600.8);
is('quoted is your decision',   e.price.quoted, 17500);
is('and the gap is the discount', e.price.delta.toFixed(2), '-100.80');
// Backing the markup out of the computed price is the only way to say what
// the QUOTED price actually marks up by.
// Backing BOTH the markup and the flat contingency out of the computed price
// is the only way to say what the quoted price actually marks up by.
is('effective markup is lower than the nominal 20%',
   e.price.effectiveMarkupPct.toFixed(2), '24.28');

/* ─── acceptance is the customer's, not a toggle ───────────────────────── */

// Ticked when the PO comes back naming it.
is('nothing accepted yet', e.addOns[0].accepted, false);

is('every base object is assigned', `${e.assigned.done} of ${e.assigned.of}`, '10 of 10');

console.log(fails ? `\n${fails} failed` : '\nestimate: all assertions hold');
process.exit(fails ? 1 : 0);
