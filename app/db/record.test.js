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

console.log(fails ? `\n${fails} failed` : '\nrecord dialogs: all assertions hold');
process.exit(fails ? 1 : 0);
