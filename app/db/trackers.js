'use strict';

/**
 * TRACKERS — docs/27. Everything that renews.
 *
 * Insurance, bonds, licences, classifications — the standing obligations that
 * let you work at all, and which fail SILENTLY by simply reaching a date.
 * None of them are project work and none of them announce themselves; that is
 * the whole argument for the screen.
 *
 * ★ ONE TABLE, two owners. A company obligation and a machine's paperwork are
 *   the same shape — a named thing, a date, an interval, a countdown — so
 *   equipment_compliance was folded in rather than kept beside it. The
 *   question "what is about to expire" does not care whose.
 *
 * ★ TWO THRESHOLDS, SET PER ITEM. Obligations do not renew on one timescale:
 *   a truck registration is a web form you do in a day, an ROC licence takes
 *   the state three months. One global pair would nag for four months about
 *   the first or leave the second too late to save.
 */

const BANDS = {
  lapsed: '#E89494',   // past its date
  due:    '#F0B778',   // inside its DUE days — do it now
  notice: '#F5E183',   // inside its NOTICE days — start thinking about it
  ok:     '#B5E3B5',   // beyond that
};

const days = (from, to) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86400000);

/**
 * ⛔ A tracker with no expiry is NOT missing a date — it is a thing that does
 *    not lapse. A ROC classification is a permission you hold. The list shows
 *    — for it, which is docs/22's "not applicable", and the reason that
 *    distinction exists: an empty cell would read as UNKNOWN and start
 *    someone hunting for a date that was never going to exist.
 */
function countdown(t, today) {
  if (!t.expires_at) return { days: null, band: null, colour: null, lapsed: false };
  const left = days(today, t.expires_at);
  const band = left < 0 ? 'lapsed'
             : left <= t.due_days ? 'due'
             : left <= t.notice_days ? 'notice'
             : 'ok';
  return { days: left, band, colour: BANDS[band], lapsed: left < 0 };
}

function trackerList(db, today, { showEquipment = false, showInactive = false } = {}) {
  const rows = db.prepare(`
    SELECT t.*, m.name AS machine_name
      FROM trackers t
      LEFT JOIN equipment_sourcing_methods m ON m.id = t.sourcing_method_id
     ${showInactive ? '' : 'WHERE t.active = 1'}
     ORDER BY t.category, t.name`).all();

  const items = rows.map((t) => ({
    id: t.id,
    // A machine's tracker reads as "the truck · its registration", because on
    // one list "Registration" alone does not say whose.
    name: t.owner_type === 'equipment'
      ? `${t.machine_name} · ${t.name}` : t.name,
    rawName: t.name,
    ownerType: t.owner_type,
    category: t.category,
    issuer: t.issuer, reference: t.reference,
    effective: t.effective_at, expires: t.expires_at,
    renewalMonths: t.renewal_months, cost: t.cost,
    noticeDays: t.notice_days, dueDays: t.due_days,
    attachment: t.attachment_path, notes: t.notes,
    active: !!t.active,
    ...countdown(t, today),
  }));

  // Equipment items get their OWN band so the default view is not cluttered.
  const shown = items.filter((i) => showEquipment || i.ownerType !== 'equipment');

  const ORDER = ['insurance', 'bond', 'licence', 'classification', 'other'];
  const groups = [];
  for (const i of shown) {
    const key = i.ownerType === 'equipment' ? 'equipment' : i.category;
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push(g = { key, label: key.toUpperCase() + (key === 'bond'
      || key === 'licence' || key === 'classification' ? 'S' : ''), items: [] });
    g.items.push(i);
  }
  groups.sort((a, b) => {
    const ai = a.key === 'equipment' ? 99 : ORDER.indexOf(a.key);
    const bi = b.key === 'equipment' ? 99 : ORDER.indexOf(b.key);
    return ai - bi;
  });

  // ★ "Due" means INSIDE ITS OWN WINDOW. A counter that asked everything the
  //   same arbitrary 60-day question would be answering nothing — it has to
  //   mean "what needs doing now" across obligations on different timescales.
  const counters = {
    lapsed: shown.filter((i) => i.band === 'lapsed').length,
    due:    shown.filter((i) => i.band === 'due').length,
    notice: shown.filter((i) => i.band === 'notice').length,
    tracked: shown.length,
  };

  // The question you actually open this window with.
  const next = shown
    .filter((i) => i.days != null && i.days >= 0)
    .sort((a, b) => a.days - b.days)[0] ?? null;

  return { groups, items: shown, counters, next };
}

