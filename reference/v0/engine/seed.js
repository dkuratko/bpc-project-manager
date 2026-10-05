// Seeds the smallest complete vertical slice named in SPEC-01's own
// "Configuration Order for Moving Forward Now": one shade, one footing spec,
// one premade cage, two services, one soil type, one test project.

const { newId } = require('./db');

function seed(db) {
  // ---- materials -----------------------------------------------------
  db.run(`INSERT INTO materials (id,name,category,base_unit) VALUES
    ('mat_concrete','Concrete','concrete','CY'),
    ('mat_spoils','Spoils','earthwork_output','CY')`);
  db.run(`INSERT INTO materials (id,name,category,base_unit) VALUES
    ('mat_cage_a','Rebar Cage A','premade_assembly','EA')`);
  // Its own density (concrete rubble, not soil) — proves disposition pricing
  // doesn't have to borrow the site soil's density for every output type.
  db.run(`INSERT INTO materials (id,name,category,base_unit,density_lb_per_cy) VALUES
    ('mat_debris','Concrete Demolition Debris','demo_output','CY',2200)`);
  db.run(`INSERT INTO materials (id,name,category,base_unit) VALUES ('mat_rebar_4','#4 Rebar','rebar','LB')`);
  db.run(`INSERT INTO materials (id,name,category,base_unit) VALUES ('mat_ewf','Engineered Wood Fiber','surfacing','CY')`);
  db.run(`INSERT INTO materials (id,name,category,base_unit,density_lb_per_cy) VALUES ('mat_ewf_removed','Removed EWF Surfacing','demo_output','CY',900)`);

  // ---- footing specs -----------------------------------------------------
  // F-2.5x6 is the bid-time default the profile ships with; F-3x9 is what
  // engineering confirms post-PO in the change-order scenario (run-change-order.js).
  db.run(`INSERT INTO footing_specs (id,code,shape,diameter_ft,depth_ft,post_displacement_cy,overdig_pct)
          VALUES ('spec_f25x6','F-2.5x6','cylindrical',2.5,6.0,0.04,0)`);
  db.run(`INSERT INTO footing_specs (id,code,shape,diameter_ft,depth_ft,post_displacement_cy,overdig_pct)
          VALUES ('spec_f3x9','F-3x9','cylindrical',3.0,9.0,0.04,0)`);
  // A second post-approval correction (a utility-conflict RFI, say) — used only
  // to prove change-order sequencing (CO2 must read CO1's F-3x9 as its baseline).
  db.run(`INSERT INTO footing_specs (id,code,shape,diameter_ft,depth_ft,post_displacement_cy,overdig_pct)
          VALUES ('spec_f3x10','F-3x10','cylindrical',3.0,10.0,0.04,0)`);
  // The rest of the catalog's real rate-table specs (SPEC-01 §3d) — these give
  // interpolation something genuine to bracket between; post displacement is a
  // property of the post, not the hole, so 0.04 CY carries across all four.
  db.run(`INSERT INTO footing_specs (id,code,shape,diameter_ft,depth_ft,post_displacement_cy,overdig_pct) VALUES
    ('spec_f15x3','F-1.5x3','cylindrical',1.5,3.0,0.04,0),
    ('spec_f2x5','F-2x5','cylindrical',2.0,5.0,0.04,0),
    ('spec_f4x10','F-4x10','cylindrical',4.0,10.0,0.04,0)`);

  // ---- rebar cage — premade assembly, EA material, member rows are docs only
  db.run(`INSERT INTO assembly_specs (id,name,assembly_type,sourcing_mode,material_id,fits_footing_spec_ids)
          VALUES ('asm_cage_a','Rebar Cage A','rebar_cage','premade','mat_cage_a','["F-3x9","F-3x7"]')`);
  db.run(`INSERT INTO assembly_members (id,assembly_spec_id,bar_size,orientation,qty,length_ft,purpose) VALUES
    ('am1','asm_cage_a','#5','vertical',6,10.0,'spec_check')`);
  db.run(`INSERT INTO assembly_members (id,assembly_spec_id,bar_size,orientation,qty,length_ft,spacing_in,purpose) VALUES
    ('am2','asm_cage_a','#4','tie',9,7.5,12,'spec_check')`);

  // ---- services ----------------------------------------------------
  db.run(`INSERT INTO services (id,name,category,binds_to_spec_type,default_unit) VALUES
    ('svc_excavate','Excavate Footing','earthwork','footing_spec','ea'),
    ('svc_setplumb','Set & Plumb Post, Place Concrete','placement','footing_spec','ea')`);
  // Site-work services added straight to a version (not pulled in by a
  // component): their own per-unit production rates, own units.
  db.run(`INSERT INTO services (id,name,category,estimation_method,default_unit,labor_hr_per_unit,crew_size,equipment_id,equipment_hr_per_unit,generates_material_id,generates_qty_per_unit,consumes_material_id,consumes_qty_per_unit) VALUES
    ('svc_remove_play','Remove Existing Playground','demolition','per_unit','LS',36.0,3,'eq_excavation',14.0,'mat_debris',8.4,NULL,NULL),
    ('svc_remove_ftg','Remove Existing Footings','demolition','per_unit','EA',0.8,2,'eq_excavation',0.8,'mat_debris',0.221,NULL,NULL),
    ('svc_remove_ewf','Remove EWF Surfacing','earthwork','per_unit','SF',0.00286,2,'eq_excavation',0.00143,'mat_ewf_removed',0.0183,NULL,NULL),
    ('svc_site_exc','Site Excavation — surfacing box','earthwork','per_unit','CY',0.0778,2,'eq_excavation',0.0389,'mat_spoils',1.0,NULL,NULL),
    ('svc_subgrade','Subgrade Preparation','placement','per_unit','SF',0.00333,2,'eq_excavation',0.00167,NULL,NULL,NULL,NULL),
    ('svc_spread_ewf','Spread EWF','placement','per_unit','CY',0.1333,2,'eq_excavation',0.0667,NULL,NULL,'mat_ewf',1.0)`);
  db.run(`INSERT INTO labor_roles (id,name,hourly_rate) VALUES ('role_laborer','General Laborer',34.00)`);
  db.run(`INSERT INTO equipment (id,name,hourly_rate) VALUES
    ('eq_excavation','Excavation Equipment (auger/excavator)',45.00),
    ('eq_mixer','Concrete Mixer',28.00)`);
  // Excavate Footing's real per-spec rate table (SPEC-01 §3d, all four catalog
  // points). F-2.5x6 and F-3x10 are deliberately absent — the engine now
  // interpolates them live instead of being told the answer.
  db.run(`INSERT INTO service_rate_table (id,service_id,spec_id,labor_hr_per_ea,crew_size,equipment_id,equipment_hr_per_ea) VALUES
    ('rate_exc_f15x3','svc_excavate','spec_f15x3',0.60,2,'eq_excavation',0.40),
    ('rate_exc_f2x5','svc_excavate','spec_f2x5',1.10,2,'eq_excavation',0.75),
    ('rate_exc_f3x9','svc_excavate','spec_f3x9',2.10,2,'eq_excavation',1.40),
    ('rate_exc_f4x10','svc_excavate','spec_f4x10',3.80,3,'eq_excavation',2.60)`);
  // Set & Plumb / Place Concrete doesn't scale with footing volume in the
  // catalog — it's a flat rate (spec_id NULL), used for every spec as-is.
  db.run(`INSERT INTO service_rate_table (id,service_id,spec_id,labor_hr_per_ea,crew_size,equipment_id,equipment_hr_per_ea) VALUES
    ('rate_set_flat','svc_setplumb',NULL,1.40,2,'eq_mixer',0.10)`);

  // ---- component + installation profile + requirements -----------------
  db.run(`INSERT INTO components (id,name,model,base_cost) VALUES
    ('comp_hip_shade','20x20x12 Hip Shade','HIP-202012',18900.00)`);
  db.run(`INSERT INTO component_installation_profiles (id,component_id,name,complexity_factor) VALUES
    ('prof_direct_bury','comp_hip_shade','Direct Bury',1.15)`);
  db.run(`INSERT INTO profile_requirements (id,installation_profile_id,requirement_type,referenced_id,quantity,binding_key,sequence_no) VALUES
    ('pr1','prof_direct_bury','specification','spec_f25x6',4,'footings',1),
    ('pr2','prof_direct_bury','assembly','asm_cage_a',4,'footings',2),
    ('pr3','prof_direct_bury','service','svc_excavate',4,'footings',3),
    ('pr4','prof_direct_bury','service','svc_setplumb',4,'footings',4)`);

  // ---- a second, genuinely different component: Playground Post ---------
  // Proves pooled procurement actually pools across unrelated sources, and
  // exercises the field_fabricated assembly path the premade cage never touches.
  db.run(`INSERT INTO assembly_specs (id,name,assembly_type,sourcing_mode) VALUES
    ('asm_post_rebar','Post Reinforcement','rebar_mat','field_fabricated')`);
  db.run(`INSERT INTO assembly_members (id,assembly_spec_id,bar_size,orientation,qty,length_ft,purpose) VALUES
    ('am3','asm_post_rebar','#4','vertical',3,4.0,'takeoff')`);

  db.run(`INSERT INTO components (id,name,model,base_cost) VALUES
    ('comp_post','Playground Post','PGP-STD',180.00)`);
  db.run(`INSERT INTO component_installation_profiles (id,component_id,name,complexity_factor) VALUES
    ('prof_post_standard','comp_post','Direct Bury — Standard',1.0)`);
  db.run(`INSERT INTO profile_requirements (id,installation_profile_id,requirement_type,referenced_id,quantity,binding_key,sequence_no) VALUES
    ('pr5','prof_post_standard','specification','spec_f2x5',1,'footings',1),
    ('pr6','prof_post_standard','assembly','asm_post_rebar',1,'footings',2),
    ('pr7','prof_post_standard','service','svc_excavate',1,'footings',3),
    ('pr8','prof_post_standard','service','svc_setplumb',1,'footings',4)`);

  // ---- procurement methods ----------------------------------------------
  db.run(`INSERT INTO procurement_methods
    (id,material_id,name,method_type,purchase_unit,unit_price,waste_allowance_pct,round_purchase_to,delivery_fee,short_load_fee,short_load_threshold) VALUES
    ('proc_ready_mix','mat_concrete','Ready Mix','ready_mix','CY',185.00,0.04,0.5,95.00,150.00,10.0)`);
  db.run(`INSERT INTO procurement_methods
    (id,material_id,name,method_type,purchase_unit,unit_price,delivery_fee) VALUES
    ('proc_cage_valley','mat_cage_a','Valley Rebar — premade cage','each','EA',148.00,120.00)`);
  // Only 2 in stock of the 4 needed — exercises the stock/purchase split path.
  db.run(`INSERT INTO procurement_methods
    (id,material_id,name,method_type,purchase_unit,unit_price,stock_available_quantity,fallback_procurement_method_id) VALUES
    ('proc_cage_stock','mat_cage_a','Stock — priced at last purchase 08/02/26','stock','EA',142.50,2,'proc_cage_valley')`);
  db.run(`INSERT INTO procurement_methods
    (id,material_id,name,method_type,purchase_unit,unit_price,waste_allowance_pct,delivery_fee) VALUES
    ('proc_rebar4','mat_rebar_4','Rebar Supply Co. — #4 stock length','bulk','LB',0.86,0.05,45.00)`);

  // ---- disposition methods (both billing bases, so both paths are proven)
  db.run(`INSERT INTO disposition_methods
    (id,output_material_id,name,method_type,billing_basis,truck_capacity_cy,rate_per_load) VALUES
    ('disp_haul_load','mat_spoils','Haul Off Site — per load','haul_offsite','per_load',8.0,350.00)`);
  db.run(`INSERT INTO disposition_methods
    (id,output_material_id,name,method_type,billing_basis,tipping_rate_per_ton,transport_flat_fee) VALUES
    ('disp_haul_ton','mat_spoils','Haul Off Site — per ton','haul_offsite','per_ton',42.00,150.00)`);

  // ---- soil catalog ----------------------------------------------------
  db.run(`INSERT INTO soil_types (id,name,swell_factor,density_lb_per_cy,dig_factor) VALUES
    ('soil_sand','Sand / loose fill',1.12,2600,1.00),
    ('soil_common','Common earth',1.20,2800,1.00),
    ('soil_caliche','Caliche',1.25,3150,1.35),
    ('soil_dg','Decomposed granite',1.30,3000,1.20),
    ('soil_rock','Rock — blasted',1.50,4100,1.80)`);

  // ---- test project + version + scope -----------------------------------
  db.run(`INSERT INTO projects (id,project_number,name,customer,address,soil_type_id,haul_distance_mi,contamination_status,stage,bid_due) VALUES
    ('proj_26245','26-245','Sunset Park playground & shade','City of Gilbert','1330 E Juniper Ave','soil_caliche',14,'none','out_for_bid','2026-09-30')`);
  db.run(`INSERT INTO estimate_versions (id,project_id,version_letter,name,status) VALUES
    ('ver_A','proj_26245','A','Base design','draft')`);
  db.run(`INSERT INTO project_components (id,version_id,component_id,quantity) VALUES
    ('pc1','ver_A','comp_hip_shade',1)`);
  db.run(`INSERT INTO project_component_installations (id,project_component_id,installation_profile_id) VALUES
    ('pci1','pc1','prof_direct_bury')`);
  db.run(`INSERT INTO project_component_procurement
    (id,project_component_id,vendor_name,quote_number,quote_date,unit_price,quantity,freight,product_cost) VALUES
    ('pcp1','pc1','Southwest Rec Supply','SW-24817','2026-08-19',18900.00,1,640.00,19540.00)`);
}

