/* ================================================================
   Document Builder — application logic
   Renders the whole estimate from the model in builder.data.js and
   keeps the grid, totals, inspector and status bar in sync.
   ================================================================ */
'use strict';

/* ---------- tiny helpers ---------- */
const $  = (s, r=document) => r.querySelector(s);
const el = (tag, cls, html) => { const n=document.createElement(tag); if(cls) n.className=cls; if(html!=null) n.innerHTML=html; return n; };
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = v => (v==null||v==='') ? '' : Number(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const money = v => '$'+fmt(v);
let idSeq = 100;
const genId = () => 'r-n'+(idSeq++);

/* ---------- inline pixel icons ---------- */
const SVG = {
  triDown:'<svg width="8" height="8" viewBox="0 0 8 8"><path fill="#000" d="M0 2h8L4 7z"/></svg>',
  triPlay:'<svg width="8" height="8" viewBox="0 0 8 8"><path fill="#000" d="M2 0v8l5-4z"/></svg>',
  turn:'<span class="tw">&#8627;</span>',
  note:'<svg width="9" height="9" viewBox="0 0 9 9"><rect x="0" y="0" width="9" height="9" fill="#fff" stroke="#808080"/><rect x="2" y="2" width="5" height="1" fill="#404040"/><rect x="2" y="4" width="5" height="1" fill="#404040"/><rect x="2" y="6" width="3" height="1" fill="#404040"/></svg>',
  check:'<svg width="8" height="7" viewBox="0 0 11 9"><path fill="#000" d="M4 9L0 5l1.5-1.5L4 6 9.5.5 11 2z"/></svg>',
  arrowDn:'<svg width="7" height="4" viewBox="0 0 7 4"><path fill="#000" d="M0 0h7L3.5 4z"/></svg>'
};

/* ---------- state ---------- */
const STORE_KEY = 'bpc-builder-v1';
let doc;

function loadDoc(){
  try{ const raw = localStorage.getItem(STORE_KEY); if(raw){ doc = JSON.parse(raw); return; } }catch(e){}
  doc = JSON.parse(JSON.stringify(SEED_DOC));
}
function saveDoc(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify(doc)); }catch(e){} }

/* ---------- model queries ---------- */
const rowById   = id => doc.rows.find(r => r.id===id);
const childrenOf= id => doc.rows.filter(r => r.parent===id);
const isDataRow = r => r.kind==='line' || r.kind==='sub' || r.kind==='option';
const amountOf  = r => r.flat ? (+r.price||0) : (+r.qty||0)*(+r.price||0);

/* ---------- computed totals ---------- */
function compute(){
  const lines   = doc.rows.filter(r => r.kind==='line');
  const subs    = doc.rows.filter(r => r.kind==='sub');
  const options = doc.rows.filter(r => r.kind==='option');
  const hidden  = lines.filter(r => r.hidden);
  const internal= lines.filter(r => r.internal && !r.hidden);
  const addon   = options.filter(o => o.group==='addon');

  // Customer-facing lines are what the customer is quoted; internal +
  // hidden lines are real costs you carry but do NOT bill as line items
  // (their cost lands in the margin). The subtotal rule decides which
  // set feeds the price.  'customer' (default) = only billed lines, so
  // the visible line amounts add up to the subtotal.
  const custLines = lines.filter(l => !l.internal && !l.hidden);
  const rule = doc.settings.subtotalRule || 'customer';
  const subLines = rule==='all' ? lines : custLines;

  const subtotal      = subLines.reduce((s,l)=> s+amountOf(l), 0);
  const subtotalCount = subLines.length;
  const acceptedOpts  = options.filter(o=>o.accepted).reduce((s,o)=> s+amountOf(o), 0);
  const notAccepted   = options.filter(o=>!o.accepted).reduce((s,o)=> s+amountOf(o), 0);
  const revenue       = subtotal + acceptedOpts;
  const tax           = doc.settings.taxRate>0 ? revenue*doc.settings.taxRate/100 : 0;
  const total         = revenue + tax;

  // Cost always includes internal + hidden lines — that is the whole
  // point of marking a line internal: its cost stays in the margin.
  const cost = lines.reduce((s,l)=> s+(+l.cost||amountOf(l)),0)
             + options.filter(o=>o.accepted).reduce((s,o)=> s+(+o.cost||amountOf(o)),0);
  const margin = revenue>0 ? (revenue-cost)/revenue*100 : 0;

  return { lines, subs, options, hidden, internal, addon,
           subtotal, subtotalCount, acceptedOpts, notAccepted, tax, total, margin };
}

/* ================================================================
   MENU BAR + TOOLBAR
   ================================================================ */
const MENUS = ['File','Edit','View','Insert','Row','Document','Window','Help'];

function renderMenubar(){
  const bar = $('#menubar'); bar.innerHTML='';
  MENUS.forEach(name=>{
    const m = el('div','m', esc(name[0])+'</u>'.replace('</u>','')); // placeholder
    m.innerHTML = '<u>'+esc(name[0])+'</u>'+esc(name.slice(1));
    m.addEventListener('click', e=> openMenu(name, m));
    bar.appendChild(m);
  });
}

const TOOLBAR = [
  {k:'save',   label:'Save'},
  {k:'pdf',    label:'Generate PDF'},
  {k:'print',  label:'Print…'},
  {sep:1},
  {k:'add-line',   label:'Line'},
  {k:'add-sub',    label:'Sub item'},
  {k:'add-option', label:'Option'},
  {k:'add-note',   label:'Note'},
  {k:'add-addon',  label:'Add-on'},
  {sep:1},
  {k:'move-up',   icon:'<svg width="10" height="10" viewBox="0 0 10 10"><path fill="#000" d="M5 0l5 6H0z"/></svg>'},
  {k:'move-down', icon:'<svg width="10" height="10" viewBox="0 0 10 10"><path fill="#000" d="M5 10L0 4h10z"/></svg>'},
  {k:'indent',  label:'Indent'},
  {k:'outdent', label:'Outdent'},
  {sep:1},
  {k:'fill-down', label:'Fill down'},
  {sep:1},
  {k:'preview', label:'Preview', toggle:'showPreview'},
  {k:'setup',   label:'Setup…'},
  {k:'convert', label:'Convert to'},
  {spring:1},
  {k:'close',   label:'Close'}
];

