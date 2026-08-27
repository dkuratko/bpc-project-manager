/* ============================================================
   Seed data + the stage/status/flag model from the Conventions
   blueprint. This is only the starting content; once the app has
   run once it works from the saved copy in localStorage.
   ============================================================ */

// Eight ordered stages. On Hold / Cancelled override the stage.
const STAGES = ['Intake','Estimating','Contracting','Procurement','Delivery','Installation','Closeout','Closed'];

// Statuses available within each stage (Set Status submenu).
const STATUSES = {
  'Intake':       ['New','Site visit needed','Qualifying'],
  'Estimating':   ['Estimating','Estimate Sent','Estimate Revision'],
  'Contracting':  ['Accepted','Awaiting PO','PO Received'],
  'Procurement':  ['Ordering','Equipment Ordered','Acknowledged'],
  'Delivery':     ['Awaiting Call','Scheduled','In Transit','Received','Stored'],
  'Installation': ['Install Scheduled','Install In Progress','Punch List','Delivered'],
  'Closeout':     ['Completed','Billed','Awaiting Payment'],
  'Closed':       ['Paid / Closed','Cancelled']
};

// Flags are raised/cleared by the program, worded identically everywhere.
const FLAG_KINDS = [
  'Estimate awaiting response','PO missing','PO short','Delivery later than promised',
  'Shipment delayed','Installation needs scheduling','Final billing not uploaded',
  'Payment overdue','Change order pending'
];

