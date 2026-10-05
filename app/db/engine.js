'use strict';

/**
 * THE ENGINE — what tabs 2, 3 and 4 display.
 *
 * Scope says what the job IS. This says what it TAKES, what that costs to
 * buy, and whose line each dollar lands on.
 *
 *   REQUIREMENTS   footings · materials · generated output · labour ·
 *                  equipment · products. NO MONEY ANYWHERE.
 *   PURCHASING     pooled across the whole job, then priced. Waste, fees and
 *                  purchase rounding live here.
 *   COST           every dollar allocated back to exactly one cost object.
 *
 * ★ THE THREE ROUNDINGS, and they are different on purpose:
 *
 *   PURCHASE      round UP to what the vendor will sell. You cannot buy
 *                 2.91 CY of ready-mix; you buy 3.50.
 *   CALCULATION   FULL PRECISION. The effective rate is carried to every
 *                 digit it has — $309.9416/CY, not $309.94.
 *   PRESENTATION  truncate to cents, then give the lost cents back by
 *                 LARGEST REMAINDER, so the parts sum to the whole exactly.
 *
 * ★ THE EFFECTIVE RATE IS OVER WHAT WAS REQUIRED, NEVER OVER WHAT WAS
 *   PURCHASED. That is the entire point of the model: waste and fees ride
 *   back to whoever caused them. Concrete lists at $185.00/CY and lands at
 *   $309.94/CY because 2.91 CY is a small order carrying a delivery fee, a
 *   short-load fee and fuel across very little volume. That is not a mistake,
 *   it is the real cost of buying concrete twice.
 *
 * ⛔ NOTHING IS EVER INTERPOLATED TO FILL A GAP. A missing rate produces a
 *    GAP, and the gap is reported. "— not selected —" is not "$0.00": one is
 *    a hole, the other is a decision.
 */

const CY_PER_CF = 1 / 27;

/* ─── geometry ──────────────────────────────────────────────────────────── */

/** A footing is pure geometry — which is why footings and materials are never
 *  short even when the hours are. */
function footingVolumeCy(spec) {
  if (spec.shape === 'cylindrical') {
    const r = spec.diameter_ft / 2;
    return Math.PI * r * r * spec.depth_ft * CY_PER_CF;
  }
  if (spec.shape === 'rectangular') {
    return spec.width_ft * spec.length_ft * spec.depth_ft * CY_PER_CF;
  }
  // A bell is a frustum; without its top diameter it is a cylinder.
  const r = spec.diameter_ft / 2;
  return Math.PI * r * r * spec.depth_ft * CY_PER_CF;
}

/* ─── tab 2 · REQUIREMENTS ──────────────────────────────────────────────── */

