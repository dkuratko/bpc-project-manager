'use strict';

/**
 * Sample data.
 *
 * Every record here traces to an approved render — the eight projects in
 * project-browser.v14, the companies and people in contacts.v2, the three
 * machines and three suppliers in the equipment renders, the obligations in
 * trackers.v1. Nothing is invented and nothing comes from reference/v0.
 *
 * ── It seeds FACTS, never statuses ──────────────────────────────────────
 * There is no status column to seed. Each project below gets the approvals,
 * shipments, dates and invoices that MAKE its colour, and status.js derives
 * the rest. If the browser comes out the colour the render shows, the model
 * works; if it does not, one of them is wrong. That is the point.
 */

const uid = (p, n) => `${p}_${n}`;

function seed(db) {
  if (db.prepare('SELECT count(*) n FROM projects').get().n) return false;

  const tx = db.transaction(() => {
    customers(db);
    // Equipment BEFORE projects: a version's mobilization names the truck and
    // the trailer, so the fleet has to exist first.
    equipment(db);
    projects(db);
    // AFTER projects: a rental's last-paid evidence cites the job it was
    // billed on, and that version has to exist to point at.
    rentalEvidence(db);
    trackers(db);
    catalog(db);
    scope(db);
    estimate(db);
  });
  tx();
  return true;
}

/* ─── contacts.v2 ───────────────────────────────────────────────────────── */

function customers(db) {
  const C = db.prepare(`INSERT INTO customers (id,name,kind,city,state) VALUES (?,?,?,?,?)`);
  const P = db.prepare(`INSERT INTO contacts (id,customer_id,name,title,email,phone) VALUES (?,?,?,?,?,?)`);

  const rows = [
    ['exerplay', 'Exerplay, Inc.', 'rep/dealer', 'Albuquerque', 'NM', [
      ['grant',  'Grant Smith',      'Regional Sales Mgr',  'grant@exerplay.com', '(505) 555-0142'],
      ['ashley', 'Ashley Doran',     'Sales Assistant',     'adoran@exerplay.com', '(505) 555-0151'],
      ['maria',  'Maria Villanueva', 'Project Coordinator', 'maria@exerplay.com', '(505) 555-0188'],
      ['dave',   'Dave Ruiz',        'Estimator',           'druiz@exerplay.com', '(505) 555-0164'],
    ]],
    ['tucson', 'City of Tucson', 'owner', 'Tucson', 'AZ', [
      ['angela', 'Angela Reyes',  'Parks Project Mgr', 'areyes@tucsonaz.gov',    '(520) 555-0119'],
      ['tom',    'Tom Baptiste',  'Inspector',         'tbaptiste@tucsonaz.gov', '(520) 555-0137'],
    ]],
    ['haydon', 'Haydon Building Corp', 'GC', 'Phoenix', 'AZ', [
      ['kyle', 'Kyle Nunez', 'Superintendent', 'knunez@haydonbc.com', '(602) 555-0173'],
    ]],
    ['cusd', 'Chandler Unified School Dist.', 'school', 'Chandler', 'AZ', [
      ['bev',    'Bev Oyler',     'Facilities', 'oyler.b@cusd.k12.az.us', '(480) 555-0190'],
      ['rachel', 'Rachel Ibarra', 'Purchasing', 'ibarra.r@cusd.k12.az.us', '(480) 555-0204'],
    ]],
    ['litchfield', 'Litchfield ESD', 'school', 'Litchfield Park', 'AZ', [
      ['dana', 'Dana Ruiz', 'Facilities Director', 'druiz@lesd79.org', '(623) 555-0128'],
    ]],
  ];

  for (const [id, name, kind, city, state, people] of rows) {
    C.run(uid('cus', id), name, kind, city, state);
    for (const [pid, pname, title, email, phone] of people)
      P.run(uid('con', pid), uid('cus', id), pname, title, email, phone);
  }

  // The AUTO column, and the two kinds of rule it has to tell apart — docs/15.
  const CD = db.prepare(`INSERT INTO contact_defaults
    (id,scope_kind,customer_id,contact_id,add_contact_id,role) VALUES (?,?,?,?,?,?)`);

  // attached to a PERSON — "wherever Grant goes, cc Ashley". Ashley is
  // Grant's assistant and does NOT follow Dave's jobs.
  CD.run('cd_grant_ashley', 'contact', null, uid('con', 'grant'), uid('con', 'ashley'), 'cc');

  // attached to a COMPANY — "cc the Chandler front office on everything",
  // whoever else is on the job. Same marker, different rule; the screen strip
  // is the only place they are told apart.
  CD.run('cd_cusd_rachel', 'customer', uid('cus', 'cusd'), null, uid('con', 'rachel'), 'cc');

  // A note, so the screen strip has something other than a dash to hold.
  db.prepare(`UPDATE contacts SET notes = ? WHERE id = ?`)
    .run('Sends POs on Fridays.', uid('con', 'grant'));
}

/* ─── project-browser.v14 · eight projects, eight states ────────────────── */

