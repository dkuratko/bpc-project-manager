/* ============================================================
   Build Play Contracting - Project Manager 1.0
   Shell: Project Browser (Screen 01) + New Project (Screen 02)
   ============================================================ */

'use strict';

/* ---------- tiny helpers ---------- */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const el = (tag, cls, html) => { const n=document.createElement(tag); if(cls) n.className=cls; if(html!=null) n.innerHTML=html; return n; };
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const money = v => (v==null || v==='') ? '—' : '$'+Number(v).toLocaleString('en-US');
const dash  = v => (v==null || v==='') ? '—' : v;
const seqOf = id => { const m=/BPC-\d+-(\d+)/.exec(id); return m ? parseInt(m[1],10) : 0; };
const dateVal = s => { if(!s) return null; const m=/(\d\d)\/(\d\d)\/(\d\d)/.exec(s); return m ? new Date(2000+ +m[3], +m[1]-1, +m[2]).getTime() : null; };

/* small inline icons (Win2000 pixel style) */
const ICON = {
  warn:  '<svg width="12" height="12" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M8 1l7 13H1z"/><path fill="#ffd800" d="M8 3.4l5.3 9.8H2.7z"/><path fill="#000" d="M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z"/></svg>',
  warnLg:'<svg width="32" height="32" viewBox="0 0 16 16"><path fill="#000" d="M8 1l7 13H1z"/><path fill="#ffd800" d="M8 3.4l5.3 9.8H2.7z"/><path fill="#000" d="M7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z"/></svg>',
  folder:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 3h5l1 1h8v10H1z"/><path fill="#ffcc66" d="M2 4h4l1 1h7v8H2z"/></svg>',
  folderOpen:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 3h5l1 1h8v10H1z"/><path fill="#ffcc66" d="M2 4h4l1 1h7v3H2z"/><path fill="#ffe3a3" d="M2 9h12v4H2z"/></svg>',
  folderGrey:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 3h5l1 1h8v10H1z"/><path fill="#c0c0c0" d="M2 4h4l1 1h7v8H2z"/></svg>',
  building:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 2h14v10H1z"/><path fill="#008080" d="M2 3h12v8H2z"/><path fill="#000" d="M6 13h4v2H6zM4 14h8v1H4z"/></svg>',
  project:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M3 1h7l3 3v11H3z"/><path fill="#fff" d="M4 2h5v3h3v9H4z"/><path fill="#0a246a" d="M6 8h4v1H6zM6 10h4v1H6z"/></svg>',
  down:  '<svg width="7" height="4" viewBox="0 0 7 4" style="shape-rendering:crispEdges"><path fill="#000" d="M0 0h7L3.5 4z"/></svg>',
  up:    '<svg width="7" height="4" viewBox="0 0 7 4" style="shape-rendering:crispEdges"><path fill="#000" d="M0 4h7L3.5 0z"/></svg>',
  check: '<svg width="9" height="8" viewBox="0 0 11 9" style="shape-rendering:crispEdges"><path fill="#000" d="M4 9L0 5l1.5-1.5L4 6 9.5 0.5 11 2z"/></svg>',
  question:'<svg width="32" height="32" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#0a246a"/><path fill="#fff" d="M6.2 4.6c.5-.5 1.1-.7 1.9-.7 1.4 0 2.4.8 2.4 2 0 .8-.4 1.3-1.1 1.8-.6.4-.8.6-.8 1.1v.4H7.2v-.6c0-.8.3-1.2 1-1.7.5-.4.7-.6.7-1 0-.5-.4-.8-.9-.8-.5 0-.9.3-1 .9zM7.1 10.9h1.6v1.6H7.1z"/></svg>',
  info:'<svg width="32" height="32" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#0a246a"/><path fill="#fff" d="M7.1 3.2h1.8v1.8H7.1zM7.1 6.2h1.8v6.6H7.1z"/></svg>'
};

/* toolbar icons */
const TB = {
  newproj:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M2 1h8l4 4v10H2z"/><path fill="#fff" d="M3 2h6v4h4v8H3z"/><path fill="#008000" d="M9 8h2v2h2v2h-2v2H9v-2H7v-2h2z"/></svg>',
  open:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 3h5l1 1h8v10H1z"/><path fill="#ffcc66" d="M2 4h4l1 1h7v3H2z"/><path fill="#ffe3a3" d="M2 9h12v4H2z"/></svg>',
  refresh:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#008000" d="M2 4h8V2l4 3-4 3V6H2z"/><path fill="#008000" d="M14 10H6V8l-4 3 4 3v-2h8z"/></svg>',
  find:'<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4" fill="#cfe0f0" stroke="#000"/><path d="M9.5 9.5l4.5 4.5" stroke="#000" stroke-width="2"/></svg>',
  filter:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#4a6f9a" d="M2 3h12L9 8v6L7 13V8z"/></svg>',
  upload:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M3 1h7l3 3v11H3z"/><path fill="#fff" d="M4 2h5v3h3v9H4z"/><path fill="#008000" d="M7 12V9H5l3-3 3 3H9v3z"/></svg>',
  print:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M4 2h8v3H4z"/><path fill="#fff" d="M5 3h6v2H5z"/><path fill="#000" d="M2 5h12v6H2z"/><path fill="#c0c0c0" d="M3 6h10v4H3z"/><path fill="#000" d="M4 9h8v6H4z"/><path fill="#fff" d="M5 10h6v4H5z"/></svg>',
  help:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M2 2h12v11H2z"/><path fill="#fff" d="M3 3h10v9H3z"/><path fill="#0a246a" d="M6 5h3v1h1v2H8v1H7V7h1V6H6z"/><path fill="#0a246a" d="M7 10h1v1H7z"/></svg>'
};

/* ---------- column definitions ---------- */
const COLS_DEFAULT = [
  {key:'warn',     label:'',            w:'18px',          cls:'center'},
  {key:'id',       label:'Project ID',  w:'74px'},
  {key:'title',    label:'Project Title',w:'minmax(0,1fr)'},
  {key:'customer', label:'Customer',    w:'132px'},
  {key:'location', label:'Location',    w:'102px'},
  {key:'stage',    label:'Stage',       w:'72px'},
  {key:'status',   label:'Status',      w:'104px'},
  {key:'next',     label:'Next',        w:'58px'},
  {key:'value',    label:'Value',       w:'62px', cls:'num'}
];
const COLS_ATTN = [
  {key:'warn',     label:'',            w:'18px',          cls:'center'},
  {key:'id',       label:'Project ID',  w:'74px'},
  {key:'title',    label:'Project Title',w:'minmax(0,1fr)'},
  {key:'customer', label:'Customer',    w:'120px'},
  {key:'alert',    label:'Alert',       w:'170px'},
  {key:'age',      label:'Age',         w:'46px', cls:'num'},
  {key:'next',     label:'Next',        w:'58px'},
  {key:'value',    label:'Value',       w:'62px', cls:'num'}
];

/* ---------- state + persistence ---------- */
const STORE_KEY = 'bpc-pm-v8';
let state;

function defaultState(){
  return {
    projects: JSON.parse(JSON.stringify(SEED_PROJECTS)),
    customers: [...SEED_CUSTOMERS],
    scope: { type:'all' },
    filters: { status:'All Active', stage:'(all)', customer:'(all)', find:'', attentionOnly:false },
    sort: { key:'next', dir:'asc' },
    selectedId: null,
    recent: [],
    expanded: { active:true, byCustomer:false, recent:false },
    user: 'dbrooks'
  };
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){ state = Object.assign(defaultState(), JSON.parse(raw)); return; }
  }catch(e){ /* fall through to seed */ }
  state = defaultState();
  saveState();
}
function saveState(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){}
}
function nextProjectId(){
  const yr = 26;
  let max = 0;
  state.projects.forEach(p => { const m=new RegExp('BPC-'+yr+'-(\\d+)').exec(p.id); if(m) max=Math.max(max, +m[1]); });
  return { id:`BPC-${yr}-${max+1}`, seq:max+1 };
}

/* ---------- project classification ---------- */
const isCancelled = p => p.status === 'Cancelled';
const isClosed    = p => p.stage === 'Closed' || isCancelled(p);
const isHold      = p => !!p.hold && !isClosed(p);
const isActive    = p => !isHold(p) && !isClosed(p);
const hasAlert    = p => !!p.alert;
const locOf       = p => [p.city, p.state].filter(Boolean).join(', ');

/* ============================================================
   POPUP INFRASTRUCTURE (menus, dropdowns, context menus)
   ============================================================ */
let openPopups = [];
function closeAllPopups(){
  openPopups.forEach(p => p.remove());
  openPopups = [];
  $$('.menubar .m.open').forEach(m => m.classList.remove('open'));
}
document.addEventListener('mousedown', e => {
  if(!e.target.closest('.popup') && !e.target.closest('.menubar .m') && !e.target.closest('.combo')) closeAllPopups();
});

/* items: [{label, key, accel, disabled, checked, bold, submenu, action, sep}] */
function buildPopup(items, x, y){
  const pop = el('div','popup');
  pop.style.left = x+'px'; pop.style.top = y+'px';
  items.forEach(it => {
    if(it.sep){ pop.appendChild(el('div','mi sep')); return; }
    const mi = el('div','mi'+(it.disabled?' disabled':'')+(it.bold?' bold':''));
    mi.innerHTML =
      `<span class="mi-check">${it.checked?ICON.check:''}</span>`+
      `<span class="mi-label">${it.label}</span>`+
      `<span class="${it.submenu?'mi-arrow':'mi-key'}">${it.submenu?'▸':(it.accel||'')}</span>`;
    if(!it.disabled){
      if(it.submenu){
        mi.addEventListener('mouseenter', () => {
          // close sibling submenus at this level
          [...pop.querySelectorAll('.mi.subopen')].forEach(x=>x.classList.remove('subopen'));
          mi.classList.add('subopen');
          const r = mi.getBoundingClientRect();
          const sub = buildPopup(it.submenu, r.right-3, r.top-3);
          sub._parentLevel = pop;
        });
      }else{
        mi.addEventListener('mouseenter', () => {
          // hovering a normal item closes any submenu opened from this popup
          const kids = openPopups.filter(p => p._parentLevel === pop);
          kids.forEach(k => { const i=openPopups.indexOf(k); if(i>=0) openPopups.splice(i,1); k.remove(); });
        });
        mi.addEventListener('mouseup', () => { closeAllPopups(); it.action && it.action(); });
      }
    }
    pop.appendChild(mi);
  });
  document.body.appendChild(pop);
  // keep on-screen
  const r = pop.getBoundingClientRect();
  if(r.right > innerWidth)  pop.style.left = Math.max(2, x - r.width) + 'px';
  if(r.bottom > innerHeight) pop.style.top = Math.max(2, innerHeight - r.height - 2) + 'px';
  openPopups.push(pop);
  return pop;
}

/* ============================================================
   MENU BAR
   ============================================================ */
function menuDefs(){
  const sel = selectedProject();
  const hasSel = !!sel;
  const setStageSub = STAGES.map(s => ({ label:s, checked: sel && sel.stage===s,
    action:()=>{ if(sel){ sel.stage=s; sel.status=STATUSES[s][0]; recalcAlerts(); saveState(); render(); } } }));
  const setStatusSub = hasSel ? (STATUSES[sel.stage]||[]).map(s => ({ label:s, checked: sel.status===s,
    action:()=>{ sel.status=s; saveState(); render(); } })) : [{label:'(select a project)', disabled:true}];
  const recentSub = state.recent.length
    ? state.recent.map(id => { const p=byId(id); return { label: p? `${id} ${short(p.title)}`:id, action:()=>openProject(id) }; })
    : [{label:'(none)', disabled:true}];
  const winList = openProjects.map((id,i) => { const wp=byId(id); return { label:`${i+2} ${esc(id)} ${esc(short(wp?wp.title:'',22))}`, checked: viewMode==='workspace'&&activeProjectId===id, action:()=>activateProject(id) }; });

  return {
    File: [
      {label:'<u>N</u>ew Project…', accel:'Ctrl+N', action:openNewProject},
      {label:'<u>O</u>pen Project', accel:'Ctrl+O', disabled:!hasSel, action:()=>sel&&openProject(sel.id)},
      {label:'<u>C</u>lose Project', disabled: viewMode!=='workspace', action:()=>{ if(activeProjectId) closeProjectWindow(activeProjectId); }},
      {sep:true},
      {label:'<u>I</u>mport Documents…', disabled:!hasSel, action:()=>newDocFor(menuProject())},
      {label:'E<u>x</u>port List…', action:()=>exportText('Projects', visibleProjects().map(x=>[x.id,x.title,x.customer,locOf(x),isHold(x)?'On Hold':x.stage,x.status,dash(x.next),money(x.value)].join('\t')).join('\n'))},
      {sep:true},
      {label:'<u>P</u>rint List…', accel:'Ctrl+P', action:()=>exportText('Projects', visibleProjects().map(x=>[x.id,x.title,x.customer,x.status,money(x.value)].join('\t')).join('\n'))},
      {sep:true},
      {label:'<u>R</u>ecent Projects', submenu:recentSub},
      {sep:true},
      {label:'E<u>x</u>it', action:()=>window.winControls?.close()}
    ],
    Edit: [
      {label:'<u>U</u>ndo', accel:'Ctrl+Z', disabled:true},
      {sep:true},
      {label:'<u>F</u>ind…', accel:'Ctrl+F', action:()=>{ $('#find-input').focus(); $('#find-input').select&&$('#find-input').select(); }},
      {label:'Clear Fil<u>t</u>ers', action:clearFilters}
    ],
    View: [
      {label:'<u>R</u>efresh', accel:'F5', action:render},
      {sep:true},
      {label:'<u>A</u>ll Projects', checked: state.scope.type==='all', action:()=>setScope({type:'all'})},
      {label:'Atten<u>t</u>ion Required', checked: state.scope.type==='attention', action:()=>setScope({type:'attention'})},
      {sep:true},
      {label:'Show Atten<u>d</u>tion Only', checked: state.filters.attentionOnly, action:()=>{ state.filters.attentionOnly=!state.filters.attentionOnly; saveState(); render(); }}
    ],
    Project: [
      {label:'<u>O</u>pen', accel:'Enter', bold:true, disabled:!hasSel, action:()=>sel&&openProject(sel.id)},
      {label:'Open in <u>N</u>ew Window', disabled:!hasSel, action:()=>sel&&openProject(sel.id,true)},
      {sep:true},
      {label:'New <u>E</u>stimate…', disabled:!hasSel, action:()=>newEstimateFor(menuProject())},
      {label:'Upload <u>P</u>urchase Order…', disabled:!hasSel, action:()=>newPOFor(menuProject())},
      {label:'Upload <u>D</u>ocument…', disabled:!hasSel, action:()=>newDocFor(menuProject())},
      {sep:true},
      {label:'Set <u>S</u>tage', submenu:setStageSub, disabled:!hasSel},
      {label:'Set Sta<u>t</u>us', submenu:setStatusSub, disabled:!hasSel},
      {label:'<u>C</u>lear Attention Flag', disabled:!hasSel || !sel.alert, action:()=>{ if(sel){ delete sel.alert; saveState(); render(); } }},
      {sep:true},
      {label:'P<u>r</u>operties', accel:'Alt+Enter', disabled:!hasSel, action:()=>sel&&showProperties(sel.id)}
    ],
    Documents: [
      {label:'New <u>E</u>stimate…', disabled:!hasSel, action:()=>newEstimateFor(menuProject())},
      {label:'Upload <u>P</u>urchase Order…', disabled:!hasSel, action:()=>newPOFor(menuProject())},
      {label:'Upload <u>D</u>ocument…', disabled:!hasSel, action:()=>newDocFor(menuProject())}
    ],
    Tools: [
      {label:'Re<u>c</u>alculate Flags', action:()=>{ recalcAlerts(); saveState(); render(); }},
      {sep:true},
      {label:'<u>O</u>ptions…', action:openOptions}
    ],
    Window: [
      {label:'Next Window', accel:'Ctrl+Tab', action:nextWindow, disabled:openProjects.length<1},
      {sep:true},
      {label:'1 Project Browser', checked: viewMode==='browser', action:exitToBrowser},
      ...winList,
      {sep:true},
      {label:'Close All Projects', disabled:openProjects.length<1, action:closeAllProjects}
    ],
    Help: [
      {label:'<u>H</u>elp Topics', accel:'F1', action:showAbout},
      {sep:true},
      {label:'<u>A</u>bout Project Manager…', action:showAbout}
    ]
  };
}

function buildMenuBar(){
  const bar = $('#menubar'); bar.innerHTML='';
  const defs = ['File','Edit','View','Project','Documents','Tools','Window','Help'];
  const labels = {File:'<u>F</u>ile',Edit:'<u>E</u>dit',View:'<u>V</u>iew',Project:'<u>P</u>roject',Documents:'<u>D</u>ocuments',Tools:'<u>T</u>ools',Window:'<u>W</u>indow',Help:'<u>H</u>elp'};
  defs.forEach(name => {
    const m = el('div','m',labels[name]);
    m.dataset.menu = name;
    const open = () => {
      const wasOpen = m.classList.contains('open');
      closeAllPopups();
      if(wasOpen) return;
      m.classList.add('open');
      const r = m.getBoundingClientRect();
      buildPopup(menuDefs()[name], r.left, r.bottom);
    };
    m.addEventListener('mousedown', e => { e.preventDefault(); open(); });
    m.addEventListener('mouseenter', () => { if(openPopups.length && !m.classList.contains('open')) open(); });
    bar.appendChild(m);
  });
}

/* ============================================================
   TOOLBAR
   ============================================================ */
function buildToolbar(){
  if(viewMode==='workspace' && activeProjectId){ buildProjectToolbar(); return; }
  const tb = $('#toolbar'); tb.innerHTML='';
  const add = (cls, html, title, action, disabled) => {
    const b = el('div','tool'+(cls?' '+cls:''), html);
    b.title = title;
    if(disabled) b.setAttribute('disabled','');
    else b.addEventListener('mouseup', () => action && action());
    tb.appendChild(b); return b;
  };
  add('', TB.newproj+'<span>New Project</span>', 'New Project (Ctrl+N)', openNewProject);
  add('', TB.open+'<span>Open Project</span>', 'Open Project (Ctrl+O)', () => { const s=selectedProject(); if(s) openProject(s.id); });
  tb.appendChild(el('div','tsep'));
  add('icon', TB.refresh, 'Refresh (F5)', render);
  add('icon', TB.find, 'Find', () => $('#find-input').focus());
  add('icon', TB.filter, 'Filter', () => openCombo('status'));
  tb.appendChild(el('div','tsep'));
  add('icon', TB.upload, 'Upload Document to selected project', () => { const s=selectedProject(); if(s) newDocFor(s); else messageBox('Upload Document', ICON.info, 'Select a project first, then upload.', ['OK']); });
  add('icon', TB.print, 'Export List', () => exportText('Projects', visibleProjects().map(x=>[x.id,x.title,x.customer,locOf(x),isHold(x)?'On Hold':x.stage,x.status,dash(x.next),money(x.value)].join('\t')).join('\n')));
  tb.appendChild(el('div','tsep'));
  add('icon', TB.help, 'Help', showAbout);
}

/* ============================================================
   FILTER BAND
   ============================================================ */
const STATUS_PRESETS = ['All Active','All','On Hold','Closed'];

function buildFilterBand(){
  const fb = $('#filterband'); fb.innerHTML='';

  const mkCombo = (id, valueText, width) => {
    const c = el('div','combo'); c.id=id; c.style.width=width+'px';
    c.innerHTML = `<span class="val">${esc(valueText)}</span><span class="arrow">${ICON.down}</span>`;
    return c;
  };

  fb.appendChild(el('label',null,'Status:'));
  const cStatus = mkCombo('cmb-status', state.filters.status, 106);
  cStatus.addEventListener('mousedown', e=>{e.preventDefault(); openStatusCombo(cStatus);});
  fb.appendChild(cStatus);

  fb.appendChild(el('label',null,'Stage:'));
  const cStage = mkCombo('cmb-stage', state.filters.stage, 96);
  cStage.addEventListener('mousedown', e=>{e.preventDefault(); openStageCombo(cStage);});
  fb.appendChild(cStage);

  fb.appendChild(el('label',null,'Customer:'));
  const cCust = mkCombo('cmb-customer', state.filters.customer, 132);
  cCust.addEventListener('mousedown', e=>{e.preventDefault(); openCustomerCombo(cCust);});
  fb.appendChild(cCust);

  fb.appendChild(el('label',null,'Fi<u>n</u>d:'));
  const tb = el('div','textbox'); tb.style.width='150px';
  const inp = el('input'); inp.id='find-input'; inp.type='text'; inp.placeholder='ID, title, customer, PO…';
  inp.value = state.filters.find;
  inp.addEventListener('input', () => { state.filters.find = inp.value; saveState(); renderList(); renderStatusBar(); });
  inp.addEventListener('keydown', e => { if(e.key==='Enter'){ renderList(); } });
  tb.appendChild(inp); fb.appendChild(tb);

  const findBtn = el('button','btn','Find Now'); findBtn.style.minWidth='62px';
  findBtn.addEventListener('click', renderList); fb.appendChild(findBtn);
  const clearBtn = el('button','btn','Clear'); clearBtn.addEventListener('click', clearFilters); fb.appendChild(clearBtn);

  const chk = el('div','check'+(state.filters.attentionOnly?' on':''));
  chk.innerHTML = `<span class="box">${ICON.check}</span><span>Attention only</span>`;
  chk.addEventListener('click', () => { state.filters.attentionOnly=!state.filters.attentionOnly; saveState(); buildFilterBand(); render(); });
  fb.appendChild(chk);
}

function openStatusCombo(anchor){
  closeAllPopups();
  const r = anchor.getBoundingClientRect();
  buildPopup(STATUS_PRESETS.map(s=>({label:s, checked:state.filters.status===s,
    action:()=>{ state.filters.status=s; saveState(); buildFilterBand(); render(); }})), r.left, r.bottom);
}
function openStageCombo(anchor){
  closeAllPopups();
  const r = anchor.getBoundingClientRect();
  const items = [{label:'(all)', checked:state.filters.stage==='(all)', action:()=>{ state.filters.stage='(all)'; saveState(); buildFilterBand(); render(); }}]
    .concat(STAGES.map(s=>({label:s, checked:state.filters.stage===s, action:()=>{ state.filters.stage=s; saveState(); buildFilterBand(); render(); }})));
  buildPopup(items, r.left, r.bottom);
}
function openCustomerCombo(anchor){
  closeAllPopups();
  const r = anchor.getBoundingClientRect();
  const items = [{label:'(all)', checked:state.filters.customer==='(all)', action:()=>{ state.filters.customer='(all)'; saveState(); buildFilterBand(); render(); }}]
    .concat(state.customers.slice().sort().map(c=>({label:esc(c), checked:state.filters.customer===c,
      action:()=>{ state.filters.customer=c; saveState(); buildFilterBand(); render(); }})));
  buildPopup(items, r.left, r.bottom);
}
function openCombo(which){ const c=$('#cmb-'+which); if(c) c.dispatchEvent(new MouseEvent('mousedown')); }

function clearFilters(){
  state.filters = { status:'All Active', stage:'(all)', customer:'(all)', find:'', attentionOnly:false };
  saveState(); buildFilterBand(); render();
}

/* ============================================================
   FOLDER TREE
   ============================================================ */
function stageCount(stage){ return state.projects.filter(p=>isActive(p) && p.stage===stage).length; }

function buildTree(){
  const tree = $('#tree'); tree.innerHTML='';
  const P = state.projects;
  const activeList = P.filter(isActive);
  const attnCount = P.filter(hasAlert).length;
  const holdCount = P.filter(isHold).length;
  const closedCount = P.filter(isClosed).length;

  const node = (depth, twist, icon, label, scope, opts={}) => {
    const n = el('div','tnode'+(opts.bold?' bold':'')+(isScope(scope)?' sel':''));
    n.style.paddingLeft = (3 + depth*14) + 'px';
    const tw = el('div','twist'+(twist==null?' empty':''), twist==='-'?'−':(twist==='+'?'+':''));
    if(twist!=null && opts.toggle){ tw.addEventListener('mousedown', e=>{ e.stopPropagation(); opts.toggle(); }); }
    n.appendChild(tw);
    n.appendChild(el('div','tico', icon));
    n.appendChild(el('div','tlabel', label));
    if(scope) n.addEventListener('mousedown', ()=>setScope(scope));
    else if(opts.toggle) n.addEventListener('mousedown', ()=>opts.toggle());
    tree.appendChild(n); return n;
  };

  node(0,'-',ICON.building,'Build Play Contracting', null, {bold:true, toggle:()=>{}});
  node(1,'-',ICON.folder,`All Projects (${P.length})`, {type:'all'}, {toggle:()=>{}});
  node(2, state.expanded.active?'-':'+', state.expanded.active?ICON.folderOpen:ICON.folder,
    `Active (${activeList.length})`, {type:'active'}, {bold:false, toggle:()=>{ state.expanded.active=!state.expanded.active; saveState(); buildTree(); }});
  if(state.expanded.active){
    STAGES.filter(s=>s!=='Closed').forEach(s=>{
      const c=stageCount(s); if(c>0 || ['Intake','Estimating','Contracting','Procurement','Delivery','Installation','Closeout'].includes(s))
        node(4,null,ICON.folder,`${esc(s)} (${c})`, {type:'stage', key:s});
    });
  }
  node(2,null,ICON.warn,`Attention Required (${attnCount})`, {type:'attention'}, {bold:true});
  node(2,null,ICON.folder,`On Hold (${holdCount})`, {type:'hold'});
  node(2,null,ICON.folder,`Closed (${closedCount})`, {type:'closed'});
  node(1, state.expanded.byCustomer?'-':'+', ICON.folder, `By Customer (${state.customers.length})`, null,
    {toggle:()=>{ state.expanded.byCustomer=!state.expanded.byCustomer; saveState(); buildTree(); }});
  if(state.expanded.byCustomer){
    state.customers.slice().sort().forEach(c=>{
      const cnt = P.filter(p=>p.customer===c).length;
      node(3,null,ICON.folder,`${esc(short(c,18))} (${cnt})`, {type:'customer', key:c});
    });
  }
  node(1, null, ICON.folder, 'Recently Viewed', {type:'recent'});
  node(1,null,ICON.folderGrey,'Archive (2025)', {type:'archive'});
}

function isScope(s){ if(!s) return false; return state.scope.type===s.type && (s.key==null || state.scope.key===s.key); }
function setScope(s){ state.scope = s; state.selectedId = null; saveState(); render(); }

/* ============================================================
   LIST VIEW
   ============================================================ */
function currentColumns(){ return state.scope.type==='attention' ? COLS_ATTN : COLS_DEFAULT; }

function scopedProjects(){
  const P = state.projects;
  const s = state.scope;
  let list;
  switch(s.type){
    case 'active':    list = P.filter(isActive); break;
    case 'stage':     list = P.filter(p=>isActive(p) && p.stage===s.key); break;
    case 'attention': list = P.filter(hasAlert); break;
    case 'hold':      list = P.filter(isHold); break;
    case 'closed':    list = P.filter(isClosed); break;
    case 'customer':  list = P.filter(p=>p.customer===s.key); break;
    case 'recent':    list = state.recent.map(byId).filter(Boolean); break;
    case 'archive':   list = []; break;
    default:          list = P.slice();
  }
  return list;
}