function requirements(db, versionId, { includeDeltas = [] } = {}) {
  const objects = db.prepare(`
    SELECT o.*, c.name AS component_name, c.manufacturer, c.part_number,
           s.name AS service_name, s.category AS service_category,
           s.binding, s.default_unit, s.duration_hr_per_unit,
           s.equipment_id AS svc_equipment_id, s.equipment_hr_per_unit,
           s.generates_material_id, s.generates_qty_per_unit,
           im.id AS method_id, im.code AS method_code, im.name AS method_name,
           im.duration_hr
      FROM cost_objects o
      LEFT JOIN components c ON c.id = o.component_id
      LEFT JOIN services s   ON s.id = o.service_id
      LEFT JOIN installation_methods im ON im.id = o.installation_method_id
     WHERE o.version_id = ?
       AND (o.delta_id IS NULL OR o.delta_id IN (${includeDeltas.map(() => '?').join(',') || "''"}))
     ORDER BY o.sequence_no`).all(versionId, ...includeDeltas);

  const specs = new Map(db.prepare(`SELECT * FROM footing_specs`).all().map((f) => [f.id, f]));
  const materials = new Map(db.prepare(`SELECT * FROM materials`).all().map((m) => [m.id, m]));
  const roles = new Map(db.prepare(`SELECT * FROM labor_roles`).all().map((r) => [r.id, r]));
  const equipTypes = new Map(db.prepare(`SELECT * FROM equipment`).all().map((e) => [e.id, e]));

  const methodReqs = db.prepare(`SELECT * FROM requirements`).all();
  const methodCrew = db.prepare(`SELECT * FROM installation_method_crew`).all();
  const svcCrew = db.prepare(`SELECT * FROM service_crew`).all();
  const svcRates = db.prepare(`SELECT * FROM service_rates`).all();
  const svcTags = db.prepare(`SELECT * FROM service_tags`).all();
  const tagsOf = (serviceId) => svcTags.filter((t) => t.service_id === serviceId)
    .map((t) => t.tag);

  const footings = [];          // { spec, qty, from }
  const matNeed = new Map();    // material_id → { qty, by: [{object, qty}] }
  const outputs = new Map();    // material_id → { bank, by: [] }
  const labour = new Map();     // role_id → { duration, crew, manHours, by: [] }
  const equipment = new Map();  // equipment_id → { hours, by: [] }
  const gaps = [];

  const addMat = (matId, qty, objId, label) => {
    if (!matNeed.has(matId)) matNeed.set(matId, { qty: 0, by: [] });
    const e = matNeed.get(matId); e.qty += qty; e.by.push({ objId, label, qty });
  };
  const addOut = (matId, bank, objId, label, tags = []) => {
    if (!outputs.has(matId)) outputs.set(matId, { bank: 0, by: [] });
    const e = outputs.get(matId); e.bank += bank;
    e.by.push({ objId, label, qty: bank, tags });
  };
  // Every contribution carries the TAGS of the work that produced it, so a
  // site condition can be applied to the digging and not to the bolting.
  const addLabour = (roleId, duration, crew, objId, label, tags = []) => {
    if (!labour.has(roleId)) labour.set(roleId, { duration: 0, crew, manHours: 0, by: [] });
    const e = labour.get(roleId);
    e.duration += duration; e.crew = Math.max(e.crew, crew);
    e.manHours += duration * crew;
    e.by.push({ objId, label, manHours: duration * crew, roleId, tags });
  };
  const addEquip = (eqId, hours, objId, label, tags = []) => {
    if (!eqId || !hours) return;
    if (!equipment.has(eqId)) equipment.set(eqId, { hours: 0, by: [] });
    const e = equipment.get(eqId); e.hours += hours;
    e.by.push({ objId, label, hours, tags });
  };

  /** The spec-bound services a footing drags in with it. */
  const footingServices = db.prepare(
    `SELECT * FROM services WHERE binding = 'spec_bound' AND binds_to_spec_type = 'footing_spec'`)
    .all();

  const applyFootings = (spec, count, objId, label) => {
    footings.push({ spec, qty: count, from: label, objId });
    const vol = footingVolumeCy(spec) * count;
    // A footing is a hole filled with concrete: it CONSUMES concrete and
    // GENERATES the soil that came out of it. Both are pure geometry.
    addMat('mat_conc', vol, objId, label);
    addOut('mat_soil', vol, objId, label, ['EXCAVATION']);

    for (const svc of footingServices) {
      const rate = svcRates.find(
        (r) => r.service_id === svc.id && r.footing_spec_id === spec.id);
      if (!rate) {
        // ⛔ NOTHING IS GUESSED. The hours simply are not known, and the tab
        //    says which ones and why.
        //    One missing rate is ONE problem, however many rows hit it — the
        //    screen counts problems, and "2 problems" must mean two things to
        //    fix, not the same thing twice.
        const key = `${svc.id}|${spec.id}`;
        const open = gaps.find((g) => g.key === key);
        if (open) open.count += count;
        else gaps.push({
          key, kind: 'unrated_service',
          subject: svc.name, spec: spec.name, count,
          message: `${svc.name} has no rate for ${spec.name}`,
        });
        continue;
      }
      const hours = rate.duration_hr_per_ea * count;
      const tags = tagsOf(svc.id);
      for (const c of svcCrew.filter((c) => c.service_id === svc.id)) {
        addLabour(c.labor_role_id, hours, c.count, objId, label, tags);
      }
      addEquip(rate.equipment_id, rate.equipment_hr_per_ea * count, objId, label, tags);
    }
  };

  for (const o of objects) {
    if (o.kind === 'scope_row') {
      const label = o.component_name;
      // Installation labour: duration is CLOCK TIME, crew turns it into
      // man-hours. Three installers on a deck is three times the man-hours.
      const dur = (o.duration_hr ?? 0) * o.quantity;
      for (const c of methodCrew.filter((c) => c.installation_method_id === o.method_id)) {
        addLabour(c.labor_role_id, dur, c.count, o.id, label, ['ASSEMBLY']);
      }
      // What the method requires — a direct-bury post needs a footing, a
      // bolt-on panel does not.
      for (const r of methodReqs.filter((r) => r.installation_method_id === o.method_id)) {
        if (r.requirement_type !== 'footing_spec') continue;
        const spec = specs.get(o.footing_override_id ?? r.referenced_id);
        if (spec) applyFootings(spec, r.quantity * o.quantity, o.id, label);
      }
    } else {
      const label = o.service_name;
      if (o.binding === 'spec_bound') {
        const spec = specs.get(o.footing_override_id);
        if (!spec) {
          gaps.push({ kind: 'unrated_service', subject: o.service_name,
                      message: `${o.service_name} has no footing spec chosen` });
          continue;
        }
        const rate = svcRates.find(
          (r) => r.service_id === o.service_id && r.footing_spec_id === spec.id);
        if (!rate) {
          gaps.push({ kind: 'unrated_service', subject: o.service_name, spec: spec.name,
                      count: o.quantity,
                      message: `${o.service_name} has no rate for ${spec.name}`,
                      detail: `The hours above exclude ${o.quantity} footings.` });
          continue;
        }
        const hours = rate.duration_hr_per_ea * o.quantity;
        const tags = tagsOf(o.service_id);
        for (const c of svcCrew.filter((c) => c.service_id === o.service_id)) {
          addLabour(c.labor_role_id, hours, c.count, o.id, label, tags);
        }
        addEquip(rate.equipment_id, rate.equipment_hr_per_ea * o.quantity, o.id, label, tags);
      } else {
        const hours = (o.duration_hr_per_unit ?? 0) * o.quantity;
        const tags = tagsOf(o.service_id);
        for (const c of svcCrew.filter((c) => c.service_id === o.service_id)) {
          addLabour(c.labor_role_id, hours, c.count, o.id, label, tags);
        }
        addEquip(o.svc_equipment_id, (o.equipment_hr_per_unit ?? 0) * o.quantity,
                 o.id, label, tags);
        if (o.generates_material_id) {
          addOut(o.generates_material_id, (o.generates_qty_per_unit ?? 0) * o.quantity,
                 o.id, label, tags);
        }
      }
    }
  }

  // Footings of the same spec pool into one line.
  const pooledFootings = [];
  for (const f of footings) {
    let e = pooledFootings.find((x) => x.spec.id === f.spec.id);
    if (!e) pooledFootings.push(e = { spec: f.spec, qty: 0, from: [] });
    e.qty += f.qty;
    e.from.push({ label: f.from, qty: f.qty, objId: f.objId });
  }

  for (const g of gaps) {
    if (g.count) g.detail = `The hours above exclude ${g.count} footing${
      g.count === 1 ? '' : 's'}.`;
  }

  return {
    objects,
    footings: pooledFootings,
    materials: [...matNeed].map(([id, v]) => ({
      material: materials.get(id), qty: v.qty, by: v.by,
    })),
    // Excavated volume BULKS UP. Bank is what the hole holds; loose is what
    // goes on the truck, and the truck is what you pay for.
    outputs: [...outputs].map(([id, v]) => {
      const m = materials.get(id);
      return { material: m, bank: v.bank, swell: m.swell_factor ?? 1,
               loose: v.bank * (m.swell_factor ?? 1), by: v.by };
    }),
    labour: [...labour].map(([id, v]) => ({ role: roles.get(id), ...v })),
    equipment: [...equipment].map(([id, v]) => ({ type: equipTypes.get(id), ...v })),
    products: [],      // the customer furnishes the equipment on this job
    gaps,
  };
}

