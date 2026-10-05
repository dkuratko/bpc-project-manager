#!/usr/bin/env node
'use strict';

/**
 * Build the schema into a throwaway database and verify it.
 *     node app/db/check.js
 *
 * Run this after editing docs/02-schema.sql. The schema was hand-edited for
 * weeks before anyone executed it; this makes "does it still run" a one-liner
 * rather than an assumption.
 */

const { open, verify } = require('./open');

let db;
try {
  db = open({ file: ':memory:' });
} catch (err) {
  console.error('✗ schema failed to build\n  ' + err.message);
  process.exit(1);
}

const count = (type) =>
  db.prepare(`SELECT count(*) n FROM sqlite_master WHERE type = ?`).get(type).n;

const problems = verify(db);

console.log(`tables   ${count('table')}`);
console.log(`indexes  ${count('index')}`);

if (problems.length) {
  console.error('\n✗ ' + problems.join('\n✗ '));
  process.exit(1);
}
console.log('\n✓ schema builds clean');