function renderToolbar(){
  const tb = $('#toolbar'); tb.innerHTML='';
  TOOLBAR.forEach(item=>{
    if(item.sep){ tb.appendChild(el('div','vsep')); return; }
    if(item.spring){ tb.appendChild(el('div','tspring')); return; }
    const b = el('div','tbtn'+(item.icon?' icon':''), item.icon || esc(item.label));
    if(item.toggle && doc.ui[item.toggle]) b.classList.add('pressed');
    b.addEventListener('click', ()=> doCommand(item.k));
    tb.appendChild(b);
  });
}

/* ================================================================
   HEADER STRIP + COLUMN BAR + DOC SETTINGS
   ================================================================ */
function renderDocstrip(){
  const m = doc.meta;
  $('#docstrip').innerHTML =
    `<span class="b">Estimate ${esc(m.number)}</span>`+
    `<span class="badge">${esc(m.status)}</span>`+
    `<span class="dim">${esc(m.customer)} · ${esc(m.desc)} · rep ${esc(m.rep)}</span>`+
    `<span class="spacer"></span>`+
    `<span class="dim">Last saved ${esc(m.savedAgo)}</span>`;
}

const SEL_NAMES = ['Violet','Left bar','Sand','Dotted','Underline','Ink'];
const COLTOGGLES = [
  {g:'tags',       label:'Tags'},
  {g:'qtyUnit',    label:'Qty and unit'},
  {g:'costMargin', label:'Cost and margin'},
  {g:'notes',      label:'Notes'}
];
function renderColbar(){
  const c = compute();
  const bar = $('#colbar'); bar.innerHTML='';
  bar.appendChild(el('span','dim','Columns:'));
  COLTOGGLES.forEach(t=>{
    const box = el('div','cbox');
    const chk = el('div','chk', doc.columns[t.g]?SVG.check:'');
    box.appendChild(chk); box.appendChild(el('span',null,esc(t.label)));
    box.addEventListener('click', ()=>{ doc.columns[t.g]=!doc.columns[t.g]; saveDoc(); renderColbar(); renderGrid(); });
    bar.appendChild(box);
  });
  bar.appendChild(el('div','vsep sm'));
  const exp = el('div','btn', 'Expand all'); exp.style.width='76px';
  exp.addEventListener('click', ()=> setAllCollapsed(false));
  const col = el('div','btn', 'Collapse all'); col.style.width='84px';
  col.addEventListener('click', ()=> setAllCollapsed(true));
  bar.appendChild(exp); bar.appendChild(col);
  bar.appendChild(el('div','vsep sm'));
  bar.appendChild(el('span','dim','Group by:'));
  const combo = el('div','combo', `<span>${esc(doc.groupBy)}</span><div class="arrow">${SVG.arrowDn}</div>`);
  combo.style.width='96px';
  bar.appendChild(combo);
  // row-highlight style picker (cycles through the styles in builder.css)
  bar.appendChild(el('div','vsep sm'));
  bar.appendChild(el('span','dim','Highlight:'));
  const cyc = el('div','btn', SEL_NAMES[(doc.ui.selStyle||1)-1]); cyc.style.width='84px';
  cyc.addEventListener('click', ()=>{ doc.ui.selStyle = ((doc.ui.selStyle||1)%SEL_NAMES.length)+1; saveDoc(); renderColbar(); renderGrid(); });
  bar.appendChild(cyc);
  bar.appendChild(el('div','spacer'));
  bar.appendChild(el('span','dim', `${doc.rows.filter(isDataRow).length} rows · ${c.lines.length} lines`));
}

function renderDocSettings(){
  const s = doc.settings;
  const box = $('#docsettings'); box.innerHTML='';
  // template
  const r1 = el('div','drow');
  r1.appendChild(el('span','dlabel','Template'));
  r1.appendChild(el('div','dfield', `<span style="flex:1;padding-left:3px;overflow:hidden;text-overflow:ellipsis">${esc(s.template)}</span><div class="arrow" style="width:16px;height:16px;margin-right:2px;flex:none;background:var(--face);display:flex;align-items:center;justify-content:center;box-shadow:var(--raise)">${SVG.arrowDn}</div>`));
  box.appendChild(r1);
  // tax + valid
  const r2 = el('div','drow');
  r2.innerHTML = `<span class="dlabel">Tax rate</span>`;
  const tax = el('input','dsmall'); tax.style.width='48px'; tax.value=s.taxRate;
  tax.addEventListener('input', ()=>{ s.taxRate=parseFloat(tax.value)||0; saveDoc(); renderTotals(); renderStatus(); });
  r2.appendChild(tax);
  r2.appendChild(el('span','dlabel','%'));
  const validWrap = el('span','dlabel','Valid'); validWrap.style.marginLeft='6px'; r2.appendChild(validWrap);
  const valid = el('input','dsmall'); valid.style.width='34px'; valid.value=s.validDays;
  valid.addEventListener('input', ()=>{ s.validDays=parseInt(valid.value)||0; saveDoc(); });
  r2.appendChild(valid);
  r2.appendChild(el('span','dlabel','days'));
  box.appendChild(r2);
  // checks
  [['showQty','Show the quantity column on the document'],
   ['includeTerms','Include terms and exclusions'],
   ['includeAcceptance','Include the acceptance block'],
   ['showGroupSubtotals','Show group subtotals']].forEach(([k,label])=>{
    const row = el('div','drow chkrow');
    const chk = el('div','chk', s[k]?SVG.check:'');
    row.appendChild(chk); row.appendChild(el('span',null,esc(label)));
    row.addEventListener('click', ()=>{ s[k]=!s[k]; saveDoc(); renderDocSettings(); });
    box.appendChild(row);
  });
  const btns = el('div','drow'); btns.style.marginTop='2px'; btns.style.gap='3px';
  const t1 = el('div','btn','Edit terms…'); t1.style.width='110px';
  const t2 = el('div','btn','Letterhead…'); t2.style.width='104px';
  btns.appendChild(t1); btns.appendChild(t2);
  box.appendChild(btns);
}

