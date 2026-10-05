'use strict';

/** TRACKERS — docs/27. */

const { open } = require('./open.js');
const { seed } = require('./seed.js');
const T = require('./trackers.js');

let fails = 0;
const is = (label, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗ FAIL'} ${label}${ok ? '' : `\n     got  ${got}\n     want ${want}`}`);
};

const db = open({ file: ':memory:', fresh: true });
seed(db);
const TODAY = '2026-09-13';
const L = T.trackerList(db, TODAY, { showEquipment: true });
const it = (n) => L.items.find((i) => i.name.includes(n));

/* ─── one table, two owners ────────────────────────────────────────────── */

is('company obligations and machine paperwork in one list',
   L.items.some((i) => i.ownerType === 'company') &&
   L.items.some((i) => i.ownerType === 'equipment'), true);
// On one list "Registration" alone does not say whose.
is('a machine item names its machine', it('Registration').name,
   '2012 Ford F-450 · Registration');
// Equipment gets its OWN band so the default view is not cluttered.
is('equipment is its own band', L.groups.at(-1).key, 'equipment');
is('and it is hidden by default',
   T.trackerList(db, TODAY).items.some((i) => i.ownerType === 'equipment'), false);

/* ─── ★ TWO THRESHOLDS, PER ITEM ───────────────────────────────────────── */

// 14 Nov 2026 is 62 days out. Notice 120, due 60 — so it is inside notice
// but not yet due.
is('general liability is 62 days out', it('General liability').days, 62);
is('and sits in the notice band',      it('General liability').band, 'notice');

// The SAME 62 days under the registration's own thresholds (45/21) would be
// plain ok. That is the entire argument for per-item numbers.
is('the truck registration has tighter thresholds',
   `${it('Registration').noticeDays}/${it('Registration').dueDays}`, '45/21');
is('the ROC licence has looser ones',
   `${it('ROC contractor').noticeDays}/${it('ROC contractor').dueDays}`, '180/90');

/* ─── a negative countdown is a DIFFERENT STATE ────────────────────────── */

is('the DOT inspection has lapsed', it('DOT inspection').days < 0, true);
is('and it says so',                it('DOT inspection').band, 'lapsed');
is('in the red of its own scale',   it('DOT inspection').colour, '#E89494');

/* ─── ⛔ no expiry is NOT a missing date ───────────────────────────────── */

// A ROC classification is a permission you hold. — means NOT APPLICABLE; an
// empty cell would read as unknown and start someone hunting for a date.
const cls = it('A-14');
is('a classification has no expiry', cls.expires, null);
is('so it has no countdown',         cls.days, null);
is('and no band to sit in',          cls.band, null);

/* ─── the counters ask each item its OWN question ──────────────────────── */

is('one lapsed', L.counters.lapsed, 1);
// "Due" means inside ITS OWN window — not a fixed 60 days for everything.
is('nothing is due yet', L.counters.due, 0);
is('nine tracked',       L.counters.tracked, 9);
// The question you actually open the window with. General liability and
// commercial auto renew on the SAME DAY — a real tie, not a wrong answer —
// so what is pinned is the date, not which of the two won the sort.
is('next renewal is the soonest ahead', L.next.expires, '2026-11-14');
is('and two things fall due together',
   L.items.filter((i) => i.expires === '2026-11-14').length, 2);

/* ─── renewing is NOT editing ──────────────────────────────────────────── */

const before = T.trackerDetail(db, 'tr_gl', TODAY);
is('three renewals on record', before.history.length, 3);
// A premium rising 6% a year is only visible because they are all kept.
is('and the rise is visible', before.history[0].changePct.toFixed(1), '6.1');

T.recordRenewal(db, { trackerId: 'tr_gl', renewedAt: '2026-11-14',
                      newExpiry: T.nextExpiry('2026-11-14', 12), cost: 4430 });
const after = T.trackerDetail(db, 'tr_gl', TODAY);
is('the renewal was recorded',     after.history.length, 4);
// ⛔ The old term is pushed into history, not overwritten.
is('and the old term survives',    after.history[1].cost, 4180);
is('the tracker moved on',         after.expires, '2027-11-14');
is('and the new rise is computed', after.history[0].changePct.toFixed(1), '6.0');

console.log(fails ? `\n${fails} failed` : '\ntrackers: all assertions hold');
process.exit(fails ? 1 : 0);
