#!/usr/bin/env node
'use strict';

/**
 * Seed the facts, derive the board, compare it to the render.
 *     node app/db/seed.test.js
 *
 * project-browser.v14 shows eight rows in eight states. None of those colours
 * is stored anywhere — each one has to fall out of the approvals, shipments,
 * dates and invoices the seed writes. If a colour here stops matching the
 * render, either the seed or the derivation has drifted from the design.
 */

const { open } = require('./open');
const { seed } = require('./seed');
const { deriveStatus, rollUp } = require('./status');

const TODAY = '2026-09-13';
const db = open({ file: ':memory:' });
seed(db);

const BOARD = db.prepare(`
  SELECT p.number, p.sequence_no, p.title,
         f.approved_at, f.invoice_sent_at, f.paid_at,
         s.install_date, s.started_at, s.completed_at,
         w.expires_at AS warranty,
         (SELECT max(sent_at) FROM documents d
           WHERE d.version_id = v.id AND d.doc_type = 'e') AS sent,
         (SELECT count(*) FROM shipment_items si
            JOIN shipments sh ON sh.id = si.shipment_id
           WHERE sh.version_id = v.id
             AND si.condition = 'issue' AND si.issue_resolved_at IS NULL) AS issues,
         (SELECT count(*) FROM shipments sh WHERE sh.version_id = v.id) AS trucks
  FROM projects p
  JOIN versions v ON v.project_id = p.id
  LEFT JOIN version_facts    f ON f.version_id = v.id
  LEFT JOIN version_schedule s ON s.version_id = v.id
  LEFT JOIN warranties       w ON w.version_id = v.id
  ORDER BY p.sequence_no, v.option_letter, v.version_number`).all();

const projects = new Map();
for (const r of BOARD) {
  const st = deriveStatus({
    estimateSentAt: r.sent,
    approvedAt: r.approved_at,
    equipmentComplete: r.trucks > 0 && r.issues === 0,
    openIssues: r.issues,
    installDate: r.install_date,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    invoiceSentAt: r.invoice_sent_at,
    paidAt: r.paid_at,
    warrantyExpiresAt: r.warranty,
  }, TODAY);
  if (!projects.has(r.number)) projects.set(r.number, []);
  projects.get(r.number).push(st);
}

/* What project-browser.v14 draws. */
const EXPECT = {
  '26-07': { colour: '#F0B778', problem: false },   // invoiced
  '26-08': { colour: '#F5E183', problem: false },   // active
  '26-09': { colour: '#8ECF8E', problem: true  },   // ★ green WITH a lip
  '26-10': { colour: '#ffffff', problem: false },   // quoting, three versions
  '26-11': { colour: '#9CC3E2', problem: false },   // accepted, nothing due yet
  '26-12': { colour: '#ffffff', problem: false },
  '26-13': { colour: '#ffffff', problem: false },
  '26-14': { colour: '#ffffff', problem: true  },   // white WITH a lip
};

let failed = 0;
for (const [number, want] of Object.entries(EXPECT)) {
  const versions = projects.get(number);
  if (!versions) { failed++; console.error(`✗ ${number} missing from the seed`); continue; }
  const got = rollUp(versions);
  const ok = got.colour === want.colour && got.hasProblem === want.problem;
  if (!ok) {
    failed++;
    console.error(`✗ ${number}  want ${want.colour}${want.problem ? ' + lip' : ''}` +
                  `  got ${got.colour}${got.hasProblem ? ' + lip' : ''}  (${got.label})`);
  } else {
    console.log(`✓ ${number}  ${got.colour}  ${got.label}` +
                (got.hasProblem ? `  ▌ ${got.alerts[0]}` : ''));
  }
}

// 26-10 is the selected, expanded row in the render: A0, A1, B0.
const sanTan = BOARD.filter((r) => r.number === '26-10').length;
if (sanTan !== 3) { failed++; console.error(`✗ 26-10 should have 3 versions, has ${sanTan}`); }
else console.log('✓ 26-10 has its three versions · A0 · A1 · B0');

console.log(failed ? `\n${failed} failed` : '\nthe board matches the render');
process.exit(failed ? 1 : 0);