/* ─── tab 3 · PURCHASING ────────────────────────────────────────────────── */

/** Fees are a LIST, not columns. One that does not apply is shown with its
 *  reason rather than hidden — you cannot audit a fee you cannot see. */
function applyFees(fees, { subtotal, purchased, tons }) {
  const field = { purchased_quantity: purchased, tons };
  return fees.map((f) => {
    let applies = true, reason = null;
    if (f.condition_field) {
      const v = field[f.condition_field];
      const c = f.condition_value;
      applies = { '<': v < c, '<=': v <= c, '>': v > c, '>=': v >= c }[f.condition_op] ?? true;
      reason = `${f.condition_field.replace('_', ' ')} ${f.condition_op} ${c}`;
    }
    const amount = !applies ? 0
      : f.basis === 'flat' ? f.amount
      : f.basis === 'per_unit' ? f.amount * purchased
      : subtotal * f.amount / 100;
    return { name: f.name, basis: f.basis, rate: f.amount, applies, reason, amount };
  });
}

/** PURCHASE ROUNDING — up, always, to what the vendor will actually sell. */
function roundPurchase(qty, step, minimum) {
  let q = qty;
  if (step) q = Math.ceil(q / step) * step;
  if (minimum && q < minimum) q = minimum;
  return Number(q.toFixed(6));
}