function applyFilters(list){
  const f = state.filters;
  return list.filter(p=>{
    if(f.status==='All Active' && !isActive(p)) return false;
    if(f.status==='On Hold'    && !isHold(p))   return false;
    if(f.status==='Closed'     && !isClosed(p)) return false;
    if(f.stage!=='(all)'   && p.stage!==f.stage) return false;
    if(f.customer!=='(all)'&& p.customer!==f.customer) return false;
    if(f.attentionOnly && !hasAlert(p)) return false;
    if(f.find){
      const q=f.find.toLowerCase();
      const hay=[p.id,p.title,p.customer,locOf(p),p.status,p.stage].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}

function sortList(list){
  const {key,dir} = state.sort;
  const mul = dir==='asc'?1:-1;
  const val = (p)=>{
    switch(key){
      case 'warn':  return hasAlert(p)?1:0;
      case 'id':    return seqOf(p.id);
      case 'value': return p.value==null? -Infinity : p.value;
      case 'age':   return p.alert? p.alert.age : -Infinity;
      case 'next':  { const v=dateVal(p.next); return v==null? Infinity : v; }  // empties last
      case 'location': return locOf(p).toLowerCase();
      case 'alert': return p.alert? p.alert.kind.toLowerCase() : '';
      default:      return String(p[key]==null?'':p[key]).toLowerCase();
    }
  };
  return list.slice().sort((a,b)=>{
    let va=val(a), vb=val(b);
    // 'next' empties always last regardless of direction
    if(key==='next'){ const ea=va===Infinity, eb=vb===Infinity; if(ea&&!eb)return 1; if(eb&&!ea)return -1; if(ea&&eb)return seqOf(b.id)-seqOf(a.id); }
    if(va<vb) return -1*mul; if(va>vb) return 1*mul;
    return seqOf(b.id)-seqOf(a.id);
  });
}

function visibleProjects(){ return sortList(applyFilters(scopedProjects())); }

function buildListHead(){
  const head = $('#lv-head');
  const cols = currentColumns();
  head.style.gridTemplateColumns = cols.map(c=>c.w).join(' ');
  head.innerHTML='';
  cols.forEach(c=>{
    const d = el('div','col'+(c.cls==='num'?' num':''));
    let arrow='';
    if(state.sort.key===c.key) arrow = `<span class="sort">${state.sort.dir==='asc'?ICON.down:ICON.up}</span>`;
    d.innerHTML = `<span>${esc(c.label)}</span>${arrow}`;
    if(c.key!=='warn'){
      d.addEventListener('mousedown', ()=>{
        if(state.sort.key===c.key) state.sort.dir = state.sort.dir==='asc'?'desc':'asc';
        else { state.sort.key=c.key; state.sort.dir = (c.key==='next'||c.key==='id')?'asc':'asc'; }
        saveState(); render();
      });
    }
    head.appendChild(d);
  });
}

function cellText(p,key){
  switch(key){
    case 'id':return esc(p.id);
    case 'title':return esc(p.title);
    case 'customer':return esc(p.customer);
    case 'location':return esc(locOf(p));
    case 'stage':return esc(isHold(p)?'On Hold':(isCancelled(p)?'Cancelled':p.stage));
    case 'status':return esc(p.status);
    case 'next':return esc(dash(p.next));
    case 'value':return money(p.value);
    case 'alert':return p.alert?esc(p.alert.kind):'';
    case 'age':return p.alert?esc(p.alert.age+' d'):'';
    default:return '';
  }
}

function renderList(){
  buildListHead();
  const rows = $('#lv-rows');
  rows.innerHTML='';
  const cols = currentColumns();
  const gtc = cols.map(c=>c.w).join(' ');
  const list = visibleProjects();

  list.forEach(p=>{
    const row = el('div','lv-row'+(p.id===state.selectedId?' sel':'')+(isGhost(p)?' ghost':''));
    row.style.gridTemplateColumns = gtc;
    row.dataset.id = p.id;
    cols.forEach(c=>{
      if(c.key==='warn'){ row.appendChild(el('div','cell center', hasAlert(p)?ICON.warn:'')); return; }
      row.appendChild(el('div','cell'+(c.cls==='num'?' num':''), cellText(p,c.key)));
    });
    row.addEventListener('mousedown', e=>{
      state.selectedId=p.id; renderList(); renderStatusBar(); buildMenuBar();
      if(e.button===2){ e.preventDefault(); showRowContext(p, e.clientX, e.clientY); }
    });
    row.addEventListener('dblclick', ()=>openProject(p.id));
    rows.appendChild(row);
  });

  if(list.length===0){
    const empty = el('div'); empty.style.cssText='padding:8px;color:#808080';
    empty.textContent = state.scope.type==='archive' ? 'Archived projects are stored separately (2025).' : 'No projects match the current view.';
    rows.appendChild(empty);
  }
}
function isGhost(p){ return false; } // reserved: rows for things "not yet real"

/* right-click context menu (mirrors the blueprint) */
function showRowContext(p, x, y){
  closeAllPopups();
  const items = [
    {label:'Open Project', accel:'Enter', bold:true, action:()=>openProject(p.id)},
    {label:'Open in New Window', action:()=>openProject(p.id,true)},
    {sep:true},
    {label:'New Estimate…', action:()=>newEstimateFor(p)},
    {label:'Upload Purchase Order…', action:()=>newPOFor(p)},
    {label:'Upload Document…', action:()=>newDocFor(p)},
    {sep:true},
    {label:'Set Stage', submenu:STAGES.map(s=>({label:s, checked:p.stage===s, action:()=>{ p.stage=s; p.status=STATUSES[s][0]; recalcAlerts(); saveState(); render(); }}))},
    {label:'Set Status', submenu:(STATUSES[p.stage]||[]).map(s=>({label:s, checked:p.status===s, action:()=>{ p.status=s; saveState(); render(); }}))},
    {label:'Clear Attention Flag', disabled:!p.alert, action:()=>{ delete p.alert; saveState(); render(); }},
    {sep:true},
    {label:'Properties', accel:'Alt+Enter', action:()=>showProperties(p.id)}
  ];
  buildPopup(items, x, y);
}
document.addEventListener('contextmenu', e=>{ if(e.target.closest('.lv-row')) e.preventDefault(); });

/* ============================================================
   STATUS BAR
   ============================================================ */
function renderStatusBar(){
  const sb = $('#statusbar'); sb.innerHTML='';

  // Project-scoped status bar when a workspace is active.
  if(viewMode==='workspace' && activeProjectId){
    const p = byId(activeProjectId);
    const hint = el('div','sb grow','Ctrl+Tab returns to the Project Browser.  F1 for help.'); sb.appendChild(hint);
    const a = el('div','sb attn'); a.style.width='158px';
    a.innerHTML = p.alert ? `${ICON.warn}<span>1 needs attention</span>` : `<span>No attention flags</span>`;
    if(p.alert && p.alert.section){ a.addEventListener('click', ()=>setSection(p.id, p.alert.section)); } else { a.style.cursor='default'; a.style.fontWeight='normal'; }
    sb.appendChild(a);
    const stg = el('div','sb'); stg.style.width='206px';
    stg.textContent = `${isHold(p)?'On Hold':p.stage} · ${p.status} · ${money(p.value)}`;
    sb.appendChild(stg);
    const usr = el('div','sb'); usr.style.width='86px'; usr.textContent=state.user; sb.appendChild(usr);
    const dt = el('div','sb'); dt.style.flex='1'; dt.textContent=nowStamp(); sb.appendChild(dt);
    return;
  }

  const list = visibleProjects();
  const attn = state.projects.filter(hasAlert).length;
  const active = state.projects.filter(isActive);
  const scopeValue = list.reduce((s,p)=>s+(p.value||0),0);
  const sel = selectedProject();

  const hint = el('div','sb grow', sel ? esc(`${sel.id}  ${sel.title}`) : 'Double-click a project to open it.  Press F1 for help.');
  sb.appendChild(hint);

  const a = el('div','sb attn'); a.style.width='158px';
  a.innerHTML = `${ICON.warn}<span>${attn} need attention</span>`;
  a.title = 'Show projects needing attention';
  a.addEventListener('click', ()=>setScope({type:'attention'}));
  sb.appendChild(a);

  const counts = el('div','sb'); counts.style.width='142px';
  counts.textContent = `${state.projects.length} projects · ${active.length} active`;
  sb.appendChild(counts);

  const val = el('div','sb'); val.style.width='200px';
  val.textContent = `View value: ${money(scopeValue)}`;
  sb.appendChild(val);

  const usr = el('div','sb'); usr.style.width='80px'; usr.textContent=state.user; sb.appendChild(usr);
  const dt = el('div','sb'); dt.style.width='130px'; dt.textContent=nowStamp(); sb.appendChild(dt);
}
function nowStamp(){
  const d=new Date();
  let h=d.getHours(), ap=h>=12?'PM':'AM'; h=h%12||12;
  const mm=String(d.getMinutes()).padStart(2,'0');
  return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()} ${h}:${mm} ${ap}`;
}

/* ============================================================
   RENDER ORCHESTRATION
   ============================================================ */
function render(){
  buildTree();
  buildMenuBar();
  buildToolbar();
  renderList();
  renderStatusBar();
  if(viewMode==='workspace' && activeProjectId) renderWorkspace();
  renderFrameChrome();
}

/* ---------- selection helpers ---------- */
function byId(id){ return state.projects.find(p=>p.id===id); }
function selectedProject(){ return state.selectedId? byId(state.selectedId): null; }
function short(s,n=26){ s=String(s||''); return s.length>n? s.slice(0,n-1)+'…' : s; }

/* ---------- alert recomputation (simplified rules) ---------- */
function recalcAlerts(){
  // Keep existing manually-cleared state; only ensure alerts are consistent
  // with stage changes for the obvious cases. Full rules arrive with later sheets.
  state.projects.forEach(p=>{
    if(p.stage==='Contracting' && p.status==='Accepted' && !p.alert)
      p.alert={kind:'PO missing', detail:'Estimate accepted, no PO filed', age:0};
  });
}

/* ============================================================
   PROJECT WORKSPACE (Screen 03) + MDI window model
   ============================================================ */
let viewMode = 'browser';       // 'browser' | 'workspace'
let openProjects = [];          // ids currently open as workspaces (order opened)
let activeProjectId = null;     // id of the active workspace
let navList = [];               // ids the prev/next arrows step through
let uiSection = {};             // {projectId: sectionKey}

/* section icons */
const SEC_ICON = {
  win:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M2 1h12v14H2z"/><path fill="#fff" d="M3 2h10v12H3z"/><path fill="#0a246a" d="M4 3h8v3H4z"/><path fill="#808080" d="M4 8h8v1H4zM4 10h8v1H4zM4 12h6v1H4z"/></svg>',
  card:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M2 2h12v12H2z"/><path fill="#fff" d="M3 3h10v10H3z"/><path fill="#0a246a" d="M5 5h6v2H5z"/><path fill="#808080" d="M5 8h6v1H5zM5 10h4v1H5z"/></svg>',
  check:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M2 2h12v12H2z"/><path fill="#fff" d="M3 3h10v10H3z"/><path fill="#008000" d="M7 11L4 8l1.4-1.4L7 8.2l4-4L12.4 5.6z"/></svg>',
  docR:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M3 1h7l3 3v11H3z"/><path fill="#fff" d="M4 2h5v3h3v9H4z"/><path fill="#c00000" d="M5 10h6v3H5z"/></svg>',
  docG:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M3 1h7l3 3v11H3z"/><path fill="#fff" d="M4 2h5v3h3v9H4z"/><path fill="#008000" d="M5 10h6v3H5z"/></svg>',
  truck:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 4h9v7H1z"/><path fill="#b5651d" d="M2 5h7v5H2z"/><path fill="#000" d="M10 6h3l2 2v3h-5z"/><path fill="#c0c0c0" d="M11 7h2v2h-2z"/><path fill="#000" d="M3 11h3v3H3zM11 11h3v3h-3z"/></svg>',
  folder:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 3h5l1 1h8v10H1z"/><path fill="#ffcc66" d="M2 4h4l1 1h7v8H2z"/></svg>',
  photo:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 3h14v10H1z"/><path fill="#a6caf0" d="M2 4h12v8H2z"/><path fill="#008000" d="M2 10l3-3 3 3 2-2 4 4H2z"/><path fill="#ffd800" d="M11 5h2v2h-2z"/></svg>',
  flag:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M4 1h2v14H4z"/><path fill="#008000" d="M6 2h8l-2 3 2 3H6z"/></svg>',
  records:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M3 1h10v14H3z"/><path fill="#fff" d="M4 2h8v12H4z"/><path fill="#808080" d="M5 4h6v1H5zM5 6h6v1H5zM5 8h6v1H5zM5 10h4v1H5z"/></svg>',
  log:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 2h14v13H1z"/><path fill="#fff" d="M2 6h12v8H2z"/><path fill="#800000" d="M2 3h12v3H2z"/><path fill="#808080" d="M4 8h2v2H4zM7 8h2v2H7zM10 8h2v2h-2z"/></svg>',
  grid:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M3 1h10v14H3z"/><path fill="#fff" d="M4 2h8v4H4z"/><path fill="#808080" d="M4 7h2v2H4zM7 7h2v2H7zM10 7h2v2h-2zM4 10h2v2H4zM7 10h2v2H7zM10 10h2v2h-2z"/><path fill="#008000" d="M10 10h2v2h-2z"/></svg>'
};
const CHK_GREEN = '<svg width="9" height="8" viewBox="0 0 11 9" style="shape-rendering:crispEdges"><path fill="#008000" d="M4 9L0 5l1.5-1.5L4 6 9.5 0.5 11 2z"/></svg>';
const GL_RESTORE = '<svg width="9" height="8" viewBox="0 0 9 8" style="shape-rendering:crispEdges"><path fill="#000" d="M0 2h6v6H0z"/><path fill="#d4d0c8" d="M1 4h4v3H1z"/><path fill="#000" d="M3 0h6v6H7V2H3z"/></svg>';

/* ---------- data enrichment for light projects ---------- */
function fmtCreated(s){
  if(!s) return '—';
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if(m) return `${m[2]}/${m[3]}/${m[1].slice(2)}`;
  return s;
}
function shortToday(){ const d=new Date(); return `${d.getMonth()+1}/${d.getDate()}`; }

function enrichProject(p){
  if(p.contact===undefined) p.contact=null;
  if(p.po===undefined) p.po=null;
  if(p.ws) return p;
  p.ws = deriveWs(p);
  return p;
}
function deriveWs(p){
  const idx = STAGES.indexOf(p.stage);
  const milestones = [{label:'Project created', date:fmtCreated(p.created), done:true}];
  STAGES.slice(1, Math.max(1,idx+1)).forEach(s=> milestones.push({label:'Entered '+s, date:null, done:true}));
  milestones.push({label:`Current — ${p.status}`, date:p.next||null, done:false, flag:hasAlert(p)});
  const activity = [];
  activity.push({date:'', text:`Now ${isHold(p)?'On Hold':p.stage} · ${p.status}`});
  activity.push({date:'', text:'Project created'});
  let billed=null, paid=null;
  if(isClosed(p) && !isCancelled(p)){ billed=p.value; paid=p.value; }
  else if(p.status==='Awaiting Payment' || p.status==='Billed'){ billed=p.value; }

  // Light-derived money documents for the non-showcase projects.
  const si = STAGES.indexOf(p.stage);
  const accepted = si >= STAGES.indexOf('Contracting') && !isCancelled(p);
  const sent = p.stage==='Estimating' && /Sent/i.test(p.status);
  const estimates = [];
  if(accepted){
    estimates.push({ id:p.id+'A0', kind:'version', date:fmtCreated(p.created), amount:p.value,
      status:'ACCEPTED', accepted:true, acceptedDate:fmtCreated(p.created), file:p.id+'A0.pdf', uploaded:fmtCreated(p.created) });
  } else if(sent){
    estimates.push({ id:p.id+'A0', kind:'version', date:p.next||fmtCreated(p.created), amount:p.value,
      status:'Sent — awaiting response', sent:true, file:p.id+'A0.pdf', uploaded:p.next||fmtCreated(p.created) });
  }
  const pos = [];
  if(p.po && (si >= STAGES.indexOf('Procurement'))){
    pos.push({ number:p.po, received:fmtCreated(p.created), amount:p.value, answers:p.id+'A0',
      status:'Active', active:true, file:p.po+'.pdf', uploaded:fmtCreated(p.created) });
  }
  return {
    originalValue: accepted? p.value : null, originalRef:'accepted estimate',
    changeOrders:[], poAmount:(pos.length?p.value:null), poNote:'', billed, paid,
    estimates, pos,
    tasks:[], milestones, activity, documents:[], photos:[],
    note: p.notes ? {text:p.notes, by:state.user, entered:fmtCreated(p.created), edited:null} : null,
    counts:{}
  };
}
/* current value = accepted base + approved, non-absorbed change orders */
function recomputeValue(p){
  const w=p.ws; if(!w || w.originalValue==null) return;
  const add=(w.changeOrders||[]).filter(c=>c.status==='Approved' && !c.absorbed).reduce((s,c)=>s+c.amount,0);
  p.value = w.originalValue + add;
}
function acceptedEstimate(p){ return (p.ws.estimates||[]).find(e=>e.accepted); }

/* ---------- navigation between browser / workspaces ---------- */
function openProject(id){
  const p = byId(id); if(!p) return;
  enrichProject(p);
  state.selectedId = id;
  state.recent = [id, ...state.recent.filter(x=>x!==id)].slice(0,10);
  if(!openProjects.includes(id)) openProjects.push(id);
  navList = visibleProjects().map(x=>x.id);
  if(!navList.includes(id)) navList = [...navList, id];
  if(!uiSection[id]) uiSection[id]='Overview';
  activeProjectId = id; viewMode = 'workspace';
  saveState();
  render();
}
function activateProject(id){
  if(!byId(id)) return;
  if(!openProjects.includes(id)) openProjects.push(id);
  activeProjectId=id; viewMode='workspace'; state.selectedId=id;
  if(!uiSection[id]) uiSection[id]='Overview';
  render();
}
function exitToBrowser(){ viewMode='browser'; activeProjectId=null; render(); }
function closeProjectWindow(id){
  openProjects = openProjects.filter(x=>x!==id);
  delete uiSection[id];
  if(activeProjectId===id){
    activeProjectId = openProjects.length? openProjects[openProjects.length-1] : null;
    viewMode = activeProjectId? 'workspace':'browser';
  }
  render();
}
function closeAllProjects(){ openProjects=[]; uiSection={}; activeProjectId=null; viewMode='browser'; render(); }
function nextWindow(){
  const order = ['browser', ...openProjects];
  const curr = viewMode==='workspace'? activeProjectId : 'browser';
  const nxt = order[(order.indexOf(curr)+1) % order.length];
  if(nxt==='browser') exitToBrowser(); else activateProject(nxt);
}
function setSection(pid, key){ uiSection[pid]=key; renderWorkspace(); }
function sectionStep(delta){
  const flat=[]; SECTION_GROUPS.forEach(g=>g.items.forEach(it=>flat.push(it.key)));
  const cur = uiSection[activeProjectId]||'Overview';
  let i = flat.indexOf(cur); i = (i+delta+flat.length)%flat.length;
  setSection(activeProjectId, flat[i]);
}
function navStep(delta){
  if(!navList.length) return;
  const i = navList.indexOf(activeProjectId);
  if(i<0) return;
  const j = i+delta;
  if(j<0 || j>=navList.length) return;
  const id = navList[j];
  enrichProject(byId(id));
  if(!openProjects.includes(id)) openProjects.push(id);
  state.recent = [id, ...state.recent.filter(x=>x!==id)].slice(0,10);
  if(!uiSection[id]) uiSection[id]='Overview';
  activeProjectId=id; viewMode='workspace'; state.selectedId=id;
  saveState(); render();
}

/* ---------- frame chrome swap ---------- */
function renderFrameChrome(){
  const inWs = viewMode==='workspace' && activeProjectId;
  const p = inWs ? byId(activeProjectId) : null;
  $('#active-child').textContent = inWs ? `[${p.id} ${p.title}]` : '[Project Browser]';
  $('#filterband').style.display = inWs ? 'none' : '';
  $('#win-browser').style.display = inWs ? 'none' : '';
  // remove the workspace node when back on the browser
  const wsNode = $('#workspace');
  if(!inWs && wsNode) wsNode.remove();
  // menu-bar window controls for the maximized child
  let ctl = $('#menubar-winctl');
  if(inWs){
    if(!ctl){
      ctl = el('div','menubar-winctl'); ctl.id='menubar-winctl';
      ctl.innerHTML = `<button class="tb-btn" data-role="mb-restore" title="Restore project">${GL_RESTORE}</button>`+
                      `<button class="tb-btn tb-close" data-role="mb-close" title="Close project (Ctrl+F4)"><i class="gl-close"></i></button>`;
      $('#menubar').appendChild(ctl);
      ctl.querySelector('[data-role="mb-restore"]').addEventListener('click', exitToBrowser);
      ctl.querySelector('[data-role="mb-close"]').addEventListener('click', ()=>closeProjectWindow(activeProjectId));
    }
  } else if(ctl){ ctl.remove(); }
}

/* ---------- project toolbar ---------- */
function buildProjectToolbar(){
  const tb=$('#toolbar'); tb.innerHTML='';
  const add=(html,title,action)=>{ const b=el('div','tool',html); b.title=title; b.addEventListener('mouseup',()=>action&&action()); tb.appendChild(b); };
  add('<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#008000" d="M14 6H6V4L2 7l4 3V8h8z"/></svg><span>Project Browser</span>','Back to Project Browser (Ctrl+Tab)', exitToBrowser);
  tb.appendChild(el('div','tsep'));
  add(SEC_ICON.docR+'<span>New Estimate</span>','Create a new estimate', ()=>newEstimateFor(byId(activeProjectId)));
  add(TB.upload+'<span>Upload Document</span>','Upload a document', ()=>openUploadDoc(byId(activeProjectId)));
  add('<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M1 3h14v10H1z"/><path fill="#a6caf0" d="M2 4h12v8H2z"/><path fill="#008000" d="M2 10l3-3 3 3 2-2 4 4H2z"/><path fill="#ffd800" d="M11 5h2v2h-2z"/></svg><span>Upload Photos</span>','Upload photos', ()=>openUploadPhotos(byId(activeProjectId)));
  tb.appendChild(el('div','tsep'));
  add(SEC_ICON.check+'<span>New Task</span>','Add a task', ()=>openNewTask(byId(activeProjectId)));
  const setStatusBtn = el('div','tool','<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000080" d="M2 3h12v4H2z"/><path fill="#808080" d="M2 9h12v1H2zM2 11h9v1H2z"/></svg><span>Set Status</span>');
  setStatusBtn.title='Set status'; setStatusBtn.addEventListener('mouseup',()=>{ const p=byId(activeProjectId); openStagePopup(p, p.stage, setStatusBtn); });
  tb.appendChild(setStatusBtn);
  tb.appendChild(el('div','tsep'));
  add(TB.print,'Export section', ()=>{ const p=byId(activeProjectId); const sec=uiSection[p.id]||'Overview'; exportText(`${p.id} — ${findSection(sec).label}`, sectionExport(p,sec)); });
  tb.appendChild(el('span',null,'')).style.flex='1';
  // prev / next in the list
  const i = navList.indexOf(activeProjectId);
  const prev = el('div','tool-arrow'+(i<=0?' disabled':''),'<svg width="8" height="10" viewBox="0 0 8 10" style="shape-rendering:crispEdges"><path fill="#000" d="M8 0v10L1 5z"/></svg>');
  prev.title='Previous project in list'; if(i>0) prev.addEventListener('mouseup',()=>navStep(-1));
  const next = el('div','tool-arrow'+(i<0||i>=navList.length-1?' disabled':''),'<svg width="8" height="10" viewBox="0 0 8 10" style="shape-rendering:crispEdges"><path fill="#000" d="M0 0v10l7-5z"/></svg>');
  next.title='Next project in list'; if(i>=0&&i<navList.length-1) next.addEventListener('mouseup',()=>navStep(1));
  tb.appendChild(prev); tb.appendChild(next);
  tb.appendChild(el('div','tool-caption', i>=0? `${i+1} of ${navList.length} in list` : ''));
}

/* ---------- workspace render ---------- */
function renderWorkspace(){
  const p = byId(activeProjectId); if(!p) return;
  enrichProject(p);
  const sec = uiSection[p.id] || 'Overview';
  let node = $('#workspace'); if(node) node.remove();
  node = el('div','workspace'); node.id='workspace';
  node.innerHTML = identityBandHTML(p) + stageStripHTML(p) + attnLineHTML(p) +
    `<div class="ws-body">${secListHTML(p,sec)}<div class="ws-split"></div>${paneHTML(p,sec)}</div>`;
  $('#mdi').appendChild(node);
  wireWorkspace(node, p);
}

function identityBandHTML(p){
  const contact = p.contact ? `${esc(p.contact.name)}, ${esc(p.contact.role)} · ${esc(p.contact.phone)}` : '—';
  const site = [p.address, locOf(p), p.zip].filter(Boolean).join(', ') || '—';
  return `<div class="ws-identity">
    <div class="ws-id-left">
      <div class="ws-id-title"><span class="pid">${esc(p.id)}</span><span class="ptitle">${esc(p.title)}</span></div>
      <div class="ws-id-facts">
        <span><span class="k">Customer </span>${esc(p.customer)}</span>
        <span><span class="k">Contact </span>${contact}</span>
        <span><span class="k">Site </span>${esc(site)}</span>
      </div>
    </div>
    <div class="ws-id-right">
      <div class="ws-id-value"><span class="k">Current value</span><span class="v">${money(p.value)}</span></div>
      <div class="row2">
        <span><span class="k">PO </span>${esc(p.po||'—')}</span>
        <span><span class="k">Created </span>${esc(fmtCreated(p.created))}</span>
        <span><span class="k">Next </span>${esc(dash(p.next))}</span>
      </div>
    </div>
  </div>`;
}
function stageStripHTML(p){
  const idx = STAGES.indexOf(p.stage);
  const cells = STAGES.map((s,i)=>{
    if(i<idx) return `<div class="cell" data-stage="${esc(s)}">${CHK_GREEN}${esc(s)}</div>`;
    if(i===idx){ const lbl = isHold(p)?'On Hold':(isCancelled(p)?'Cancelled':p.status); return `<div class="cell current" data-stage="${esc(s)}">${hasAlert(p)?ICON.warn:''}${esc(s)} — ${esc(lbl)}</div>`; }
    return `<div class="cell future" data-stage="${esc(s)}">${esc(s)}</div>`;
  }).join('');
  return `<div class="ws-stage">${cells}</div>`;
}
function attnLineHTML(p){
  if(!p.alert) return '';
  const go = p.alert.section ? `<div class="goto" data-goto="${esc(p.alert.section)}">Go to ${esc(p.alert.section)}</div>` : '';
  return `<div class="ws-attn">${ICON.warn}<b>${esc(p.alert.kind)}</b><span style="color:#404040">|</span><span class="msg">${esc(p.alert.detail||'')}</span>${go}</div>`;
}
function findSection(key){ let f=null; SECTION_GROUPS.forEach(g=>g.items.forEach(it=>{ if(it.key===key) f=it; })); return f||{key,label:key}; }
function sectionCount(p,it){
  const w=p.ws;
  if(it.key==='Estimates')    return (w.estimates && w.estimates.length) || null;
  if(it.key==='POs')          return (w.pos && w.pos.filter(x=>!x.expected).length) || null;
  if(it.key==='ChangeOrders') return (w.changeOrders && w.changeOrders.length) || null;
  if(it.key==='Shipping')     return (w.shipping && w.shipping.shipments.length) || null;
  if(it.key==='Photos')       return (w.photoAlbum && w.photoAlbum.categories.reduce((s,c)=>s+c.count,0)+ (w.photoAlbum.uncategorised||0)) || null;
  if(it.key==='Documents')    return (w.docs && w.docs.files.length) || null;
  if(it.key==='Records')      return (w.records && w.records.items.length) || null;
  if(it.count==='tasksOpen'){ const n=(w.tasks||[]).filter(t=>!t.done).length; return n>0?n:null; }
  if(!it.count) return null;
  const c=w.counts||{}; return (c[it.count]!=null)?c[it.count]:null;
}
function secListHTML(p, sec){
  let html='<div class="ws-seclist">';
  SECTION_GROUPS.forEach(g=>{
    if(g.group) html+=`<div class="sec-group"><span>${esc(g.group)}</span><div class="line"></div></div>`;
    g.items.forEach(it=>{
      const cnt=sectionCount(p,it);
      html+=`<div class="sec${it.key===sec?' sel':''}" data-sec="${it.key}"><span class="tico">${SEC_ICON[it.icon]||SEC_ICON.docR}</span><span>${esc(it.label)}</span>${cnt!=null?`<span class="c">&nbsp;(${cnt}${esc(it.countSuffix||'')})</span>`:''}</div>`;
    });
  });
  return html+'</div>';
}
function paneHTML(p, sec){
  const item = findSection(sec);
  if(sec==='CostBreakdown') return docPane(item, costHead(p), costBody(p));
  if(sec==='Estimates')    return docPane(item, estimatesHead(p), estimatesBody(p));
  if(sec==='POs')          return docPane(item, posHead(p), posBody(p));
  if(sec==='ChangeOrders') return docPane(item, changeOrdersHead(p), changeOrdersBody(p));
  if(sec==='Shipping')   return docPane(item, shippingHead(p), shippingBody(p));
  if(sec==='Photos')     return docPane(item, photosHead(p), photosBody(p));
  if(sec==='Site')       return docPane(item, siteHead(p), siteBody(p));
  if(sec==='Progress')   return docPane(item, progressHead(p), progressBody(p));
  if(sec==='Completion') return docPane(item, completionHead(p), completionBody(p));
  if(sec==='Documents')  return docPane(item, documentsHead(p), documentsBody(p));
  if(sec==='Records')    return docPane(item, recordsHead(p), recordsBody(p));
  if(sec==='Tasks')      return docPane(item, tasksHead(p), tasksBody(p));
  if(sec==='Activity')   return docPane(item, activityHead(p), activityBody(p));
  if(sec==='Billing')    return docPane(item, billingHead(p), billingBody(p));
  if(sec==='Customer')   return docPane(item, customerHead(p), customerBody(p));
  const head = `<div class="ws-pane-head"><span class="ttl">${esc(item.label)}</span>${(sec==='Overview'&&p.lastChange)?`<span class="meta">Last change ${esc(p.lastChange)} by ${esc(state.user)}</span>`:''}</div>`;
  const body = sec==='Overview' ? overviewBodyHTML(p) : stubBodyHTML(item);
  return `<div class="ws-pane">${head}<div class="ws-pane-body">${body}</div></div>`;
}
/* pane wrapper with a subtitle + right-aligned fact in the head */
function docPane(item, headBits, bodyHTML){
  const head = `<div class="ws-pane-head"><span class="ttl">${esc(item.label)}</span>`+
    (headBits.subtitle?`<span class="meta" style="margin-left:0">— ${esc(headBits.subtitle)}</span>`:'')+
    `<span style="flex:1"></span>`+
    (headBits.right?`<span class="meta">${esc(headBits.right)}</span>`:'')+`</div>`;
  return `<div class="ws-pane">${head}<div class="ws-pane-body" style="display:flex;flex-direction:column">${bodyHTML}</div></div>`;
}

/* selection within a document section: uiSel["<pid>|<sec>"] = index */
let uiSel = {};
function selKey(p,sec){ return p.id+'|'+sec; }
function getSel(p,sec,def){ const k=selKey(p,sec); return uiSel[k]!=null?uiSel[k]:def; }
function setSel(p,sec,i){ uiSel[selKey(p,sec)]=i; renderWorkspace(); }

/* ---------- date helpers ---------- */
function fmtToday(){ const d=new Date(),p=n=>String(n).padStart(2,'0'); return `${p(d.getMonth()+1)}/${p(d.getDate())}/${String(d.getFullYear()).slice(2)}`; }
function parseMMDDYY(s){ const m=/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(s||''); if(!m) return null; let y=+m[3]; if(y<100) y+=2000; return new Date(y,+m[1]-1,+m[2]); }
function plusDays(s,days){ const t=parseMMDDYY(s)||new Date(); t.setDate(t.getDate()+days); const p=n=>String(n).padStart(2,'0'); return `${p(t.getMonth()+1)}/${p(t.getDate())}/${String(t.getFullYear()).slice(2)}`; }

/* ---------- shared section widgets ---------- */
const DSCROLL = `<div class="dscroll"><div class="btn">${ICON.up}</div><div class="track"></div><div class="btn">${ICON.down}</div></div>`;
function docListHTML(cols, rows, selIdx){
  const gtc = cols.map(c=>c.w).join(' ');
  const head = `<div class="dhead" style="grid-template-columns:${gtc}">`+
    cols.map(c=>`<div class="col${c.cls==='num'?' num':''}">${esc(c.label||'')}</div>`).join('')+`</div>`;
  const body = rows.map((r,i)=>{
    const cls='drow'+(i===selIdx?' sel':'')+(r.ghost?' ghost':'')+(r.accepted?' accepted':'');
    const cells = cols.map((c,ci)=>{ const cell=r.cells[ci]||{}; return `<div class="c${c.cls==='num'?' num':''}${cell.center?' center':''}">${cell.html!=null?cell.html:esc(cell.text||'')}</div>`; }).join('');
    return `<div class="${cls}" data-drow="${i}" style="grid-template-columns:${gtc}">${cells}</div>`;
  }).join('');
  return `<div class="dlist"><div class="dlist-inner">${head}${body}<div style="flex:1"></div></div>${DSCROLL}</div>`;
}
function actionColHTML(items){
  return `<div class="dactions">`+items.map(it=>{
    if(it.sep) return `<div class="dact-sep"></div>`;
    return `<div class="dbtn${it.default?' default':''}${it.disabled?' disabled':''}" ${it.disabled?'':`data-dact="${it.act}"`}>${it.default?`<span>${esc(it.label)}</span>`:esc(it.label)}</div>`;
  }).join('')+`</div>`;
}
function thumbHTML(caption, btnLabel){
  const lines=['70% 7 dk','44% 4','','86% 3','92% 3','78% 3','90% 3','64% 3','88% 3','82% 3'].map(s=>{
    if(!s) return `<div style="height:8px"></div>`; const [w,h,dk]=s.split(' ');
    return `<div class="sk${dk?' dk':''}" style="width:${w};height:${h}px"></div>`;
  }).join('');
  return `<div class="dthumb"><div class="page" style="flex:1;min-height:0">${lines}<div style="flex:1"></div><div class="sk dk" style="width:38%;height:5px;align-self:flex-end"></div></div>`+
    `<div class="cap">${esc(caption)}</div><div class="dbtn default" data-dact="viewer" style="width:150px"><span>${esc(btnLabel||'Open in Viewer')}</span></div></div>`;
}
function fieldsHTML(rows, labelW){
  return rows.filter(Boolean).map(r=> r.hr ? `<div class="dfield-hr"></div>` :
    `<div class="dfield" style="grid-template-columns:${labelW}px minmax(0,1fr)"><div class="k">${esc(r.k)}</div><div class="v">${r.html!=null?r.html:esc(r.v||'')}</div></div>`).join('');
}
function detailBoxHTML(legend, height, fieldsRows, labelW, btns, thumbCaption, thumbBtn){
  const btnHTML = btns&&btns.length ? `<div class="dfield-hr"></div><div class="dfield-btns">${btns.map(b=>`<div class="mbtn" data-dact="${b.act}">${esc(b.label)}</div>`).join('')}</div>` : '';
  return `<div class="ddetail" style="height:${height}px"><span class="legend">${esc(legend)}</span>`+
    `<div class="ddetail-body"><div class="dfields">${fieldsHTML(fieldsRows,labelW)}${btnHTML}</div>${thumbHTML(thumbCaption, thumbBtn)}</div></div>`;
}
const WARN_SM = ICON.warn, CHK = CHK_GREEN;

/* ---------- ESTIMATES ---------- */
function estimatesHead(p){
  const es=p.ws.estimates||[]; const versions=new Set(es.map(e=>{const m=/([A-Z])\d/.exec(e.id.replace(p.id,''));return m?m[1]:'';})).size;
  const acc=acceptedEstimate(p); const newest=es[es.length-1];
  return { subtitle:`${versions} version${versions===1?'':'s'}, ${es.length} document${es.length===1?'':'s'}${newest?`, newest ${newest.id}`:''}`,
    right: acc?`Accepted: ${acc.id}, ${money(acc.amount)} on ${acc.acceptedDate||'—'}`:'No estimate accepted' };
}
function estimatesBody(p){
  const es=p.ws.estimates||[];
  const cols=[{label:'',w:'20px'},{label:'Estimate ID',w:'116px'},{label:'Date',w:'68px'},{label:'Amount',w:'84px',cls:'num'},{label:'Status',w:'minmax(0,1fr)'},{label:'File',w:'128px'},{label:'Uploaded',w:'74px'}];
  const rows=es.map(e=>({ accepted:!!e.accepted, ghost:/Superseded/i.test(e.status)&&!e.accepted,
    cells:[ {html:e.accepted?`<span style="display:flex;align-items:center;justify-content:center">${CHK}</span>`:'',center:true},
      {text:e.id},{text:e.date},{text:money(e.amount),cls:'num'},{text:e.status},{text:e.file},{text:e.uploaded} ] }));
  const sel=getSel(p,'Estimates',Math.max(0,es.length-1));
  const e=es[sel]||{};
  const acc=acceptedEstimate(p);
  const list=docListHTML(cols,rows,sel);
  const actions=actionColHTML([
    {label:'Upload Estimate…',act:'upload-estimate'},{label:'Upload Revision…',act:'upload-revision'},{sep:1},
    {label:'Open',default:1,act:'open'},{label:'Print…',act:'print'},{label:'Save a Copy…',act:'save'},{sep:1},
    {label:'Mark Accepted…',act:'mark-accepted',disabled:!!e.accepted},{label:'Remove…',act:'remove'}
  ]);
  const statusShort = e.accepted?'accepted':(e.sent?'sent, awaiting response':(/Superseded/i.test(e.status||'')?'superseded':'on file'));
  const fields=[ {k:'Estimate ID',v:`${e.id||''}${e.kind?` — ${e.kind==='revision'?'revision issued after the PO':e.kind==='rendition'?'a re-issue of the prior version':'a distinct offer'}`:''}`},
    {k:'Amount',v:money(e.amount)},
    e.prepared&&{k:'Prepared',v:e.prepared},
    e.sentTo&&{k:'Sent',v:`${e.sentDate||''}${e.sentDate?' to ':''}${e.sentTo}`},
    {k:'Status',v:e.status},
    e.purpose&&{k:'Purpose',v:e.purpose},
    e.supersedes&&{k:'Supersedes',v:e.supersedes},
    {k:'File',v:`${e.file||'—'}${e.pages?` · ${e.pages} pages`:''}${e.sizeKB?` · ${e.sizeKB} KB`:''}${e.origName?` · uploaded as “${e.origName}”`:''}`},
    e.uploaded&&{k:'Uploaded',v:e.uploaded},
    e.record&&{k:'Record',v:e.record} ];
  const dbtns=[{label:'Mark Accepted…',act:'mark-accepted'},{label:'Upload Revision…',act:'upload-revision'},{label:'Resend…',act:'resend'}];
  const detail=detailBoxHTML(`${e.id||''} — ${statusShort}`,290,fields,76,dbtns,`Page 1 of ${e.pages||1} — double-click to open`,'Open in Viewer');
  const coAdd=(p.ws.changeOrders||[]).filter(c=>c.status==='Approved').reduce((s,c)=>s+c.amount,0);
  const summary=`<div class="dsummary"><span>${es.length} estimate document${es.length===1?'':'s'}</span><span class="sep">|</span>`+
    (acc?`<span>Accepted <b>${esc(acc.id)}</b> · ${money(acc.amount)} on ${esc(acc.acceptedDate||'—')}</span><span class="sep">|</span>`:'')+
    (coAdd?`<span>Change orders ${signedMoney(coAdd)}</span><span class="sep">|</span>`:'')+
    `<span>Current project value <b>${money(p.value)}</b></span><span class="grow"></span>`+
    `<div class="mbtn" data-dact="change-orders">Change Orders</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${list}${actions}</div>${detail}${summary}</div>`;
}

/* ---------- PURCHASE ORDERS ---------- */
function posHead(p){
  const active=(p.ws.pos||[]).find(x=>x.active);
  return { subtitle:'customer authorisation to work', right: active?`Covered ${money(active.amount)} of ${money(p.value)}`:'No PO on file' };
}
function posBody(p){
  const pos=p.ws.pos||[];
  const cols=[{label:'',w:'20px'},{label:'PO Number',w:'104px'},{label:'Received',w:'64px'},{label:'Amount',w:'78px',cls:'num'},{label:'Answers',w:'118px'},{label:'Status',w:'minmax(0,1fr)'},{label:'File',w:'104px'}];
  const rows=pos.map(o=>({ accepted:!!o.active, ghost:!!o.expected,
    cells:[ {html:o.active?`<span style="display:flex;align-items:center;justify-content:center">${CHK}</span>`:(o.expected?`<span style="display:flex;align-items:center;justify-content:center">${WARN_SM}</span>`:''),center:true},
      {text:o.number},{text:o.received||'—'},{text:o.expected?money(o.amount)+' exp.':money(o.amount),cls:'num'},{text:o.answers||''},{text:o.status},{text:o.file||'—'} ] }));
  const defIdx=Math.max(0,pos.findIndex(x=>x.active)); const sel=getSel(p,'POs',defIdx<0?0:defIdx);
  const o=pos[sel]||{};
  const list=docListHTML(cols,rows,sel);
  const actions=actionColHTML([
    {label:'Upload PO…',act:'upload-po'},{label:'Upload Revised PO…',act:'upload-revised-po'},{sep:1},
    {label:'Open',default:1,act:'open'},{label:'Print…',act:'print'},{label:'Save a Copy…',act:'save'},{sep:1},
    {label:'Record Request…',act:'record-request'},{label:'Remove…',act:'remove'}
  ]);
  const fields=[ {k:'PO number',v:`${o.number||''}${o.number?` · ${p.customer}`:''}`},
    o.received&&o.received!=='—'&&{k:'Received',v:`${o.received}${o.receivedBy?` by ${o.receivedBy}`:''}`},
    {k:'Amount',v:money(o.amount)},
    o.answers&&{k:'Answers',v:`${o.answers}${o.active&&acceptedEstimate(p)&&o.amount===acceptedEstimate(p).amount?', accepted — amounts agree':''}`},
    o.terms&&{k:'Terms',v:o.terms},
    o.deposit&&{k:'Deposit',v:`${money(o.deposit)}${o.depositReceived?` — received ${o.depositReceived}`:''}`},
    {k:'Status',v:o.statusDetail||o.status},
    o.file&&o.file!=='—'&&{k:'File',v:`${o.file}${o.pages?` · ${o.pages} pages`:''}${o.sizeKB?` · ${o.sizeKB} KB`:''}`},
    o.uploaded&&{k:'Uploaded',v:o.uploaded},
    o.note&&{k:'Note',v:o.note} ];
  const dbtns=[{label:'Upload Revised PO…',act:'upload-revised-po'},{label:'Record Request…',act:'record-request'},{label:'Terms…',act:'terms'}];
  const detail=detailBoxHTML(`${o.number||''} — ${o.active?'active':(o.expected?'expected':'on file')}`,290,fields,76,dbtns,`Page 1 of ${o.pages||1} — double-click to open`,'Open in Viewer');
  const active=pos.find(x=>x.active); const cover=active?active.amount:0; const shortBy=p.value-cover;
  const summary=`<div class="dsummary">`+(shortBy>0?WARN_SM:'')+`<span>PO coverage <b>${money(cover)}</b></span><span class="sep">|</span>`+
    `<span>Project value <b>${money(p.value)}</b></span><span class="sep">|</span>`+
    (shortBy>0?`<span><b>Short by ${money(shortBy)}</b></span>`:`<span><b>Fully covered</b></span>`)+
    `<span class="grow"></span><div class="mbtn" data-dact="change-orders">Change Orders</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${list}${actions}</div>${detail}${summary}</div>`;
}

/* ---------- CHANGE ORDERS ---------- */
function changeOrdersHead(p){
  const cos=p.ws.changeOrders||[]; const ap=cos.filter(c=>c.status==='Approved').length; const pd=cos.filter(c=>c.status==='Pending'||c.status==='Draft').length;
  return { subtitle:'scope and value changes after acceptance', right:`${ap} approved, ${pd} pending` };
}
function changeOrdersBody(p){
  const w=p.ws; const cos=w.changeOrders||[];
  // ledger
  let lg='';
  lg+=`<div class="lg"><div class="t">Original project value — ${esc(w.originalRef||'accepted estimate')}</div><div class="r">${money(w.originalValue)}</div></div>`;
  cos.filter(c=>c.status==='Approved'&&!c.absorbed).forEach(c=> lg+=`<div class="lg"><div class="t">&nbsp;&nbsp;&nbsp;Change Order ${c.n} — ${esc(c.description)}, approved ${esc(c.approvedDate||'')}</div><div class="r">${signedMoney(c.amount)}</div></div>`);
  lg+=`<div class="hr"></div><div class="lg bold"><div class="t">Current project value</div><div class="r"><span style="font-size:13px">${money(p.value)}</span></div></div>`;
  cos.filter(c=>c.status==='Pending'||c.status==='Draft').forEach(c=> lg+=`<div class="lg pending"><div class="t">Pending, not included — Change Order ${c.n}</div><div class="r">${signedMoney(c.amount)}</div></div>`);
  const apShown=cos.filter(c=>c.status==='Approved'&&!c.absorbed).length;
  const pdShown=cos.filter(c=>c.status==='Pending'||c.status==='Draft').length;
  const lgLines=1+apShown+1+pdShown;               // original + approved + current + pending
  const ledgerH = 30 + lgLines*18 + 10;            // padding + rows + hr slack
  const ledger=`<div class="ledger" style="height:${ledgerH}px"><span class="legend">Project value</span>${lg}</div>`;
  // list
  const cols=[{label:'',w:'20px'},{label:'CO',w:'44px'},{label:'Date',w:'64px'},{label:'Description',w:'minmax(0,1fr)'},{label:'Amount',w:'84px',cls:'num'},{label:'Status',w:'148px'},{label:'Document',w:'92px'}];
  const rows=cos.map(c=>({ accepted:c.status==='Approved',
    cells:[ {html:c.status==='Approved'?`<span style="display:flex;align-items:center;justify-content:center">${CHK}</span>`:((c.status==='Pending')?`<span style="display:flex;align-items:center;justify-content:center">${WARN_SM}</span>`:''),center:true},
      {text:String(c.n)},{text:c.date},{text:c.description},{text:signedMoney(c.amount),cls:'num'},
      {text:c.status==='Approved'?`Approved ${c.approvedDate||''}`:(c.status==='Pending'?'Pending approval':c.status)},{text:c.document||'—'} ] }));
  const sel=getSel(p,'ChangeOrders',Math.max(0,cos.length-1)); const c=cos[sel]||{};
  const list=docListHTML(cols,rows,sel);
  const actions=actionColHTML([
    {label:'Add Change Order…',act:'add-co'},{label:'Upload Document…',act:'upload-doc'},{sep:1},
    {label:'Open',default:1,act:'open'},{label:'Print…',act:'print'},{sep:1},
    {label:'Mark Approved…',act:'mark-approved',disabled:c.status==='Approved'},{label:'Mark Declined…',act:'mark-declined',disabled:c.status==='Approved'||c.status==='Declined'},{label:'Remove…',act:'remove'}
  ]);
  const fields=[ {k:'Description',v:c.description},
    c.reason&&{k:'Reason',v:c.reason},
    {k:'Amount',v:`${signedMoney(c.amount||0)}${(c.equipment!=null||c.labour!=null)?` — equipment ${money(Math.abs(c.equipment||0))}, labour ${money(Math.abs(c.labour||0))}`:''}`},
    c.requested&&{k:'Requested',v:c.requested},
    {k:'Status',v:c.status==='Approved'?`Approved ${c.approvedDate||''}`:c.status},
    c.effect&&{k:'Effect',v:c.effect},
    c.document&&{k:'Document',v:`${c.document}${c.pages?` · ${c.pages} page${c.pages===1?'':'s'}`:''}${c.sizeKB?` · ${c.sizeKB} KB`:''}`},
    c.absorbedInto&&{k:'Absorbed into',v:c.absorbedInto},
    c.note&&{k:'Note',v:c.note} ];
  const dbtns=[{label:'Mark Approved…',act:'mark-approved'},{label:'Mark Declined…',act:'mark-declined'},{label:'Upload Signed Copy…',act:'upload-signed'}];
  const detail=detailBoxHTML(`Change Order ${c.n||''} — ${(c.status||'').toLowerCase()==='approved'?'approved':(c.status||'').toLowerCase()}`,224,fields,88,dbtns,`${c.document||'—'}`,'Open in Viewer');
  return `<div class="docsec">${ledger}<div class="docsec-main">${list}${actions}</div>${detail}</div>`;
}

/* ---------- COST BREAKDOWNS (Screen 04a) — list of breakdowns ---------- */
function rateFmt(r){ return Number.isInteger(r)?'$'+r.toLocaleString('en-US'):'$'+Number(r).toFixed(2); }
function pctFmt(n){ return (Math.round(n*10)/10)+'%'; }
function groupTotal(g){ return (g.items||[]).filter(it=>it.convert!==false||it.noParent).reduce((s,it)=>s+(it.ext||0),0); }
function bdSubtotal(bd){ return (bd.groups||[]).reduce((s,g)=>s+groupTotal(g),0); }
function bdCompute(bd){
  const subtotal=bdSubtotal(bd);
  const contingency=Math.round(subtotal*(bd.contingencyPct||0)/100);
  const totalCost=subtotal+contingency;
  const m=bd.marginPct||0;
  const priceToQuote=m<100?Math.round(totalCost/(1-m/100)):totalCost;
  const margin=priceToQuote-totalCost;
  const nConvert=(bd.groups||[]).reduce((s,g)=>s+g.items.filter(it=>it.convert!==false).length,0);
  const nTotal=(bd.groups||[]).reduce((s,g)=>s+g.items.length,0);
  return {subtotal,contingency,totalCost,priceToQuote,margin,nConvert,nTotal};
}
function currentBreakdown(p){ const c=p.ws.cost; if(!c||!c.breakdowns.length) return null; return c.breakdowns.find(b=>b.id===c.current)||c.breakdowns[c.breakdowns.length-1]; }
function costHead(p){
  const c=p.ws.cost; if(!c||!c.breakdowns.length) return {subtitle:'internal costing', right:''};
  return {subtitle:'what the job costs us', right:`${c.breakdowns.length} on this project · double-click one to open it`};
}
function costBody(p){
  const c=p.ws.cost;
  if(!c||!c.breakdowns.length){
    const actions=actionColHTML([{label:'New…',act:'cost-new'},{label:'Load Template…',act:'cost-template'}]);
    return `<div class="docsec"><div class="docsec-main"><div class="dlist"><div class="dlist-inner">${emptyState('No cost breakdowns yet. New… starts one; the editor builds cost → margin → price.')}</div>${DSCROLL}</div>${actions}</div></div>`;
  }
  const cols=[{label:'',w:'20px'},{label:'Breakdown',w:'78px'},{label:'Dated',w:'68px'},{label:'Total cost',w:'86px',cls:'num'},{label:'At '+(currentBreakdown(p).marginPct||18)+'%',w:'88px',cls:'num'},{label:'Priced into',w:'minmax(0,1fr)'},{label:'Status',w:'96px'}];
  const curIdx=c.breakdowns.findIndex(b=>b.id===c.current);
  const sel=getSel(p,'CostBreakdown', curIdx<0?c.breakdowns.length-1:curIdx);
  const rows=c.breakdowns.map(bd=>{ const cc=bdCompute(bd); const isCur=bd.id===c.current;
    return { accepted:isCur,
      cells:[ {html:`<span style="display:flex;align-items:center;justify-content:center">${SEC_ICON.grid}</span>`,center:true},
        {text:bd.id},{text:bd.dated},{text:money(cc.totalCost),cls:'num'},{text:money(cc.priceToQuote),cls:'num'},{text:bd.pricedInto||'—'},{text:isCur?'CURRENT':bd.status} ] }; });
  const list=docListHTML(cols,rows,sel);
  const bd=c.breakdowns[sel]||currentBreakdown(p); const cc=bdCompute(bd);
  const actions=actionColHTML([
    {label:'Open',default:1,act:'cost-open'},{label:'New…',act:'cost-new'},{label:'Copy to New',act:'cost-copy'},{sep:1},
    {label:'Send to Estimate…',act:'cost-send-estimate'},{label:'Compare…',act:'cost-compare'},{label:'Print…',act:'print'},{sep:1},
    {label:'Make Current',act:'cost-make-current',disabled:bd.id===c.current},{label:'Remove…',act:'cost-remove-bd'}
  ]);
  // cost-to-price box for the selected breakdown
  let ctp='';
  bd.groups.forEach(g=>{ const gt=groupTotal(g); ctp+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 84px 52px"><div class="t">${esc(g.name)}</div><div class="r">${money(gt)}</div><div class="pct">${pctFmt(gt/cc.totalCost*100)}</div></div>`; });
  ctp+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 84px 52px"><div class="t">Contingency ${bd.contingencyPct}%</div><div class="r">${money(cc.contingency)}</div><div class="pct">${pctFmt(cc.contingency/cc.totalCost*100)}</div></div>`;
  ctp+=`<div class="hr"></div><div class="crow bold" style="grid-template-columns:minmax(0,1fr) 84px 52px"><div class="t">Total cost</div><div class="r">${money(cc.totalCost)}</div><div class="pct">100%</div></div>`;
  ctp+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 84px 52px"><div class="t">Margin at ${bd.marginPct}%</div><div class="r">+${money(cc.margin)}</div><div class="pct"></div></div>`;
  ctp+=`<div class="hr"></div><div class="crow bold" style="grid-template-columns:minmax(0,1fr) 84px 52px"><div class="t">Price to quote</div><div class="r" style="font-size:13px">${money(cc.priceToQuote)}</div><div class="pct"></div></div>`;
  const box1=`<div class="cbox" style="width:452px;flex:none"><span class="legend">${esc(bd.id)} — ${bd.id===c.current?'current, as built':'read-only'}</span>${ctp}<div style="flex:1"></div></div>`;
  // "what is in it" box
  const w2=(k,v)=>`<div class="crow" style="grid-template-columns:96px minmax(0,1fr)"><div class="t" style="color:#404040">${esc(k)}</div><div class="t">${esc(v)}</div></div>`;
  const box2=`<div class="cbox" style="flex:1;min-width:0"><span class="legend">What is in it</span>`+
    w2('Rows', `${cc.nTotal} — ${cc.nConvert} estimate lines, ${cc.nTotal-cc.nConvert} cost only`)+
    w2('Converts to', `${cc.nConvert} lines at ${money(cc.subtotal)}`)+
    w2('Copied from', bd.copiedFrom||'— started fresh')+
    (bd.changedSince?w2('Changed since', bd.changedSince):'')+
    w2('Priced into', bd.pricedInto||'— not yet sent')+
    `<div class="hr"></div><div class="note" style="color:#404040">${esc(bd.note||'')}</div><div style="flex:1"></div>`+
    `<div style="display:flex;gap:4px"><div class="wbtn" data-dact="cost-open" style="width:106px">Open in Editor</div><div class="wbtn" data-dact="cost-compare" style="width:112px">Compare…</div></div></div>`;
  const cur=currentBreakdown(p); const curc=bdCompute(cur);
  const summary=`<div class="dsummary"><span>${c.breakdowns.length} breakdowns</span><span class="sep">|</span><span>Current <b>${esc(cur.id)}</b> — ${money(curc.totalCost)} cost, ${money(curc.priceToQuote)} at ${cur.marginPct}%</span><span class="sep">|</span><span style="color:#404040">Internal — never leaves the office</span><span class="grow"></span><div class="mbtn" data-dact="cost-estimates">Estimates</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${list}${actions}</div><div class="costbtm">${box1}${box2}</div>${summary}</div>`;
}
function selectedBreakdown(p){ const c=p.ws.cost; if(!c) return null; const curIdx=c.breakdowns.findIndex(b=>b.id===c.current); return c.breakdowns[getSel(p,'CostBreakdown',curIdx<0?c.breakdowns.length-1:curIdx)]; }
/* ---------- COST BREAKDOWN EDITOR (Screen 04b, child window) ---------- */
let editState=null;   // { p, bd, sel:{gi,ii} }
function openFullWindow(html){ let ov=$('#childwin'); if(ov) ov.remove(); ov=el('div','frame'); ov.id='childwin'; ov.style.zIndex='700'; ov.innerHTML=html; document.body.appendChild(ov); return ov; }
function closeFullWindow(){ const ov=$('#childwin'); if(ov) ov.remove(); editState=null; viewState=null; }
function childTitleBar(icon, text){
  return `<div class="titlebar" style="-webkit-app-region:no-drag"><span class="ico">${icon}</span><span class="title-text">${esc(text)}</span><span class="spacer"></span>`+
    `<button class="tb-btn" disabled><i class="gl-min"></i></button><button class="tb-btn" disabled><i class="gl-max"></i></button><button class="tb-btn tb-close" data-eact="close"><i class="gl-close"></i></button></div>`;
}
function childMenuBar(items){ return `<div class="menubar">`+items.map(m=>`<div class="m">${m}</div>`).join('')+`</div><div class="rule"></div>`; }