/* ================================================================
   GRID
   ================================================================ */
const MASTER_COLS = [
  {k:'tags',   w:'72px',  h:'Tags', g:'tags'},
  {k:'expand', w:'16px',          cls:'center'},   // dropdown arrow (parent lines)
  {k:'icon',   w:'24px',          cls:'center'},   // ↳ / OPT markers, beside the arrow
  {k:'name',   w:'minmax(0,1fr)', h:'Activity'},
  {k:'qty',    w:'46px',  h:'Qty',  cls:'end', g:'qtyUnit'},
  {k:'unit',   w:'32px',  h:'U',    cls:'mid', g:'qtyUnit'},
  {k:'price',  w:'82px',  h:'Unit price', cls:'end'},
  {k:'amount', w:'88px',  h:'Amount',     cls:'end'},
  {k:'cost',   w:'70px',  h:'Cost', cls:'end', g:'costMargin'},
  {k:'margin', w:'48px',  h:'Mgn',  cls:'mid', g:'costMargin'},
  {k:'acc',    w:'30px',  h:'Acc',  cls:'mid'},
  {k:'note',   w:'34px',  h:'Note', cls:'mid', g:'notes'}
];
const activeCols = () => MASTER_COLS.filter(c => !c.g || doc.columns[c.g]);

function visibleRows(){
  return doc.rows.filter(r=>{
    if(r.hidden) return false;                      // hidden line never drawn
    if(r.parent){
      const p = rowById(r.parent);
      if(p && p.collapsed && r.kind!=='rollup') return false;  // collapsed hides sub/option, keeps rollup
    }
    return true;
  });
}

