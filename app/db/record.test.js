'use strict';

/**
 * THE RECORD DIALOGS — docs/24 so far.
 *
 * These are the only place status changes, so what is pinned here is that
 * recording a fact moves the DERIVED status, and that nothing blocks.
 */

const { open } = require('./open.js');
const { seed } = require('./seed.js');
const R = require('./record.js');

let fails = 0;
const is = (label, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗ FAIL'} ${label}${ok ? '' : `\n     got  ${got}\n     want ${want}`}`);
};

const db = open({ file: ':memory:', fresh: true });
seed(db);
const TODAY = '2026-10-05';
const V = 'prj_26-11_A0';          // approved, nothing delivered

/* ─── the preview is computed, not described ───────────────────────────── */

is('it starts awaiting delivery',
   R.preview(db, V, {}, TODAY).label, 'AWAITING DELIVERY');
// ⛔ Awaiting delivery with nothing delivered is just awaiting delivery. It
//    is not a problem, and flagging it would lip half the board.
is('and that is not a problem', R.preview(db, V, {}, TODAY).hasProblem, false);

/* ─── ★ the signature case ─────────────────────────────────────────────── */

const scheduled = R.preview(db, V, { installDate: '2026-11-02' }, TODAY);
is('an install date makes it SCHEDULED', scheduled.label, 'SCHEDULED');
// GREEN WITH A RED LIP. A red row would mean FINISHED; the job's real phase
// is scheduled, and the lip says something about it is wrong.
is('and it is the ramp green',           scheduled.colour, '#8ECF8E');
is('carrying the alert this app exists to raise',
   scheduled.alerts[0], 'no equipment received');
is('which is a problem, not a phase',    scheduled.hasProblem, true);

/* ─── ⛔ NOTHING BLOCKS ────────────────────────────────────────────────── */

// The customer set that date. An app that refused it would simply be lied to.
R.recordSchedule(db, V, { install: '2026-11-02', buffer: 1 });
is('the date was recorded anyway', R.scheduleView(db, V).install, '2026-11-02');
is('and the status followed',      R.preview(db, V, {}, TODAY).label, 'SCHEDULED');

/* ─── a living record · every field stays editable ─────────────────────── */

// Correcting a fact is the entire mechanism by which a derived status gets
// fixed, so re-recording has to work — including clearing a date.
R.recordSchedule(db, V, { install: '2026-11-09', buffer: 1 });
is('the date can be corrected', R.scheduleView(db, V).install, '2026-11-09');
R.recordSchedule(db, V, { install: null, buffer: 0 });
is('and cleared entirely',      R.scheduleView(db, V).install, null);
is('which puts the status back', R.preview(db, V, {}, TODAY).label, 'AWAITING DELIVERY');

/* ─── ⛔ Completed does NOT complete the job ───────────────────────────── */

R.recordSchedule(db, V, { install: '2026-11-02', started: '2026-11-02',
                          completed: '2026-11-04', buffer: 0 });
// The crew is off site. The job stays ACTIVE until the invoice goes out,
// because completion IS the invoice — there is no "completed, payment
// required" state, and this is the one removed status that keeps trying to
// reassert itself.
is('off site, and still ACTIVE', R.preview(db, V, {}, TODAY).label, 'ACTIVE');

/* ─── Record shipment · docs/25 ────────────────────────────────────────── */

const S = 'prj_26-10_A0';          // has eight scope rows and no shipments yet
const v0 = R.shipmentView(db, S);

// ⛔ Outstanding ONLY. Listing what has already arrived would make a second
//    truck a re-run of the first.
is('every line is outstanding at first', v0.lines.length, 8);
is('and this is truck 1',                v0.sequenceNo, 1);

// ★ Quantity is a FACT, condition is a JUDGMENT, and they are independent.
R.recordShipment(db, S, {
  sequenceNo: 1, receivedAt: '2026-09-10', destination: 'lot',
  lines: v0.lines.map((l) => ({ ...l,
    // the posts come up short, and the deck arrives damaged
    qty: l.name.startsWith('Post') ? 4 : l.owed,
    condition: l.name.startsWith('Deck') ? 'issue' : 'approved',
    issueText: l.name.startsWith('Deck') ? 'two decks scratched in transit' : null })),
});

const o1 = R.outstanding(db, S);
is('the short line is still owed', o1.lines.find((l) => l.name.startsWith('Post')).outstanding, 2);
is('the rest arrived',             o1.lines.find((l) => l.name.startsWith('Slide')).outstanding, 0);
// 4 of 6 · Approved is PARTIAL AND FINE. Only an issue says it is wrong.
is('a partial delivery is not an issue by itself', o1.openIssues.length, 1);
is('and the issue is the one described', o1.openIssues[0].text,
   'two decks scratched in transit');

// ★ EQUIPMENT RECEIVED needs BOTH gates.
is('not complete — quantities short AND an issue open', o1.complete, false);

const v1 = R.shipmentView(db, S);
is('truck 2 lists only what is left', v1.lines.length, 2);
is('and it is truck 2',               v1.sequenceNo, 2);

