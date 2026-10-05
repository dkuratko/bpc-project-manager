// Requirement-First calculation engine.
// Pipeline: expand -> aggregate -> procurement/disposition pricing -> cost -> issue rendition.
// Mirrors SPEC-01 Method §1-15 and SPEC-02 Part 3, using the Revision 3 table names.

const { newId } = require('./db');

// Standard ASTM rebar weight table — only exercised by the field_fabricated
// path (Decision 4's "kept alive for future assemblies" branch); the seeded
// vertical slice uses the premade path and never calls this table.
const BAR_WEIGHT_LB_PER_FT = { '#3': 0.376, '#4': 0.668, '#5': 1.043, '#6': 1.502 };

function footingGeometry(spec) {
  if (spec.shape !== 'cylindrical') throw new Error(`footing shape '${spec.shape}' not implemented in this slice`);
  const r = spec.diameter_ft / 2;
  const baseExcavationCy = (Math.PI * r * r * spec.depth_ft) / 27;
  const overdigMult = 1 + (spec.overdig_pct || 0) / 100;
  const excavationCy = baseExcavationCy * overdigMult; // over-dig inflates excavation & spoils only
  const concreteCy = Math.max(0, baseExcavationCy - spec.post_displacement_cy);
  return { excavationCy, concreteCy };
}

function effectiveSwellFactor(project, soil) {
  return project.swell_override != null ? project.swell_override : soil.swell_factor;
}

// Resolves a service's production rate for a given footing spec: an exact
// catalog match if one exists, a flat rate if the service has one, and
// otherwise a linear-by-volume interpolation between the two nearest cataloged
// specs — flagged as interpolated (or extrapolated, past either end of the
// table) in calculation_data, per SPEC-01's own instruction not to let an
// inferred number look catalog-tested.
function resolveServiceRate(db, serviceId, spec) {
  const exact = db.get(`SELECT * FROM service_rate_table WHERE service_id = ? AND spec_id = ?`, [serviceId, spec.id]);
  if (exact) return { rate: exact, meta: { interpolated: false } };

  const flat = db.get(`SELECT * FROM service_rate_table WHERE service_id = ? AND spec_id IS NULL`, [serviceId]);
  if (flat) return { rate: flat, meta: { interpolated: false, flatRate: true } };

  const targetVolume = footingGeometry(spec).excavationCy;
  const points = db
    .all(`SELECT srt.*, fs.id AS fs_id FROM service_rate_table srt JOIN footing_specs fs ON fs.id = srt.spec_id WHERE srt.service_id = ? AND srt.spec_id IS NOT NULL`, [serviceId])
    .map((r) => ({ ...r, volume: footingGeometry(db.get(`SELECT * FROM footing_specs WHERE id = ?`, [r.fs_id])).excavationCy }))
    .sort((a, b) => a.volume - b.volume);

  if (points.length === 0) throw new Error(`No production rate data at all for service ${serviceId}.`);

  let low = null, high = null;
  for (const p of points) {
    if (p.volume <= targetVolume) low = p;
    if (p.volume >= targetVolume && !high) high = p;
  }

  if (low && high && low.fs_id !== high.fs_id) {
    const frac = (targetVolume - low.volume) / (high.volume - low.volume);
    const lerp = (a, b) => a + frac * (b - a);
    return {
      rate: { labor_hr_per_ea: lerp(low.labor_hr_per_ea, high.labor_hr_per_ea), equipment_id: low.equipment_id, equipment_hr_per_ea: lerp(low.equipment_hr_per_ea, high.equipment_hr_per_ea), crew_size: Math.max(low.crew_size, high.crew_size) },
      meta: { interpolated: true, targetVolume, low: { spec: low.fs_id, volume: low.volume }, high: { spec: high.fs_id, volume: high.volume }, fraction: frac },
    };
  }

  // Target volume falls outside the catalog's tested range — nearest point, flagged.
  const nearest = low || high;
  return {
    rate: { labor_hr_per_ea: nearest.labor_hr_per_ea, equipment_id: nearest.equipment_id, equipment_hr_per_ea: nearest.equipment_hr_per_ea, crew_size: nearest.crew_size },
    meta: { interpolated: true, extrapolated: true, targetVolume, nearest: { spec: nearest.fs_id, volume: nearest.volume } },
  };
}

// -------------------------------------------------------------- expansion --

function startCalculationRun(db, versionId) {
  const prior = db.get(`SELECT COUNT(*) AS n FROM calculation_runs WHERE version_id = ?`, [versionId]);
  const runNumber = (prior.n || 0) + 1;
  const id = newId('run');
  db.run(`INSERT INTO calculation_runs (id, version_id, run_number, status) VALUES (?, ?, ?, 'running')`, [id, versionId, runNumber]);
  return id;
}