function cellHTML(col, r){
  switch(col.k){
    case 'expand': {
      const kids = childrenOf(r.id).some(c=>c.kind==='sub'||c.kind==='option');
      if(r.kind==='line' && kids) return `<span class="expand" data-expand="${r.id}">${r.collapsed?SVG.triPlay:SVG.triDown}</span>`;
      return '';
    }
    case 'icon':
      if(r.kind==='sub') return SVG.turn;
      if(r.kind==='option' && !r.group) return '<span class="opt-tag">OPT</span>';
      return '';
    case 'name': {
      const sub = (r.kind==='sub'||r.kind==='option') ? ' sub' : '';
      let label = esc(r.name);
      if(r.optionLabel) label = `${esc(r.optionLabel)}&nbsp;${esc(r.name)}`;
      return `<span class="name${sub}" style="display:block;overflow:hidden;text-overflow:ellipsis">${label}</span>`;
    }
    case 'tags':
      return (r.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
    case 'qty':
      if(r.flat) return 'FLAT';
      return r.qty!=null ? String(r.qty) : '';
    case 'unit':
      return r.flat ? '' : `<span style="color:var(--muted2)">${esc(r.unit||'')}</span>`;
    case 'price':
      return r.price!=null ? fmt(r.price) : '';
    case 'amount': {
      if(r.kind==='option' && !r.accepted) return '<span>—</span>';
      const bold = (r.kind==='line') ? 'font-weight:700' : '';
      return `<span style="${bold}">${fmt(amountOf(r))}</span>`;
    }
    case 'cost':
      return r.cost!=null ? fmt(r.cost) : '';
    case 'margin': {
      const amt = amountOf(r), c = +r.cost;
      if(!amt || r.cost==null) return '';
      return Math.round((amt-c)/amt*100)+'%';
    }
    case 'acc':
      if(r.kind==='option') return `<div class="chk" data-accept="${r.id}">${r.accepted?SVG.check:''}</div>`;
      return '';
    case 'note':
      return r.hasNote ? SVG.note : '';
  }
  return '';
}

function nameIndent(cols){
  let px=0;
  for(const c of cols){ if(c.k==='name') break; const m=/^(\d+)px$/.exec(c.w); if(m) px+=+m[1]; }
  return px||40;
}
function renderGrid(){
  const grid = $('#grid'); grid.innerHTML='';
  grid.className = 'grid sel-'+(doc.ui.selStyle||1);
  const cols = activeCols();
  const tmpl = cols.map(c=>c.w).join(' ');
  grid.style.setProperty('--tmpl', tmpl);
  grid.style.setProperty('--indent', nameIndent(cols)+'px');

  // header
  const head = el('div','row head');
  head.style.gridTemplateColumns = tmpl;
  cols.forEach(c=>{
    head.appendChild(el('div','hcell'+(c.cls==='end'?' end':c.cls==='mid'?' mid':''), c.h?esc(c.h):''));
  });
  grid.appendChild(head);

  visibleRows().forEach(r=>{
    if(r.kind==='section'){
      const c = compute();
      const total = c.addon.length, acc = c.addon.filter(o=>o.accepted).length;
      const row = el('div','row section');
      row.innerHTML = `<div class="l">${esc(r.name)}</div><div class="r">${acc} of ${total} accepted</div>`;
      grid.appendChild(row); return;
    }
    if(r.kind==='rollup'){
      const parent = r.parent ? rowById(r.parent) : null;
      const subs = parent ? childrenOf(parent.id).filter(c=>c.kind==='sub') : [];
      let txt, over=false;
      if(parent && subs.length){
        // live sub-item cost tracker: sum the sub items and compare
        // to the line's own price. Turns red if the breakdown overruns.
        const subSum = subs.reduce((s,x)=> s+amountOf(x), 0);
        const lineTotal = amountOf(parent);
        over = subSum > lineTotal + 0.001;
        const n = subs.length, plural = n===1?'':'s';
        const tail = parent.collapsed ? ' · collapsed' : '';
        txt = over
          ? `${n} sub item${plural} ∑ ${money(subSum)} · exceeds the ${money(lineTotal)} line price by ${money(subSum-lineTotal)}${tail}`
          : `${n} sub item${plural} ∑ ${money(subSum)} · within the ${money(lineTotal)} line price${tail}`;
      } else if(r.text){
        txt = r.text;                 // custom caption (e.g. internal-cost note)
      } else { return; }              // empty tracker with no sub items → nothing to show
      const row = el('div','row rollup');
      row.innerHTML = `<div></div><div class="txt${over?' over':''}">${esc(txt)}</div>`;
      grid.appendChild(row); return;
    }
    if(r.kind==='note'){
      grid.appendChild(bandRow(r.text)); return;
    }
    // data row (line / sub / option)
    const row = el('div','row selectable '+r.kind + (r.internal||r.hidden?' internal':'') + (r.kind==='option'&&!r.accepted?' dim':''));
    if(doc.ui.selectedId===r.id) row.classList.add('selected');
    row.style.gridTemplateColumns = tmpl;
    cols.forEach(c=>{
      const align = c.cls==='end'?' end':c.cls==='mid'?' center':c.cls==='center'?' center':'';
      row.appendChild(el('div','cell '+c.k+align, cellHTML(c,r)));
    });
    row.addEventListener('click', e=>{
      if(e.target.closest('[data-expand]') || e.target.closest('[data-accept]')) return;
      selectRow(r.id);
    });
    grid.appendChild(row);
    if(r.note) grid.appendChild(bandRow(r.note));            // note band
    if(r.disclaimer) grid.appendChild(discRow(r.disclaimer)); // disclaimer band (under the note)
  });

  // spring so short docs don't stretch rows
  grid.appendChild(el('div','gridpad'));

  // wire expand + accept
  grid.querySelectorAll('[data-expand]').forEach(x=> x.addEventListener('click', e=>{
    e.stopPropagation(); const row=rowById(x.dataset.expand); row.collapsed=!row.collapsed; saveDoc(); renderGrid();
  }));
  grid.querySelectorAll('[data-accept]').forEach(x=> x.addEventListener('click', e=>{
    e.stopPropagation(); const row=rowById(x.dataset.accept); row.accepted=!row.accepted; saveDoc(); renderGrid(); renderTotals(); renderStatus();
  }));
}
function bandRow(text){
  const b = el('div','row band'); b.innerHTML = `<div></div><div class="txt">${esc(text)}</div>`; return b;
}
function discRow(text){
  const b = el('div','row disc'); b.innerHTML = `<div></div><div class="txt">${esc(text)}</div>`; return b;
}

/* ================================================================
   INSPECTOR
   ================================================================ */
function renderInspector(){
  const box = $('#inspector'); const legend = $('#inspector-legend');
  const r = doc.ui.selectedId ? rowById(doc.ui.selectedId) : null;
  if(!r || !isDataRow(r)){
    legend.textContent = 'Selected row';
    box.innerHTML = '<div class="insp-empty">Select a row to edit its details, or press Enter to add one.</div>';
    return;
  }
  const parent = r.parent ? rowById(r.parent) : null;
  legend.textContent =
    r.kind==='line'   ? 'Selected row — line item' :
    r.kind==='sub'    ? `Selected row — sub item of ${parent?parent.name:''}` :
    r.group==='addon' ? 'Selected row — add-on option' :
    parent ? `Selected row — option on ${parent.name}` : 'Selected row — option';

  box.innerHTML='';
  const fields = el('div','insp-fields');

  // Name + Model
  const row1 = el('div','frow');
  row1.appendChild(el('span','flabel','Name')).style.width='44px';
  const name = mkInput(r.name, '230px'); bind(name,'name'); row1.appendChild(name);
  row1.appendChild(el('span','flabel','Model'));
  const model = mkInput(r.model||'', '120px'); bind(model,'model'); row1.appendChild(model);
  fields.appendChild(row1);

  // Price + Qty + Unit + Flat
  const row2 = el('div','frow');
  row2.appendChild(el('span','flabel','Price')).style.width='44px';
  const price = mkInput(r.price!=null?fmt(r.price):'', '78px'); bindNum(price,'price'); row2.appendChild(price);
  row2.appendChild(el('span','flabel','Qty'));
  const qty = mkInput(r.qty!=null?r.qty:'', '44px'); bindNum(qty,'qty'); if(r.flat) qty.disabled=true; row2.appendChild(qty);
  const unit = mkInput(r.unit||'', '38px'); bind(unit,'unit'); if(r.flat) unit.disabled=true; row2.appendChild(unit);
  const flatWrap = el('div','cbox'); flatWrap.style.marginLeft='4px';
  const flatChk = el('div','chk', r.flat?SVG.check:''); flatWrap.appendChild(flatChk); flatWrap.appendChild(el('span',null,'Flat charge'));
  flatWrap.addEventListener('click', ()=>{ r.flat=!r.flat; saveDoc(); renderInspector(); renderGrid(); renderTotals(); renderStatus(); });
  row2.appendChild(flatWrap);
  fields.appendChild(row2);

  // Note
  const row3 = el('div','frow');
  const nl = el('span','flabel','Note'); nl.style.width='44px'; row3.appendChild(nl);
  const note = el('input','field'); note.value=r.note||''; note.style.flex='1';
  note.addEventListener('input', ()=>{ r.note=note.value; r.hasNote=!!note.value; saveDoc(); renderGrid(); });
  row3.appendChild(note);
  fields.appendChild(row3);

  // Disclaimer (prints under the note, italic + yellow)
  const row3b = el('div','frow');
  const dl = el('span','flabel','Disc.'); dl.style.width='44px'; dl.style.color='var(--disc-ink)'; row3b.appendChild(dl);
  const disc = el('input','field'); disc.value=r.disclaimer||''; disc.style.flex='1';
  disc.style.color='var(--disc-ink)'; disc.style.fontStyle='italic';
  disc.placeholder='add a line disclaimer…';
  disc.addEventListener('input', ()=>{ r.disclaimer=disc.value; saveDoc(); renderGrid(); });
  row3b.appendChild(disc);
  fields.appendChild(row3b);

  // Tags — click a chip to remove; type + Enter to add
  const row4 = el('div','frow');
  row4.appendChild(el('span','flabel','Tags')).style.width='44px';
  const tagf = el('div','tagfield');
  (r.tags||[]).forEach(t=>{
    const chip = el('span','tag rm', esc(t)+'<span class="x">×</span>');
    chip.title = 'Remove tag';
    chip.addEventListener('click', ()=>{ r.tags = r.tags.filter(x=>x!==t); saveDoc(); refreshTags(); });
    tagf.appendChild(chip);
  });
  const tin = el('input','taginput'); tin.placeholder = (r.tags&&r.tags.length)?'':'add a tag, press Enter';
  tin.addEventListener('keydown', e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      const v = tin.value.trim();
      if(v){ if(!r.tags) r.tags=[]; if(!r.tags.includes(v)) r.tags.push(v); saveDoc(); refreshTags(); }
    } else if(e.key==='Backspace' && !tin.value && r.tags && r.tags.length){
      r.tags.pop(); saveDoc(); refreshTags();
    }
  });
  tagf.appendChild(tin);
  row4.appendChild(tagf);
  fields.appendChild(row4);
  function refreshTags(){ renderInspector(); renderGrid(); const i=$('#inspector .taginput'); if(i){ i.focus(); } }

  box.appendChild(fields);

  // actions
  const actions = el('div','insp-actions');
  const mkBtn = (label, fn, dis)=>{ const b=el('div','btn'+(dis?' disabled':''),esc(label)); if(!dis) b.addEventListener('click',fn); return b; };
  actions.appendChild(mkBtn('Add sub item', ()=> addChild(r,'sub')));
  actions.appendChild(mkBtn('Add option',  ()=> addChild(r,'option')));
  actions.appendChild(mkBtn('Add note',    ()=> { r.hasNote=true; if(r.note==null)r.note=''; saveDoc(); renderInspector(); renderGrid(); note.focus?.(); }));
  actions.appendChild(el('div','sep'));
  actions.appendChild(mkBtn('Promote to line', ()=> promote(r), r.kind==='line'));
  actions.appendChild(mkBtn('Remove row', ()=> removeRow(r)));
  actions.appendChild(el('div','insp-hint','Enter adds a row below. Tab across, Shift+Tab back.'));
  box.appendChild(actions);

  function mkInput(val,w){ const i=el('input','field'); i.value=val; i.style.width=w; return i; }
  function bind(inp,key){ inp.addEventListener('input', ()=>{ r[key]=inp.value; saveDoc(); renderGridRowLive(); }); }
  function bindNum(inp,key){ inp.addEventListener('input', ()=>{ r[key]=parseFloat(String(inp.value).replace(/,/g,''))||0; saveDoc(); renderGridRowLive(); }); }
}
// re-render grid + totals + status without touching inspector inputs (keeps focus)
function renderGridRowLive(){ renderGrid(); renderTotals(); renderStatus(); }

