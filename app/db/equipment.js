'use strict';

/**
 * EQUIPMENT — docs/18. Two tabs, because the columns differ.
 *
 * Three kinds of thing:
 *   TYPE             "truck", "boom lift". GENERIC — a job needs *a boom
 *                    lift*, not United's 64-footer. A NAME AND A ROLE.
 *   OWNED UNIT       the 2012 Ford F-450, VIN …00001. One physical asset.
 *   RENTAL OFFERING  United's 64' boom lift. A class, never serial-specific.
 *
 * ★ A TYPE CARRIES NO PHYSICAL FACTS. "truck" has no payload, no VIN and no
 *   make; the F-450 does. Every dimension, rating and spec lives on the
 *   MACHINE. That is the point of a type, not a compromise with it.
 */

const MONTH = 30.44 * 24 * 3600 * 1000;

const days = (from, to) =>
  Math.round((Date.parse(to) - Date.parse(from)) / 86400000);

/* ─── rates ─────────────────────────────────────────────────────────────── */

/**
 * The build-up, in the order docs/18 prints it. Four decimals, because the
 * components have to visibly sum to the rate; the list shows two, because
 * there it is a price.
 *
 * A line is OMITTED when its inputs are missing, never shown as zero. The
 * flatbed has no engine, so it has no fuel line at all — a $0.00 fuel row
 * would read as "fuel is free" rather than "there is no fuel".
 */
function rateBuildUp(inputs, fuelPrices, fuelType) {
  if (!inputs) return null;
  const lines = [];
  const add = (label, detail, value) => {
    if (value == null || !isFinite(value)) return;
    lines.push({ label, detail, value });
  };

  const fuel = inputs.fuel_price ?? fuelPrices?.[(fuelType ?? '').toLowerCase()] ?? null;
  if (inputs.mpg && fuel) {
    add('Fuel', `$${fuel.toFixed(2)} ÷ ${inputs.mpg} mpg`, fuel / inputs.mpg);
  }
  if (inputs.annual_maintenance && inputs.annual_miles) {
    add('Maintenance', `$${num(inputs.annual_maintenance)} ÷ ${num(inputs.annual_miles)} mi`,
        inputs.annual_maintenance / inputs.annual_miles);
  }
  if (inputs.tyre_set_cost && inputs.tyre_life_miles) {
    add('Tyres', `$${num(inputs.tyre_set_cost)} ÷ ${num(inputs.tyre_life_miles)} mi`,
        inputs.tyre_set_cost / inputs.tyre_life_miles);
  }
  if (inputs.purchase_price != null && inputs.life_miles) {
    const dep = (inputs.purchase_price - (inputs.salvage_value ?? 0)) / inputs.life_miles;
    add('Depreciation',
        `($${num(inputs.purchase_price)} − $${num(inputs.salvage_value ?? 0)}) ÷ ${num(inputs.life_miles)} mi`,
        dep);
  }
  const fixed = (inputs.insurance_annual ?? 0) + (inputs.registration_annual ?? 0);
  if (fixed && inputs.annual_miles) {
    add('Fixed', `($${num(inputs.insurance_annual ?? 0)} + $${num(inputs.registration_annual ?? 0)}) ÷ ${num(inputs.annual_miles)} mi`,
        fixed / inputs.annual_miles);
  }

  const total = lines.reduce((t, l) => t + l.value, 0);
  return { lines, total, computedAt: inputs.computed_at, stored: inputs.computed_rate };
}

const num = (n) => Number(n).toLocaleString('en-US');

const rateLabel = (rate, basis) => basis === 'mile'
  ? `$${rate.toFixed(2)} /mi`
  : `$${Number(rate).toFixed(2)} /${basis}`;

/* ─── the OWNED tab ─────────────────────────────────────────────────────── */