function openCostEditor(p, bd){
  if(!bd){ return; }
  editState={p, bd, sel:{gi:0, ii:0}};
  // pick first real item
  for(let gi=0;gi<bd.groups.length;gi++){ if(bd.groups[gi].items.length){ editState.sel={gi,ii:0}; break; } }
  renderCostEditor();
}
const KIND_ICON = '<svg width="9" height="9" viewBox="0 0 9 9" style="shape-rendering:crispEdges"><rect x="0" y="0" width="9" height="9" fill="#fff" stroke="#808080"/><rect x="2" y="2" width="5" height="1" fill="#404040"/><rect x="2" y="4" width="5" height="1" fill="#404040"/><rect x="2" y="6" width="3" height="1" fill="#404040"/></svg>';
const EXP_TRI = '<svg width="8" height="8" viewBox="0 0 8 8" style="shape-rendering:crispEdges"><path fill="#000" d="M0 2h8L4 7z"/></svg>';
function num2(v){ return Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function renderCostEditor(){
  const {p,bd,sel}=editState; const cc=bdCompute(bd); const isCur=p.ws.cost.current===bd.id;
  const gtc='16px 24px minmax(0,1fr) 104px 46px 32px 82px 88px 30px 34px';
  let grid=`<div class="dhead" style="grid-template-columns:${gtc}"><div class="col"></div><div class="col"></div><div class="col">Item</div><div class="col">Group</div><div class="col num">Qty</div><div class="col" style="justify-content:center">U</div><div class="col num">Rate</div><div class="col num">Extended</div><div class="col" style="justify-content:center">Cv</div><div class="col" style="justify-content:center">Note</div></div>`;
  bd.groups.forEach((g,gi)=>{
    g.items.forEach((it,ii)=>{
      const isSel=sel.gi===gi&&sel.ii===ii; const conv=it.convert!==false; const fee=!!it.noParent; const working=!conv&&!fee;
      const nxt=g.items[ii+1]; const hasKids=it.flat&&nxt&&nxt.convert===false&&!nxt.noParent;
      const rowCol = working?(isSel?'#fff':'#505050') : (fee?(isSel?'#fff':'#808080'):'');
      const tag = (conv||fee) ? `<span class="ktag">${esc(g.name)}</span>` : '';
      const kmark = working||fee ? `<span class="kmark" style="${isSel?'color:#fff':''}">${esc(it.kind||'')}</span>` : '';
      grid+=`<div class="drow${isSel?' sel':''}" data-erow="${gi}.${ii}" style="grid-template-columns:${gtc};${rowCol?'color:'+rowCol:''}">`+
        `<div class="c center">${hasKids?EXP_TRI:''}</div>`+
        `<div class="c center">${kmark}</div>`+
        `<div class="c" style="${conv?'font-weight:700':(working?'padding-left:10px;color:'+(isSel?'#fff':'#404040'):'color:'+(isSel?'#fff':'#404040'))}">${esc(it.item)}</div>`+
        `<div class="c" style="font-size:10px">${tag}</div>`+
        `<div class="c num">${it.flat?'FLAT':esc(it.qty||'—')}</div>`+
        `<div class="c center" style="color:${isSel?'#fff':'#606060'}">${esc((it.unit||'').toUpperCase())}</div>`+
        `<div class="c num">${it.rate?num2(it.rate):'—'}</div>`+
        `<div class="c num" style="${conv?'font-weight:700':''}">${it.ext?num2(it.ext):'—'}</div>`+
        `<div class="c center" data-econv="${gi}.${ii}">${conv?CHK_GREEN:''}</div>`+
        `<div class="c center">${it.note?KIND_ICON:''}</div>`+
      `</div>`;
      if(it.note) grid+=`<div class="noterow"><div></div><div class="nt">${esc(it.note)}</div></div>`;
    });
  });
  const list=`<div class="dlist" style="flex:1"><div class="dlist-inner">${grid}<div style="flex:1"></div></div>${DSCROLL}</div>`;
  // toolbar
  const tb=(l,a)=>`<div class="tool" data-eact="${a}">${l}</div>`;
  const toolbar=`<div class="toolbar" style="overflow:hidden">${tb('Save','ed-save')}${tb('Print…','print')}<div class="tsep"></div>${tb('Row','ed-insert')}${tb('Item','ed-insert')}${tb('Working row','ed-working')}${tb('Allowance','ed-allow')}${tb('Fee','ed-fee')}<div class="tsep"></div>${tb('Indent','ed-indent')}${tb('Outdent','ed-outdent')}${tb('Fill down','ed-fill')}<div class="tsep"></div>${tb('Preview','ed-preview')}${tb('Setup…','ed-setup')}<div class="tsep"></div>${tb('Send to Estimate','ed-send')}<span style="flex:1"></span>${tb('Close','close')}</div><div class="rule"></div>`;
  const caption=`<div class="ws-pane-head" style="flex:none"><span class="ttl">${esc(bd.id)} — ${isCur?'as built, incl. change orders':'read-only copy'}</span>${isCur?`<span style="margin-left:8px;background:var(--navy);color:#fff;font-weight:700;padding:1px 6px">CURRENT</span>`:''}<span class="meta" style="margin-left:8px">${esc(p.customer)}${bd.copiedFrom?' · copied from '+bd.copiedFrom:''} · ${cc.nTotal} rows</span><span style="flex:1"></span><span class="meta">Last saved just now</span></div>`;
  const colbar=`<div style="height:22px;flex:none;display:flex;align-items:center;gap:6px;padding:0 6px;white-space:nowrap;box-shadow:inset 1px 1px var(--shadow),inset -1px -1px #fff"><span style="color:#404040">Columns:</span><span>Tags</span><span style="color:#404040">·</span><span>Qty and unit</span><span style="color:#404040">·</span><span>Cost and margin</span><span style="color:#404040">·</span><span>Notes</span><div class="tsep"></div><span>Expand all</span><span style="color:#404040">·</span><span>Collapse all</span><div class="tsep"></div><span style="color:#404040">Group by:</span><div class="ecombo" style="width:80px"><span class="v">(none)</span><span class="a">${ICON.down}</span></div><span style="flex:1"></span><span style="color:#404040">${cc.nTotal} rows · ${cc.nConvert} lines</span></div>`;
  // selected row panel
  const it=(bd.groups[sel.gi]||{items:[]}).items[sel.ii]||{}; const conv=it.convert!==false; const fee=!!it.noParent; const working=!conv&&!fee;
  let parentName=''; if(working){ const items=(bd.groups[sel.gi]||{items:[]}).items; for(let k=sel.ii;k>=0;k--){ if(items[k].convert!==false){ parentName=items[k].item; break; } } }
  const rowPanel=`<div class="fbox" style="flex:1;min-width:0"><span class="legend">Selected row — ${working?'working row under '+esc(parentName):(fee?'fee, no parent':'estimate line')}</span>
    <div style="display:flex;gap:12px;height:100%"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
      <div class="efield"><span class="lab" style="width:44px">Name</span><div class="einput" style="width:230px">${esc(it.item||'')}</div><span class="lab" style="width:30px">Kind</span><div class="ecombo" style="width:120px"><span class="v">${esc(kindName(it))}</span><span class="a">${ICON.down}</span></div></div>
      <div class="efield"><span class="lab" style="width:44px">Qty</span><div class="einput" style="width:78px">${esc(it.flat?'—':(it.qty||'—'))}</div><span class="lab" style="width:30px">Rate</span><div class="einput" style="width:70px">${it.rate?num2(it.rate):'—'}</div><span style="color:#404040">= $${num2(it.ext)}</span></div>
      ${working?`<div class="efield"><span class="lab" style="width:44px">Under</span><div class="ecombo" style="width:230px"><span class="v">${esc(parentName)}</span><span class="a">${ICON.down}</span></div><div style="display:flex;align-items:center;gap:4px;margin-left:4px" data-econv="${sel.gi}.${sel.ii}"><span class="echk${conv?' on':''}">${CHK_GREEN}</span><span>Converts</span></div></div>`:''}
      <div class="efield"><span class="lab" style="width:44px">Supplier</span><div class="ecombo" style="width:130px"><span class="v">${esc(it.supplier||(it.source||'').split(' ')[0]||'')}</span><span class="a">${ICON.down}</span></div><span class="lab" style="width:34px">Quote</span><div class="einput" style="width:96px">${esc(it.quote||'')}</div></div>
      <div style="display:flex;align-items:flex-start;gap:5px"><span class="lab" style="width:44px">Note</span><div style="flex:1;min-width:0;height:30px;padding:3px 4px;background:#fff;line-height:1.35;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff,inset 2px 2px #0a0a0a,inset -2px -2px #dfdfdf">${esc(it.note||'')}</div></div>
      <div class="efield"><span class="lab" style="width:44px">Group</span><div class="einput" style="flex:1;min-width:0"><span class="ktag">${esc((bd.groups[sel.gi]||{}).name||'')}</span><span style="color:#b3b3ac">${working?'rolls into its parent, never printed':(fee?'lands in the margin':'prints on the estimate')}</span></div></div>
    </div><div style="width:148px;flex:none;display:flex;flex-direction:column;gap:2px">
      <div class="wbtn" data-eact="ed-makeline" style="width:148px">${conv?'Make working row':'Make estimate line'}</div>
      <div class="wbtn" data-eact="ed-move" style="width:148px">Move under…</div>
      <div class="wbtn" data-eact="ed-attach" style="width:148px">Attach quote…</div>
      <div class="dact-sep"></div>
      <div class="wbtn" data-eact="ed-dup" style="width:148px">Duplicate</div>
      <div class="wbtn" data-eact="ed-remove" style="width:148px">Remove row</div>
    </div></div></div>`;
  // cost to price box
  let ctp='';
  bd.groups.forEach(g=>{ const gt=groupTotal(g); const lbl=g.name==='No parent'?'Fees, no parent':g.name; ctp+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 84px"><div class="t" style="color:#404040">${esc(lbl)}</div><div class="r">${money(gt)}</div></div>`; });
  ctp+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 84px"><div class="t" style="color:#404040">Contingency ${bd.contingencyPct}%</div><div class="r">${money(cc.contingency)}</div></div>`;
  ctp+=`<div class="hr"></div><div class="crow bold" style="grid-template-columns:minmax(0,1fr) 84px"><div class="t">Total cost</div><div class="r" style="font-size:13px">${money(cc.totalCost)}</div></div>`;
  ctp+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 84px"><div class="t" style="color:#404040">Margin at ${bd.marginPct}%</div><div class="r">+${money(cc.margin)}</div></div>`;
  ctp+=`<div class="hr"></div><div class="crow bold" style="grid-template-columns:minmax(0,1fr) 84px"><div class="t">Price to quote</div><div class="r">${money(cc.priceToQuote)}</div></div>`;
  ctp+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 84px"><div class="t" style="color:#404040">Converts to</div><div class="r">${cc.nConvert} lines of ${cc.nTotal}</div></div>`;
  const box1=`<div class="fbox" style="width:236px;flex:none"><span class="legend">Cost to price</span>${ctp}<div style="flex:1"></div><div class="dbtn default" data-eact="ed-send" style="width:218px"><span>Send to Estimate</span></div></div>`;
  // right column: estimate preview + breakdown
  const previewBox=`<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:4px">`+
    `<div style="height:22px;flex:none;display:flex;align-items:center;gap:6px;padding:0 5px;white-space:nowrap;box-shadow:inset 1px 1px #fff,inset -1px -1px #808080"><span style="font-weight:700">Estimate preview</span><span style="color:#404040">${cc.nConvert} lines that convert</span><span style="flex:1"></span><div class="tool-arrow" style="width:26px;height:20px">◀</div><div class="tool-arrow" style="width:26px;height:20px">▶</div></div>`+
    `<div style="flex:1;min-height:0;background:#808080;display:flex;justify-content:center;align-items:flex-start;padding:6px;overflow:hidden;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff,inset 2px 2px #0a0a0a,inset -2px -2px #dfdfdf"><div style="width:78%;box-shadow:2px 2px 0 rgba(0,0,0,.35)">${PDF_PAGE()}</div></div></div>`;
  const chk=(on,label)=>`<div style="display:flex;align-items:center;gap:5px;height:16px"><span class="echk${on?' on':''}">${CHK_GREEN}</span><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(label)}</span></div>`;
  const breakdownBox=`<div class="fbox" style="flex:none"><span class="legend">Breakdown</span>
    <div class="efield"><span class="lab" style="width:58px">Margin</span><div class="einput" data-eact="ed-margin" style="width:48px;cursor:pointer">${bd.marginPct}</div><span style="color:#404040">%</span><span class="lab" style="margin-left:6px">Cont.</span><div class="einput" style="width:34px">${bd.contingencyPct}</div><span style="color:#404040">%</span></div>
    <div class="efield"><span class="lab" style="width:58px">Priced for</span><div class="ecombo" style="width:158px"><span class="v">Next estimate — not sent</span><span class="a">${ICON.down}</span></div></div>
    ${chk(true,'Working rows roll into their parent line')}${chk(true,'Fees with no parent land in the margin')}${chk(false,'Carry internal notes onto the estimate')}${chk(true,'Warn if a line has no supplier quote')}
    <div style="display:flex;gap:3px;margin-top:2px"><div class="wbtn" data-eact="ed-setup" style="width:110px">Margin rules…</div><div class="wbtn" data-eact="ed-quotelog" style="width:104px">Quote log…</div></div></div>`;
  const rightCol=`<div style="width:250px;flex:none;display:flex;flex-direction:column;gap:4px">${previewBox}${breakdownBox}</div>`;
  const nWorking=cc.nTotal-cc.nConvert-(bd.groups.reduce((s,g)=>s+g.items.filter(x=>x.noParent).length,0)); const nFee=bd.groups.reduce((s,g)=>s+g.items.filter(x=>x.noParent).length,0);
  const statusbar=`<div class="statusbar"><div class="sb grow">Enter a new row · Ctrl+Enter a working row · F2 edit · Esc back to the list</div><div class="sb" style="width:132px">${cc.nConvert} lines, ${nWorking} working, ${nFee} fee</div><div class="sb" style="width:86px">${cc.nConvert} of ${cc.nTotal} convert</div><div class="sb" style="width:122px">Total ${money(cc.priceToQuote)}</div><div class="sb" style="width:96px">Margin ${pctFmt(cc.margin/cc.priceToQuote*100)}</div><div class="sb" style="width:110px">Cost never prints</div></div>`;
  const html = childTitleBar(SEC_ICON.grid, `${bd.id} — Cost Breakdown Editor — [${p.id} ${p.title}]`)+
    childMenuBar(['<u>F</u>ile','<u>E</u>dit','<u>V</u>iew','<u>I</u>nsert','<u>B</u>reakdown','<u>W</u>indow','<u>H</u>elp'])+
    toolbar+caption+colbar+
    `<div style="flex:1;min-height:0;display:flex;gap:6px;padding:6px">`+
      `<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">`+
        `<div style="flex:1;min-height:0;display:flex">${list}</div>`+
        `<div style="height:212px;flex:none;display:flex;gap:6px">${rowPanel}${box1}</div>`+
      `</div>`+
      rightCol+
    `</div>`+statusbar;
  const ov=openFullWindow(html);
  $$('[data-erow]', ov).forEach(r=> r.addEventListener('mousedown', e=>{ if(e.target.closest('[data-econv]')) return; const [gi,ii]=r.dataset.erow.split('.').map(Number); editState.sel={gi,ii}; renderCostEditor(); }));
  $$('[data-econv]', ov).forEach(c=> c.addEventListener('click', ()=>{ const [gi,ii]=c.dataset.econv.split('.').map(Number); const it=editState.bd.groups[gi].items[ii]; it.convert=it.convert===false; saveState(); renderCostEditor(); }));
  $$('[data-eact]', ov).forEach(b=> b.addEventListener('mouseup', ()=> editorAction(b.dataset.eact)));
}
function kindName(it){ if(it.convert!==false && !it.noParent) return 'Estimate line'; const m={MAT:'Material',LAB:'Labour',RNT:'Rental',ALW:'Allowance',FEE:'Fee'}; return m[it.kind]||'Working row'; }
function editorAction(act){
  const {p,bd,sel}=editState;
  switch(act){
    case 'close': case 'ed-save': if(act==='ed-save'){ bd.lastEdited=fmtToday(); logActivity(p,`Cost breakdown ${bd.id} saved`); saveState(); return; } closeFullWindow(); render(); return;
    case 'ed-insert': return openCostItem(p, bd, sel.gi, null, true);
    case 'ed-working': return openCostItem(p, bd, sel.gi, null, false, 'MAT');
    case 'ed-allow': return openCostItem(p, bd, sel.gi, null, false, 'ALW');
    case 'ed-fee': return openCostItem(p, bd, sel.gi, null, false, 'FEE');
    case 'ed-edit': { const it=(bd.groups[sel.gi]||{items:[]}).items[sel.ii]; return it?openCostItem(p, bd, sel.gi, it, it.convert!==false):null; }
    case 'ed-makeline': { const it=(bd.groups[sel.gi]||{items:[]}).items[sel.ii]; if(it){ it.convert=it.convert===false; saveState(); renderCostEditor(); } return; }
    case 'ed-remove': { const g=bd.groups[sel.gi]; if(g&&g.items[sel.ii]){ g.items.splice(sel.ii,1); if(sel.ii>0) editState.sel.ii--; saveState(); renderCostEditor(); } return; }
    case 'ed-dup': { const g=bd.groups[sel.gi]; const it=g&&g.items[sel.ii]; if(it){ g.items.splice(sel.ii+1,0,Object.assign({},it)); saveState(); renderCostEditor(); } return; }
    case 'ed-margin': return openMargin(p, bd);
    case 'ed-group': return openCostGroup(p, bd);
    case 'ed-send': closeFullWindow(); return openSendToEstimate(p, bd);
    case 'ed-attach': { const it=(bd.groups[sel.gi]||{items:[]}).items[sel.ii]; if(!it) return; return formDialog('Attach Quote', [{id:'supplier',label:'Supplier',value:it.supplier||''},{id:'quote',label:'Quote ref',value:it.quote||'',required:true}], o=>{ it.supplier=o.supplier; it.quote=o.quote; it.source=`${o.supplier} ${o.quote}`.trim(); saveState(); renderCostEditor(); }); }
    case 'ed-move': { const it=(bd.groups[sel.gi]||{items:[]}).items[sel.ii]; if(!it) return; return formDialog('Move Under', [{id:'group',label:'Group',type:'select',options:bd.groups.map(g=>g.name),value:bd.groups[sel.gi].name}], o=>{ const dst=bd.groups.findIndex(g=>g.name===o.group); if(dst<0||dst===sel.gi) return; bd.groups[sel.gi].items.splice(sel.ii,1); bd.groups[dst].items.push(it); editState.sel={gi:dst,ii:bd.groups[dst].items.length-1}; saveState(); renderCostEditor(); }); }
    case 'ed-indent': case 'ed-outdent': { const it=(bd.groups[sel.gi]||{items:[]}).items[sel.ii]; if(it){ it.convert=(act==='ed-outdent'); if(act==='ed-indent'&&!it.kind) it.kind='MAT'; saveState(); renderCostEditor(); } return; }
    case 'ed-fill': case 'ed-preview': case 'ed-setup': case 'ed-quotelog': case 'ed-template': return notBuilt('This action');
    case 'print': return notBuilt('Print');
    default: return notBuilt('This action');
  }
}
function openMargin(p, bd){
  bd=bd||currentBreakdown(p); if(!bd) return;
  const body=el('div');
  body.innerHTML=`<div class="dlg-title"><span class="dlg-title-text">Margin — ${esc(bd.id)}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:300px">
      <div class="frow" style="grid-template-columns:120px 1fr"><label>Target margin %</label><div class="tinput" style="width:80px"><input id="mg-pct" type="text" value="${bd.marginPct}"></div></div>
      <div style="color:#404040;margin-top:6px">Price to quote is derived: cost ÷ (1 − margin).</div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="mg-ok"><span>OK</span></button><button class="btn dlgbtn" id="mg-cancel">Cancel</button></div>
    </div>`;
  const dlg=openDialog(body,300,160); const close=()=>closeDialog();
  $('#mg-cancel',dlg).addEventListener('click',close); $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#mg-ok',dlg).addEventListener('click',()=>{ const v=parseFloat($('#mg-pct',dlg).value); if(!isNaN(v)&&v>=0&&v<100){ bd.marginPct=v; logActivity(p,`Margin on ${bd.id} set to ${v}%`); saveState(); editState?renderCostEditor():renderWorkspace(); } close(); });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#mg-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
  setTimeout(()=>$('#mg-pct',dlg).focus(),0);
}
function openCostGroup(p, bd){
  const body=el('div');
  body.innerHTML=`<div class="dlg-title"><span class="dlg-title-text">New Group</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:300px"><div class="frow" style="grid-template-columns:70px 1fr"><label>Name&nbsp;*</label><div class="tinput"><input id="cg-name" type="text"></div></div>
    <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="cg-ok"><span>Add</span></button><button class="btn dlgbtn" id="cg-cancel">Cancel</button></div></div>`;
  const dlg=openDialog(body,300,140); const close=()=>closeDialog();
  $('#cg-cancel',dlg).addEventListener('click',close); $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#cg-ok',dlg).addEventListener('click',()=>{ const n=$('#cg-name',dlg).value.trim(); if(n){ bd.groups.push({name:n,items:[]}); saveState(); editState?renderCostEditor():renderWorkspace(); } close(); });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#cg-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
  setTimeout(()=>$('#cg-name',dlg).focus(),0);
}
function openCostItem(p, bd, gi, existing, convertDefault, kindDefault){
  bd=bd||currentBreakdown(p); if(!bd) return;
  const groups=bd.groups.map(g=>g.name);
  let gsel = gi!=null?gi:0;
  const body=el('div');
  body.innerHTML=`<div class="dlg-title"><span class="dlg-title-text">${existing?'Edit Row':'Add Row'}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:380px">
      <div class="frow" style="grid-template-columns:70px 1fr"><label>Group</label><div class="combo" id="ci-group"><span class="val">${esc(groups[gsel]||'')}</span><span class="arrow">${ICON.down}</span></div></div>
      <div class="frow" style="grid-template-columns:70px 1fr"><label>Item&nbsp;*</label><div class="tinput"><input id="ci-item" type="text" value="${esc(existing?existing.item:'')}" maxlength="60"></div></div>
      <div class="frow" style="grid-template-columns:70px 1fr"><label>Qty · Unit</label><div style="display:flex;gap:6px"><div class="tinput" style="width:80px"><input id="ci-qty" type="text" value="${esc(existing?existing.qty:'')}"></div><div class="tinput" style="width:60px"><input id="ci-unit" type="text" value="${esc(existing?existing.unit:'')}"></div></div></div>
      <div class="frow" style="grid-template-columns:70px 1fr"><label>Rate</label><div class="tinput" style="width:100px"><input id="ci-rate" type="text" value="${existing?existing.rate:''}"></div></div>
      <div class="frow" style="grid-template-columns:70px 1fr"><label>Supplier</label><div class="tinput"><input id="ci-source" type="text" value="${esc(existing&&existing.source?existing.source:'')}"></div></div>
      <div class="frow" style="grid-template-columns:70px 1fr"><label></label><div class="check${(existing?existing.convert!==false:convertDefault!==false)?' on':''}" id="ci-conv"><span class="box">${ICON.check}</span><span>Converts to an estimate line</span></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="ci-ok"><span>${existing?'Save':'Add'}</span></button><button class="btn dlgbtn" id="ci-cancel">Cancel</button></div>
    </div>`;
  const dlg=openDialog(body,380,270); const gcombo=$('#ci-group',dlg); const convChk=$('#ci-conv',dlg);
  gcombo.addEventListener('mousedown',e=>{ e.preventDefault(); closeAllPopups(); const r=gcombo.getBoundingClientRect();
    buildPopup(groups.map((g,i)=>({label:esc(g),checked:i===gsel,action:()=>{ gsel=i; gcombo.querySelector('.val').textContent=g; }})),r.left,r.bottom); });
  convChk.addEventListener('click',()=>convChk.classList.toggle('on'));
  const close=()=>closeDialog();
  $('#ci-cancel',dlg).addEventListener('click',close); $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#ci-ok',dlg).addEventListener('click',()=>{
    const item=$('#ci-item',dlg).value.trim(); if(!item){ $('#ci-item',dlg).focus(); return; }
    const qty=$('#ci-qty',dlg).value.trim(); const unit=$('#ci-unit',dlg).value.trim();
    const rate=parseFloat($('#ci-rate',dlg).value.replace(/[^0-9.\-]/g,''))||0;
    const qn=parseFloat(qty.replace(/,/g,''))||0; const ext=qn&&rate?Math.round(qn*rate):(existing?existing.ext:0);
    const source=$('#ci-source',dlg).value.trim(); const convert=convChk.classList.contains('on');
    if(existing){ Object.assign(existing,{item,qty,unit,rate,ext:(qn&&rate?ext:existing.ext),source,convert}); logActivity(p,`Cost row edited — ${item}`); }
    else { bd.groups[gsel].items.push({item,qty,unit,rate,ext,source,convert,kind:(convert?undefined:kindDefault)}); logActivity(p,`Cost row added — ${item} ${money(ext)}`); }
    saveState(); editState?renderCostEditor():renderWorkspace(); close();
  });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#ci-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
  setTimeout(()=>$('#ci-item',dlg).focus(),0);
}
/* new / copy / make-current / send-to-estimate on the breakdown list */
function nextCostId(p){ let n=0; (p.ws.cost.breakdowns||[]).forEach(b=>{ const m=/COST-(\d+)/.exec(b.id); if(m) n=Math.max(n,+m[1]); }); return 'COST-'+(n+1); }
function costNew(p, copyFrom){
  const c=p.ws.cost; const id=nextCostId(p);
  const groups = copyFrom ? JSON.parse(JSON.stringify(copyFrom.groups)) : [{name:'Equipment',items:[]},{name:'Surfacing',items:[]},{name:'Site work',items:[]},{name:'Freight',items:[]},{name:'Other',items:[]}];
  const bd={ id, dated:fmtToday(), pricedInto:'— not yet sent', status:'Draft', marginPct:(copyFrom?copyFrom.marginPct:18), contingencyPct:(copyFrom?copyFrom.contingencyPct:5), copiedFrom:copyFrom?copyFrom.id:null, changedSince:null, note:'', groups };
  c.breakdowns.push(bd); logActivity(p,`Cost breakdown ${id} created${copyFrom?' from '+copyFrom.id:''}`); saveState(); openCostEditor(p, bd);
}
function costMakeCurrent(p, bd){ p.ws.cost.current=bd.id; bd.status='Current'; logActivity(p,`${bd.id} made the current breakdown`); saveState(); render(); }
function openSendToEstimate(p, bd){
  const cc=bdCompute(bd);
  messageBox('Send to Estimate', ICON.info, `Create a new estimate from <b>${esc(bd.id)}</b>?<br>${cc.nConvert} estimate lines · price to quote <b>${money(cc.priceToQuote)}</b>.<br>The ${cc.nTotal-cc.nConvert} cost-only rows stay behind.`, ['Create','Cancel'], a=>{
    if(a!=='Create') return;
    bd.pricedInto='(new estimate)'; openUploadEstimate(p,'version');
  });
}

/* ============================================================
   FIELD GROUP (Screens 08–12)
   ============================================================ */
let uiTab = {};   // uiTab["<pid>|<sec>"] = tab name
function getTab(p,sec,def){ const k=selKey(p,sec); return uiTab[k]!=null?uiTab[k]:def; }
function tabsHTML(tabs, active){
  return `<div class="tabs">`+tabs.map(t=>`<div class="tab${t.key===active?' active':''}" data-tab="${t.key}">${esc(t.label)}</div>`).join('')+`<div class="tabfill"></div></div>`;
}
function emptyState(msg){ return `<div style="padding:12px;color:#808080">${esc(msg)}</div>`; }

/* ---------- SHIPPING (08) ---------- */
function shippingHead(p){
  const s=p.ws.shipping; if(!s) return {subtitle:'deliveries to the lot', right:''};
  const rec=s.shipments.filter(x=>x.state==='received').length;
  return { subtitle:`${s.shipments.length} shipments, ${rec} received`, right:s.next||'' };
}
function shippingBody(p){
  const s=p.ws.shipping;
  if(!s||!s.shipments.length){
    const actions=actionColHTML([{label:'Add Shipment…',act:'ship-add'}]);
    return `<div class="docsec"><div class="docsec-main"><div class="dlist"><div class="dlist-inner">${emptyState('No shipments yet.')}</div>${DSCROLL}</div>${actions}</div></div>`;
  }
  const cols=[{label:'',w:'20px'},{label:'No.',w:'30px'},{label:'Carrier',w:'88px'},{label:'BOL / PRO',w:'66px'},{label:'Call',w:'62px'},{label:'Scheduled',w:'82px'},{label:'Received',w:'62px'},{label:'Status',w:'minmax(0,1fr)'},{label:'Stored at',w:'116px'}];
  const rows=s.shipments.map(sh=>({ accepted:sh.state==='received', ghost:sh.state==='notshipped',
    cells:[ {html:sh.state==='received'?`<span style="display:flex;align-items:center;justify-content:center">${CHK}</span>`:(sh.flag?`<span style="display:flex;align-items:center;justify-content:center">${WARN_SM}</span>`:''),center:true},
      {text:String(sh.n)},{text:sh.carrier},{text:sh.bol||'—'},{text:sh.call||'—'},{text:sh.scheduled||'—'},{text:sh.received||'—'},{text:sh.status},{text:sh.storedAt||'—'} ] }));
  const sel=getSel(p,'Shipping',Math.max(0,s.shipments.findIndex(x=>x.flag)>=0?s.shipments.findIndex(x=>x.flag):0));
  const sh=s.shipments[sel]||{};
  const list=docListHTML(cols,rows,sel);
  const actions=actionColHTML([
    {label:'Add Shipment…',act:'ship-add'},{label:'Record Call…',act:'ship-call'},{label:'Schedule Delivery…',act:'ship-schedule'},{sep:1},
    {label:'Record Receipt…',default:1,act:'ship-receipt'},{label:'Storage Location…',act:'ship-store'},{label:'Upload Photos…',act:'ship-photos'},{sep:1},
    {label:'Remove…',act:'ship-remove'}
  ]);
  // detail: left fields + right tabbed log
  const F=(k,v)=>v?`<div class="ffield" style="grid-template-columns:78px minmax(0,1fr)"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`:'';
  const fields=`<div class="ffields" style="width:306px">
    ${F('Carrier', sh.carrier + (sh.carrierPhone?` · ${sh.carrierPhone}`:''))}
    ${F('BOL / PRO', sh.bol&&sh.bol!=='—'?sh.bol:'')}
    ${F('Contents', sh.contents)}
    ${F('Call received', sh.callReceived)}
    ${F('Scheduled', sh.scheduledFull||sh.scheduled)}
    ${F('Received', sh.receivedFull||(sh.received!=='—'?sh.received:''))}
    ${F('Checked', sh.checked)}
    ${F('Stored at', sh.storedFull||sh.storedAt)}
    ${F('To site', sh.toSite)}
    ${F('Freight', sh.freight)}
    <div style="flex:1"></div><div class="dfield-hr"></div>
    <div style="display:flex;gap:4px"><div class="mbtn" data-dact="ship-store">Storage…</div><div class="mbtn" data-dact="ship-log">Add Log Entry…</div><div class="mbtn" data-dact="print">Print Log</div></div></div>`;
  const tab=getTab(p,'Shipping','log');
  const tabs=[{key:'log',label:`Shipping log (${(sh.log||[]).length})`},{key:'paper',label:`Paperwork (${(sh.paperwork||[]).length})`},{key:'photos',label:`Photos (${sh.photos||0})`},{key:'notes',label:'Notes'}];
  let tabInner;
  if(tab==='log'){
    const gtc='78px 92px minmax(0,1fr)';
    tabInner=`<div class="dhead" style="grid-template-columns:${gtc}"><div class="col">Date</div><div class="col">Event</div><div class="col">Detail</div></div>`+
      ((sh.log||[]).map(e=>`<div class="drow" style="grid-template-columns:${gtc}"><div class="c">${esc(e.date)}</div><div class="c" style="font-weight:700">${esc(e.event)}</div><div class="c">${esc(e.detail)}</div></div>`).join('')||emptyState('No log entries yet.'));
  } else if(tab==='paper'){
    tabInner=(sh.paperwork||[]).length?(sh.paperwork.map(f=>`<div class="drow" style="grid-template-columns:20px minmax(0,1fr)"><div class="c">${SEC_ICON.docR}</div><div class="c">${esc(f)}</div></div>`).join('')):emptyState('No paperwork scanned.');
  } else if(tab==='photos'){
    tabInner = (sh.photos||0)?`<div class="pgrid">${Array.from({length:Math.min(sh.photos,6)}).map(()=>`<div class="pcat" style="width:96px"><div class="cover" style="height:70px">${PH_SVG}</div></div>`).join('')}</div>`:emptyState('No photos at the truck.');
  } else {
    tabInner=emptyState('No notes.');
  }
  const right=`<div style="flex:1;min-width:0;display:flex;flex-direction:column">${tabsHTML(tabs,tab)}<div class="tabbody">${tabInner}</div><div style="height:16px;flex:none;display:flex;align-items:center;color:#404040;overflow:hidden">Recorded when the carrier calls and when the truck arrives — nothing is tracked in transit.</div></div>`;
  const detail=`<div class="ddetail" style="height:296px"><span class="legend">Shipment ${sh.n} — ${esc(sh.status)}</span><div class="ddetail-body">${fields}${right}</div></div>`;
  const rec=s.shipments.filter(x=>x.state==='received').length, sched=s.shipments.filter(x=>x.state==='scheduled'), awaiting=s.shipments.filter(x=>x.state==='awaiting').length, back=s.shipments.filter(x=>x.state==='notshipped').length;
  const late=sched.find(x=>x.flag);
  const summary=`<div class="dsummary">${late?WARN_SM:''}<span>${s.shipments.length} shipments</span><span class="sep">|</span><span>${rec} received and stored</span><span class="sep">|</span>${sched.length?`<span><b>${sched.length} scheduled${late?' '+(late.scheduled||''):''}</b>${late?' — later than promised':''}</span><span class="sep">|</span>`:''}<span>${awaiting} awaiting call, ${back} on backorder</span><span class="grow"></span><div class="mbtn" data-dact="go-Installation">Installation</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${list}${actions}</div>${detail}${summary}</div>`;
}
const PH_SVG='<svg width="28" height="28" viewBox="0 0 16 16" style="shape-rendering:crispEdges;opacity:.5"><path fill="#000" d="M1 3h14v10H1z"/><path fill="#a6caf0" d="M2 4h12v8H2z"/><path fill="#008000" d="M2 10l3-3 3 3 2-2 4 4H2z"/><path fill="#ffd800" d="M11 5h2v2h-2z"/></svg>';

/* ---------- PHOTOS (10) ---------- */
function photosHead(p){
  const a=p.ws.photoAlbum; if(!a) return {subtitle:'', right:''};
  const total=a.categories.reduce((s,c)=>s+c.count,0)+(a.uncategorised||0);
  return { subtitle:`${total} photos, ${a.categories.length} categories`, right:'Viewer on Sheet 05' };
}
function photosBody(p){
  const a=p.ws.photoAlbum;
  if(!a||!a.categories.length){
    return `<div class="docsec"><div class="docsec-main"><div class="dlist"><div class="dlist-inner">${emptyState('No photos yet. Use Upload Photos to add them.')}</div>${DSCROLL}</div>${actionColHTML([{label:'Upload Photos…',act:'photo-upload'}])}</div></div>`;
  }
  const sel=getSel(p,'Photos',0);
  const grid=`<div class="dlist"><div class="dlist-inner"><div class="pgrid">`+
    a.categories.map((c,i)=>`<div class="pcat${i===sel?' sel':''}" data-drow="${i}"><div class="cover">${PH_SVG}<span class="cnt">${c.count}</span></div><div class="lbl">${esc(c.name)}</div><div class="dt">${esc(c.date)}</div></div>`).join('')+
    `</div></div>${DSCROLL}</div>`;
  const actions=actionColHTML([
    {label:'Upload Photos…',act:'photo-upload'},{label:'New Category…',act:'photo-cat'},{sep:1},
    {label:'Open',default:1,act:'viewer'},{label:'Set Category…',act:'photo-set'},{sep:1},
    {label:'Remove…',act:'photo-remove'}
  ]);
  const c=a.categories[sel]||{};
  const detail=`<div class="ddetail" style="height:150px"><span class="legend">${esc(c.name)} — ${c.count} photos</span><div class="ddetail-body"><div class="ffields" style="width:260px">
    <div class="ffield" style="grid-template-columns:78px minmax(0,1fr)"><div class="k">Category</div><div class="v">${esc(c.name)}</div></div>
    <div class="ffield" style="grid-template-columns:78px minmax(0,1fr)"><div class="k">Photos</div><div class="v">${c.count}</div></div>
    <div class="ffield" style="grid-template-columns:78px minmax(0,1fr)"><div class="k">Latest</div><div class="v">${esc(c.date)}</div></div>
    <div style="flex:1"></div><div class="dfield-hr"></div><div style="display:flex;gap:4px"><div class="mbtn" data-dact="viewer">Open in Viewer</div><div class="mbtn" data-dact="photo-upload">Add to Category…</div></div>
  </div><div style="flex:1;min-width:0;display:flex;align-items:center;color:#404040">The full-size viewer is Sheet 05. This grid confirms the categories and counts.</div></div></div>`;
  const total=a.categories.reduce((s,x)=>s+x.count,0);
  const summary=`<div class="dsummary"><span><b>${total}</b> photos</span><span class="sep">|</span><span>${a.categories.length} categories</span>${a.uncategorised?`<span class="sep">|</span><span>${a.uncategorised} uncategorised</span>`:''}<span class="grow"></span><div class="mbtn" data-dact="go-Progress">Progress</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${grid}${actions}</div>${detail}${summary}</div>`;
}

/* ---------- SITE (09) ---------- */
function siteFlat(p){ const out=[]; (p.ws.site.items||[]).forEach((g,gi)=>{ out.push({gi,ii:-1,node:g,group:true}); (g.children||[]).forEach((ch,ii)=>out.push({gi,ii,node:ch,group:false})); }); return out; }
function siteHead(p){ const s=p.ws.site; const n=s?s.items.reduce((a,g)=>a+(g.children||[]).length,0):0; return {subtitle:`${n} files in ${s?s.items.length:0} groups`, right:''}; }
function siteBody(p){
  const s=p.ws.site;
  if(!s){ return `<div class="docsec"><div class="docsec-main"><div class="stree">${emptyState('No site information yet.')}</div>${actionColHTML([{label:'Upload…',act:'site-upload'}])}</div></div>`; }
  const flat=siteFlat(p); const sel=getSel(p,'Site', flat.findIndex(x=>!x.group));
  let tree='<div class="stree">';
  flat.forEach((f,i)=>{
    const ic = f.group?SEC_ICON.folder:(f.node.kind==='photo'?SEC_ICON.photo:SEC_ICON.docR);
    tree+=`<div class="snode ${f.group?'':'child'}${i===sel?' sel':''}" data-drow="${i}"><span class="tico">${ic}</span><span class="lbl">${esc(f.node.name)}</span>${f.node.date?`<span class="dt">${esc(f.node.date)}</span>`:''}</div>`;
  });
  tree+='</div>';
  const actions=actionColHTML([
    {label:'Upload…',act:'site-upload'},{label:'New Group…',act:'site-group'},{sep:1},
    {label:'Open',default:1,act:'viewer'},{label:'Rename…',act:'site-rename'},{sep:1},
    {label:'Remove…',act:'site-remove'}
  ]);
  const f=flat[sel]||{node:{}};
  const isPhoto=f.node.kind==='photo';
  const preview=`<div class="dthumb" style="width:200px"><div class="page" style="flex:1;min-height:0;${isPhoto?'align-items:center;justify-content:center':''}">${isPhoto?PH_SVG:'<div class="sk dk" style="width:70%;height:7px"></div><div class="sk" style="width:44%;height:4px;margin-top:4px"></div><div class="sk" style="width:86%;height:3px;margin-top:8px"></div><div class="sk" style="width:90%;height:3px;margin-top:3px"></div><div class="sk" style="width:64%;height:3px;margin-top:3px"></div>'}</div><div class="cap">${esc(f.node.name||'')}</div><div class="dbtn default" data-dact="viewer" style="width:150px"><span>Open in Viewer</span></div></div>`;
  const detail=`<div class="ddetail" style="height:230px"><span class="legend">${esc(f.group?f.node.name:(f.node.name||''))}</span><div class="ddetail-body"><div class="dfields">
    <div class="dfield" style="grid-template-columns:76px minmax(0,1fr)"><div class="k">Name</div><div class="v">${esc(f.node.name||'')}</div></div>
    <div class="dfield" style="grid-template-columns:76px minmax(0,1fr)"><div class="k">Kind</div><div class="v">${f.group?'Group':(f.node.kind==='photo'?'Photo':'Document')}</div></div>
    ${f.node.date?`<div class="dfield" style="grid-template-columns:76px minmax(0,1fr)"><div class="k">Added</div><div class="v">${esc(f.node.date)}</div></div>`:''}
    <div class="dfield-hr"></div><div class="dfield" style="grid-template-columns:76px minmax(0,1fr)"><div class="k">Site note</div><div class="v" style="white-space:normal;line-height:1.35">${esc(s.note||'')}</div></div>
  </div>${preview}</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${tree}${actions}</div>${detail}</div>`;
}

/* ---------- PROGRESS (11) ---------- */
function progressHead(p){ const pr=p.ws.progress; return {subtitle: pr?pr.day:'installation not started', right: pr?pr.status:''}; }
function progressBody(p){
  const pr=p.ws.progress;
  if(!pr){ return `<div class="docsec">${emptyState('Installation has not started.')}</div>`; }
  const evRows=(pr.events||[]).map(e=>`<div class="crow" style="grid-template-columns:74px 150px minmax(0,1fr)"><div class="t">${esc(e.date)}</div><div class="t" style="font-weight:700">${e.kind==='done'?CHK+' ':''}${esc(e.event)}</div><div class="t">${esc(e.detail)}</div></div>`).join('')||emptyState('No events yet.');
  const box1=`<div class="cbox" style="flex:1;min-width:0"><span class="legend">Installation events</span><div style="overflow:auto">${evRows}</div><div style="flex:1"></div><div style="display:flex;gap:4px"><div class="wbtn" data-dact="prog-event">Add Event…</div><div class="wbtn" data-dact="prog-photos">Upload Photos…</div></div></div>`;
  const isRows=(pr.issues||[]).map(i=>`<div class="crow" style="grid-template-columns:minmax(0,1fr) 84px"><div class="t">${i.status==='Open'?WARN_SM+' ':''}${esc(i.issue)} — <span style="color:#404040">${esc(i.detail)}</span></div><div class="r" style="${i.status==='Open'?'font-weight:700':'color:#404040'}">${esc(i.status)}</div></div>`).join('')||emptyState('No issues.');
  const box2=`<div class="cbox" style="width:420px;flex:none"><span class="legend">Issues</span><div style="overflow:auto">${isRows}</div><div style="flex:1"></div><div style="display:flex;gap:4px"><div class="wbtn" data-dact="prog-issue">Add Issue…</div></div></div>`;
  const summary=`<div class="dsummary"><span>${esc(pr.day)}</span><span class="sep">|</span><span><b>${esc(pr.status)}</b></span><span class="sep">|</span><span>${pr.photos||0} progress photos</span><span class="grow"></span><div class="mbtn" data-dact="go-Completion">Completion</div></div>`;
  return `<div class="docsec"><div class="costbtm" style="flex:1;height:auto">${box1}${box2}</div>${summary}</div>`;
}

/* ---------- COMPLETION (12) ---------- */
function completionHead(p){ const c=p.ws.completion; return {subtitle: c?c.status.toLowerCase():'', right: c&&c.completedDate?`Completed ${c.completedDate}`:''}; }
function completionBody(p){
  const c=p.ws.completion;
  if(!c){ return `<div class="docsec">${emptyState('Nothing recorded yet.')}</div>`; }
  const done=c.checklist.filter(x=>x.done).length;
  const rows=c.checklist.map((it,i)=>`<div class="crow2"><span class="lchk${it.done?' on':''}" data-clk="${i}">${CHK_GREEN}</span><span>${esc(it.item)}</span></div>`).join('');
  const box1=`<div class="cbox" style="flex:1;min-width:0"><span class="legend">Completion checklist — ${done} of ${c.checklist.length}</span><div class="clist">${rows}</div><div style="flex:1"></div><div style="display:flex;gap:4px"><div class="wbtn" data-dact="comp-mark">${c.status==='Complete'?'Reopen…':'Mark Complete…'}</div><div class="wbtn" data-dact="comp-photos">Upload Final Photos…</div></div></div>`;
  const box2=`<div class="cbox" style="width:360px;flex:none"><span class="legend">Status</span>
    <div class="ffield" style="grid-template-columns:120px minmax(0,1fr)"><div class="k">Status</div><div class="v">${esc(c.status)}</div></div>
    <div class="ffield" style="grid-template-columns:120px minmax(0,1fr)"><div class="k">Completed on</div><div class="v">${esc(c.completedDate||'—')}</div></div>
    <div class="ffield" style="grid-template-columns:120px minmax(0,1fr)"><div class="k">Final photos</div><div class="v">${c.finalPhotos||0}</div></div>
    <div class="ffield" style="grid-template-columns:120px minmax(0,1fr)"><div class="k">Final documents</div><div class="v">${c.finalDocs||0}</div></div>
    <div class="dfield-hr"></div><div style="line-height:1.4;color:#404040">${esc(c.note||'')}</div><div style="flex:1"></div></div>`;
  const summary=`<div class="dsummary"><span><b>${esc(c.status)}</b></span><span class="sep">|</span><span>${done} of ${c.checklist.length} checklist items</span><span class="grow"></span><div class="mbtn" data-dact="go-Billing">Billing / Payment</div></div>`;
  return `<div class="docsec"><div class="costbtm" style="flex:1;height:auto">${box1}${box2}</div>${summary}</div>`;
}

/* ============================================================
   RECORD GROUP (Screens 13–18)
   ============================================================ */
let uiCat = {};   // documents category filter, per project

/* ---------- DOCUMENTS (13) ---------- */
const REC_ICON = { email:SEC_ICON.card, note:SEC_ICON.records, screenshot:SEC_ICON.photo, instruction:SEC_ICON.docR, meeting:SEC_ICON.log,
  drawing:'<svg width="16" height="16" viewBox="0 0 16 16" style="shape-rendering:crispEdges"><path fill="#000" d="M2 2h12v12H2z"/><path fill="#fff" d="M3 3h10v10H3z"/><path fill="#5980a6" d="M4 10h8v1H4zM4 5h5v1H4zM8 6h1v4H8z"/></svg>', pdf:SEC_ICON.docR };
function documentsHead(p){
  const d=p.ws.docs; if(!d) return {subtitle:'all files', right:''};
  const newest=d.files.reduce((a,f)=>(!a||dateVal(f.uploaded)>dateVal(a))?f.uploaded:a,null);
  return { subtitle:'all categories', right:`${d.files.length} files · ${d.totalMB} MB · newest ${newest||'—'}` };
}
function documentsBody(p){
  const d=p.ws.docs;
  if(!d||!d.files.length){ return `<div class="docsec"><div class="docsec-main"><div class="dlist"><div class="dlist-inner">${emptyState('No documents filed yet.')}</div>${DSCROLL}</div>${actionColHTML([{label:'Upload…',act:'doc-upload'}])}</div></div>`; }
  const cats={}; d.files.forEach(f=> cats[f.cat]=(cats[f.cat]||0)+1);
  const catNames=['Contracts','Signed documents','Drawings','Specifications','Inspection','Change orders','Final documents','Other'];
  const curCat=uiCat[p.id]||'All documents';
  const find=(state.docFind||'').toLowerCase();
  let tree=`<div class="stree" style="width:176px;flex:none">`;
  tree+=`<div class="snode${curCat==='All documents'?' sel':''}" data-cat="All documents"><span class="tico">${SEC_ICON.folder}</span><span class="lbl">All documents (${d.files.length})</span></div>`;
  catNames.forEach(c=> tree+=`<div class="snode child${curCat===c?' sel':''}" data-cat="${esc(c)}"><span class="tico">${SEC_ICON.folder}</span><span class="lbl">${esc(c)}</span><span class="dt">${cats[c]||0}</span></div>`);
  tree+=`<div class="sec-group"><span>Filed from</span><div class="line"></div></div>`;
  (d.filedFrom||[]).forEach(f=> tree+=`<div class="snode child" data-cat="filed:${esc(f.name)}"><span class="tico">${SEC_ICON.folder}</span><span class="lbl">${esc(f.name)}</span><span class="dt">${f.count}</span></div>`);
  tree+=`</div>`;
  let files=d.files.map((f,i)=>({f,i}));
  if(curCat!=='All documents' && !curCat.startsWith('filed:')) files=files.filter(x=>x.f.cat===curCat);
  if(find) files=files.filter(x=>x.f.name.toLowerCase().includes(find)||x.f.cat.toLowerCase().includes(find));
  const cols=[{label:'',w:'22px'},{label:'Name',w:'minmax(0,1fr)'},{label:'Category',w:'118px'},{label:'Uploaded',w:'66px',cls:'num'},{label:'Size',w:'54px',cls:'num'},{label:'By',w:'78px'}];
  const sel=getSel(p,'Documents',0);
  const rows=files.map(({f,i})=>({ _i:i, cells:[{html:REC_ICON[f.kind]||SEC_ICON.docR,center:true},{text:f.name},{text:f.cat},{text:f.uploaded,cls:'num'},{text:f.size,cls:'num'},{text:f.by}] }));
  // remap selection index to filtered rows
  const gtc=cols.map(c=>c.w).join(' ');
  const head=`<div class="dhead" style="grid-template-columns:${gtc}">`+cols.map(c=>`<div class="col${c.cls==='num'?' num':''}">${esc(c.label)}</div>`).join('')+`</div>`;
  const body=rows.map((r,ri)=>{ const s=r._i===sel; return `<div class="drow${s?' sel':''}" data-drow="${r._i}" style="grid-template-columns:${gtc}">`+cols.map((c,ci)=>{const cell=r.cells[ci];return `<div class="c${c.cls==='num'?' num':''}${cell.center?' center':''}">${cell.html!=null?cell.html:esc(cell.text||'')}</div>`;}).join('')+`</div>`; }).join('')||emptyState('No files in this category.');
  const list=`<div class="dlist"><div class="dlist-inner">${head}${body}<div style="flex:1"></div></div>${DSCROLL}</div>`;
  const actions=actionColHTML([
    {label:'Upload…',act:'doc-upload'},{label:'New Category…',act:'doc-cat'},{sep:1},
    {label:'Open',default:1,act:'viewer'},{label:'Set Category…',act:'doc-set'},{label:'Rename…',act:'doc-rename'},{sep:1},
    {label:'Remove…',act:'doc-remove'}
  ]);
  const f=d.files[sel]||{};
  const detail=`<div class="ddetail" style="height:150px"><span class="legend">${esc(f.name||'')}</span><div class="ddetail-body"><div class="dfields">
    <div class="dfield" style="grid-template-columns:76px minmax(0,1fr)"><div class="k">Name</div><div class="v">${esc(f.name||'')}</div></div>
    <div class="dfield" style="grid-template-columns:76px minmax(0,1fr)"><div class="k">Category</div><div class="v">${esc(f.cat||'')}</div></div>
    <div class="dfield" style="grid-template-columns:76px minmax(0,1fr)"><div class="k">Uploaded</div><div class="v">${esc(f.uploaded||'')} by ${esc(f.by||'')}</div></div>
    <div class="dfield" style="grid-template-columns:76px minmax(0,1fr)"><div class="k">Size</div><div class="v">${esc(f.size||'')}</div></div>
    <div class="dfield-hr"></div><div class="dfield-btns"><div class="mbtn" data-dact="viewer">Open in Viewer</div><div class="mbtn" data-dact="doc-set">Set Category…</div></div>
  </div>${thumbHTML('Page 1 — double-click to open','Open in Viewer')}</div></div>`;
  const summary=`<div class="dsummary"><span><b>${d.files.length}</b> files</span><span class="sep">|</span><span>${d.totalMB} MB</span><span class="sep">|</span><span>${Object.keys(cats).length} categories</span><span class="grow"></span><div class="mbtn" data-dact="go-Records">Project Records</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${tree}${list}${actions}</div>${detail}${summary}</div>`;
}

/* ---------- PROJECT RECORDS (14) ---------- */
function recordsHead(p){ const r=p.ws.records; return {subtitle:'emails, notes, screenshots, instructions', right: r?`${r.items.length} records`:''}; }
function recordsBody(p){
  const r=p.ws.records;
  if(!r||!r.items.length){ return `<div class="docsec"><div class="docsec-main"><div class="dlist"><div class="dlist-inner">${emptyState('No project records yet.')}</div>${DSCROLL}</div>${actionColHTML([{label:'Add Record…',act:'rec-add'}])}</div></div>`; }
  const cols=[{label:'',w:'22px'},{label:'Type',w:'86px'},{label:'Date',w:'66px'},{label:'Subject',w:'minmax(0,1fr)'},{label:'From',w:'128px'}];
  const sel=getSel(p,'Records',0);
  const rows=r.items.map(it=>({ cells:[{html:REC_ICON[it.kind]||SEC_ICON.records,center:true},{text:it.kind.charAt(0).toUpperCase()+it.kind.slice(1)},{text:it.date},{text:it.subject},{text:it.from}] }));
  const list=docListHTML(cols,rows,sel);
  const actions=actionColHTML([{label:'Add Record…',act:'rec-add'},{label:'Attach File…',act:'rec-attach'},{sep:1},{label:'Open',default:1,act:'viewer'},{label:'Edit…',act:'rec-edit'},{sep:1},{label:'Remove…',act:'rec-remove'}]);
  const it=r.items[sel]||{};
  const detail=`<div class="ddetail" style="height:150px"><span class="legend">${esc(it.subject||'')}</span><div class="ddetail-body"><div class="dfields" style="flex:1">
    <div class="dfield" style="grid-template-columns:70px minmax(0,1fr)"><div class="k">Type</div><div class="v">${esc((it.kind||'').charAt(0).toUpperCase()+(it.kind||'').slice(1))}</div></div>
    <div class="dfield" style="grid-template-columns:70px minmax(0,1fr)"><div class="k">Date</div><div class="v">${esc(it.date||'')}</div></div>
    <div class="dfield" style="grid-template-columns:70px minmax(0,1fr)"><div class="k">From</div><div class="v">${esc(it.from||'')}</div></div>
    <div class="dfield-hr"></div><div style="line-height:1.4;white-space:normal">${esc(it.body||'')}</div>
  </div></div></div>`;
  const summary=`<div class="dsummary"><span><b>${r.items.length}</b> records</span><span class="grow"></span><div class="mbtn" data-dact="go-Activity">Activity</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${list}${actions}</div>${detail}${summary}</div>`;
}

/* ---------- TASKS (15) ---------- */
function tasksHead(p){ const t=p.ws.tasks||[]; const open=t.filter(x=>!x.done).length; return {subtitle:`${open} open, ${t.length-open} done`, right:''}; }
function tasksBody(p){
  const t=p.ws.tasks||[];
  const cols=[{label:'',w:'24px'},{label:'Task',w:'minmax(0,1fr)'},{label:'Due',w:'80px'},{label:'Status',w:'92px'}];
  const gtc=cols.map(c=>c.w).join(' ');
  const head=`<div class="dhead" style="grid-template-columns:${gtc}">`+cols.map(c=>`<div class="col">${esc(c.label)}</div>`).join('')+`</div>`;
  const tsel=getSel(p,'Tasks',0);
  const body=t.length? t.map((x,i)=>`<div class="drow${i===tsel?' sel':''}" data-drow="${i}" style="grid-template-columns:${gtc}"><div class="c center"><span class="lchk${x.done?' on':''}" data-task="${i}">${CHK_GREEN}</span></div><div class="c" style="${x.done&&i!==tsel?'color:#808080':''}">${esc(x.text)}</div><div class="c">${esc(x.due||'—')}</div><div class="c">${x.done?'Done':'Open'}</div></div>`).join('') : emptyState('No tasks yet.');
  const list=`<div class="dlist"><div class="dlist-inner">${head}${body}<div style="flex:1"></div></div>${DSCROLL}</div>`;
  const actions=actionColHTML([{label:'New Task…',default:1,act:'task-new'},{label:'Edit…',act:'task-edit'},{sep:1},{label:'Mark Done',act:'task-done'},{label:'Remove…',act:'task-remove'}]);
  const open=t.filter(x=>!x.done).length;
  const summary=`<div class="dsummary"><span><b>${open}</b> open</span><span class="sep">|</span><span>${t.length-open} done</span><span class="sep">|</span><span>${t.length} total</span><span class="grow"></span><div class="mbtn" data-dact="go-Overview">Overview</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${list}${actions}</div>${summary}</div>`;
}

/* ---------- ACTIVITY (16) ---------- */
function activityHead(p){ const a=p.ws.activity||[]; return {subtitle:'the full chronological record', right:`${a.length} entries`}; }
function activityBody(p){
  const a=p.ws.activity||[];
  const cols=[{label:'Date',w:'70px'},{label:'Entry',w:'minmax(0,1fr)'}];
  const gtc=cols.map(c=>c.w).join(' ');
  const head=`<div class="dhead" style="grid-template-columns:${gtc}"><div class="col">Date</div><div class="col">Entry</div></div>`;
  const body=a.length? a.map((e,i)=>`<div class="drow${i===getSel(p,'Activity',-1)?' sel':''}" data-drow="${i}" style="grid-template-columns:${gtc}"><div class="c" style="color:${i===getSel(p,'Activity',-1)?'#fff':'#404040'}">${esc(e.date||'')}</div><div class="c">${esc(e.text)}</div></div>`).join('') : emptyState('No activity yet.');
  const list=`<div class="dlist"><div class="dlist-inner">${head}${body}<div style="flex:1"></div></div>${DSCROLL}</div>`;
  const actions=actionColHTML([{label:'Add Note…',act:'act-note'},{sep:1},{label:'Print…',act:'print'},{label:'Export…',act:'act-export'}]);
  const summary=`<div class="dsummary"><span><b>${a.length}</b> entries</span><span class="sep">|</span><span style="color:#404040">Written by the program as things happen</span><span class="grow"></span><div class="mbtn" data-dact="go-Overview">Overview</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${list}${actions}</div>${summary}</div>`;
}

/* ---------- BILLING / PAYMENT (17) ---------- */
function billingHead(p){ const b=p.ws.billing; return {subtitle: b?b.status.split(' — ')[0].toLowerCase():'not billed', right: b&&b.dueDate?`Due ${b.dueDate}`:''}; }
function billingBody(p){
  const b=p.ws.billing||{invoiceAmount:p.value,billed:null,paid:null,status:'Not billed'};
  const value=p.value; const paid=b.paid||0; const billed=b.billed; const outstanding=value-paid;
  let lg='';
  lg+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 100px"><div class="t">Current project value</div><div class="r">${money(value)}</div></div>`;
  if(b.deposit) lg+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 100px"><div class="t">Deposit received ${esc(b.depositReceived||'')}</div><div class="r">−${money(b.deposit).slice(1)}</div></div>`;
  lg+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 100px"><div class="t">Final billing</div><div class="r">${billed!=null?money(billed):'—'}</div></div>`;
  lg+=`<div class="crow" style="grid-template-columns:minmax(0,1fr) 100px"><div class="t">Payments received</div><div class="r">${money(paid)}</div></div>`;
  lg+=`<div class="hr"></div><div class="crow bold" style="grid-template-columns:minmax(0,1fr) 100px"><div class="t">Outstanding</div><div class="r"><span style="font-size:13px">${money(outstanding)}</span></div></div>`;
  const box1=`<div class="cbox" style="width:460px;flex:none"><span class="legend">Money</span>${lg}<div style="flex:1"></div><div style="display:flex;gap:4px"><div class="wbtn" data-dact="bill-invoice">Upload Invoice…</div><div class="wbtn" data-dact="bill-payment">Record Payment…</div></div></div>`;
  const box2=`<div class="cbox" style="flex:1;min-width:0"><span class="legend">Status</span>
    <div class="ffield" style="grid-template-columns:110px minmax(0,1fr)"><div class="k">Status</div><div class="v">${esc(b.status)}</div></div>
    <div class="ffield" style="grid-template-columns:110px minmax(0,1fr)"><div class="k">Terms</div><div class="v" style="white-space:normal;line-height:1.35">${esc(b.terms||'—')}</div></div>
    <div class="ffield" style="grid-template-columns:110px minmax(0,1fr)"><div class="k">Invoice</div><div class="v">${b.invoice?esc(b.invoice):'— not raised yet'}</div></div>
    <div class="dfield-hr"></div><div style="color:#404040;line-height:1.4">Final billing is uploaded once installation is complete; the flag clears when it is filed.</div><div style="flex:1"></div></div>`;
  const summary=`<div class="dsummary"><span>Value <b>${money(value)}</b></span><span class="sep">|</span><span>Paid ${money(paid)}</span><span class="sep">|</span><span>Outstanding <b>${money(outstanding)}</b></span><span class="grow"></span><div class="mbtn" data-dact="go-Overview">Overview</div></div>`;
  return `<div class="docsec"><div class="costbtm" style="flex:1;height:auto">${box1}${box2}</div>${summary}</div>`;
}

/* ---------- CUSTOMER / CONTACTS (18) ---------- */
function customerHead(p){ const n=(p.ws.contacts||[]).length; return {subtitle:`${n} contact${n===1?'':'s'}`, right:''}; }
function customerBody(p){
  const contacts=p.ws.contacts||[];
  const others=state.projects.filter(x=>x.customer===p.customer && x.id!==p.id);
  const sel=getSel(p,'Customer',0);
  // contacts list
  const cols=[{label:'',w:'22px'},{label:'Name',w:'minmax(0,1fr)'},{label:'Role',w:'140px'},{label:'Phone',w:'120px'}];
  const rows=contacts.length? contacts.map(c=>({cells:[{html:SEC_ICON.card,center:true},{text:c.name+(c.primary?' ★':'')},{text:c.role},{text:c.phone}]})) : [];
  const list=contacts.length?docListHTML(cols,rows,sel):`<div class="dlist"><div class="dlist-inner">${emptyState('No contacts yet.')}</div>${DSCROLL}</div>`;
  const actions=actionColHTML([{label:'Add Contact…',act:'cust-add'},{label:'Edit…',act:'cust-edit'},{sep:1},{label:'Set Primary',act:'cust-primary'},{label:'Remove…',act:'cust-remove'}]);
  const c=contacts[sel]||{};
  const detail=`<div class="ddetail" style="height:120px"><span class="legend">${esc(p.customer)}</span><div class="ddetail-body"><div class="dfields" style="flex:1">
    <div class="dfield" style="grid-template-columns:70px minmax(0,1fr)"><div class="k">Contact</div><div class="v">${esc(c.name||'—')}${c.primary?' — primary':''}</div></div>
    <div class="dfield" style="grid-template-columns:70px minmax(0,1fr)"><div class="k">Role</div><div class="v">${esc(c.role||'')}</div></div>
    <div class="dfield" style="grid-template-columns:70px minmax(0,1fr)"><div class="k">Phone</div><div class="v">${esc(c.phone||'')}</div></div>
    <div class="dfield" style="grid-template-columns:70px minmax(0,1fr)"><div class="k">Email</div><div class="v">${esc(c.email||'')}</div></div>
  </div><div class="ffields" style="flex:1;min-width:0"><div class="k" style="color:#404040;margin-bottom:2px">Other projects for ${esc(p.customer)}</div>${others.length?others.map(o=>`<div class="ffield" style="grid-template-columns:82px minmax(0,1fr)"><div class="k">${esc(o.id)}</div><div class="v">${esc(short(o.title,26))}</div></div>`).join(''):'<div style="color:#808080">None</div>'}</div></div></div>`;
  const summary=`<div class="dsummary"><span><b>${p.customer}</b></span><span class="sep">|</span><span>${contacts.length} contacts</span><span class="sep">|</span><span>${others.length} other project${others.length===1?'':'s'}</span><span class="grow"></span><div class="mbtn" data-dact="go-Overview">Overview</div></div>`;
  return `<div class="docsec"><div class="docsec-main">${list}${actions}</div>${detail}${summary}</div>`;
}

/* ---------- action dispatch ---------- */
function selectedDoc(p, sec){
  const w=p.ws;
  if(sec==='Estimates'){ const a=w.estimates||[]; return a[getSel(p,sec,a.length-1)]; }
  if(sec==='POs'){ const a=w.pos||[]; const d=Math.max(0,a.findIndex(x=>x.active)); return a[getSel(p,sec,d<0?0:d)]; }
  if(sec==='ChangeOrders'){ const a=w.changeOrders||[]; return a[getSel(p,sec,a.length-1)]; }
  return null;
}
/* ---------- DOCUMENT VIEWER (Screen 05, child window) ---------- */
let viewState=null;   // { p, desc, page }
const PDF_PAGE = (hl)=>`<svg viewBox="0 0 612 792" style="shape-rendering:crispEdges;display:block;width:100%;height:100%"><rect width="612" height="792" fill="#fff"/><rect x="56" y="52" width="150" height="16" fill="#1d1f20"/><rect x="56" y="74" width="110" height="7" fill="#909090"/><rect x="56" y="86" width="132" height="7" fill="#909090"/><rect x="400" y="52" width="156" height="9" fill="#606060"/><rect x="400" y="66" width="156" height="7" fill="#909090"/><rect x="56" y="112" width="500" height="2" fill="#1d1f20"/><rect x="56" y="176" width="500" height="14" fill="#dfe4e9"/>${Array.from({length:11}).map((_,i)=>{const y=198+i*20;return `<rect x="62" y="${y}" width="${120+((i*37)%120)}" height="7" fill="#505050"/><rect x="400" y="${y}" width="44" height="7" fill="#707070"/><rect x="496" y="${y}" width="54" height="7" fill="#505050"/><rect x="56" y="${y+13}" width="500" height="1" fill="#e6e6e6"/>`;}).join('')}<rect x="360" y="438" width="196" height="2" fill="#1d1f20"/><rect x="380" y="484" width="96" height="10" fill="#1d1f20"/><rect x="478" y="484" width="72" height="10" fill="#1d1f20"/><rect x="56" y="530" width="140" height="8" fill="#606060"/>${Array.from({length:6}).map((_,i)=>`<rect x="56" y="${548+i*13}" width="${470-((i%2)*60)}" height="6" fill="#a0a0a0"/>`).join('')}</svg>`;
function viewDescriptor(p, sec, doc){
  if(!doc) return null;
  if(sec==='Estimates') return { file:doc.file||doc.id+'.pdf', kindLabel:`Estimate ${doc.id}`, sub:`${money(doc.amount)}${doc.date?' · issued '+doc.date:''}${doc.kind==='revision'?' · revision of '+(doc.id.split(' ')[0]):''}`, isCurrent:!!doc.accepted||!!doc.sent, status:doc.accepted?'accepted':(doc.sent?'current — awaiting response':'on file'), pages:doc.pages||3, sizeMB:((doc.sizeKB||900)/1024).toFixed(1),
    info:[['Estimate',doc.id],['Amount',money(doc.amount)],['Issued',doc.date||'—'],['Status',doc.status],['Uploaded',doc.uploaded||'—'],['File',`${doc.pages||3} pages · ${((doc.sizeKB||900)/1024).toFixed(1)} MB`]], versions:'estimates', note:doc.purpose||doc.record||'', estBtns:true, docType:'estimate' };
  if(sec==='POs') return { file:doc.file||doc.number+'.pdf', kindLabel:`Purchase Order ${doc.number}`, sub:`${money(doc.amount)}${doc.received&&doc.received!=='—'?' · received '+doc.received:''}`, isCurrent:!!doc.active, status:doc.active?'active':'on file', pages:doc.pages||2, sizeMB:((doc.sizeKB||210)/1024).toFixed(1),
    info:[['PO number',doc.number],['Amount',money(doc.amount)],['Received',doc.received||'—'],['Answers',doc.answers||'—'],['Status',doc.statusDetail||doc.status],['File',`${doc.pages||2} pages`]], note:doc.note||'' };
  if(sec==='ChangeOrders') return { file:doc.document||('CO-'+doc.n+'.pdf'), kindLabel:`Change Order ${doc.n}`, sub:`${signedMoney(doc.amount)} · ${doc.date||''}`, isCurrent:false, status:doc.status, pages:doc.pages||1, sizeMB:((doc.sizeKB||96)/1024).toFixed(1),
    info:[['Description',doc.description],['Amount',signedMoney(doc.amount)],['Requested',doc.requested||'—'],['Status',doc.status]], note:doc.note||'' };
  if(sec==='Documents') return { file:doc.name, kindLabel:doc.name, sub:`${doc.cat} · ${doc.uploaded}`, isCurrent:false, status:doc.cat, pages:3, sizeMB:(doc.size||'').replace(' MB',''),
    info:[['Name',doc.name],['Category',doc.cat],['Uploaded',`${doc.uploaded} by ${doc.by}`],['Size',doc.size]], note:'' };
  if(sec==='Records') return { file:doc.subject, kindLabel:doc.subject, sub:`${(doc.kind||'').replace(/^./,c=>c.toUpperCase())} · ${doc.date}`, isCurrent:false, status:doc.kind, pages:1, sizeMB:'0.1',
    info:[['Type',doc.kind],['Date',doc.date],['From',doc.from]], note:doc.body||'' };
  if(sec==='Photos') return { file:(doc.name||'photos')+'.jpg', kindLabel:doc.name, sub:`${doc.count} photos · ${doc.date}`, isCurrent:false, status:'photo', photo:true, pages:doc.count||1, sizeMB:'2.1', info:[['Category',doc.name],['Photos',doc.count],['Latest',doc.date]], note:'' };
  if(sec==='Site') return { file:doc.name, kindLabel:doc.name, sub:doc.date||'', isCurrent:false, status:doc.kind, photo:doc.kind==='photo', pages:1, sizeMB:'1.0', info:[['Name',doc.name],['Kind',doc.kind]], note:'' };
  return null;
}
function docForSection(p, sec){
  const w=p.ws;
  if(sec==='Estimates') return selectedDoc(p,sec);
  if(sec==='POs') return selectedDoc(p,sec);
  if(sec==='ChangeOrders') return selectedDoc(p,sec);
  if(sec==='Documents'){ const a=(w.docs&&w.docs.files)||[]; return a[getSel(p,'Documents',0)]; }
  if(sec==='Records'){ const a=(w.records&&w.records.items)||[]; return a[getSel(p,'Records',0)]; }
  if(sec==='Photos'){ const a=(w.photoAlbum&&w.photoAlbum.categories)||[]; return a[getSel(p,'Photos',0)]; }
  if(sec==='Site'){ const f=siteFlat(p); return (f[getSel(p,'Site',0)]||{}).node; }
  return null;
}
function openViewer(p, sec, doc){
  doc = doc || docForSection(p, sec);
  const desc = viewDescriptor(p, sec, doc);
  if(!desc){ return notBuilt('The document viewer'); }
  viewState={p, sec, desc, page:1};
  renderViewer();
}
function renderViewer(){
  const {p, sec, desc, page}=viewState;
  const pages=desc.pages||1;
  const thumbs=Array.from({length:Math.min(pages,6)}).map((_,i)=>`<div style="display:flex;flex-direction:column;align-items:center;gap:2px"><div data-vpage="${i+1}" style="width:74px;height:96px;background:#fff;overflow:hidden;${i+1===page?'outline:2px solid #000080;outline-offset:-2px;':''}box-shadow:inset 1px 1px #808080,inset -1px -1px #fff,inset 2px 2px #0a0a0a,inset -2px -2px #dfdfdf">${desc.photo?PH_SVG:PDF_PAGE()}</div><div style="${i+1===page?'background:#000080;color:#fff;padding:0 4px':'color:#404040'}">${i+1}</div></div>`).join('');
  const infoRows=(desc.info||[]).map(([k,v])=>`<div class="ffield" style="grid-template-columns:64px minmax(0,1fr)"><div class="k">${esc(k)}</div><div class="v">${esc(String(v))}</div></div>`).join('');
  let versionsBox='';
  if(desc.versions==='estimates'){
    const ests=p.ws.estimates||[];
    versionsBox=`<div class="fbox" style="flex:none"><span class="legend">Other versions</span>`+ests.slice().reverse().map(e=>{
      const isThis=('Estimate '+e.id)===desc.kindLabel; const st=e.accepted?'accepted':(e.sent?'current':(/Superseded/i.test(e.status)?'superseded':'on file'));
      return `<div class="crow" style="grid-template-columns:minmax(0,1fr) 58px 66px;${isThis?'background:#000080;color:#fff':(/superseded/.test(st)?'color:#808080':'')}"><div class="t" style="padding:0 4px">${esc(e.id)}</div><div class="r" style="padding:0 4px">${money(e.amount)}</div><div class="t" style="padding:0 4px">${st}</div></div>`;
    }).join('')+`<div style="margin-top:5px;display:flex;gap:4px"><div class="wbtn" data-vact="open-selected" style="width:100px">Open selected</div><div class="wbtn" data-vact="compare" style="width:100px">Compare two…</div></div></div>`;
  }
  const capBtns = desc.estBtns ? `<div class="wbtn" data-vact="mark-accepted" style="width:96px">Mark Accepted</div><div class="wbtn" data-vact="upload-revision" style="width:100px">Upload Revision</div><div class="wbtn" data-vact="compare" style="width:76px">Compare…</div>` : '';
  const preview = desc.photo
    ? `<div style="width:70%;max-width:520px;aspect-ratio:4/3;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:2px 2px 0 rgba(0,0,0,.35)">${PH_SVG.replace('width="28" height="28"','width="120" height="120"')}</div>`
    : `<div style="width:64%;max-width:482px;background:#fff;box-shadow:2px 2px 0 rgba(0,0,0,.35)">${PDF_PAGE()}</div>`;
  const toolbar=`<div class="toolbar"><div class="tool icon" data-vact="prev">◀</div><div class="tool icon" data-vact="next">▶</div><div style="display:flex;align-items:center;gap:4px;margin:0 6px"><div class="textbox" style="width:34px;height:19px;justify-content:center">${page}</div><span>of ${pages}</span></div><div class="tsep"></div><div class="tool" data-vact="fit">Fit page</div><div class="tool" data-vact="fitw">Fit width</div><div class="tsep"></div><div class="tool" data-vact="print">Print…</div><div class="tool" data-vact="ext">Open Externally</div><div class="tool" data-vact="save">Save a Copy…</div><span style="flex:1"></span><div class="tool" data-vact="close">Close</div></div><div class="rule"></div>`;
  const caption=`<div class="ws-pane-head" style="flex:none"><span class="ttl">${esc(desc.kindLabel)}</span><span class="meta" style="margin-left:8px">${esc(desc.sub||'')}</span>${desc.isCurrent?`<span style="margin-left:8px;background:var(--navy);color:#fff;font-weight:700;padding:1px 6px">CURRENT</span>`:''}<span style="flex:1"></span>${capBtns}</div>`;
  const statusbar=`<div class="statusbar"><div class="sb grow">Page ${page} of ${pages} — Esc returns to the project.</div><div class="sb" style="width:150px">Letter · 8.5 × 11 in</div><div class="sb" style="width:130px">${desc.sizeMB} MB · 100%</div></div>`;
  const html = childTitleBar(SEC_ICON.docR, `${desc.file} — Document Viewer — [${p.id} ${p.title}]`)+
    childMenuBar(['<u>F</u>ile','<u>E</u>dit','<u>V</u>iew','<u>D</u>ocument','<u>W</u>indow','<u>H</u>elp'])+
    toolbar+caption+
    `<div style="flex:1;min-height:0;display:flex;gap:0;padding:3px;background:var(--face)">`+
      `<div style="width:98px;flex:none;display:flex;flex-direction:column;gap:6px;padding:5px 4px;overflow:auto;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff,inset 2px 2px #0a0a0a,inset -2px -2px #dfdfdf">${thumbs}</div>`+
      `<div style="width:4px;flex:none"></div>`+
      `<div style="flex:1;min-width:0;display:flex;justify-content:center;align-items:flex-start;padding:8px;overflow:auto;background:#808080;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff,inset 2px 2px #0a0a0a,inset -2px -2px #dfdfdf">${preview}</div>`+
      `<div style="width:4px;flex:none"></div>`+
      `<div style="width:236px;flex:none;display:flex;flex-direction:column;gap:6px">`+
        `<div class="fbox" style="flex:none"><span class="legend">This document</span>${infoRows}</div>`+
        versionsBox+
        `<div class="fbox" style="flex:1;min-height:0"><span class="legend">Notes</span><div style="height:100%;padding:3px 4px;background:#fff;line-height:1.4;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff,inset 2px 2px #0a0a0a,inset -2px -2px #dfdfdf">${esc(desc.note||'—')}</div></div>`+
      `</div>`+
    `</div>`+statusbar;
  const ov=openFullWindow(html);
  $$('[data-vact]', ov).forEach(b=> b.addEventListener('mouseup', ()=> viewerAction(b.dataset.vact)));
  $$('[data-eact="close"]', ov).forEach(b=> b.addEventListener('mouseup', ()=> viewerAction('close')));
  $$('[data-vpage]', ov).forEach(t=> t.addEventListener('click', ()=>{ viewState.page=+t.dataset.vpage; renderViewer(); }));
}
function viewerAction(act){
  const {p, sec, desc, page}=viewState; const pages=desc.pages||1;
  switch(act){
    case 'close': closeFullWindow(); render(); return;
    case 'prev': if(page>1){ viewState.page--; renderViewer(); } return;
    case 'next': if(page<pages){ viewState.page++; renderViewer(); } return;
    case 'mark-accepted': { const doc=docForSection(p,'Estimates'); closeFullWindow(); if(doc && !doc.accepted) openMarkAccepted(p, doc); else render(); return; }
    case 'upload-revision': closeFullWindow(); return openUploadEstimate(p,'revision');
    case 'fit': case 'fitw': case 'print': case 'ext': case 'save': case 'compare': case 'open-selected':
      return notBuilt('This viewer action');
  }
}

function docAction(p, sec, act){
  if(act.startsWith('go-')) return setSection(p.id, act.slice(3));
  if(/^(ship|photo|site|prog|comp)-/.test(act)) return fieldAction(p, sec, act);
  if(/^(doc|rec|task|act|bill|cust)-/.test(act)) return recordAction(p, sec, act);
  const doc=selectedDoc(p,sec);
  switch(act){
    case 'change-orders': return setSection(p.id,'ChangeOrders');
    case 'open': case 'viewer': return openViewer(p, sec, doc);
    case 'print': case 'save': case 'resend': case 'terms':
      return notBuilt('This action');
    case 'upload-estimate': return openUploadEstimate(p,'version');
    case 'upload-revision': return openUploadEstimate(p,'revision');
    case 'mark-accepted': return doc?openMarkAccepted(p,doc):null;
    case 'upload-po': return openUploadPO(p,false);
    case 'upload-revised-po': return openUploadPO(p,true);
    case 'record-request': { const o=selectedDoc(p,sec); return formDialog('Record Request', [
        {id:'what',label:'Requested',value:sec==='POs'?'Revised PO':'Revision',required:true},{id:'date',label:'On',value:fmtToday(),width:110},{id:'note',label:'Note'}
      ], v=>{ if(o){ o.statusDetail=`${o.status||'Active'} — ${v.what} requested ${v.date}`; } logActivity(p,`${v.what} requested — ${v.date}${v.note?' ('+v.note+')':''}`); refreshWS(p); }); }
    case 'resend': { const e=selectedDoc(p,sec); if(!e) return; return formDialog('Resend', [
        {id:'to',label:'Send to',value:e.sentTo||(p.contact?p.contact.name:''),required:true},{id:'date',label:'On',value:fmtToday(),width:110}
      ], v=>{ e.sent=true; e.sentTo=v.to; e.sentDate=v.date; e.status=`Sent ${v.date} — awaiting response`; logActivity(p,`${e.id} resent to ${v.to}`); refreshWS(p); }); }
    case 'terms': { const o=selectedDoc(p,sec); if(!o) return; return formDialog('PO Terms', [
        {id:'terms',label:'Terms',value:o.terms||'',type:'textarea',h:44}
      ], v=>{ o.terms=v.terms; refreshWS(p); }); }
    case 'add-co': return openAddChangeOrder(p);
    case 'upload-doc': return openUploadDoc(p);
    case 'upload-signed': { const c=selectedDoc(p,sec); return formDialog('Upload Signed Copy', [
        {id:'name',label:'File name',value:c?`CO-${c.n} signed.pdf`:'signed.pdf',required:true}
      ], v=>{ if(c) c.document=v.name; if(p.ws.docs) p.ws.docs.files.unshift({name:v.name,cat:'Signed documents',uploaded:fmtToday(),size:'0.3 MB',by:state.user,kind:'pdf'}); logActivity(p,`Signed copy uploaded — ${v.name}`); refreshWS(p); }); }
    case 'mark-approved': return doc?openApproveCO(p,doc):null;
    case 'mark-declined': return doc?declineCO(p,doc):null;
    case 'remove': return doc?removeDoc(p,sec,doc):null;
    // cost breakdowns (04a list)
    case 'cost-estimates': return setSection(p.id,'Estimates');
    case 'cost-open': return openCostEditor(p, selectedBreakdown(p));
    case 'cost-new': return costNew(p, null);
    case 'cost-copy': return costNew(p, selectedBreakdown(p));
    case 'cost-make-current': return costMakeCurrent(p, selectedBreakdown(p));
    case 'cost-send-estimate': return openSendToEstimate(p, selectedBreakdown(p));
    case 'cost-remove-bd': { const bd=selectedBreakdown(p); if(!bd) return;
      if(bd.id===p.ws.cost.current){ return notBuilt('Remove the current breakdown'); }
      return messageBox('Remove', ICON.question, `Remove <b>${esc(bd.id)}</b>?`, ['Yes','No'], a=>{ if(a==='Yes'){ const i=p.ws.cost.breakdowns.indexOf(bd); p.ws.cost.breakdowns.splice(i,1); uiSel[selKey(p,'CostBreakdown')]=0; logActivity(p,`Removed ${bd.id}`); saveState(); render(); } }); }
    case 'cost-compare': case 'cost-template':
      return notBuilt(act==='cost-compare'?'Compare breakdowns':'This action');
  }
}
/* ---- record-group actions ---- */
function recordAction(p, sec, act){
  const w=p.ws;
  switch(act){
    // tasks
    case 'task-new': return openNewTask(p);
    case 'task-edit': { const t=selTask(p); if(!t) return; return formDialog('Edit Task', [{id:'text',label:'Task',value:t.text,required:true},{id:'due',label:'Due',value:t.due||'',width:110}], o=>{ t.text=o.text; t.due=o.due; refreshWS(p); }); }
    case 'task-done': { const t=selTask(p); if(t){ t.done=!t.done; logActivity(p,`Task ${t.done?'completed':'reopened'} — ${t.text}`); refreshWS(p); } return; }
    case 'task-remove': { const t=selTask(p); if(!t) return; return messageBox('Remove Task', ICON.question, `Remove <b>${esc(t.text)}</b>?`, ['Yes','No'], a=>{ if(a==='Yes'){ w.tasks.splice(w.tasks.indexOf(t),1); uiSel[selKey(p,'Tasks')]=0; refreshWS(p); } }); }
    // activity
    case 'act-note': return openActNote(p);
    case 'act-export': return exportText(`${p.id} — Activity`, (w.activity||[]).map(a=>`${a.date||''}\t${a.text}`).join('\n'));
    // billing
    case 'bill-payment': return openRecordPayment(p);
    case 'bill-invoice': { const b=w.billing||(w.billing={invoiceAmount:p.value,paid:0,status:'Not billed'}); return formDialog('Upload Invoice', [
      {id:'num',label:'Invoice #',value:b.invoice||(p.id.replace('BPC-','INV-')),required:true},{id:'amount',label:'Amount',value:money(b.invoiceAmount||p.value),width:110},{id:'date',label:'Dated',value:fmtToday(),width:110},{id:'file',label:'File',placeholder:'(metadata only)'}
    ], o=>{ b.invoice=o.num; b.billed=parseMoney(o.amount); b.status='Billed — awaiting payment'; b.dueDate=plusDays(o.date,30);
      if(w.docs){ w.docs.files.unshift({name:`${o.num}.pdf`,cat:'Final documents',uploaded:o.date,size:'0.2 MB',by:state.user,kind:'pdf'}); }
      if(p.alert && /billing/i.test(p.alert.kind||'')) p.alert=null; logActivity(p,`Final invoice ${o.num} uploaded — ${money(b.billed)}`); refreshWS(p); }, {hint:'Files the invoice and marks the project billed.'}); }
    // documents
    case 'doc-upload': return openUploadDoc(p);
    case 'doc-set': { const f=selDoc(p); if(!f) return; return formDialog('Set Category', [{id:'cat',label:'Category',type:'select',options:['Contracts','Signed documents','Drawings','Specifications','Inspection','Change orders','Final documents','Other'],value:f.cat}], o=>{ f.cat=o.cat; refreshWS(p); }); }
    case 'doc-rename': { const f=selDoc(p); if(!f) return; return formDialog('Rename', [{id:'name',label:'Name',value:f.name,required:true}], o=>{ f.name=o.name; refreshWS(p); }); }
    case 'doc-remove': { const f=selDoc(p); if(!f) return; return messageBox('Remove', ICON.question, `Remove <b>${esc(f.name)}</b>?`, ['Yes','No'], a=>{ if(a==='Yes'){ w.docs.files.splice(w.docs.files.indexOf(f),1); uiSel[selKey(p,'Documents')]=0; logActivity(p,`Document removed — ${f.name}`); refreshWS(p); } }); }
    case 'doc-cat': return formDialog('New Category', [{id:'name',label:'Name',required:true}], ()=>{ notBuilt; refreshWS(p); });
    // project records
    case 'rec-add': return openRecord(p, null);
    case 'rec-edit': { const r=selRecord(p); return r?openRecord(p,r):null; }
    case 'rec-attach': { const r=selRecord(p); if(!r) return; return formDialog('Attach File', [{id:'name',label:'File name',required:true}], o=>{ r.attachment=o.name; logActivity(p,`File attached to record — ${o.name}`); refreshWS(p); }); }
    case 'rec-remove': { const r=selRecord(p); if(!r) return; return messageBox('Remove', ICON.question, `Remove <b>${esc(r.subject)}</b>?`, ['Yes','No'], a=>{ if(a==='Yes'){ w.records.items.splice(w.records.items.indexOf(r),1); uiSel[selKey(p,'Records')]=0; refreshWS(p); } }); }
    // customer / contacts
    case 'cust-add': return openContact(p, null);
    case 'cust-edit': { const c=selContact(p); return c?openContact(p,c):null; }
    case 'cust-primary': { const c=selContact(p); if(c){ (w.contacts||[]).forEach(x=>x.primary=false); c.primary=true; if(!p.contact) p.contact={}; p.contact={name:c.name,role:c.role,phone:c.phone}; logActivity(p,`Primary contact set — ${c.name}`); refreshWS(p); } return; }
    case 'cust-remove': { const c=selContact(p); if(!c) return; return messageBox('Remove', ICON.question, `Remove contact <b>${esc(c.name)}</b>?`, ['Yes','No'], a=>{ if(a==='Yes'){ w.contacts.splice(w.contacts.indexOf(c),1); uiSel[selKey(p,'Customer')]=0; refreshWS(p); } }); }
    default: return notBuilt('This action');
  }
}
function selTask(p){ const a=p.ws.tasks||[]; return a[getSel(p,'Tasks',0)]; }
function selDoc(p){ const a=(p.ws.docs&&p.ws.docs.files)||[]; return a[getSel(p,'Documents',0)]; }
function selRecord(p){ const a=(p.ws.records&&p.ws.records.items)||[]; return a[getSel(p,'Records',0)]; }
function selContact(p){ const a=p.ws.contacts||[]; return a[getSel(p,'Customer',0)]; }
function openUploadDoc(p, defaultCat){
  if(!p.ws.docs) p.ws.docs={totalMB:0,files:[],filedFrom:[]};
  return formDialog('Upload Document', [
    {id:'name',label:'File name',required:true,placeholder:'e.g. Signed contract.pdf'},
    {id:'cat',label:'Category',type:'select',options:['Contracts','Signed documents','Drawings','Specifications','Inspection','Change orders','Final documents','Other'],value:defaultCat||'Other'},
    {id:'size',label:'Size',value:'0.4 MB',width:90}
  ], o=>{ p.ws.docs.files.unshift({name:o.name,cat:o.cat,uploaded:fmtToday(),size:o.size,by:state.user,kind:/\.(jpg|png|photo)/i.test(o.name)?'photo':'pdf'}); uiSel[selKey(p,'Documents')]=0; logActivity(p,`Document uploaded — ${o.name}`); refreshWS(p); }, {hint:'Files the document against the project (metadata only).', icon:TB.upload});
}
function openRecord(p, existing){
  if(!p.ws.records) p.ws.records={items:[]};
  return formDialog(existing?'Edit Record':'Add Project Record', [
    {id:'kind',label:'Type',type:'select',options:['Email','Note','Screenshot','Instruction','Meeting'],value:existing?existing.kind.replace(/^./,c=>c.toUpperCase()):'Note'},
    {id:'subject',label:'Subject',value:existing?existing.subject:'',required:true},
    {id:'from',label:'From',value:existing?existing.from:state.user},
    {id:'date',label:'Date',value:existing?existing.date:fmtToday(),width:110},
    {id:'body',label:'Body',type:'textarea',value:existing?existing.body:'',h:56}
  ], o=>{ const rec={kind:o.kind.toLowerCase(),subject:o.subject,from:o.from,date:o.date,body:o.body}; if(existing) Object.assign(existing,rec); else { p.ws.records.items.unshift(rec); uiSel[selKey(p,'Records')]=0; } logActivity(p,`Record ${existing?'edited':'added'} — ${o.subject}`); refreshWS(p); }, {width:400});
}
function openContact(p, existing){
  if(!p.ws.contacts) p.ws.contacts=[];
  return formDialog(existing?'Edit Contact':'Add Contact', [
    {id:'name',label:'Name',value:existing?existing.name:'',required:true},
    {id:'role',label:'Role',value:existing?existing.role:''},
    {id:'phone',label:'Phone',value:existing?existing.phone:''},
    {id:'email',label:'Email',value:existing?existing.email:''}
  ], o=>{ if(existing) Object.assign(existing,o); else { p.ws.contacts.push(o); uiSel[selKey(p,'Customer')]=p.ws.contacts.length-1; } logActivity(p,`Contact ${existing?'edited':'added'} — ${o.name}`); refreshWS(p); });
}
function sectionExport(p, sec){
  const w=p.ws;
  if(sec==='Estimates') return (w.estimates||[]).map(e=>[e.id,e.date,money(e.amount),e.status].join('\t')).join('\n');
  if(sec==='POs') return (w.pos||[]).map(o=>[o.number,o.received,money(o.amount),o.status].join('\t')).join('\n');
  if(sec==='ChangeOrders') return (w.changeOrders||[]).map(c=>['CO '+c.n,c.date,signedMoney(c.amount),c.status].join('\t')).join('\n');
  if(sec==='Shipping') return (w.shipping?w.shipping.shipments:[]).map(s=>[s.n,s.carrier,s.bol||'—',s.status,s.storedAt||'—'].join('\t')).join('\n');
  if(sec==='Documents') return (w.docs?w.docs.files:[]).map(f=>[f.name,f.cat,f.uploaded,f.size].join('\t')).join('\n');
  if(sec==='Records') return (w.records?w.records.items:[]).map(r=>[r.kind,r.date,r.subject,r.from].join('\t')).join('\n');
  if(sec==='Tasks') return (w.tasks||[]).map(t=>[t.done?'[x]':'[ ]',t.text,t.due||''].join('\t')).join('\n');
  if(sec==='Activity') return (w.activity||[]).map(a=>[a.date||'',a.text].join('\t')).join('\n');
  return `${p.id}\t${p.title}\n${p.customer}\n${p.stage} · ${p.status}\nValue ${money(p.value)}`;
}
function openOptions(){
  formDialog('Options', [{id:'user',label:'User name',value:state.user,required:true}], o=>{ state.user=o.user; saveState(); render(); });
}
function exportText(title, text){
  const body=el('div');
  body.innerHTML=`<div class="dlg-title"><span class="dlg-title-text">${esc(title)}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:460px"><div style="color:#404040;margin-bottom:6px">Select all and copy (Ctrl+A, Ctrl+C).</div><div class="tinput"><textarea class="ta" id="ex-text" style="height:180px" readonly>${esc(text||'(empty)')}</textarea></div>
    <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="ex-ok"><span>Close</span></button></div></div>`;
  const dlg=openDialog(body,460,300); const close=()=>closeDialog();
  $('#ex-ok',dlg).addEventListener('click',close); $('[data-role="x"]',dlg).addEventListener('click',close);
  dlg.addEventListener('keydown',e=>{ if(e.key==='Escape'){e.preventDefault();close();} });
  setTimeout(()=>{ const t=$('#ex-text',dlg); t.focus(); t.select(); },0);
}
function openActNote(p){
  const body=el('div');
  body.innerHTML=`<div class="dlg-title"><span class="dlg-title-text">Add Activity Note</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:400px"><div class="tinput"><textarea class="ta" id="an-text" style="height:56px"></textarea></div>
    <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="an-ok"><span>Add</span></button><button class="btn dlgbtn" id="an-cancel">Cancel</button></div></div>`;
  const dlg=openDialog(body,400,170); const close=()=>closeDialog();
  $('#an-cancel',dlg).addEventListener('click',close); $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#an-ok',dlg).addEventListener('click',()=>{ const t=$('#an-text',dlg).value.trim(); if(t){ logActivity(p,t); saveState(); renderWorkspace(); } close(); });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Escape'){e.preventDefault();close();} });
  setTimeout(()=>$('#an-text',dlg).focus(),0);
}
function openRecordPayment(p){
  const b=p.ws.billing||(p.ws.billing={invoiceAmount:p.value,paid:0,status:'Not billed'});
  const body=el('div');
  body.innerHTML=`<div class="dlg-title"><span class="dlg-title-text">Record Payment</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:320px">
      <div class="frow" style="grid-template-columns:100px 1fr"><label>Amount</label><div class="tinput" style="width:120px"><input id="rp-amt" type="text" placeholder="$0"></div></div>
      <div class="frow" style="grid-template-columns:100px 1fr"><label>Received on</label><div class="tinput" style="width:120px"><input id="rp-date" type="text" value="${esc(fmtToday())}"></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="rp-ok"><span>Record</span></button><button class="btn dlgbtn" id="rp-cancel">Cancel</button></div>
    </div>`;
  const dlg=openDialog(body,320,170); const close=()=>closeDialog();
  $('#rp-cancel',dlg).addEventListener('click',close); $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#rp-ok',dlg).addEventListener('click',()=>{ const amt=parseMoney($('#rp-amt',dlg).value); if(amt>0){ b.paid=(b.paid||0)+amt; if(b.paid>=p.value){ b.status='Paid in full'; } logActivity(p,`Payment recorded — ${money(amt)}`); saveState(); render(); } close(); });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#rp-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
  setTimeout(()=>$('#rp-amt',dlg).focus(),0);
}

/* ---- field actions ---- */
function selShipment(p){ const s=p.ws.shipping; if(!s) return null; const d=s.shipments.findIndex(x=>x.flag); return s.shipments[getSel(p,'Shipping',d>=0?d:0)]; }
function fieldAction(p, sec, act){
  const sh=()=>selShipment(p);
  switch(act){
    case 'ship-add': return openAddShipment(p);
    case 'ship-receipt': { const s=sh(); return s?openRecordReceipt(p,s):null; }
    case 'ship-call': { const s=sh(); if(!s) return; return formDialog(`Record Call — Shipment ${s.n}`, [
      {id:'call',label:'Call received',value:fmtToday(),width:120},{id:'detail',label:'Detail',value:'',placeholder:'window offered, notes…'}
    ], o=>{ s.call=o.call; s.callReceived=`${o.call}${o.detail?' — '+o.detail:''}`; if(s.state==='notshipped'||!s.state) s.state='awaiting'; if(s.status.startsWith('Not shipped')) s.status='Awaiting carrier call'; (s.log=s.log||[]).unshift({date:o.call,event:'Call received',detail:o.detail||'Carrier called'}); logActivity(p,`Shipment ${s.n} — carrier call recorded`); refreshWS(p); }); }
    case 'ship-schedule': { const s=sh(); if(!s) return; return formDialog(`Schedule Delivery — Shipment ${s.n}`, [
      {id:'date',label:'Scheduled',value:fmtToday(),width:120},{id:'window',label:'Window',value:'8:00–12:00',width:140},{id:'where',label:'Deliver to',type:'select',options:['Main lot','Site'],value:s.storedAt||'Main lot'}
    ], o=>{ s.scheduled=`${o.date.replace(/\/\d\d$/,'')} ${o.window}`.trim(); s.scheduledFull=`${o.date}, ${o.window}`; s.state='scheduled'; s.status='Scheduled'; s.storedAt=o.where; (s.log=s.log||[]).unshift({date:o.date,event:'Scheduled',detail:`${o.date}, ${o.window}`}); logActivity(p,`Shipment ${s.n} scheduled ${o.date}`); refreshWS(p); }); }
    case 'ship-store': { const s=sh(); if(!s) return; return formDialog(`Storage Location — Shipment ${s.n}`, [
      {id:'loc',label:'Stored at',value:s.storedFull||s.storedAt||'Main lot',required:true}
    ], o=>{ s.storedAt=o.loc; s.storedFull=o.loc; (s.log=s.log||[]).unshift({date:fmtToday(),event:'Stored',detail:o.loc}); logActivity(p,`Shipment ${s.n} storage set — ${o.loc}`); refreshWS(p); }); }
    case 'ship-log': { const s=sh(); if(!s) return; return formDialog(`Add Log Entry — Shipment ${s.n}`, [
      {id:'date',label:'Date',value:fmtToday(),width:120},{id:'event',label:'Event',value:'',required:true},{id:'detail',label:'Detail',value:''}
    ], o=>{ (s.log=s.log||[]).push({date:o.date,event:o.event,detail:o.detail}); logActivity(p,`Shipment ${s.n} log — ${o.event}`); refreshWS(p); }); }
    case 'ship-remove': { const s=sh(); if(!s) return; return messageBox('Remove Shipment', ICON.question, `Remove <b>Shipment ${s.n}</b>?`, ['Yes','No'], a=>{ if(a==='Yes'){ const arr=p.ws.shipping.shipments; arr.splice(arr.indexOf(s),1); uiSel[selKey(p,'Shipping')]=0; logActivity(p,`Shipment ${s.n} removed`); refreshWS(p); } }); }
    case 'ship-photos': { const s=sh(); return openUploadPhotos(p, 'Delivery', n=>{ if(s) s.photos=(s.photos||0)+n; }); }
    // photos
    case 'photo-upload': return openUploadPhotos(p);
    case 'photo-cat': return formDialog('New Category', [{id:'name',label:'Name',required:true}], o=>{ p.ws.photoAlbum.categories.push({name:o.name,date:fmtToday(),count:0}); logActivity(p,`Photo category added — ${o.name}`); refreshWS(p); });
    case 'photo-set': { const c=selPhotoCat(p); if(!c) return; return formDialog('Rename Category', [{id:'name',label:'Name',value:c.name,required:true}], o=>{ c.name=o.name; logActivity(p,`Photo category renamed — ${o.name}`); refreshWS(p); }); }
    case 'photo-remove': { const c=selPhotoCat(p); if(!c) return; return messageBox('Remove', ICON.question, `Remove category <b>${esc(c.name)}</b> and its ${c.count} photos?`, ['Yes','No'], a=>{ if(a==='Yes'){ const arr=p.ws.photoAlbum.categories; arr.splice(arr.indexOf(c),1); uiSel[selKey(p,'Photos')]=0; logActivity(p,`Photo category removed — ${c.name}`); refreshWS(p); } }); }
    // site
    case 'site-upload': return formDialog('Upload to Site', [
      {id:'name',label:'File name',required:true,placeholder:'e.g. Site plan REV C.pdf'},{id:'group',label:'Group',type:'select',options:(p.ws.site.items||[]).map(g=>g.name)},{id:'kind',label:'Kind',type:'select',options:['Document','Photo']}
    ], o=>{ const g=(p.ws.site.items||[]).find(x=>x.name===o.group)||p.ws.site.items[0]; (g.children=g.children||[]).push({name:o.name,kind:o.kind==='Photo'?'photo':'pdf',date:fmtToday()}); logActivity(p,`Site file added — ${o.name}`); refreshWS(p); }, {hint:'Records the file against the project (metadata).'});
    case 'site-group': return formDialog('New Site Group', [{id:'name',label:'Name',required:true}], o=>{ p.ws.site.items.push({name:o.name,kind:'folder',children:[]}); logActivity(p,`Site group added — ${o.name}`); refreshWS(p); });
    case 'site-rename': { const f=selSiteNode(p); if(!f) return; return formDialog('Rename', [{id:'name',label:'Name',value:f.node.name,required:true}], o=>{ f.node.name=o.name; refreshWS(p); }); }
    case 'site-remove': { const f=selSiteNode(p); if(!f||f.group) return notBuilt('Remove a group'); const g=p.ws.site.items[f.gi]; return messageBox('Remove', ICON.question, `Remove <b>${esc(f.node.name)}</b>?`, ['Yes','No'], a=>{ if(a==='Yes'){ g.children.splice(f.ii,1); uiSel[selKey(p,'Site')]=0; refreshWS(p); } }); }
    // progress
    case 'prog-event': return formDialog('Add Installation Event', [
      {id:'date',label:'Date',value:fmtToday(),width:120},{id:'event',label:'Event',required:true},{id:'detail',label:'Detail'},{id:'done',label:'Completed',type:'check',value:true}
    ], o=>{ (p.ws.progress.events=p.ws.progress.events||[]).push({date:o.date,event:o.event,detail:o.detail,kind:o.done?'done':'pending'}); logActivity(p,`Progress — ${o.event}`); refreshWS(p); });
    case 'prog-issue': return formDialog('Add Issue', [
      {id:'issue',label:'Issue',required:true},{id:'detail',label:'Detail'},{id:'status',label:'Status',type:'select',options:['Open','Resolved']}
    ], o=>{ (p.ws.progress.issues=p.ws.progress.issues||[]).push({issue:o.issue,detail:o.detail,status:o.status}); logActivity(p,`Issue raised — ${o.issue}`); refreshWS(p); });
    case 'prog-photos': case 'comp-photos': return openUploadPhotos(p, act==='prog-photos'?'Progress':'Completion', n=>{ if(act==='prog-photos'){ p.ws.progress.photos=(p.ws.progress.photos||0)+n; } else { p.ws.completion.finalPhotos=(p.ws.completion.finalPhotos||0)+n; } });
    case 'comp-mark': return toggleCompletion(p);
    default: return notBuilt('This action');
  }
}
function selPhotoCat(p){ const a=(p.ws.photoAlbum&&p.ws.photoAlbum.categories)||[]; return a[getSel(p,'Photos',0)]; }
function selSiteNode(p){ const f=siteFlat(p); return f[getSel(p,'Site',0)]; }
function openUploadPhotos(p, defaultCat, after){
  const cats=(p.ws.photoAlbum&&p.ws.photoAlbum.categories)||[];
  const opts=cats.map(c=>c.name).concat(['(new category…)']);
  return formDialog('Upload Photos', [
    {id:'count',label:'How many',value:'1',width:60},{id:'cat',label:'Category',type:'select',options:opts,value:defaultCat&&cats.some(c=>c.name===defaultCat)?defaultCat:opts[0]},{id:'newcat',label:'New name',placeholder:'if new category'}
  ], o=>{ const n=Math.max(1,parseInt(o.count)||1); let catName=o.cat==='(new category…)'?(o.newcat||'Photos'):o.cat;
    if(!p.ws.photoAlbum){ p.ws.photoAlbum={categories:[],uncategorised:0}; }
    let c=p.ws.photoAlbum.categories.find(x=>x.name===catName); if(!c){ c={name:catName,date:fmtToday(),count:0}; p.ws.photoAlbum.categories.push(c); }
    c.count+=n; c.date=fmtToday(); logActivity(p,`${n} photo${n>1?'s':''} uploaded — ${catName}`); if(after) after(n); refreshWS(p);
  }, {hint:'Records the photos against the project (metadata).'});
}
function openAddShipment(p){
  const s=p.ws.shipping; const n=(s.shipments.reduce((m,x)=>Math.max(m,x.n),0))+1;
  const body=el('div');
  body.innerHTML=`<div class="dlg-title"><span class="dlg-title-text">Add Shipment ${n}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:360px">
      <div class="frow" style="grid-template-columns:80px 1fr"><label>Carrier</label><div class="tinput"><input id="as-car" type="text" value="Averitt Express"></div></div>
      <div class="frow" style="grid-template-columns:80px 1fr"><label>Contents</label><div class="tinput"><input id="as-cont" type="text"></div></div>
      <div class="frow" style="grid-template-columns:80px 1fr"><label>BOL / PRO</label><div class="tinput" style="width:130px"><input id="as-bol" type="text"></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="as-ok"><span>Add</span></button><button class="btn dlgbtn" id="as-cancel">Cancel</button></div>
    </div>`;
  const dlg=openDialog(body,360,200); const close=()=>closeDialog();
  $('#as-cancel',dlg).addEventListener('click',close); $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#as-ok',dlg).addEventListener('click',()=>{ const bol=$('#as-bol',dlg).value.trim();
    s.shipments.push({n, carrier:$('#as-car',dlg).value.trim()||'Averitt Express', contents:$('#as-cont',dlg).value.trim(), bol:bol||'—', call:'—', scheduled:'—', received:'—', status:'Not shipped — planned', storedAt:'—', state:'notshipped', ghost:true, log:[], paperwork:[], photos:0 });
    uiSel[selKey(p,'Shipping')]=s.shipments.length-1; logActivity(p,`Shipment ${n} added`); saveState(); render(); close(); });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#as-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
  setTimeout(()=>$('#as-cont',dlg).focus(),0);
}
function openRecordReceipt(p, sh){
  const today=fmtToday();
  const body=el('div');
  body.innerHTML=`<div class="dlg-title"><span class="dlg-title-text">Record Receipt — Shipment ${sh.n}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:380px">
      <div class="frow" style="grid-template-columns:90px 1fr"><label>Received on</label><div class="tinput" style="width:120px"><input id="rr-date" type="text" value="${esc(today)}" maxlength="16"></div></div>
      <div class="frow" style="grid-template-columns:90px 1fr"><label>Checked</label><div class="tinput"><input id="rr-check" type="text" value="Matches list and estimate"></div></div>
      <div class="frow" style="grid-template-columns:90px 1fr"><label>Stored at</label><div class="tinput"><input id="rr-store" type="text" value="Main lot"></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="rr-ok"><span>Record</span></button><button class="btn dlgbtn" id="rr-cancel">Cancel</button></div>
    </div>`;
  const dlg=openDialog(body,380,200); const close=()=>closeDialog();
  $('#rr-cancel',dlg).addEventListener('click',close); $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#rr-ok',dlg).addEventListener('click',()=>{
    const date=$('#rr-date',dlg).value.trim()||today; sh.state='received'; sh.flag=false; sh.status='Received — stored'; sh.ghost=false;
    sh.received=date.split(' ')[0]; sh.receivedFull=`${date} by ${state.user}`; sh.checked=$('#rr-check',dlg).value.trim(); sh.storedAt=$('#rr-store',dlg).value.trim(); sh.storedFull=sh.storedAt;
    (sh.log=sh.log||[]).push({date:sh.received,event:'Received',detail:sh.checked}); logActivity(p,`Shipment ${sh.n} received — ${sh.storedAt}`);
    saveState(); render(); close();
  });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#rr-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
}
function toggleCompletion(p){
  const c=p.ws.completion; const undone=c.checklist.filter(x=>!x.done).length;
  if(c.status!=='Complete' && undone){
    messageBox('Mark Complete', ICON.warn+'', `${undone} checklist item${undone>1?'s are':' is'} still unchecked.<br>Mark the project complete anyway?`, ['Yes','No'], a=>{ if(a==='Yes') doComplete(p,true); });
  } else if(c.status==='Complete'){ doComplete(p,false); }
  else doComplete(p,true);
}
function doComplete(p, complete){
  const c=p.ws.completion;
  if(complete){ c.status='Complete'; c.completedDate=fmtToday(); p.stage='Closeout'; p.status='Completed'; logActivity(p,'Marked complete'); }
  else { c.status='Not complete'; c.completedDate=null; logActivity(p,'Completion reopened'); }
  saveState(); render();
}