// The 12 projects from the blueprint. `alert` (optional) drives the
// Attention scope and the Alert column. `age` is days since raised.
const SEED_PROJECTS = [
  { id:'BPC-26-12', title:'Prairie Trail Nature Playscape',  customer:'City of Olathe Parks',   address:'', city:'Olathe',       state:'KS', zip:'', stage:'Intake',       status:'New',                 next:'08/21/26', value:null,  hold:false, notes:'', created:'2026-08-21' },
  { id:'BPC-26-11', title:'Hillcrest Elem. Shade Canopy',    customer:'Jackson Co. SD #4',       address:'', city:'Raytown',      state:'MO', zip:'', stage:'Estimating',   status:'Estimating',          next:'08/25/26', value:null,  hold:false, notes:'', created:'2026-08-15' },
  { id:'BPC-26-8',  title:'Cedar Grove Play Court',          customer:'Cedar Grove Mgmt LLC',    address:'', city:'Kansas City',  state:'MO', zip:'', stage:'Estimating',   status:'Estimate Sent',       next:'08/20/26', value:19400, hold:false, notes:'', created:'2026-08-05', alert:{ kind:'Estimate awaiting response', detail:'Estimate 2 sent 08/08, no reply', age:12 } },
  { id:'BPC-26-9',  title:'Lakeside Daycare Safety Surfacing',customer:'Lakeside Early Learning', address:'', city:'Blue Springs', state:'MO', zip:'', stage:'Contracting',  status:'Accepted',            next:'08/22/26', value:14875, hold:false, notes:'', created:'2026-08-10', alert:{ kind:'PO missing', detail:'Estimate 3 accepted 08/16', age:3 } },
  { id:'BPC-26-7',  title:'Westview MS Fitness Circuit',      customer:'Westview School Dist.',   address:'', city:'Independence', state:'MO', zip:'', stage:'Procurement',  status:'PO Received',         next:'08/26/26', value:88750, hold:false, notes:'', created:'2026-07-28' },
  { id:'BPC-26-6',  title:'Northgate HOA Pocket Park',       customer:'Northgate HOA',           address:'8200 W 119th St', city:'Overland Park',state:'KS', zip:'66213', stage:'Delivery',     status:'In Transit',          next:'08/24/26', value:61300, hold:false, notes:'', created:'2026-07-02',
    alert:{ kind:'Delivery later than promised', section:'Shipping', detail:'Shipment 2 scheduled 08/24, promised week of 08/17. Installation cannot be scheduled until the structure is on the lot.', age:2 },
    contact:{ name:'Marla Whitfield', role:'Board President', phone:'(913) 555-0142' },
    po:'NG-2026-118', lastChange:'08/19/26 3:12 PM',
    ws:{
      originalValue:58900, originalRef:'BPC-26-6B0 accepted 07/21/26',
      poAmount:58900, poNote:'revision needed', billed:null, paid:null,
      cost:{
        current:'COST-3',
        breakdowns:[
          { id:'COST-1', dated:'07/14/26', pricedInto:'BPC-26-6A0 — $58,900', status:'Superseded', marginPct:18, contingencyPct:5,
            copiedFrom:null, changedSince:null, note:'First pass, before the board walk.',
            groups:[
              {name:'Equipment', items:[{item:'Play structure — Miracle KC-4100',qty:'1',unit:'ea',rate:23800,ext:23800,source:'Quote 07/10',convert:true},{item:'Slide, 6 ft wave',qty:'1',unit:'ea',rate:1900,ext:1900,source:'',convert:true},{item:'Swing bay, 2 seat',qty:'1',unit:'ea',rate:2300,ext:2300,source:'',convert:true}]},
              {name:'Surfacing', items:[{item:'Poured rubber, 2 in',qty:'1,700',unit:'sf',rate:4.60,ext:7820,source:'',convert:true}]},
              {name:'Freight', items:[{item:'Inbound freight, 2 loads',qty:'2',unit:'ld',rate:726,ext:1452,source:'',convert:true}]},
              {name:'Site work', items:[{item:'Install crew',qty:'88',unit:'hr',rate:68,ext:5984,source:'',convert:true}]},
              {name:'Other', items:[{item:'Permit and inspection',qty:'1',unit:'ls',rate:640,ext:640,source:'City of OP',convert:true},{item:'Equipment rental',qty:'1',unit:'day',rate:450,ext:450,source:'',convert:true}]}
            ] },
          { id:'COST-2', dated:'07/29/26', pricedInto:'BPC-26-6B0 — accepted', status:'Superseded', marginPct:18, contingencyPct:5,
            copiedFrom:'COST-1', changedSince:'Scope revised after the board walk.', note:'The accepted number came out of this one.',
            groups:[
              {name:'Equipment', items:[{item:'Play structure — Miracle KC-4200',qty:'1',unit:'ea',rate:24800,ext:24800,source:'Quote 07/12',convert:true},{item:'Slide, 6 ft wave',qty:'1',unit:'ea',rate:1900,ext:1900,source:'',convert:true},{item:'Swing bay, 2 seat',qty:'1',unit:'ea',rate:2350,ext:2350,source:'',convert:true}]},
              {name:'Surfacing', items:[{item:'Poured rubber, 2 in',qty:'1,800',unit:'sf',rate:4.60,ext:8280,source:'',convert:true},{item:'Border edging',qty:'110',unit:'lf',rate:11.20,ext:1232,source:'',convert:true}]},
              {name:'Freight', items:[{item:'Inbound freight, 3 loads',qty:'3',unit:'ld',rate:726,ext:2180,source:'',convert:true}]},
              {name:'Site work', items:[{item:'Install crew',qty:'92',unit:'hr',rate:68,ext:6256,source:'',convert:true},{item:'Excavation and footings',qty:'24',unit:'hr',rate:86,ext:2064,source:'',convert:true}]},
              {name:'Other', items:[{item:'Permit and inspection',qty:'1',unit:'ls',rate:640,ext:640,source:'City of OP',convert:true},{item:'Equipment rental — skid steer',qty:'2',unit:'day',rate:423,ext:846,source:'',convert:true}]}
            ] },
          { id:'COST-3', dated:'08/12/26', pricedInto:'— not yet sent', status:'Current', marginPct:18, contingencyPct:5,
            copiedFrom:'COST-2', changedSince:'Drainage relocation added, bench deleted',
            note:'Only one breakdown is current at a time. The others stay readable — each records which estimate came out of it.',
            groups:[
              {name:'Equipment', items:[
                {item:'Play structure — Miracle KC-4200',qty:'1',unit:'ea',rate:24800,ext:24800,source:'Miracle Q-8841',convert:true,note:'Prints as "Play structure — 5–12 composite". Trade discount 22% already in the rate.'},
                {item:'Slide, 6 ft wave',qty:'1',unit:'ea',rate:1900,ext:1900,source:'Miracle Q-8841',convert:true},
                {item:'Swing bay, 2 seat',qty:'2',unit:'ea',rate:2350,ext:4700,source:'Miracle Q-8841',convert:true}]},
              {name:'Surfacing', items:[
                {item:'Poured rubber, 2 in — 1,850 sf',qty:'',unit:'',rate:0,ext:8510,convert:true,flat:true,note:'Built up from the three rows below. Priced on good soil; hard-dig excluded.'},
                {item:'Rubber crumb and binder',qty:'68',unit:'bag',rate:104,ext:7072,convert:false,kind:'MAT',note:'Surface America quote Q-3392, 08/06/26. Valid 30 days.'},
                {item:'Sub crew, 3 days',qty:'24',unit:'hr',rate:46,ext:1104,convert:false,kind:'LAB'},
                {item:'Waste allowance 4%',qty:'',unit:'',rate:0,ext:334,convert:false,kind:'ALW',flat:true},
                {item:'Border edging — 120 lf',qty:'120',unit:'lf',rate:11.20,ext:1344,source:'Surf. Am. Q-3392',convert:true}]},
              {name:'Site work', items:[
                {item:'Excavation and footings',qty:'',unit:'',rate:0,ext:2064,convert:true,flat:true},
                {item:'Concrete, 6 yd',qty:'6',unit:'yd',rate:186,ext:1116,convert:false,kind:'MAT'},
                {item:'Skid steer rental',qty:'2',unit:'day',rate:450,ext:900,convert:false,kind:'RNT',supplier:'Sunstate',quote:'44-0912',note:'Booked for 08/24 delivery to site. Two-day minimum on this rate.'},
                {item:'Dump fee',qty:'1',unit:'ls',rate:48,ext:48,convert:false,kind:'FEE'},
                {item:'Install crew',qty:'',unit:'',rate:0,ext:6528,convert:true,flat:true}]},
              {name:'Freight', items:[{item:'Inbound freight, 3 loads',qty:'3',unit:'load',rate:726.67,ext:2180,source:'Averitt est.',convert:true}]},
              {name:'No parent', items:[
                {item:'Permit and inspection',qty:'1',unit:'ls',rate:640,ext:640,source:'City of OP',convert:false,kind:'FEE',noParent:true},
                {item:'General conditions',qty:'1',unit:'ls',rate:900,ext:900,convert:false,kind:'FEE',noParent:true}]}
            ] }
        ]
      },
      estimates:[
        { id:'BPC-26-6A0', kind:'version', date:'07/08/26', amount:54200, status:'Superseded', file:'BPC-26-6A0.pdf', uploaded:'07/08/26', pages:4, sizeKB:640, prepared:'07/08/26 by dbrooks' },
        { id:'BPC-26-6A1', kind:'rendition', date:'07/11/26', amount:54900, status:'Superseded — rendition of A0', file:'BPC-26-6A1.pdf', uploaded:'07/11/26', pages:4, sizeKB:642, prepared:'07/11/26 by dbrooks' },
        { id:'BPC-26-6B0', kind:'version', date:'07/17/26', amount:58900, status:'ACCEPTED 07/21/26', accepted:true, acceptedDate:'07/21/26', acceptedBy:'Marla Whitfield, Board President', file:'BPC-26-6B0.pdf', uploaded:'07/17/26', pages:4, sizeKB:661, prepared:'07/17/26 by dbrooks', purpose:'Revised scope after the 07/15 board walk', record:'Accepted by email 07/21 — see Project Records' },
        { id:'BPC-26-6B0 REV0', kind:'revision', date:'08/12/26', amount:61300, status:'Sent 08/13 — awaiting response', sent:true, sentDate:'08/13/26', sentTo:'Marla Whitfield · marla.whitfield@northgatehoa.org', file:'BPC-26-6B0 REV0.pdf', uploaded:'08/12/26 3:41 PM', pages:4, sizeKB:688, prepared:'08/12/26 by dbrooks', origName:'Northgate board rev.pdf', purpose:'Re-priced to fold in Change Orders 1 and 2; one number for the board', supersedes:'Nothing yet — BPC-26-6B0 stays accepted until this is', record:'Board decision expected 09/01 — see Project Records' }
      ],
      pos:[
        { number:'NG-2026-118', received:'07/24/26', amount:58900, answers:'BPC-26-6B0', status:'Active — revision requested', active:true, file:'NG-2026-118.pdf', receivedBy:'email from Marla Whitfield', terms:'50% deposit on order, balance net 30 after installation', deposit:29450, depositReceived:'07/29/26', statusDetail:'Active — revision requested 08/13/26 for +$2,400', pages:2, sizeKB:210, uploaded:'07/24/26 by dbrooks', note:'Board approves POs at the monthly meeting; revision expected after 09/01' },
        { number:'NG-2026-118 R1', received:'—', amount:61300, expected:true, answers:'BPC-26-6B0 REV0', status:'Awaiting — requested 08/13/26', file:'—' }
      ],
      changeOrders:[
        { n:1, date:'08/05/26', description:'Bench pad and border edging', amount:3600, status:'Approved', approvedDate:'08/06/26', document:'CO-1.pdf', reason:'Site condition — soft ground at the north edge', requested:'08/04/26 by dbrooks', equipment:2400, labour:1200 },
        { n:2, date:'08/12/26', description:'Owner-supplied mulch credit', amount:-1200, status:'Approved', approvedDate:'08/12/26', document:'CO-2.pdf', reason:'Customer request — HOA supplies its own mulch', requested:'08/11/26 by Marla Whitfield', equipment:-1200, labour:0 },
        { n:3, date:'08/18/26', description:'Additional swing bay, two seats', amount:5400, status:'Pending', document:'CO-3 draft.pdf', reason:'Customer request — raised at the 08/18 site walk', requested:'08/18/26 by Marla Whitfield, verbally at site', equipment:4100, labour:1300, effect:'Not in the project value until approved', absorbedInto:'— a revised estimate is issued if this is approved', note:'Marla wants it priced before the 09/01 board meeting', pages:1, sizeKB:96 }
      ],
      tasks:[
        {text:'Confirm revised PO covering change orders', due:'08/21/26', done:false},
        {text:'Confirm delivery access with HOA', due:'08/23/26', done:false},
        {text:'Schedule installation crew', due:'08/26/26', done:false},
        {text:'Order safety surfacing', due:'08/28/26', done:false},
        {text:'Upload signed Change Order 2', due:'08/12/26', done:true},
        {text:'Receive shipment 1', due:'08/14/26', done:true},
        {text:'File bill of lading', due:'08/17/26', done:true},
        {text:'Confirm shipment 2 date', due:'08/19/26', done:true}
      ],
      milestones:[
        {label:'Project created', date:'07/02/26', done:true},
        {label:'Estimate accepted — BPC-26-6B0', date:'07/21/26', done:true},
        {label:'PO received — NG-2026-118', date:'07/24/26', done:true},
        {label:'Equipment ordered — Miracle Recreation', date:'07/28/26', done:true},
        {label:'First shipment received', date:'08/14/26', done:true},
        {label:'Structure delivery scheduled', date:'08/24/26', done:false, flag:true},
        {label:'Delivered', date:null, done:false},
        {label:'Installation scheduled', date:null, done:false},
        {label:'Installation complete', date:null, done:false},
        {label:'Final billing', date:null, done:false},
        {label:'Payment', date:null, done:false}
      ],
      activity:[
        {date:'08/19', text:'Shipment 2 delivery agreed for 08/24, 8–12'},
        {date:'08/17', text:'Averitt called — structure ready to schedule'},
        {date:'08/15', text:'4 receiving photos uploaded — shipment 1'},
        {date:'08/14', text:'Shipment 1 received — stored row C, bays 4–5'},
        {date:'08/12', text:'Change Order 2 uploaded — −$1,200'},
        {date:'08/05', text:'Change Order 1 uploaded — +$3,600'},
        {date:'07/28', text:'Equipment ordered — Miracle Recreation'},
        {date:'07/24', text:'PO NG-2026-118 uploaded'}
      ],
      documents:[
        {name:'Change Order 2.pdf', type:'pdf', date:'08/12/26'},
        {name:'Delivery photos, 6 files', type:'photo', date:'08/15/26'},
        {name:'Averitt bill of lading 61-884203.pdf', type:'pdf', date:'08/17/26'}
      ],
      photos:[ {label:'Delivery 08/15'}, {label:'Delivery 08/15'}, {label:'Render 07/18'}, {label:'Site 07/09'} ],
      note:{ text:'Job came in through the HOA board; Marla is the only approver. The board meets the first Tuesday, so any change order has to be in her hands the week before.', by:'dbrooks', entered:'07/02/26', edited:'08/05/26' },
      counts:{ estimates:4, pos:1, changeOrders:3, shipping:4, photos:48, documents:14, records:9 },
      shipping:{
        next:'Next delivery 08/24/26, 8:00–12:00',
        shipments:[
          { n:1, carrier:'Averitt Express', carrierPhone:'(800) 555-0117', bol:'61-882140', call:'08/10/26', scheduled:'08/12 1–3 PM', scheduledFull:'08/12/26, 1:00–3:00 PM', received:'08/12/26', receivedFull:'08/12/26 1:40 PM by D. Brooks', status:'Received — stored', storedAt:'Main lot, north end', state:'received',
            contents:'Site hardware, anchors, templates — 4 pallets', callReceived:'08/10/26 from Averitt dispatch', checked:'4 of 4 pallets — matches list and estimate', storedFull:'Main lot — north end, past the trailer', toSite:'08/26/26 — with the structure', freight:'Prepaid, in the equipment order',
            log:[ {date:'08/10/26',event:'Call received',detail:'Averitt dispatch offered 08/12 or 08/13'},{date:'08/10/26',event:'Scheduled',detail:'08/12, 1:00–3:00 PM, yard'},{date:'08/12/26',event:'Received',detail:'4 of 4, checked to estimate, D. Brooks'},{date:'08/12/26',event:'Log submitted',detail:'BOL 61-882140 and packing list scanned'},{date:'08/12/26',event:'Stored',detail:'Main lot, north end, tarped'} ],
            paperwork:['BOL 61-882140.pdf','packing list.pdf'], photos:4 },
          { n:2, carrier:'Averitt Express', carrierPhone:'(800) 555-0117', bol:'61-883771', call:'08/19/26', scheduled:'08/24 8–12', scheduledFull:'08/24/26, 8:00–12:00', received:'—', status:'Scheduled — 5 days late', storedAt:'Main lot', state:'scheduled', flag:true,
            contents:'Play structure — main components, 3 pallets', callReceived:'08/19/26 — ETA moved from week of 08/17', freight:'Prepaid, in the equipment order',
            log:[ {date:'08/19/26',event:'Call received',detail:'ETA moved from week of 08/17'},{date:'08/19/26',event:'Scheduled',detail:'08/24, 8:00–12:00'} ], paperwork:[], photos:0 },
          { n:3, carrier:'Averitt Express', bol:'61-884203', call:'—', scheduled:'—', received:'—', status:'Awaiting carrier call', storedAt:'Main lot', state:'awaiting',
            contents:'Swing bay hardware and seats', log:[], paperwork:['bill of lading 61-884203.pdf'], photos:0 },
          { n:4, carrier:'Averitt Express', bol:'—', call:'—', scheduled:'—', received:'—', status:'Not shipped — backorder', storedAt:'—', state:'notshipped', ghost:true,
            contents:'Safety surfacing materials', log:[], paperwork:[], photos:0 }
        ]
      },
      photoAlbum:{
        categories:[
          {name:'Site — existing', date:'07/09/26', count:8},
          {name:'Renders', date:'07/18/26', count:6},
          {name:'Delivery', date:'08/12/26', count:18},
          {name:'Storage', date:'08/12/26', count:10},
          {name:'Progress', date:'—', count:6}
        ],
        uncategorised:0
      },
      site:{
        items:[
          {name:'Existing conditions', kind:'folder', children:[
            {name:'Site survey 07/09.pdf', kind:'pdf', date:'07/09/26'},
            {name:'Existing play area, 6 photos', kind:'photo', date:'07/09/26'},
            {name:'Utilities locate ticket.pdf', kind:'pdf', date:'07/10/26'}
          ]},
          {name:'Plans and drawings', kind:'folder', children:[
            {name:'Site plan REV B.pdf', kind:'pdf', date:'07/16/26'},
            {name:'Equipment layout.pdf', kind:'pdf', date:'07/16/26'},
            {name:'Surfacing spec.pdf', kind:'pdf', date:'07/16/26'}
          ]},
          {name:'Renders', kind:'folder', children:[
            {name:'Aerial render.jpg', kind:'photo', date:'07/18/26'},
            {name:'Ground render.jpg', kind:'photo', date:'07/18/26'}
          ]}
        ],
        note:'North edge has soft ground — see Change Order 1. Access is off the east service drive; gate code from Marla.'
      },
      progress:{
        day:'Day 3 of 8', percent:0, started:null, status:'Not started — awaiting structure delivery 08/24',
        events:[
          {date:'08/14/26', event:'Shipment 1 received', detail:'Hardware and anchors stored on the lot', kind:'done'},
          {date:'08/24/26', event:'Structure delivery', detail:'Scheduled — install cannot begin until on site', kind:'pending'}
        ],
        issues:[
          {issue:'Soft ground, north edge', detail:'Bench pad added — Change Order 1 approved', status:'Resolved'},
          {issue:'Delivery later than promised', detail:'Shipment 2 now 08/24; crew date depends on it', status:'Open'}
        ],
        photos:6
      },
      completion:{
        status:'Not complete', completedDate:null,
        checklist:[
          {item:'All equipment installed to spec', done:false},
          {item:'Safety surfacing poured and cured', done:false},
          {item:'Site cleaned and restored', done:false},
          {item:'Final inspection passed', done:false},
          {item:'Punch list cleared', done:false},
          {item:'Completion photos uploaded', done:false},
          {item:'Customer sign-off received', done:false}
        ],
        finalPhotos:0, finalDocs:0,
        note:'Drawn mid-job — nothing here is complete yet. This is what the section looks like before closeout.'
      },
      docs:{
        totalMB:38.4,
        files:[
          {name:'Northgate signed contract.pdf', cat:'Contracts', uploaded:'07/24/26', size:'1.2 MB', by:'dbrooks', kind:'pdf'},
          {name:'Contract exhibit A — scope.pdf', cat:'Contracts', uploaded:'07/24/26', size:'0.4 MB', by:'dbrooks', kind:'pdf'},
          {name:'BPC-26-6B0 REV0 accepted.pdf', cat:'Signed documents', uploaded:'07/21/26', size:'0.9 MB', by:'dbrooks', kind:'pdf'},
          {name:'PO 4471 signed.pdf', cat:'Signed documents', uploaded:'07/28/26', size:'0.6 MB', by:'dbrooks', kind:'pdf'},
          {name:'CO 1 signed.pdf', cat:'Signed documents', uploaded:'08/06/26', size:'0.5 MB', by:'dbrooks', kind:'pdf'},
          {name:'Site plan rev C.pdf', cat:'Drawings', uploaded:'08/29/26', size:'3.8 MB', by:'dbrooks', kind:'drawing'},
          {name:'Site plan rev B.pdf', cat:'Drawings', uploaded:'07/17/26', size:'3.7 MB', by:'dbrooks', kind:'drawing'},
          {name:'Footing detail.pdf', cat:'Drawings', uploaded:'07/17/26', size:'1.1 MB', by:'dbrooks', kind:'drawing'},
          {name:'Miracle KC-4200 spec sheet.pdf', cat:'Specifications', uploaded:'07/12/26', size:'2.4 MB', by:'dbrooks', kind:'pdf'},
          {name:'City of OP permit 26-4417.pdf', cat:'Inspection', uploaded:'08/02/26', size:'0.3 MB', by:'dbrooks', kind:'pdf'},
          {name:'CO 1 — drainage relocation.pdf', cat:'Change orders', uploaded:'08/04/26', size:'0.4 MB', by:'dbrooks', kind:'pdf'},
          {name:'CO 2 — bench deletion.pdf', cat:'Change orders', uploaded:'08/11/26', size:'0.3 MB', by:'dbrooks', kind:'pdf'},
          {name:'Warranty — structure 10 yr.pdf', cat:'Final documents', uploaded:'08/12/26', size:'0.8 MB', by:'dbrooks', kind:'pdf'},
          {name:'Owner maintenance guide.pdf', cat:'Final documents', uploaded:'08/12/26', size:'5.6 MB', by:'dbrooks', kind:'pdf'}
        ],
        filedFrom:[ {name:'Estimates', count:4}, {name:'Purchase orders', count:2}, {name:'Shipping', count:3} ]
      },
      records:{
        items:[
          {kind:'email', date:'08/19/26', subject:'Re: Shipment 2 timing', from:'Marla Whitfield', body:'Board is fine with 08/24 as long as install is the same week. Please confirm the crew date once the truck is booked.'},
          {kind:'note', date:'08/18/26', subject:'Site walk notes', from:'dbrooks', body:'Marla asked about an extra swing bay while we were on site — raised Change Order 3. Wants it priced before the 09/01 board meeting.'},
          {kind:'screenshot', date:'08/17/26', subject:'Averitt tracking screen', from:'dbrooks', body:'Carrier portal capture showing the 08/24 ETA for shipment 2.'},
          {kind:'email', date:'08/13/26', subject:'Revised estimate sent', from:'dbrooks', body:'Sent BPC-26-6B0 REV0 to Marla, folding Change Orders 1 and 2 into one number for the board.'},
          {kind:'instruction', date:'07/24/26', subject:'PO handling', from:'Marla Whitfield', body:'All POs are approved at the monthly board meeting; expect a revision after 09/01 for the change orders.'},
          {kind:'email', date:'07/21/26', subject:'Estimate accepted', from:'Marla Whitfield', body:'The board approved BPC-26-6B0 at $58,900. Proceed to PO.'},
          {kind:'note', date:'07/15/26', subject:'Board walk', from:'dbrooks', body:'Walked the site with the board; revised scope. Soft ground on the north edge flagged.'},
          {kind:'email', date:'07/09/26', subject:'Site access', from:'Marla Whitfield', body:'Access is off the east service drive. Gate code will be texted the morning of any visit.'},
          {kind:'note', date:'07/02/26', subject:'Intake call', from:'dbrooks', body:'Job came in through the HOA board. Marla is the only approver.'}
        ]
      },
      billing:{
        status:'Not billed — installation not complete', terms:'50% deposit on order, balance net 30 after installation',
        invoice:null, invoiceAmount:61300, billed:null, paid:29450, deposit:29450, depositReceived:'07/29/26', dueDate:null
      },
      contacts:[
        {name:'Marla Whitfield', role:'Board President', phone:'(913) 555-0142', email:'marla.whitfield@northgatehoa.org', primary:true},
        {name:'Tom Reyes', role:'Grounds Committee', phone:'(913) 555-0187', email:'tom.reyes@northgatehoa.org'}
      ]
    } },
  { id:'BPC-26-10', title:'Veterans Mem. Park Swing Bays',   customer:'City of Grandview',       address:'', city:'Grandview',    state:'MO', zip:'', stage:'Installation', status:'Delivered',           next:'09/02/26', value:43600, hold:false, notes:'', created:'2026-07-30', alert:{ kind:'Installation needs scheduling', detail:'Delivered 08/17, no crew date set', age:2 } },
  { id:'BPC-26-4',  title:'Trailside Church Toddler Area',   customer:'Trailside Comm. Church',  address:'', city:'Olathe',       state:'KS', zip:'', stage:'Installation', status:'Install In Progress', next:'08/21/26', value:27150, hold:false, notes:'', created:'2026-07-12' },
  { id:'BPC-26-5',  title:'Brookside Elem. Equip. Refresh',  customer:'Brookside Charter',       address:'', city:'Kansas City',  state:'MO', zip:'', stage:'Closeout',     status:'Completed',           next:'08/19/26', value:71900, hold:false, notes:'', created:'2026-07-01', alert:{ kind:'Final billing not uploaded', detail:'Installation completed 08/14', age:5 } },
  { id:'BPC-26-3',  title:'Maple Ridge Elem. Play Structure',customer:'Jackson Co. SD #4',       address:'', city:"Lee's Summit",  state:'MO', zip:'', stage:'Closeout',     status:'Awaiting Payment',    next:'09/05/26', value:52400, hold:false, notes:'', created:'2026-06-18', alert:{ kind:'Payment overdue', detail:'Final billing 07/16, net 30 terms', age:34 } },
  { id:'BPC-26-2',  title:'Summit Ridge Church Pavilion Pad',customer:'Summit Ridge Church',     address:'', city:'Lenexa',       state:'KS', zip:'', stage:'Intake',       status:'On Hold',             next:'',         value:9250,  hold:true,  notes:'', created:'2026-06-10' },
  { id:'BPC-26-1',  title:'Kiwanis Park Splash Pad Shade',   customer:'City of Belton Parks',    address:'', city:'Belton',       state:'MO', zip:'', stage:'Closed',       status:'Paid / Closed',       next:'',         value:38900, hold:false, notes:'', created:'2026-05-22' }
];