function owned(db, today, { showInactive = false } = {}) {
  const rows = db.prepare(`
    SELECT m.*, e.name AS type_name, e.is_vehicle,
           r.computed_at, r.computed_rate
      FROM equipment_sourcing_methods m
      JOIN equipment e ON e.id = m.equipment_id
      LEFT JOIN vehicle_rate_inputs r ON r.sourcing_method_id = m.id
     WHERE m.kind = 'owned' ${showInactive ? '' : 'AND m.active = 1'}
     ORDER BY e.name, m.name`).all();

  // Compliance lives in trackers now — registration earned a typed home there
  // rather than a column here. docs/18 + docs/27.
  const expiring = db.prepare(`
    SELECT sourcing_method_id, name, expires_at FROM trackers
     WHERE owner_type = 'equipment' AND active = 1 AND expires_at IS NOT NULL`).all();

  const units = rows.map((m) => {
    const problems = [];

    // A rate nobody has recomputed since fuel was $2.90 is still a number on
    // a bid, and nothing else in the app would ever mention it.
    const age = m.computed_at ? (Date.parse(today) - Date.parse(m.computed_at)) / MONTH : null;
    if (age != null && age > 12) {
      problems.push(`rate computed ${m.computed_at} — ${Math.floor(age)} months old`);
    }

    for (const t of expiring.filter((t) => t.sourcing_method_id === m.id)) {
      const left = days(today, t.expires_at);
      if (left < 0) problems.push(`${t.name} expired ${t.expires_at}`);
      else if (left < 60) problems.push(`${t.name} expires ${t.expires_at} — ${left} days`);
    }

    // A truck's CAPACITY is its bed; a trailer's is its payload. A lift has
    // neither — it is cargo, not a carrier, so both read — rather than 0.
    const capacity = m.payload_lb ?? m.capacity_lb ?? null;

    return {
      id: m.id, name: m.name, serial: m.serial,
      type: m.equipment_id, typeName: m.type_name,
      capacity,
      deck: m.deck_length_ft && m.deck_width_ft
        ? `${m.deck_length_ft.toFixed(1)} × ${m.deck_width_ft.toFixed(1)} ft` : null,
      rate: m.rate, rateBasis: m.rate_basis,
      rateLabel: rateLabel(m.rate, m.rate_basis),
      computedAt: m.computed_at ?? null,
      rateIsTyped: !m.computed_at,       // the Bobcat. No mileage to divide by.
      active: !!m.active,
      problems,
      hasProblem: problems.length > 0,
    };
  });

  return { units, counters: ownedCounters(db, units, today) };
}

function ownedCounters(db, units, today) {
  const stale = units.filter(
    (u) => u.problems.some((p) => p.startsWith('rate computed'))).length;
  const registration = units.filter(
    (u) => u.problems.some((p) => !p.startsWith('rate computed'))).length;

  // ⛔ "Unused 12 months" reads equipment_selections, which only exists once a
  //    calculation has RUN. With no runs it cannot tell "nobody uses this
  //    truck" from "nothing has ever been costed", and would flag the whole
  //    fleet for the second reason while appearing to mean the first. So it
  //    reports 0 and says why — the same mistake AWAITING DELIVERY made when
  //    it called an empty shipment list a problem.
  const runs = db.prepare(`SELECT COUNT(*) c FROM calculation_runs`).get().c;
  const unused = runs === 0 ? 0 : units.filter((u) => !usedWithin(db, u.id, today, 12)).length;

  return {
    staleRate: stale,
    registration,
    unused,
    unusedMeaningless: runs === 0,
  };
}

/**
 * "Used" means used on a JOB — and a job uses a machine two different ways.
 *
 *   equipment_selections   the machine does the work: a boom lift, a skid
 *                          steer. Chosen by the engine, priced per period.
 *   version_mobilization   the machine CARRIES the work. The F-450 and the
 *                          flatbed are the haul rig, and they never appear in
 *                          a selection — mobilization is its own service.
 *
 * Counting only the first flagged the truck and the trailer as unused on
 * every job they ever towed, which is the opposite of true.
 */
function usedWithin(db, methodId, today, months) {
  const row = db.prepare(`
    SELECT MAX(last) AS last FROM (
      SELECT r.created_at AS last FROM equipment_selections s
        JOIN calculation_runs r ON r.id = s.run_id
       WHERE s.sourcing_method_id = ?
      UNION ALL
      SELECT COALESCE(sc.install_date, d.created_at) AS last
        FROM version_mobilization vm
        JOIN equipment_sourcing_methods m
          ON m.equipment_id IN (vm.truck_equipment_id, vm.trailer_equipment_id)
        LEFT JOIN version_schedule sc ON sc.version_id = vm.version_id
        LEFT JOIN documents d ON d.version_id = vm.version_id AND d.doc_type = 'e'
       WHERE m.id = ?)`).get(methodId, methodId);
  if (!row?.last) return false;
  return (Date.parse(today) - Date.parse(row.last)) / MONTH <= months;
}