function addInstance(db, runId, { parentId = null, sourceComponentId = null, type, refId = null, bindingKey = null, quantity, unit = null, calcData = null }) {
  const id = newId('inst');
  db.run(
    `INSERT INTO project_requirement_instances
       (id, calculation_run_id, parent_instance_id, source_project_component_id, requirement_type, catalog_ref_id, binding_key, quantity, unit, calculation_data)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, runId, parentId, sourceComponentId, type, refId, bindingKey, quantity, unit, calcData ? JSON.stringify(calcData) : null]
  );
  return id;
}

function expandFieldFabricatedAssembly(db, runId, instanceId, assembly, cageCount) {
  const members = db.all(`SELECT * FROM assembly_members WHERE assembly_spec_id = ? AND purpose = 'takeoff'`, [assembly.id]);
  for (const m of members) {
    const totalLengthFt = m.qty * m.length_ft * cageCount;
    const weightPerFt = BAR_WEIGHT_LB_PER_FT[m.bar_size];
    if (!weightPerFt) throw new Error(`no weight table entry for bar size ${m.bar_size}`);
    const weightLb = totalLengthFt * weightPerFt;
    db.run(
      `INSERT INTO project_material_requirements (id, calculation_run_id, source_requirement_instance_id, material_id, quantity, unit)
       VALUES (?,?,?,?,?,?)`,
      [newId('pmr'), runId, instanceId, `mat_rebar_${m.bar_size.replace('#', '')}`, weightLb, 'LB']
    );
  }
}

// Expands one project_component's scope into requirement instances, material
// requirements, generated outputs, and labor/equipment requirements.
// `overrides` (keyed by project_component_installations.id) lets a what-if
// change-order calculation try a different footing spec without writing it
// to the live installation row until the CO is approved.
function expandComponent(db, runId, projectComponent, project, soil, overrides = {}) {
  const installation = db.get(
    `SELECT * FROM project_component_installations WHERE project_component_id = ?`,
    [projectComponent.id]
  );
  const override = overrides[installation.id];
  const profile = db.get(`SELECT * FROM component_installation_profiles WHERE id = ?`, [installation.installation_profile_id]);
  const rootId = addInstance(db, runId, {
    sourceComponentId: projectComponent.id,
    type: 'component',
    refId: projectComponent.component_id,
    quantity: projectComponent.quantity,
  });

  const requirements = db.all(
    `SELECT * FROM profile_requirements WHERE installation_profile_id = ? ORDER BY sequence_no`,
    [profile.id]
  );

  // Pass 1 — resolve specifications first so bound services can look up their geometry.
  const specByBindingKey = {};
  for (const req of requirements) {
    if (req.requirement_type !== 'specification') continue;
    const specId = override?.footingSpecOverrideId || installation.footing_spec_override_id || req.referenced_id;
    const spec = db.get(`SELECT * FROM footing_specs WHERE id = ?`, [specId]);
    const { excavationCy, concreteCy } = footingGeometry(spec);
    const count = req.quantity * projectComponent.quantity;

    const instId = addInstance(db, runId, {
      parentId: rootId, sourceComponentId: projectComponent.id, type: 'specification',
      refId: spec.id, bindingKey: req.binding_key, quantity: count, unit: 'EA',
      calcData: { excavationCyPerEa: excavationCy, concreteCyPerEa: concreteCy, code: spec.code },
    });

    db.run(
      `INSERT INTO project_material_requirements (id, calculation_run_id, source_requirement_instance_id, material_id, quantity, unit)
       VALUES (?,?,?,?,?,?)`,
      [newId('pmr'), runId, instId, 'mat_concrete', concreteCy * count, 'CY']
    );

    specByBindingKey[req.binding_key] = { spec, excavationCy, concreteCy, count, instanceId: instId };
  }

  // Pass 2 — assemblies and services.
  for (const req of requirements) {
    const count = req.quantity * projectComponent.quantity;

    if (req.requirement_type === 'assembly') {
      const assembly = db.get(`SELECT * FROM assembly_specs WHERE id = ?`, [req.referenced_id]);
      const instId = addInstance(db, runId, {
        parentId: rootId, sourceComponentId: projectComponent.id, type: 'assembly',
        refId: assembly.id, bindingKey: req.binding_key, quantity: count, unit: 'EA',
        calcData: { sourcingMode: assembly.sourcing_mode },
      });
      if (assembly.sourcing_mode === 'premade') {
        db.run(
          `INSERT INTO project_material_requirements (id, calculation_run_id, source_requirement_instance_id, material_id, quantity, unit)
           VALUES (?,?,?,?,?,?)`,
          [newId('pmr'), runId, instId, assembly.material_id, count, 'EA']
        );
      } else {
        expandFieldFabricatedAssembly(db, runId, instId, assembly, count);
      }
    }

    if (req.requirement_type === 'service') {
      const service = db.get(`SELECT * FROM services WHERE id = ?`, [req.referenced_id]);
      const bound = specByBindingKey[req.binding_key];
      if (!bound) throw new Error(`service ${service.name} bound to '${req.binding_key}' but no specification resolved for that key`);
      const { rate, meta: rateMeta } = resolveServiceRate(db, service.id, bound.spec);

      const digFactor = service.category === 'earthwork' ? soil.dig_factor : 1.0;
      const laborHours = rate.labor_hr_per_ea * count * profile.complexity_factor * digFactor;
      const equipmentHours = rate.equipment_hr_per_ea * count * digFactor;

      const instId = addInstance(db, runId, {
        parentId: rootId, sourceComponentId: projectComponent.id, type: 'service',
        refId: service.id, bindingKey: req.binding_key, quantity: count, unit: 'EA',
        calcData: { laborHours, equipmentHours, digFactor, complexityFactor: profile.complexity_factor, rate: rateMeta },
      });

      db.run(
        `INSERT INTO project_labor_requirements (id, calculation_run_id, source_requirement_instance_id, labor_role_id, hours) VALUES (?,?,?,?,?)`,
        [newId('plr'), runId, instId, 'role_laborer', laborHours]
      );
      db.run(
        `INSERT INTO project_equipment_requirements (id, calculation_run_id, source_requirement_instance_id, equipment_id, hours) VALUES (?,?,?,?,?)`,
        [newId('per'), runId, instId, rate.equipment_id, equipmentHours]
      );

      // The excavation service is the one that generates spoils (SPEC-01 §8) —
      // attached to the excavation service's own instance, not the footing spec's.
      // A split is never a flag over one bucket (Decision 7): a suspected/confirmed
      // site with a bid-time allowance percentage emits two rows that always sum
      // to what was actually generated, never a guess layered on top of it.
      if (service.category === 'earthwork') {
        const totalSpoils = bound.excavationCy * bound.count;
        const splitPct = project.contamination_status !== 'none' ? (project.contamination_split_pct || 0) : 0;
        const contaminatedQty = totalSpoils * splitPct;
        const ordinaryQty = totalSpoils - contaminatedQty;

        db.run(
          `INSERT INTO project_generated_outputs (id, calculation_run_id, source_requirement_instance_id, output_material_id, output_subtype, quantity, unit)
           VALUES (?,?,?,?, 'ordinary', ?, 'CY')`,
          [newId('pgo'), runId, instId, 'mat_spoils', ordinaryQty]
        );
        if (contaminatedQty > 0) {
          db.run(
            `INSERT INTO project_generated_outputs (id, calculation_run_id, source_requirement_instance_id, output_material_id, output_subtype, quantity, unit)
             VALUES (?,?,?,?, 'contaminated', ?, 'CY')`,
            [newId('pgo'), runId, instId, 'mat_spoils', contaminatedQty]
          );
        }
      }
    }
  }
}

// Services added straight to the version (site prep, removals, surfacing).
// They price off their own per-unit production rate, and every instance is
// tagged source 'direct' so it can never be confused with a component-pulled one.
function expandProjectService(db, runId, ps, project, soil) {
  const service = db.get(`SELECT * FROM services WHERE id = ?`, [ps.service_id]);
  if (!service) throw new Error(`project service references unknown service ${ps.service_id}`);
  const digFactor = service.category === 'earthwork' ? soil.dig_factor : 1.0;
  const laborHours = (service.labor_hr_per_unit || 0) * ps.quantity * digFactor;
  const equipmentHours = (service.equipment_hr_per_unit || 0) * ps.quantity * digFactor;

  const instId = addInstance(db, runId, {
    type: 'service', refId: service.id, quantity: ps.quantity, unit: ps.unit || service.default_unit,
    calcData: { laborHours, equipmentHours, digFactor, source: 'direct', projectServiceId: ps.id },
  });

  if (laborHours) {
    db.run(`INSERT INTO project_labor_requirements (id, calculation_run_id, source_requirement_instance_id, labor_role_id, hours) VALUES (?,?,?,?,?)`,
      [newId('plr'), runId, instId, 'role_laborer', laborHours]);
  }
  if (equipmentHours && service.equipment_id) {
    db.run(`INSERT INTO project_equipment_requirements (id, calculation_run_id, source_requirement_instance_id, equipment_id, hours) VALUES (?,?,?,?,?)`,
      [newId('per'), runId, instId, service.equipment_id, equipmentHours]);
  }
  if (service.generates_material_id && service.generates_qty_per_unit) {
    db.run(
      `INSERT INTO project_generated_outputs (id, calculation_run_id, source_requirement_instance_id, output_material_id, output_subtype, quantity, unit)
       VALUES (?,?,?,?, 'ordinary', ?, 'CY')`,
      [newId('pgo'), runId, instId, service.generates_material_id, service.generates_qty_per_unit * ps.quantity]
    );
  }
  if (service.consumes_material_id && service.consumes_qty_per_unit) {
    db.run(
      `INSERT INTO project_material_requirements (id, calculation_run_id, source_requirement_instance_id, material_id, quantity, unit)
       VALUES (?,?,?,?,?, 'CY')`,
      [newId('pmr'), runId, instId, service.consumes_material_id, service.consumes_qty_per_unit * ps.quantity]
    );
  }
  return instId;
}

function expand(db, runId, versionId, { overrides = {} } = {}) {
  const version = db.get(`SELECT * FROM estimate_versions WHERE id = ?`, [versionId]);
  const project = db.get(`SELECT * FROM projects WHERE id = ?`, [version.project_id]);
  const soil = db.get(`SELECT * FROM soil_types WHERE id = ?`, [project.soil_type_id]);
  const components = db.all(`SELECT * FROM project_components WHERE version_id = ?`, [versionId]);
  for (const pc of components) expandComponent(db, runId, pc, project, soil, overrides);
  // SPEC-01 §15 step 4: manually selected project services, expanded after scope.
  for (const ps of db.all(`SELECT * FROM project_services WHERE version_id = ? ORDER BY sequence_no`, [versionId])) {
    expandProjectService(db, runId, ps, project, soil);
  }
  return { project, soil };
}

// -------------------------------------------------------- lock enforcement --

function assertDraft(db, versionId) {
  const version = db.get(`SELECT * FROM estimate_versions WHERE id = ?`, [versionId]);
  if (version.status !== 'draft') {
    throw new Error(
      `Version ${version.version_letter} is '${version.status}', not draft — scope is locked. ` +
      `Use reopenAsNewRendition() or createChangeOrder() instead of editing it directly.`
    );
  }
}

// -------------------------------------------------------------- aggregation --

function aggregate(db, runId) {
  db.run(
    `INSERT INTO project_material_totals (calculation_run_id, material_id, required_quantity, unit)
     SELECT calculation_run_id, material_id, SUM(quantity), unit
     FROM project_material_requirements WHERE calculation_run_id = ?
     GROUP BY material_id, unit`,
    [runId]
  );
  db.run(
    `INSERT INTO project_output_totals (calculation_run_id, output_material_id, output_subtype, generated_quantity, unit)
     SELECT calculation_run_id, output_material_id, output_subtype, SUM(quantity), unit
     FROM project_generated_outputs WHERE calculation_run_id = ?
     GROUP BY output_material_id, output_subtype, unit`,
    [runId]
  );
}

// -------------------------------------------------------- procurement pricing --

function insertProcurementSelection(db, runId, materialId, method, requiredQty, purchased) {
  const materialCost = purchased * method.unit_price;
  const shortLoadApplies = method.short_load_threshold != null && purchased < method.short_load_threshold;
  const shortLoadFee = shortLoadApplies ? method.short_load_fee : 0;
  const totalCost = materialCost + method.delivery_fee + shortLoadFee;
  db.run(
    `INSERT INTO project_procurement_selections
       (id, calculation_run_id, material_id, procurement_method_id, required_quantity_snapshot, purchased_quantity, purchase_unit, unit_price, delivery_fee, short_load_fee, material_cost, total_cost)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [newId('pps'), runId, materialId, method.id, requiredQty, purchased, method.purchase_unit, method.unit_price, method.delivery_fee, shortLoadFee, materialCost, totalCost]
  );
  return { purchased, materialCost, shortLoadFee, totalCost };
}

