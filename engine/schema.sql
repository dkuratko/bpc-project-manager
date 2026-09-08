-- ============================================================================
-- Requirement-First Estimating — schema (SPEC-02, Revision 3 naming)
-- SQLite dialect. Foreign keys are declarative; enable with PRAGMA foreign_keys=ON.
-- ============================================================================

-- ---------------------------------------------------------------- catalog --

CREATE TABLE materials (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  category            TEXT,
  base_unit           TEXT NOT NULL,               -- CY, LB, LF, EA, TON
  density_lb_per_cy   REAL,                         -- for per-ton disposition pricing
  active              INTEGER NOT NULL DEFAULT 1,
  notes               TEXT
);

CREATE TABLE components (
  id                  TEXT PRIMARY KEY,
  manufacturer_id     TEXT,
  component_type_id   TEXT,
  name                TEXT NOT NULL,
  model               TEXT,
  part_number         TEXT,
  base_cost           REAL,                         -- default/fallback product price only
  active              INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE component_installation_profiles (
  id                     TEXT PRIMARY KEY,
  component_id           TEXT NOT NULL REFERENCES components(id),
  installation_method_id TEXT,
  name                   TEXT NOT NULL,
  complexity_factor      REAL NOT NULL DEFAULT 1.0,
  active                 INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE footing_specs (
  id                     TEXT PRIMARY KEY,
  code                   TEXT NOT NULL,
  shape                  TEXT NOT NULL CHECK(shape IN ('cylindrical','rectangular','bell')),
  diameter_ft            REAL,
  width_ft               REAL,
  length_ft              REAL,
  depth_ft               REAL NOT NULL,
  post_displacement_cy   REAL NOT NULL DEFAULT 0,
  overdig_pct            REAL NOT NULL DEFAULT 0,
  active                 INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE assembly_specs (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  assembly_type           TEXT NOT NULL,             -- 'rebar_cage', etc.
  sourcing_mode           TEXT NOT NULL CHECK(sourcing_mode IN ('premade','field_fabricated')),
  material_id             TEXT REFERENCES materials(id), -- set when premade: the EA-priced material row it IS
  fits_footing_spec_ids   TEXT,                       -- advisory JSON array, e.g. '["F-3x9","F-3x7"]'
  active                  INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE assembly_members (
  id                 TEXT PRIMARY KEY,
  assembly_spec_id   TEXT NOT NULL REFERENCES assembly_specs(id),
  bar_size           TEXT,
  orientation        TEXT,
  qty                INTEGER,
  length_ft          REAL,
  spacing_in         REAL,
  purpose            TEXT NOT NULL DEFAULT 'takeoff' CHECK(purpose IN ('takeoff','spec_check'))
);

CREATE TABLE services (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  category              TEXT NOT NULL,               -- 'earthwork', 'placement', 'hauling', ...
  estimation_method     TEXT NOT NULL DEFAULT 'per_unit_spec'
                          CHECK(estimation_method IN ('per_unit_spec','per_unit')),
  binds_to_spec_type    TEXT,                         -- e.g. 'footing_spec'
  default_unit          TEXT,
  -- 'per_unit' services are added straight to a version and price off their own
  -- production rate rather than a footing spec's rate table.
  labor_hr_per_unit     REAL,
  crew_size             INTEGER,
  equipment_id          TEXT,
  equipment_hr_per_unit REAL,
  generates_material_id TEXT,                         -- output produced per unit, if any
  generates_qty_per_unit REAL,
  consumes_material_id  TEXT,                         -- material required per unit, if any
  consumes_qty_per_unit REAL,
  active                INTEGER NOT NULL DEFAULT 1
);

-- Services added directly to a version, not pulled in by a component. Kept in
-- their own table so a hand-added service is always distinguishable from one a
-- component required (SPEC-01's double-counting guardrail).
CREATE TABLE project_services (
  id           TEXT PRIMARY KEY,
  version_id   TEXT NOT NULL REFERENCES estimate_versions(id),
  service_id   TEXT NOT NULL REFERENCES services(id),
  quantity     REAL NOT NULL,
  unit         TEXT,
  notes        TEXT,
  sequence_no  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE service_rate_table (
  id                 TEXT PRIMARY KEY,
  service_id         TEXT NOT NULL REFERENCES services(id),
  spec_id            TEXT,                             -- footing_specs.id this row prices; NULL = flat rate, any spec
  labor_hr_per_ea    REAL NOT NULL DEFAULT 0,
  crew_size          INTEGER NOT NULL DEFAULT 1,
  equipment_id       TEXT,
  equipment_hr_per_ea REAL NOT NULL DEFAULT 0
);

CREATE TABLE labor_roles (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, hourly_rate REAL NOT NULL
);
CREATE TABLE equipment (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, hourly_rate REAL NOT NULL
);

-- Generic child requirements attached to an installation profile.
CREATE TABLE profile_requirements (
  id                       TEXT PRIMARY KEY,
  installation_profile_id  TEXT NOT NULL REFERENCES component_installation_profiles(id),
  requirement_type         TEXT NOT NULL CHECK(requirement_type IN ('assembly','service','specification')),
  referenced_id            TEXT NOT NULL,
  quantity                 REAL NOT NULL,
  binding_key              TEXT,                      -- e.g. 'footings' — lets a service bind to the spec row
  sequence_no              INTEGER NOT NULL DEFAULT 0,
  notes                    TEXT
);

CREATE TABLE procurement_methods (
  id                             TEXT PRIMARY KEY,
  material_id                    TEXT NOT NULL REFERENCES materials(id),
  name                           TEXT NOT NULL,
  method_type                    TEXT NOT NULL CHECK(method_type IN ('ready_mix','bagged','bulk','each','stock','supplier_quote')),
  purchase_unit                  TEXT NOT NULL,
  unit_price                     REAL NOT NULL,          -- for 'stock': last-purchase price (Decision 8, no averaging)
  waste_allowance_pct            REAL NOT NULL DEFAULT 0,
  round_purchase_to              REAL,                    -- e.g. 0.5 (CY) or 1 (EA)
  minimum_purchase_quantity      REAL,
  delivery_fee                   REAL NOT NULL DEFAULT 0,
  short_load_fee                 REAL NOT NULL DEFAULT 0,
  short_load_threshold           REAL,                    -- fee applies when purchased_quantity < this
  stock_available_quantity       REAL,                    -- 'stock' only: on-hand qty; shortfall falls back to fallback_method_id
  fallback_procurement_method_id TEXT REFERENCES procurement_methods(id),
  active                         INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE disposition_methods (
  id                   TEXT PRIMARY KEY,
  output_material_id   TEXT NOT NULL REFERENCES materials(id),
  name                 TEXT NOT NULL,
  method_type          TEXT NOT NULL CHECK(method_type IN ('leave_onsite','spread_onsite','relocate_onsite','haul_offsite','dispose','reuse_onsite','tbd')),
  billing_basis        TEXT NOT NULL DEFAULT 'per_load' CHECK(billing_basis IN ('per_load','per_ton')),
  truck_capacity_cy    REAL,
  rate_per_load        REAL,
  tipping_rate_per_ton REAL,
  transport_flat_fee   REAL NOT NULL DEFAULT 0,
  requires_manifest    INTEGER NOT NULL DEFAULT 0,
  active               INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE soil_types (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  swell_factor       REAL NOT NULL,
  density_lb_per_cy  REAL NOT NULL,
  dig_factor         REAL NOT NULL DEFAULT 1.0,
  active             INTEGER NOT NULL DEFAULT 1
);

-- ------------------------------------------------- project / version / rendition --

CREATE TABLE projects (
  id                        TEXT PRIMARY KEY,
  project_number            TEXT NOT NULL UNIQUE,      -- '26-245'
  name                      TEXT NOT NULL,
  customer                  TEXT,
  address                   TEXT,
  soil_type_id              TEXT REFERENCES soil_types(id),
  swell_override            REAL,
  swell_override_reason     TEXT,
  access_notes              TEXT,
  haul_distance_mi          REAL,
  spoil_onsite_permitted    INTEGER NOT NULL DEFAULT 1,
  contamination_status      TEXT NOT NULL DEFAULT 'none' CHECK(contamination_status IN ('none','suspected','confirmed')),
  contamination_split_pct   REAL,                        -- bid-time allowance: % of generated spoils assumed contaminated
  stage                     TEXT NOT NULL DEFAULT 'estimating'
                              CHECK(stage IN ('estimating','out_for_bid','awarded','on_hold','closed','lost')),
  bid_due                   TEXT,
  created_at                TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE estimate_versions (
  id                        TEXT PRIMARY KEY,
  project_id                TEXT NOT NULL REFERENCES projects(id),
  version_letter            TEXT NOT NULL,
  name                      TEXT,
  status                    TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','issued','superseded','void')),
  current_rendition_number  INTEGER NOT NULL DEFAULT 0,
  copied_from_version_id    TEXT REFERENCES estimate_versions(id),
  copied_at                 TEXT,
  created_at                TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, version_letter)
);

CREATE TABLE estimate_renditions (
  id                    TEXT PRIMARY KEY,
  version_id            TEXT NOT NULL REFERENCES estimate_versions(id),
  rendition_number      INTEGER NOT NULL,
  reference             TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','issued','void')),
  markup_pct            REAL,
  total_cost            REAL,
  contract_value        REAL,
  issued_at             TEXT,
  issued_by             TEXT,
  sent_to               TEXT,
  voided_at             TEXT,
  void_reason           TEXT,
  calculation_run_id    TEXT,
  UNIQUE(version_id, rendition_number)
);

CREATE TABLE estimate_rendition_lines (
  id             TEXT PRIMARY KEY,
  rendition_id   TEXT NOT NULL REFERENCES estimate_renditions(id),
  cost_type      TEXT NOT NULL,                        -- 'labor','equipment','procurement','disposition','product'
  source_type    TEXT,
  source_id      TEXT,
  description    TEXT,
  quantity       REAL,
  unit           TEXT,
  unit_cost      REAL,
  extended_cost  REAL NOT NULL
);

CREATE TABLE change_orders (
  id                        TEXT PRIMARY KEY,
  rendition_id              TEXT NOT NULL REFERENCES estimate_renditions(id),
  sequence_no               INTEGER NOT NULL,
  co_number                 TEXT NOT NULL,
  reason                    TEXT,
  reference                 TEXT,
  status                    TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','rejected','withdrawn')),
  markup_pct                REAL,
  cost_delta                REAL,
  price_delta               REAL,
  overrides_json            TEXT,     -- proposed overrides; NOT persisted to live scope until approved
  baseline_calculation_run_id TEXT,   -- the "as currently approved" run this CO diffed against
  draft_calculation_run_id  TEXT,     -- the what-if run computed for this CO; promoted to baseline on approval
  rejection_reason          TEXT,
  submitted_at              TEXT,
  approved_at               TEXT,
  approved_by               TEXT,
  UNIQUE(rendition_id, sequence_no)
);

CREATE TABLE change_order_lines (
  id                       TEXT PRIMARY KEY,
  change_order_id          TEXT NOT NULL REFERENCES change_orders(id),
  target_type              TEXT NOT NULL CHECK(target_type IN ('scope_row','requirement','material_total','service_rate')),
  target_id                TEXT,
  old_value                TEXT,
  new_value                TEXT,
  cost_delta               REAL,
  derived_from_co_line_id  TEXT REFERENCES change_order_lines(id)
);

-- --------------------------------------------- scope & requirement expansion --

CREATE TABLE project_components (
  id            TEXT PRIMARY KEY,
  version_id    TEXT NOT NULL REFERENCES estimate_versions(id),
  component_id  TEXT NOT NULL REFERENCES components(id),
  quantity      INTEGER NOT NULL DEFAULT 1,
  notes         TEXT
);

CREATE TABLE project_component_installations (
  id                          TEXT PRIMARY KEY,
  project_component_id       TEXT NOT NULL REFERENCES project_components(id),
  installation_profile_id    TEXT NOT NULL REFERENCES component_installation_profiles(id),
  footing_spec_override_id   TEXT REFERENCES footing_specs(id),
  override_source            TEXT CHECK(override_source IN (NULL,'estimating_input','change_order')),
  override_change_order_id   TEXT REFERENCES change_orders(id)
);

CREATE TABLE calculation_runs (
  id               TEXT PRIMARY KEY,
  version_id       TEXT NOT NULL REFERENCES estimate_versions(id),
  run_number       INTEGER NOT NULL,
  status           TEXT NOT NULL CHECK(status IN ('running','complete','failed')),
  created_at       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_requirement_instances (
  id                            TEXT PRIMARY KEY,
  calculation_run_id            TEXT NOT NULL REFERENCES calculation_runs(id),
  parent_instance_id            TEXT REFERENCES project_requirement_instances(id),
  source_project_component_id   TEXT REFERENCES project_components(id),
  requirement_type              TEXT NOT NULL,
  catalog_ref_id                TEXT,
  binding_key                   TEXT,
  quantity                      REAL NOT NULL,
  unit                          TEXT,
  calculation_data              TEXT
);

CREATE TABLE project_material_requirements (
  id                             TEXT PRIMARY KEY,
  calculation_run_id             TEXT NOT NULL REFERENCES calculation_runs(id),
  source_requirement_instance_id TEXT REFERENCES project_requirement_instances(id),
  material_id                    TEXT NOT NULL REFERENCES materials(id),
  quantity                       REAL NOT NULL,
  unit                           TEXT NOT NULL,
  calculation_data               TEXT
);

CREATE TABLE project_generated_outputs (
  id                              TEXT PRIMARY KEY,
  calculation_run_id              TEXT NOT NULL REFERENCES calculation_runs(id),
  source_requirement_instance_id  TEXT REFERENCES project_requirement_instances(id),
  output_material_id              TEXT NOT NULL REFERENCES materials(id),
  output_subtype                  TEXT NOT NULL DEFAULT 'ordinary' CHECK(output_subtype IN ('ordinary','contaminated')),
  quantity                        REAL NOT NULL,          -- in place (bank), before swell
  unit                            TEXT NOT NULL,
  density_override_lb_per_cy      REAL,
  calculation_data                TEXT
);

CREATE TABLE project_labor_requirements (
  id                   TEXT PRIMARY KEY,
  calculation_run_id   TEXT NOT NULL REFERENCES calculation_runs(id),
  source_requirement_instance_id TEXT REFERENCES project_requirement_instances(id),
  labor_role_id        TEXT NOT NULL REFERENCES labor_roles(id),
  hours                REAL NOT NULL
);
CREATE TABLE project_equipment_requirements (
  id                   TEXT PRIMARY KEY,
  calculation_run_id   TEXT NOT NULL REFERENCES calculation_runs(id),
  source_requirement_instance_id TEXT REFERENCES project_requirement_instances(id),
  equipment_id         TEXT NOT NULL REFERENCES equipment(id),
  hours                REAL NOT NULL
);

CREATE TABLE project_material_totals (
  calculation_run_id  TEXT NOT NULL REFERENCES calculation_runs(id),
  material_id         TEXT NOT NULL REFERENCES materials(id),
  required_quantity   REAL NOT NULL,
  unit                TEXT NOT NULL,
  PRIMARY KEY(calculation_run_id, material_id)
);
CREATE TABLE project_output_totals (
  calculation_run_id   TEXT NOT NULL REFERENCES calculation_runs(id),
  output_material_id   TEXT NOT NULL REFERENCES materials(id),
  output_subtype       TEXT NOT NULL DEFAULT 'ordinary',
  generated_quantity   REAL NOT NULL,          -- in place
  unit                 TEXT NOT NULL,
  PRIMARY KEY(calculation_run_id, output_material_id, output_subtype)
);

-- ------------------------------------------------- procurement & disposition --

CREATE TABLE project_procurement_selections (
  id                            TEXT PRIMARY KEY,
  calculation_run_id            TEXT NOT NULL REFERENCES calculation_runs(id),
  material_id                   TEXT NOT NULL REFERENCES materials(id),
  procurement_method_id         TEXT NOT NULL REFERENCES procurement_methods(id),
  required_quantity_snapshot    REAL NOT NULL,
  purchased_quantity            REAL NOT NULL,
  purchase_unit                 TEXT NOT NULL,
  unit_price                    REAL NOT NULL,
  delivery_fee                  REAL NOT NULL DEFAULT 0,
  short_load_fee                REAL NOT NULL DEFAULT 0,
  material_cost                 REAL NOT NULL,
  total_cost                    REAL NOT NULL
);

CREATE TABLE project_component_procurement (
  id                     TEXT PRIMARY KEY,
  project_component_id   TEXT NOT NULL REFERENCES project_components(id),
  vendor_name            TEXT,
  quote_number           TEXT,
  quote_date             TEXT,
  quote_valid_until      TEXT,
  unit_price             REAL NOT NULL,
  quantity               REAL NOT NULL DEFAULT 1,
  freight                REAL NOT NULL DEFAULT 0,
  crating                REAL NOT NULL DEFAULT 0,
  product_cost           REAL NOT NULL
);

CREATE TABLE project_disposition_selections (
  id                          TEXT PRIMARY KEY,
  calculation_run_id          TEXT NOT NULL REFERENCES calculation_runs(id),
  output_material_id          TEXT NOT NULL REFERENCES materials(id),
  output_subtype              TEXT NOT NULL DEFAULT 'ordinary',
  disposition_method_id       TEXT NOT NULL REFERENCES disposition_methods(id),
  generated_quantity_snapshot REAL NOT NULL,     -- in place
  loose_quantity               REAL NOT NULL,     -- after swell
  billing_basis                TEXT NOT NULL CHECK(billing_basis IN ('per_load','per_ton')),
  estimated_loads               INTEGER,
  tonnage                        REAL,
  density_used_lb_per_cy         REAL,
  disposal_cost                  REAL NOT NULL,
  requires_manifest              INTEGER NOT NULL DEFAULT 0,
  manifest_number                TEXT
);

-- ------------------------------------------------------------------ cost --

CREATE TABLE cost_lines (
  id             TEXT PRIMARY KEY,
  run_id         TEXT NOT NULL REFERENCES calculation_runs(id),
  cost_type      TEXT NOT NULL,
  source_type    TEXT,
  source_id      TEXT,
  description    TEXT,
  quantity       REAL,
  unit           TEXT,
  unit_cost      REAL,
  extended_cost  REAL NOT NULL
);