// Customer directory (for the New Project drop-down and By Customer scope).
const SEED_CUSTOMERS = [
  'Brookside Charter','Cedar Grove Mgmt LLC','City of Belton Parks','City of Grandview',
  'City of Olathe Parks','Jackson Co. SD #4','Lakeside Early Learning','Northgate HOA',
  'Summit Ridge Church','Trailside Comm. Church','Westview School Dist.'
];

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

// The 15 workspace sections, in four groups, in the order the blueprint draws
// them. `sheet` is the design sheet that will own each section (stubbed for now);
// `count` names the p.ws.counts key that supplies the parenthesised number.
const SECTION_GROUPS = [
  { group:null, items:[
    { key:'Overview',   label:'Overview',            icon:'win' },
    { key:'Customer',   label:'Customer / Contacts', icon:'card',  sheet:18 },
    { key:'Tasks',      label:'Tasks',               icon:'check', sheet:15, count:'tasksOpen', countSuffix:' open' }
  ]},
  { group:'Money & paper', items:[
    { key:'CostBreakdown', label:'Cost Breakdown',  icon:'grid', sheet:'04a' },
    { key:'Estimates',    label:'Estimates',        icon:'docR', sheet:4,  count:'estimates' },
    { key:'POs',          label:'Purchase Orders',  icon:'docR', sheet:6,  count:'pos' },
    { key:'ChangeOrders', label:'Change Orders',    icon:'docR', sheet:7,  count:'changeOrders' },
    { key:'Billing',      label:'Billing / Payment',icon:'docG', sheet:17 }
  ]},
  { group:'Field', items:[
    { key:'Shipping',   label:'Shipping',   icon:'truck',  sheet:8, count:'shipping' },
    { key:'Site',       label:'Site',       icon:'folder', sheet:9 },
    { key:'Photos',     label:'Photos',     icon:'photo',  sheet:10, count:'photos' },
    { key:'Progress',   label:'Progress',   icon:'folder', sheet:11 },
    { key:'Completion', label:'Completion', icon:'flag',   sheet:12 }
  ]},
  { group:'Record', items:[
    { key:'Documents', label:'Documents',       icon:'folder', sheet:13, count:'documents' },
    { key:'Records',   label:'Project Records', icon:'records',sheet:14, count:'records' },
    { key:'Activity',  label:'Activity',        icon:'log',    sheet:16 }
  ]}
];

// Human names for the section keys, used in the stubbed placeholder pane.
const SECTION_SHEETS = {
  4:'Estimates', 6:'Purchase Orders', 7:'Change Orders', 8:'Shipping', 9:'Site',
  10:'Photos', 11:'Progress', 12:'Completion', 13:'Documents', 14:'Project Records',
  15:'Tasks', 16:'Activity', 17:'Billing / Payment', 18:'Customer / Contacts'
};