// ⛔ A problem nobody described is a problem nobody can chase.
const refused = R.recordShipment(db, S, {
  sequenceNo: 2, receivedAt: '2026-09-14',
  lines: [{ objectId: 'co_post', name: 'Post', qty: 2, condition: 'issue', issueText: '' }],
});
is('an issue with no description is refused', /needs a description/.test(refused.error), true);

// The rest of the posts arrive.
R.recordShipment(db, S, { sequenceNo: 2, receivedAt: '2026-09-14',
  lines: [{ objectId: 'co_post', name: 'Post, 5" × 12\'', qty: 2, condition: 'approved' }] });
const o2 = R.outstanding(db, S);
is('quantities now clear', o2.totalOutstanding, 0);
// ...but the deck issue is still open, and that alone holds it back.
is('still not received, because the issue is open', o2.complete, false);

// ★ RESOLVING AN ISSUE IS SWITCHING IT TO APPROVED. No second dialog —
//   reopen the truck it came on and correct the fact.
const truck1 = db.prepare(
  `SELECT id FROM shipments WHERE version_id = ? AND sequence_no = 1`).get(S).id;
const reopened = R.shipmentView(db, S, truck1);
R.recordShipment(db, S, {
  shipmentId: truck1, sequenceNo: 1, receivedAt: '2026-09-10',
  lines: reopened.lines.map((l) => ({ ...l, qty: l.onThisTruck, condition: 'approved' })),
});
const o3 = R.outstanding(db, S);
is('the issue closed',  o3.openIssues.length, 0);
is('and NOW it is received equipment', o3.complete, true);

/* ─── Invoice · docs/26 ────────────────────────────────────────────────── */

const I = 'prj_26-08_A0';          // ACTIVE, crew off site, not invoiced
is('it is active before invoicing', R.preview(db, I, {}, TODAY).label, 'ACTIVE');

// ★ SENDING THE INVOICE STARTS THE WARRANTY CLOCK.
R.recordInvoice(db, I, { sent: '2026-09-25', warrantyMonths: 12 });
const iv = R.invoiceView(db, I);
is('the reference was assigned on save', iv.reference, 'BPCi-26-08A0');
is('and the warranty started',           iv.warranty.starts, '2026-09-25');
// Expires is DERIVED — Starts + Length — never typed.
is('expiring a year later',              iv.warranty.expires, '2027-09-25');
is('status becomes invoice sent',
   R.preview(db, I, {}, TODAY).label, 'INVOICE SENT, PAYMENT REQUIRED');

// ★ "becomes", twice — the only record dialog where both moments move it.
R.recordInvoice(db, I, { sent: '2026-09-25', paid: '2026-10-02', warrantyMonths: 12 });
// ⛔ NOT "COMPLETED, PAID". The warranty clock starts when the invoice is
//    SENT, so a job is always inside its warranty by the time it is paid —
//    which is why that status can never occur and the list is wrong, not the
//    derivation. docs/26 flags it; this pins what actually happens.
is('paid, and in warranty', R.preview(db, I, {}, TODAY).label, 'WARRANTY');

/* ─── ★ A DRAW IS NOT THE INVOICE ──────────────────────────────────────── */

const D = 'prj_26-09_A0';
db.prepare(`INSERT INTO billing_draws (id,version_id,sequence_no,label,percent,amount,is_final)
            VALUES (?,?,?,?,?,?,?)`).run('bd_1', D, 1, 'Deposit', 30, 12981, 0);
db.prepare(`INSERT INTO billing_draws (id,version_id,sequence_no,label,percent,amount,is_final)
            VALUES (?,?,?,?,?,?,?)`).run('bd_2', D, 2, 'Progress', 40, 17308, 0);
db.prepare(`INSERT INTO billing_draws (id,version_id,sequence_no,label,percent,amount,is_final)
            VALUES (?,?,?,?,?,?,?)`).run('bd_3', D, 3, 'Final', 30, 12981, 1);

const dv = R.invoiceView(db, D);
is('three draws', dv.draws.length, 3);
is('they sum to the job', dv.schedulePlh, 0);
is('and only one is final', dv.draws.filter((x) => x.isFinal).length, 1);

const was = R.preview(db, D, {}, TODAY).label;
// A deposit goes out before anyone turns up. If it started the warranty you
// would be covering a job you have not built.
R.recordInvoice(db, D, { sent: '2026-08-14', amount: 12981, drawNo: 1, isFinal: false });
is('a non-final draw holds the status', R.preview(db, D, {}, TODAY).label, was);
is('and starts no warranty clock',
   db.prepare(`SELECT starts_at FROM warranties WHERE version_id = ?`).get(D)?.starts_at ?? null,
   null);

// Draw 3 of 3 IS the invoice.
R.recordInvoice(db, D, { sent: '2026-11-20', amount: 12981, drawNo: 3, isFinal: true,
                         warrantyMonths: 12 });
is('the final draw moves it',
   R.preview(db, D, {}, TODAY).label, 'INVOICE SENT, PAYMENT REQUIRED');
is('and starts the clock',
   db.prepare(`SELECT starts_at FROM warranties WHERE version_id = ?`).get(D).starts_at,
   '2026-11-20');

console.log(fails ? `\n${fails} failed` : '\nrecord dialogs: all assertions hold');
process.exit(fails ? 1 : 0);