function purchasing(db, req) {
  const fees = db.prepare(`SELECT * FROM fees ORDER BY sequence_no`).all();
  const feesFor = (type, id) => fees.filter((f) => f.owner_type === type && f.owner_id === id);

  /* ── materials ─────────────────────────────────────────────────────── */
  const materials = req.materials.map((m) => {
    const method = db.prepare(`
      SELECT * FROM procurement_methods
       WHERE material_id = ? AND active = 1
       ORDER BY is_default DESC LIMIT 1`).get(m.material.id);

    if (!method) {
      return { ...m, method: null, gap: `no procurement method for ${m.material.name}` };
    }
    const wastePct = method.waste_pct ?? m.material.waste_pct ?? 0;
    const withWaste = m.qty * (1 + wastePct / 100);
    const purchased = roundPurchase(withWaste, method.round_purchase_to, method.minimum_quantity);
    const subtotal = purchased * method.unit_price;
    const feeRows = applyFees(feesFor('procurement_method', method.id),
                              { subtotal, purchased });
    const feeTotal = feeRows.reduce((t, f) => t + f.amount, 0);
    const total = subtotal + feeTotal;
    return {
      ...m, method, wastePct, purchased, unitPrice: method.unit_price,
      unit: method.purchase_unit, subtotal, fees: feeRows, feeTotal, total,
      // ★ OVER REQUIRED, never over purchased.
      effectiveRate: total / m.qty,
    };
  });

  /* ── equipment ─────────────────────────────────────────────────────── */
  const equipment = req.equipment.map((e) => {
    const method = db.prepare(`
      SELECT * FROM equipment_sourcing_methods
       WHERE equipment_id = ? AND active = 1
       ORDER BY is_default DESC, kind = 'owned' DESC LIMIT 1`).get(e.type.id);
    if (!method) {
      return { ...e, method: null, gap: `nothing sources ${e.type.name}` };
    }
    // An owned machine bills by the hour, so it has no PERIODS at all.
    // A rental bills by the day: ceil(hr ÷ 8), then the minimum.
    const perDay = method.rate_basis === 'day';
    const periods = perDay
      ? Math.max(Math.ceil(e.hours / 8), method.minimum_periods ?? 1) : null;
    const base = perDay ? periods * method.rate : e.hours * method.rate;
    const feeRows = applyFees(feesFor('equipment_sourcing_method', method.id),
                              { subtotal: base, purchased: periods ?? e.hours });
    const feeTotal = feeRows.reduce((t, f) => t + f.amount, 0);
    const total = base + feeTotal;
    return {
      ...e, method, periods, periodsNote: perDay
        ? `ceil(${e.hours.toFixed(1)} ÷ 8) = ${Math.ceil(e.hours / 8)} days` +
          (method.minimum_periods && Math.ceil(e.hours / 8) < method.minimum_periods
            ? `, raised to the ${method.minimum_periods}-day minimum` : '')
        : null,
      rate: method.rate, rateBasis: method.rate_basis,
      fees: feeRows, feeTotal, total,
      effectiveRate: total / e.hours,
    };
  });

  /* ── disposition ───────────────────────────────────────────────────── */
  const disposition = req.outputs.map((o) => {
    const method = db.prepare(`
      SELECT * FROM disposition_methods
       WHERE material_id = ? AND active = 1
       ORDER BY is_default DESC LIMIT 1`).get(o.material.id);

    if (!method) {
      // ⛔ "— not selected —" IS NOT "$0.00". An output with no disposition is
      //    a hole in the estimate, not a free one.
      return { ...o, method: null, total: null,
               gap: `${o.material.name} has no disposition` };
    }
    const tons = o.loose * (o.material.density_lb_per_cy ?? 0) / 2000;
    const loads = method.truck_capacity_cy ? Math.ceil(o.loose / method.truck_capacity_cy) : null;
    const base = method.billing_basis === 'per_ton' ? tons * method.rate
               : method.billing_basis === 'per_load' ? (loads ?? 0) * method.rate : 0;
    const feeRows = applyFees(feesFor('disposition_method', method.id),
                              { subtotal: base, purchased: o.loose, tons });
    const feeTotal = feeRows.reduce((t, f) => t + f.amount, 0);
    const total = base + feeTotal;
    return {
      ...o, method, tons, loads, basis: method.billing_basis, rate: method.rate,
      base, fees: feeRows, feeTotal, total,
      // ★ Over BANK quantity — what the hole held, not what bulked onto the truck.
      effectiveRate: total / o.bank,
    };
  });

  return { materials, equipment, disposition, products: [] };
}