/* ================================================================
   TOTALS + STATUS
   ================================================================ */
function renderTotals(){
  const c = compute();
  const box = $('#totals'); box.innerHTML='';
  const trow=(lbl,val,cls='')=>{ const r=el('div','trow '+cls); r.innerHTML=`<div class="lbl">${esc(lbl)}</div><div class="val">${val}</div>`; return r; };
  box.appendChild(trow(`Subtotal, ${c.subtotalCount} lines`, money(c.subtotal)));
  box.appendChild(trow('Accepted options', money(c.acceptedOpts)));
  box.appendChild(trow('Tax', doc.settings.taxRate>0?money(c.tax):'Included'));
  box.appendChild(el('div','tsep'));
  box.appendChild(trow('Estimate total', money(c.total), 'total'));
  box.appendChild(trow('Not accepted, if taken', '+'+money(c.notAccepted), 'small'));
  box.appendChild(el('div','tsep'));
  box.appendChild(el('div','tnote','Cost and margin are hidden. Tick the column to show them — they never print.'));
  box.appendChild(el('div','tspring'));
  const pdf = el('div','pdf-btn','Generate PDF'); pdf.addEventListener('click', ()=> doCommand('pdf'));
  box.appendChild(pdf);
}

function renderStatus(){
  const c = compute();
  const bar = $('#statusbar'); bar.innerHTML='';
  const cell=(txt,w)=>{ const s=el('div','sc'+(w?'':' grow'),esc(txt)); if(w) s.style.width=w; return s; };
  bar.appendChild(cell('Enter a new row · Ctrl+Enter a sub item · F2 edit · F9 preview'));
  bar.appendChild(cell(`${c.lines.length} lines, ${c.subs.length} sub, ${c.options.length} options`, '150px'));
  bar.appendChild(cell(`${c.hidden.length} line${c.hidden.length===1?'':'s'} hidden`, '86px'));
  bar.appendChild(cell('Total '+money(c.total), '122px'));
  bar.appendChild(cell('Margin '+c.margin.toFixed(1)+'%', '96px'));
  bar.appendChild(cell(`Page ${doc.ui.page} of ${doc.ui.pages}`, '82px'));
}

/* ================================================================
   PREVIEW
   ================================================================ */