/* ─── the RENTED tab ────────────────────────────────────────────────────── */

/**
 * ★ TWO RATES, and the gap between them is the point.
 *
 *   CARD       what they charge   ← costing uses THIS
 *   LAST PAID  what you were billed, with the job that evidences it
 *
 * Last paid SUGGESTS updating the card. It never overwrites it: one invoice
 * is a data point about a price, not a new price.
 */
function rented(db, today, { showInactive = false } = {}) {
  const rows = db.prepare(`
    SELECT m.*, e.name AS type_name, s.name AS supplier_name, s.phone, s.account_ref,
           (SELECT p.number || v.option_letter || v.version_number
              FROM versions v JOIN projects p ON p.id = v.project_id
             WHERE v.id = m.last_paid_version_id) AS last_paid_tag
      FROM equipment_sourcing_methods m
      JOIN equipment e  ON e.id = m.equipment_id
      JOIN suppliers s  ON s.id = m.supplier_id
     WHERE m.kind = 'rented' ${showInactive ? '' : 'AND m.active = 1'}
     ORDER BY s.name, e.name, m.rate DESC`).all();

  const brackets = db.prepare(`SELECT * FROM rental_rates`).all();

  const offerings = rows.map((m) => {
    const bracket = brackets.filter((b) => b.sourcing_method_id === m.id);
    const problems = [];

    // The card quietly underpricing a bid is the thing this tab exists to stop.
    if (m.last_paid_rate != null && m.last_paid_rate !== m.rate) {
      const gap = m.last_paid_rate - m.rate;
      problems.push(gap > 0
        ? `Card is $${gap.toFixed(2)} under the last invoice`
        : `Card is $${(-gap).toFixed(2)} over the last invoice`);
    }

    const confirmAge = m.rate_confirmed_at
      ? (Date.parse(today) - Date.parse(m.rate_confirmed_at)) / MONTH : null;

    return {
      id: m.id,
      name: m.name ?? `${m.type_name}`,
      supplier: m.supplier_id, supplierName: m.supplier_name,
      phone: m.phone, account: m.account_ref,
      type: m.equipment_id, typeName: m.type_name,
      card: m.rate, cardBasis: m.rate_basis,
      cardLabel: rateLabel(m.rate, m.rate_basis),
      brackets: bracket.map((b) => ({
        basis: b.basis, rate: b.rate, label: rateLabel(b.rate, b.basis),
        // Weekly is roughly three day rates, so the break bites at four days.
        breaksAt: m.rate_basis === 'day' && b.basis === 'week'
          ? Math.ceil(b.rate / m.rate) + (b.rate % m.rate ? 0 : 1) : null,
      })),
      confirmedAt: m.rate_confirmed_at,
      unconfirmed: confirmAge == null || confirmAge > 12,
      lastPaid: m.last_paid_rate,
      lastPaidAt: m.last_paid_at,
      lastPaidTag: m.last_paid_tag,
      lastPaidSource: m.last_paid_source,
      neverRented: m.last_paid_at == null,
      minimum: m.minimum_periods,
      // 'delivered' never touches your trailer. 'collected' IS load — weight,
      // dimensions, trips. docs/06's earlier rule was only half true.
      move: m.move,
      shipWeight: m.ship_weight_lb,
      active: !!m.active,
      problems,
      hasProblem: problems.length > 0,
    };
  });

  // Grouped supplier → type. Two band tiers, docs/14.
  const suppliers = [];
  for (const o of offerings) {
    let s = suppliers.find((x) => x.id === o.supplier);
    if (!s) suppliers.push(s = { id: o.supplier, name: o.supplierName, types: [] });
    let t = s.types.find((x) => x.id === o.type);
    if (!t) s.types.push(t = { id: o.type, name: o.typeName, offerings: [] });
    t.offerings.push(o);
  }

  return {
    suppliers, offerings,
    counters: {
      cardDiffers: offerings.filter((o) => o.hasProblem).length,
      unconfirmed: offerings.filter((o) => o.unconfirmed).length,
      neverRented: offerings.filter((o) => o.neverRented).length,
    },
    totals: {
      offerings: offerings.length,
      suppliers: suppliers.length,
      types: new Set(offerings.map((o) => o.type)).size,
    },
  };
}