// Adds a second, unrelated scope row (six Playground Posts) to ver_A on top of
// the base seed() — kept separate so the original single-shade vertical slice
// that run-vertical-slice.js/run-change-order.js/run-open-items.js were
// hand-verified against stays exactly as it was. Only run-multi-component.js calls this.
function addPlaygroundPosts(db) {
  db.run(`INSERT INTO project_components (id,version_id,component_id,quantity) VALUES
    ('pc2','ver_A','comp_post',6)`);
  db.run(`INSERT INTO project_component_installations (id,project_component_id,installation_profile_id) VALUES
    ('pci2','pc2','prof_post_standard')`);
  db.run(`INSERT INTO project_component_procurement
    (id,project_component_id,vendor_name,quote_number,quote_date,unit_price,quantity,freight,product_cost) VALUES
    ('pcp2','pc2','Southwest Rec Supply','SW-24818','2026-08-19',180.00,6,60.00,1140.00)`);
}

// The site work on 26-245 that no component pulls in — removals, excavation,
// subgrade and surfacing, added directly to version A.
function addSiteServices(db) {
  db.run(`INSERT INTO project_services (id,version_id,service_id,quantity,unit,sequence_no) VALUES
    ('psv1','ver_A','svc_remove_play',1,'LS',1),
    ('psv2','ver_A','svc_remove_ftg',14,'EA',2),
    ('psv3','ver_A','svc_remove_ewf',2400,'SF',3),
    ('psv4','ver_A','svc_site_exc',12,'CY',4),
    ('psv5','ver_A','svc_subgrade',2400,'SF',5),
    ('psv6','ver_A','svc_spread_ewf',120,'CY',6)`);
}