/* ─── tab 4 · COST · every dollar lands on exactly one object ───────────── */

/**
 * PRESENTATION ROUNDING. Truncate each share to cents, then hand the lost
 * cents back to the largest discarded fractions, so the parts sum to the
 * whole EXACTLY. Floors alone leave the total a cent or two short, and a
 * total that does not reconcile is the one thing this screen cannot do.
 */
function largestRemainder(shares, total) {
  const cents = Math.round(total * 100);
  const raw = shares.map((s) => s * cents);
  const floors = raw.map(Math.floor);
  let left = cents - floors.reduce((t, n) => t + n, 0);
  const order = raw.map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const out = floors.slice();
  for (let k = 0; k < left; k++) out[order[k % order.length].i]++;
  return out.map((c) => c / 100);
}

function allocate(req, buy) {
  const lines = [];   // { objId, type, description, qty, unit, unitCost, cost }

  const spread = (contributors, total, make) => {
    if (total == null || !contributors.length) return;
    const sum = contributors.reduce((t, c) => t + c.qty, 0) || 1;
    const amounts = largestRemainder(contributors.map((c) => c.qty / sum), total);
    contributors.forEach((c, i) => lines.push(make(c, amounts[i], total / sum)));
  };

  for (const m of buy.materials) {
    spread(m.by, m.total, (c, amount, rate) => ({
      objId: c.objId, type: 'procurement', description: m.material.name,
      qty: c.qty, unit: m.unit, unitCost: rate, cost: amount,
    }));
  }
  for (const e of buy.equipment) {
    spread(e.by.map((b) => ({ ...b, qty: b.hours })), e.total, (c, amount, rate) => ({
      objId: c.objId, type: 'equipment', description: e.type.name,
      qty: c.hours, unit: 'hr', unitCost: rate, cost: amount, tags: c.tags ?? [],
    }));
  }
  for (const d of buy.disposition) {
    if (d.total == null) continue;     // a hole, not a zero — reported, not costed
    spread(d.by, d.total, (c, amount, rate) => ({
      objId: c.objId, type: 'disposition', description: d.material.name,
      qty: c.qty, unit: 'CY', unitCost: rate, cost: amount, tags: c.tags ?? [],
    }));
  }
  // Labour is not pooled — a man-hour costs what the role costs, wherever it
  // is worked, so it needs no allocation at all.
  for (const l of req.labour) {
    for (const b of l.by) {
      lines.push({
        objId: b.objId, type: 'labor', description: l.role.name,
        qty: b.manHours, unit: 'man-hr', unitCost: l.role.hourly_rate,
        cost: Math.round(b.manHours * l.role.hourly_rate * 100) / 100,
        tags: b.tags ?? [],
      });
    }
  }
  return lines;
}

/* ─── the whole calculation ─────────────────────────────────────────────── */