/* ─── the detail pane · the selected machine in full ────────────────────── */

function detail(db, id, today) {
  const m = db.prepare(`
    SELECT m.*, e.name AS type_name, s.name AS supplier_name, s.phone, s.account_ref
      FROM equipment_sourcing_methods m
      JOIN equipment e ON e.id = m.equipment_id
      LEFT JOIN suppliers s ON s.id = m.supplier_id
     WHERE m.id = ?`).get(id);
  if (!m) return null;

  const specs = db.prepare(`
    SELECT name, value, unit FROM equipment_specifications
     WHERE sourcing_method_id = ? ORDER BY sequence_no`).all(id);

  const fuelType = specs.find((s) => s.name === 'Fuel')?.value ?? null;
  const inputs = db.prepare(
    `SELECT * FROM vehicle_rate_inputs WHERE sourcing_method_id = ?`).get(id);

  const compliance = db.prepare(`
    SELECT name, expires_at FROM trackers
     WHERE owner_type = 'equipment' AND sourcing_method_id = ? AND active = 1
     ORDER BY expires_at`).all(id);

  const used = db.prepare(`
    SELECT COUNT(DISTINCT r.version_id) AS versions, MAX(r.created_at) AS last
      FROM equipment_selections s JOIN calculation_runs r ON r.id = s.run_id
     WHERE s.sourcing_method_id = ?`).get(id);

  return {
    id: m.id,
    name: m.name ?? m.type_name,
    typeName: m.type_name,
    kind: m.kind,
    subtitle: m.kind === 'owned'
      ? [m.type_name, 'owned', m.in_service_at ? `in service ${m.in_service_at}` : null]
          .filter(Boolean).join(' · ')
      : [m.type_name, m.supplier_name, m.move].filter(Boolean).join(' · '),
    fit: {
      capacity: m.payload_lb ?? m.capacity_lb ?? null,
      capacityIs: m.payload_lb != null ? 'bed' : m.capacity_lb != null ? 'trailer' : null,
      tare: m.tare_weight_lb, tow: m.tow_capacity_lb,
      deckL: m.deck_length_ft, deckW: m.deck_width_ft,
      shipWeight: m.ship_weight_lb,
    },
    rate: {
      value: m.rate, basis: m.rate_basis, label: rateLabel(m.rate, m.rate_basis),
      buildUp: rateBuildUp(inputs, fuelPrices(db), fuelType),
      typed: !inputs,
    },
    specs,
    unit: m.kind === 'owned' ? {
      serial: m.serial, odometer: m.odometer_mi, odometerAt: m.odometer_at,
      inService: m.in_service_at, compliance,
    } : null,
    supplier: m.kind === 'rented' ? {
      name: m.supplier_name, phone: m.phone, account: m.account_ref,
    } : null,
    lastPaid: m.kind === 'rented' && m.last_paid_rate != null ? {
      rate: m.last_paid_rate, at: m.last_paid_at, source: m.last_paid_source,
    } : null,
    used: { versions: used?.versions ?? 0, last: used?.last ?? null },
  };
}

/* ─── fuel · one price per FUEL TYPE, not per fleet ─────────────────────── */

/**
 * A diesel F-450 and a gasoline pickup do not move together, so one global
 * number would be wrong the moment the fleet is mixed. The setting is one
 * price per fuel type and a unit's `Fuel` specification says which it uses.
 */
