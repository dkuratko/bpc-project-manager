-- ============================================================================
-- BUILD PLAY CONTRACTING — schema draft 1
-- SQLite. Single user, one machine, local file.
-- Derived from docs/00-TREE.md draft 6. Every table here traces to a decision
-- made in the walkthrough; nothing is speculative.
--
-- Conventions
--   ids are TEXT (prefixed, human-readable in logs)
--   money and quantities are REAL; presentation rounding is the app's job
--   NO status columns on version — status is DERIVED from facts (§9)
-- ============================================================================


-- ══════════════════════════════════════════════════════════ 1 · PEOPLE ══

CREATE TABLE customers (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,              -- "Exerplay, Inc."
  kind          TEXT,                       -- rep/dealer · GC · school · owner
  address       TEXT, city TEXT, state TEXT, zip TEXT,
  notes         TEXT,
  active        INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE contacts (
  id            TEXT PRIMARY KEY,
  customer_id   TEXT REFERENCES customers(id),
  name          TEXT NOT NULL,              -- "Grant Smith"
  title         TEXT, email TEXT, phone TEXT, notes TEXT,
  active        INTEGER NOT NULL DEFAULT 1
);

-- "Whenever Grant is on something, copy Ashley."
-- A standing fact about PEOPLE, so it cannot live on a project. It attaches to
-- either a person or a company — the same either/or shape scope_deltas uses —
-- so one table covers both "Ashley works with Grant" and "always copy the
-- Exerplay office", and the data decides which one Ashley is.
--
-- It SUGGESTS, it does not bind. Adding Grant to a project writes ordinary
-- project_contacts rows for whoever this pulls in, and those rows are then
-- editable and deletable like any other. It is never re-evaluated at send
-- time, or removing Ashley from one job would keep putting her back.
--
-- SIX MECHANICS, all in docs/16:
--   1 no cascade — only a HAND-ADDED contact fires rules, or Grant->Ashley
--     plus Ashley->Grant loops forever
--   2 one person, one row — already on the project in any role means the
--     rule does nothing
--   3 person rule beats company rule when the roles disagree
--   4 fires in the DIALOG, visible and removable before save
--   5 never retroactive, never reversed by removing the trigger
--   6 the trigger list excludes self, and includes anyone an existing rule
--     names even after they leave the company
CREATE TABLE contact_defaults (
  id             TEXT PRIMARY KEY,
  scope_kind     TEXT NOT NULL CHECK(scope_kind IN ('customer','contact')),
  customer_id    TEXT REFERENCES customers(id),  -- the trigger, when 'customer'
  contact_id     TEXT REFERENCES contacts(id),   -- the trigger, when 'contact'
  add_contact_id TEXT NOT NULL REFERENCES contacts(id),   -- who gets pulled in
  role           TEXT NOT NULL DEFAULT 'cc',
  CHECK((scope_kind='customer' AND customer_id IS NOT NULL AND contact_id IS NULL)
     OR (scope_kind='contact'  AND contact_id  IS NOT NULL AND customer_id IS NULL)),
  UNIQUE(scope_kind, customer_id, contact_id, add_contact_id)
);


-- ═══════════════════════════════════════════════════════ 2 · CATALOG ══
-- Reusable, job-independent. TEMPLATE values only — nothing committed.

-- A material is ONE SUBSTANCE IN ONE STATE. "Spoils" is not a material:
-- native soil, demolished concrete and removed EWF are three disposal bills.
-- One list — whether it is bought or generated emerges from which pricing
-- templates exist for it.
CREATE TABLE materials (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  category        TEXT,
  base_unit       TEXT NOT NULL,            -- CY · LB · LF · EA · SF · TON
  density_lb_per_cy REAL,                   -- → tonnage for per-ton disposal
  swell_factor    REAL,                     -- excavated volume bulks up
  waste_pct       REAL NOT NULL DEFAULT 0,  -- tier 1 of the waste chain
  active          INTEGER NOT NULL DEFAULT 1,
  notes           TEXT
);

CREATE TABLE labor_roles (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  hourly_rate REAL NOT NULL, active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE equipment (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  -- NO rate here. Equipment is SOURCED, not rated — see equipment_sourcing.
  -- A truck and a trailer are ordinary equipment. These columns are NULL on
  -- anything that is not a vehicle.
  is_vehicle       INTEGER NOT NULL DEFAULT 0,
  capacity_lb      REAL,
  deck_length_ft   REAL,
  deck_width_ft    REAL
);

-- Owned or rented. Same shape as material procurement: a rate, a basis,
-- minimums, and a fee list. Pools across the job.
CREATE TABLE equipment_sourcing_methods (
  id                  TEXT PRIMARY KEY,
  equipment_id        TEXT NOT NULL REFERENCES equipment(id),
  name                TEXT NOT NULL,        -- "Owned" · "United Rentals"
  kind                TEXT NOT NULL CHECK(kind IN ('owned','rented')),
  rate                REAL NOT NULL,
  rate_basis          TEXT NOT NULL CHECK(rate_basis IN ('hour','day','week','month','mile')),
                      -- 'mile' is how an OWNED vehicle is costed: fuel, tyres,
                      -- maintenance and depreciation all scale with distance,
                      -- not time. A RENTED vehicle stays on 'day'.
  minimum_periods     REAL,                 -- 3-day minimum
  is_default          INTEGER NOT NULL DEFAULT 0,
  active              INTEGER NOT NULL DEFAULT 1
);

-- Pure geometry. NO post displacement — dropped. concrete = excavation = spoils.
-- TIER 1 — an owned vehicle's $/mile, COMPUTED not typed. Attaches to the
-- sourcing method whose rate it produces (kind='owned', rate_basis='mile').
--
--   fuel         = fuel_price ÷ mpg
--   maintenance  = annual_maintenance ÷ annual_miles
--   tyres        = tyre_set_cost ÷ tyre_life_miles
--   depreciation = (purchase_price − salvage_value) ÷ life_miles
--   fixed        = (insurance_annual + registration_annual) ÷ annual_miles
--   → $/mile = the sum, written back to equipment_sourcing_methods.rate
--
-- Fuel alone is roughly a third of it; the rest is what decides whether the
-- job is paying for wear or only for diesel.
CREATE TABLE vehicle_rate_inputs (
  sourcing_method_id   TEXT PRIMARY KEY REFERENCES equipment_sourcing_methods(id),
  mpg                  REAL,
  fuel_price           REAL,
  annual_maintenance   REAL,
  annual_miles         REAL,
  tyre_set_cost        REAL,
  tyre_life_miles      REAL,
  purchase_price       REAL,
  salvage_value        REAL,
  life_miles           REAL,
  insurance_annual     REAL,
  registration_annual  REAL,
  computed_rate        REAL,          -- the sum, for display and audit
  computed_at          TEXT
);

CREATE TABLE footing_specs (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,                -- "F-3x12"
  shape       TEXT NOT NULL CHECK(shape IN ('cylindrical','rectangular','bell')),
  diameter_ft REAL, width_ft REAL, length_ft REAL,
  depth_ft    REAL NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE assemblies (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,              -- "Rebar Cage A"
  assembly_type TEXT NOT NULL,
  sourcing_mode TEXT NOT NULL CHECK(sourcing_mode IN ('premade','field_fabricated')),
  material_id   TEXT REFERENCES materials(id),  -- premade: the EA material it IS
  active        INTEGER NOT NULL DEFAULT 1
);

-- field_fabricated: KEPT IN MODEL, BUILD DEFERRED. Documentation-only for premade.
CREATE TABLE assembly_members (
  id           TEXT PRIMARY KEY,
  assembly_id  TEXT NOT NULL REFERENCES assemblies(id),
  bar_size     TEXT, orientation TEXT,
  qty          INTEGER, length_ft REAL, spacing_in REAL,
  sequence_no  INTEGER NOT NULL DEFAULT 0
);

-- Services store DURATION (clock time), never man-hours.
-- cost = Σ (duration × role count × role rate)
CREATE TABLE services (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  category           TEXT,
  binding            TEXT NOT NULL CHECK(binding IN ('spec_bound','standalone')),
  binds_to_spec_type TEXT,                  -- 'footing_spec' for spec_bound
  default_unit       TEXT,
  -- standalone only: its own per-unit rate
  duration_hr_per_unit    REAL,
  equipment_id            TEXT REFERENCES equipment(id),
  equipment_hr_per_unit   REAL,             -- own field: the machine may run
                                            -- for only part of the duration
  generates_material_id   TEXT REFERENCES materials(id),
  generates_qty_per_unit  REAL,
  consumes_material_id    TEXT REFERENCES materials(id),
  consumes_qty_per_unit   REAL,
  active             INTEGER NOT NULL DEFAULT 1
);

-- Crew composition: [role × count]. "3 Installers" is a one-row composition.
-- 1 Operator + 1 Laborer is what prices a machine correctly.
CREATE TABLE service_crew (
  id            TEXT PRIMARY KEY,
  service_id    TEXT NOT NULL REFERENCES services(id),
  labor_role_id TEXT NOT NULL REFERENCES labor_roles(id),
  count         INTEGER NOT NULL DEFAULT 1
);

-- Tags are the ONLY way a project condition can reach into a catalog rate.
-- Explicit on both ends.
CREATE TABLE service_tags (
  service_id TEXT NOT NULL REFERENCES services(id),
  tag        TEXT NOT NULL,                 -- EXCAVATION · MATERIAL_HANDLING · ASSEMBLY
  PRIMARY KEY(service_id, tag)
);

-- spec_bound services: one row per footing spec. spec_id NULL = flat rate.
-- A MISSING ROW IS NEVER INTERPOLATED INTO A CALCULATION. The app may offer
-- an interpolated SUGGESTION to a person; once accepted it is a real row.
CREATE TABLE service_rates (
  id                    TEXT PRIMARY KEY,
  service_id            TEXT NOT NULL REFERENCES services(id),
  footing_spec_id       TEXT REFERENCES footing_specs(id),
  duration_hr_per_ea    REAL NOT NULL,
  equipment_id          TEXT REFERENCES equipment(id),
  equipment_hr_per_ea   REAL NOT NULL DEFAULT 0,
  UNIQUE(service_id, footing_spec_id)
);

-- PART NUMBER IS IDENTITY. 20x20x12 ≠ 20x20x10 ≠ 20x20x12-6-post.
-- No configurator. NO COST FIELD, EVER.
CREATE TABLE components (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  manufacturer  TEXT,
  part_number   TEXT NOT NULL,
  model         TEXT,
  type          TEXT,                       -- "Shade structure"
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK(status IN ('draft','active','one_time')),
  -- Shipping envelope. The version totals weight and takes the MAX of each
  -- dimension across everything in scope, which is what chooses the trailer.
  -- Length is usually the binding constraint — long post bundles — not weight.
  ship_weight_lb  REAL,
  ship_length_ft  REAL,
  ship_width_ft   REAL,
  ship_height_ft  REAL,
  one_time_version_id TEXT,                 -- one_time: the version that owns it
  promoted_from_id    TEXT REFERENCES components(id),
  copied_from_id      TEXT REFERENCES components(id),
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Free-form name/value/unit. A new product category needs no schema change.
-- "Post count" is the one that matters downstream: it defaults footing count.
CREATE TABLE component_specifications (
  id           TEXT PRIMARY KEY,
  component_id TEXT NOT NULL REFERENCES components(id),
  name         TEXT NOT NULL, value TEXT, unit TEXT,
  sequence_no  INTEGER NOT NULL DEFAULT 0
);

-- 1..n. Exists because one part number can sometimes install more than one way.
-- NO complexity factor — that moved to project conditions.
CREATE TABLE installation_methods (
  id             TEXT PRIMARY KEY,
  component_id   TEXT NOT NULL REFERENCES components(id),
  code           TEXT NOT NULL,             -- "DB" · "SM"
  name           TEXT NOT NULL,
  duration_hr    REAL,                      -- assembly, clock time
  post_length_ft REAL,
  burial_depth_ft REAL,
  is_default     INTEGER NOT NULL DEFAULT 0,
  UNIQUE(component_id, code)
);

CREATE TABLE installation_method_crew (
  id                   TEXT PRIMARY KEY,
  installation_method_id TEXT NOT NULL REFERENCES installation_methods(id),
  labor_role_id        TEXT NOT NULL REFERENCES labor_roles(id),
  count                INTEGER NOT NULL DEFAULT 1
);

-- What installing ONE unit needs. The TAG is the join: a service finds the
-- spec it operates on by matching tags inside the same checklist.
CREATE TABLE requirements (
  id                     TEXT PRIMARY KEY,
  installation_method_id TEXT NOT NULL REFERENCES installation_methods(id),
  requirement_type       TEXT NOT NULL CHECK(requirement_type IN ('footing_spec','assembly','service')),
  referenced_id          TEXT NOT NULL,
  quantity               REAL NOT NULL,
  binding_tag            TEXT,              -- "footings"
  sequence_no            INTEGER NOT NULL DEFAULT 0,
  notes                  TEXT
);


-- ══════════════════════════════════════ 3 · PRICING TEMPLATES ══
-- Defaults, NOT commitments. Every value is overtypeable on the version.

CREATE TABLE procurement_methods (
  id                  TEXT PRIMARY KEY,
  material_id         TEXT NOT NULL REFERENCES materials(id),
  name                TEXT NOT NULL,        -- "Ready-mix, ABC Concrete"
  vendor              TEXT,
  purchase_unit       TEXT NOT NULL,        -- "bag"
  units_per_purchase  REAL NOT NULL DEFAULT 1,  -- 1 bag = 0.0222 CY
                                            -- ← the gap in the old schema
  unit_price          REAL NOT NULL,
  waste_pct           REAL,                 -- tier 2: overrides the material
  round_purchase_to   REAL,                 -- 0.5 CY · 1 EA
  minimum_quantity    REAL,
  is_default          INTEGER NOT NULL DEFAULT 0,
  active              INTEGER NOT NULL DEFAULT 1
  -- NO STOCK. no on-hand quantity, no fallback method, no shortfall split.
);

CREATE TABLE disposition_methods (
  id                 TEXT PRIMARY KEY,
  material_id        TEXT NOT NULL REFERENCES materials(id),
  name               TEXT NOT NULL,         -- "Haul off, Miller Pit"
  vendor             TEXT,
  billing_basis      TEXT NOT NULL CHECK(billing_basis IN ('per_load','per_ton','free')),
  rate               REAL NOT NULL DEFAULT 0,
  truck_capacity_cy  REAL,
  requires_manifest  INTEGER NOT NULL DEFAULT 0,
  is_default         INTEGER NOT NULL DEFAULT 0,
  active             INTEGER NOT NULL DEFAULT 1
);

-- ONE fee mechanism, used by procurement, disposition and equipment sourcing.
-- A dynamic list, never fixed columns — you cannot predict what a vendor
-- will invent to charge you for.
CREATE TABLE fees (
  id             TEXT PRIMARY KEY,
  owner_type     TEXT NOT NULL CHECK(owner_type IN ('procurement_method','disposition_method','equipment_sourcing_method')),
  owner_id       TEXT NOT NULL,
  name           TEXT NOT NULL,             -- "Delivery" · "Short load"
  basis          TEXT NOT NULL CHECK(basis IN ('flat','per_unit','percent')),
  amount         REAL NOT NULL,
  condition_field TEXT,                     -- 'purchased_quantity' · 'tons' · NULL
  condition_op   TEXT CHECK(condition_op IN ('<','<=','>','>=',NULL)),
  condition_value REAL,
  sequence_no    INTEGER NOT NULL DEFAULT 0
);


-- ═══════════════════════════════════════════════ 4 · PROJECT ══

CREATE TABLE projects (
  id              TEXT PRIMARY KEY,
  number          TEXT NOT NULL UNIQUE,     -- "BPC-26-10"
  year            INTEGER NOT NULL,
  sequence_no     INTEGER NOT NULL,         -- resets every January
  title           TEXT NOT NULL,
  customer_id     TEXT REFERENCES customers(id),
  -- NO single contact_id. A project has SEVERAL contacts, each with a role —
  -- see project_contacts. The one marked 'primary' is who you deal with.
  address TEXT, city TEXT, state TEXT, zip TEXT,
  distance_mi     REAL,   -- ONE WAY, shop to site. drives vehicle cost.
  drive_time_min  REAL,   -- ONE WAY, in MINUTES — that is how it is entered.
                          -- the mobilization formula divides by 60.
                          -- Both are typed, not derived — no average-speed
                          -- assumption to argue with. NOT haul_distance_mi,
                          -- which is spoils disposal.
  native_material_id TEXT REFERENCES materials(id),  -- soil_types dissolved
  notes           TEXT,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, sequence_no)
);

-- Replaced per-component complexity. Stack MULTIPLICATIVELY.
-- Adjust the UNDERLYING VALUE so hours stay right for scheduling.
-- Applied BEFORE markup. Can NEVER touch product cost.
-- A project has several contacts, each with a role: the person who asked, the
-- person on site, whoever pays. Roles are an open list, not a fixed set.
CREATE TABLE project_contacts (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id),
  contact_id  TEXT NOT NULL REFERENCES contacts(id),
  role        TEXT NOT NULL DEFAULT 'primary',   -- primary · cc · site · billing
                                                 -- 'cc' rows are often seeded
                                                 -- by contact_defaults, then
                                                 -- edited like any other
  sequence_no INTEGER NOT NULL DEFAULT 0,
  -- ONE PERSON, ONE ROW, ONE ROLE. Keying on role as well would permit the
  -- same person twice under two roles, which is what happens when a person
  -- rule and a company rule both fire for them. See docs/16 §2.
  UNIQUE(project_id, contact_id)
);

CREATE TABLE project_conditions (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id),
  name        TEXT NOT NULL,                -- "access — no site access"
  multiplier  REAL NOT NULL,
  affects_equipment INTEGER NOT NULL DEFAULT 1,
  sequence_no INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE project_condition_tags (
  condition_id TEXT NOT NULL REFERENCES project_conditions(id),
  tag          TEXT NOT NULL,               -- matches service_tags.tag
  PRIMARY KEY(condition_id, tag)
);


-- ═══════════════════════════════════════════════ 5 · VERSION ══
-- An option is A LETTER AND NOTHING ELSE — stored on the version, not a table.
-- THE VERSION IS THE JOB.

CREATE TABLE versions (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  option_letter   TEXT NOT NULL,            -- A · B · C — a divider only
  version_number  INTEGER NOT NULL,         -- 0, 1, 2 within its option
  name            TEXT,                     -- defaults to
                                            -- "<project title> Opt. <letter>",
                                            -- editable, never required.
                                            -- option-level meaning carried on
                                            -- the version, because an option
                                            -- holds nothing. See docs/13.
  note            TEXT,                     -- free text. optional. not a
                                            -- forced justification.
  markup_pct      REAL NOT NULL DEFAULT 0,
  contingency_pct REAL NOT NULL DEFAULT 0,  -- added flat, NEVER marked up
  copied_from_id  TEXT REFERENCES versions(id),
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, option_letter, version_number)
  -- NO STATUS COLUMN. Status is derived — see §9.
  -- A version NEVER dies: no rejected, no superseded, no closed.
);

-- Mobilization is a standalone SERVICE with unit = trip. This table holds the
-- per-job facts that price it, and the fit check that chooses the trailer.
CREATE TABLE version_mobilization (
  version_id        TEXT PRIMARY KEY REFERENCES versions(id),
  trips             INTEGER NOT NULL DEFAULT 1,
  trips_computed    INTEGER,          -- ceil(total_weight ÷ capacity), min 1
  trips_overridden  INTEGER NOT NULL DEFAULT 0,
  load_hr_per_trip  REAL NOT NULL DEFAULT 0,  -- 0 when load time is already in
                                              -- the install service durations
  total_weight_lb   REAL,             -- Σ(component ship_weight × qty)
  longest_piece_ft  REAL,             -- MAX(ship_length) across scope
  widest_piece_ft   REAL,
  truck_equipment_id   TEXT REFERENCES equipment(id),
  trailer_equipment_id TEXT REFERENCES equipment(id),
  -- Staying overnight is RECOMMENDED, never automatic:
  --   usable_hours_day = workday_hours − (2 × drive_time_hr)
  --   install_days     = ceil(install duration ÷ usable_hours_day)
  --   recommend when   distance_mi > threshold AND install_days > 1
  --   nights           = install_days − 1
  -- A single-trip day job gives install_days = 1 and therefore no per diem.
  nights            INTEGER NOT NULL DEFAULT 0,
  nights_computed   INTEGER,
  nights_overridden INTEGER NOT NULL DEFAULT 0,
  rooms             INTEGER NOT NULL DEFAULT 0,
  room_rate         REAL,      -- per version: lodging is location-dependent
  per_diem_pct      REAL       -- an uplift on PAY. same % for every employee.
                               -- defaults from app_settings, overtypeable here.
                               -- applies only when nights > 0.
);

CREATE TABLE version_design_numbers (
  id          TEXT PRIMARY KEY,
  version_id  TEXT NOT NULL REFERENCES versions(id),
  design_no   TEXT NOT NULL,                -- customer's package reference
  label       TEXT,
  sequence_no INTEGER NOT NULL DEFAULT 0
);

-- ONE ENGINE, THREE MOMENTS. add_option / revision / change_order are the
-- same object: a scope delta, priced as a MARGINAL RECOMPUTE.
--    delta price = cost(scope with it) − cost(scope without it)
-- NEVER add or subtract allocated cost.
CREATE TABLE scope_deltas (
  id             TEXT PRIMARY KEY,
  version_id     TEXT NOT NULL REFERENCES versions(id),
  kind           TEXT NOT NULL CHECK(kind IN ('add_option','revision','change_order')),
  sequence_no    INTEGER NOT NULL,          -- CO-1, CO-2 · REV1, REV2
  name           TEXT NOT NULL,
  attaches_to    TEXT NOT NULL DEFAULT 'job' CHECK(attaches_to IN ('job','line')),
  estimate_line_id TEXT,                    -- line-specific add options
  reason         TEXT,
  accepted       INTEGER NOT NULL DEFAULT 0,
  accepted_at    TEXT,
  approval_method TEXT,                     -- 'po' · 'signed' · 'email'
  approval_ref   TEXT,
  cost_delta     REAL,
  price_delta    REAL,                      -- may be NEGATIVE (a credit)
  base_run_id    TEXT,                      -- the two runs the delta was
  with_run_id    TEXT,                      -- priced between
  created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(version_id, kind, sequence_no)
);

-- Manual, presentational grouping of scope rows — "PlayBooster PB-4400" holding
-- its decks, posts, panels, slide and hardware. Created fresh on every version.
-- The engine ignores them entirely: grouping changes nothing about expansion,
-- pooling or allocation.
-- BUT they default the estimate's line grouping, which otherwise has to be
-- done by hand a second time. One level only, no nesting.
CREATE TABLE scope_groups (
  id          TEXT PRIMARY KEY,
  version_id  TEXT NOT NULL REFERENCES versions(id),
  name        TEXT NOT NULL,
  note        TEXT,
  sequence_no INTEGER NOT NULL DEFAULT 0,
  collapsed   INTEGER NOT NULL DEFAULT 0
);

-- Anything on a version that can cause cost. Exactly two kinds — and unifying
-- them is what removes the orphan-tier problem: one allocation rule, no
-- smearing of site work across products that did not cause it.
CREATE TABLE cost_objects (
  id                     TEXT PRIMARY KEY,
  version_id             TEXT NOT NULL REFERENCES versions(id),
  kind                   TEXT NOT NULL CHECK(kind IN ('scope_row','direct_service')),
  delta_id               TEXT REFERENCES scope_deltas(id),  -- NULL = base scope
  group_id               TEXT REFERENCES scope_groups(id),  -- NULL = ungrouped
  -- scope_row
  component_id           TEXT REFERENCES components(id),
  installation_method_id TEXT REFERENCES installation_methods(id),
  footing_override_id    TEXT REFERENCES footing_specs(id),
  -- direct_service
  service_id             TEXT REFERENCES services(id),
  quantity               REAL NOT NULL DEFAULT 1,
  unit                   TEXT,
  label                  TEXT,
  notes                  TEXT,
  sequence_no            INTEGER NOT NULL DEFAULT 0
);


-- ══════════════════════════════════ 6 · EXPANSION & CALCULATION ══
-- A run is a full snapshot of one scope set. Marginal pricing works by
-- comparing two runs that differ by exactly one delta.

CREATE TABLE calculation_runs (
  id           TEXT PRIMARY KEY,
  version_id   TEXT NOT NULL REFERENCES versions(id),
  run_number   INTEGER NOT NULL,
  purpose      TEXT NOT NULL CHECK(purpose IN ('base','delta_price','approved','post_cost_baseline')),
  delta_set    TEXT,                        -- JSON array of included delta ids
  status       TEXT NOT NULL CHECK(status IN ('running','complete','failed')),
  total_cost   REAL,
  adjusted_cost REAL,                       -- after conditions
  computed_price REAL,                      -- adjusted × (1+markup) + adjusted × contingency
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(version_id, run_number)
);

CREATE TABLE requirement_instances (
  id                 TEXT PRIMARY KEY,
  run_id             TEXT NOT NULL REFERENCES calculation_runs(id),
  parent_instance_id TEXT REFERENCES requirement_instances(id),
  cost_object_id     TEXT NOT NULL REFERENCES cost_objects(id),
  requirement_type   TEXT NOT NULL,
  referenced_id      TEXT,
  binding_tag        TEXT,
  quantity           REAL NOT NULL,
  unit               TEXT,
  calc_data          TEXT                   -- JSON: how this number was reached
);

CREATE TABLE material_requirements (
  id                 TEXT PRIMARY KEY,
  run_id             TEXT NOT NULL REFERENCES calculation_runs(id),
  instance_id        TEXT REFERENCES requirement_instances(id),
  cost_object_id     TEXT NOT NULL REFERENCES cost_objects(id),
  material_id        TEXT NOT NULL REFERENCES materials(id),
  quantity           REAL NOT NULL,
  unit               TEXT NOT NULL
);

-- Generated output always exists as a quantity, even when disposition is free.
-- "No decision yet" is NOT "$0" — see disposition_selections.
CREATE TABLE generated_outputs (
  id                 TEXT PRIMARY KEY,
  run_id             TEXT NOT NULL REFERENCES calculation_runs(id),
  instance_id        TEXT REFERENCES requirement_instances(id),
  cost_object_id     TEXT NOT NULL REFERENCES cost_objects(id),
  material_id        TEXT NOT NULL REFERENCES materials(id),
  subtype            TEXT NOT NULL DEFAULT 'ordinary',
  quantity_bank      REAL NOT NULL,         -- in place, before swell
  quantity_loose     REAL NOT NULL,         -- after swell
  unit               TEXT NOT NULL
);

CREATE TABLE labor_requirements (
  id             TEXT PRIMARY KEY,
  run_id         TEXT NOT NULL REFERENCES calculation_runs(id),
  instance_id    TEXT REFERENCES requirement_instances(id),
  cost_object_id TEXT NOT NULL REFERENCES cost_objects(id),
  labor_role_id  TEXT NOT NULL REFERENCES labor_roles(id),
  duration_hr    REAL NOT NULL,             -- clock time
  crew_count     INTEGER NOT NULL,
  man_hours      REAL NOT NULL,             -- duration × count, DERIVED
  condition_multiplier REAL NOT NULL DEFAULT 1.0
);

CREATE TABLE equipment_requirements (
  id             TEXT PRIMARY KEY,
  run_id         TEXT NOT NULL REFERENCES calculation_runs(id),
  instance_id    TEXT REFERENCES requirement_instances(id),
  cost_object_id TEXT NOT NULL REFERENCES cost_objects(id),
  equipment_id   TEXT NOT NULL REFERENCES equipment(id),
  hours          REAL NOT NULL,
  condition_multiplier REAL NOT NULL DEFAULT 1.0
);

-- Aggregates — what the whole job needs. This is the pooling.
-- POOLING STOPS AT THE VERSION BOUNDARY — decided, deliberate. Two approved
-- versions on one project buy their concrete separately, even at one address.
CREATE TABLE material_totals (
  run_id      TEXT NOT NULL REFERENCES calculation_runs(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  required_quantity REAL NOT NULL, unit TEXT NOT NULL,
  PRIMARY KEY(run_id, material_id)
);
CREATE TABLE output_totals (
  run_id      TEXT NOT NULL REFERENCES calculation_runs(id),
  material_id TEXT NOT NULL REFERENCES materials(id),
  subtype     TEXT NOT NULL DEFAULT 'ordinary',
  generated_bank REAL NOT NULL, generated_loose REAL NOT NULL, unit TEXT NOT NULL,
  PRIMARY KEY(run_id, material_id, subtype)
);
CREATE TABLE equipment_totals (
  run_id       TEXT NOT NULL REFERENCES calculation_runs(id),
  equipment_id TEXT NOT NULL REFERENCES equipment(id),
  required_hours REAL NOT NULL,
  PRIMARY KEY(run_id, equipment_id)
);

-- Any figure the app could not produce honestly. The estimate CANNOT be
-- issued while one of these is open. Nothing is ever silently inferred.
CREATE TABLE calculation_gaps (
  id          TEXT PRIMARY KEY,
  run_id      TEXT NOT NULL REFERENCES calculation_runs(id),
  kind        TEXT NOT NULL CHECK(kind IN ('unrated_service','no_disposition','no_procurement','no_product_quote','unassigned_cost_object')),
  subject_type TEXT, subject_id TEXT,
  message     TEXT NOT NULL,
  suggestion  REAL                          -- interpolated, OFFERED not used
);


-- ══════════════════════════════════════ 7 · PRICING DECISIONS ══
-- The ONLY committed dollars. Templates supply defaults; every value here
-- is overtypeable.

CREATE TABLE procurement_selections (
  id                    TEXT PRIMARY KEY,
  run_id                TEXT NOT NULL REFERENCES calculation_runs(id),
  material_id           TEXT NOT NULL REFERENCES materials(id),
  procurement_method_id TEXT REFERENCES procurement_methods(id),
  required_quantity     REAL NOT NULL,      -- the effective-rate DENOMINATOR
  waste_pct             REAL NOT NULL DEFAULT 0,
  purchased_quantity    REAL NOT NULL,      -- after waste, rounding, minimum
  purchase_unit         TEXT NOT NULL,
  unit_price            REAL NOT NULL,
  material_cost         REAL NOT NULL,
  fee_total             REAL NOT NULL DEFAULT 0,
  total_cost            REAL NOT NULL,      -- all-in
  effective_rate        REAL NOT NULL,      -- total ÷ REQUIRED (not purchased)
  UNIQUE(run_id, material_id)
);

-- Discrete: 1 per scope row, no pooling, no allocation needed.
-- Often absent — the customer usually furnishes the equipment.
CREATE TABLE product_procurement (
  id             TEXT PRIMARY KEY,
  run_id         TEXT NOT NULL REFERENCES calculation_runs(id),
  cost_object_id TEXT NOT NULL REFERENCES cost_objects(id),
  vendor         TEXT, quote_number TEXT, quote_date TEXT, quote_valid_until TEXT,
  unit_price     REAL NOT NULL, quantity REAL NOT NULL DEFAULT 1,
  freight        REAL NOT NULL DEFAULT 0, crating REAL NOT NULL DEFAULT 0,
  total_cost     REAL NOT NULL,
  is_fallback    INTEGER NOT NULL DEFAULT 0,
  UNIQUE(run_id, cost_object_id)
);

CREATE TABLE disposition_selections (
  id                    TEXT PRIMARY KEY,
  run_id                TEXT NOT NULL REFERENCES calculation_runs(id),
  material_id           TEXT NOT NULL REFERENCES materials(id),
  subtype               TEXT NOT NULL DEFAULT 'ordinary',
  disposition_method_id TEXT REFERENCES disposition_methods(id),  -- NULL = UNDECIDED
  generated_bank        REAL NOT NULL,      -- the allocation denominator
  generated_loose       REAL NOT NULL,
  billing_basis         TEXT,
  loads                 INTEGER, tons REAL, density_used REAL,
  base_cost             REAL NOT NULL DEFAULT 0,
  fee_total             REAL NOT NULL DEFAULT 0,
  total_cost            REAL NOT NULL DEFAULT 0,
  effective_rate        REAL NOT NULL DEFAULT 0,
  manifest_number       TEXT,
  UNIQUE(run_id, material_id, subtype)
);

CREATE TABLE equipment_selections (
  id             TEXT PRIMARY KEY,
  run_id         TEXT NOT NULL REFERENCES calculation_runs(id),
  equipment_id   TEXT NOT NULL REFERENCES equipment(id),
  sourcing_method_id TEXT REFERENCES equipment_sourcing_methods(id),
  required_hours REAL NOT NULL,             -- the allocation denominator
  periods        REAL NOT NULL,             -- days: ceil(hr÷8), honor minimum,
  periods_overridden INTEGER NOT NULL DEFAULT 0,  -- then OVERTYPE
  rate           REAL NOT NULL, rate_basis TEXT NOT NULL,
  base_cost      REAL NOT NULL,
  fee_total      REAL NOT NULL DEFAULT 0,
  total_cost     REAL NOT NULL,
  effective_rate REAL NOT NULL,             -- total ÷ REQUIRED HOURS
  UNIQUE(run_id, equipment_id)
);

CREATE TABLE selection_fees (
  id             TEXT PRIMARY KEY,
  owner_type     TEXT NOT NULL CHECK(owner_type IN ('procurement','disposition','equipment')),
  owner_id       TEXT NOT NULL,
  fee_id         TEXT REFERENCES fees(id),
  name           TEXT NOT NULL, basis TEXT NOT NULL,
  amount         REAL NOT NULL, applied INTEGER NOT NULL DEFAULT 1
);


-- ═════════════════════════════════════════════════ 8 · COST ══
-- Five cost types. Every dollar lands on exactly ONE cost object.

CREATE TABLE cost_lines (
  id             TEXT PRIMARY KEY,
  run_id         TEXT NOT NULL REFERENCES calculation_runs(id),
  cost_object_id TEXT NOT NULL REFERENCES cost_objects(id),
  cost_type      TEXT NOT NULL CHECK(cost_type IN ('labor','equipment','procurement','product','disposition')),
  source_type    TEXT, source_id TEXT,
  description    TEXT,
  quantity       REAL, unit TEXT,
  unit_cost      REAL,                      -- the effective rate, FULL PRECISION
  base_cost      REAL NOT NULL,
  condition_multiplier REAL NOT NULL DEFAULT 1.0,
  extended_cost  REAL NOT NULL,             -- after conditions
  residual_cents INTEGER NOT NULL DEFAULT 0 -- largest-remainder adjustment
);
CREATE INDEX idx_cost_lines_run ON cost_lines(run_id, cost_object_id);


-- ════════════════════════════════════════════ 9 · DOCUMENTS ══
-- BPC{type}-{yy}-{project}{option}{version}
--   c = cost breakdown · e = estimate · i = invoice · co = change order · pc = post cost

-- The cost breakdown IS the version's scope + its current run. It has no
-- table of its own; `documents` records that one was issued.
CREATE TABLE documents (
  id            TEXT PRIMARY KEY,
  version_id    TEXT NOT NULL REFERENCES versions(id),
  doc_type      TEXT NOT NULL CHECK(doc_type IN ('c','e','i','co','pc')),
  reference     TEXT NOT NULL UNIQUE,       -- "BPCe-26-10A0 REV1"
  revision_no   INTEGER NOT NULL DEFAULT 0, -- REV1, REV2 — rare
  sequence_no   INTEGER,                    -- invoice n of total
  sequence_of   INTEGER,
  run_id        TEXT REFERENCES calculation_runs(id),
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at       TEXT,
  locked        INTEGER NOT NULL DEFAULT 0, -- LOCKED ON SUBMISSION, forever
  expires_at    TEXT,                       -- estimates: +30 days
  computed_price REAL,
  quoted_price  REAL,                       -- overtyped; effective markup derives
  cites         TEXT                        -- JSON: refs of documents billed against
);

-- A recursive tree. Every line is a NODE; a node carries subitems (which must
-- sum to it), inclusions, exclusions and add options.
-- The job is simply the root node.
CREATE TABLE document_lines (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES documents(id),
  parent_id     TEXT REFERENCES document_lines(id),
  sequence_no   INTEGER NOT NULL DEFAULT 0,
  line_number   INTEGER,                    -- 01, 02, 03 — printed on the document
  label         TEXT NOT NULL,              -- "Landscape Structures - PlayBooster
                                            --  PB-4400 Install [DB]"
  design_no     TEXT,
  quantity      REAL,                       -- lines are UNIT PRICED
  unit          TEXT,                       --   5 EA · 1 LS
  unit_price    REAL,
  amount        REAL,
  -- SUBITEMS are INCLUSIVE and PARTIAL. They show a breakdown that already
  -- sits inside the line total — printed in parentheses — and they do NOT
  -- have to sum to it.
  -- OPTIONS are EXCLUDED from the total. The headline reads
  --   "ESTIMATE TOTAL — BASE SCOPE, OPTIONS EXCLUDED".
  section       TEXT NOT NULL DEFAULT 'scope'
                  CHECK(section IN ('scope','job_add_option','change_order')),
  from_scope_group_id TEXT REFERENCES scope_groups(id),  -- seeded this line;
                                            -- the line can then be renamed,
                                            -- split or merged freely
  delta_id      TEXT REFERENCES scope_deltas(id),
  autofilled    REAL,                       -- what allocation proposed
  overridden    INTEGER NOT NULL DEFAULT 0
);

-- MANUAL grouping: you select cost objects and combine them under one line,
-- writing the label yourself. This is what makes autofill possible AND what
-- lets any estimate line be drilled back to its real cost — so margin is
-- known PER LINE, not just per job.
--
-- COMPLETENESS RULE: every cost object must be assigned to exactly one line
-- before the estimate can be issued. An unassigned object means the lines do
-- not sum to the computed price and money has gone missing.
CREATE TABLE document_line_objects (
  id               TEXT PRIMARY KEY,
  document_id      TEXT NOT NULL REFERENCES documents(id),
  document_line_id TEXT NOT NULL REFERENCES document_lines(id),
  cost_object_id   TEXT NOT NULL REFERENCES cost_objects(id),
  allocated_cost   REAL,                    -- summed from cost_lines
  UNIQUE(document_id, cost_object_id)       -- one object → one row
);
-- The target may be a LINE, a SUB-ITEM or an OPTION — every priced row in
-- document_lines. A line's cost is everything assigned to it OR to any row
-- beneath it. Sub-items remain a partial breakdown, so a line may also hold
-- objects directly.
-- Editor-only reference shown on each row: 01 · 01.1 · 02.O1 · J.O1.
-- It never appears on the printed estimate.

-- Free text. NO boilerplate library. Attached to a line, or to the document.
CREATE TABLE document_notes (
  id          TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  line_id     TEXT REFERENCES document_lines(id),   -- NULL = job level
  kind        TEXT NOT NULL DEFAULT 'disclaimer'
                CHECK(kind IN ('disclaimer','inclusion','exclusion','assumption')),
  text        TEXT NOT NULL,
  sequence_no INTEGER NOT NULL DEFAULT 0
);

-- Document-level standing text — the TERMS & EXCLUSIONS paragraph at the foot
-- of every estimate. This IS reused between jobs, unlike per-line notes which
-- are written fresh each time.
CREATE TABLE boilerplate (
  id          TEXT PRIMARY KEY,
  slot        TEXT NOT NULL,               -- 'terms_and_exclusions'
  name        TEXT NOT NULL,
  text        TEXT NOT NULL,
  is_default  INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE approvals (
  id           TEXT PRIMARY KEY,
  version_id   TEXT NOT NULL REFERENCES versions(id),
  document_id  TEXT REFERENCES documents(id),
  method       TEXT NOT NULL CHECK(method IN ('po','signed_estimate','email')),
  reference    TEXT,                        -- PO number
  received_at  TEXT NOT NULL,
  evidence_path TEXT,
  notes        TEXT,
  -- Set when the PO did not match the estimate and the approval therefore
  -- issued a revision. See docs/17 — the approval dialog is where revisions
  -- are born, because nobody reads the same PO twice.
  revision_document_id TEXT REFERENCES documents(id)
);

-- WHAT THE PO ACTUALLY ORDERED, line by line. One row per priced row on the
-- approved estimate — base lines, line-level add options and job-level add
-- options alike.
--
-- Two things it records that a tick cannot:
--   · ordered_quantity below quoted_quantity  ("5 benches quoted, 4 ordered")
--   · a line declined outright                 (taken = 0)
-- Either makes the approval a REVISION as well, and the price is NEVER
-- derived by arithmetic here: cost does not scale, so REV1 recomputes.
--
-- A line-level add option (01.O1) is only takeable if its parent line is
-- taken. Footings for a ramada nobody ordered is not an orderable thing.
--
-- Rows exist only when the Line items popup was used and something differed.
-- A clean PO writes an approval and no approval_lines at all — "as quoted" is
-- the absence of exceptions, not a full transcript of the estimate.
CREATE TABLE approval_lines (
  id                TEXT PRIMARY KEY,
  approval_id       TEXT NOT NULL REFERENCES approvals(id),
  document_line_id  TEXT NOT NULL REFERENCES document_lines(id),
  taken             INTEGER NOT NULL DEFAULT 1,
  quoted_quantity   REAL,
  ordered_quantity  REAL,
  UNIQUE(approval_id, document_line_id)
);

-- Default: one invoice at completion (90% of jobs).
-- Optional negotiated draws. Change orders roll into the FINAL invoice, so
-- the denominator never moves.
CREATE TABLE billing_draws (
  id           TEXT PRIMARY KEY,
  version_id   TEXT NOT NULL REFERENCES versions(id),
  sequence_no  INTEGER NOT NULL,
  label        TEXT NOT NULL,               -- "Deposit" · "Final"
  percent      REAL, amount REAL,
  trigger_note TEXT,
  document_id  TEXT REFERENCES documents(id),
  UNIQUE(version_id, sequence_no)
);


-- ═══════════════════════════════════════ 10 · DELIVERY & FIELD ══

CREATE TABLE shipments (
  id                TEXT PRIMARY KEY,
  version_id        TEXT NOT NULL REFERENCES versions(id),
  sequence_no       INTEGER NOT NULL,
  expected_ship_date TEXT,                  -- given by the customer
  confirmed_date    TEXT,                   -- freight calls 1 day ahead
  window_start      TEXT, window_end TEXT,
  received_at       TEXT,
  destination       TEXT NOT NULL DEFAULT 'lot' CHECK(destination IN ('lot','site')),
  truck_log_ref     TEXT,
  customer_notified_at TEXT,
  notes             TEXT
);

-- Completeness is CUMULATIVE across shipments, at COMPONENT level.
-- Crates are not opened until on site, so part shortages surface mid-install.
CREATE TABLE shipment_items (
  id             TEXT PRIMARY KEY,
  shipment_id    TEXT NOT NULL REFERENCES shipments(id),
  cost_object_id TEXT REFERENCES cost_objects(id),
  description    TEXT,
  quantity       REAL NOT NULL DEFAULT 1,
  condition      TEXT CHECK(condition IN ('ok','damaged','short',NULL)),
  notes          TEXT
);

CREATE TABLE attachments (
  id          TEXT PRIMARY KEY,
  owner_type  TEXT NOT NULL,                -- shipment · version · actual_entry · approval
  owner_id    TEXT NOT NULL,
  kind        TEXT NOT NULL,                -- photo · document
  path        TEXT NOT NULL,
  caption     TEXT,
  taken_at    TEXT,
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crews (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
);

-- Scheduling is MANUAL. The app supplies durations, crews, equipment and
-- material needs; you place the work. NO dependency or cure modelling.
CREATE TABLE schedule_blocks (
  id             TEXT PRIMARY KEY,
  version_id     TEXT NOT NULL REFERENCES versions(id),
  cost_object_id TEXT REFERENCES cost_objects(id),  -- NULL = whole-job block
  crew_id        TEXT REFERENCES crews(id),
  label          TEXT,
  starts_at      TEXT NOT NULL,
  ends_at        TEXT NOT NULL,
  kind           TEXT NOT NULL DEFAULT 'work'
                   CHECK(kind IN ('work','delivery','equipment_on','equipment_off','note')),
  notes          TEXT
);

CREATE TABLE version_schedule (
  version_id      TEXT PRIMARY KEY REFERENCES versions(id),
  install_date    TEXT,                     -- set by the CUSTOMER
  started_at      TEXT,
  completed_at    TEXT,                     -- off site and not coming back
  buffer_days     REAL NOT NULL DEFAULT 0
);


-- ══════════════════════════════════════════ 11 · POST COST ══
-- Mirrors the cost breakdown exactly. Actuals gathered AT THE END —
-- an autopsy, not an early warning. Deliberate.

CREATE TABLE post_costs (
  id           TEXT PRIMARY KEY,
  version_id   TEXT NOT NULL REFERENCES versions(id) UNIQUE,
  document_id  TEXT REFERENCES documents(id),
  baseline_run_id TEXT REFERENCES calculation_runs(id),
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  actual_cost  REAL, actual_margin_pct REAL
);

CREATE TABLE actual_entries (
  id             TEXT PRIMARY KEY,
  post_cost_id   TEXT NOT NULL REFERENCES post_costs(id),
  cost_object_id TEXT REFERENCES cost_objects(id),  -- NULL = job level
  cost_type      TEXT NOT NULL CHECK(cost_type IN ('labor','equipment','procurement','product','disposition')),
  description    TEXT NOT NULL,
  source         TEXT,                      -- 'concrete ticket #44821' · 'payroll wk 38'
  quantity       REAL, unit TEXT,
  amount         REAL NOT NULL,
  is_warranty_rework INTEGER NOT NULL DEFAULT 0,  -- unpaid. erodes real margin.
  entry_date     TEXT
);

-- Variance feeds back as a SUGGESTION. Without this the catalog runs on
-- unverified guesses forever; with it, every finished job improves the next.
CREATE TABLE rate_observations (
  id              TEXT PRIMARY KEY,
  post_cost_id    TEXT NOT NULL REFERENCES post_costs(id),
  service_id      TEXT NOT NULL REFERENCES services(id),
  footing_spec_id TEXT REFERENCES footing_specs(id),
  catalog_duration REAL, observed_duration REAL, unit_count REAL,
  applied_at      TEXT                      -- when you accepted the update
);

CREATE TABLE warranties (
  version_id   TEXT PRIMARY KEY REFERENCES versions(id),
  starts_at    TEXT,                        -- when the INVOICE IS SENT
  months       INTEGER NOT NULL DEFAULT 12, -- adjustable
  expires_at   TEXT,
  notes        TEXT
);


-- ══════════════════════════════════════════════ 12 · STATUS ══
-- There is NO status column anywhere. Status is DERIVED from independent
-- facts, because reality does not enforce an order between them — a job can
-- be scheduled before the equipment lands.
--
--   equipment    schedule     →  STATUS
--   ─────────────────────────────────────────────────────────
--   incomplete   no date         AWAITING DELIVERY
--   incomplete   date set        SCHEDULED  ⚠ awaiting delivery   ← the alert
--   complete     no date         EQUIPMENT RECEIVED
--   complete     date set        SCHEDULED
--   —            started         ACTIVE
--   —            completed       ACTIVE  ← still. completion IS the invoice.
--                                "completed, payment required" was REMOVED;
--                                it had no trigger of its own. ACTIVE covers
--                                the gap after the crew leaves. See docs/17.
--   invoice sent                 INVOICE SENT, PAYMENT REQUIRED
--   paid, in warranty            WARRANTY
--   warranty expired             COMPLETED
--
-- Nothing can get stuck: correct a fact and the status recomputes.

CREATE TABLE version_facts (
  version_id   TEXT PRIMARY KEY REFERENCES versions(id),
  approved_at  TEXT,
  invoice_sent_at TEXT,
  paid_at      TEXT                         -- set by hand; A/R lives in QuickBooks
);

-- Derived, never typed. A scheduled job with no equipment on the lot is the
-- most dangerous state in the business and the alert the app exists to raise.
CREATE TABLE alerts (
  id          TEXT PRIMARY KEY,
  version_id  TEXT NOT NULL REFERENCES versions(id),
  kind        TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'warn',
  message     TEXT NOT NULL,
  raised_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cleared_at  TEXT
);


-- ══════════════════════════════════════════════ 13 · USERS ══
-- Designed for multiple users from the start so the app can scale, even
-- though it runs on one machine today. Adding these later would touch
-- every table; adding them now costs nothing.
--
-- NOTE ON DEPLOYMENT: a shared SQLite file over a network share is NOT safe
-- for concurrent writers. Real multi-user means either a server database
-- (Postgres) or a sync layer. That is a deployment decision, not a schema
-- one — everything below is portable to either.

-- Global settings. Key/value so a new one is data entry, not a migration —
-- the same principle as component specifications and procurement fees.
--   mobilization.distance_threshold_mi ... ▢ value not established yet
--   mobilization.per_diem_pct ............ uplift on employee pay, e.g. 10%
--   mobilization.workday_hours ........... 10
--   vehicle.rate_method .................. 'computed' | 'tracked'
--        Tier 1 today. The setting exists so it can be switched to actuals
--        later without touching anything else.
CREATE TABLE app_settings (
  key     TEXT PRIMARY KEY,
  value   TEXT,
  notes   TEXT
);

CREATE TABLE users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  initials     TEXT,
  email        TEXT,
  role         TEXT NOT NULL DEFAULT 'estimator'
                 CHECK(role IN ('owner','estimator','field','viewer')),
  active       INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Who did what. Applied to the entities where authorship actually matters:
-- anything issued, approved, priced, or recorded from the field.
CREATE TABLE record_audit (
  id          TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  action      TEXT NOT NULL,               -- created · updated · issued · approved · locked
  user_id     TEXT REFERENCES users(id),
  at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  detail      TEXT                          -- JSON
);
CREATE INDEX idx_audit_entity ON record_audit(entity_type, entity_id);

-- Crews become assignable to people once there is more than one user.
CREATE TABLE crew_members (
  crew_id TEXT NOT NULL REFERENCES crews(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  labor_role_id TEXT REFERENCES labor_roles(id),
  PRIMARY KEY(crew_id, user_id)
);