function calculate(db, versionId, { includeDeltas = [] } = {}) {
  const req = requirements(db, versionId, { includeDeltas });
  const buy = purchasing(db, req);
  const lines = allocate(req, buy);

  const v = db.prepare(`SELECT * FROM versions WHERE id = ?`).get(versionId);
  const conditions = db.prepare(`
    SELECT c.* FROM project_conditions c
      JOIN versions v ON v.project_id = c.project_id
     WHERE v.id = ?`).all(versionId);

  /* ── conditions apply BY TAG, not across the board ────────────────────
     Hard clay slows the digging. It does not slow bolting a panel on, and it
     certainly does not make concrete cost more per yard. A condition carries
     tags and multiplies only the work that carries the same tag — which is
     what project_condition_tags and service_tags are for.
     Materials are never touched: a condition changes how long work takes,
     not what a vendor charges. */
  const condTags = db.prepare(`SELECT * FROM project_condition_tags`).all();
  const tagsFor = (cid) => condTags.filter((t) => t.condition_id === cid).map((t) => t.tag);
  const effortful = new Set(['labor', 'equipment', 'disposition']);
  const factor = conditions.reduce((t, c) => t * c.multiplier, 1);

  let cost = 0, adjusted = 0;
  for (const l of lines) {
    const lineTags = new Set(l.tags ?? []);
    l.conditionMultiplier = !effortful.has(l.type) ? 1
      : conditions.reduce((t, c) => {
          const want = tagsFor(c.id);
          // An UNTAGGED condition is a blanket one and applies to all effort.
          const hits = want.length === 0 || want.some((x) => lineTags.has(x));
          return hits ? t * c.multiplier : t;
        }, 1);
    l.extendedCost = Math.round(l.cost * l.conditionMultiplier * 100) / 100;
    cost += l.cost;
    adjusted += l.extendedCost;
  }
  cost = Math.round(cost * 100) / 100;
  adjusted = Math.round(adjusted * 100) / 100;

  const contingency = Math.round(adjusted * (v.contingency_pct ?? 0)) / 100;
  const markup = Math.round(adjusted * (v.markup_pct ?? 0)) / 100;
  const price = Math.round((adjusted + contingency + markup) * 100) / 100;

  const gaps = [
    ...req.gaps,
    ...buy.materials.filter((m) => m.gap).map((m) => ({ kind: 'no_procurement', message: m.gap })),
    ...buy.equipment.filter((e) => e.gap).map((e) => ({ kind: 'no_procurement', message: e.gap })),
    ...buy.disposition.filter((d) => d.gap).map((d) => ({ kind: 'no_disposition', message: d.gap })),
  ];

  return {
    versionId, requirements: req, purchasing: buy, lines,
    conditions, conditionFactor: factor,
    money: {
      cost, conditions: Math.round((adjusted - cost) * 100) / 100, adjusted,
      contingency, contingencyPct: v.contingency_pct,
      markup, markupPct: v.markup_pct, price,
    },
    gaps,
  };
}

/** Persist a run. The engine recomputes; the run is the record of what it said. */
function persist(db, versionId, result, { purpose = 'base', today } = {}) {
  const next = (db.prepare(
    `SELECT MAX(run_number) n FROM calculation_runs WHERE version_id = ?`)
    .get(versionId).n ?? 0) + 1;
  const runId = `run_${versionId}_${next}`;

  db.transaction(() => {
    db.prepare(`INSERT INTO calculation_runs
      (id,version_id,run_number,purpose,status,total_cost,adjusted_cost,
       computed_price,created_at) VALUES (?,?,?,?,'complete',?,?,?,?)`)
      .run(runId, versionId, next, purpose, result.money.cost,
           result.money.adjusted, result.money.price, today);

    const CL = db.prepare(`INSERT INTO cost_lines
      (id,run_id,cost_object_id,cost_type,description,quantity,unit,unit_cost,
       base_cost,condition_multiplier,extended_cost)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
    result.lines.forEach((l, i) => CL.run(`cl_${runId}_${i}`, runId, l.objId, l.type,
      l.description, l.qty, l.unit, l.unitCost, l.cost, l.conditionMultiplier, l.extendedCost));

    // What the run CHOSE. This is the record the equipment audit reads to
    // answer "has anything used this machine lately" — without it, a machine
    // on every job still looks unused.
    const ES = db.prepare(`INSERT INTO equipment_selections
      (id,run_id,equipment_id,sourcing_method_id,required_hours,periods,
       rate,rate_basis,base_cost,fee_total,total_cost,effective_rate)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    result.purchasing.equipment.filter((e) => e.method).forEach((e, i) =>
      ES.run(`es_${runId}_${i}`, runId, e.type.id, e.method.id, e.hours,
             e.periods ?? e.hours, e.rate, e.rateBasis,
             e.total - e.feeTotal, e.feeTotal, e.total, e.effectiveRate));

    const G = db.prepare(`INSERT INTO calculation_gaps
      (id,run_id,kind,subject_type,subject_id,message) VALUES (?,?,?,?,?,?)`);
    result.gaps.forEach((g, i) =>
      G.run(`gap_${runId}_${i}`, runId, g.kind, null, null, g.message));
  })();

  return runId;
}

module.exports = { calculate, requirements, purchasing, allocate,
                   largestRemainder, footingVolumeCy, persist };
