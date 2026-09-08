// Build Play Estimating — front end.
// Three views: projects list -> one project -> one version (five tabs).
// Every figure comes from window.estimating (preload -> main -> engine/engine.js);
// this file routes, renders and marshals. It computes nothing itself.

const S = {
  view: 'projects',          // 'projects' | 'project' | 'version'
  projects: [],
  projectId: null,
  project: null, soil: null, versions: [],
  versionId: null,
  tab: 'scope',              // scope | reqs | cost | estimate | actuals
  scopeTab: 'components',    // components | installation | site

  version: null, components: [], latestRendition: null,
  runId: null,
  materialTotals: [], outputTotals: [],
  scopeTree: [], installDetail: [],
  procurementMethods: {}, dispositionMethods: {},
  methodChoice: {}, dispChoice: {},
  costDetail: null, costTotals: null,
  renditions: [], checklist: [],
  footingSpecs: [],
  expanded: {},              // row key -> bool
  selectedComponent: null,
  projectServices: [],
  catalogFootings: {},       // installation_id -> catalog default code
  railKind: 'comp', railTerm: '', catalogResults: [],
};

const money = (n) => (n == null ? '—' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
const money0 = (n) => (n == null ? '—' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`);
const num = (n, d = 2) => (n == null ? '—' : Number(n).toFixed(d));
const pct = (n) => (n == null ? '—' : `${Number(n).toFixed(1)}%`);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const q = (sel) => document.querySelector(sel);
const isLocked = () => S.version && S.version.status !== 'draft';

function setStatus(m) { q('#status-msg').textContent = m; }

async function call(fn, ...args) {
  const res = await window.estimating[fn](...args);
  if (!res.ok) { setStatus(`Error: ${res.error}`); throw new Error(res.error); }
  return res.data;
}

const STAGE_LABEL = { estimating: 'Estimating', out_for_bid: 'Out for bid', awarded: 'Awarded', on_hold: 'On hold', closed: 'Closed', lost: 'Lost' };

// ============================================================ chrome

function renderChrome() {
  const menus = {
    projects: ['File', 'Edit', 'View', 'Project', 'Catalog', 'Reports', 'Help'],
    project: ['File', 'Edit', 'View', 'Project', 'Version', 'Reports', 'Help'],
    version: ['File', 'Edit', 'View', 'Option', 'Scope', 'Reports', 'Help'],
  }[S.view];
  q('#menubar').innerHTML = menus.map((m) => `<div class="m"><u>${m[0]}</u>${m.slice(1)}</div>`).join('');

  const chrome = q('#chrome');
  if (S.view === 'projects') {
    q('#title-text').textContent = 'Build Play Estimating — Projects';
    chrome.innerHTML = `<div class="toolbar">
      <span class="btn" data-act="new-project">New Project&hellip;</span>
      <span class="vsep"></span>
      <span class="btn dis">Catalog&hellip;</span>
      <span class="btn dis">Rates &amp; Resources&hellip;</span>
    </div>`;
    q('#status-right').textContent = `${S.projects.length} projects`;
    return;
  }

  if (S.view === 'project') {
    q('#title-text').textContent = `BPCp ${S.project.project_number} — ${S.project.name}`;
    chrome.innerHTML = `<div class="toolbar">
      <span class="btn" data-act="back-projects">&#8592; Projects</span>
      <span class="vsep"></span>
      <span class="btn" data-act="new-version">New Version&hellip;</span>
    </div>`;
    q('#status-right').textContent = `${S.versions.length} version(s)`;
    return;
  }

  // version view — the strip + the five tabs
  const p = S.project;
  const segs = S.versions.map((v) =>
    `<span class="seg ${v.id === S.versionId ? 'on' : ''}" data-version="${esc(v.id)}">${esc(v.letter)} · ${esc(v.name || '')}</span>`).join('');
  const ref = S.latestRendition ? S.latestRendition.reference
    : `BPCe ${p.project_number}${S.version.version_letter}${S.version.current_rendition_number}`;
  q('#title-text').textContent = `${ref} — ${S.project.name}`;
  q('#titlebar').classList.toggle('locked', !!isLocked());

  const tabs = [['scope', 'Scope'], ['reqs', 'Requirements'], ['cost', 'Cost'], ['estimate', 'Estimate'], ['actuals', 'Actuals']];
  chrome.innerHTML = `
    <div class="verstrip">
      <span class="btn sm" data-act="back-project">&#8592;</span>
      <span class="dim">BPCp ${esc(p.project_number)} ${esc(p.name)} &#9656;</span>
      <span class="segbox">${segs}</span>
      <span style="margin-left:auto" class="dim">${isLocked() ? `<b>${esc(ref)}</b> issued — scope locked` : 'Live scope · draft'}</span>
    </div>
    <div class="tabs">
      ${tabs.map(([k, l]) => `<div class="tab ${S.tab === k ? 'on' : ''}" data-tab="${k}">${l}</div>`).join('')}
      <span class="tabtools">
        <span class="btn ${isLocked() ? 'dis' : ''}" data-act="calculate"><u>F9</u> Recalculate</span>
      </span>
    </div>`;
  q('#status-right').textContent = S.latestRendition && S.latestRendition.contract_value != null
    ? `Contract ${money(S.latestRendition.contract_value)}` : 'not issued';
}

// ============================================================ projects view

function renderProjects() {
  const rows = S.projects.map((p) => {
    const blocked = p.versions.some((v) => v.status === 'draft') && !p.latestReference && p.bidDue;
    const chips = p.versions.map((v) => `<span class="chip">${esc(v.letter)}</span>`).join(' ');
    return `<tr data-project="${esc(p.id)}">
      <td class="exp">${blocked ? '<span class="warn">!</span>' : ''}</td>
      <td class="mono">${esc(p.number)}</td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.customer || '—')}</td>
      <td>${esc(STAGE_LABEL[p.stage] || p.stage)}</td>
      <td>${chips}</td>
      <td class="mono">${p.latestReference ? esc(p.latestReference) : '<span class="faint">not issued</span>'}</td>
      <td class="end mono">${p.sell == null ? '<span class="faint">—</span>' : money0(p.sell)}</td>
      <td class="end mono">${p.margin == null ? '<span class="faint">—</span>' : pct(p.margin)}</td>
      <td>${p.bidDue ? esc(p.bidDue) : '<span class="faint">—</span>'}</td>
    </tr>`;
  }).join('');

  const issued = S.projects.filter((p) => p.latestReference);
  const pipeline = issued.reduce((s, p) => s + (p.sell || 0), 0);
  const drafts = S.projects.filter((p) => !p.latestReference).length;

  q('#page').innerHTML = `
    <div class="cards">
      <div class="card"><h5>OUT FOR BID</h5><div class="kv"><span>${S.projects.filter((p) => p.stage === 'out_for_bid').length} projects</span><b class="mono">${money0(pipeline)}</b></div><div class="sub">issued and awaiting response</div></div>
      <div class="card"><h5>DRAFTS</h5><div class="kv"><span>${drafts} in progress</span><b class="mono">—</b></div><div class="sub">nothing issued yet</div></div>
      <div class="card"><h5>AWARDED</h5><div class="kv"><span>${S.projects.filter((p) => p.stage === 'awarded').length} projects</span><b class="mono">—</b></div><div class="sub">won, in delivery</div></div>
      <div class="card"><h5>TOTAL</h5><div class="kv"><span>${S.projects.length} projects</span><b class="mono">${money0(pipeline)}</b></div><div class="sub">issued value across all stages</div></div>
    </div>
    <div class="tblwrap">
      <table class="tbl">
        <thead><tr>
          <th style="width:20px"></th><th style="width:80px">Project</th><th>Name</th>
          <th style="width:150px">Customer</th><th style="width:100px">Stage</th><th style="width:90px">Versions</th>
          <th style="width:140px">Latest issue</th><th class="end" style="width:100px">Sell</th>
          <th class="end" style="width:60px">GM</th><th style="width:90px">Bid due</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="band">Double-click a project to open it. Sell and margin come from the most recent <i>issued</i> rendition plus any approved change orders — a draft in progress deliberately shows no value, because a number nobody has issued is not a number anyone should quote.</div>`;
}

// ============================================================ project view

function renderProject() {
  const p = S.project;
  const rows = S.versions.map((v) => `<tr data-open-version="${esc(v.id)}">
    <td class="mono" style="width:26px">${esc(v.letter)}</td>
    <td>${esc(v.name || '—')}</td>
    <td class="end mono">${v.componentCount}</td>
    <td>${v.latest ? `<span class="mono">${esc(v.latest.reference)}</span>` : '<span class="faint">not issued</span>'}</td>
    <td>${v.status === 'draft' ? 'draft' : `<span class="pill issued">issued</span>`}</td>
    <td class="end mono">${v.contractValue == null ? '<span class="faint">—</span>' : money(v.contractValue)}</td>
    <td>${v.changeOrders.length ? `${v.changeOrders.length} CO` : '<span class="faint">—</span>'}</td>
  </tr>`).join('');

  q('#page').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 340px;gap:10px;align-items:start">
      <div>
        <div class="secthead"><span class="h">VERSIONS</span><span class="dim">each is one priced design — the letter is the scope, the digit is the issue</span></div>
        <div class="tblwrap"><table class="tbl">
          <thead><tr><th style="width:26px"></th><th>Design</th><th class="end" style="width:80px">Scope rows</th><th style="width:150px">Latest issue</th><th style="width:80px">Status</th><th class="end" style="width:110px">Contract</th><th style="width:70px">COs</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="7" class="empty">No versions yet.</td></tr>'}</tbody>
        </table></div>
        <div class="band">Double-click a version to open its scope. Changing what the job <i>is</i> means a new letter; re-pricing the same design means a new digit.</div>
      </div>
      <div class="panel">
        <h5>PROJECT</h5>
        <div class="rows" style="--lw:92px">
          <span class="dim">Number</span><span class="mono">BPCp ${esc(p.project_number)}</span>
          <span class="dim">Customer</span><span>${esc(p.customer || '—')}</span>
          <span class="dim">Address</span><span>${esc(p.address || '—')}</span>
          <span class="dim">Stage</span><span>${esc(STAGE_LABEL[p.stage] || p.stage)}</span>
          <span class="dim">Bid due</span><span class="mono">${esc(p.bid_due || '—')}</span>
        </div>
        <h5 style="margin-top:12px">SITE CONDITIONS</h5>
        <div class="rows" style="--lw:92px">
          <span class="dim">Soil type</span><span>${S.soil ? esc(S.soil.name) : '<span class="faint">not set</span>'}</span>
          <span class="dim">Swell</span><span class="mono der">${S.soil ? num(S.soil.swell_factor) : '—'}</span>
          <span class="dim">Density</span><span class="mono der">${S.soil ? `${num(S.soil.density_lb_per_cy, 0)} lb/CY` : '—'}</span>
          <span class="dim">Dig factor</span><span class="mono der">${S.soil ? num(S.soil.dig_factor) : '—'}</span>
          <span class="dim">Haul</span><span class="mono">${p.haul_distance_mi != null ? `${num(p.haul_distance_mi, 0)} mi` : '—'}</span>
          <span class="dim">Contamination</span><span class="${p.contamination_status === 'none' ? '' : 'warn'}">${esc(p.contamination_status)}</span>
        </div>
        <div class="band">One soil type sets swell, density and dig factor together, so three related assumptions cannot drift apart.</div>
      </div>
    </div>`;
}

