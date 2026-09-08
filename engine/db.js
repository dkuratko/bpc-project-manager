// Thin wrapper around sql.js: load/create the estimating database, expose
// convenience helpers matching sqlite's better-known better-sqlite3 API shape
// (run/get/all) so the rest of the engine doesn't have to think about WASM.

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'estimating.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let SQL = null;

async function openDb({ reset = false } = {}) {
  if (!SQL) SQL = await initSqlJs();

  let sqlDb;
  if (!reset && fs.existsSync(DB_PATH)) {
    sqlDb = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    sqlDb = new SQL.Database();
    sqlDb.run('PRAGMA foreign_keys = ON;');
    sqlDb.run(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  }

  return wrap(sqlDb);
}

function wrap(sqlDb) {
  return {
    raw: sqlDb,

    run(sql, params = []) {
      const stmt = sqlDb.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
    },

    get(sql, params = []) {
      const stmt = sqlDb.prepare(sql);
      stmt.bind(params);
      const row = stmt.step() ? stmt.getAsObject() : undefined;
      stmt.free();
      return row;
    },

    all(sql, params = []) {
      const stmt = sqlDb.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },

    save() {
      fs.writeFileSync(DB_PATH, Buffer.from(sqlDb.export()));
    },

    close() {
      sqlDb.close();
    },
  };
}

function newId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

module.exports = { openDb, newId, DB_PATH };
