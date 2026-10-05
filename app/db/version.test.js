'use strict';

/**
 * VERSION VIEW — the hub's data contract.
 *
 * Each assertion is a decision from the walkthrough, not a line of coverage.
 * The seed's 26-09 is the signature case: green, scheduled, and carrying a
 * shipment issue — so it exercises the lip, the ⚠ progress mark and the rule
 * that a problem displaces the ordinary next step, all at once.
 */

const { open } = require('./open.js');
const { seed } = require('./seed.js');
const { versionDetail } = require('./version.js');

let fails = 0;
function is(label, got, want) {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗ FAIL'} ${label}${ok ? '' : `\n        got  ${got}\n        want ${want}`}`);
}

const db = open({ file: ':memory:', fresh: true });
seed(db);
const TODAY = '2026-09-15';
// There is no options table — an option holds nothing, so the letter lives
// on the version. docs/13.
const byTag = (tag) => db.prepare(
  `SELECT v.id FROM versions v JOIN projects p ON p.id = v.project_id
    WHERE p.number || v.option_letter || v.version_number = ?`).get(tag)?.id;

/* ─── 26-09A0 · scheduled, with an open shipment issue ─────────────────── */

const d = versionDetail(db, byTag('26-09A0'), TODAY);

is('status is SCHEDULED',            d.status.label, 'SCHEDULED');
is('the green that means scheduled', d.status.colour, '#8ECF8E');
is('the issue earns a lip',          d.status.hasProblem, true);

// A problem always displaces the ordinary next step. The next thing to do
// here is not "start the job" — it is "chase the missing sail".
is('next is the problem',            d.next.problem, true);
is('next names the item',            /Shade sail/.test(d.next.text), true);

const mark = (label) => d.progress.find((r) => r.label === label);
is('accepted is done',               mark('Accepted').mark, 'done');
is('received is reached but open',   mark('Equipment received').mark, 'warn');
// Two incompletenesses read differently: a truck that never came is
// "1 of 2 shipments"; a truck that came with something wrong on it is an
// issue. "1 of 1 shipment" would have looked like nothing was outstanding.
is('aside counts issues, not trucks', mark('Equipment received').aside, '1 issue open');
is('scheduled is current',           mark('Scheduled').mark, 'current');
is('active is still ahead',          mark('Active').future, true);

// Exactly one estimate per version — the invariant the whole model rests on.
const est = d.documents.filter((r) => r.type === 'e');
is('one estimate, no more',          est.length, 1);
is('and it is accepted',             est[0].state, 'accepted 2026-08-19');
is('cost breakdown not started',     d.documents.find((r) => r.type === 'c').missing, true);

is('approved equals quoted',         d.money.approved, d.money.quoted);
is('nothing invoiced yet',           d.money.outstanding, 0);
is('margin is the seeded 28.9',      d.money.margin.toFixed(1), '28.9');

/* ─── a version with no documents at all · nothing may be blank ────────── */

const bare = versionDetail(db, byTag('26-12A0'), TODAY) ?? null;
if (bare) {
  const silent = bare.documents.filter((r) => !r.state);
  is('every document row says something', silent.length, 0);
  is('margin is null without a cost',
     bare.money.cost == null ? bare.money.margin : null, null);
}

console.log(fails ? `\n${fails} failed` : '\nversion view: all assertions hold');
process.exit(fails ? 1 : 0);