// Splits into a stock-draw row (priced at last purchase, Decision 8) plus a
// purchase row for the shortfall when on-hand quantity doesn't cover the
// requirement — two lines, both traceable to the same material requirement,
// rather than one line pretending a single price covered the whole thing.
function priceProcurement(db, runId, materialId, procurementMethodId) {
  // Idempotent: an estimator can change their mind and re-pick a method for
  // the same material/run — without clearing the prior selection(s) first,
  // that would leave both the old and new choice counted in cost.
  db.run(`DELETE FROM project_procurement_selections WHERE calculation_run_id = ? AND material_id = ?`, [runId, materialId]);
  const total = db.get(`SELECT * FROM project_material_totals WHERE calculation_run_id = ? AND material_id = ?`, [runId, materialId]);
  const method = db.get(`SELECT * FROM procurement_methods WHERE id = ?`, [procurementMethodId]);
  let required = total.required_quantity * (1 + (method.waste_allowance_pct || 0));
  if (method.round_purchase_to) required = Math.ceil(required / method.round_purchase_to) * method.round_purchase_to;
  if (method.minimum_purchase_quantity) required = Math.max(required, method.minimum_purchase_quantity);

  if (method.method_type === 'stock' && method.stock_available_quantity != null && method.stock_available_quantity < required) {
    const stockQty = method.stock_available_quantity;
    const shortfallQty = required - stockQty;
    const stockResult = insertProcurementSelection(db, runId, materialId, method, total.required_quantity, stockQty);

    if (!method.fallback_procurement_method_id) throw new Error(`Stock method ${method.name} is short ${shortfallQty} but has no fallback_procurement_method_id configured.`);
    const fallback = db.get(`SELECT * FROM procurement_methods WHERE id = ?`, [method.fallback_procurement_method_id]);
    const purchaseResult = insertProcurementSelection(db, runId, materialId, fallback, total.required_quantity, shortfallQty);

    return {
      requiredQuantity: total.required_quantity, purchased: required, split: true,
      stock: { quantity: stockQty, cost: stockResult.totalCost }, purchase: { quantity: shortfallQty, cost: purchaseResult.totalCost },
      materialCost: stockResult.materialCost + purchaseResult.materialCost, totalCost: stockResult.totalCost + purchaseResult.totalCost,
    };
  }

  const result = insertProcurementSelection(db, runId, materialId, method, total.required_quantity, required);
  return { requiredQuantity: total.required_quantity, purchased: required, split: false, ...result };
}

