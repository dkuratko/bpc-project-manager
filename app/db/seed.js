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
    projects(db);
    equipment(db);
    trackers(db);
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
      // the engine said it costs. GM% is the gap, and it is NULL unless both
      // exist — docs/22.
      DO.run(uid('doc', ref), vid, 'e', ref, r.sent, r.sent, 1,
             addDays(r.sent, 30), price, cost);

      // Facts only on the first version — the others are standing offers.
      if (i > 0) return;
      FA.run(vid, r.approved ?? null, r.invoiced ?? null, null);
      if (r.install || r.started) SC.run(vid, r.install ?? null, r.started ?? null, r.completed ?? null, 1);
      if (r.warranty) WA.run(vid, r.warranty[0], 12, r.warranty[1]);
      if (r.shipAll || r.shipShort) shipment(db, vid, r.shipShort);
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