function projects(db) {
  const PR = db.prepare(`INSERT INTO projects
    (id,number,year,sequence_no,title,customer_id,address,city,state,zip,distance_mi,drive_time_min,created_at)
    VALUES (@id,@number,26,@seq,@title,@customer,@address,@city,@state,@zip,@miles,@drive,@created)`);
  const VE = db.prepare(`INSERT INTO versions
    (id,project_id,option_letter,version_number,name,created_at) VALUES (?,?,?,?,?,?)`);
  const PC = db.prepare(`INSERT INTO project_contacts (id,project_id,contact_id,role) VALUES (?,?,?,?)`);
  const FA = db.prepare(`INSERT INTO version_facts (version_id,approved_at,invoice_sent_at,paid_at) VALUES (?,?,?,?)`);
  const SC = db.prepare(`INSERT INTO version_schedule (version_id,install_date,started_at,completed_at,buffer_days) VALUES (?,?,?,?,?)`);
  const WA = db.prepare(`INSERT INTO warranties (version_id,starts_at,months,expires_at) VALUES (?,?,?,?)`);
  const MOB = db.prepare(`INSERT INTO version_mobilization
    (version_id,trips,total_weight_lb,longest_piece_ft,widest_piece_ft,
     truck_equipment_id,trailer_equipment_id) VALUES (?,?,?,?,?,?,?)`);
  const RUN = db.prepare(`INSERT INTO calculation_runs
    (id,version_id,run_number,purpose,status,total_cost,adjusted_cost,
     computed_price,created_at) VALUES (?,?,?,?,?,?,?,?,?)`);
  const DO = db.prepare(`INSERT INTO documents
    (id,version_id,doc_type,reference,created_at,sent_at,locked,expires_at,
     quoted_price,computed_price)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);

  // seq, title, customer, contact, city, miles, drive, versions, facts
  const rows = [
    { seq: 7,  title: 'Kino Sports Complex — Shade',  cus: 'tucson',     con: 'angela', city: 'Tucson',    miles: 118, drive: 95,
      vers: [['A', 0, 'Base', 5390, 3876.08]], sent: '2026-05-04', approved: '2026-05-20',
      install: '2026-07-14', started: '2026-07-14', completed: '2026-07-16',
      invoiced: '2026-07-20', warranty: ['2026-07-20', '2027-07-20'] },

    { seq: 8,  title: 'Freestone Park Ramadas',       cus: 'haydon',     con: 'kyle',   city: 'Gilbert',   miles: 12,  drive: 20,
      vers: [['A', 0, 'Base', 61420, 43669.72]], sent: '2026-06-18', approved: '2026-07-02',
      install: '2026-09-28', started: '2026-09-28', shipAll: true },

    // ★ the signature row: green, with a red lip. Scheduled, equipment short.
    { seq: 9,  title: 'Dobson Park Ramadas',          cus: 'exerplay',   con: 'grant',  city: 'Chandler',  miles: 18,  drive: 24,
      vers: [['A', 0, 'Base', 43270, 30776.98]], sent: '2026-08-04', approved: '2026-08-19',
      install: '2026-09-22', shipShort: true },

    { seq: 10, title: 'San Tan Shade Installation',   cus: 'exerplay',   con: 'grant',  city: 'Chandler',  miles: 18,  drive: 24,
      vers: [['A', 0, 'Base — ramada, drilled footings', 17500, 12460.00],
             ['A', 1, 'Repriced — Sep 2026 steel',        18240, 13005.12],
             ['B', 0, 'Surface mount — no ramada',         4180,  3009.60]],
      sent: '2026-09-04' },

    { seq: 11, title: 'Riverview Park — Swing Bay',   cus: 'tucson',     con: 'angela', city: 'Mesa',      miles: 22,  drive: 28,
      vers: [['A', 0, 'Base', 32839, 23314.69]], sent: '2026-08-28', approved: '2026-09-08' },

    { seq: 12, title: 'Verrado Elementary — Ramada Add', cus: 'litchfield', con: 'dana', city: 'Buckeye',  miles: 46,  drive: 52,
      vers: [['A', 0, 'Base', 40710, 28904.10]], sent: '2026-08-28' },

    { seq: 13, title: 'Pecos Park — Bench Replacement', cus: 'cusd',     con: 'bev',    city: 'Chandler',  miles: 16,  drive: 22,
      vers: [['A', 0, 'Base', 11960, 8551.40]], sent: '2026-09-09' },

    // Quoted 11 Jul, so it is past the 30-day expiry: white row, red lip.
    { seq: 14, title: 'Desert Breeze — Shade Sails',   cus: 'cusd',      con: 'bev',    city: 'Chandler',  miles: 16,  drive: 22,
      vers: [['A', 0, 'Base', 26480, 18907.44]], sent: '2026-07-11' },
  ];

  for (const r of rows) {
    const pid = uid('prj', `26-${String(r.seq).padStart(2, '0')}`);
    PR.run({ id: pid, number: `26-${String(r.seq).padStart(2, '0')}`, seq: r.seq,
             title: r.title, customer: uid('cus', r.cus), address: null,
             city: r.city, state: 'AZ', zip: null,
             miles: r.miles, drive: r.drive, created: r.sent });
    PC.run(uid('pc', pid), pid, uid('con', r.con), 'primary');

    // The cc rows the contact_defaults rules WROTE when the primary was added.
    // They are ordinary rows from that moment on — editable, deletable, never
    // re-evaluated — so they are seeded as rows, not recomputed on read.
    // This is also what makes a company's project count differ from the sum of
    // its people's: Grant and Ashley are on the same jobs. docs/15.
    const cc = r.con === 'grant' ? 'ashley' : r.cus === 'cusd' ? 'rachel' : null;
    if (cc) PC.run(`${uid('pc', pid)}_${cc}`, pid, uid('con', cc), 'cc');

    r.vers.forEach(([letter, n, name, price = null, cost = null], i) => {
      const vid = `${pid}_${letter}${n}`;
      VE.run(vid, pid, letter, n, name, r.sent);

      // The estimate. Its 30-day expiry is what makes 26-14 flag.
      const ref = `BPCe-26-${String(r.seq).padStart(2, '0')}${letter}${n}`;
      // quoted_price is what the customer was shown; computed_price is what
      // the ENGINE priced — both are PRICES. Cost does not live on a document
      // at all; it lives on the calculation run that produced the price, which
      // is why a run is seeded below. Storing cost in computed_price is what
      // made the board compute margin against the wrong number.
      DO.run(uid('doc', ref), vid, 'e', ref, r.sent, r.sent, 1,
             addDays(r.sent, 30), price, price);

      // The run behind that price. A version with a priced, sent estimate had
      // a calculation behind it by definition — this is that calculation.
      // adjusted = computed ÷ (1 + markup); conditions are the gap between
      // adjusted and raw cost, and contingency is added FLAT, never marked up.
      if (price != null && cost != null) {
        // computed = adjusted × (1 + markup) + adjusted × contingency.
        // Contingency is added FLAT and is NEVER marked up, so the divisor is
        // 1.25 at 20% + 5%, not 1.20. Leaving it out is what made 26-10A0's
        // ladder fail to add up.
        RUN.run(`run_${vid}`, vid, 1, 'base', 'complete',
                cost, price / 1.25, price, r.sent);
      }

      // Facts only on the first version — the others are standing offers.
      if (i > 0) return;
      FA.run(vid, r.approved ?? null, r.invoiced ?? null, null);
      if (r.install || r.started) SC.run(vid, r.install ?? null, r.started ?? null, r.completed ?? null, 1);
      if (r.warranty) WA.run(vid, r.warranty[0], 12, r.warranty[1]);
      if (r.shipAll || r.shipShort) shipment(db, vid, r.shipShort);

      // Mobilization. The F-450 tows the flatbed on every job — that is the
      // rig, and it is a SERVICE, not an equipment selection. Without this the
      // equipment audit called the truck and the trailer unused on every job
      // they ever hauled.
      MOB.run(vid, 1, 2400, 20.0, 8.5, uid('eq', 'truck'), uid('eq', 'trailer'));
    });
  }
}

/** One truck. Short, when the project is meant to show the alarm. */
function shipment(db, versionId, short) {
  const sid = uid('shp', versionId);
  db.prepare(`INSERT INTO shipments (id,version_id,sequence_no,received_at,destination,truck_log_ref)
              VALUES (?,?,?,?,?,?)`).run(sid, versionId, 1, '2026-09-10', 'lot', 'EXP-88214');

  const IT = db.prepare(`INSERT INTO shipment_items
    (id,shipment_id,description,quantity_received,condition,issue_text,issue_opened_at)
    VALUES (?,?,?,?,?,?,?)`);

  IT.run(uid('si', sid + '_1'), sid, 'Steel posts 6 in × 22 ft', 8, 'approved', null, null);
  IT.run(uid('si', sid + '_2'), sid, 'Roof panels', 12, 'approved', null, null);
  short
    ? IT.run(uid('si', sid + '_3'), sid, 'Shade sail 20 ft × 20 ft', 1, 'issue',
             'only 1 of 2 sails on the truck — replacement promised 18 Sep', '2026-09-10')
    : IT.run(uid('si', sid + '_3'), sid, 'Benches, 6 ea', 6, 'approved', null, null);
}

/* ─── the equipment renders · three machines, three suppliers ───────────── */

function equipment(db) {
  const T = db.prepare(`INSERT INTO equipment (id,name,is_vehicle) VALUES (?,?,?)`);
  const S = db.prepare(`INSERT INTO suppliers (id,name,is_rental,is_materials,phone,account_ref,city,state)
                        VALUES (?,?,?,?,?,?,?,?)`);
  const M = db.prepare(`INSERT INTO equipment_sourcing_methods
    (id,equipment_id,name,kind,serial,supplier_id,rate,rate_basis,is_default,
     payload_lb,capacity_lb,tare_weight_lb,deck_length_ft,deck_width_ft,tow_capacity_lb,
     ship_weight_lb,ship_length_ft,ship_width_ft,ship_height_ft,move,in_service_at,odometer_mi)
    VALUES (@id,@eq,@name,@kind,@serial,@sup,@rate,@basis,@def,
            @payload,@cap,@tare,@deckL,@deckW,@tow,
            @shipW,@shipL,@shipWd,@shipH,@move,@inservice,@odo)`);

  for (const [id, name, veh] of [
    ['truck', 'truck', 1], ['trailer', 'trailer', 1],
    ['loader', 'loader', 0], ['boomlift', 'boom lift', 0],
    ['compactor', 'compactor', 0], ['excavator', 'excavator', 0],
  ]) T.run(uid('eq', id), name, veh);

  for (const [id, name, rental, materials, phone, acct, city] of [
    ['united',   'United Rentals',      1, 0, '(602) 555-0181', 'BPC-4471', 'Mesa'],
    ['sunstate', 'Sunstate Equipment',  1, 0, '(480) 555-0144', 'BPC-2209', 'Tempe'],
    ['herc',     'Herc Rentals',        1, 0, '(602) 555-0196', 'BPC-7731', 'Phoenix'],
  ]) S.run(uid('sup', id), name, rental, materials, phone, acct, city, 'AZ');

  const blank = { serial: null, sup: null, payload: null, cap: null, tare: null,
                  deckL: null, deckW: null, tow: null, shipW: null, shipL: null,
                  shipWd: null, shipH: null, move: null, inservice: null, odo: null };

  // Owned — the real fleet, with the rates from docs/18
  M.run({ ...blank, id: 'esm_f450', eq: uid('eq', 'truck'), name: '2012 Ford F-450',
          kind: 'owned', serial: '1FDUF4HT5CEC00001', rate: 0.8108, basis: 'mile', def: 1,
          payload: 4800, tow: 16000, inservice: '2024-03-14', odo: 41280 });
  M.run({ ...blank, id: 'esm_flatbed', eq: uid('eq', 'trailer'), name: '20 ft flatbed trailer',
          kind: 'owned', serial: '5JW1C2027M1000003', rate: 0.45, basis: 'mile', def: 1,
          cap: 10600, tare: 3400, deckL: 20, deckW: 8.5, inservice: '2024-03-14' });
  // A towable mixer. Owned, billed by the hour — docs/03e's "— " in the
  // Periods column is exactly this: an owned machine has no periods.
  db.prepare(`INSERT INTO equipment (id,name,is_vehicle) VALUES ('eq_mixer','mixer',0)`).run();

  M.run({ ...blank, id: 'esm_mixer', eq: uid('eq', 'mixer'), name: 'Towable mixer, 9 cf',
          kind: 'owned', serial: 'MX-0000-0005', rate: 42.00, basis: 'hour',
          inService: '2023-05-10', def: 1 });
  M.run({ ...blank, id: 'esm_t66', eq: uid('eq', 'loader'), name: 'Bobcat T66 skid steer',
          kind: 'owned', serial: 'B3T611234', rate: 210, basis: 'day', def: 1,
          shipW: 8400, shipL: 11.8, shipWd: 6.0, shipH: 6.8, inservice: '2024-06-02' });

  // Rented — the offerings from equipment-rented.v2
  // An offering NEEDS a name. The type is generic — United rent two different
  // boom lifts, and "boom lift" twice in one list is unusable.
  const offer = (id, eq, sup, name, rate, basis, move, shipW) =>
    M.run({ ...blank, id, eq: uid('eq', eq), sup: uid('sup', sup), name,
            kind: 'rented', rate, basis, def: 0, move, shipW });

  offer('esm_ur_boom64', 'boomlift',  'united',   "64' boom lift",          485, 'day', 'delivered', null);
  offer('esm_ur_boom45', 'boomlift',  'united',   "45' boom lift",          365, 'day', 'delivered', null);
  offer('esm_ur_flat',   'trailer',   'united',   '20 ft equipment trailer', 85, 'day', 'collected', null);
  offer('esm_ss_comp',   'compactor', 'sunstate', 'Plate compactor',         68, 'day', 'collected', 220);
  offer('esm_ss_truck',  'truck',     'sunstate', '¾ ton pickup',           145, 'day', 'collected', null);
  offer('esm_hr_mini',   'excavator', 'herc',     'Mini excavator',         310, 'day', 'delivered', 7100);

  // A weekly bracket: three day-rates, so it bites at four days
  const R = db.prepare(`INSERT INTO rental_rates (id,sourcing_method_id,basis,rate) VALUES (?,?,?,?)`);
  R.run('rr_boom64_wk', 'esm_ur_boom64', 'week', 1455);
  R.run('rr_truck_wk',  'esm_ss_truck',  'week', 435);
  R.run('rr_mini_wk',   'esm_hr_mini',   'week', 930);

  // Delivery and pickup, which get forgotten on a boom lift
  const F = db.prepare(`INSERT INTO fees (id,owner_type,owner_id,name,basis,amount) VALUES (?,?,?,?,?,?)`);
  for (const m of ['esm_ur_boom64', 'esm_ur_boom45']) {
    F.run(`fee_${m}_del`, 'equipment_sourcing_method', m, 'Delivery', 'flat', 150);
    F.run(`fee_${m}_pick`, 'equipment_sourcing_method', m, 'Pickup', 'flat', 150);
  }
  F.run('fee_boom64_dw', 'equipment_sourcing_method', 'esm_ur_boom64', 'Damage waiver', 'percent', 12);

  /* ── one fuel price per FUEL TYPE, not per fleet ───────────────────────
     A diesel F-450 and a gasoline pickup do not move together, so a single
     global number would be wrong the moment the fleet is mixed. A unit's
     `Fuel` specification says which price it uses. */
  const AS = db.prepare(`INSERT INTO app_settings (key,value,notes) VALUES (?,?,?)`);
  AS.run('vehicle.fuel_price.diesel',   '3.85', 'set 12 Jun 2026');
  AS.run('vehicle.fuel_price.gasoline', '3.40', 'set 12 Jun 2026');
  AS.run('vehicle.fuel_price.set_at',   '2026-06-12', null);
  AS.run('vehicle.rate_method', 'computed',
         'computed from inputs · the alternative is a typed rate per unit');

  /* ── the rate build-ups · docs/18 ──────────────────────────────────────
     Without these the detail pane's whole point — components that visibly
     sum to the rate — has nothing to show. Four decimals where they have to
     add up, two where it is a price. */
  const RI = db.prepare(`INSERT INTO vehicle_rate_inputs
    (sourcing_method_id,mpg,fuel_price,annual_maintenance,annual_miles,
     tyre_set_cost,tyre_life_miles,purchase_price,salvage_value,life_miles,
     insurance_annual,registration_annual,computed_rate,computed_at)
    VALUES (@id,@mpg,@fuel,@maint,@miles,@tyre,@tyreLife,@buy,@salvage,@life,
            @ins,@reg,@rate,@at)`);

  // 3.85/13 + 2800/15000 + 1600/50000 + 24000/250000 + 3000/15000 = 0.8108
  RI.run({ id: 'esm_f450', mpg: 13, fuel: null, maint: 2800, miles: 15000,
           tyre: 1600, tyreLife: 50000, buy: 38000, salvage: 14000, life: 250000,
           ins: 2400, reg: 600, rate: 0.8108, at: '2026-09-08' });

  // No engine, so no fuel line at all — mpg NULL, not zero. The trailer is the
  // honest detail in the fuel dialog: a recompute cannot touch it.
  // 900/6000 + 900/40000 + 7000/40000 + 615/6000 = 0.4500
  RI.run({ id: 'esm_flatbed', mpg: null, fuel: null, maint: 900, miles: 6000,
           tyre: 900, tyreLife: 40000, buy: 9000, salvage: 2000, life: 40000,
           ins: 300, reg: 315, rate: 0.4500, at: '2025-08-14' });   // 13 months — stale

  // The Bobcat is TYPED at $210/day. There is no mileage to divide by, so it
  // has no build-up and must not be given a fake one.

  /* ── specifications · the detail pane's SPECIFICATIONS box ──────────── */
  const SP = db.prepare(`INSERT INTO equipment_specifications
    (id,sourcing_method_id,name,value,unit,sequence_no) VALUES (?,?,?,?,?,?)`);
  const spec = (m, i, name, value, unit = null) =>
    SP.run(`spec_${m}_${i}`, m, name, value, unit, i);
  ['Make,Ford', 'Model,F-450 Super Duty', 'Year,2012', 'Fuel,Diesel',
   'GVWR,14000,lb', 'Bed,8.0,ft'].forEach((t, i) => spec('esm_f450', i, ...t.split(',')));
  ['Make,Big Tex', 'Model,22GN', 'Year,2021', 'Axles,2']
    .forEach((t, i) => spec('esm_flatbed', i, ...t.split(',')));
  ['Make,Bobcat', 'Model,T66', 'Year,2021', 'Fuel,Diesel',
   'Rated operating capacity,2200,lb', 'Lift height,10.9,ft']
    .forEach((t, i) => spec('esm_t66', i, ...t.split(',')));

}

/* ─── trackers.v1 ──────────────────────────────────────────────────────── */

function trackers(db) {
  const T = db.prepare(`INSERT INTO trackers
    (id,owner_type,sourcing_method_id,category,name,issuer,reference,
     effective_at,expires_at,renewal_months,cost,notice_days,due_days)
    VALUES (@id,@owner,@sm,@cat,@name,@issuer,@ref,@eff,@exp,@months,@cost,@notice,@due)`);

  const rows = [
    ['tr_gl',   'company', null, 'insurance', 'General liability', 'Acme Mutual', 'GL-4471',
     '2025-11-15', '2026-11-14', 12, 4180, 120, 60],
    ['tr_wc',   'company', null, 'insurance', 'Workers compensation', 'SCF Arizona', 'WC-88120',
     '2026-01-01', '2027-01-01', 12, 9640, 120, 60],
    ['tr_auto', 'company', null, 'insurance', 'Commercial auto', 'Acme Mutual', 'CA-4472',
     '2025-11-15', '2026-11-14', 12, 2960, 120, 60],
    ['tr_bond', 'company', null, 'bond', 'Contractor licence bond', 'Western Surety', 'B-229140',
     '2026-07-01', '2027-06-30', 12, 480, 120, 60],
    ['tr_roc',  'company', null, 'licence', 'AZ ROC contractor licence', 'AZ ROC', 'ROC-334982',
     '2025-04-01', '2027-03-31', 24, 340, 180, 90],
    ['tr_mesa', 'company', null, 'licence', 'Mesa business licence', 'City of Mesa', 'BL-9921',
     '2026-01-01', '2026-12-31', 12, 95, 120, 60],
    // No expiry — a classification is a permission you hold, not a date.
    ['tr_a14',  'company', null, 'classification', 'ROC A-14 · Fencing', 'AZ ROC', null,
     '2024-02-01', null, null, null, 120, 60],
    ['tr_reg',  'equipment', 'esm_f450', 'licence', 'Registration', 'AZ MVD', null,
     '2026-02-01', '2027-01-31', 12, 412, 45, 21],
    // Overdue, which is what makes the Trackers window show a red chip.
    ['tr_dot',  'equipment', 'esm_f450', 'licence', 'DOT inspection', 'AZ DPS', null,
     '2025-08-30', '2026-08-30', 12, 180, 60, 30],
  ];

  for (const [id, owner, sm, cat, name, issuer, ref, eff, exp, months, cost, notice, due] of rows)
    T.run({ id, owner, sm, cat, name, issuer, ref, eff, exp, months, cost, notice, due });

  // Renewal history — the only place a premium rising 6% a year is visible
  const R = db.prepare(`INSERT INTO tracker_renewals (id,tracker_id,renewed_at,expires_at,cost) VALUES (?,?,?,?,?)`);
  R.run('trr_gl_25', 'tr_gl', '2025-11-14', '2026-11-14', 4180);
  R.run('trr_gl_24', 'tr_gl', '2024-11-14', '2025-11-14', 3940);
  R.run('trr_gl_23', 'tr_gl', '2023-11-14', '2024-11-14', 3782);
}

function addDays(iso, n) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

module.exports = { seed };


/* ─── the catalog · docs/03a–03c ─────────────────────────────────────────
   Enough of one to make the Scope tab real. These are invented, like the
   fleet and the eight projects — what matters is that a scope row can name a
   manufacturer, a part number and a category, and that a service row cannot.
   ────────────────────────────────────────────────────────────────────── */

function catalog(db) {
  const C = db.prepare(`INSERT INTO components
    (id,name,manufacturer,part_number,type,status,ship_weight_lb,ship_length_ft,
     ship_width_ft,ship_height_ft)
    VALUES (@id,@name,@mfr,@part,@type,'active',@w,@l,@wd,@h)`);
  const IM = db.prepare(`INSERT INTO installation_methods
    (id,component_id,code,name,duration_hr,is_default) VALUES (?,?,?,?,?,?)`);

  // id, name, manufacturer, part, category, [methods], ship w/l/wd/h
  const parts = [
    ['pb_deck',  'Deck, square 48"',      'Landscape Structures', 'PB-D4848', 'Deck',
     [['DB', 'Direct bury', 2.5, 1]], 310, 4.2, 4.2, 0.6],
    ['pb_post',  "Post, 5\" × 12'",       'Landscape Structures', 'PB-P512',  'Post',
     [['DB', 'Direct bury', 1.5, 1]], 96, 12.0, 0.5, 0.5],
    ['pb_slide', 'Slide, 6 ft spiral',    'Landscape Structures', 'PB-S6SP',  'Slide',
     [['BO', 'Bolt on', 3.0, 1]], 240, 8.0, 3.0, 6.0],
    ['pb_arch',  'Arch Climber Panel',    'Landscape Structures', 'PB-88412', 'Play panel',
     [['BO', 'Bolt on', 1.5, 1]], 85, 4.0, 3.5, 0.4],
    ['pb_barr',  'Barrier Panel',         'Landscape Structures', 'PB-BR100', 'Play panel',
     [['BO', 'Bolt on', 1.0, 1]], 62, 4.0, 3.0, 0.3],
    ['pb_grab',  'Grab Handle, straight', 'Landscape Structures', 'PB-2201',  'Hardware',
     [['BO', 'Bolt on', 0.3, 1]], 4, 1.5, 0.3, 0.3],
    ['hip_shade','24x24x12 Hip Shade',    'Shade Systems',        'HIP-242412','Shade structure',
     [['SM', 'Surface mount', 9.0, 1], ['DB', 'Direct bury', 11.0, 0]], 1850, 24.0, 24.0, 12.0],
    ['bench6',   'Bench, 6 ft',           'Exerplay',             'BN-6',     'Site furnishing',
     [['DB', 'Direct bury', 1.2, 1], ['SM', 'Surface mount', 0.8, 0]], 140, 6.0, 2.0, 2.5],
  ];

  for (const [id, name, mfr, part, type, methods, w, l, wd, h] of parts) {
    C.run({ id: `cmp_${id}`, name, mfr, part, type, w, l, wd, h });
    methods.forEach(([code, mname, hrs, def], i) =>
      IM.run(`im_${id}_${code}`, `cmp_${id}`, code, mname, hrs, def));
  }

  // Materials. Native soil, removed EWF and concrete are three different
  // disposal bills, so they are three materials rather than one "spoil".
  const M = db.prepare(`INSERT INTO materials
    (id,name,category,base_unit,density_lb_per_cy,swell_factor,waste_pct)
    VALUES (?,?,?,?,?,?,?)`);
  M.run('mat_soil',  'Native soil — hard clay', 'Earth',     'CY', 2700, 1.25, 0);
  M.run('mat_ewf',   'Engineered wood fibre',   'Surfacing', 'CY',  600, 1.15, 5);
  M.run('mat_conc',  'Concrete, 3000 psi',      'Concrete',  'CY', 4050, null, 8);

  // Footings. "— catalog —" on a scope row means the method's own footing
  // stands; an override names one of these instead.
  const F = db.prepare(`INSERT INTO footing_specs
    (id,name,shape,diameter_ft,depth_ft) VALUES (?,?,?,?,?)`);
  F.run('ft_f1x2',  'F-1x2',  'cylindrical', 1.0, 2.0);
  F.run('ft_f2x4',  'F-2x4',  'cylindrical', 2.0, 4.0);
  F.run('ft_f3x12', 'F-3x12', 'cylindrical', 3.0, 12.0);

  // Services. A service row carries NO manufacturer and NO part number — the
  // Scope tab leaves those cells genuinely blank, not dashed.
  const S = db.prepare(`INSERT INTO services
    (id,name,category,binding,binds_to_spec_type,default_unit,duration_hr_per_unit)
    VALUES (?,?,?,?,?,?,?)`);
  S.run('svc_excav',   'Site excavation',             'Earthwork',     'standalone', null, 'CY', 0.35);
  S.run('svc_ewf',     'Remove EWF surfacing',        'Surfacing',     'standalone', null, 'SF', 0.004);
  S.run('svc_ft_dig',  'Excavate footing',            'Earthwork',     'spec_bound', 'footing_spec', 'EA', 0.75);
  S.run('svc_ft_pour', 'Set & pour footing',          'Earthwork',     'spec_bound', 'footing_spec', 'EA', 1.10);
  S.run('svc_locate',  'Private utility line locate', 'Site services', 'standalone', null, 'LS', 4.0);

  // What a service PRODUCES. Excavating generates spoil, and spoil is a
  // disposal bill — native soil, removed EWF and concrete are three different
  // bills, which is why they are three materials.
  db.prepare(`UPDATE services SET generates_material_id = ?, generates_qty_per_unit = ?
               WHERE id = ?`).run('mat_soil', 1.0, 'svc_excav');
  // 1,700 SF lifted 1 ft deep is 1,700 cf — 62.96 CY bank.
  db.prepare(`UPDATE services SET generates_material_id = ?, generates_qty_per_unit = ?
               WHERE id = ?`).run('mat_ewf', 1 / 27, 'svc_ewf');

  /* ── what KIND of work a service is ───────────────────────────────────
     A site condition does not make every task harder. Hard clay slows the
     digging; it does not slow bolting a panel on. So a condition carries
     tags and applies only to work that carries the same one. */
  const ST = db.prepare(`INSERT INTO service_tags (service_id,tag) VALUES (?,?)`);
  ST.run('svc_excav',   'EXCAVATION');
  ST.run('svc_ft_dig',  'EXCAVATION');
  ST.run('svc_ewf',     'EXCAVATION');
  ST.run('svc_ewf',     'MATERIAL_HANDLING');
  ST.run('svc_ft_pour', 'MATERIAL_HANDLING');
  // svc_locate carries none: a utility locate is unaffected by either.

  /* ── labour · docs/03g names the three roles and their rates ─────────── */
  const LR = db.prepare(`INSERT INTO labor_roles (id,name,hourly_rate) VALUES (?,?,?)`);
  LR.run('lr_installer', 'Installer', 68.00);
  LR.run('lr_laborer',   'Laborer',   52.00);
  LR.run('lr_operator',  'Operator',  82.00);

  // Crew on an installation METHOD: duration is clock time, crew turns it
  // into man-hours. Three installers on a deck is 3× the man-hours of one.
  const IMC = db.prepare(`INSERT INTO installation_method_crew
    (id,installation_method_id,labor_role_id,count) VALUES (?,?,?,?)`);
  for (const [m, n] of [['im_pb_deck_DB', 3], ['im_pb_post_DB', 3],
                        ['im_pb_slide_BO', 2], ['im_pb_arch_BO', 2],
                        ['im_pb_barr_BO', 2], ['im_pb_grab_BO', 1],
                        ['im_hip_shade_SM', 3], ['im_hip_shade_DB', 3],
                        ['im_bench6_DB', 2], ['im_bench6_SM', 2]]) {
    IMC.run(`imc_${m}`, m, 'lr_installer', n);
  }

  const SC = db.prepare(`INSERT INTO service_crew
    (id,service_id,labor_role_id,count) VALUES (?,?,?,?)`);
  SC.run('sc_excav',   'svc_excav',   'lr_operator', 1);
  SC.run('sc_ewf',     'svc_ewf',     'lr_laborer',  2);
  SC.run('sc_ft_dig',  'svc_ft_dig',  'lr_operator', 1);
  SC.run('sc_ft_pour', 'svc_ft_pour', 'lr_laborer',  2);
  SC.run('sc_locate',  'svc_locate',  'lr_laborer',  1);

  // Equipment a service runs. The machine may run for only part of the
  // duration, which is why it is its own field.
  db.prepare(`UPDATE services SET equipment_id = ?, equipment_hr_per_unit = ?
               WHERE id = ?`).run('eq_excavator', 0.25, 'svc_excav');

  /* ── spec-bound rates · and the gap the briefs are built around ───────
     A footing service is priced PER SPEC: digging a 1 ft hole and a 3 ft hole
     are not the same job. svc_ft_dig has NO RATE FOR F-2x4 — that gap is
     deliberate. It is the "Excavate Footing has no rate for F-2x4" problem
     the Requirements and Cost tabs are written around, and nothing is
     interpolated to fill it. */
  const SR = db.prepare(`INSERT INTO service_rates
    (id,service_id,footing_spec_id,duration_hr_per_ea,equipment_id,equipment_hr_per_ea)
    VALUES (?,?,?,?,?,?)`);
  SR.run('sr_dig_f1x2',  'svc_ft_dig',  'ft_f1x2',  0.30, 'eq_excavator', 0.20);
  SR.run('sr_dig_f3x12', 'svc_ft_dig',  'ft_f3x12', 1.20, 'eq_excavator', 0.90);
  //    ⛔ svc_ft_dig × ft_f2x4 is MISSING ON PURPOSE.
  SR.run('sr_pour_f1x2', 'svc_ft_pour', 'ft_f1x2',  0.40, 'eq_mixer', 0.20);
  SR.run('sr_pour_f2x4', 'svc_ft_pour', 'ft_f2x4',  0.70, 'eq_mixer', 0.40);
  SR.run('sr_pour_f3x12','svc_ft_pour', 'ft_f3x12', 1.60, 'eq_mixer', 1.10);

  /* ── what an installation method REQUIRES ─────────────────────────────
     A direct-bury post needs a footing; a bolt-on panel does not. This is
     where "— catalog —" in the Footing column comes from. */
  const RQ = db.prepare(`INSERT INTO requirements
    (id,installation_method_id,requirement_type,referenced_id,quantity,binding_tag)
    VALUES (?,?,?,?,?,?)`);
  RQ.run('rq_post',  'im_pb_post_DB', 'footing_spec', 'ft_f2x4', 1, 'footings');
  RQ.run('rq_deck',  'im_pb_deck_DB', 'footing_spec', 'ft_f2x4', 1, 'footings');
  RQ.run('rq_bench', 'im_bench6_DB',  'footing_spec', 'ft_f1x2', 2, 'footings');

  /* ── how a material is BOUGHT ─────────────────────────────────────────
     Purchase rounding is its own rounding: you cannot buy 2.91 CY of
     ready-mix, you buy 3.50. */
  const PM = db.prepare(`INSERT INTO procurement_methods
    (id,material_id,name,supplier_id,purchase_unit,units_per_purchase,unit_price,
     waste_pct,round_purchase_to,minimum_quantity,is_default)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  PM.run('pm_concrete', 'mat_conc', 'Ready-mix, ABC Concrete', null,
         'CY', 1, 185.00, 5, 0.5, null, 1);

  const PF = db.prepare(`INSERT INTO fees
    (id,owner_type,owner_id,name,basis,amount,condition_field,condition_op,
     condition_value,sequence_no) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  PF.run('fee_conc_del',  'procurement_method', 'pm_concrete', 'Delivery',
         'flat', 85.00, null, null, null, 0);
  // A fee that does not apply is SHOWN GREYED WITH ITS REASON, never hidden.
  PF.run('fee_conc_short','procurement_method', 'pm_concrete', 'Short load',
         'flat', 150.00, 'purchased_quantity', '<', 4.0, 1);
  PF.run('fee_conc_fuel', 'procurement_method', 'pm_concrete', 'Fuel surcharge',
         'percent', 3, null, null, null, 2);

  /* ── how an output is DISPOSED OF ────────────────────────────────────
     Removed EWF has NO disposition method, on purpose. "— not selected —"
     is not "$0.00": an output with no disposition is a hole in the estimate,
     not a free one. That is the second of the two problems. */
  const DM = db.prepare(`INSERT INTO disposition_methods
    (id,material_id,name,supplier_id,billing_basis,rate,truck_capacity_cy,is_default)
    VALUES (?,?,?,?,?,?,?,?)`);
  DM.run('dm_soil', 'mat_soil', 'Haul off, Miller Pit', null, 'per_ton', 38.00, 12, 1);
  PF.run('fee_soil_gate', 'disposition_method', 'dm_soil', 'Gate fee',
         'flat', 220.00, null, null, null, 0);
}

/* ─── the scope of 26-10A0 · docs/03c renders exactly this ──────────────── */

function scope(db) {
  const vid = 'prj_26-10_A0';
  const G = db.prepare(`INSERT INTO scope_groups
    (id,version_id,name,note,sequence_no,collapsed) VALUES (?,?,?,?,?,?)`);
  const O = db.prepare(`INSERT INTO cost_objects
    (id,version_id,kind,delta_id,group_id,component_id,installation_method_id,
     service_id,quantity,unit,sequence_no)
    VALUES (@id,@v,@kind,@delta,@grp,@cmp,@im,@svc,@qty,@unit,@seq)`);
  const blank = { v: vid, delta: null, grp: null, cmp: null, im: null,
                  svc: null, qty: 1, unit: 'EA', seq: 0 };

  // The cost breakdown document itself. BPCc- is the classifier; the letter
  // 'c' is what doc_type stores.
  db.prepare(`INSERT INTO documents (id,version_id,doc_type,reference,created_at,locked)
              VALUES (?,?,'c',?,?,0)`)
    .run('doc_c_26-10A0', vid, 'BPCc-26-10A0', '2026-09-07');

  // docs/03a's ladder: contingency 5%, markup 20%. Contingency is added FLAT
  // and is NEVER marked up.
  db.prepare(`UPDATE versions SET markup_pct = 20, contingency_pct = 5`).run();

  G.run('grp_pb', vid, 'PlayBooster PB-4400', 'Landscape Structures', 0, 0);
  G.run('grp_shade', vid, 'Shade and site furnishings', null, 1, 1);  // collapsed

  const row = (id, grp, cmp, code, qty, seq) => O.run({ ...blank, id, kind: 'scope_row',
    grp, cmp: `cmp_${cmp}`, im: `im_${cmp}_${code}`, qty, seq });

  row('co_deck',  'grp_pb', 'pb_deck',  'DB', 4, 0);
  row('co_post',  'grp_pb', 'pb_post',  'DB', 6, 1);
  row('co_slide', 'grp_pb', 'pb_slide', 'BO', 1, 2);
  row('co_arch',  'grp_pb', 'pb_arch',  'BO', 2, 3);
  row('co_barr',  'grp_pb', 'pb_barr',  'BO', 3, 4);
  row('co_grab',  'grp_pb', 'pb_grab',  'BO', 6, 5);

  row('co_hip',   'grp_shade', 'hip_shade', 'SM', 1, 6);
  row('co_bench', 'grp_shade', 'bench6',    'DB', 4, 7);

  // Ungrouped. An ungrouped row is just a row — there is no "Ungrouped" header.
  O.run({ ...blank, id: 'co_excav', kind: 'direct_service', svc: 'svc_excav',
          qty: 12, unit: 'CY', seq: 8 });
  O.run({ ...blank, id: 'co_ewf', kind: 'direct_service', svc: 'svc_ewf',
          qty: 1700, unit: 'SF', seq: 9 });

  /* ── add options · priced as a MARGINAL recompute ──────────────────────
     An option can come out cheaper than pricing it on its own because it
     rides on the same concrete truck. The prices here are the deltas two
     calculation runs produced; the engine will recompute them. */
  const D = db.prepare(`INSERT INTO scope_deltas
    (id,version_id,kind,sequence_no,name,attaches_to,estimate_line_id,price_delta,cost_delta)
    VALUES (?,?,'add_option',?,?,?,?,?,?)`);
  D.run('dl_footing', vid, 1, 'Footing installation', 'line', 'co_hip', 1045.00, 742.95);
  D.run('dl_locate',  vid, 2, 'Private utility line locate', 'job', null, 1200.00, 860.00);

  const FO = db.prepare(`UPDATE cost_objects SET footing_override_id = ? WHERE id = ?`);
  O.run({ ...blank, id: 'co_ft_dig',  kind: 'direct_service', delta: 'dl_footing',
          svc: 'svc_ft_dig',  qty: 4, unit: 'EA', seq: 0 });
  O.run({ ...blank, id: 'co_ft_pour', kind: 'direct_service', delta: 'dl_footing',
          svc: 'svc_ft_pour', qty: 4, unit: 'EA', seq: 1 });
  // A spec-bound service has to say WHICH spec. "Excavate footing, F-3x12".
  FO.run('ft_f3x12', 'co_ft_dig');
  FO.run('ft_f3x12', 'co_ft_pour');
  O.run({ ...blank, id: 'co_locate',  kind: 'direct_service', delta: 'dl_locate',
          svc: 'svc_locate',  qty: 1, unit: 'LS', seq: 0 });

  /* ── site conditions · they move OUT of the identity strip and into the
        Scope tab's own body, where they belong. docs/03j. */
  const PC = db.prepare(`INSERT INTO project_conditions
    (id,project_id,name,multiplier,affects_equipment,sequence_no) VALUES (?,?,?,?,?,?)`);
  PC.run('pc_26-10_soil',   'prj_26-10', 'soil — hard clay',    1.15, 1, 0);
  PC.run('pc_26-10_access', 'prj_26-10', 'access — restricted', 1.30, 1, 1);
  db.prepare(`UPDATE projects SET native_material_id = ? WHERE id = ?`)
    .run('mat_soil', 'prj_26-10');

  const PCT = db.prepare(`INSERT INTO project_condition_tags (condition_id,tag) VALUES (?,?)`);
  PCT.run('pc_26-10_soil',   'EXCAVATION');
  PCT.run('pc_26-10_access', 'MATERIAL_HANDLING');
}


/* ─── the estimate of 26-10A0 · docs/05f · 05g · 05h ─────────────────────
   The document the customer sees. Its lines are UNIT PRICED and they sum to
   the quoted total; cost appears nowhere on them — it lives on the cost
   objects assigned to each line, and surfaces only inside a row expansion.
   ────────────────────────────────────────────────────────────────────── */

const round2 = (n) => Math.round(n * 100) / 100;

function estimate(db) {
  const vid = 'prj_26-10_A0';
  const doc = db.prepare(
    `SELECT id FROM documents WHERE version_id = ? AND doc_type = 'e'`).get(vid);
  if (!doc) return;

  // COMPUTED is what the engine priced; QUOTED is what you decided to charge.
  // The gap between them is the discount, and it is the whole point of the
  // price bar.
  /* ── RUN THE ENGINE ───────────────────────────────────────────────────
     26-10A0 is the one version with a real scope and a real catalog behind
     it, so its numbers are CALCULATED rather than typed. The placeholder run
     seeded with every other version is replaced by the engine's own. */
  const { calculate, persist } = require('./engine.js');
  db.prepare(`DELETE FROM calculation_runs WHERE version_id = ?`).run(vid);
  const result = calculate(db, vid);
  persist(db, vid, result, { today: '2026-09-04' });

  /* ── add options are priced as a MARGINAL RECOMPUTE ───────────────────
     What the job costs WITH the option, minus what it costs without. That is
     why an option can come out cheaper than pricing it on its own: it rides
     on the same concrete truck. Each one gets its own run. */
  const deltaLines = new Map();
  for (const d of db.prepare(
    `SELECT id FROM scope_deltas WHERE version_id = ? ORDER BY sequence_no`).all(vid)) {
    const withIt = calculate(db, vid, { includeDeltas: [d.id] });
    persist(db, vid, withIt, { purpose: 'delta_price', today: '2026-09-04' });
    db.prepare(`UPDATE scope_deltas SET cost_delta = ?, price_delta = ? WHERE id = ?`)
      .run(round2(withIt.money.cost - result.money.cost),
           round2(withIt.money.price - result.money.price), d.id);
    for (const l of withIt.lines) {
      if (!result.lines.some((b) => b.objId === l.objId)) {
        deltaLines.set(l.objId, (deltaLines.get(l.objId) ?? 0) + l.extendedCost);
      }
    }
  }

  // COMPUTED is what the engine priced. QUOTED is what you decided to charge,
  // and the gap between them is the discount — a decision, not a calculation.
  db.prepare(`UPDATE documents SET computed_price = ?, quoted_price = 17500.00
               WHERE id = ?`).run(result.money.price, doc.id);

  const L = db.prepare(`INSERT INTO document_lines
    (id,document_id,parent_id,sequence_no,line_number,label,design_no,
     quantity,unit,unit_price,amount,section,from_scope_group_id,delta_id)
    VALUES (@id,@doc,@parent,@seq,@no,@label,@design,@qty,@unit,@price,@amount,
            @section,@grp,@delta)`);
  const base = { doc: doc.id, parent: null, no: null, design: null, qty: 1,
                 unit: 'LS', section: 'scope', grp: null, delta: null };

  //   no  id         label                                     qty unit  amount
  L.run({ ...base, id: 'dl_01', seq: 0, no: 1,
          label: 'INSTALLATION of Design #4471', design: '4471',
          price: 10588.82, amount: 10588.82, grp: 'grp_pb' });
  L.run({ ...base, id: 'dl_01_1', parent: 'dl_01', seq: 1,
          label: 'PlayBooster PB-4400 — decks, posts, panels, slide',
          price: null, amount: null });     // a sub-item is INCLUSIVE and PARTIAL
  L.run({ ...base, id: 'dl_02', seq: 2, no: 2, label: '24x24x12 Hip Shade',
          qty: 1, unit: 'EA', price: 3138.23, amount: 3138.23 });
  L.run({ ...base, id: 'dl_03', seq: 3, no: 3, label: 'Bench, 6 ft',
          qty: 4, unit: 'EA', price: 125.77, amount: 503.08 });
  // LINE-SPECIFIC add option — 02.O1. It hangs off line 02 and is excluded
  // from the total, same as a job-level one.
  L.run({ ...base, id: 'dl_02_o1', parent: 'dl_02', seq: 3,
          label: 'Footing installation', price: 1045.00, amount: 1045.00,
          delta: 'dl_footing' });
  L.run({ ...base, id: 'dl_04', seq: 4, no: 4,
          label: 'SITE WORK — excavation and EWF removal',
          price: 2818.11, amount: 2818.11 });
  L.run({ ...base, id: 'dl_04_1', parent: 'dl_04', seq: 5,
          label: 'Site excavation', qty: 12, unit: 'CY', price: null, amount: null });
  L.run({ ...base, id: 'dl_04_2', parent: 'dl_04', seq: 6,
          label: 'Remove EWF surfacing', qty: 1700, unit: 'SF', price: null, amount: null });
  // Mobilization has NO cost objects. Expanded it reads "— no cost objects —",
  // which is a real state the screen has to render.
  L.run({ ...base, id: 'dl_05', seq: 7, no: 5, label: 'Mobilization',
          price: 451.76, amount: 451.76 });

  // Job-level add options are EXCLUDED from the total — the headline reads
  // "BASE SCOPE, OPTIONS EXCLUDED".
  L.run({ ...base, id: 'dl_o1', seq: 8, label: 'Private utility line locate',
          price: 1200.00, amount: 1200.00, section: 'job_add_option',
          delta: 'dl_locate' });

  /* ── cost objects assigned to lines · docs/05f ──────────────────────────
     A line's cost is everything assigned to it OR to anything beneath it, so
     the PlayBooster parts hang off the sub-item and still count toward 01. */
  const A = db.prepare(`INSERT INTO document_line_objects
    (id,document_id,document_line_id,cost_object_id,allocated_cost) VALUES (?,?,?,?,?)`);

  // What each cost object COSTS is the engine's answer, summed from its cost
  // lines — never a number typed beside it. Which LINE it lands on is the
  // only decision here.
  const byObject = new Map(deltaLines);
  for (const l of result.lines) {
    byObject.set(l.objId, (byObject.get(l.objId) ?? 0) + l.extendedCost);
  }
  // An object the engine never costed has an UNKNOWN cost, not a zero one —
  // co_ft_dig has no rate for its spec, so nobody knows what it costs.
  const assign = (obj, line) =>
    A.run(`dlo_${obj}`, doc.id, line, obj,
          byObject.has(obj) ? round2(byObject.get(obj)) : null);

  assign('co_deck',  'dl_01_1');
  assign('co_post',  'dl_01_1');
  assign('co_slide', 'dl_01_1');
  assign('co_arch',  'dl_01_1');
  assign('co_barr',  'dl_01_1');
  assign('co_grab',  'dl_01_1');
  assign('co_hip',   'dl_02');
  assign('co_bench', 'dl_03');
  assign('co_excav', 'dl_04_1');
  assign('co_ewf',   'dl_04_2');
  assign('co_ft_dig', 'dl_02_o1');
  assign('co_ft_pour','dl_02_o1');
  assign('co_locate', 'dl_o1');

  // An option's amount on the document IS its marginal price — what the job
  // costs with it minus without, marked up. Typing a different number is
  // allowed, but the default has to be the computation.
  for (const [line, delta] of [['dl_02_o1', 'dl_footing'], ['dl_o1', 'dl_locate']]) {
    const d = db.prepare(`SELECT price_delta FROM scope_deltas WHERE id = ?`).get(delta);
    db.prepare(`UPDATE document_lines SET unit_price = ?, amount = ? WHERE id = ?`)
      .run(d.price_delta, d.price_delta, line);
  }

  const N = db.prepare(`INSERT INTO document_notes
    (id,document_id,line_id,kind,text,sequence_no) VALUES (?,?,?,?,?,?)`);
  N.run('dn_1', doc.id, 'dl_04', 'assumption',
        'Spoil hauled off site. Price assumes no rock or caliche below 18".', 0);
  N.run('dn_2', doc.id, null, 'exclusion',
        'Permits, fencing and private utility locating by others unless optioned.', 1);
}


/* ─── rental evidence · needs versions, so it runs after them ─────────── */

function rentalEvidence(db) {
  /* ── what you were actually billed · docs/18 ──────────────────────────
     The card is what costing uses; last paid is evidence. They are seeded
     apart on purpose, because the gap between them is the Rented tab's
     entire reason for existing. */
  const LP = db.prepare(`UPDATE equipment_sourcing_methods
    SET last_paid_rate = ?, last_paid_at = ?, last_paid_version_id = ?,
        last_paid_source = ?, last_paid_recorded_at = ?, rate_confirmed_at = ?
    WHERE id = ?`);
  //      id               paid   on            version      confirmed
  LP.run(520, '2026-08-22', 'prj_26-09_A0', 'post_cost', '2026-08-25', '2026-03-14', 'esm_ur_boom64');
  LP.run(365, '2026-06-11', null,           'typed',     '2026-06-12', '2026-03-14', 'esm_ur_boom45');
  LP.run(68,  '2026-09-04', null,           'post_cost', '2026-09-06', '2026-09-04', 'esm_ss_comp');
  LP.run(145, '2026-07-18', null,           'post_cost', '2026-07-20', '2026-07-18', 'esm_ss_truck');
  LP.run(345, '2026-09-19', null,           'post_cost', '2026-09-21', '2026-05-02', 'esm_hr_mini');
  // esm_ur_flat is left alone — never rented, and its card was last confirmed
  // over a year ago. One row has to be each of those or the counters are
  // decoration.
  db.prepare(`UPDATE equipment_sourcing_methods SET rate_confirmed_at = ? WHERE id = ?`)
    .run('2025-06-01', 'esm_ur_flat');
}
