/* ================================================================
   Document Builder — seed document
   The estimate is a FLAT list of rows (the design's core idea:
   "everything is a row"). Hierarchy is expressed by kind + parent:
     line     top-level activity; additive to the subtotal
     sub      indented breakdown of a line; "within the line price"
     option   a per-line or add-on choice; additive only when accepted
     note     an italic disclaimer band (belongs to the row above)
     rollup   a small grey caption summarising a collapsed/hidden group
     section  a full-width band that starts a group (e.g. Add-on options)

   Amount is COMPUTED (flat -> price, else qty*price). Money shown here
   is just the seed; totals in the app are always recalculated.
   ================================================================ */

const SEED_DOC = {
  meta: {
    number: 'BPC-26-6C0',
    status: 'DRAFT',
    customer: 'Northgate HOA',
    desc: 'Pocket park, Overland Park KS',
    rep: 'J. Galion',
    project: 'BPC-26-6 Northgate HOA Pocket Park',
    savedAgo: '2 minutes ago'
  },
  settings: {
    template: 'Build Play standard',
    taxRate: 0,
    validDays: 30,
    showQty: true,
    includeTerms: true,
    includeAcceptance: true,
    showGroupSubtotals: false,
    subtotalRule: 'customer'   // 'customer' = bill only customer-facing lines
  },
  columns: { tags: true, qtyUnit: true, costMargin: false, notes: true },
  groupBy: '(none)',
  ui: { showPreview: true, page: 1, pages: 3, selectedId: 'r-panels', selStyle: 1 },

  rows: [
    /* ---- Line 1: Kid Builders, with sub-breakdown + options ---- */
    { id:'r-kid',    kind:'line', name:'Miracle Recreation — Kid Builders 5–12', tags:['Equipment'],
      qty:1, unit:'EA', price:30256, cost:26980, collapsed:false, hasNote:true,
      note:'Includes standard hardware and colour selection sheet. Freight quoted separately below.' },
    { id:'r-slide',  kind:'sub', parent:'r-kid', name:'Slide, 6 ft wave',            qty:1, unit:'EA', price:850 },
    { id:'r-stairs', kind:'sub', parent:'r-kid', name:'Climbing stairs & deck',      qty:1, unit:'EA', price:850 },
    { id:'r-panels', kind:'sub', parent:'r-kid', name:'Activity panels (x3)',        qty:3, unit:'EA', price:1650, model:'#KB-AP3',
      hasNote:true, note:'Panel selection to be confirmed before the order is placed.' },
    { id:'r-climb',  kind:'sub', parent:'r-kid', name:'Overhead horizontal climber', qty:1, unit:'EA', price:700 },
    { id:'r-bury',   kind:'option', parent:'r-kid', name:'Direct bury',              qty:1, unit:'EA', price:450, accepted:true },
    { id:'r-surf',   kind:'option', parent:'r-kid', name:'Surface mount — not accepted', qty:1, unit:'EA', price:380, accepted:false },
    { id:'r-kid-roll', kind:'rollup', parent:'r-kid' },   // live sub-item cost tracker

    /* ---- Line 2: Trash receptacle, collapsed ---- */
    { id:'r-trash',  kind:'line', name:'ANOVA — Rendezvous 32 Gallon Trash Receptacle', tags:['Site furn'],
      qty:2, unit:'EA', price:150, cost:118, collapsed:true },
    { id:'r-trash-anchor', kind:'sub', parent:'r-trash', name:'Surface-mount anchor kit', qty:2, unit:'EA', price:38 },
    { id:'r-trash-roll', kind:'rollup', parent:'r-trash' },   // live sub-item cost tracker

    /* ---- Line 3: Surfacing ---- */
    { id:'r-rubber', kind:'line', name:'Poured rubber surfacing, 2 in — 1,850 sf', tags:['Surfacing'],
      qty:1, unit:'LS', price:10382, cost:9100, hasNote:true,
      note:'Priced on good soil conditions. Hard-dig and collapsing soil excluded.',
      disclaimer:'Final surfacing depth and square footage are verified on site at install; any overage is billed at the unit rate above and is not included in this estimate total.' },

    /* ---- Line 4 ---- */
    { id:'r-edge',   kind:'line', name:'Border edging — 120 lf', tags:['Surfacing'], qty:1, unit:'LS', price:1635, cost:1410 },

    /* ---- Line 5: flat charge ---- */
    { id:'r-excav',  kind:'line', name:'Excavation and footings', tags:['Site work'], flat:true, price:2518, cost:2200 },

    /* ---- Line 6: flat charge ---- */
    { id:'r-labour', kind:'line', name:'Install labour', tags:['Labour'], flat:true, price:7974, cost:7974 },

    /* ---- Line 7: internal (not shown to the customer) ---- */
    { id:'r-rental', kind:'line', name:'Equipment rental — skid steer', tags:['Site work'], qty:2, unit:'DAY', price:549, cost:1098, internal:true },
    { id:'r-rental-roll', kind:'rollup', parent:'r-rental', text:'Not shown to the customer — its cost stays in the margin' },

    /* ---- Line 8 ---- */
    { id:'r-freight', kind:'line', name:'Inbound freight, 3 loads', tags:['Freight'], qty:1, unit:'LS', price:2659, cost:2659 },

    /* ---- Line 9: hidden line ---- */
    { id:'r-permit', kind:'line', name:'Permit filing fee', tags:['Admin'], flat:true, price:90, cost:90, hidden:true },

    /* ---- Add-on options group ---- */
    { id:'r-addon',  kind:'section', name:'Add-on options — not included unless accepted' },
    { id:'r-shade',  kind:'option', group:'addon', optionLabel:'OPTION 1', name:'Shade sail, 12 ft square', qty:1, unit:'EA', price:4800, cost:4100, accepted:true },
    { id:'r-bench',  kind:'option', group:'addon', optionLabel:'OPTION 2', name:'Bench, 6 ft recycled plastic', qty:1, unit:'EA', price:1200, cost:980, accepted:false },
    { id:'r-addon-note', kind:'note', group:'addon', text:'Priced for installation at the same visit.' }
  ]
};

if (typeof module !== 'undefined') module.exports = { SEED_DOC };