function removeDoc(p, sec, doc){
  const label = sec==='Estimates'?doc.id:(sec==='POs'?doc.number:`Change Order ${doc.n}`);
  messageBox('Remove', ICON.question, `Remove <b>${esc(label)}</b> from ${esc(findSection(sec).label)}?<br>The record of it is kept in Activity.`, ['Yes','No'], a=>{
    if(a!=='Yes') return;
    const arr = sec==='Estimates'?p.ws.estimates:(sec==='POs'?p.ws.pos:p.ws.changeOrders);
    const i=arr.indexOf(doc); if(i>=0) arr.splice(i,1);
    logActivity(p, `Removed ${label}`); uiSel[selKey(p,sec)]=Math.max(0,arr.length-1);
    if(sec==='ChangeOrders') recomputeValue(p);
    saveState(); render();
  });
}

/* ---------- cascade actions ---------- */
function openMarkAccepted(p, est){
  const today = fmtToday();
  // build consequence list
  const others=(p.ws.estimates||[]).filter(e=>e!==est && !/Declined/i.test(e.status) && !/Superseded/i.test(e.status));
  const approvedCOs=(p.ws.changeOrders||[]).filter(c=>c.status==='Approved' && !c.absorbed);
  const cons=[];
  others.forEach(o=> cons.push(`Mark <b>${esc(o.id)}</b> superseded`));
  if(p.value!==est.amount) cons.push(`Change the project value from ${money(p.value)} to <b>${money(est.amount)}</b>`);
  if(approvedCOs.length) cons.push(`Mark Change Order${approvedCOs.length>1?'s':''} ${approvedCOs.map(c=>c.n).join(' and ')} as absorbed by ${esc(est.id)}`);
  cons.push(`Move the stage to <b>Contracting — Awaiting PO</b>`);
  cons.push(`Add the task <b>Get revised PO</b>, due in 7 days`);

  const body=el('div');
  body.innerHTML=`
    <div class="dlg-title"><span class="dlg-title-text">Mark ${esc(est.id)} as Accepted</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:404px">
      <div class="frow" style="grid-template-columns:90px 1fr"><label>Accepted <u>o</u>n</label><div class="tinput" style="width:110px"><input id="ma-date" type="text" value="${esc(today)}" maxlength="10"></div></div>
      <div class="frow" style="grid-template-columns:90px 1fr"><label>Accepted <u>b</u>y</label><div class="tinput"><input id="ma-by" type="text" value="${esc(p.contact?p.contact.name+', '+p.contact.role:'')}"></div></div>
      <div class="frow" style="grid-template-columns:90px 1fr"><label><u>R</u>ecorded as</label><div class="tinput"><input id="ma-rec" type="text" value="Email confirmation"></div></div>
      <div style="margin-top:10px;padding:8px 9px;background:#fff;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff,inset 2px 2px #0a0a0a,inset -2px -2px #dfdfdf">
        <div style="display:flex;align-items:center;gap:6px;font-weight:700;margin-bottom:5px">${ICON.warn}Accepting this estimate will also:</div>
        ${cons.map(c=>`<div style="display:grid;grid-template-columns:14px 1fr;height:17px;align-items:center"><span>•</span><span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${c}</span></div>`).join('')}
      </div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px">
        <button class="btn dlgbtn default" id="ma-ok"><span>OK</span></button>
        <button class="btn dlgbtn" id="ma-cancel">Cancel</button>
      </div>
    </div>`;
  const dlg=openDialog(body,404,300);
  const close=()=>closeDialog();
  $('#ma-cancel',dlg).addEventListener('click',close);
  $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#ma-ok',dlg).addEventListener('click',()=>{ applyAcceptEstimate(p,est,{date:$('#ma-date',dlg).value.trim()||today, by:$('#ma-by',dlg).value.trim(), rec:$('#ma-rec',dlg).value.trim()}); close(); });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#ma-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
}
function applyAcceptEstimate(p, est, o){
  est.accepted=true; est.acceptedDate=o.date; est.status='ACCEPTED '+o.date; est.acceptedBy=o.by; est.superseded=false;
  (p.ws.estimates||[]).forEach(e=>{ if(e!==est && !/Declined/i.test(e.status)){ e.accepted=false; e.superseded=true; e.status='Superseded'; } });
  const absorbed=[]; (p.ws.changeOrders||[]).forEach(c=>{ if(c.status==='Approved' && !c.absorbed){ c.absorbed=true; c.absorbedInto=est.id; absorbed.push(c.n); } });
  p.ws.originalValue=est.amount; p.ws.originalRef=`${est.id} accepted ${o.date}`; recomputeValue(p);
  p.stage='Contracting'; p.status='Awaiting PO'; p.hold=false;
  p.alert={ kind:'PO missing', section:'POs', detail:'Estimate accepted, no PO filed', age:0 };
  if(!p.ws.tasks) p.ws.tasks=[]; p.ws.tasks.unshift({text:'Get revised PO', due:plusDays(o.date,7), done:false});
  logActivity(p, `Estimate ${est.id} accepted at ${money(est.amount)}${o.by?' by '+o.by:''} — prior superseded, stage → Contracting/Awaiting PO`);
  saveState(); render();
}
function openApproveCO(p, co){
  if(co.status==='Approved') return;
  const today=fmtToday();
  const body=el('div');
  body.innerHTML=`
    <div class="dlg-title"><span class="dlg-title-text">Approve Change Order ${co.n}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:360px">
      <div class="frow" style="grid-template-columns:90px 1fr"><label>Approved <u>o</u>n</label><div class="tinput" style="width:110px"><input id="ac-date" type="text" value="${esc(today)}" maxlength="10"></div></div>
      <div class="frow" style="grid-template-columns:90px 1fr"><label><u>R</u>ecorded as</label><div class="tinput"><input id="ac-rec" type="text" value="Signed change order"></div></div>
      <div style="margin-top:10px;padding:8px 9px;background:#fff;box-shadow:inset 1px 1px #808080,inset -1px -1px #fff,inset 2px 2px #0a0a0a,inset -2px -2px #dfdfdf">
        <div style="display:flex;align-items:center;gap:6px;font-weight:700;margin-bottom:5px">${ICON.warn}Approving will also:</div>
        <div style="display:grid;grid-template-columns:14px 1fr;height:17px;align-items:center"><span>•</span><span>Change the project value from ${money(p.value)} to <b>${money(p.value+co.amount)}</b></span></div>
        <div style="display:grid;grid-template-columns:14px 1fr;height:17px;align-items:center"><span>•</span><span>Record one entry in Activity</span></div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px">
        <button class="btn dlgbtn default" id="ac-ok"><span>OK</span></button>
        <button class="btn dlgbtn" id="ac-cancel">Cancel</button>
      </div>
    </div>`;
  const dlg=openDialog(body,360,220);
  const close=()=>closeDialog();
  $('#ac-cancel',dlg).addEventListener('click',close);
  $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#ac-ok',dlg).addEventListener('click',()=>{ co.status='Approved'; co.approvedDate=$('#ac-date',dlg).value.trim()||today; delete co.effect; recomputeValue(p); logActivity(p,`Change Order ${co.n} approved — ${signedMoney(co.amount)}, value now ${money(p.value)}`); close(); render(); });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#ac-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
}
function declineCO(p, co){
  messageBox('Decline Change Order', ICON.question, `Decline <b>Change Order ${co.n}</b>?<br>It stays on the record but never enters the value.`, ['Yes','No'], a=>{
    if(a!=='Yes') return; co.status='Declined'; logActivity(p,`Change Order ${co.n} declined`); saveState(); render();
  });
}

