'use strict';

/**
 * CONTACTS — docs/15. Each assertion is a decision from the walkthrough.
 *
 * The one worth the most: a company's project count is NOT the sum of its
 * people's, because colleagues share jobs. The brief says in as many words
 * "do not fix this", so it is pinned here to stop a later reader fixing it.
 */

const { open } = require('./open.js');
const { seed } = require('./seed.js');
const { contactList, setActive } = require('./contacts.js');

let fails = 0;
const is = (label, got, want) => {
  const ok = String(got) === String(want);
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗ FAIL'} ${label}${ok ? '' : `\n     got  ${got}\n     want ${want}`}`);
};

const db = open({ file: ':memory:', fresh: true });
seed(db);

const list = contactList(db);
const co = (name) => list.customers.find((c) => c.name.startsWith(name));
const pe = (name) => list.customers.flatMap((c) => c.people).find((p) => p.name === name);

is('five companies', list.counts.customers, 5);
is('ten people',     list.counts.people, 10);

/* ─── the count rule ───────────────────────────────────────────────────── */

const ex = co('Exerplay');
const sumOfPeople = ex.people.reduce((t, p) => t + p.projects, 0);
is('Exerplay is on 2 projects',        ex.projects, 2);
is('its people sum to more than that', sumOfPeople, 4);
// ⛔ Not a bug. Grant and Ashley are on the same two jobs. docs/15.
is('a company count is never the sum', ex.projects === sumOfPeople, false);

/* ─── the AUTO marker · one rule, one marker ───────────────────────────── */

// Attached to a PERSON: the marker sits on the person who gets pulled in.
is('Ashley carries the marker', pe('Ashley Doran').auto, 'cc — wherever Grant Smith goes');
is('Grant does not — he is the trigger, not the one copied', pe('Grant Smith').auto, null);
// Exerplay's rule belongs to Ashley, who is a person, so the company row is bare.
is('Exerplay company row is bare', ex.auto, null);

// Attached to a COMPANY: the marker sits on the company, because its trigger
// is not a person. Both markers read 'cc'; only the strip tells them apart.
is('Chandler carries the company rule',
   co('Chandler').auto, 'cc — on every Chandler Unified School Dist. project');
is('both markers render identically',
   co('Chandler').auto.startsWith('cc') && pe('Ashley Doran').auto.startsWith('cc'), true);

/* ─── deactivate, not delete ───────────────────────────────────────────── */

is('Grant is on projects, so cannot be deleted', pe('Grant Smith').deletable, false);
is('Dave is on none, so he can be',              pe('Dave Ruiz').deletable, true);

setActive(db, { kind: 'contact', id: pe('Dave Ruiz').id, active: false });
const live = contactList(db);
is('deactivated, he leaves the list',
   live.customers.flatMap((c) => c.people).some((p) => p.name === 'Dave Ruiz'), false);
const all = contactList(db, { showInactive: true });
const dave = all.customers.flatMap((c) => c.people).find((p) => p.name === 'Dave Ruiz');
is('Show inactive brings him back', !!dave, true);
is('and he is marked inactive',     dave.active, false);

/* ─── a company is not a person ────────────────────────────────────────── */

is('no phone on a company row', 'phone' in ex, false);
is('no email on a company row', 'email' in ex, false);

console.log(fails ? `\n${fails} failed` : '\ncontacts: all assertions hold');
process.exit(fails ? 1 : 0);