function fuelPrices(db) {
  const PREFIX = 'vehicle.fuel_price.';
  const rows = db.prepare(
    `SELECT key, value FROM app_settings WHERE key LIKE ?`).all(PREFIX + '%');
  const out = {};
  for (const r of rows) {
    const k = r.key.slice(PREFIX.length);
    // set_at is a DATE, not a price. Running it through Number() gave the
    // dialog "set NaN", which is what the probe caught.
    out[k] = k === 'set_at' ? r.value : Number(r.value);
  }
  return out;
}

/**
 * The preview IS the point. A button that silently rewrote every rate is the
 * kind of thing you stop trusting, so this returns what WOULD change and
 * writes nothing.
 */
function fuelPreview(db, newPrices, today) {
  const rows = db.prepare(`
    SELECT m.id, m.name, m.rate, m.rate_basis, e.name AS type_name
      FROM equipment_sourcing_methods m
      JOIN equipment e ON e.id = m.equipment_id
     WHERE m.kind = 'owned' AND m.active = 1`).all();

  const current = fuelPrices(db);
  return rows.flatMap((m) => {
    const inputs = db.prepare(
      `SELECT * FROM vehicle_rate_inputs WHERE sourcing_method_id = ?`).get(m.id);

    // ⛔ A unit with no build-up has a TYPED rate — the Bobcat is $210 a day,
    //    and there is no mileage to divide by. Recomputing cannot reach it, so
    //    it is left out of the preview entirely rather than listed at
    //    "210.0000 → 210.0000", which reads like a per-mile rate that happens
    //    not to move. The dialog says "3 of 4 units" for exactly this reason.
    if (!inputs) return [];
    const fuelType = (db.prepare(`SELECT value FROM equipment_specifications
       WHERE sourcing_method_id = ? AND name = 'Fuel'`).get(m.id)?.value ?? '').toLowerCase();

    const before = rateBuildUp(inputs, current, fuelType);
    const after  = rateBuildUp(inputs, { ...current, ...newPrices }, fuelType);

    // No engine, so fuel cannot touch it. A dialog that listed the trailer as
    // changing would be wrong in a way nobody would notice.
    const noEngine = !inputs?.mpg;
    return [{
      id: m.id, name: m.name ?? m.type_name,
      before: before?.total ?? m.rate,
      after: after?.total ?? m.rate,
      delta: (after?.total ?? m.rate) - (before?.total ?? m.rate),
      noEngine,
      changes: !noEngine && Math.abs((after?.total ?? 0) - (before?.total ?? 0)) > 1e-9,
    }];
  });
}

/**
 * Stamps computed_at on every unit it touches, which is what clears the
 * `Rate over 12 months old` counter. It reaches the NEXT calculation — never a
 * document already issued.
 */
function fuelApply(db, newPrices, today) {
  const setPrice = db.prepare(
    `INSERT INTO app_settings (key,value) VALUES (?,?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`);

  const write = db.transaction(() => {
    for (const [type, price] of Object.entries(newPrices)) {
      setPrice.run(`vehicle.fuel_price.${type}`, String(price));
    }
    setPrice.run('vehicle.fuel_price.set_at', today);

    // ⛔ Do NOT ask the preview what changed here. The new price is already
    //    written, so "before" and "after" are both the new rate and nothing
    //    looks like it moved. The preview answers a question for the USER,
    //    before the write; the write just recomputes every unit that has a
    //    build-up to recompute.
    const computed = db.prepare(`
      SELECT m.id FROM equipment_sourcing_methods m
        JOIN vehicle_rate_inputs r ON r.sourcing_method_id = m.id
       WHERE m.kind = 'owned' AND m.active = 1`).all();

    for (const p of computed) {
      const d = detail(db, p.id, today);
      const total = d.rate.buildUp?.total;
      if (total == null) continue;
      db.prepare(`UPDATE vehicle_rate_inputs
                     SET computed_rate = ?, computed_at = ?
                   WHERE sourcing_method_id = ?`).run(round4(total), today, p.id);
      db.prepare(`UPDATE equipment_sourcing_methods SET rate = ? WHERE id = ?`)
        .run(round4(total), p.id);
    }
  });
  write();
  return { ok: true };
}

const round4 = (n) => Math.round(n * 1e4) / 1e4;

module.exports = { owned, rented, detail, rateBuildUp, rateLabel,
                   fuelPrices, fuelPreview, fuelApply };
