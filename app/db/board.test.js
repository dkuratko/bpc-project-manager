#!/usr/bin/env node
'use strict';

/**
 * The board, and the five counters.
 *     npm test
 *
 * project-browser.v14 shows three figures this can be held to. They are
 * sample data, but they have to be internally consistent — the counters add
 * up from the versions, and GM% is the gap between quoted and computed.
 */

const { open } = require('./open');
const { seed } = require('./seed');
const { board, counters, money, marginPct } = require('./board');

const TODAY = '2026-09-16';
const db = open({ file: ':memory:' });
seed(db);

const rows = db && board(db, TODAY);
const tiles = counters(rows, TODAY);
let failed = 0;

const is = (what, got, want) => {
  if (String(got) === String(want)) { console.log(`✓ ${what}  ${got}`); return; }
  failed++; console.error(`✗ ${what}\n    want ${want}\n    got  ${got}`);
};

is('projects on the board', rows.length, 8);
is('versions across them', rows.flatMap((p) => p.versions).length, 10);

/* docs/07 · the three San Tan versions, with the render's own margins. */
const sanTan = rows.find((p) => p.number === '26-10');
is('26-10 A0 value', money(sanTan.versions[0].value), '$17,500.00');
is('26-10 A0 margin', sanTan.versions[0].margin.toFixed(1), '25.6');
is('26-10 A1 margin', sanTan.versions[1].margin.toFixed(1), '28.7');
is('26-10 B0 margin', sanTan.versions[2].margin.toFixed(1), '28.0');

/* A project has no value of its own — only its versions do. docs/07. */
is('a project row carries no value', sanTan.value, 'undefined');

/* GM% is null unless BOTH numbers exist. A margin against a missing cost is
   a number that looks right and is not. docs/22. */
is('margin with no cost', marginPct(1000, null), 'null');
is('margin with no price', marginPct(null, 700), 'null');

/* The counter tiles. */
const tile = (label) => tiles.find((t) => t.label === label);
is('Won, in progress', tile('Won, in progress').value, '$137,529.00');
is('Unpaid', tile('Unpaid').value, '$5,390.00');
is('Scheduled this week', tile('Scheduled this week').value, '1 job');
is('Scheduled this week warns', tile('Scheduled this week').warn, 'true');
is('Problems', tile('Problems').value, '2');

/* ★ 26-09 · green, with a flag. Scheduled, equipment short. */
const dobson = rows.find((p) => p.number === '26-09');
is('26-09 colour', dobson.status.colour, '#8ECF8E');
is('26-09 flags', dobson.flags.join(''), '!');

console.log(failed ? `\n${failed} failed` : '\nthe board holds');
process.exit(failed ? 1 : 0);