function trackerDetail(db, id, today) {
  const t = db.prepare(`
    SELECT t.*, m.name AS machine_name FROM trackers t
      LEFT JOIN equipment_sourcing_methods m ON m.id = t.sourcing_method_id
     WHERE t.id = ?`).get(id);
  if (!t) return null;

  const history = db.prepare(`
    SELECT * FROM tracker_renewals WHERE tracker_id = ?
     ORDER BY renewed_at DESC`).all(id);

  /**
   * ★ RENEWAL HISTORY IS THE POINT OF KEEPING THIS. A premium rising 6% a
   *   year is a fact you only see when the renewals sit in one place. The app
   *   does not act on it — it just stops the number being invisible.
   */
  const withChange = history.map((h, i) => {
    const prev = history[i + 1];
    return {
      ...h,
      changePct: prev?.cost && h.cost
        ? ((h.cost - prev.cost) / prev.cost) * 100 : null,
    };
  });

  return {
    id: t.id,
    name: t.owner_type === 'equipment' ? `${t.machine_name} · ${t.name}` : t.name,
    subtitle: [cap(t.category), t.issuer,
               t.renewal_months ? renews(t.renewal_months) : null]
      .filter(Boolean).join(' · '),
    issuer: t.issuer, reference: t.reference,
    effective: t.effective_at, expires: t.expires_at,
    cost: t.cost, renewalMonths: t.renewal_months,
    noticeDays: t.notice_days, dueDays: t.due_days,
    attachment: t.attachment_path, notes: t.notes,
    history: withChange,
    ...countdown(t, today),
  };
}

/**
 * ⛔ RENEWING IS NOT EDITING. Overtyping the expiry date on the properties
 *    dialog would silently lose the history — and the history is the only
 *    reason the rising premium is visible at all. So this writes the NEW term
 *    and pushes the old one into the record.
 */
function recordRenewal(db, { trackerId, renewedAt, newExpiry, cost, reference,
                             attachment, notes }) {
  const t = db.prepare(`SELECT * FROM trackers WHERE id = ?`).get(trackerId);
  if (!t) return { error: 'no such tracker' };

  db.transaction(() => {
    db.prepare(`INSERT INTO tracker_renewals
      (id,tracker_id,renewed_at,expires_at,cost,reference,attachment_path,notes)
      VALUES (?,?,?,?,?,?,?,?)`)
      .run(`trr_${trackerId}_${renewedAt}`, trackerId, renewedAt, newExpiry,
           cost ?? null, reference ?? null, attachment ?? null, notes ?? null);

    db.prepare(`UPDATE trackers
                   SET effective_at = ?, expires_at = ?, cost = COALESCE(?, cost),
                       reference = COALESCE(?, reference),
                       attachment_path = COALESCE(?, attachment_path)
                 WHERE id = ?`)
      .run(renewedAt, newExpiry, cost ?? null, reference ?? null,
           attachment ?? null, trackerId);
  })();
  return { ok: true };
}

/** The expiry a renewal would land on, from the item's own interval. */
function nextExpiry(renewedAt, months) {
  if (!months) return null;
  const d = new Date(renewedAt + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const renews = (m) => m === 12 ? 'renews annually'
  : m === 24 ? 'renews every two years' : `renews every ${m} months`;

module.exports = { trackerList, trackerDetail, recordRenewal, nextExpiry, BANDS };
