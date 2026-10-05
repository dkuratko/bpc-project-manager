const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { openDb } = require('./engine/db');
const engine = require('./engine/engine');
const { seed, addPlaygroundPosts, addSiteServices, seedExtraProjects } = require('./engine/seed');

// One shared engine database for the whole app's lifetime. Opened once,
// resolved before any window is created so every IPC handler below can use
// `await getDb()` without racing app startup.
let dbPromise = null;
function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const fs = require('fs');
      const isFirstRun = !fs.existsSync(require('./engine/db').DB_PATH);
      const db = await openDb();
      if (isFirstRun) {
        seed(db);
        addPlaygroundPosts(db);
        addSiteServices(db);
        seedExtraProjects(db);
        db.save();
      }
      return db;
    })();
  }
  return dbPromise;
}

// ------------------------------------------------------------ estimating IPC --
// Thin pass-through handlers: the engine (engine/engine.js) holds all the real
// logic; this layer only marshals arguments and saves to disk after writes.
function registerEstimatingIpc() {
  const h = (channel, fn) => ipcMain.handle(channel, async (_e, ...args) => {
    const db = await getDb();
    try {
      return { ok: true, data: await fn(db, ...args) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // Projects page: every project with a one-line summary of its versions and
  // the value of whatever was last issued.
  h('est:listProjects', (db) => {
    const projects = db.all(`SELECT * FROM projects ORDER BY project_number`);
    return projects.map((p) => {
      const versions = db.all(`SELECT * FROM estimate_versions WHERE project_id = ? ORDER BY version_letter`, [p.id]);
      let latest = null;
      for (const v of versions) {
        const r = db.get(`SELECT * FROM estimate_renditions WHERE version_id = ? AND status = 'issued' ORDER BY rendition_number DESC LIMIT 1`, [v.id]);
        if (r && (!latest || (r.issued_at || '') > (latest.issued_at || ''))) latest = r;
      }
      const coDelta = latest
        ? db.get(`SELECT COALESCE(SUM(price_delta),0) AS s FROM change_orders WHERE rendition_id = ? AND status = 'approved'`, [latest.id]).s
        : 0;
      const sell = latest ? latest.contract_value + coDelta : null;
      const margin = latest && sell ? ((sell - latest.total_cost) / sell) * 100 : null;
      return {
        id: p.id, number: p.project_number, name: p.name, customer: p.customer,
        stage: p.stage, bidDue: p.bid_due,
        versions: versions.map((v) => ({ id: v.id, letter: v.version_letter, name: v.name, status: v.status })),
        latestReference: latest ? latest.reference : null,
        sell, margin,
      };
    });
  });

  h('est:getProject', (db, projectId) => {
    const project = db.get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    const soil = project.soil_type_id ? db.get(`SELECT * FROM soil_types WHERE id = ?`, [project.soil_type_id]) : null;
    const versions = db.all(`SELECT * FROM estimate_versions WHERE project_id = ? ORDER BY version_letter`, [projectId]).map((v) => {
      const renditions = db.all(`SELECT * FROM estimate_renditions WHERE version_id = ? ORDER BY rendition_number`, [v.id]);
      const latest = renditions.filter((r) => r.status === 'issued').slice(-1)[0] || null;
      const cos = latest ? db.all(`SELECT * FROM change_orders WHERE rendition_id = ? ORDER BY sequence_no`, [latest.id]) : [];
      const approved = cos.filter((c) => c.status === 'approved').reduce((s, c) => s + (c.price_delta || 0), 0);
      const componentCount = db.get(`SELECT COUNT(*) AS n FROM project_components WHERE version_id = ?`, [v.id]).n;
      return {
        id: v.id, letter: v.version_letter, name: v.name, status: v.status,
        componentCount, renditions, latest, changeOrders: cos,
        contractValue: latest ? latest.contract_value + approved : null,
      };
    });
    return { project, soil, versions };
  });

  h('est:getScope', (db, versionId) => {
    const version = db.get(`SELECT * FROM estimate_versions WHERE id = ?`, [versionId]);
    const project = db.get(`SELECT * FROM projects WHERE id = ?`, [version.project_id]);
    const components = db.all(
      `SELECT pc.id, pc.quantity, pc.component_id, c.name AS component_name,
              cp.id AS installation_id, cp.installation_profile_id, cp.footing_spec_override_id,
              pcp.vendor_name, pcp.product_cost
       FROM project_components pc
       JOIN components c ON c.id = pc.component_id
       LEFT JOIN project_component_installations cp ON cp.project_component_id = pc.id
       LEFT JOIN project_component_procurement pcp ON pcp.project_component_id = pc.id
       WHERE pc.version_id = ?`,
      [versionId]
    );
    const latestRendition = db.get(
      `SELECT * FROM estimate_renditions WHERE version_id = ? ORDER BY rendition_number DESC LIMIT 1`,
      [versionId]
    );
    const soil = project.soil_type_id ? db.get(`SELECT * FROM soil_types WHERE id = ?`, [project.soil_type_id]) : null;
    return { project, version, soil, components, latestRendition };
  });

  // Resolved installation per scope row: which footing spec actually applies
  // (catalog default or project override) and what one of them generates.
  h('est:getInstallationDetail', (db, versionId) => {
    const rows = db.all(
      `SELECT pc.id AS pcid, pc.quantity, c.name AS component_name,
              cp.id AS installation_id, cp.footing_spec_override_id,
              prof.name AS profile_name, prof.complexity_factor, prof.id AS profile_id
       FROM project_components pc
       JOIN components c ON c.id = pc.component_id
       JOIN project_component_installations cp ON cp.project_component_id = pc.id
       JOIN component_installation_profiles prof ON prof.id = cp.installation_profile_id
       WHERE pc.version_id = ?`,
      [versionId]
    );
    return rows.map((r) => {
      const specReq = db.get(
        `SELECT * FROM profile_requirements WHERE installation_profile_id = ? AND requirement_type = 'specification' ORDER BY sequence_no LIMIT 1`,
        [r.profile_id]
      );
      const specId = r.footing_spec_override_id || (specReq && specReq.referenced_id);
      const spec = specId ? db.get(`SELECT * FROM footing_specs WHERE id = ?`, [specId]) : null;
      const geom = spec ? engine.footingGeometry(spec) : { excavationCy: null, concreteCy: null };
      return {
        projectComponentId: r.pcid,
        componentName: r.component_name,
        profileName: r.profile_name,
        complexityFactor: r.complexity_factor,
        footingCode: spec ? spec.code : '—',
        overridden: !!r.footing_spec_override_id,
        footingCount: (specReq ? specReq.quantity : 0) * r.quantity,
        excavationCyEach: geom.excavationCy,
        concreteCyEach: geom.concreteCy,
      };
    });
  });

  // The Scope page's expandable tree: each scope row with the requirements it
  // pulled in, their hours, and what each one generates — read back out of the
  // run's requirement-instance graph rather than recomputed.
  h('est:getScopeTree', (db, versionId, runId) => {
    if (!runId) return [];
    const laborRate = (db.get(`SELECT hourly_rate FROM labor_roles LIMIT 1`) || {}).hourly_rate || 0;
    const roots = db.all(
      `SELECT i.*, c.name AS component_name, pc.quantity AS pc_qty, pc.id AS pc_id
       FROM project_requirement_instances i
       JOIN project_components pc ON pc.id = i.source_project_component_id
       JOIN components c ON c.id = pc.component_id
       WHERE i.calculation_run_id = ? AND i.requirement_type = 'component'`,
      [runId]
    );

    return roots.map((root) => {
      const kids = db.all(`SELECT * FROM project_requirement_instances WHERE calculation_run_id = ? AND parent_instance_id = ? ORDER BY rowid`, [runId, root.id]);
      let laborHr = 0, equipHr = 0;
      const requirements = kids.map((k) => {
        const cd = k.calculation_data ? JSON.parse(k.calculation_data) : {};
        const mats = db.all(`SELECT material_id, quantity, unit FROM project_material_requirements WHERE source_requirement_instance_id = ?`, [k.id]);
        const outs = db.all(`SELECT output_material_id, output_subtype, quantity, unit FROM project_generated_outputs WHERE source_requirement_instance_id = ?`, [k.id]);
        const lab = db.get(`SELECT COALESCE(SUM(hours),0) AS h FROM project_labor_requirements WHERE source_requirement_instance_id = ?`, [k.id]).h || 0;
        const eq = db.get(`SELECT COALESCE(SUM(hours),0) AS h FROM project_equipment_requirements WHERE source_requirement_instance_id = ?`, [k.id]).h || 0;
        laborHr += lab; equipHr += eq;

        let label = k.catalog_ref_id, assumption = '';
        if (k.requirement_type === 'specification') {
          const spec = db.get(`SELECT * FROM footing_specs WHERE id = ?`, [k.catalog_ref_id]);
          label = `Required footings — spec ${spec ? spec.code : '?'}`;
          assumption = spec ? `${spec.diameter_ft}′ dia × ${spec.depth_ft}′ deep` : '';
        } else if (k.requirement_type === 'assembly') {
          const a = db.get(`SELECT * FROM assembly_specs WHERE id = ?`, [k.catalog_ref_id]);
          label = a ? a.name : k.catalog_ref_id;
          assumption = a ? (a.sourcing_mode === 'premade' ? 'premade — purchased whole' : 'field-fabricated') : '';
        } else if (k.requirement_type === 'service') {
          const s = db.get(`SELECT * FROM services WHERE id = ?`, [k.catalog_ref_id]);
          label = s ? s.name : k.catalog_ref_id;
          const bits = [];
          if (cd.rate && cd.rate.interpolated) bits.push('rate interpolated');
          if (cd.digFactor && cd.digFactor !== 1) bits.push(`dig ×${cd.digFactor}`);
          if (cd.complexityFactor && cd.complexityFactor !== 1) bits.push(`complexity ×${cd.complexityFactor}`);
          assumption = bits.join(' · ');
        }

        const gen = [
          ...mats.map((m) => `${m.material_id} ${m.quantity.toFixed(2)} ${m.unit}`),
          ...outs.map((o) => `${o.output_material_id} ${o.quantity.toFixed(2)} ${o.unit}`),
        ].join(' · ');

        return { kind: k.requirement_type, label, qty: k.quantity, assumption, laborHr: lab, equipHr: eq, generates: gen, interpolated: !!(cd.rate && cd.rate.interpolated) };
      });

      const equipCost = db.get(
        `SELECT COALESCE(SUM(er.hours * e.hourly_rate),0) AS c
         FROM project_equipment_requirements er
         JOIN equipment e ON e.id = er.equipment_id
         JOIN project_requirement_instances i ON i.id = er.source_requirement_instance_id
         WHERE i.parent_instance_id = ?`, [root.id]
      ).c || 0;
      const product = db.get(`SELECT COALESCE(SUM(product_cost),0) AS c FROM project_component_procurement WHERE project_component_id = ?`, [root.pc_id]).c || 0;

      return {
        projectComponentId: root.pc_id,
        name: root.component_name,
        qty: root.pc_qty,
        laborHr, equipHr,
        laborCost: laborHr * laborRate,
        equipCost,
        productCost: product,
        directCost: product + laborHr * laborRate + equipCost,
        requirements,
      };
    });
  });

  // Services added directly to the version, with their expanded hours read back
  // from the run so the Scope page can show what each one actually cost in work.
  h('est:getProjectServices', (db, versionId, runId) => {
    const rows = db.all(
      `SELECT ps.*, s.name, s.category, s.default_unit, s.labor_hr_per_unit, s.equipment_hr_per_unit,
              s.generates_material_id, s.generates_qty_per_unit, s.consumes_material_id, s.consumes_qty_per_unit
       FROM project_services ps JOIN services s ON s.id = ps.service_id
       WHERE ps.version_id = ? ORDER BY ps.sequence_no`, [versionId]
    );
    if (!runId) return rows.map((r) => ({ ...r, laborHr: null, equipHr: null }));
    return rows.map((r) => {
      const inst = db.all(`SELECT * FROM project_requirement_instances WHERE calculation_run_id = ? AND requirement_type = 'service' AND catalog_ref_id = ?`, [runId, r.service_id])
        .find((i) => { try { return JSON.parse(i.calculation_data || '{}').projectServiceId === r.id; } catch { return false; } });
      if (!inst) return { ...r, laborHr: null, equipHr: null };
      const lab = db.get(`SELECT COALESCE(SUM(hours),0) AS h FROM project_labor_requirements WHERE source_requirement_instance_id = ?`, [inst.id]).h;
      const eq = db.get(`SELECT COALESCE(SUM(hours),0) AS h FROM project_equipment_requirements WHERE source_requirement_instance_id = ?`, [inst.id]).h;
      const outs = db.all(`SELECT output_material_id, quantity, unit FROM project_generated_outputs WHERE source_requirement_instance_id = ?`, [inst.id]);
      const mats = db.all(`SELECT material_id, quantity, unit FROM project_material_requirements WHERE source_requirement_instance_id = ?`, [inst.id]);
      const cd = (() => { try { return JSON.parse(inst.calculation_data || '{}'); } catch { return {}; } })();
      return {
        ...r, laborHr: lab, equipHr: eq, digFactor: cd.digFactor,
        generates: outs.map((o) => `${o.output_material_id} ${o.quantity.toFixed(2)} ${o.unit}`).join(' · '),
        consumes: mats.map((m) => `consumes ${m.material_id} ${m.quantity.toFixed(2)} ${m.unit}`).join(' · '),
      };
    });
  });

  // Catalog search for the Add-to-scope rail.
  h('est:searchCatalog', (db, kind, term) => {
    const like = `%${(term || '').toLowerCase()}%`;
    if (kind === 'svc') {
      return db.all(`SELECT id, name, category AS sub, default_unit AS unit FROM services WHERE active = 1 AND estimation_method = 'per_unit' AND lower(name) LIKE ? ORDER BY name`, [like]);
    }
    if (kind === 'spec') {
      return db.all(`SELECT id, code AS name, shape AS sub FROM footing_specs WHERE active = 1 AND lower(code) LIKE ? ORDER BY code`, [like]);
    }
    return db.all(
      `SELECT c.id, c.name, c.model AS sub,
              (SELECT COUNT(*) FROM component_installation_profiles p WHERE p.component_id = c.id) AS profiles
       FROM components c WHERE c.active = 1 AND lower(c.name) LIKE ? ORDER BY c.name`, [like]
    );
  });

  h('est:addComponentToScope', (db, versionId, componentId) => {
    engine.assertDraft(db, versionId);
    const profile = db.get(`SELECT * FROM component_installation_profiles WHERE component_id = ? AND active = 1 ORDER BY rowid LIMIT 1`, [componentId]);
    if (!profile) throw new Error('That component has no installation profile configured.');
    const pcId = `pc_${Math.random().toString(36).slice(2, 9)}`;
    db.run(`INSERT INTO project_components (id, version_id, component_id, quantity) VALUES (?,?,?,1)`, [pcId, versionId, componentId]);
    db.run(`INSERT INTO project_component_installations (id, project_component_id, installation_profile_id) VALUES (?,?,?)`, [`pci_${pcId}`, pcId, profile.id]);
    db.save();
    return { projectComponentId: pcId };
  });

  h('est:addServiceToScope', (db, versionId, serviceId, quantity) => {
    engine.assertDraft(db, versionId);
    const svc = db.get(`SELECT * FROM services WHERE id = ?`, [serviceId]);
    const n = db.get(`SELECT COUNT(*) AS n FROM project_services WHERE version_id = ?`, [versionId]).n;
    db.run(`INSERT INTO project_services (id, version_id, service_id, quantity, unit, sequence_no) VALUES (?,?,?,?,?,?)`,
      [`psv_${Math.random().toString(36).slice(2, 9)}`, versionId, serviceId, quantity || 1, svc.default_unit, n + 1]);
    db.save();
    return { ok: true };
  });

  h('est:removeFromScope', (db, kind, id) => {
    if (kind === 'component') {
      const row = db.get(`SELECT version_id FROM project_components WHERE id = ?`, [id]);
      engine.assertDraft(db, row.version_id);
      db.run(`DELETE FROM project_component_procurement WHERE project_component_id = ?`, [id]);
      db.run(`DELETE FROM project_component_installations WHERE project_component_id = ?`, [id]);
      db.run(`DELETE FROM project_components WHERE id = ?`, [id]);
    } else {
      const row = db.get(`SELECT version_id FROM project_services WHERE id = ?`, [id]);
      engine.assertDraft(db, row.version_id);
      db.run(`DELETE FROM project_services WHERE id = ?`, [id]);
    }
    db.save();
    return { ok: true };
  });

  h('est:setServiceQuantity', (db, projectServiceId, quantity) => {
    const row = db.get(`SELECT version_id FROM project_services WHERE id = ?`, [projectServiceId]);
    engine.assertDraft(db, row.version_id);
    db.run(`UPDATE project_services SET quantity = ? WHERE id = ?`, [quantity, projectServiceId]);
    db.save();
    return { ok: true };
  });

  // What the catalog would have used, so an override can show the value it replaced.
  h('est:getCatalogFooting', (db, installationId) => {
    const inst = db.get(`SELECT * FROM project_component_installations WHERE id = ?`, [installationId]);
    const req = db.get(`SELECT * FROM profile_requirements WHERE installation_profile_id = ? AND requirement_type = 'specification' ORDER BY sequence_no LIMIT 1`, [inst.installation_profile_id]);
    const spec = req ? db.get(`SELECT * FROM footing_specs WHERE id = ?`, [req.referenced_id]) : null;
    return spec ? { id: spec.id, code: spec.code } : null;
  });

  h('est:revertFootingOverride', (db, installationId) => {
    const inst = db.get(`SELECT pc.version_id AS vid FROM project_component_installations cp JOIN project_components pc ON pc.id = cp.project_component_id WHERE cp.id = ?`, [installationId]);
    engine.assertDraft(db, inst.vid);
    db.run(`UPDATE project_component_installations SET footing_spec_override_id = NULL, override_source = NULL, override_change_order_id = NULL WHERE id = ?`, [installationId]);
    db.save();
    return { ok: true };
  });

  h('est:listProfiles', (db, componentId) => db.all(`SELECT * FROM component_installation_profiles WHERE component_id = ? AND active = 1`, [componentId]));

  h('est:setInstallationProfile', (db, installationId, profileId) => {
    const inst = db.get(`SELECT pc.version_id AS vid FROM project_component_installations cp JOIN project_components pc ON pc.id = cp.project_component_id WHERE cp.id = ?`, [installationId]);
    engine.assertDraft(db, inst.vid);
    db.run(`UPDATE project_component_installations SET installation_profile_id = ? WHERE id = ?`, [profileId, installationId]);
    db.save();
    return { ok: true };
  });

  h('est:calculate', (db, versionId) => {
    const runId = engine.startCalculationRun(db, versionId);
    engine.expand(db, runId, versionId);
    engine.aggregate(db, runId);
    const materialTotals = db.all(`SELECT * FROM project_material_totals WHERE calculation_run_id = ?`, [runId]);
    const outputTotals = db.all(`SELECT * FROM project_output_totals WHERE calculation_run_id = ?`, [runId]);
    db.save();
    return { runId, materialTotals, outputTotals };
  });

  h('est:listProcurementMethods', (db, materialId) => db.all(`SELECT * FROM procurement_methods WHERE material_id = ? AND active = 1`, [materialId]));
  h('est:priceProcurement', (db, runId, materialId, methodId) => {
    const result = engine.priceProcurement(db, runId, materialId, methodId);
    db.save();
    return result;
  });

  h('est:listDispositionMethods', (db, outputMaterialId) => db.all(`SELECT * FROM disposition_methods WHERE output_material_id = ? AND active = 1`, [outputMaterialId]));
  h('est:priceDisposition', (db, runId, outputMaterialId, subtype, methodId) => {
    const run = db.get(`SELECT * FROM calculation_runs WHERE id = ?`, [runId]);
    const version = db.get(`SELECT * FROM estimate_versions WHERE id = ?`, [run.version_id]);
    const project = db.get(`SELECT * FROM projects WHERE id = ?`, [version.project_id]);
    const soil = db.get(`SELECT * FROM soil_types WHERE id = ?`, [project.soil_type_id]);
    const result = engine.priceDisposition(db, runId, outputMaterialId, subtype, methodId, project, soil);
    db.save();
    return result;
  });

  // Re-adopt an existing run (e.g. the one an issued rendition froze) so
  // reopening a version shows its real figures instead of an empty shell.
  h('est:getRunTotals', (db, runId) => {
    if (!runId) return { materialTotals: [], outputTotals: [] };
    return {
      materialTotals: db.all(`SELECT * FROM project_material_totals WHERE calculation_run_id = ?`, [runId]),
      outputTotals: db.all(`SELECT * FROM project_output_totals WHERE calculation_run_id = ?`, [runId]),
    };
  });

  // Cost page sections 1-3: work by source, priced procurement, priced disposition.
  h('est:getCostDetail', (db, runId) => {
    if (!runId) return { procurement: [], disposition: [], costLines: [] };
    const procurement = db.all(
      `SELECT s.*, m.name AS method_name, m.method_type
       FROM project_procurement_selections s
       JOIN procurement_methods m ON m.id = s.procurement_method_id
       WHERE s.calculation_run_id = ?`, [runId]
    );
    const disposition = db.all(
      `SELECT s.*, m.name AS method_name, m.method_type
       FROM project_disposition_selections s
       JOIN disposition_methods m ON m.id = s.disposition_method_id
       WHERE s.calculation_run_id = ?`, [runId]
    );
    const costLines = db.all(`SELECT * FROM cost_lines WHERE run_id = ?`, [runId]);
    const product = db.all(
      `SELECT cp.*, c.name AS component_name FROM project_component_procurement cp
       JOIN project_components pc ON pc.id = cp.project_component_id
       JOIN components c ON c.id = pc.component_id`
    );
    return { procurement, disposition, costLines, product };
  });

  // Estimate page: the full rendition history with what each CO did.
  h('est:getRenditions', (db, versionId) => {
    const renditions = db.all(`SELECT * FROM estimate_renditions WHERE version_id = ? ORDER BY rendition_number`, [versionId]);
    return renditions.map((r) => ({
      ...r,
      changeOrders: db.all(`SELECT * FROM change_orders WHERE rendition_id = ? ORDER BY sequence_no`, [r.id]),
    }));
  });

  // Estimate page checklist: everything that would block issuing, computed
  // against the current run rather than trusted to the estimator's memory.
  h('est:getIssueChecklist', (db, versionId, runId) => {
    const checks = [];
    if (!runId) {
      checks.push({ ok: false, label: 'No calculation has been run for this version' });
      return checks;
    }
    const mats = db.all(`SELECT * FROM project_material_totals WHERE calculation_run_id = ?`, [runId]);
    const unpriced = mats.filter((m) => !db.get(`SELECT 1 AS x FROM project_procurement_selections WHERE calculation_run_id = ? AND material_id = ?`, [runId, m.material_id]));
    checks.push({ ok: unpriced.length === 0, label: unpriced.length === 0 ? 'Every material total has a procurement decision' : `${unpriced.length} material total(s) unpriced: ${unpriced.map((m) => m.material_id).join(', ')}` });

    const outs = db.all(`SELECT * FROM project_output_totals WHERE calculation_run_id = ?`, [runId]);
    const undecided = outs.filter((o) => !db.get(`SELECT 1 AS x FROM project_disposition_selections WHERE calculation_run_id = ? AND output_material_id = ? AND output_subtype = ?`, [runId, o.output_material_id, o.output_subtype]));
    checks.push({ ok: undecided.length === 0, label: undecided.length === 0 ? 'Every generated output has a disposition decision' : `${undecided.length} output(s) with no disposition: ${undecided.map((o) => o.output_material_id).join(', ')}` });

    const interpolated = db.all(`SELECT calculation_data FROM project_requirement_instances WHERE calculation_run_id = ? AND requirement_type = 'service'`, [runId])
      .map((r) => { try { return JSON.parse(r.calculation_data || '{}'); } catch { return {}; } })
      .filter((cd) => cd.rate && cd.rate.interpolated).length;
    checks.push({ ok: true, warn: interpolated > 0, label: interpolated > 0 ? `${interpolated} production rate(s) interpolated, not catalog-tested` : 'All production rates come from catalog rows' });

    const cost = db.get(`SELECT COALESCE(SUM(extended_cost),0) AS c FROM cost_lines WHERE run_id = ?`, [runId]).c;
    checks.push({ ok: cost > 0, label: cost > 0 ? 'Cost has been calculated' : 'Cost has not been calculated' });
    return checks;
  });

  h('est:calculateCost', (db, runId, versionId) => {
    const result = engine.calculateCost(db, runId, versionId);
    db.save();
    return result;
  });

  h('est:issueRendition', (db, versionId, options) => {
    const result = engine.issueRendition(db, versionId, options);
    db.save();
    return result;
  });

  h('est:reopen', (db, versionId) => {
    engine.reopenAsNewRendition(db, versionId);
    db.save();
    return { reopened: true };
  });

  h('est:getCurrentContractedValue', (db, renditionId) => engine.getCurrentContractedValue(db, renditionId));

  h('est:listFootingSpecs', (db) => db.all(`SELECT * FROM footing_specs WHERE active = 1`));

  // A real scope edit — refused outright once the version's rendition is issued.
  h('est:setFootingOverride', (db, installationId, footingSpecId) => {
    const inst = db.get(`SELECT pc.version_id AS vid FROM project_component_installations cp JOIN project_components pc ON pc.id = cp.project_component_id WHERE cp.id = ?`, [installationId]);
    engine.assertDraft(db, inst.vid);
    db.run(
      `UPDATE project_component_installations SET footing_spec_override_id = ?, override_source = 'estimating_input', override_change_order_id = NULL WHERE id = ?`,
      [footingSpecId, installationId]
    );
    db.save();
    return { ok: true };
  });

  h('est:createChangeOrder', (db, renditionId, options) => {
    const result = engine.createChangeOrder(db, renditionId, options);
    db.save();
    return result;
  });
  h('est:submitChangeOrder', (db, coId) => { engine.submitChangeOrder(db, coId); db.save(); return { submitted: true }; });
  h('est:approveChangeOrder', (db, coId, options) => { engine.approveChangeOrder(db, coId, options); db.save(); return { approved: true }; });
  h('est:listChangeOrders', (db, renditionId) => db.all(`SELECT * FROM change_orders WHERE rendition_id = ? ORDER BY sequence_no`, [renditionId]));
  h('est:getChangeOrderLines', (db, coId) => db.all(`SELECT * FROM change_order_lines WHERE change_order_id = ?`, [coId]));
}

ipcMain.on('win:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on('win:toggle-maximize', (e) => {
  const w = BrowserWindow.fromWebContents(e.sender);
  if (!w) return;
  w.isMaximized() ? w.unmaximize() : w.maximize();
});
ipcMain.on('win:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close());

// The window itself provides the Windows 2000 chrome (title bar, menus, etc.),
// so we use a frameless window and let the renderer draw everything.
function createWindow() {
  const win = new BrowserWindow({
    width: 1044,
    height: 812,
    minWidth: 900,
    minHeight: 640,
    frame: false,
    backgroundColor: '#008080',
    title: 'Build Play Contracting - Project Manager',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // No native application menu; the app draws its own menu bar.
  Menu.setApplicationMenu(null);

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Diagnostic: surface renderer console + crashes in the terminal log.
  win.webContents.on('console-message', (_e, level, message, line, source) => {
    if (level >= 2) console.log(`[renderer:${level}] ${message} (${source}:${line})`);
  });
  win.webContents.on('render-process-gone', (_e, d) => console.log('[render-process-gone]', d));

  // TEMP: capture the rendered window once for verification.
  if (process.env.BPC_CAPTURE) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        if (process.env.BPC_EXEC) { try { await win.webContents.executeJavaScript(process.env.BPC_EXEC); } catch(e){ console.log('[exec-err]', e.message); } }
        await new Promise(r => setTimeout(r, 400));
        const img = await win.capturePage();
        require('fs').writeFileSync(process.env.BPC_CAPTURE, img.toPNG());
        console.log('[captured]', process.env.BPC_CAPTURE);
      }, 1200);
    });
  }
}

// The Requirement-First estimator — its own window, own chrome (matching
// builder/'s retro-paper style), wired to the real engine over IPC.
function createEstimatorWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 940,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    backgroundColor: '#008080',
    title: 'Requirement-First Estimator',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'estimator', 'index.html'));

  win.webContents.on('console-message', (_e, level, message, line, source) => {
    if (level >= 2) console.log(`[estimator:${level}] ${message} (${source}:${line})`);
  });
  win.webContents.on('render-process-gone', (_e, d) => console.log('[estimator-render-process-gone]', d));

  if (process.env.BPC_CAPTURE) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        if (process.env.BPC_EXEC) { try { await win.webContents.executeJavaScript(process.env.BPC_EXEC); } catch (e) { console.log('[exec-err]', e.message); } }
        await new Promise((r) => setTimeout(r, 400));
        const img = await win.capturePage();
        require('fs').writeFileSync(process.env.BPC_CAPTURE, img.toPNG());
        console.log('[captured]', process.env.BPC_CAPTURE);
      }, 1200);
    });
  }
  return win;
}

app.whenReady().then(() => {
  registerEstimatingIpc();

  // `npm run estimator` (electron . --estimator) opens the new screen directly,
  // standalone, without touching the existing Project Manager launch path.
  if (process.argv.includes('--estimator')) {
    createEstimatorWindow();
  } else {
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