/* ---------- upload dialogs (metadata only) ---------- */
function nextVersionLetter(p){
  const used=(p.ws.estimates||[]).map(e=>{ const m=/([A-Z])\d/.exec(e.id.replace(p.id,'')); return m?m[1]:null; }).filter(Boolean);
  const max=used.length?Math.max(...used.map(c=>c.charCodeAt(0))):64; return String.fromCharCode(max+1);
}
function newestVersionId(p){ const es=(p.ws.estimates||[]).filter(e=>e.kind!=='revision'); return es.length?es[es.length-1].id:null; }
function bumpRendition(id){ const m=/([A-Z])(\d+)$/.exec(id); return m?id.slice(0,m.index)+m[1]+(+m[2]+1):id+'1'; }
function openUploadEstimate(p, mode){
  const acc=acceptedEstimate(p);
  const choices=[{k:'version',label:`New version — next letter ${nextVersionLetter(p)}`, id:()=>`${p.id}${nextVersionLetter(p)}0`}];
  const nv=newestVersionId(p); if(nv) choices.push({k:'rendition',label:`New rendition of ${nv} → ${bumpRendition(nv)}`, id:()=>bumpRendition(nv)});
  if(acc) choices.push({k:'revision',label:`Revision after PO of ${acc.id} → ${acc.id} REV0`, id:()=>`${acc.id} REV0`});
  let idx=Math.max(0,choices.findIndex(c=>c.k===mode));
  const today=fmtToday();
  const body=el('div');
  body.innerHTML=`
    <div class="dlg-title"><span class="ico">${TB.upload}</span><span class="dlg-title-text">Upload Estimate — ${esc(p.id)}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:392px">
      <div class="frow" style="grid-template-columns:82px 1fr"><label><u>F</u>ile</label><div style="display:flex;gap:6px"><div class="tinput" style="flex:1"><input id="ue-file" type="text" placeholder="(no file — metadata only)"></div><button class="btn" id="ue-browse" style="width:62px">Browse…</button></div></div>
      <div class="frow" style="grid-template-columns:82px 1fr"><label>Uploading as</label><div class="combo" id="ue-kind"><span class="val">${esc(choices[idx].label)}</span><span class="arrow">${ICON.down}</span></div></div>
      <div class="frow" style="grid-template-columns:82px 1fr"><label>Estimate <u>I</u>D</label><div class="tinput readonly" id="ue-id" style="width:150px">${esc(choices[idx].id())}</div></div>
      <div class="frow" style="grid-template-columns:82px 1fr"><label><u>A</u>mount</label><div class="tinput" style="width:110px"><input id="ue-amt" type="text" placeholder="$0" value="${acc?money(acc.amount):''}"></div></div>
      <div class="frow" style="grid-template-columns:82px 1fr"><label><u>D</u>ated</label><div class="tinput" style="width:110px"><input id="ue-date" type="text" value="${esc(today)}" maxlength="10"></div></div>
      <div class="frow" style="grid-template-columns:82px 1fr"><label>Sent <u>t</u>o</label><div class="tinput"><input id="ue-to" type="text" value="${esc(p.contact?p.contact.name:'')}"></div></div>
      <div class="frow" style="grid-template-columns:82px 1fr"><label></label><div class="check on" id="ue-sent"><span class="box">${ICON.check}</span><span>Mark as sent and start the clock</span></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="ue-ok"><span>Upload</span></button><button class="btn dlgbtn" id="ue-cancel">Cancel</button></div>
      <div class="hintstrip" style="margin-top:8px">The program files the document and records the amount, date and status — it never writes the estimate.</div>
    </div>`;
  const dlg=openDialog(body,392,320);
  const kindCombo=$('#ue-kind',dlg), idField=$('#ue-id',dlg), sentChk=$('#ue-sent',dlg);
  kindCombo.addEventListener('mousedown',e=>{ e.preventDefault(); closeAllPopups(); const r=kindCombo.getBoundingClientRect();
    buildPopup(choices.map((c,i)=>({label:esc(c.label),checked:i===idx,action:()=>{ idx=i; kindCombo.querySelector('.val').textContent=c.label; idField.textContent=c.id(); }})), r.left, r.bottom); });
  sentChk.addEventListener('click',()=>sentChk.classList.toggle('on'));
  $('#ue-browse',dlg).addEventListener('click',()=>{ $('#ue-file',dlg).value='E:\\Estimates\\'+p.id+'.pdf'; });
  const close=()=>closeDialog();
  $('#ue-cancel',dlg).addEventListener('click',close);
  $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#ue-ok',dlg).addEventListener('click',()=>{
    const id=choices[idx].id(); const amt=parseMoney($('#ue-amt',dlg).value); const date=$('#ue-date',dlg).value.trim()||today;
    const sent=sentChk.classList.contains('on'); const to=$('#ue-to',dlg).value.trim();
    const est={ id, kind:choices[idx].k, date, amount:amt, status: sent?`Sent ${date} — awaiting response`:'Draft', sent, sentTo:to||undefined, sentDate:sent?date:undefined, file:id+'.pdf', uploaded:`${date} by ${state.user}`, prepared:`${date} by ${state.user}` };
    p.ws.estimates.push(est); uiSel[selKey(p,'Estimates')]=p.ws.estimates.length-1;
    logActivity(p, `Estimate ${id} uploaded${sent?` and sent to ${to||'customer'}`:''} — ${money(amt)}`);
    if(sent && !p.alert && p.stage==='Estimating'){ /* leave stage; sending doesn't move it */ }
    close(); saveState(); render();
  });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Escape'){e.preventDefault();close();} });
}
function parseMoney(s){ const n=parseFloat(String(s||'').replace(/[^0-9.\-]/g,'')); return isNaN(n)?0:Math.round(n); }
function openUploadPO(p, revised){
  const acc=acceptedEstimate(p); const today=fmtToday();
  const suggested = revised && p.po ? p.po.replace(/ R\d+$/,'')+' R1' : (p.po||'');
  const body=el('div');
  body.innerHTML=`
    <div class="dlg-title"><span class="ico">${TB.upload}</span><span class="dlg-title-text">${revised?'Upload Revised PO':'Upload PO'} — ${esc(p.id)}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:380px">
      <div class="frow" style="grid-template-columns:96px 1fr"><label><u>F</u>ile</label><div style="display:flex;gap:6px"><div class="tinput" style="flex:1"><input id="po-file" type="text" placeholder="(no file — metadata only)"></div><button class="btn" id="po-browse" style="width:62px">Browse…</button></div></div>
      <div class="frow" style="grid-template-columns:96px 1fr"><label>PO <u>n</u>umber</label><div class="tinput" style="width:150px"><input id="po-num" type="text" value="${esc(suggested)}"></div></div>
      <div class="frow" style="grid-template-columns:96px 1fr"><label><u>A</u>mount</label><div class="tinput" style="width:110px"><input id="po-amt" type="text" value="${money(p.value)}"></div></div>
      <div class="frow" style="grid-template-columns:96px 1fr"><label><u>R</u>eceived</label><div class="tinput" style="width:110px"><input id="po-date" type="text" value="${esc(today)}" maxlength="10"></div></div>
      <div class="frow" style="grid-template-columns:96px 1fr"><label>Answers</label><div class="tinput"><input id="po-ans" type="text" value="${esc(acc?acc.id:'')}"></div></div>
      <div class="frow" style="grid-template-columns:96px 1fr"><label>Note</label><div class="tinput"><input id="po-note" type="text"></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="po-ok"><span>Upload</span></button><button class="btn dlgbtn" id="po-cancel">Cancel</button></div>
    </div>`;
  const dlg=openDialog(body,380,270);
  $('#po-browse',dlg).addEventListener('click',()=>{ $('#po-file',dlg).value='E:\\POs\\'+(suggested||'PO')+'.pdf'; });
  const close=()=>closeDialog();
  $('#po-cancel',dlg).addEventListener('click',close);
  $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#po-ok',dlg).addEventListener('click',()=>{
    const num=$('#po-num',dlg).value.trim(); if(!num){ $('#po-num',dlg).focus(); return; }
    const amt=parseMoney($('#po-amt',dlg).value); const date=$('#po-date',dlg).value.trim()||today;
    (p.ws.pos||[]).forEach(o=>{ o.active=false; }); p.ws.pos=(p.ws.pos||[]).filter(o=>!o.expected);
    const po={ number:num, received:date, amount:amt, answers:$('#po-ans',dlg).value.trim(), status:'Active', active:true, file:num+'.pdf', uploaded:`${date} by ${state.user}`, note:$('#po-note',dlg).value.trim()||undefined };
    p.ws.pos.push(po); p.po=num; uiSel[selKey(p,'POs')]=p.ws.pos.length-1;
    if(p.alert && p.alert.kind==='PO missing') p.alert=null;
    if(p.status==='Awaiting PO'){ p.status='PO Received'; }
    logActivity(p, `PO ${num} uploaded — ${money(amt)}`);
    close(); saveState(); render();
  });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#po-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
}
function openAddChangeOrder(p){
  const today=fmtToday(); const nextN=((p.ws.changeOrders||[]).reduce((m,c)=>Math.max(m,c.n),0))+1;
  const body=el('div');
  body.innerHTML=`
    <div class="dlg-title"><span class="ico">${SEC_ICON.docR}</span><span class="dlg-title-text">Add Change Order ${nextN} — ${esc(p.id)}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:400px">
      <div class="frow" style="grid-template-columns:96px 1fr"><label><u>D</u>escription&nbsp;*</label><div class="tinput"><input id="co-desc" type="text" maxlength="80"></div></div>
      <div class="frow" style="grid-template-columns:96px 1fr"><label><u>A</u>mount&nbsp;*</label><div class="tinput" style="width:110px"><input id="co-amt" type="text" placeholder="+$0 or −$0"></div></div>
      <div class="frow" style="grid-template-columns:96px 1fr"><label><u>R</u>eason</label><div class="tinput"><input id="co-reason" type="text"></div></div>
      <div class="frow" style="grid-template-columns:96px 1fr"><label><u>S</u>tatus</label><div class="combo" id="co-status"><span class="val">Pending</span><span class="arrow">${ICON.down}</span></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="co-ok"><span>Add</span></button><button class="btn dlgbtn" id="co-cancel">Cancel</button></div>
    </div>`;
  const dlg=openDialog(body,400,230); let status='Pending';
  const sc=$('#co-status',dlg);
  sc.addEventListener('mousedown',e=>{ e.preventDefault(); closeAllPopups(); const r=sc.getBoundingClientRect();
    buildPopup(['Draft','Pending'].map(s=>({label:s,checked:s===status,action:()=>{ status=s; sc.querySelector('.val').textContent=s; }})), r.left, r.bottom); });
  const close=()=>closeDialog();
  $('#co-cancel',dlg).addEventListener('click',close);
  $('[data-role="x"]',dlg).addEventListener('click',close);
  $('#co-ok',dlg).addEventListener('click',()=>{
    const desc=$('#co-desc',dlg).value.trim(); if(!desc){ $('#co-desc',dlg).focus(); return; }
    const raw=$('#co-amt',dlg).value.trim(); const neg=/^-|−/.test(raw); let amt=parseMoney(raw); if(neg) amt=-Math.abs(amt);
    const co={ n:nextN, date:today, description:desc, amount:amt, status, reason:$('#co-reason',dlg).value.trim()||undefined, requested:`${today} by ${state.user}`, document:`CO-${nextN} draft.pdf`, equipment:amt, labour:0, effect:'Not in the project value until approved' };
    p.ws.changeOrders.push(co); uiSel[selKey(p,'ChangeOrders')]=p.ws.changeOrders.length-1;
    logActivity(p, `Change Order ${nextN} added — ${signedMoney(amt)} (${status})`);
    close(); saveState(); render();
  });
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();$('#co-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
}

/* ---- Overview boxes ---- */
function signedMoney(v){ const s=v<0?'−':'+'; return `${s}$${Math.abs(v).toLocaleString('en-US')}`; }
function overviewBodyHTML(p){
  const w=p.ws;
  // tasks
  const open=(w.tasks||[]).filter(t=>!t.done);
  const taskRows = open.length ? open.map(t=>{
    const gi=(w.tasks).indexOf(t);
    return `<div class="lrow" style="grid-template-columns:16px minmax(0,1fr) 62px"><span class="lchk" data-task="${gi}"></span><span class="t">${esc(t.text)}</span><span class="r">${esc(t.due||'')}</span></div>`;
  }).join('') : `<div class="lrow" style="grid-template-columns:1fr"><span class="muted">No open tasks.</span></div>`;
  const tasksBox = box(`Open tasks — ${open.length} of ${(w.tasks||[]).length}`,
    taskRows + `<div style="display:flex;gap:6px;margin-top:4px"><div class="wbtn" data-new-task>New Task</div><div class="wbtn" data-go="Tasks">All tasks (${(w.tasks||[]).length})</div></div>`);

  // money
  let mrows='';
  if(w.originalValue!=null){
    mrows += moneyRow(`Original value — ${esc(w.originalRef||'accepted estimate')}`, money(w.originalValue));
    (w.changeOrders||[]).filter(c=>c.status==='Approved' && !c.absorbed)
      .forEach(co=> mrows += moneyRow(`Change Order ${co.n} — ${esc(co.description)}`, signedMoney(co.amount)));
    mrows += `<div class="hr"></div>`;
  }
  mrows += moneyRow('Current project value', money(p.value), true);
  if(p.po) mrows += moneyRow(`PO ${esc(p.po)}${w.poNote?' — '+esc(w.poNote):''}`, money(w.poAmount!=null?w.poAmount:p.value));
  mrows += moneyRow('Billed', w.billed!=null?money(w.billed):'—', false, true);
  mrows += moneyRow('Paid', w.paid!=null?money(w.paid):'—', false, true);
  const moneyBox = box('Money', mrows);

  // documents
  const docs=(w.documents||[]).slice(0,3);
  const docRows = docs.length ? docs.map(d=>`<div class="lrow" style="grid-template-columns:20px minmax(0,1fr) 62px"><span>${d.type==='photo'?SEC_ICON.photo:SEC_ICON.docR}</span><span class="t">${esc(d.name)}</span><span class="r">${esc(d.date)}</span></div>`).join('')
    : `<div class="lrow" style="grid-template-columns:1fr"><span class="muted">No documents yet.</span></div>`;
  const docCount = (w.counts&&w.counts.documents!=null)? w.counts.documents : (w.documents||[]).length;
  const docsBox = box('Documents added recently', docRows + `<div style="margin-top:4px"><div class="wbtn" data-go="Documents">All documents (${docCount})</div></div>`);

  // note
  const noteBox = box('Project note', w.note ?
    `<div style="line-height:1.45">${esc(w.note.text)}</div><div style="margin-top:6px;color:#404040">Entered ${esc(w.note.entered||'—')} by ${esc(w.note.by||state.user)}${w.note.edited?` · last edited ${esc(w.note.edited)}`:''}</div>`
    : `<span class="muted">No project note.</span>`);

  // milestones
  const msRows=(w.milestones||[]).map(m=>{
    const cls = m.flag?' style="font-weight:700"':(m.done?'':' style="color:#808080"');
    const mark = m.flag?ICON.warn:(m.done?CHK_GREEN:'');
    return `<div class="lrow" style="grid-template-columns:20px minmax(0,1fr) 74px"${cls}><span style="display:flex;align-items:center">${mark}</span><span class="t">${esc(m.label)}</span><span class="r">${esc(m.date||'—')}</span></div>`;
  }).join('');
  const milestonesBox = box('Milestones', msRows || `<span class="muted">No milestones.</span>`);

  // activity
  const acts=(w.activity||[]).slice(0,8);
  const actRows = acts.length ? acts.map(a=>`<div class="lrow" style="grid-template-columns:48px minmax(0,1fr)"><span class="muted">${esc(a.date||'')}</span><span class="t">${esc(a.text)}</span></div>`).join('')
    : `<span class="muted">No activity yet.</span>`;
  const activityBox = box('Recent activity', actRows + `<div style="margin-top:4px"><div class="wbtn" data-go="Activity">Full activity history</div></div>`);

  // photos
  const ph=(w.photos||[]).slice(0,4);
  const phCount=(w.counts&&w.counts.photos!=null)? w.counts.photos : (w.photos||[]).length;
  const thumbSvg='<svg width="24" height="24" viewBox="0 0 16 16" style="shape-rendering:crispEdges;opacity:.5"><path fill="#000" d="M1 3h14v10H1z"/><path fill="#a6caf0" d="M2 4h12v8H2z"/><path fill="#008000" d="M2 10l3-3 3 3 2-2 4 4H2z"/></svg>';
  const photosInner = ph.length ?
    `<div class="thumbs">${ph.map(x=>`<div class="thumb"><div class="img">${thumbSvg}</div><div class="cap">${esc(x.label||'')}</div></div>`).join('')}<div style="flex:1;display:flex;align-items:flex-end;justify-content:flex-end"><div class="wbtn" data-go="Photos">All photos (${phCount})</div></div></div>`
    : `<span class="muted">No photos yet.</span>`;
  const photosBox = box('Latest photos', photosInner);

  return `<div class="ov-grid">
    <div class="ov-col">${tasksBox}${moneyBox}${docsBox}${noteBox}</div>
    <div class="ov-col">${milestonesBox}${activityBox}${photosBox}</div>
  </div>`;
}
function box(legend, inner){ return `<div class="wbox"><span class="legend">${esc(legend)}</span>${inner}</div>`; }
function moneyRow(label, amt, bold, muted){
  return `<div class="lrow" style="grid-template-columns:minmax(0,1fr) 84px${bold?';font-weight:700':''}${muted?';color:#404040':''}"><span class="t">${label}</span><span class="r">${esc(amt)}</span></div>`;
}
function stubBodyHTML(item){
  const grp = SECTION_GROUPS.find(g=>g.items.some(x=>x.key===item.key));
  const gname = grp&&grp.group? ` — ${grp.group}`:'';
  return `<div class="sec-stub"><h3>${esc(item.label)}</h3>
    <div style="color:#404040">Section navigation is live; this pane is a placeholder.</div>
    <div class="note"><b>${esc(item.label)}</b> is designed in <b>Sheet ${item.sheet||'??'}</b> of the blueprint${gname} and isn’t built in this pass. Opening it here confirms the section list works — its full pane arrives with that sheet.</div>
  </div>`;
}

/* ---- workspace wiring ---- */
function wireWorkspace(node, p){
  $$('.ws-stage .cell', node).forEach(cell=> cell.addEventListener('mousedown', ()=> openStagePopup(p, cell.dataset.stage, cell)));
  const goto=$('.ws-attn .goto', node); if(goto) goto.addEventListener('click', ()=> setSection(p.id, goto.dataset.goto));
  $$('.sec', node).forEach(s=> s.addEventListener('mousedown', ()=> setSection(p.id, s.dataset.sec)));
  $$('.lchk[data-task]', node).forEach(c=> c.addEventListener('click', ()=>{ const i=+c.dataset.task; const t=p.ws.tasks[i]; if(t){ t.done=!t.done; logActivity(p, `Task ${t.done?'completed':'reopened'} — ${t.text}`); saveState(); renderWorkspace(); } }));
  $$('[data-go]', node).forEach(b=> b.addEventListener('click', ()=> setSection(p.id, b.dataset.go)));
  const nt=$('[data-new-task]', node); if(nt) nt.addEventListener('click', ()=> openNewTask(p));
  // document-section rows + action buttons
  const sec = uiSection[p.id] || 'Overview';
  $$('.drow[data-drow]', node).forEach(r=>{
    r.addEventListener('mousedown', ()=> setSel(p, sec, +r.dataset.drow));
    r.addEventListener('dblclick', ()=> docAction(p, sec, 'open'));
  });
  $$('.drow[data-citem]', node).forEach(r=>{
    r.addEventListener('mousedown', ()=> setSel(p, sec, +r.dataset.citem));
    r.addEventListener('dblclick', ()=> docAction(p, sec, 'cost-edit-item'));
  });
  $$('[data-dact]', node).forEach(b=> b.addEventListener('mouseup', ()=> docAction(p, sec, b.dataset.dact)));
  $$('[data-tab]', node).forEach(t=> t.addEventListener('mousedown', ()=>{ uiTab[selKey(p,sec)]=t.dataset.tab; renderWorkspace(); }));
  $$('[data-cat]', node).forEach(n=> n.addEventListener('mousedown', ()=>{ uiCat[p.id]=n.dataset.cat; uiSel[selKey(p,'Documents')]=0; renderWorkspace(); }));
  $$('[data-clk]', node).forEach(cc=> cc.addEventListener('click', ()=>{ const i=+cc.dataset.clk; const it=p.ws.completion.checklist[i]; if(it){ it.done=!it.done; saveState(); renderWorkspace(); } }));
}
function logActivity(p, text){ if(!p.ws.activity) p.ws.activity=[]; p.ws.activity.unshift({date:shortToday(), text}); }

/* ---- set stage / status popup ---- */
function openStagePopup(p, stage, anchor){
  closeAllPopups();
  const r = anchor.getBoundingClientRect();
  const items = (STATUSES[stage]||[]).map(s=>({ label:esc(s), checked: p.stage===stage && p.status===s && !isHold(p),
    action:()=>setProjectState(p, stage, s) }));
  items.push({sep:true});
  items.push({label:'Put project On Hold', checked:isHold(p), action:()=>{ p.hold=true; p.status='On Hold'; logActivity(p,'Project put On Hold'); saveState(); render(); }});
  items.push({label:'Cancel project…', action:()=>{
    messageBox('Cancel project', ICON.question, `Cancel <b>${esc(p.id)} ${esc(p.title)}</b>?<br>It moves to Closed / Cancelled.`, ['Yes','No'], a=>{
      if(a==='Yes'){ p.stage='Closed'; p.status='Cancelled'; p.hold=false; logActivity(p,'Project cancelled'); saveState(); render(); }
    });
  }});
  buildPopup(items, r.left, r.bottom);
}
function setProjectState(p, stage, status){
  p.stage=stage; p.status=status; p.hold=false;
  logActivity(p, `Status set to ${stage} · ${status}`);
  saveState(); render();
}

/* ---- new task dialog ---- */
function openNewTask(p){
  if(!p) return;
  const body = el('div');
  body.innerHTML = `
    <div class="dlg-title"><span class="ico">${SEC_ICON.check}</span><span class="dlg-title-text">New Task — ${esc(p.id)}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body">
      <div class="frow" style="grid-template-columns:60px 1fr"><label><u>T</u>ask&nbsp;*</label><div class="tinput"><input id="nt-text" type="text" maxlength="120"></div></div>
      <div class="frow" style="grid-template-columns:60px 1fr"><label><u>D</u>ue</label><div class="tinput" style="width:110px"><input id="nt-due" type="text" placeholder="MM/DD/YY" maxlength="8"></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px">
        <button class="btn dlgbtn default" id="nt-ok"><span>Add</span></button>
        <button class="btn dlgbtn" id="nt-cancel">Cancel</button>
      </div>
    </div>`;
  const dlg = el('div','dialog'); dlg.style.width='320px'; dlg.style.left=Math.round((innerWidth-320)/2)+'px'; dlg.style.top=Math.round(innerHeight/2-80)+'px';
  const ov=overlay(); ov.classList.remove('hidden'); ov.appendChild(dlg); dlg.appendChild(body);
  makeDraggable(dlg, body.querySelector('.dlg-title'));
  const close=()=>{ dlg.remove(); if(!ov.querySelector('.dialog')) ov.classList.add('hidden'); };
  const ok=()=>{ const t=$('#nt-text',dlg).value.trim(); if(!t){ $('#nt-text',dlg).focus(); return; }
    if(!p.ws.tasks) p.ws.tasks=[]; p.ws.tasks.unshift({text:t, due:$('#nt-due',dlg).value.trim(), done:false});
    logActivity(p, `Task added — ${t}`); saveState(); close(); renderWorkspace(); };
  $('#nt-ok',dlg).addEventListener('click', ok);
  $('#nt-cancel',dlg).addEventListener('click', close);
  $('[data-role="x"]',dlg).addEventListener('click', close);
  dlg.addEventListener('keydown', e=>{ if(e.key==='Enter'){e.preventDefault();ok();} else if(e.key==='Escape'){e.preventDefault();close();} });
  setTimeout(()=>$('#nt-text',dlg).focus(),0);
}

function makeDraggable(win, handle){
  let sx,sy,ox,oy,drag=false;
  handle.addEventListener('mousedown', e=>{
    if(e.target.closest('.tb-btn')) return;
    drag=true; sx=e.clientX; sy=e.clientY; ox=parseInt(win.style.left)||0; oy=parseInt(win.style.top)||0;
    const mv=ev=>{ if(!drag)return; win.style.left=Math.max(0,ox+ev.clientX-sx)+'px'; win.style.top=Math.max(0,oy+ev.clientY-sy)+'px'; };
    const up=()=>{ drag=false; document.removeEventListener('mousemove',mv); document.removeEventListener('mouseup',up); };
    document.addEventListener('mousemove',mv); document.addEventListener('mouseup',up);
  });
}

/* ============================================================
   DIALOGS
   ============================================================ */
function overlay(){ return $('#overlay'); }
function openDialog(node, w, h){
  const ov = overlay(); ov.classList.remove('hidden'); ov.innerHTML='';
  const dlg = el('div','dialog'); dlg.style.width=w+'px';
  dlg.style.left = Math.round((innerWidth-w)/2)+'px';
  dlg.style.top  = Math.round((innerHeight-(h||300))/2 - 20)+'px';
  dlg.appendChild(node);
  ov.appendChild(dlg);
  makeDraggable(dlg, node.querySelector('.dlg-title'));
  return dlg;
}
function closeDialog(){ overlay().classList.add('hidden'); overlay().innerHTML=''; }

/* ---------- generic form dialog (used to wire most actions) ---------- */
function formDialog(title, fields, onSubmit, opts){
  opts=opts||{};
  const body=el('div');
  const rowHTML=f=>{
    const lw=f.lw||96;
    if(f.type==='textarea') return `<div class="frow" style="grid-template-columns:${lw}px 1fr;align-items:flex-start"><label>${esc(f.label)}</label><div class="tinput"><textarea class="ta" id="f-${f.id}" style="height:${f.h||48}px">${esc(f.value||'')}</textarea></div></div>`;
    if(f.type==='check') return `<div class="frow" style="grid-template-columns:${lw}px 1fr"><label></label><div class="check${f.value?' on':''}" id="f-${f.id}"><span class="box">${ICON.check}</span><span>${esc(f.label)}</span></div></div>`;
    if(f.type==='select') return `<div class="frow" style="grid-template-columns:${lw}px 1fr"><label>${esc(f.label)}</label><div class="combo" id="f-${f.id}" data-val="${esc(f.value!=null?f.value:(f.options[0]||''))}" style="${f.width?'width:'+f.width+'px':''}"><span class="val">${esc(f.value!=null?f.value:(f.options[0]||''))}</span><span class="arrow">${ICON.down}</span></div></div>`;
    return `<div class="frow" style="grid-template-columns:${lw}px 1fr"><label>${esc(f.label)}${f.required?' *':''}</label><div class="tinput" style="${f.width?'width:'+f.width+'px':''}"><input id="f-${f.id}" type="text" value="${esc(f.value||'')}" ${f.placeholder?`placeholder="${esc(f.placeholder)}"`:''} maxlength="${f.max||120}"></div></div>`;
  };
  body.innerHTML=`<div class="dlg-title">${opts.icon?`<span class="ico">${opts.icon}</span>`:''}<span class="dlg-title-text">${esc(title)}</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>`+
    `<div class="dlg-body" style="width:${opts.width||360}px">${fields.map(rowHTML).join('')}`+
    (opts.hint?`<div class="hintstrip" style="margin-top:8px">${esc(opts.hint)}</div>`:'')+
    `<div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px"><button class="btn dlgbtn default" id="f-ok"><span>${esc(opts.ok||'OK')}</span></button><button class="btn dlgbtn" id="f-cancel">Cancel</button></div></div>`;
  const dlg=openDialog(body, opts.width||360, 200);
  fields.filter(f=>f.type==='select').forEach(f=>{ const c=$('#f-'+f.id,dlg); c.addEventListener('mousedown',e=>{e.preventDefault();closeAllPopups();const r=c.getBoundingClientRect(); buildPopup((f.options||[]).map(o=>({label:esc(o),checked:c.dataset.val===o,action:()=>{c.dataset.val=o;c.querySelector('.val').textContent=o;}})),r.left,r.bottom);}); });
  fields.filter(f=>f.type==='check').forEach(f=>{ const c=$('#f-'+f.id,dlg); c.addEventListener('click',()=>c.classList.toggle('on')); });
  const close=()=>closeDialog();
  const collect=()=>{ const o={}; fields.forEach(f=>{ const e=$('#f-'+f.id,dlg); if(!e) return; if(f.type==='check') o[f.id]=e.classList.contains('on'); else if(f.type==='select') o[f.id]=e.dataset.val; else o[f.id]=(e.value||'').trim(); }); return o; };
  $('#f-ok',dlg).addEventListener('click',()=>{ const o=collect(); const req=fields.find(f=>f.required&&!o[f.id]); if(req){ const e=$('#f-'+req.id,dlg); e&&e.focus&&e.focus(); return; } close(); onSubmit(o); });
  $('#f-cancel',dlg).addEventListener('click',close); $('[data-role="x"]',dlg).addEventListener('click',close);
  dlg.addEventListener('keydown',e=>{ if(e.key==='Enter'&&(e.target.tagName||'')!=='TEXTAREA'){e.preventDefault();$('#f-ok',dlg).click();} else if(e.key==='Escape'){e.preventDefault();close();} });
  const first=fields.find(f=>f.type!=='check'&&f.type!=='select'); if(first) setTimeout(()=>{const e=$('#f-'+first.id,dlg); e&&e.focus&&e.focus();},0);
  return dlg;
}
function refreshWS(p){ saveState(); editState?renderCostEditor():(viewState?renderViewer():render()); }
function menuProject(){ return viewMode==='workspace'&&activeProjectId? byId(activeProjectId) : selectedProject(); }
function withProjectSection(p, sec, then){ if(!p) return; enrichProject(p); if(viewMode!=='workspace'||activeProjectId!==p.id) openProject(p.id); uiSection[p.id]=sec; render(); then(p); }
function newEstimateFor(p){ withProjectSection(p,'Estimates',()=>openUploadEstimate(p,'version')); }
function newPOFor(p){ withProjectSection(p,'POs',()=>openUploadPO(p,false)); }
function newDocFor(p){ withProjectSection(p,'Documents',()=>openUploadDoc(p)); }

/* ---------- New Project (Screen 02) ---------- */
function openNewProject(){
  closeAllPopups();
  const auto = nextProjectId();
  const body = el('div');
  body.innerHTML = `
    <div class="dlg-title">
      <span class="ico">${TB.newproj}</span>
      <span class="dlg-title-text">New Project</span>
      <button class="tb-btn" data-role="help">?</button>
      <button class="tb-btn" data-role="x"><i class="gl-close"></i></button>
    </div>
    <div class="dlg-body">
      <div class="group"><span class="legend">Project</span>
        <div class="frow"><label>Project <u>I</u>D&nbsp;*</label>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="tinput readonly" id="np-id" style="width:118px">${esc(auto.id)}</div>
            <div class="check on" id="np-auto"><span class="box">${ICON.check}</span><span>Assign a<u>u</u>tomatically</span></div>
          </div>
        </div>
        <div class="frow"><label>Project <u>T</u>itle&nbsp;*</label>
          <div class="tinput"><input id="np-title" type="text" maxlength="80"></div>
        </div>
        <div class="frow"><label><u>C</u>ustomer&nbsp;*</label>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="combo" id="np-customer" style="flex:1"><span class="val" style="color:#808080">(select or type to search)</span><span class="arrow">${ICON.down}</span></div>
            <button class="btn" id="np-newcust" style="width:52px">Ne<u>w</u>…</button>
          </div>
        </div>
        <div class="frow"><label>Cont<u>a</u>ct</label>
          <div class="combo" id="np-contact" style="opacity:.6"><span class="val" style="color:#808080">(none — can be added later)</span><span class="arrow">${ICON.down}</span></div>
        </div>
      </div>

      <div class="group"><span class="legend">Site / Location</span>
        <div class="frow"><label><u>A</u>ddress</label><div class="tinput"><input id="np-addr" type="text"></div></div>
        <div class="frow"><label>Cit<u>y</u></label>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="tinput" style="width:150px"><input id="np-city" type="text"></div>
            <span>State</span>
            <div class="combo" id="np-state" style="width:56px"><span class="val">MO</span><span class="arrow">${ICON.down}</span></div>
            <span>Zip</span>
            <div class="tinput" style="width:66px"><input id="np-zip" type="text" maxlength="10"></div>
          </div>
        </div>
      </div>

      <div class="group"><span class="legend">Initial state</span>
        <div class="frow"><label style="color:#808080;text-shadow:1px 1px #fff">Stage / Status</label>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="tinput readonly" style="width:104px">Intake</div>
            <div class="tinput readonly" style="width:104px">New</div>
            <span style="color:#404040">Set automatically</span>
          </div>
        </div>
      </div>

      <div class="group"><span class="legend"><u>N</u>otes</span>
        <div class="tinput"><textarea class="ta" id="np-notes"></textarea></div>
      </div>

      <div style="display:flex;align-items:center;height:23px;margin-bottom:10px">
        <div class="check on" id="np-openafter"><span class="box">${ICON.check}</span><span><u>O</u>pen the project after creating</span></div>
        <span style="flex:1"></span>
        <div class="dlg-buttons">
          <button class="btn dlgbtn default" id="np-create"><span>Create</span></button>
          <button class="btn dlgbtn" id="np-cancel">Cancel</button>
          <button class="btn dlgbtn" id="np-help">Help</button>
        </div>
      </div>
      <div class="hintstrip">* Required. Project ID is the next number in the 2026 sequence and is never reused.</div>
    </div>`;

  const dlg = openDialog(body, 464, 470);

  // form model
  let customer = '';
  let stateVal = 'MO';
  let autoId = true;

  const idField = $('#np-id', dlg);
  const autoChk = $('#np-auto', dlg);
  const custCombo = $('#np-customer', dlg);
  const stateCombo = $('#np-state', dlg);
  const openAfter = $('#np-openafter', dlg);

  // toggle auto-assign ID
  autoChk.addEventListener('click', ()=>{
    autoId=!autoId; autoChk.classList.toggle('on',autoId);
    if(autoId){ idField.classList.add('readonly'); idField.textContent=auto.id; }
    else{ idField.classList.remove('readonly'); idField.innerHTML='<input id="np-id-input" type="text" style="width:100%;border:0;background:transparent;font:inherit" value="'+esc(auto.id)+'">'; }
  });

  // customer dropdown (type-to-search via popup list)
  const setCustomer = c => { customer=c; custCombo.querySelector('.val').style.color='#000'; custCombo.querySelector('.val').textContent=c; };
  custCombo.addEventListener('mousedown', e=>{ e.preventDefault();
    closeAllPopups(); const r=custCombo.getBoundingClientRect();
    buildPopup(state.customers.slice().sort().map(c=>({label:esc(c), checked:customer===c, action:()=>setCustomer(c)})), r.left, r.bottom);
  });
  $('#np-newcust', dlg).addEventListener('click', ()=> openNewCustomer(name=>{ if(name){ if(!state.customers.includes(name)){ state.customers.push(name); saveState(); } setCustomer(name); } }));

  // state dropdown
  stateCombo.addEventListener('mousedown', e=>{ e.preventDefault();
    closeAllPopups(); const r=stateCombo.getBoundingClientRect();
    buildPopup(US_STATES.map(s=>({label:s, checked:stateVal===s, action:()=>{ stateVal=s; stateCombo.querySelector('.val').textContent=s; }})), r.left, r.bottom-4);
  });

  openAfter.addEventListener('click', ()=> openAfter.classList.toggle('on'));

  const doCancel = ()=> closeDialog();
  $('#np-cancel', dlg).addEventListener('click', doCancel);
  $('#np-help', dlg).addEventListener('click', ()=>notBuilt('Help'));
  $('[data-role="x"]', dlg).addEventListener('click', doCancel);
  $('[data-role="help"]', dlg).addEventListener('click', ()=>notBuilt('Help'));

  const getId = ()=> autoId ? auto.id : ($('#np-id-input',dlg)?.value.trim() || auto.id);

  const doCreate = ()=>{
    const title = $('#np-title',dlg).value.trim();
    if(!title){ messageBox('New Project', ICON.warnLg, 'A Project Title is required.<br>Enter a title, then choose a customer.', ['OK'], ()=>{ $('#np-title',dlg).focus(); }); return; }
    if(!customer){ messageBox('New Project', ICON.warnLg, 'A Customer is required.<br>Choose an existing customer or add a new one.', ['OK'], ()=>{}); return; }
    const id = getId();
    if(state.projects.some(p=>p.id===id)){ messageBox('New Project', ICON.warnLg, `Project ID <b>${esc(id)}</b> already exists.<br>Numbers are never reused — choose another.`, ['OK'], ()=>{}); return; }

    const city = $('#np-city',dlg).value.trim();
    const addr = $('#np-addr',dlg).value.trim();
    const dupe = state.projects.find(p=>p.customer===customer && p.city.toLowerCase()===city.toLowerCase() && city && isActive(p));
    const finish = ()=> commitProject({id, title, customer, address:addr, city, state:stateVal, zip:$('#np-zip',dlg).value.trim(), notes:$('#np-notes',dlg).value.trim(), open:openAfter.classList.contains('on')});
    if(dupe){
      messageBox('New Project', ICON.question,
        `${esc(customer)} already has an open project at this address:<br><b>${esc(dupe.id)} ${esc(dupe.title)}</b>.<br>Create a second project at the same site?`,
        ['Yes','No'], ans=>{ if(ans==='Yes') finish(); });
    } else finish();
  };
  $('#np-create', dlg).addEventListener('click', doCreate);

  // keyboard: Enter=create (except in textarea, which needs Ctrl+Enter), Esc=cancel
  dlg.addEventListener('keydown', e=>{
    if(e.key==='Escape'){ e.preventDefault(); doCancel(); }
    else if(e.key==='Enter'){
      if(e.target.tagName==='TEXTAREA' && !e.ctrlKey) return;
      e.preventDefault(); doCreate();
    }
  });

  setTimeout(()=> $('#np-title',dlg).focus(), 0);
}

function commitProject(o){
  const p = { id:o.id, title:o.title, customer:o.customer, address:o.address, city:o.city, state:o.state, zip:o.zip,
    stage:'Intake', status:'New', next:'', value:null, hold:false, notes:o.notes||'', created:new Date().toISOString().slice(0,10) };
  state.projects.unshift(p);
  if(!state.customers.includes(o.customer)) state.customers.push(o.customer);
  state.selectedId = p.id;
  saveState();
  closeDialog();
  render();
  if(o.open) openProject(p.id);
}

/* ---------- New Customer (small dialog on top) ---------- */
function openNewCustomer(cb){
  const body = el('div');
  body.innerHTML = `
    <div class="dlg-title"><span class="dlg-title-text">New Customer</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body">
      <div class="frow" style="grid-template-columns:70px 1fr"><label><u>N</u>ame&nbsp;*</label><div class="tinput"><input id="nc-name" type="text" maxlength="60"></div></div>
      <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:12px">
        <button class="btn dlgbtn default" id="nc-ok"><span>OK</span></button>
        <button class="btn dlgbtn" id="nc-cancel">Cancel</button>
      </div>
    </div>`;
  // stack over existing overlay content
  const ov = overlay();
  const dlg = el('div','dialog'); dlg.style.width='300px'; dlg.style.left=Math.round((innerWidth-300)/2)+'px'; dlg.style.top=Math.round(innerHeight/2-70)+'px';
  dlg.style.zIndex='950'; dlg.appendChild(body); ov.appendChild(dlg);
  makeDraggable(dlg, body.querySelector('.dlg-title'));
  const close = ()=> dlg.remove();
  const ok = ()=>{ const v=$('#nc-name',dlg).value.trim(); if(!v){ $('#nc-name',dlg).focus(); return; } close(); cb(v); };
  $('#nc-ok',dlg).addEventListener('click', ok);
  $('#nc-cancel',dlg).addEventListener('click', close);
  $('[data-role="x"]',dlg).addEventListener('click', close);
  dlg.addEventListener('keydown', e=>{ if(e.key==='Enter'){e.preventDefault();ok();} else if(e.key==='Escape'){e.preventDefault();close();} });
  setTimeout(()=>$('#nc-name',dlg).focus(),0);
}

/* ---------- Properties (read-only for now) ---------- */
function showProperties(id){
  const p=byId(id); if(!p) return;
  const body=el('div');
  body.innerHTML=`
    <div class="dlg-title"><span class="ico">${ICON.project}</span><span class="dlg-title-text">${esc(p.id)} Properties</span><button class="tb-btn" data-role="x"><i class="gl-close"></i></button></div>
    <div class="dlg-body" style="width:360px">
      <div class="group"><span class="legend">Identity</span>
        <div class="ws-facts" style="margin:0">
          <div class="k">Project ID</div><div>${esc(p.id)}</div>
          <div class="k">Title</div><div>${esc(p.title)}</div>
          <div class="k">Customer</div><div>${esc(p.customer)}</div>
          <div class="k">Location</div><div>${esc([p.address,locOf(p),p.zip].filter(Boolean).join(', ')||'—')}</div>
          <div class="k">Created</div><div>${esc(p.created||'—')}</div>
        </div>
      </div>
      <div class="group"><span class="legend">State</span>
        <div class="ws-facts" style="margin:0">
          <div class="k">Stage</div><div>${esc(isHold(p)?'On Hold':p.stage)}</div>
          <div class="k">Status</div><div>${esc(p.status)}</div>
          <div class="k">Next date</div><div>${esc(dash(p.next))}</div>
          <div class="k">Value</div><div>${money(p.value)}</div>
          <div class="k">Attention</div><div>${p.alert?esc(p.alert.kind):'None'}</div>
        </div>
      </div>
      ${p.notes?`<div class="group"><span class="legend">Notes</span><div style="line-height:1.4">${esc(p.notes)}</div></div>`:''}
      <div style="display:flex;justify-content:flex-end"><button class="btn dlgbtn default" id="pr-ok"><span>OK</span></button></div>
    </div>`;
  const dlg=openDialog(body,360,360);
  const close=()=>closeDialog();
  $('#pr-ok',dlg).addEventListener('click',close);
  $('[data-role="x"]',dlg).addEventListener('click',close);
  dlg.addEventListener('keydown',e=>{ if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();close();} });
}