// ------------------------------------------------------- disposition pricing --

function priceDisposition(db, runId, outputMaterialId, outputSubtype, dispositionMethodId, project, soil) {
  db.run(`DELETE FROM project_disposition_selections WHERE calculation_run_id = ? AND output_material_id = ? AND output_subtype = ?`, [runId, outputMaterialId, outputSubtype]);
  const total = db.get(
    `SELECT * FROM project_output_totals WHERE calculation_run_id = ? AND output_material_id = ? AND output_subtype = ?`,
    [runId, outputMaterialId, outputSubtype]
  );
  const method = db.get(`SELECT * FROM disposition_methods WHERE id = ?`, [dispositionMethodId]);
  const swell = effectiveSwellFactor(project, soil);
  const looseQuantity = total.generated_quantity * swell;

  let disposalCost, estimatedLoads = null, tonnage = null, densityUsed = null;
  if (method.billing_basis === 'per_load') {
    estimatedLoads = Math.ceil(looseQuantity / method.truck_capacity_cy);
    disposalCost = estimatedLoads * method.rate_per_load;
  } else {
    // Debris/EWF/etc. carry their own density; only bare soil-derived spoils
    // fall back to the site's soil density (open item: "density per output type").
    const material = db.get(`SELECT * FROM materials WHERE id = ?`, [outputMaterialId]);
    densityUsed = material.density_lb_per_cy != null ? material.density_lb_per_cy : soil.density_lb_per_cy;
    tonnage = (looseQuantity * densityUsed) / 2000;
    disposalCost = tonnage * method.tipping_rate_per_ton + (method.transport_flat_fee || 0);
  }

  db.run(
    `INSERT INTO project_disposition_selections
       (id, calculation_run_id, output_material_id, output_subtype, disposition_method_id, generated_quantity_snapshot, loose_quantity, billing_basis, estimated_loads, tonnage, density_used_lb_per_cy, disposal_cost, requires_manifest)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [newId('pds'), runId, outputMaterialId, outputSubtype, dispositionMethodId, total.generated_quantity, looseQuantity, method.billing_basis, estimatedLoads, tonnage, densityUsed, disposalCost, method.requires_manifest]
  );
  return { generatedQuantity: total.generated_quantity, looseQuantity, estimatedLoads, tonnage, disposalCost };
}

// ------------------------------------------------------------------- cost --

function calculateCost(db, runId, versionId) {
  // Idempotent: an interactive UI recomputes this after every procurement/
  // disposition pick, not just once at the end like the test scripts do —
  // without clearing first, each recompute would double up prior cost_lines.
  db.run(`DELETE FROM cost_lines WHERE run_id = ?`, [runId]);
  const lines = [];

  // source_id includes the originating service's catalog id (stable across
  // reruns) — two services can share a labor role or equipment resource, and
  // without this a diff across calculation runs (see change-order diffing)
  // would collide two distinct lines onto one key and silently drop a delta.
  for (const r of db.all(
    `SELECT lr.hours AS hours, lr.labor_role_id AS role_id, role.name AS role_name, role.hourly_rate AS rate, inst.catalog_ref_id AS service_id
     FROM project_labor_requirements lr
     JOIN labor_roles role ON role.id = lr.labor_role_id
     JOIN project_requirement_instances inst ON inst.id = lr.source_requirement_instance_id
     WHERE lr.calculation_run_id = ?`, [runId]
  )) {
    lines.push({ cost_type: 'labor', source_type: 'labor_role', source_id: `${r.service_id}:${r.role_id}`, description: `${r.role_name} (${r.service_id})`, quantity: r.hours, unit: 'hr', unit_cost: r.rate, extended_cost: r.hours * r.rate });
  }

  for (const r of db.all(
    `SELECT er.hours AS hours, er.equipment_id AS eq_id, eq.name AS eq_name, eq.hourly_rate AS rate, inst.catalog_ref_id AS service_id
     FROM project_equipment_requirements er
     JOIN equipment eq ON eq.id = er.equipment_id
     JOIN project_requirement_instances inst ON inst.id = er.source_requirement_instance_id
     WHERE er.calculation_run_id = ?`, [runId]
  )) {
    lines.push({ cost_type: 'equipment', source_type: 'equipment', source_id: `${r.service_id}:${r.eq_id}`, description: `${r.eq_name} (${r.service_id})`, quantity: r.hours, unit: 'hr', unit_cost: r.rate, extended_cost: r.hours * r.rate });
  }

  for (const r of db.all(`SELECT * FROM project_procurement_selections WHERE calculation_run_id = ?`, [runId])) {
    // source_id includes procurement_method_id — a stock/purchase split (see
    // priceProcurement) produces two rows for the same material and would
    // otherwise collide onto one diff key, same failure mode as the labor fix above.
    lines.push({ cost_type: 'procurement', source_type: 'material', source_id: `${r.material_id}:${r.procurement_method_id}`, description: `Procurement — ${r.material_id}`, quantity: r.purchased_quantity, unit: r.purchase_unit, unit_cost: r.unit_price, extended_cost: r.total_cost });
  }

  for (const r of db.all(`SELECT * FROM project_disposition_selections WHERE calculation_run_id = ?`, [runId])) {
    lines.push({ cost_type: 'disposition', source_type: 'output', source_id: `${r.output_material_id}:${r.output_subtype}`, description: `Disposition — ${r.output_material_id} (${r.output_subtype})`, quantity: r.tonnage || r.estimated_loads, unit: r.billing_basis === 'per_ton' ? 'ton' : 'load', unit_cost: null, extended_cost: r.disposal_cost });
  }

  for (const r of db.all(
    `SELECT cp.*, pc.id AS pc_id FROM project_component_procurement cp
     JOIN project_components pc ON pc.id = cp.project_component_id
     WHERE pc.version_id = ?`, [versionId]
  )) {
    lines.push({ cost_type: 'product', source_type: 'project_component', source_id: r.pc_id, description: `Product — ${r.vendor_name}`, quantity: r.quantity, unit: 'EA', unit_cost: r.unit_price, extended_cost: r.product_cost });
  }

  for (const l of lines) {
    db.run(
      `INSERT INTO cost_lines (id, run_id, cost_type, source_type, source_id, description, quantity, unit, unit_cost, extended_cost) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [newId('cl'), runId, l.cost_type, l.source_type, l.source_id, l.description, l.quantity, l.unit, l.unit_cost, l.extended_cost]
    );
  }

  const totals = lines.reduce((acc, l) => { acc[l.cost_type] = (acc[l.cost_type] || 0) + l.extended_cost; acc.total += l.extended_cost; return acc; }, { total: 0 });
  return { lines, totals };
}