const PREVIEW_SVG = '<svg width="232" height="300" viewBox="0 0 612 792"><rect width="612" height="792" fill="#fff"/><rect x="50" y="40" width="44" height="44" fill="#5980a6"/><rect x="104" y="44" width="168" height="13" fill="#1d1f20"/><rect x="104" y="64" width="200" height="7" fill="#909090"/><rect x="104" y="76" width="160" height="7" fill="#909090"/><rect x="430" y="40" width="126" height="17" fill="#1d1f20"/><rect x="430" y="64" width="126" height="7" fill="#909090"/><rect x="430" y="78" width="96" height="7" fill="#909090"/><rect x="50" y="98" width="506" height="3" fill="#1d1f20"/><rect x="50" y="112" width="506" height="28" fill="#eceae3"/><rect x="60" y="122" width="120" height="8" fill="#606060"/><rect x="420" y="119" width="130" height="13" fill="#1d1f20"/><rect x="50" y="158" width="18" height="9" fill="#1d1f20"/><rect x="78" y="158" width="150" height="9" fill="#1d1f20"/><rect x="50" y="172" width="506" height="2" fill="#1d1f20"/><rect x="50" y="184" width="58" height="7" fill="#909090"/><rect x="118" y="184" width="170" height="7" fill="#303030"/><rect x="310" y="184" width="58" height="7" fill="#909090"/><rect x="378" y="184" width="160" height="7" fill="#303030"/><rect x="50" y="198" width="58" height="7" fill="#909090"/><rect x="118" y="198" width="200" height="7" fill="#303030"/><rect x="310" y="198" width="58" height="7" fill="#909090"/><rect x="378" y="198" width="120" height="7" fill="#303030"/><rect x="50" y="226" width="18" height="9" fill="#1d1f20"/><rect x="78" y="226" width="170" height="9" fill="#1d1f20"/><rect x="50" y="240" width="506" height="2" fill="#1d1f20"/><rect x="50" y="250" width="506" height="14" fill="#f2f1ea"/><rect x="56" y="254" width="56" height="6" fill="#777"/><rect x="392" y="254" width="34" height="6" fill="#777"/><rect x="444" y="254" width="44" height="6" fill="#777"/><rect x="506" y="254" width="44" height="6" fill="#777"/><rect x="56" y="274" width="210" height="7" fill="#1d1f20"/><rect x="392" y="274" width="28" height="5" fill="#909090"/><rect x="446" y="274" width="40" height="5" fill="#606060"/><rect x="506" y="274" width="44" height="6" fill="#1d1f20"/><rect x="50" y="285" width="506" height="1" fill="#eeede6"/><rect x="64" y="290" width="240" height="5" fill="#b0b0a8"/><rect x="50" y="299" width="506" height="1" fill="#f4f3ee"/><rect x="56" y="304" width="210" height="7" fill="#1d1f20"/><rect x="50" y="315" width="506" height="1" fill="#eeede6"/><rect x="68" y="320" width="136" height="6" fill="#606060"/><rect x="392" y="320" width="28" height="5" fill="#909090"/><rect x="446" y="320" width="40" height="5" fill="#606060"/><rect x="506" y="320" width="44" height="5" fill="#606060"/><rect x="50" y="331" width="506" height="1" fill="#eeede6"/><rect x="68" y="336" width="136" height="6" fill="#606060"/><rect x="392" y="336" width="28" height="5" fill="#909090"/><rect x="446" y="336" width="40" height="5" fill="#606060"/><rect x="506" y="336" width="44" height="5" fill="#606060"/><rect x="50" y="347" width="506" height="1" fill="#eeede6"/><rect x="68" y="352" width="136" height="6" fill="#606060"/><rect x="392" y="352" width="28" height="5" fill="#909090"/><rect x="446" y="352" width="40" height="5" fill="#606060"/><rect x="506" y="352" width="44" height="5" fill="#606060"/><rect x="50" y="363" width="506" height="1" fill="#eeede6"/><rect x="76" y="368" width="240" height="5" fill="#b0b0a8"/><rect x="50" y="377" width="506" height="1" fill="#f4f3ee"/><rect x="80" y="382" width="122" height="6" fill="#33493b"/><rect x="392" y="382" width="28" height="5" fill="#909090"/><rect x="446" y="382" width="40" height="5" fill="#606060"/><rect x="506" y="382" width="44" height="5" fill="#606060"/><rect x="50" y="393" width="506" height="1" fill="#eeede6"/><rect x="56" y="398" width="210" height="7" fill="#1d1f20"/><rect x="392" y="398" width="28" height="5" fill="#909090"/><rect x="446" y="398" width="40" height="5" fill="#606060"/><rect x="506" y="398" width="44" height="6" fill="#1d1f20"/><rect x="50" y="409" width="506" height="1" fill="#eeede6"/><rect x="64" y="414" width="240" height="5" fill="#b0b0a8"/><rect x="50" y="423" width="506" height="1" fill="#f4f3ee"/><rect x="68" y="428" width="136" height="6" fill="#606060"/><rect x="392" y="428" width="28" height="5" fill="#909090"/><rect x="446" y="428" width="40" height="5" fill="#606060"/><rect x="506" y="428" width="44" height="5" fill="#606060"/><rect x="50" y="439" width="506" height="1" fill="#eeede6"/><rect x="56" y="444" width="210" height="7" fill="#1d1f20"/><rect x="392" y="444" width="28" height="5" fill="#909090"/><rect x="446" y="444" width="40" height="5" fill="#606060"/><rect x="506" y="444" width="44" height="6" fill="#1d1f20"/><rect x="50" y="455" width="506" height="1" fill="#eeede6"/><rect x="56" y="460" width="210" height="7" fill="#1d1f20"/><rect x="392" y="460" width="28" height="5" fill="#909090"/><rect x="446" y="460" width="40" height="5" fill="#606060"/><rect x="506" y="460" width="44" height="6" fill="#1d1f20"/><rect x="50" y="471" width="506" height="1" fill="#eeede6"/><rect x="50" y="480" width="506" height="12" fill="#f7f6f0"/><rect x="58" y="483" width="190" height="6" fill="#909090"/><rect x="56" y="498" width="180" height="6" fill="#33493b"/><rect x="506" y="498" width="44" height="6" fill="#33493b"/><rect x="50" y="509" width="506" height="1" fill="#eeede6"/><rect x="380" y="522" width="176" height="1" fill="#c0c0c0"/><rect x="396" y="531" width="74" height="6" fill="#909090"/><rect x="500" y="531" width="52" height="6" fill="#404040"/><rect x="396" y="545" width="74" height="6" fill="#909090"/><rect x="500" y="545" width="52" height="6" fill="#404040"/><rect x="380" y="560" width="176" height="2" fill="#1d1f20"/><rect x="392" y="570" width="84" height="9" fill="#1d1f20"/><rect x="490" y="570" width="62" height="9" fill="#1d1f20"/><rect x="50" y="608" width="18" height="8" fill="#1d1f20"/><rect x="78" y="608" width="160" height="8" fill="#1d1f20"/><rect x="50" y="620" width="506" height="2" fill="#1d1f20"/><rect x="50" y="632" width="494" height="6" fill="#a8a8a0"/><rect x="50" y="643" width="414" height="6" fill="#a8a8a0"/><rect x="50" y="654" width="494" height="6" fill="#a8a8a0"/><rect x="50" y="665" width="414" height="6" fill="#a8a8a0"/><rect x="50" y="676" width="494" height="6" fill="#a8a8a0"/><rect x="50" y="706" width="18" height="8" fill="#1d1f20"/><rect x="78" y="706" width="110" height="8" fill="#1d1f20"/><rect x="50" y="718" width="506" height="2" fill="#1d1f20"/><rect x="50" y="748" width="190" height="1" fill="#1d1f20"/><rect x="50" y="756" width="74" height="5" fill="#909090"/><rect x="320" y="748" width="190" height="1" fill="#1d1f20"/><rect x="320" y="756" width="74" height="5" fill="#909090"/></svg>';
function renderPreview(){
  $('#preview-paper').innerHTML = PREVIEW_SVG;
  $('#preview-page').textContent = `Page ${doc.ui.page} of ${doc.ui.pages}`;
  $('#previewcol').classList.toggle('hidden', !doc.ui.showPreview);
}