// A few more projects so the Projects list opens in a realistic working state.
// These carry versions and issued renditions but no expanded scope — enough to
// populate the list and the preview pane, not pretending to be priced jobs.
function seedExtraProjects(db) {
  const rows = [
    ['proj_26198', '26-198', 'Freestone Park shade replacement', 'City of Gilbert', 'soil_common', 'out_for_bid', '2026-10-02',
      [['A', 'Base design', 1, 'BPCe 26-198A1', 53920.0, 64200.0, '2026-09-01']]],
    ['proj_26233', '26-233', 'Riggs Road ES playground', 'Mesa Public Schools', 'soil_dg', 'estimating', '2026-09-22',
      [['A', 'Base design', 0, null, null, null, null], ['B', 'Value engineered', 0, null, null, null, null]]],
    ['proj_26251', '26-251', 'Chandler Community Center ramada', 'City of Chandler', 'soil_common', 'estimating', '2026-10-08',
      [['A', 'Base design', 0, null, null, null, null]]],
    ['proj_26258', '26-258', 'Desert Breeze splash pad shade', 'City of Chandler', 'soil_caliche', 'estimating', '2026-10-11',
      [['A', 'Base design', 0, null, null, null, null]]],
    ['proj_26266', '26-266', 'Gilbert Regional dog park shade', 'City of Gilbert', 'soil_dg', 'awarded', null,
      [['A', 'Base design', 4, 'BPCe 26-266A3', 61560.0, 72600.0, '2026-08-14']]],
    ['proj_26271', '26-271', 'Superstition Springs ES surfacing', 'Mesa Public Schools', 'soil_sand', 'out_for_bid', '2026-10-21',
      [['A', 'Base design', 1, 'BPCe 26-271A0', 22580.0, 29850.0, '2026-09-03']]],
  ];

  for (const [id, number, name, customer, soil, stage, bidDue, versions] of rows) {
    db.run(
      `INSERT INTO projects (id, project_number, name, customer, soil_type_id, stage, bid_due, contamination_status)
       VALUES (?,?,?,?,?,?,?, 'none')`,
      [id, number, name, customer, soil, stage, bidDue]
    );
    for (const [letter, vname, nextRendition, ref, cost, sell, issued] of versions) {
      const vid = `${id}_${letter}`;
      db.run(
        `INSERT INTO estimate_versions (id, project_id, version_letter, name, status, current_rendition_number)
         VALUES (?,?,?,?,?,?)`,
        [vid, id, letter, vname, ref ? 'issued' : 'draft', nextRendition]
      );
      if (ref) {
        db.run(
          `INSERT INTO estimate_renditions (id, version_id, rendition_number, reference, status, markup_pct, total_cost, contract_value, issued_at, sent_to)
           VALUES (?,?,?,?, 'issued', ?,?,?,?,?)`,
          [`${vid}_r`, vid, nextRendition - 1, ref, ((sell / cost) - 1) * 100, cost, sell, issued, customer]
        );
      }
    }
  }
}

module.exports = { seed, addPlaygroundPosts, addSiteServices, seedExtraProjects };