// ============================================================ version — scope

// The 2c page: add-to-scope rail + scope totals, the INSTALLATION tree with a
// method picker and override cells, then the SERVICES table for work added
// directly to the version.
function renderScopeComponents() {
  const workCost = S.scopeTree.reduce((s, x) => s + x.laborCost + x.equipCost, 0);
  const svcLabor = S.projectServices.reduce((s, x) => s + (x.laborHr || 0), 0);
  const svcEquip = S.projectServices.reduce((s, x) => s + (x.equipHr || 0), 0);
  const rate = 34, eqRate = 45;
  const svcCost = svcLabor * rate + svcEquip * eqRate;

  const totals = {
    components: S.components.length,
    services: S.projectServices.length,
    footings: S.installDetail.reduce((s, d) => s + (d.footingCount || 0), 0),
    concrete: (S.materialTotals.find((m) => m.material_id === 'mat_concrete') || {}).required_quantity,
    spoils: S.outputTotals.filter((o) => o.output_material_id === 'mat_spoils').reduce((s, o) => s + o.generated_quantity, 0),
  };

  // ---- left rail: add to scope -------------------------------------------
  const results = S.catalogResults.map((r, i) => `<div class="ri ${i === 0 ? 'on' : ''}" data-add="${esc(S.railKind)}:${esc(r.id)}">
      ${esc(r.name)}<div class="sub">${esc(r.sub || '')}${r.unit ? ` · ${esc(r.unit)}` : ''}${r.profiles ? ` · ${r.profiles} profile(s)` : ''}</div>
    </div>`).join('');
  const rail = `<div class="rail">
    <h4>ADD TO SCOPE <span class="faint" style="font-weight:400">— press /</span></h4>
    <input class="fld" id="rail-search" value="${esc(S.railTerm)}" placeholder="search the catalog" ${isLocked() ? 'disabled' : ''}>
    <div class="railfilters">
      ${[['comp', 'Comp'], ['svc', 'Svc'], ['spec', 'Spec']].map(([k, l]) => `<div class="rf ${S.railKind === k ? 'on' : ''}" data-railkind="${k}">${l}</div>`).join('')}
    </div>
    <div class="raillist">${results || '<div class="ri faint">no matches</div>'}</div>
    <div class="dim" style="margin-top:5px;line-height:1.45">${isLocked() ? 'Scope is locked on an issued rendition.' : 'Click an entry to add it with its default method — it pulls in the footings, cages and services it requires.'}</div>

    <h4 style="margin-top:9px">SCOPE TOTALS</h4>
    <table class="tbl"><tbody>
      <tr><td>Components</td><td class="end mono">${totals.components}</td></tr>
      <tr><td>Services</td><td class="end mono">${totals.services}</td></tr>
      <tr><td>Footings</td><td class="end mono">${totals.footings || '—'}</td></tr>
      <tr><td>Concrete req.</td><td class="end mono">${totals.concrete != null ? num(totals.concrete) + ' CY' : '—'}</td></tr>
      <tr><td>Spoils gen.</td><td class="end mono">${totals.spoils ? num(totals.spoils) + ' CY' : '—'}</td></tr>
    </tbody></table>
    <div class="dim" style="margin-top:6px;line-height:1.45">Quantities update on Recalculate. No prices here — pricing happens on Cost, after procurement.</div>
  </div>`;

  // ---- installation tree --------------------------------------------------
  const compRows = S.components.map((c) => {
    const tree = S.scopeTree.find((t) => t.projectComponentId === c.id);
    const inst = S.installDetail.find((x) => x.projectComponentId === c.id) || {};
    const open = !!S.expanded[c.id];
    const catalogCode = S.catalogFootings[c.installation_id];

    const kids = (tree && open) ? tree.requirements.map((r, i, arr) => {
      const last = i === arr.length - 1;
      const isSpec = r.kind === 'specification';
      const assumption = isSpec && inst.overridden
        ? `<span class="ovr"><b>▲</b> ${esc(inst.footingCode)} ${catalogCode ? `<s class="faint">${esc(catalogCode)}</s>` : ''}</span>`
        : esc(r.assumption || '');
      return `<tr class="sub">
        <td></td>
        <td class="tree">${last ? '└' : '├'} <b>${esc(r.label)}</b> ${r.interpolated ? '<span class="warn">▲ rate interpolated</span>' : ''}</td>
        <td class="end mono">${num(r.qty, 0)}</td>
        <td class="faint">${esc(r.kind === 'specification' ? 'spec' : r.kind === 'assembly' ? 'comp' : 'svc')}</td>
        <td>${assumption}</td>
        <td class="end mono">${r.laborHr ? num(r.laborHr) : '<span class="faint">—</span>'}</td>
        <td class="end mono">${r.equipHr ? num(r.equipHr) : '<span class="faint">—</span>'}</td>
        <td class="mono" style="font-size:10px">${esc(r.generates || '')}</td>
      </tr>`;
    }).join('') : '';

    const detail = (tree && open) ? `<tr class="sub"><td></td><td colspan="7" style="padding:0 6px 8px">
      <div class="detail" style="grid-template-columns:1fr 1fr 1.1fr">
        <div><h5>THIS COMPONENT'S DIRECT COST</h5><div class="ln">Product${' '.repeat(12)}${money(tree.productCost)}<br>Labor ${num(tree.laborHr)} hr${' '.repeat(6)}${money(tree.laborCost)}<br>Equipment ${num(tree.equipHr)} hr${' '.repeat(2)}${money(tree.equipCost)}<br><span class="rule">Direct${' '.repeat(13)}${money(tree.directCost)}</span></div></div>
        <div><h5>REQUIREMENTS IT GENERATES</h5><div class="ln">${tree.requirements.filter((r) => r.generates).map((r) => esc(r.generates)).join('<br>') || 'nothing'}</div><div class="dim" style="margin-top:3px">Quantities only — priced once, option-wide, on Cost.</div></div>
        ${inst.overridden
        ? `<div class="ovrcard"><h5>▲ ENGINEERING OVERRIDE</h5><div style="line-height:1.55">Footing spec for this job<br>${catalogCode ? `<s class="faint">Catalog ${esc(catalogCode)}</s><br>` : ''}<b>${esc(inst.footingCode)} — ${num(inst.excavationCyEach, 2)} CY each</b></div>
             <div class="btnrow">${isLocked() ? '' : `<span class="btn sm" data-act="pick-footing:${esc(c.id)}">Edit</span><span class="btn sm" data-act="revert-footing:${esc(c.id)}">Revert to catalog</span>`}</div></div>`
        : `<div><h5>INSTALLATION</h5><div class="ln">Profile${' '.repeat(4)}${esc(inst.profileName || '')}<br>Footing${' '.repeat(3)}${esc(inst.footingCode || '')}<br>Count${' '.repeat(6)}${inst.footingCount}<br>exc/ea${' '.repeat(4)}${num(inst.excavationCyEach, 3)} CY<br>conc/ea${' '.repeat(3)}${num(inst.concreteCyEach, 3)} CY</div>
             <div class="btnrow">${isLocked() ? '' : `<span class="btn sm" data-act="pick-footing:${esc(c.id)}">Change footing…</span>`}</div></div>`}
      </div></td></tr>` : '';

    return `<tr class="${open ? 'parent' : ''}">
      <td class="exp" data-expand="${esc(c.id)}">${tree ? (open ? '−' : '+') : ''}</td>
      <td data-expand="${esc(c.id)}"><b>${esc(c.component_name)}</b></td>
      <td class="end mono">${c.quantity}</td>
      <td>${inst.profileName ? `<span class="picker" data-act="pick-profile:${esc(c.id)}">${esc(abbrevProfile(inst.profileName))} ▼</span>` : '<span class="faint">—</span>'}</td>
      <td class="dim">${inst.footingCode ? `${esc(inst.footingCode)} · ${inst.footingCount} footings` : '<span class="faint">run Recalculate</span>'}</td>
      <td class="end mono">${tree ? num(tree.laborHr) : '—'}</td>
      <td class="end mono">${tree ? num(tree.equipHr) : '—'}</td>
      <td class="mono" style="font-size:10px">${tree ? tree.requirements.filter((r) => r.generates).map((r) => esc(r.generates)).join(' · ') : ''}</td>
      <td class="exp">${isLocked() ? '' : `<span class="rm" data-remove="component:${esc(c.id)}">×</span>`}</td>
    </tr>${kids}${detail}`;
  }).join('');

  // ---- services table -----------------------------------------------------
  const svcRows = S.projectServices.map((s) => `<tr>
    <td class="exp"></td>
    <td>${esc(s.name)}</td>
    <td class="end mono">${num(s.quantity, s.quantity % 1 ? 2 : 0)}</td>
    <td>${esc(s.unit || s.default_unit || '')}</td>
    <td class="dim">${s.labor_hr_per_unit ? `${num(s.labor_hr_per_unit, 4)} hr/${esc(s.unit || '')}` : ''}${s.digFactor && s.digFactor !== 1 ? ` · <span class="ovr">dig ×${num(s.digFactor)}</span>` : ''}</td>
    <td class="end mono">${s.laborHr != null ? num(s.laborHr) : '<span class="faint">—</span>'}</td>
    <td class="end mono">${s.equipHr != null ? num(s.equipHr) : '<span class="faint">—</span>'}</td>
    <td class="mono" style="font-size:10px">${esc(s.generates || s.consumes || '')}</td>
    <td class="exp">${isLocked() ? '' : `<span class="rm" data-remove="service:${esc(s.id)}">×</span>`}</td>
  </tr>`).join('');

  const undecided = S.outputTotals.filter((o) => !(S.costDetail && S.costDetail.disposition || []).some((d) => d.output_material_id === o.output_material_id && d.output_subtype === o.output_subtype));

  return `<div class="scopegrid">
    ${rail}
    <div>
      ${isLocked() ? `<div class="lockband"><b>&#128274; LOCKED</b><span>This rendition is issued. Reopen it, or raise a change order.</span></div>` : ''}

      <div class="secthead"><span class="h">INSTALLATION</span><span class="dim">components and what each one requires · expand to trace</span>
        <span class="r">work cost <b class="mono">${money0(workCost)}</b> · requirements priced at procurement</span></div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th style="width:20px"></th><th>Component / requirement</th><th class="end" style="width:52px">Qty</th><th style="width:78px">Method</th><th style="width:210px">Assumption / spec</th><th class="end" style="width:84px">Labor hr</th><th class="end" style="width:84px">Equip hr</th><th style="width:230px">Generates</th><th style="width:22px"></th></tr></thead>
        <tbody>${compRows || '<tr><td colspan="9" class="empty">No components — add one from the rail.</td></tr>'}</tbody>
      </table></div>

      <div class="secthead" style="margin-top:12px"><span class="h">SERVICES</span><span class="dim">work added directly to the option — not pulled in by a component</span>
        <span class="r">work cost <b class="mono">${money0(svcCost)}</b></span></div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th style="width:20px"></th><th>Service</th><th class="end" style="width:78px">Qty</th><th style="width:44px">Unit</th><th style="width:218px">Production / factors</th><th class="end" style="width:84px">Labor hr</th><th class="end" style="width:84px">Equip hr</th><th style="width:230px">Generates / consumes</th><th style="width:22px"></th></tr></thead>
        <tbody>${svcRows || '<tr><td colspan="9" class="empty">No services added directly — add one from the rail\'s Svc tab.</td></tr>'}</tbody>
      </table></div>

      <div class="band">No hauling line here. Removal and excavation <i>generate</i> ${totals.spoils ? num(totals.spoils) + ' CY of spoils' : 'spoils'} and debris — what happens to them is a disposition decision on the Cost page${undecided.length ? `, and ${undecided.length} ${undecided.length === 1 ? 'is' : 'are'} <b>currently unset</b>` : ''}.</div>
    </div>
  </div>`;
}

function abbrevProfile(name) {
  if (/direct bury/i.test(name)) return 'DB';
  if (/surface/i.test(name)) return 'SM';
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();
}

function renderScopeTab() {
  const sub = S.scopeTab;
  const subtabs = [['components', 'Components'], ['installation', 'Installation'], ['site', 'Site conditions']];
  const strip = `<div class="subtabs">${subtabs.map(([k, l]) => `<div class="tab ${sub === k ? 'on' : ''}" data-scopetab="${k}">${l}</div>`).join('')}</div>`;

  let body = '';
  if (sub === 'components') body = renderScopeComponents();

  if (sub === 'installation') {
    const d = S.installDetail.find((x) => x.projectComponentId === S.selectedComponent) || S.installDetail[0];
    body = !d ? '<div class="empty">Run Recalculate to resolve installation details.</div>' : `
      <div style="max-width:640px">
        <div class="grp"><span class="leg">Installation — ${esc(d.componentName)}</span>
          <div class="rows" style="--lw:120px">
            <span class="dim">Profile</span><span class="der">${esc(d.profileName)}</span>
            <span class="dim">Complexity</span><div class="unitrow"><span class="der mono" style="width:60px;text-align:right">${num(d.complexityFactor)}</span><span class="faint">× applied to labor only</span></div>
            <span class="dim">Footing spec</span><div class="unitrow"><span class="${d.overridden ? 'ovr' : 'der'}">${d.overridden ? '▲ ' : ''}${esc(d.footingCode)}</span><span class="faint">${d.overridden ? 'project override' : 'catalog default'}</span>${isLocked() ? '' : `<span class="btn sm" data-act="pick-footing">Change…</span>`}</div>
            <span class="dim">Footings</span><div class="unitrow"><span class="der mono" style="width:60px;text-align:right">${d.footingCount}</span><span class="faint">fixed by the component chosen</span></div>
          </div>
        </div>
        <div class="grp"><span class="leg">What one footing generates</span>
          <div class="rows" style="--lw:120px">
            <span class="dim">Excavation</span><div class="unitrow"><span class="der mono" style="width:70px;text-align:right">${num(d.excavationCyEach, 3)}</span><span>CY</span></div>
            <span class="dim">Concrete</span><div class="unitrow"><span class="der mono" style="width:70px;text-align:right">${num(d.concreteCyEach, 3)}</span><span>CY</span><span class="faint">less post displacement</span></div>
            <span class="dim">Spoils</span><div class="unitrow"><span class="der mono" style="width:70px;text-align:right">${num(d.excavationCyEach, 3)}</span><span>CY</span><span class="faint">in place, before swell</span></div>
          </div>
          <div class="band">Grey fields are derived and cannot be typed into. Swell is not applied here — it belongs to the soil on this site.</div>
        </div>
      </div>`;
  }

  if (sub === 'site') {
    const p = S.project, s = S.soil;
    body = !s ? '<div class="empty">No soil type set on this project.</div>' : `
      <div style="max-width:620px">
        <div class="grp"><span class="leg">Soil</span>
          <div class="rows" style="--lw:110px">
            <span class="dim">Soil type</span><span class="der">${esc(s.name)}</span>
            <span class="dim">Swell factor</span><div class="unitrow"><span class="der mono" style="width:60px;text-align:right">${num(s.swell_factor)}</span><span class="faint">from catalog</span></div>
            <span class="dim">Override</span><div class="unitrow"><span class="${p.swell_override != null ? 'ovr' : 'fld'} mono" style="width:60px;text-align:right">${p.swell_override != null ? num(p.swell_override) : '&nbsp;'}</span><span class="faint">blank = use catalog</span></div>
            <span class="dim">Density</span><div class="unitrow"><span class="der mono" style="width:88px;text-align:right">${num(s.density_lb_per_cy, 0)}</span><span>lb/CY</span><span class="faint">per-ton hauling</span></div>
            <span class="dim">Dig factor</span><div class="unitrow"><span class="der mono" style="width:60px;text-align:right">${num(s.dig_factor)}</span><span class="faint">earthwork services only</span></div>
          </div>
        </div>
        <div class="grp"><span class="leg">Site</span>
          <div class="rows" style="--lw:110px">
            <span class="dim">Haul distance</span><div class="unitrow"><span class="der mono" style="width:60px;text-align:right">${num(p.haul_distance_mi, 0)}</span><span>mi</span></div>
            <span class="dim">Spoil on site</span><span class="der">${p.spoil_onsite_permitted ? 'Permitted' : 'Not permitted'}</span>
            <span class="dim">Contamination</span><span class="${p.contamination_status === 'none' ? 'der' : 'tbd'}">${esc(p.contamination_status)}</span>
          </div>
        </div>
      </div>`;
  }

  q('#page').innerHTML = strip + `<div class="subpane">${body}</div>`;
}

// ============================================================ version — requirements

function renderReqsTab() {
  if (!S.materialTotals.length && !S.outputTotals.length) {
    q('#page').innerHTML = '<div class="empty">Run Recalculate to expand scope into requirements.</div>';
    return;
  }
  const interpolated = [];
  for (const t of S.scopeTree) for (const r of t.requirements) if (r.interpolated) interpolated.push({ comp: t.name, label: r.label });

  const mats = S.materialTotals.map((m) => `<tr>
    <td>${esc(m.material_id)}</td>
    <td class="end mono">${num(m.required_quantity)}</td>
    <td>${esc(m.unit)}</td>
    <td>${S.procurementSelectionFor && S.procurementSelectionFor[m.material_id] ? '' : ''}<span class="faint">${esc(sourcesFor(m.material_id))}</span></td>
  </tr>`).join('');

  const outs = S.outputTotals.map((o) => `<tr>
    <td>${esc(o.output_material_id)}</td>
    <td>${o.output_subtype === 'contaminated' ? `<span class="tbd">${esc(o.output_subtype)}</span>` : esc(o.output_subtype)}</td>
    <td class="end mono">${num(o.generated_quantity)} ${esc(o.unit)}</td>
    <td class="end mono">${S.soil ? num(S.soil.swell_factor) : '—'}</td>
    <td class="end mono">${S.soil ? num(o.generated_quantity * S.soil.swell_factor) : '—'} ${esc(o.unit)}</td>
  </tr>`).join('');

  q('#page').innerHTML = `
    <div class="cards">
      <div class="card"><h5>MATERIAL REQUIREMENTS</h5><div class="kv"><span>Distinct materials</span><b class="mono">${S.materialTotals.length}</b></div><div class="sub">aggregated across the version</div></div>
      <div class="card"><h5>GENERATED OUTPUTS</h5><div class="kv"><span>Distinct outputs</span><b class="mono">${S.outputTotals.length}</b></div><div class="sub">swell applied from site soil</div></div>
      <div class="card"><h5>SCOPE SOURCES</h5><div class="kv"><span>Components</span><b class="mono">${S.components.length}</b></div><div class="sub">every quantity traces to one</div></div>
      <div class="card"><h5>INFERRED VALUES</h5><div class="kv"><span>Interpolated rates</span><b class="mono ${interpolated.length ? 'warn' : ''}">${interpolated.length}</b></div><div class="sub">${interpolated.length ? 'not catalog-tested' : 'all rates from catalog'}</div></div>
    </div>

    <div class="secthead"><span class="h">1 · MATERIAL REQUIREMENTS</span><span class="dim">what the scope needs, before anyone buys anything</span></div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>Requirement</th><th class="end" style="width:110px">Required</th><th style="width:60px">Unit</th><th>Sources</th></tr></thead>
      <tbody>${mats}</tbody>
    </table></div>

    <div class="secthead" style="margin-top:12px"><span class="h">2 · GENERATED OUTPUTS</span><span class="dim">what the work produces — disposition is decided on Cost</span></div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>Generated output</th><th style="width:110px">Subtype</th><th class="end" style="width:110px">In place</th><th class="end" style="width:80px">Swell</th><th class="end" style="width:120px">Loose</th></tr></thead>
      <tbody>${outs}</tbody>
    </table></div>

    ${interpolated.length ? `
    <div class="secthead" style="margin-top:12px"><span class="h">3 · INFERRED VALUES</span><span class="dim">numbers the catalog did not contain</span></div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>Where</th><th>How it was inferred</th></tr></thead>
      <tbody>${interpolated.map((i) => `<tr><td>${esc(i.comp)} — ${esc(i.label)}</td><td class="dim">linear by volume between the two nearest cataloged footing specs</td></tr>`).join('')}</tbody>
    </table></div>
    <div class="band">An interpolated rate is a guess with arithmetic behind it. It prices the job, but it never silently becomes catalog truth — Actuals is where a real number earns that promotion.</div>` : ''}

    <div class="band">Not one dollar figure on this page, by design. A requirement is a physical fact; a price is a decision made later against a supplier.</div>`;
}

function sourcesFor(materialId) {
  const hits = [];
  for (const t of S.scopeTree) for (const r of t.requirements) if ((r.generates || '').includes(materialId)) hits.push(t.name);
  return hits.length ? [...new Set(hits)].join(', ') : '—';
}

// ============================================================ version — cost

function renderCostTab() {
  if (!S.runId) { q('#page').innerHTML = '<div class="empty">Run Recalculate first.</div>'; return; }
  const d = S.costDetail || { procurement: [], disposition: [], product: [] };
  const t = S.costTotals || {};

  const work = S.scopeTree.map((x) => `<tr>
    <td>${esc(x.name)}</td>
    <td class="end mono">${num(x.laborHr)}</td><td class="end mono">${money(x.laborCost)}</td>
    <td class="end mono">${num(x.equipHr)}</td><td class="end mono">${money(x.equipCost)}</td>
    <td class="end mono"><b>${money(x.laborCost + x.equipCost)}</b></td>
  </tr>`).join('');

  const procRows = S.materialTotals.map((m) => {
    const methods = (S.procurementMethods[m.material_id] || []);
    const sel = d.procurement.find((p) => p.material_id === m.material_id);
    const chosen = S.methodChoice[m.material_id] || (methods[0] && methods[0].id);
    const opts = methods.map((x) => `<option value="${esc(x.id)}" ${x.id === chosen ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    return `<tr>
      <td>${esc(m.material_id)}</td>
      <td class="end mono">${num(m.required_quantity)} ${esc(m.unit)}</td>
      <td style="width:230px">${methods.length ? `<div class="combo"><select data-choice="proc:${esc(m.material_id)}" ${isLocked() ? 'disabled' : ''}>${opts}</select><span class="arw">&#9660;</span></div>` : '<span class="faint">none configured</span>'}</td>
      <td style="width:66px">${isLocked() ? '' : `<span class="picker" data-price="${esc(m.material_id)}">${sel ? 'Re-price' : 'Price'}</span>`}</td>
      <td class="end mono">${sel ? num(sel.purchased_quantity) : '—'}</td>
      <td class="end mono">${sel ? money(sel.unit_price) : '—'}</td>
      <td class="end mono">${sel ? money((sel.delivery_fee || 0) + (sel.short_load_fee || 0)) : '—'}</td>
      <td class="end mono"><b>${sel ? money(sel.total_cost) : '—'}</b></td>
    </tr>`;
  }).join('');

  const prodRows = d.product.map((p) => `<tr>
    <td>${esc(p.component_name)} — ${esc(p.vendor_name || '')}</td>
    <td class="end mono">${num(p.quantity, 0)} EA</td>
    <td class="dim">Quote ${esc(p.quote_number || '')}</td>
    <td></td>
    <td class="end mono">${num(p.quantity, 0)} EA</td>
    <td class="end mono">${money(p.unit_price)}</td>
    <td class="end mono">${money((p.freight || 0) + (p.crating || 0))}</td>
    <td class="end mono"><b>${money(p.product_cost)}</b></td>
  </tr>`).join('');

  const dispRows = S.outputTotals.map((o) => {
    const key = `${o.output_material_id}:${o.output_subtype}`;
    const methods = (S.dispositionMethods[o.output_material_id] || []);
    const sel = d.disposition.find((x) => x.output_material_id === o.output_material_id && x.output_subtype === o.output_subtype);
    const chosen = S.dispChoice[key] || (methods[0] && methods[0].id);
    const opts = methods.map((x) => `<option value="${esc(x.id)}" ${x.id === chosen ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    return `<tr>
      <td>${esc(o.output_material_id)}</td>
      <td>${o.output_subtype === 'contaminated' ? `<span class="tbd">${esc(o.output_subtype)}</span>` : esc(o.output_subtype)}</td>
      <td class="end mono">${num(o.generated_quantity)} ${esc(o.unit)}</td>
      <td class="end mono">${sel ? num(sel.loose_quantity) : '—'}</td>
      <td style="width:240px">${methods.length ? `<div class="combo"><select data-choice="disp:${esc(key)}" ${isLocked() ? 'disabled' : ''}>${opts}</select><span class="arw">&#9660;</span></div>` : '<span class="faint">none configured</span>'}</td>
      <td style="width:66px">${isLocked() ? '' : `<span class="picker" data-dispose="${esc(key)}">${sel ? 'Re-price' : 'Price'}</span>`}</td>
      <td class="mono" style="font-size:10px">${sel ? (sel.billing_basis === 'per_ton' ? `${num(sel.tonnage)} T @ ${num(sel.density_used_lb_per_cy, 0)} lb/CY` : `${sel.estimated_loads} loads`) : '<span class="tbd">! not decided</span>'}</td>
      <td class="end mono"><b>${sel ? money(sel.disposal_cost) : '—'}</b></td>
    </tr>`;
  }).join('');

  q('#page').innerHTML = `
    <div class="cards">
      <div class="card"><h5>1 · WORK</h5><div class="kv"><span>Labor + equipment</span><b class="mono">${money((t.labor || 0) + (t.equipment || 0))}</b></div><div class="sub">${num(S.scopeTree.reduce((s, x) => s + x.laborHr, 0))} labor hr · ${num(S.scopeTree.reduce((s, x) => s + x.equipHr, 0))} equip hr</div></div>
      <div class="card"><h5>2 · PROCUREMENT</h5><div class="kv"><span>Products + materials</span><b class="mono">${money((t.procurement || 0) + (t.product || 0))}</b></div><div class="sub">${d.product.length} products · ${d.procurement.length} materials</div></div>
      <div class="card"><h5>3 · DISPOSITION</h5><div class="kv"><span>Haul + disposal</span><b class="mono">${money(t.disposition || 0)}</b></div><div class="sub ${S.outputTotals.length > d.disposition.length ? 'bad' : ''}">${S.outputTotals.length - d.disposition.length} output(s) undecided</div></div>
      <div class="card"><h5>4 · RESULT</h5><div class="kv"><span>Total cost</span><b class="mono">${money(t.total || 0)}</b></div><div class="sub">${S.latestRendition ? `sell ${money(S.latestRendition.contract_value)}` : 'not issued'}</div></div>
    </div>

    <div class="secthead"><span class="h">1 · WORK COST</span><span class="dim">labor and equipment only — the work, not the stuff</span></div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>Work source</th><th class="end" style="width:80px">Labor hr</th><th class="end" style="width:100px">Labor $</th><th class="end" style="width:80px">Equip hr</th><th class="end" style="width:100px">Equip $</th><th class="end" style="width:110px">Work cost</th></tr></thead>
      <tbody>${work || '<tr><td colspan="6" class="empty">Nothing expanded.</td></tr>'}</tbody>
    </table></div>

    <div class="secthead" style="margin-top:12px"><span class="h">2 · REQUIREMENTS → PROCUREMENT</span><span class="dim">aggregated across the option, then bought once</span></div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>Requirement</th><th class="end" style="width:100px">Required</th><th>Procurement</th><th></th><th class="end" style="width:90px">Purchased</th><th class="end" style="width:96px">Unit price</th><th class="end" style="width:80px">Fees</th><th class="end" style="width:110px">Cost</th></tr></thead>
      <tbody>${procRows}
        <tr class="total"><td colspan="8" style="font-weight:700">PRODUCTS — the manufactured assemblies themselves, procured the same way</td></tr>
        ${prodRows}
      </tbody>
    </table></div>
    <div class="dim" style="margin-top:5px">Required and purchased are separate columns on purpose — the difference is visible instead of buried in a rounded unit cost.</div>

    <div class="secthead" style="margin-top:12px"><span class="h">3 · OUTPUTS → DISPOSITION</span><span class="dim">the work produces material; only some decisions cost money</span></div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>Generated output</th><th style="width:100px">Subtype</th><th class="end" style="width:100px">In place</th><th class="end" style="width:100px">Loose</th><th>Disposition</th><th></th><th style="width:190px">Derived</th><th class="end" style="width:110px">Cost</th></tr></thead>
      <tbody>${dispRows}</tbody>
    </table></div>

    <div class="panelrow" style="margin-top:12px">
      <div class="panel"><h5>4 · OPTION TOTAL COST</h5>
        <table class="tbl"><tbody>
          ${['labor', 'equipment', 'procurement', 'product', 'disposition'].filter((k) => t[k] != null).map((k) => `<tr><td>${k}</td><td class="end mono">${money(t[k])}</td></tr>`).join('')}
          <tr class="total"><td>TOTAL COST</td><td class="end mono">${money(t.total || 0)}</td></tr>
        </tbody></table>
        <div class="dim" style="margin-top:5px">Nothing is typed here. Every figure rolls up from blocks 1–3, and every block traces to a scope row.</div>
      </div>
      <div class="panel"><h5>ISSUE</h5>
        ${isLocked()
      ? `<div class="lockband"><b>&#128274;</b><span>${esc(S.latestRendition.reference)} is issued. Contract value ${money(S.latestRendition.contract_value)}.</span></div>
             <div class="btnrow"><span class="btn" data-act="reopen">Reopen as new rendition</span><span class="btn" data-act="createco">Create Change Order…</span></div>`
      : `<div class="rows" style="--lw:110px"><span class="dim">Total cost</span><span class="der mono">${money(t.total || 0)}</span></div>
             <div class="btnrow"><span class="btn def ${t.total ? '' : 'dis'}" data-act="issue">Issue Rendition…</span></div>
             <div class="dim" style="margin-top:6px">Issuing freezes this scope and every figure above it.</div>`}
      </div>
    </div>`;
}

// ============================================================ version — estimate

function renderEstimateTab() {
  const rows = S.renditions.map((r) => `<tr>
    <td class="mono">${esc(r.reference)}</td>
    <td>${esc(r.issued_at ? r.issued_at.slice(0, 10) : '—')}</td>
    <td>${esc(r.sent_to || '—')}</td>
    <td class="end mono">${money(r.total_cost)}</td>
    <td class="end mono">${money(r.contract_value)}</td>
    <td>${r.status === 'issued' ? '<span class="pill issued">issued</span>' : r.status === 'void' ? '<span class="pill void">void</span>' : 'draft'}</td>
    <td>${r.changeOrders.length ? r.changeOrders.map((c) => `${esc(c.co_number)} <span class="faint">${esc(c.status)}</span> ${money(c.price_delta)}`).join('<br>') : '<span class="faint">—</span>'}</td>
  </tr>`).join('');

  const blockers = S.checklist.filter((c) => !c.ok);
  const contract = S.latestRendition
    ? S.latestRendition.contract_value + S.renditions.filter((r) => r.id === S.latestRendition.id).flatMap((r) => r.changeOrders).filter((c) => c.status === 'approved').reduce((s, c) => s + (c.price_delta || 0), 0)
    : null;

  q('#page').innerHTML = `
    <div class="secthead"><span class="h">RENDITION HISTORY</span><span class="dim">the letter is the scope, the digit is the issue</span><span class="r">contract value <b class="mono">${money(contract)}</b></span></div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th style="width:150px">Rendition</th><th style="width:90px">Issued</th><th style="width:140px">Sent to</th><th class="end" style="width:110px">Total cost</th><th class="end" style="width:110px">Sell</th><th style="width:80px">Status</th><th>Change orders</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="7" class="empty">Nothing issued on this version yet.</td></tr>'}</tbody>
    </table></div>

    <div class="panelrow" style="margin-top:12px">
      <div class="panel"><h5>CUSTOMER VIEW — draft</h5>
        ${S.costTotals ? `<table class="tbl"><thead><tr><th>Line</th><th class="end" style="width:120px">Amount</th></tr></thead><tbody>
          ${S.scopeTree.map((x) => `<tr><td>${esc(x.name)} — supply and install</td><td class="end mono">${money(x.directCost)}</td></tr>`).join('')}
          <tr><td>Materials, disposal and site work</td><td class="end mono">${money((S.costTotals.procurement || 0) + (S.costTotals.disposition || 0))}</td></tr>
          <tr class="total"><td>TOTAL COST BASIS</td><td class="end mono">${money(S.costTotals.total)}</td></tr>
        </tbody></table>
        <div class="dim" style="margin-top:5px">A cost-basis preview only. Grouping the customer actually sees, per-category markup and terms are not built yet.</div>`
      : '<div class="empty">Calculate cost first.</div>'}
      </div>
      <div class="panel"><h5>${isLocked() ? 'ISSUED' : 'ISSUE CHECKLIST'}</h5>
        ${isLocked()
      ? `<div class="lockband"><b>&#128274;</b><span>${esc(S.latestRendition.reference)} was issued${S.latestRendition.issued_at ? ` ${esc(S.latestRendition.issued_at.slice(0, 10))}` : ''}. Its figures are frozen.</span></div>
             <div class="rows" style="--lw:120px">
               <span class="dim">Total cost</span><span class="der mono">${money(S.latestRendition.total_cost)}</span>
               <span class="dim">Markup</span><span class="der mono">${S.latestRendition.markup_pct != null ? num(S.latestRendition.markup_pct) + '%' : '—'}</span>
               <span class="dim">Sell</span><span class="der mono">${money(S.latestRendition.contract_value)}</span>
             </div>
             <div class="btnrow">
               <span class="btn" data-act="reopen">Reopen as new rendition</span>
               <span class="btn" data-act="createco">Create Change Order…</span>
             </div>`
      : `<div style="line-height:1.9">
               ${S.checklist.map((c) => `<div class="${c.ok ? (c.warn ? 'warn' : '') : 'bad'}">${c.ok ? (c.warn ? '▲' : '✓') : '!'} ${esc(c.label)}</div>`).join('') || '<span class="faint">Run Recalculate.</span>'}
             </div>
             ${blockers.length
        ? `<div class="badband"><b>Cannot issue.</b> ${blockers.length} blocker(s) above must be resolved first.</div>`
        : `<div class="band">Nothing is blocking an issue.</div>`}
             <div class="btnrow">
               <span class="btn ${(S.costTotals && !blockers.length) ? 'def' : 'dis'}" data-act="issue">Issue Rendition…</span>
               <span class="btn dis">Print customer…</span>
             </div>`}
      </div>
    </div>`;
}

// ============================================================ version — actuals

function renderActualsTab() {
  const baseline = S.latestRendition;
  if (!baseline) { q('#page').innerHTML = '<div class="empty">Actuals open once a rendition has been issued — there is nothing to measure against yet.</div>'; return; }
  const approvedCos = (S.renditions.find((r) => r.id === baseline.id) || { changeOrders: [] }).changeOrders.filter((c) => c.status === 'approved');
  const contract = baseline.contract_value + approvedCos.reduce((s, c) => s + (c.price_delta || 0), 0);

  q('#page').innerHTML = `
    <div class="baseline">
      <b>BASELINE</b>
      <span class="mono">${esc(baseline.reference)}</span>
      ${approvedCos.length ? `<span class="dim">+</span><span class="mono">${approvedCos.map((c) => esc(c.co_number)).join(', ')}</span>` : ''}
      <span class="dim">— the contracted scope, not the rendition alone. Measuring against ${esc(baseline.reference)} by itself would charge this job for changes the customer already paid for.</span>
      <span style="margin-left:auto" class="mono">${money(contract)}</span>
    </div>

    <div class="cards">
      <div class="card"><h5>LABOR</h5><div class="kv"><span>${num(S.scopeTree.reduce((s, x) => s + x.laborHr, 0))} hr estimated</span><b class="mono faint">no actuals</b></div><div class="sub">nothing logged</div></div>
      <div class="card"><h5>EQUIPMENT</h5><div class="kv"><span>${num(S.scopeTree.reduce((s, x) => s + x.equipHr, 0))} hr estimated</span><b class="mono faint">no actuals</b></div><div class="sub">nothing logged</div></div>
      <div class="card"><h5>MATERIALS</h5><div class="kv"><span>${money(S.costTotals ? S.costTotals.procurement : null)} estimated</span><b class="mono faint">no invoices</b></div><div class="sub">nothing recorded</div></div>
      <div class="card"><h5>DISPOSITION</h5><div class="kv"><span>${money(S.costTotals ? S.costTotals.disposition : null)} estimated</span><b class="mono faint">no tickets</b></div><div class="sub">nothing recorded</div></div>
    </div>

    <div class="secthead"><span class="h">WORK — ESTIMATED VS ACTUAL</span><span class="dim">hours logged against the row that was meant to perform them</span></div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>Work source</th><th class="end" style="width:90px">Est hr</th><th class="end" style="width:90px">Act hr</th><th class="end" style="width:90px">Var</th><th class="end" style="width:110px">Est $</th><th class="end" style="width:110px">Act $</th></tr></thead>
      <tbody>${S.scopeTree.map((x) => `<tr>
        <td>${esc(x.name)}</td>
        <td class="end mono">${num(x.laborHr)}</td>
        <td class="end faint">—</td>
        <td class="end faint">—</td>
        <td class="end mono">${money(x.laborCost + x.equipCost)}</td>
        <td class="end faint">—</td>
      </tr>`).join('') || '<tr><td colspan="6" class="empty">Nothing expanded.</td></tr>'}</tbody>
    </table></div>

    <div class="band"><b>No actuals have been recorded on this job.</b> Logging days, supplier invoices and scale tickets is not built yet — the estimate side of every column above is real, the actual side is waiting on that entry path. When it exists, this page also feeds corrected production rates and swell factors back into the catalog for future estimates, never back into an issued rendition.</div>`;
}

// ============================================================ render

function render() {
  renderChrome();
  if (S.view === 'projects') return renderProjects();
  if (S.view === 'project') return renderProject();
  if (S.tab === 'scope') return renderScopeTab();
  if (S.tab === 'reqs') return renderReqsTab();
  if (S.tab === 'cost') return renderCostTab();
  if (S.tab === 'estimate') return renderEstimateTab();
  if (S.tab === 'actuals') return renderActualsTab();
}

// ============================================================ loading

async function openProjects() {
  S.projects = await call('listProjects');
  S.view = 'projects';
  render();
  setStatus(`${S.projects.length} projects.`);
}

async function openProject(projectId) {
  const d = await call('getProject', projectId);
  S.projectId = projectId; S.project = d.project; S.soil = d.soil; S.versions = d.versions;
  S.view = 'project';
  render();
  setStatus(`${d.project.name} — ${d.versions.length} version(s).`);
}

async function openVersion(versionId) {
  S.versionId = versionId;
  const scope = await call('getScope', versionId);
  S.project = scope.project; S.version = scope.version; S.soil = scope.soil;
  S.components = scope.components; S.latestRendition = scope.latestRendition;
  S.selectedComponent = S.components[0] ? S.components[0].id : null;
  S.runId = null; S.materialTotals = []; S.outputTotals = []; S.scopeTree = []; S.installDetail = [];
  S.costTotals = null; S.costDetail = null;
  S.projectServices = await call('getProjectServices', versionId, null);
  S.catalogResults = await call('searchCatalog', S.railKind, S.railTerm);
  S.catalogFootings = {};
  for (const c of S.components) {
    if (!c.installation_id) continue;
    const cf = await call('getCatalogFooting', c.installation_id);
    if (cf) S.catalogFootings[c.installation_id] = cf.code;
  }
  S.renditions = await call('getRenditions', versionId);
  S.view = 'version'; S.tab = 'scope';

  // An issued rendition froze a calculation run — adopt it so reopening the
  // version shows the figures it was issued with, not a blank page.
  const frozenRun = S.latestRendition && S.latestRendition.calculation_run_id;
  if (frozenRun) {
    S.runId = frozenRun;
    const totals = await call('getRunTotals', frozenRun);
    S.materialTotals = totals.materialTotals;
    S.outputTotals = totals.outputTotals;
    S.installDetail = await call('getInstallationDetail', versionId);
    S.scopeTree = await call('getScopeTree', versionId, frozenRun);
    S.costDetail = await call('getCostDetail', frozenRun);
    const lines = S.costDetail.costLines || [];
    S.costTotals = lines.reduce((a, l) => { a[l.cost_type] = (a[l.cost_type] || 0) + l.extended_cost; a.total += l.extended_cost; return a; }, { total: 0 });
    for (const m of S.materialTotals) if (!S.procurementMethods[m.material_id]) S.procurementMethods[m.material_id] = await call('listProcurementMethods', m.material_id);
    for (const o of S.outputTotals) if (!S.dispositionMethods[o.output_material_id]) S.dispositionMethods[o.output_material_id] = await call('listDispositionMethods', o.output_material_id);
  }
  S.checklist = await call('getIssueChecklist', versionId, S.runId);
  render();
  setStatus(frozenRun ? `${S.latestRendition.reference} — showing the figures it was issued with.` : 'Run Recalculate to expand this version into requirements.');
}

async function calculate() {
  if (isLocked()) return;
  setStatus('Expanding scope…');
  const data = await call('calculate', S.versionId);
  S.runId = data.runId;
  S.materialTotals = data.materialTotals;
  S.outputTotals = data.outputTotals;
  S.installDetail = await call('getInstallationDetail', S.versionId);
  S.scopeTree = await call('getScopeTree', S.versionId, S.runId);
  S.projectServices = await call('getProjectServices', S.versionId, S.runId);
  for (const m of S.materialTotals) if (!S.procurementMethods[m.material_id]) S.procurementMethods[m.material_id] = await call('listProcurementMethods', m.material_id);
  for (const o of S.outputTotals) if (!S.dispositionMethods[o.output_material_id]) S.dispositionMethods[o.output_material_id] = await call('listDispositionMethods', o.output_material_id);
  await refreshCost();
  setStatus(`Calculated — ${S.materialTotals.length} material requirement(s), ${S.outputTotals.length} generated output(s).`);
}

async function refreshCost() {
  if (!S.runId) return;
  const res = await call('calculateCost', S.runId, S.versionId);
  S.costTotals = res.totals;
  S.costDetail = await call('getCostDetail', S.runId);
  S.checklist = await call('getIssueChecklist', S.versionId, S.runId);
  render();
}

// ============================================================ modals

function showModal(title, body, onOk) {
  const layer = q('#layer');
  layer.innerHTML = `<div class="modal-back"><div class="dlg" style="width:420px">
    <div class="titlebar"><span class="t">${esc(title)}</span></div>
    <div class="dlgbody">${body}</div>
    <div class="footer"><div class="btn w78 def" id="m-ok">OK</div><div class="btn w78" id="m-cancel">Cancel</div></div>
  </div></div>`;
  layer.querySelector('#m-cancel').onclick = () => { layer.innerHTML = ''; };
  layer.querySelector('#m-ok').onclick = async () => {
    try { await onOk(layer); } finally { layer.innerHTML = ''; }
  };
}

function issueFlow() {
  if (isLocked() || !S.costTotals) return;
  showModal('Issue Rendition', `
    <div class="grp"><span class="leg">Issue</span>
      <div class="rows" style="--lw:100px">
        <span class="dim">Total cost</span><span class="der mono">${money(S.costTotals.total)}</span>
        <span class="dim">Markup</span><div class="unitrow"><input class="fld mono" id="m-markup" value="20.25" style="width:70px;text-align:right"><span>%</span></div>
        <span class="dim">Issued by</span><input class="fld" id="m-by" value="Estimator">
        <span class="dim">Sent to</span><input class="fld" id="m-to" value="${esc(S.project.customer || '')}">
      </div>
    </div>`, async (root) => {
    const r = await call('issueRendition', S.versionId, {
      markupPct: parseFloat(root.querySelector('#m-markup').value),
      issuedBy: root.querySelector('#m-by').value,
      sentTo: root.querySelector('#m-to').value,
    });
    setStatus(`${r.reference} issued — contract value ${money(r.contractValue)}.`);
    await openVersion(S.versionId);
    S.tab = 'estimate';
    render();
  });
}

async function pickFootingFlow() {
  if (isLocked()) return;
  if (!S.footingSpecs.length) S.footingSpecs = await call('listFootingSpecs');
  const d = S.installDetail.find((x) => x.projectComponentId === S.selectedComponent) || S.installDetail[0];
  if (!d) return;
  const comp = S.components.find((c) => c.id === d.projectComponentId);
  showModal('Footing specification', `
    <div class="grp"><span class="leg">${esc(d.componentName)}</span>
      <div class="rows" style="--lw:110px">
        <span class="dim">Current</span><span class="der">${esc(d.footingCode)}</span>
        <span class="dim">Change to</span><div class="combo"><select id="m-spec">${S.footingSpecs.map((s) => `<option value="${esc(s.id)}">${esc(s.code)} — ${num(s.diameter_ft)}′ × ${num(s.depth_ft)}′</option>`).join('')}</select><span class="arw">&#9660;</span></div>
      </div>
      <div class="band">A project override changes this job only — the catalog default is untouched, and the next estimate on this component still starts from it.</div>
    </div>`, async (root) => {
    await call('setFootingOverride', comp.installation_id, root.querySelector('#m-spec').value);
    setStatus('Footing spec overridden for this project.');
    await openVersion(S.versionId);
    S.tab = 'scope'; S.scopeTab = 'installation';
    await calculate();
  });
}

async function createCoFlow() {
  if (!isLocked()) return;
  if (!S.footingSpecs.length) S.footingSpecs = await call('listFootingSpecs');
  showModal('Create Change Order', `
    <div class="grp"><span class="leg">Amends ${esc(S.latestRendition.reference)}</span>
      <div class="rows" style="--lw:120px">
        <span class="dim">Component</span><div class="combo"><select id="co-comp">${S.components.map((c) => `<option value="${esc(c.installation_id)}">${esc(c.component_name)}</option>`).join('')}</select><span class="arw">&#9660;</span></div>
        <span class="dim">New footing spec</span><div class="combo"><select id="co-spec">${S.footingSpecs.map((s) => `<option value="${esc(s.id)}">${esc(s.code)}</option>`).join('')}</select><span class="arw">&#9660;</span></div>
        <span class="dim">Reason</span><input class="fld" id="co-reason" value="Owner-directed change">
        <span class="dim">Reference</span><input class="fld" id="co-ref" value="">
        <span class="dim">CO markup</span><div class="unitrow"><input class="fld mono" id="co-markup" value="28" style="width:70px;text-align:right"><span>%</span></div>
      </div>
      <div class="band">The rendition never changes. An approved change order amends the contract value alongside it.</div>
    </div>`, async (root) => {
    const r = await call('createChangeOrder', S.latestRendition.id, {
      reason: root.querySelector('#co-reason').value,
      reference: root.querySelector('#co-ref').value,
      markupPct: parseFloat(root.querySelector('#co-markup').value),
      overrides: { [root.querySelector('#co-comp').value]: { footingSpecOverrideId: root.querySelector('#co-spec').value } },
    });
    setStatus(`${r.coNumber} drafted — cost delta ${money(r.costDelta)}, price delta ${money(r.priceDelta)}.`);
    await openVersion(S.versionId);
    S.tab = 'estimate';
    render();
  });
}

// ============================================================ events

// Rail search — debounced so each keystroke doesn't fire an IPC round trip.
let railTimer = null;
document.addEventListener('input', (ev) => {
  if (ev.target.id !== 'rail-search') return;
  S.railTerm = ev.target.value;
  clearTimeout(railTimer);
  railTimer = setTimeout(async () => {
    try {
      S.catalogResults = await call('searchCatalog', S.railKind, S.railTerm);
      render();
      const box = q('#rail-search');
      if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
    } catch (e) { /* reported */ }
  }, 220);
});

document.addEventListener('change', (ev) => {
  const sel = ev.target.closest('[data-choice]');
  if (!sel) return;
  const n = sel.dataset.choice;
  if (n.startsWith('proc:')) S.methodChoice[n.slice(5)] = sel.value;
  if (n.startsWith('disp:')) S.dispChoice[n.slice(5)] = sel.value;
});

document.addEventListener('dblclick', async (ev) => {
  const p = ev.target.closest('[data-project]');
  if (p) return openProject(p.dataset.project).catch(() => {});
  const v = ev.target.closest('[data-open-version]');
  if (v) return openVersion(v.dataset.openVersion).catch(() => {});
});

document.addEventListener('click', async (ev) => {
  const t = ev.target;
  try {
    const tab = t.closest('[data-tab]');
    if (tab) { S.tab = tab.dataset.tab; return render(); }

    const stab = t.closest('[data-scopetab]');
    if (stab) { S.scopeTab = stab.dataset.scopetab; return render(); }

    const seg = t.closest('[data-version]');
    if (seg) return await openVersion(seg.dataset.version);

    const exp = t.closest('[data-expand]');
    if (exp) { const k = exp.dataset.expand; S.expanded[k] = !S.expanded[k]; S.selectedComponent = k; return render(); }

    const kind = t.closest('[data-railkind]');
    if (kind) {
      S.railKind = kind.dataset.railkind;
      S.catalogResults = await call('searchCatalog', S.railKind, S.railTerm);
      return render();
    }

    const add = t.closest('[data-add]');
    if (add) {
      if (isLocked()) return setStatus('Scope is locked — reopen the rendition or raise a change order.');
      const [k, id] = add.dataset.add.split(':');
      if (k === 'comp') { await call('addComponentToScope', S.versionId, id); setStatus('Component added to scope.'); }
      else if (k === 'svc') { await call('addServiceToScope', S.versionId, id, 1); setStatus('Service added to scope.'); }
      else return setStatus('Specs are added by a component, not on their own.');
      await openVersion(S.versionId);
      return await calculate();
    }

    const rm = t.closest('[data-remove]');
    if (rm) {
      if (isLocked()) return setStatus('Scope is locked.');
      const [k, id] = rm.dataset.remove.split(':');
      await call('removeFromScope', k, id);
      setStatus(`${k === 'component' ? 'Component' : 'Service'} removed from scope.`);
      await openVersion(S.versionId);
      return await calculate();
    }

    const price = t.closest('[data-price]');
    if (price) {
      const id = price.dataset.price;
      const methodId = S.methodChoice[id] || (S.procurementMethods[id] || [])[0]?.id;
      if (!methodId) return;
      setStatus(`Pricing ${id}…`);
      await call('priceProcurement', S.runId, id, methodId);
      return await refreshCost();
    }

    const disp = t.closest('[data-dispose]');
    if (disp) {
      const key = disp.dataset.dispose;
      const [mat, sub] = key.split(':');
      const methodId = S.dispChoice[key] || (S.dispositionMethods[mat] || [])[0]?.id;
      if (!methodId) return;
      setStatus(`Pricing disposition for ${mat}…`);
      await call('priceDisposition', S.runId, mat, sub, methodId);
      return await refreshCost();
    }

    const act = t.closest('[data-act]');
    if (act) {
      if (act.classList.contains('dis')) return;
      const a = act.dataset.act;
      if (a === 'back-projects') return await openProjects();
      if (a === 'back-project') return await openProject(S.project.id);
      if (a === 'calculate') return await calculate();
      if (a === 'issue') return issueFlow();
      if (a === 'reopen') { await call('reopen', S.versionId); setStatus('Reopened as a new draft rendition.'); return await openVersion(S.versionId); }
      if (a === 'createco') return await createCoFlow();
      if (a.startsWith('pick-footing')) { const id = a.split(':')[1]; if (id) S.selectedComponent = id; return await pickFootingFlow(); }
      if (a.startsWith('revert-footing')) {
        const c = S.components.find((x) => x.id === a.split(':')[1]);
        if (!c) return;
        await call('revertFootingOverride', c.installation_id);
        setStatus('Reverted to the catalog footing spec.');
        await openVersion(S.versionId);
        return await calculate();
      }
      if (a.startsWith('pick-profile')) {
        const c = S.components.find((x) => x.id === a.split(':')[1]);
        if (!c || isLocked()) return;
        const profiles = await call('listProfiles', c.component_id || '');
        if (!profiles.length) return setStatus('Only one installation profile is configured for this component.');
        showModal('Installation method', `<div class="grp"><span class="leg">${esc(c.component_name)}</span>
          <div class="rows" style="--lw:110px"><span class="dim">Method</span><div class="combo"><select id="pm">${profiles.map((p) => `<option value="${esc(p.id)}" ${p.id === c.installation_profile_id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><span class="arw">&#9660;</span></div></div>
          <div class="band">Changing the method re-resolves every requirement the component pulls in.</div></div>`, async (root) => {
          await call('setInstallationProfile', c.installation_id, root.querySelector('#pm').value);
          await openVersion(S.versionId);
          await calculate();
        });
        return;
      }
      if (a === 'new-project' || a === 'new-version') return setStatus('Not built yet — projects and versions are seeded for now.');
    }
  } catch (e) { /* call() already surfaced it */ }
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'F9' && S.view === 'version' && !isLocked()) { ev.preventDefault(); calculate().catch(() => {}); }
});

q('#btn-min').onclick = () => window.winControls.minimize();
q('#btn-max').onclick = () => window.winControls.toggleMaximize();
q('#btn-close').onclick = () => window.winControls.close();

openProjects().catch((e) => setStatus(`Failed to load: ${e.message}`));