/* ================================================================
   ACTIONS
   ================================================================ */
function selectRow(id){ doc.ui.selectedId=id; saveDoc(); renderGrid(); renderInspector(); }

function setAllCollapsed(v){ doc.rows.forEach(r=>{ if(r.kind==='line') r.collapsed=v; }); saveDoc(); renderGrid(); }

function insertAfterGroup(parentId, newRow){
  // insert after the parent's last child (before any rollup of that parent)
  const idx = doc.rows.findIndex(r=>r.id===parentId);
  let insertAt = idx+1;
  for(let i=idx+1;i<doc.rows.length;i++){
    const r=doc.rows[i];
    if(r.parent===parentId){ if(r.kind==='rollup') break; insertAt=i+1; }
    else break;
  }
  doc.rows.splice(insertAt,0,newRow);
}
function addChild(sel, kind){
  const lineId = sel.kind==='line' ? sel.id : sel.parent;
  if(!lineId) return;
  const nr = { id:genId(), kind, parent:lineId, name:kind==='option'?'New option':'New sub item', qty:1, unit:'EA', price:0 };
  if(kind==='option') nr.accepted=false;
  insertAfterGroup(lineId, nr);
  // first sub item on a line gets an automatic cost tracker rollup
  if(kind==='sub' && !doc.rows.some(x=>x.kind==='rollup' && x.parent===lineId)){
    insertAfterGroup(lineId, { id:genId(), kind:'rollup', parent:lineId });
  }
  selectRow(nr.id); renderAll();
}
function promote(r){
  r.kind='line'; delete r.parent; delete r.optionLabel; delete r.accepted; delete r.group;
  saveDoc(); renderAll(); renderInspector();
}
function removeRow(r){
  const ids = new Set([r.id]);
  if(r.kind==='line') doc.rows.filter(x=>x.parent===r.id).forEach(x=>ids.add(x.id));
  doc.rows = doc.rows.filter(x=>!ids.has(x.id));
  doc.ui.selectedId = null;
  saveDoc(); renderAll(); renderInspector();
}
function addLine(){
  const nr = { id:genId(), kind:'line', name:'New line item', tags:[], qty:1, unit:'EA', price:0, cost:0 };
  // insert before the add-on section if present, else at end
  const secIdx = doc.rows.findIndex(r=>r.kind==='section');
  if(secIdx>=0) doc.rows.splice(secIdx,0,nr); else doc.rows.push(nr);
  selectRow(nr.id); renderAll();
}
function addAddon(){
  const opts = doc.rows.filter(r=>r.group==='addon'&&r.kind==='option');
  const nr = { id:genId(), kind:'option', group:'addon', optionLabel:'OPTION '+(opts.length+1), name:'New add-on', qty:1, unit:'EA', price:0, accepted:false };
  // insert after last addon option (or after section)
  let idx = doc.rows.map(r=>r.id).lastIndexOf(opts.length?opts[opts.length-1].id:doc.rows.find(r=>r.kind==='section')?.id);
  doc.rows.splice(idx+1,0,nr);
  selectRow(nr.id); renderAll();
}

function doCommand(k){
  const sel = doc.ui.selectedId?rowById(doc.ui.selectedId):null;
  switch(k){
    case 'save': saveDoc(); flashStatus('Saved'); break;
    case 'add-line': addLine(); break;
    case 'add-sub':    if(sel) addChild(sel,'sub');    else addLine(); break;
    case 'add-option': if(sel) addChild(sel,'option'); break;
    case 'add-note':   if(sel && isDataRow(sel)){ sel.hasNote=true; if(sel.note==null)sel.note=''; saveDoc(); renderAll(); renderInspector(); } break;
    case 'add-addon':  addAddon(); break;
    case 'indent':     if(sel && sel.kind==='line'){ demoteToSub(sel); } break;
    case 'outdent':    if(sel && (sel.kind==='sub'||sel.kind==='option')) promote(sel); break;
    case 'promote':    if(sel) promote(sel); break;
    case 'remove':     if(sel) removeRow(sel); break;
    case 'preview':    doc.ui.showPreview=!doc.ui.showPreview; saveDoc(); renderToolbar(); renderPreview(); break;
    case 'move-up':    moveRow(sel,-1); break;
    case 'move-down':  moveRow(sel, 1); break;
    case 'pdf':
      if(window.BuilderPrint){ saveDoc(); BuilderPrint.openDocument(doc); flashStatus('Opened the estimate — use Save as PDF'); }
      else flashStatus('Print module not loaded');
      break;
    case 'print':
      if(window.BuilderPrint){ saveDoc(); BuilderPrint.printDocument(doc); }
      else flashStatus('Print module not loaded');
      break;
    case 'setup':      flashStatus('Page setup — coming in a later step'); break;
    case 'convert':    flashStatus('Convert to — coming in a later step'); break;
    case 'close':      flashStatus('Close — this is a standalone preview'); break;
    default: break;
  }
}
function demoteToSub(line){
  // make it a sub of the nearest line above it
  const idx = doc.rows.findIndex(r=>r.id===line.id);
  let host=null;
  for(let i=idx-1;i>=0;i--){ if(doc.rows[i].kind==='line'){ host=doc.rows[i]; break; } }
  if(!host) return;
  line.kind='sub'; line.parent=host.id; delete line.cost;
  saveDoc(); renderAll(); renderInspector();
}
function moveRow(sel,dir){
  if(!sel) return;
  const idx=doc.rows.findIndex(r=>r.id===sel.id); const j=idx+dir;
  if(j<0||j>=doc.rows.length) return;
  const tmp=doc.rows[idx]; doc.rows[idx]=doc.rows[j]; doc.rows[j]=tmp;
  saveDoc(); renderGrid();
}