// -------------------------------------------------------------- rendition --

function issueRendition(db, versionId, { markupPct, issuedBy = null, sentTo = null }) {
  // The UI disables the Issue button once locked, but that's the renderer being
  // polite, not a guarantee — the engine has to refuse this itself too, or a
  // second call (a bug elsewhere, a replayed request) would silently issue a
  // second rendition without ever going through reopenAsNewRendition().
  assertDraft(db, versionId);
  const version = db.get(`SELECT * FROM estimate_versions WHERE id = ?`, [versionId]);
  const project = db.get(`SELECT * FROM projects WHERE id = ?`, [version.project_id]);
  const run = db.get(`SELECT * FROM calculation_runs WHERE version_id = ? ORDER BY run_number DESC LIMIT 1`, [versionId]);
  const costLines = db.all(`SELECT * FROM cost_lines WHERE run_id = ?`, [run.id]);
  const totalCost = costLines.reduce((s, l) => s + l.extended_cost, 0);
  const contractValue = totalCost * (1 + markupPct / 100);

  const renditionNumber = version.current_rendition_number;
  const reference = `BPCe ${project.project_number}${version.version_letter}${renditionNumber}`;
  const renditionId = newId('rend');

  db.run(
    `INSERT INTO estimate_renditions (id, version_id, rendition_number, reference, status, markup_pct, total_cost, contract_value, issued_at, issued_by, sent_to, calculation_run_id)
     VALUES (?,?,?,?, 'issued', ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`,
    [renditionId, versionId, renditionNumber, reference, markupPct, totalCost, contractValue, issuedBy, sentTo, run.id]
  );

  for (const l of costLines) {
    db.run(
      `INSERT INTO estimate_rendition_lines (id, rendition_id, cost_type, source_type, source_id, description, quantity, unit, unit_cost, extended_cost) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [newId('erl'), renditionId, l.cost_type, l.source_type, l.source_id, l.description, l.quantity, l.unit, l.unit_cost, l.extended_cost]
    );
  }

  db.run(`UPDATE estimate_versions SET status = 'issued', current_rendition_number = ? WHERE id = ?`, [renditionNumber + 1, versionId]);

  return { reference, totalCost, contractValue, renditionId };
}

// ------------------------------------------------------------- reopening --

function reopenAsNewRendition(db, versionId) {
  const version = db.get(`SELECT * FROM estimate_versions WHERE id = ?`, [versionId]);
  if (version.status !== 'issued') throw new Error(`Version ${version.version_letter} is not issued — nothing to reopen.`);
  db.run(`UPDATE estimate_versions SET status = 'draft' WHERE id = ?`, [versionId]);
  // current_rendition_number was already advanced at issuance, so the next
  // issueRendition() call naturally lands on A1, A2, ... — same version, next number.
}

// -------------------------------------------------------------- change orders --

function diffCostLines(baselineLines, newLines) {
  const key = (l) => `${l.cost_type}:${l.source_id}`;
  const targetType = (costType) => ({ procurement: 'material_total', disposition: 'material_total', labor: 'service_rate', equipment: 'service_rate', product: 'scope_row' }[costType] || 'requirement');
  const describe = (l) => (l ? `${l.description} — ${l.quantity != null ? l.quantity.toFixed(3) : ''}${l.unit ? ' ' + l.unit : ''} @ $${l.extended_cost.toFixed(2)}` : '(none)');

  const baseMap = new Map(baselineLines.map((l) => [key(l), l]));
  const newMap = new Map(newLines.map((l) => [key(l), l]));
  const deltas = [];

  for (const [k, newL] of newMap) {
    const baseL = baseMap.get(k);
    const baseCost = baseL ? baseL.extended_cost : 0;
    if (Math.abs(newL.extended_cost - baseCost) > 0.005) {
      deltas.push({ target_type: targetType(newL.cost_type), target_id: newL.source_id, old_value: describe(baseL), new_value: describe(newL), cost_delta: newL.extended_cost - baseCost });
    }
  }
  for (const [k, baseL] of baseMap) {
    if (!newMap.has(k)) deltas.push({ target_type: targetType(baseL.cost_type), target_id: baseL.source_id, old_value: describe(baseL), new_value: '(removed)', cost_delta: -baseL.extended_cost });
  }
  return deltas;
}

// Re-runs the version's calculation against a baseline run's procurement/
// disposition choices, but with the CO's proposed overrides applied as a
// what-if — nothing is persisted to live scope by this step.
function recalculateWhatIf(db, versionId, baselineRunId, overrides) {
  const version = db.get(`SELECT * FROM estimate_versions WHERE id = ?`, [versionId]);
  const project = db.get(`SELECT * FROM projects WHERE id = ?`, [version.project_id]);
  const soil = db.get(`SELECT * FROM soil_types WHERE id = ?`, [project.soil_type_id]);

  const newRunId = startCalculationRun(db, versionId);
  expand(db, newRunId, versionId, { overrides });
  aggregate(db, newRunId);

  for (const sel of db.all(`SELECT * FROM project_procurement_selections WHERE calculation_run_id = ?`, [baselineRunId])) {
    priceProcurement(db, newRunId, sel.material_id, sel.procurement_method_id);
  }
  for (const sel of db.all(`SELECT * FROM project_disposition_selections WHERE calculation_run_id = ?`, [baselineRunId])) {
    priceDisposition(db, newRunId, sel.output_material_id, sel.output_subtype, sel.disposition_method_id, project, soil);
  }
  const { lines } = calculateCost(db, newRunId, versionId);
  return { newRunId, lines };
}

function createChangeOrder(db, renditionId, { reason, reference, overrides, markupPct }) {
  const rendition = db.get(`SELECT * FROM estimate_renditions WHERE id = ?`, [renditionId]);
  if (rendition.status !== 'issued') throw new Error(`Rendition ${rendition.reference} is not issued — nothing to amend.`);
  const version = db.get(`SELECT * FROM estimate_versions WHERE id = ?`, [rendition.version_id]);

  const baselineRunId = rendition.calculation_run_id; // "current approved state" — CO2 diffs against CO1's result, not A0's
  const baselineLines = db.all(`SELECT * FROM cost_lines WHERE run_id = ?`, [baselineRunId]);
  const { newRunId, lines: newLines } = recalculateWhatIf(db, version.id, baselineRunId, overrides);
  const deltas = diffCostLines(baselineLines, newLines);
  const costDelta = deltas.reduce((s, d) => s + d.cost_delta, 0);
  const priceDelta = costDelta * (1 + markupPct / 100);

  const sequenceNo = (db.get(`SELECT COUNT(*) AS n FROM change_orders WHERE rendition_id = ?`, [renditionId]).n || 0) + 1;
  const coId = newId('co');
  const coNumber = `${rendition.reference.replace('BPCe', 'BPCr')} CO${sequenceNo}`;

  db.run(
    `INSERT INTO change_orders (id, rendition_id, sequence_no, co_number, reason, reference, status, markup_pct, cost_delta, price_delta, overrides_json, baseline_calculation_run_id, draft_calculation_run_id)
     VALUES (?,?,?,?,?,?, 'draft', ?,?,?,?,?,?)`,
    [coId, renditionId, sequenceNo, coNumber, reason, reference, markupPct, costDelta, priceDelta, JSON.stringify(overrides), baselineRunId, newRunId]
  );

  for (const d of deltas) {
    // Sequencing: if a prior APPROVED CO on this rendition already touched the same
    // target, chain to that line so "as issued" reads the prior CO's result, not A0's.
    const prior = db.get(
      `SELECT col.id FROM change_order_lines col
       JOIN change_orders co ON co.id = col.change_order_id
       WHERE co.rendition_id = ? AND co.status = 'approved' AND col.target_type = ? AND col.target_id = ?
       ORDER BY co.sequence_no DESC LIMIT 1`,
      [renditionId, d.target_type, d.target_id]
    );
    db.run(
      `INSERT INTO change_order_lines (id, change_order_id, target_type, target_id, old_value, new_value, cost_delta, derived_from_co_line_id)
       VALUES (?,?,?,?,?,?,?,?)`,
      [newId('col'), coId, d.target_type, d.target_id, d.old_value, d.new_value, d.cost_delta, prior ? prior.id : null]
    );
  }

  return { id: coId, coNumber, costDelta, priceDelta, lineCount: deltas.length };
}

function submitChangeOrder(db, coId) {
  const co = db.get(`SELECT * FROM change_orders WHERE id = ?`, [coId]);
  if (co.status !== 'draft') throw new Error(`CO ${co.co_number} is '${co.status}', can only submit from draft.`);
  db.run(`UPDATE change_orders SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = ?`, [coId]);
}

function approveChangeOrder(db, coId, { approvedBy }) {
  const co = db.get(`SELECT * FROM change_orders WHERE id = ?`, [coId]);
  if (co.status !== 'submitted') throw new Error(`CO ${co.co_number} is '${co.status}', can only approve from submitted.`);

  const overrides = JSON.parse(co.overrides_json || '{}');
  for (const [installationId, ov] of Object.entries(overrides)) {
    db.run(
      `UPDATE project_component_installations SET footing_spec_override_id = ?, override_source = 'change_order', override_change_order_id = ? WHERE id = ?`,
      [ov.footingSpecOverrideId, co.id, installationId]
    );
  }
  db.run(`UPDATE estimate_renditions SET calculation_run_id = ? WHERE id = ?`, [co.draft_calculation_run_id, co.rendition_id]);
  db.run(`UPDATE change_orders SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = ? WHERE id = ?`, [approvedBy, coId]);
}

function rejectChangeOrder(db, coId, reason) {
  const co = db.get(`SELECT * FROM change_orders WHERE id = ?`, [coId]);
  if (co.status !== 'submitted') throw new Error(`CO ${co.co_number} is '${co.status}', can only reject from submitted.`);
  db.run(`UPDATE change_orders SET status = 'rejected', rejection_reason = ? WHERE id = ?`, [reason || null, coId]);
  // Nothing to revert — approve() is the only step that ever persists overrides.
}

function withdrawChangeOrder(db, coId) {
  const co = db.get(`SELECT * FROM change_orders WHERE id = ?`, [coId]);
  if (!['draft', 'submitted'].includes(co.status)) throw new Error(`CO ${co.co_number} is '${co.status}', cannot withdraw.`);
  db.run(`UPDATE change_orders SET status = 'withdrawn' WHERE id = ?`, [coId]);
}

// --------------------------------------------------- composed "current" views --

function getCurrentContractedValue(db, renditionId) {
  const rendition = db.get(`SELECT * FROM estimate_renditions WHERE id = ?`, [renditionId]);
  const approved = db.get(`SELECT COALESCE(SUM(price_delta),0) AS s FROM change_orders WHERE rendition_id = ? AND status = 'approved'`, [renditionId]);
  return { asIssued: rendition.contract_value, approvedChangeOrders: approved.s, current: rendition.contract_value + approved.s };
}

function getCurrentContractedScope(db, renditionId) {
  // What the crew actually builds: the rendition as issued, plus every approved
  // CO's effect — i.e. project_requirement_instances for the run currently
  // pointed to by estimate_renditions.calculation_run_id (promoted on each approval).
  const rendition = db.get(`SELECT * FROM estimate_renditions WHERE id = ?`, [renditionId]);
  return db.all(
    `SELECT requirement_type, catalog_ref_id, quantity, unit, binding_key FROM project_requirement_instances WHERE calculation_run_id = ?`,
    [rendition.calculation_run_id]
  );
}

// ----------------------------------------------------------------- voiding --

function voidRendition(db, renditionId, reason) {
  if (!reason) throw new Error('Voiding a rendition requires a reason.');
  const rendition = db.get(`SELECT * FROM estimate_renditions WHERE id = ?`, [renditionId]);
  if (rendition.status === 'void') throw new Error(`${rendition.reference} is already void.`);
  db.run(`UPDATE estimate_renditions SET status = 'void', voided_at = CURRENT_TIMESTAMP, void_reason = ? WHERE id = ?`, [reason, renditionId]);
  // The rendition stays in history (never deleted) — a void is a status, not an erasure.
}

// -------------------------------------------------------- catalog drift check --

// Compares a rendition's frozen requirement-instance snapshots against what the
// catalog says TODAY. A footing spec's geometry can be edited after a rendition
// freezes it (SPEC-02 open item: "catalog drift vs. a locked rendition") — this
// surfaces that silently-stale relationship instead of leaving it undetectable.
function detectCatalogDrift(db, renditionId) {
  const rendition = db.get(`SELECT * FROM estimate_renditions WHERE id = ?`, [renditionId]);
  const specInstances = db.all(
    `SELECT * FROM project_requirement_instances WHERE calculation_run_id = ? AND requirement_type = 'specification'`,
    [rendition.calculation_run_id]
  );
  const drift = [];
  for (const inst of specInstances) {
    const frozen = JSON.parse(inst.calculation_data || '{}');
    const currentSpec = db.get(`SELECT * FROM footing_specs WHERE id = ?`, [inst.catalog_ref_id]);
    if (!currentSpec) { drift.push({ specId: inst.catalog_ref_id, issue: 'deleted from catalog since issuance' }); continue; }
    const current = footingGeometry(currentSpec);
    if (Math.abs(current.excavationCy - frozen.excavationCyPerEa) > 0.001 || Math.abs(current.concreteCy - frozen.concreteCyPerEa) > 0.001) {
      drift.push({
        specId: inst.catalog_ref_id,
        issue: 'geometry changed since this rendition was issued',
        asIssued: { excavationCy: frozen.excavationCyPerEa, concreteCy: frozen.concreteCyPerEa },
        catalogToday: { excavationCy: current.excavationCy, concreteCy: current.concreteCy },
      });
    }
  }
  return drift;
}

module.exports = {
  footingGeometry, resolveServiceRate, startCalculationRun, expand, aggregate,
  priceProcurement, priceDisposition, calculateCost, issueRendition,
  assertDraft, reopenAsNewRendition, voidRendition, detectCatalogDrift,
  createChangeOrder, submitChangeOrder, approveChangeOrder, rejectChangeOrder, withdrawChangeOrder,
  getCurrentContractedValue, getCurrentContractedScope,
};
