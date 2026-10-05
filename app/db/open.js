'use strict';

/**
 * The database. One file, opened once, shared for the app's lifetime.
 *
 * ── Why better-sqlite3 and not sql.js ───────────────────────────────────
 * reference/v0 used sql.js, which holds the whole database in memory and
 * needs an explicit save() to persist. That is why v0's code is littered
 * with db.save() calls, and why forgetting one lost work. better-sqlite3
 * writes through to the file, synchronously, in-process — which is also
 * the right shape for a single-user desktop app.
 *
 * ── The schema has ONE source ───────────────────────────────────────────
 * docs/02-schema.sql. It is not copied here. It is the document the whole
 * walkthrough produced and it stays where it is reviewed.
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const SCHEMA = path.join(__dirname, '..', '..', 'docs', '02-schema.sql');

function dataDir() {
  // Electron when available, cwd when running under plain node for tests.
  try { return require('electron').app.getPath('userData'); }
  catch { return path.join(__dirname, '..', '..', '.data'); }
}

const DB_PATH = () => path.join(dataDir(), 'bpc.db');

function open({ file = null, fresh = false } = {}) {
  const target = file || DB_PATH();
  if (fresh && target !== ':memory:' && fs.existsSync(target)) fs.unlinkSync(target);

  if (target !== ':memory:') fs.mkdirSync(path.dirname(target), { recursive: true });
  const isNew = target === ':memory:' || !fs.existsSync(target);
  const db = new Database(target);

  // Durability and concurrency before anything else touches the file.
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');   // OFF by default in SQLite, per connection

  if (isNew) db.exec(fs.readFileSync(SCHEMA, 'utf8'));

  return db;
}

/**
 * Structural checks the schema cannot enforce on itself. Cheap enough to run
 * at every startup, and the only thing standing between a silent corruption
 * and finding out months later.
 */
function verify(db) {
  const problems = [];

  const integrity = db.pragma('integrity_check', { simple: true });
  if (integrity !== 'ok') problems.push(`integrity_check: ${integrity}`);

  const orphans = db.pragma('foreign_key_check');
  if (orphans.length) {
    problems.push(`${orphans.length} orphaned row(s), first in "${orphans[0].table}"`);
  }

  // Every foreign key wants an index — SQLite will not make one for you, and
  // without it each referential check is a table scan. docs/02-schema §14
  // generates these, so a gap means the section is out of date.
  const unindexed = db.prepare(`
    SELECT m.name AS tbl, p."from" AS col
    FROM sqlite_master m
    JOIN pragma_foreign_key_list(m.name) p
    WHERE m.type = 'table'
      AND NOT EXISTS (
        SELECT 1 FROM pragma_index_list(m.name) il
        JOIN pragma_index_info(il.name) ii
        WHERE ii.name = p."from" AND ii.seqno = 0
      )`).all();
  if (unindexed.length) {
    problems.push(`${unindexed.length} unindexed foreign key(s), ` +
                  `first ${unindexed[0].tbl}.${unindexed[0].col}`);
  }

  return problems;
}

module.exports = { open, verify, DB_PATH, SCHEMA };
