#!/usr/bin/env node
'use strict';

/**
 * The status derivation, pinned.
 *     node app/db/status.test.js
 *
 * Every case here is a decision from the walkthrough, not an invented edge.
 * If one of these flips, a design argument has been undone.
 */

const { deriveStatus, rollUp } = require('./status');

const T = '2026-09-13';
let failed = 0;

function check(what, facts, expect) {
  const s = deriveStatus(facts, T);
  const got = { label: s.label, colour: s.colour, problem: s.hasProblem };
  const ok = got.label === expect.label
          && got.colour === expect.colour
          && got.problem === expect.problem;
  if (!ok) {
    failed++;
    console.error(`✗ ${what}\n    want ${JSON.stringify(expect)}\n    got  ${JSON.stringify(got)}`);
  } else {
    console.log(`✓ ${what}${expect.problem ? '  ⚠ ' + s.alerts[0] : ''}`);
  }
}

const W = '#ffffff', BLUE = '#9CC3E2', LGREEN = '#B5E3B5',
      GREEN = '#8ECF8E', YELLOW = '#F5E183', ORANGE = '#F0B778', RED = '#E89494';

// A version before approval has no status of its own — it is a standing offer.
check('no estimate yet', {}, { label: 'QUOTING', colour: W, problem: false });
check('sent, inside 30 days',
  { estimateSentAt: '2026-09-03' }, { label: 'SENT, AWAITING', colour: W, problem: false });

// Expired, but NOTHING is ever off the table — it stays approvable, it just says so.
check('sent, past the 30-day expiry',
  { estimateSentAt: '2026-07-15' }, { label: 'SENT, AWAITING', colour: W, problem: true });

// NOT a problem. Awaiting delivery with nothing delivered is just awaiting
// delivery — flagging it would lip half the board and teach everyone to
// ignore the lip. The shortfall only becomes a problem once a date exists.
check('awaiting delivery is not itself a problem',
  { approvedAt: '2026-09-01', equipmentComplete: false },
  { label: 'AWAITING DELIVERY', colour: BLUE, problem: false });
check('approved, everything delivered',
  { approvedAt: '2026-09-01', equipmentComplete: true },
  { label: 'EQUIPMENT RECEIVED', colour: LGREEN, problem: false });

// ★ THE SIGNATURE CASE. Scheduling a job whose equipment is not on the lot is
// the alert this application exists to raise. The row stays GREEN — its real
// phase — and carries the problem separately, because a red row means finished.
check('scheduled with no equipment — green AND a problem',
  { approvedAt: '2026-09-01', equipmentComplete: false, installDate: '2026-09-22' },
  { label: 'SCHEDULED', colour: GREEN, problem: true });

// An open shipment issue blocks EQUIPMENT RECEIVED even when every quantity
// has arrived. Two independent gates — docs/25.
check('all quantities in, one issue open',
  { approvedAt: '2026-09-01', equipmentComplete: true, openIssues: 1, installDate: '2026-09-22' },
  { label: 'SCHEDULED', colour: GREEN, problem: true });

check('crew on site', { approvedAt: '1', startedAt: '2026-09-10' },
  { label: 'ACTIVE', colour: YELLOW, problem: false });

// ★ "Completed does not complete the job." The crew left; the job stays ACTIVE
// until the invoice goes out, because completion IS the invoice. This is the
// removed "completed, payment required" status staying removed.
check('crew left, not yet invoiced — still ACTIVE',
  { approvedAt: '1', startedAt: '2026-09-10', completedAt: '2026-09-12' },
  { label: 'ACTIVE', colour: YELLOW, problem: false });

check('invoice sent', { invoiceSentAt: '2026-09-25' },
  { label: 'INVOICE SENT, PAYMENT REQUIRED', colour: ORANGE, problem: false });

// ★ COMPLETED, PAID is unreachable. The warranty clock starts when the invoice
// is SENT, so a job is always inside warranty by the time it is paid.
check('paid, still in warranty',
  { invoiceSentAt: '2026-09-25', paidAt: '2026-10-02', warrantyExpiresAt: '2027-09-25' },
  { label: 'WARRANTY', colour: RED, problem: false });
check('warranty expired',
  { invoiceSentAt: '1', paidAt: '1', warrantyExpiresAt: '2026-01-01' },
  { label: 'COMPLETED', colour: RED, problem: false });

/* A project has no status of its own. */
{
  const versions = [
    deriveStatus({ estimateSentAt: '2026-09-03' }, T),
    deriveStatus({ approvedAt: '1', equipmentComplete: false, installDate: '2026-09-22' }, T),
  ];
  const p = rollUp(versions);
  const ok = p.colour === GREEN && p.hasProblem === true;
  if (!ok) { failed++; console.error('✗ project rolls up to its furthest version, carrying any problem'); }
  else console.log('✓ project rolls up to its furthest version, carrying any problem');
}

console.log(failed ? `\n${failed} failed` : '\nall pass');
process.exit(failed ? 1 : 0);
