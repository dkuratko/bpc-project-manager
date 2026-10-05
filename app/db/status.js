'use strict';

/**
 * Status, derived.
 *
 * There is no status column anywhere in the schema, and this is why: reality
 * does not enforce an order between the facts. A job can be scheduled before
 * its equipment lands, and a model that stored a status would have to pick a
 * lie about which happened.
 *
 * So this is a pure function of independent facts. Correct a fact and the
 * status recomputes — which is also how every problem in the application
 * gets fixed. See docs/02-schema.sql §12 and docs/08-status-colours.md.
 *
 * ── The ramp is a PROGRESSION, not severity ─────────────────────────────
 * A red row always means FINISHED. Problems never tint a row; they raise an
 * alert, which the UI draws as a 4px lip in the gutter. That is why `alerts`
 * comes back separately from `tier` — they are different questions.
 */

const RAMP = {
  quoting:   { tier: 'quoting',   colour: '#ffffff' },
  accepted:  { tier: 'accepted',  colour: '#9CC3E2' },
  received:  { tier: 'received',  colour: '#B5E3B5' },
  scheduled: { tier: 'scheduled', colour: '#8ECF8E' },
  active:    { tier: 'active',    colour: '#F5E183' },
  invoiced:  { tier: 'invoiced',  colour: '#F0B778' },
  closed:    { tier: 'closed',    colour: '#E89494' },
};

const QUOTE_VALID_DAYS = 30;

const days = (from, to) =>
  Math.round((new Date(to) - new Date(from)) / 86400000);

/**
 * @param f facts about one version:
 *   estimateCreatedAt, estimateSentAt, approvedAt,
 *   equipmentComplete (bool), openIssues (int),
 *   installDate, startedAt, completedAt,
 *   invoiceSentAt, paidAt, warrantyExpiresAt
 * @param today ISO date — injected so this stays pure and testable
 */
function deriveStatus(f, today = new Date().toISOString().slice(0, 10)) {
  const alerts = [];

  // ── after the money ──────────────────────────────────────────────────
  if (f.paidAt) {
    if (f.warrantyExpiresAt && f.warrantyExpiresAt > today) {
      return done('WARRANTY', `until ${f.warrantyExpiresAt}`, 'closed', alerts);
    }
    return done('COMPLETED', null, 'closed', alerts);
    // COMPLETED, PAID is unreachable and that is not a bug here: the warranty
    // clock starts when the invoice is SENT, so a job is always inside its
    // warranty by the time it is paid. 00-TREE flags the status for removal.
  }

  if (f.invoiceSentAt) {
    return done('INVOICE SENT, PAYMENT REQUIRED', f.invoiceSentAt, 'invoiced', alerts);
  }

  // ── on site ──────────────────────────────────────────────────────────
  // completedAt means the crew left, NOT that the job is done. Completion IS
  // the invoice, which is why "completed, payment required" was removed.
  if (f.startedAt) {
    return done('ACTIVE', `since ${f.startedAt}`, 'active', alerts);
  }

  // ── approved, waiting ────────────────────────────────────────────────
  if (f.approvedAt) {
    const short = !f.equipmentComplete || f.openIssues > 0;

    if (f.installDate) {
      // ★ The dangerous one, and the alert this application exists to raise.
      // The shortfall is only a PROBLEM once a date exists — awaiting
      // delivery with nothing delivered is just awaiting delivery, and
      // flagging that would put a red lip on half the board and teach
      // everyone to ignore it. The schema's derivation table puts the alert
      // on this row alone.
      //
      // The date is NOT blocked. The customer set it and reality does not
      // care what the app thinks.
      if (short) {
        alerts.push(f.openIssues > 0
          ? `${f.openIssues} open shipment issue${f.openIssues > 1 ? 's' : ''}`
          : 'no equipment received');
      }
      return done('SCHEDULED', f.installDate, 'scheduled', alerts);
    }

    return short
      ? done('AWAITING DELIVERY', null, 'accepted', alerts)
      : done('EQUIPMENT RECEIVED', null, 'received', alerts);
  }

  // ── before approval · a standing offer, with no status of its own ─────
  if (f.estimateSentAt) {
    const age = days(f.estimateSentAt, today);
    if (age > QUOTE_VALID_DAYS) {
      // Expired, but NOTHING is ever off the table — it stays approvable.
      alerts.push(`quoted ${age} days ago · past the ${QUOTE_VALID_DAYS}-day expiry`);
    }
    return done('SENT, AWAITING', f.estimateSentAt, 'quoting', alerts);
  }

  if (f.estimateCreatedAt) return done('ESTIMATE CREATED', f.estimateCreatedAt, 'quoting', alerts);
  return done('QUOTING', null, 'quoting', alerts);
}

function done(label, when, tier, alerts) {
  return { label, when, ...RAMP[tier], alerts, hasProblem: alerts.length > 0 };
}

/** A project has no status of its own — it is the rollup of its versions. */
function rollUp(statuses) {
  if (!statuses.length) return deriveStatus({});
  const order = ['quoting', 'accepted', 'received', 'scheduled', 'active', 'invoiced', 'closed'];
  // The furthest-along version speaks for the project, and any version's
  // problem is the project's problem.
  const lead = statuses.reduce((a, b) =>
    order.indexOf(b.tier) > order.indexOf(a.tier) ? b : a);
  return { ...lead, alerts: statuses.flatMap((s) => s.alerts),
           hasProblem: statuses.some((s) => s.hasProblem) };
}

module.exports = { deriveStatus, rollUp, RAMP, QUOTE_VALID_DAYS };