/* ---------- generic message box ---------- */
function messageBox(title, icon, html, buttons, cb){
  const ov = overlay(); ov.classList.remove('hidden');
  const box = el('div','dialog msgbox'); box.style.zIndex='980';
  box.style.left=Math.round((innerWidth-330)/2)+'px'; box.style.top=Math.round(innerHeight/2-90)+'px';
  box.innerHTML=`
    <div class="dlg-title"><span class="dlg-title-text">${esc(title)}</span></div>
    <div class="mb-body"><div style="flex:none">${icon}</div><div class="mb-text">${html}</div></div>
    <div class="mb-buttons">${buttons.map((b,i)=>`<button class="btn dlgbtn${i===0?' default':''}" data-b="${esc(b)}">${i===0?`<span>${esc(b)}</span>`:esc(b)}</button>`).join('')}</div>`;
  ov.appendChild(box);
  const done = ans => { box.remove(); if(!overlay().querySelector('.dialog')) {} cb && cb(ans); };
  $$('.mb-buttons .btn', box).forEach(btn=> btn.addEventListener('click', ()=>done(btn.dataset.b)));
  box.addEventListener('keydown', e=>{ if(e.key==='Enter'){e.preventDefault();done(buttons[0]);} else if(e.key==='Escape'){e.preventDefault();done(buttons[buttons.length-1]);} });
  box.tabIndex=-1; setTimeout(()=>box.focus(),0);
}
function notBuilt(what){
  messageBox('Project Manager', ICON.info,
    `<b>${esc(what)}</b> isn’t available in this build.<br>This action needs printing, file, or system support that isn’t wired up yet.`,
    ['OK']);
}
function showAbout(){
  messageBox('About Project Manager', ICON.info,
    `<b>Build Play Contracting — Project Manager 1.0</b><br>Shell build: Project Browser &amp; New Project.<br>Data is stored locally on this machine.`,
    ['OK']);
}