let flashTimer;
function flashStatus(msg){
  const grow=$('#statusbar .sc.grow'); if(!grow) return;
  const prev=grow.textContent; grow.textContent=msg;
  clearTimeout(flashTimer); flashTimer=setTimeout(()=>{ grow.textContent=prev; }, 2200);
}

/* ---------- menus (popup) ---------- */
const MENU_DEFS = {
  File: [ {k:'save',label:'Save',acc:'Ctrl+S'}, {k:'pdf',label:'Generate PDF…'}, {k:'print',label:'Print…',acc:'Ctrl+P'}, {sep:1}, {k:'close',label:'Close'} ],
  Edit: [ {k:'add-line',label:'New line',acc:'Enter'}, {k:'add-sub',label:'New sub item',acc:'Ctrl+Enter'}, {sep:1}, {k:'remove',label:'Remove row',acc:'Del'} ],
  View: [ {col:'tags',label:'Tags column'}, {col:'qtyUnit',label:'Qty and unit'}, {col:'costMargin',label:'Cost and margin'}, {col:'notes',label:'Notes column'}, {sep:1}, {k:'preview',label:'Preview pane',acc:'F9',toggle:'showPreview'} ],
  Insert: [ {k:'add-line',label:'Line'}, {k:'add-sub',label:'Sub item'}, {k:'add-option',label:'Option'}, {k:'add-note',label:'Note'}, {k:'add-addon',label:'Add-on option'} ],
  Row: [ {k:'indent',label:'Indent'}, {k:'outdent',label:'Outdent'}, {sep:1}, {k:'move-up',label:'Move up'}, {k:'move-down',label:'Move down'}, {sep:1}, {k:'remove',label:'Remove'} ],
  Document: [ {k:'setup',label:'Page setup…'}, {k:'setup',label:'Edit terms…'}, {k:'setup',label:'Letterhead…'} ],
  Window: [ {k:'noop',label:'Cascade',dis:1}, {k:'noop',label:'Tile',dis:1} ],
  Help: [ {k:'noop',label:'About Document Builder',dis:1} ]
};
let openMenuName=null;
function openMenu(name, anchor){
  closePopups();
  if(openMenuName===name){ openMenuName=null; return; }
  openMenuName=name;
  anchor.classList.add('open');
  const items = MENU_DEFS[name]||[];
  const menu = el('div','popmenu');
  items.forEach(it=>{
    if(it.sep){ menu.appendChild(el('div','msep')); return; }
    const mi = el('div','mi'+(it.dis?' disabled':''));
    let tick='';
    if(it.toggle) tick = doc.ui[it.toggle]?`<span class="tick">${SVG.check}</span>`:'';
    if(it.col)    tick = doc.columns[it.col]?`<span class="tick">${SVG.check}</span>`:'';
    mi.innerHTML = tick+esc(it.label)+(it.acc?`<span class="acc">${esc(it.acc)}</span>`:'');
    if(!it.dis) mi.addEventListener('click', ()=>{
      if(it.col){ doc.columns[it.col]=!doc.columns[it.col]; saveDoc(); renderColbar(); renderGrid(); }
      else doCommand(it.k);
      closePopups();
    });
    menu.appendChild(mi);
  });
  $('#popup-layer').appendChild(menu);
  const rc = anchor.getBoundingClientRect();
  menu.style.left = rc.left+'px'; menu.style.top = rc.bottom+'px';
}
function closePopups(){ $('#popup-layer').innerHTML=''; document.querySelectorAll('.menubar .m.open').forEach(m=>m.classList.remove('open')); openMenuName=null; }
document.addEventListener('mousedown', e=>{ if(!e.target.closest('.popmenu') && !e.target.closest('.menubar .m')) closePopups(); });

/* ---------- keyboard ---------- */
document.addEventListener('keydown', e=>{
  const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName||'');
  if(e.key==='F9'){ e.preventDefault(); doCommand('preview'); return; }
  if(typing) return;
  const sel = doc.ui.selectedId?rowById(doc.ui.selectedId):null;
  if(e.key==='Enter' && !e.ctrlKey){ e.preventDefault(); addLine(); }
  else if(e.key==='Enter' && e.ctrlKey){ e.preventDefault(); if(sel) addChild(sel,'sub'); }
  else if(e.key==='Delete'){ if(sel) removeRow(sel); }
  else if(e.key==='Tab' && !e.shiftKey && sel && sel.kind==='line'){ e.preventDefault(); demoteToSub(sel); }
  else if(e.key==='Tab' && e.shiftKey && sel && (sel.kind==='sub'||sel.kind==='option')){ e.preventDefault(); promote(sel); }
});

/* ================================================================
   BOOT
   ================================================================ */
function renderAll(){
  renderDocstrip(); renderColbar(); renderGrid(); renderTotals(); renderStatus(); renderPreview();
}
function boot(){
  loadDoc();
  // defaults for docs saved before these settings existed
  if(!doc.ui.selStyle) doc.ui.selStyle = 1;
  if(!doc.settings.subtotalRule) doc.settings.subtotalRule = 'customer';
  renderMenubar(); renderToolbar();
  renderAll(); renderInspector(); renderDocSettings();
  $('#prev-back').addEventListener('click', ()=>{ if(doc.ui.page>1){doc.ui.page--; saveDoc(); renderPreview();} });
  $('#prev-fwd').addEventListener('click', ()=>{ if(doc.ui.page<doc.ui.pages){doc.ui.page++; saveDoc(); renderPreview();} });
}
document.addEventListener('DOMContentLoaded', boot);