/* ============================================================
   GLOBAL KEYBOARD
   ============================================================ */
document.addEventListener('keydown', e=>{
  if(overlay().classList.contains('hidden')===false) return; // dialog handles its own keys
  if($('#childwin')){ if(e.key==='Escape'){ e.preventDefault(); closeFullWindow(); render(); } return; } // editor/viewer window
  const tag=(e.target.tagName||'').toLowerCase();
  const typing = tag==='input'||tag==='textarea';
  if(e.ctrlKey && e.key.toLowerCase()==='n'){ e.preventDefault(); openNewProject(); }
  else if(e.ctrlKey && e.key.toLowerCase()==='o'){ e.preventDefault(); const s=selectedProject(); if(s) openProject(s.id); }
  else if(e.ctrlKey && e.key.toLowerCase()==='f'){ e.preventDefault(); $('#find-input').focus(); }
  else if(e.ctrlKey && e.key==='Tab'){ e.preventDefault(); nextWindow(); }
  else if(e.ctrlKey && e.key==='F4'){ if(viewMode==='workspace'&&activeProjectId){ e.preventDefault(); closeProjectWindow(activeProjectId); } }
  else if(e.ctrlKey && e.key==='PageDown'){ if(viewMode==='workspace'){ e.preventDefault(); sectionStep(1); } }
  else if(e.ctrlKey && e.key==='PageUp'){ if(viewMode==='workspace'){ e.preventDefault(); sectionStep(-1); } }
  else if(e.key==='F5'){ e.preventDefault(); render(); }
  else if(!typing && viewMode==='browser' && e.key==='Enter'){ const s=selectedProject(); if(s){ e.preventDefault(); openProject(s.id); } }
  else if(e.altKey && e.key==='Enter' && viewMode==='browser'){ const s=selectedProject(); if(s){ e.preventDefault(); showProperties(s.id); } }
  else if(e.key==='Escape'){ closeAllPopups(); }
});

/* ============================================================
   WINDOW CONTROLS + BOOT
   ============================================================ */
function wireWindowControls(){
  $('#btn-min').addEventListener('click', ()=> window.winControls?.minimize());
  $('#btn-max').addEventListener('click', ()=> window.winControls?.toggleMaximize());
  $('#btn-close').addEventListener('click', ()=> window.winControls?.close());
}

function boot(){
  loadState();
  buildMenuBar();
  buildToolbar();
  buildFilterBand();
  wireWindowControls();
  render();
  setInterval(renderStatusBar, 15000); // keep the clock current
}
document.addEventListener('DOMContentLoaded', boot);
