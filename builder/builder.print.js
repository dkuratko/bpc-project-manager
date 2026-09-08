/* ================================================================
   Document Builder — printable estimate
   Matches "Estimate PDF/HTML Design": IBM Plex Mono, warm-grey work
   table with numbered lines, ↳ sub-items, [OPT] options, inline
   amber disclaimers, project add-ons box, totals, terms.
   Self-contained (no dependency on builder.js).
   ================================================================ */
(function(global){
'use strict';

const COMPANY = {
  name:'BUILD PLAY CONTRACTING',
  contact:'1001 N. Pasadena Rd., Unit 173, Mesa, AZ 85201 · ROC #360531 · (602) 799-3640 · damian@buildplaycontracting.com'
};
const LOGO =
  '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" style="display:block">'+
  '<circle cx="17" cy="17" r="16" stroke="#1c1c1a" stroke-width="1.5"/>'+
  '<path d="M23.5 8.5 L10.5 25.5" stroke="#1c1c1a" stroke-width="1.5"/>'+
  '<text x="7.5" y="16" font-family="IBM Plex Mono,monospace" font-size="11" font-weight="700" fill="#1c1c1a">B</text>'+
  '<text x="18.5" y="28" font-family="IBM Plex Mono,monospace" font-size="11" font-weight="700" fill="#1c1c1a">P</text>'+
  '</svg>';

const FONT_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com">'+
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'+
  '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">';

const TERMS_TEXT =
  'Unless noted otherwise: Project site must have “tailgate access” and be subgrade ready. '+
  'Digging based upon good soil conditions (hard-dig, collapsing soil excluded). Customer to provide water onsite. '+
  'All work to be performed in a single, concurrent mobilization. Excludes prevailing wage rates, payment management '+
  'services, site fence/security, irrigation repair, permitting, fees, insurance requirements not included in Build Play '+
  'LLC’s current insurance policies, requirement of ready-mix truck concrete for playground and site furnishings. '+
  'Build Play LLC is not responsible for damage to existing surfaces during the normal course of construction. Material '+
  'price increases in excess of 5% after issuance of estimate or purchase order may require revised pricing. All required '+
  'taxes included.';

/* ---------- helpers ---------- */
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const up  = s => String(s==null?'':s).toUpperCase();
const fmt = v => Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const money = v => '$'+fmt(v);
const amountOf = r => r.flat ? (+r.price||0) : (+r.qty||0)*(+r.price||0);
const qtyUnit = r => r.flat ? '—' : `${r.qty==null?'':r.qty}${r.unit?' '+r.unit:''}`;

function splitProject(meta){
  const m = /^\s*([A-Za-z]+-\d+[-\dA-Za-z]*)\s+(.*)$/.exec(meta.project||'');
  if(m) return { number:m[1], title:m[2] };
  return { number:meta.number||'', title:meta.project||meta.desc||'' };
}

/* ---------- derive estimate ---------- */
function estimateData(doc){
  const rows = doc.rows;
  const kids = id => rows.filter(r=>r.parent===id);
  const custLines = rows.filter(r=>r.kind==='line' && !r.internal && !r.hidden);

  const lines = custLines.map(l=>({
    row:l,
    subs: kids(l.id).filter(c=>c.kind==='sub'),
    options: kids(l.id).filter(c=>c.kind==='option'),
    note:l.note, disclaimer:l.disclaimer
  }));
  const addon = rows.filter(r=>r.kind==='option' && r.group==='addon');
  const allOptions = rows.filter(r=>r.kind==='option');

  const base        = custLines.reduce((s,l)=>s+amountOf(l),0);
  const accepted    = allOptions.filter(o=>o.accepted).reduce((s,o)=>s+amountOf(o),0);
  const taxRate     = +doc.settings.taxRate||0;
  const tax         = taxRate>0 ? (base+accepted)*taxRate/100 : 0;
  const total       = base+accepted+tax;

  const today = new Date(2026,7,28);   // 2026-08-28
  const proj = splitProject(doc.meta);
  const m = doc.meta;

  const fields = [
    ['PROJECT #',   proj.number],
    ['ESTIMATE ID', m.number||''],
    ['DATE',        today.toLocaleDateString('en-US')],
    ['SALES REP',   up(m.rep)],
    ['PROJECT',     up(proj.title)],
    ['SITE',        up(m.site || m.desc || '')],
    ['CUSTOMER',    up(m.customer)],
    ['ADDRESS',     up(m.customerAddress || '—')]
  ];

  return { meta:m, settings:doc.settings, proj, fields, lines, addon,
           base, accepted, tax, taxRate, total, showQty:doc.settings.showQty!==false };
}

/* ================================================================
   CSS — ported 1:1 from the design tokens
   ================================================================ */
const CSS = `
*{box-sizing:border-box}
.page{--ink:#1c1c1a;--muted:#6d6a63;--faint:#9a968d;--desc:#2b2926;--sub:#8a867d;--rowbg:#f7f6f2;
  --opt:oklch(0.45 0.12 300);--disc:oklch(0.50 0.14 75);--terms:#4d4a44;--pagebg:#fdfdfc;
  width:8.5in;min-height:11in;margin:0 auto;background:var(--pagebg);color:var(--ink);
  padding:22px 40px;font-family:'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace;font-size:11px;line-height:1.45}

/* header */
.head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
.brand{display:flex;align-items:flex-start;gap:12px}
.logo{flex:none}
.co{font-size:14px;font-weight:600;letter-spacing:.04em}
.contact{font-size:10px;color:var(--muted);margin-top:2px;line-height:1.5}
.est{font-size:14px;font-weight:600;letter-spacing:.14em}

/* meta */
.meta{margin-top:12px;border-left:4px solid var(--ink);padding-left:14px;
  display:grid;grid-template-columns:repeat(2,1fr);gap:5px 30px}
.mf{display:grid;grid-template-columns:84px 1fr;gap:8px}
.ml{font-size:9.5px;letter-spacing:.1em;color:var(--faint)}

/* estimate total banner */
.banner{display:flex;justify-content:space-between;align-items:center;
  border-top:3px solid var(--ink);border-bottom:3px solid var(--ink);padding:5px 0;margin-top:12px}
.banner .l{font-size:10px;letter-spacing:.12em;color:var(--muted)}
.banner .v{font-size:20px;font-weight:600}

/* legend */
.legend{margin-top:10px;font-size:10px;letter-spacing:.12em;color:var(--muted)}
.legend .dim{color:var(--faint)}
.legend .opt{color:var(--opt);letter-spacing:.1em;font-size:9.5px}

/* items table */
.items{width:100%;border-collapse:collapse;margin-top:5px;font-size:11px}
.items thead tr{border-bottom:1px solid var(--ink)}
.items thead th{text-align:left;padding:0 3px 3px;font-weight:500;color:var(--faint)}
.items thead th.r{text-align:right}
.items tbody td{background:var(--rowbg);vertical-align:top}
.items .num{width:22px;color:var(--faint);font-size:11.5px;font-weight:700;padding:3px 3px}
.items .main td{padding:3px 3px}
.items .main .nm{font-size:11.5px;font-weight:700;letter-spacing:.01em}
.items .main .q,.items .main .up,.items .main .amt{text-align:right;font-size:11.5px;font-weight:700;white-space:nowrap}
.items .q{width:70px}.items .up{width:70px}.items .amt{width:72px}
.items .desc td{padding:0 3px 2px 22px;color:var(--desc)}
.items .sub td{padding:0 3px 2px}
.items .sub .lbl{padding-left:22px;color:var(--sub)}
.items .sub .turn{color:var(--faint);margin-right:6px}
.items .sub .amt{text-align:right;color:var(--faint);white-space:nowrap}
.items .opt td{padding:0 3px 2px}
.items .opt .lbl{padding-left:22px}
.items .opt .tag{color:var(--opt);letter-spacing:.1em;font-size:9.5px;font-weight:700;margin-right:5px}
.items .opt .on{color:var(--opt);font-weight:600;margin-left:5px;font-size:9.5px;letter-spacing:.06em}
.items .opt .name{color:var(--opt);font-size:11.5px;font-weight:700}
.items .opt .q,.items .opt .up,.items .opt .amt{text-align:right;color:var(--opt);font-size:11.5px;font-weight:700;white-space:nowrap}
.items .disc td{padding:0 3px 4px 51px}
.items .disc .d{margin:2px 0 3px;color:var(--disc);font-weight:600}
.items .disc .d span{font-weight:400}

/* add-ons box */
.addons{margin-top:9px;border:1px solid var(--ink);padding:5px 11px}
.atitle{font-size:10px;letter-spacing:.1em;color:var(--muted)}
.arow{display:flex;justify-content:space-between;margin-top:5px}
.abox{border:1px solid var(--ink);display:inline-block;width:10px;height:10px;margin-right:9px;vertical-align:-1px}
.abox.on{background:var(--ink)}

/* totals */
.totwrap{display:flex;justify-content:flex-end;margin-top:9px}
.tot{min-width:250px}
.tot .tr{display:flex;justify-content:space-between}
.tot .tr .l{color:var(--muted)}
.tot .grand{border-top:1px solid var(--ink);margin-top:5px;padding-top:5px;font-size:14px;font-weight:600}

/* terms */
.tlabel{margin-top:9px;font-size:10px;letter-spacing:.12em;color:var(--muted)}
.terms{margin:4px 0 0;font-size:9px;line-height:1.42;color:var(--terms);text-wrap:pretty}

@media print{
  @page{size:letter;margin:0}
  body{background:#fff;margin:0}
  .page{width:auto;min-height:auto;box-shadow:none;margin:0}
  .no-print{display:none!important}
}
`;

/* ================================================================
   BODY
   ================================================================ */
function estimateBody(doc){
  const d = estimateData(doc);

  // header + meta
  const head =
    `<div class="head">
      <div class="brand"><span class="logo">${LOGO}</span>
        <div><div class="co">${esc(COMPANY.name)}</div><div class="contact">${esc(COMPANY.contact)}</div></div>
      </div>
      <div class="est">ESTIMATE</div>
    </div>`;
  const meta = `<div class="meta">${d.fields.map(([l,v])=>
      `<div class="mf"><span class="ml">${esc(l)}</span><span class="mv">${esc(v)}</span></div>`).join('')}</div>`;

  const banner =
    `<div class="banner"><span class="l">ESTIMATE TOTAL — BASE SCOPE, OPTIONS EXCLUDED</span>
      <span class="v">${money(d.base)}</span></div>`;

  const legend =
    `<div class="legend">ESTIMATE OF WORK &nbsp;<span class="dim">↳ sub-item · (amount) already included in the line total &nbsp; <span class="opt">[OPT]</span> optional, added only if accepted</span></div>`;

  // items
  let body = '';
  d.lines.forEach((L,i)=>{
    const l = L.row, n = String(i+1).padStart(2,'0');
    body += `<tr class="main">
      <td class="num">${n}</td>
      <td><span class="nm">${esc(l.name)}</span></td>
      <td class="q">${esc(qtyUnit(l))}</td>
      <td class="up">${l.flat?money(l.price):money(l.price)}</td>
      <td class="amt">${money(amountOf(l))}</td></tr>`;
    if(L.note){
      body += `<tr class="desc"><td></td><td colspan="4">${esc(L.note)}</td></tr>`;
    }
    L.subs.forEach(s=>{
      body += `<tr class="sub"><td></td><td class="lbl" colspan="3"><span class="turn">↳</span>${esc(s.name)}</td>`+
              `<td class="amt">(${money(amountOf(s))})</td></tr>`;
    });
    L.options.forEach(o=>{
      body += `<tr class="opt"><td></td>`+
        `<td class="lbl"><span class="tag">[OPT]</span><span class="name">${esc(o.name)}</span>${o.accepted?'<span class="on">✓ ACCEPTED</span>':''}</td>`+
        `<td class="q">${esc(qtyUnit(o))}</td><td class="up">${money(o.price)}</td>`+
        `<td class="amt">+ ${money(amountOf(o))}</td></tr>`;
    });
    if(L.disclaimer){
      body += `<tr class="disc"><td colspan="5"><div class="d">DISCLAIMER · <span>${esc(L.disclaimer)}</span></div></td></tr>`;
    }
  });
  const items =
    `<table class="items"><thead><tr>
      <th>#</th><th>ACTIVITY · DESCRIPTION · OPTIONS</th>
      <th class="r">QTY / UNIT</th><th class="r">UNIT PRICE</th><th class="r">AMOUNT</th>
    </tr></thead><tbody>${body}</tbody></table>`;

  // add-ons box (project level)
  let addons = '';
  if(d.addon.length){
    const arows = d.addon.map(o=>
      `<div class="arow"><span><span class="abox ${o.accepted?'on':''}"></span>${esc(o.name)}</span>`+
      `<span>+ ${money(amountOf(o))}</span></div>`).join('');
    addons = `<div class="addons"><div class="atitle">PROJECT-LEVEL OPTIONAL ADD-ONS — CHECK TO ACCEPT</div>${arows}</div>`;
  }

  // totals
  const taxLine = d.taxRate>0 ? money(d.tax) : 'INCLUDED';
  const totals =
    `<div class="totwrap"><div class="tot">
      <div class="tr"><span class="l">SUBTOTAL</span><span>${money(d.base)}</span></div>
      ${d.accepted>0?`<div class="tr"><span class="l">ACCEPTED OPTIONS</span><span>+ ${money(d.accepted)}</span></div>`:''}
      <div class="tr"><span class="l">TAX</span><span>${taxLine}</span></div>
      <div class="tr grand"><span>TOTAL</span><span>${money(d.total)}</span></div>
    </div></div>`;

  const terms = `<div class="tlabel">TERMS &amp; EXCLUSIONS</div><p class="terms">${esc(TERMS_TEXT)}</p>`;

  return `<div class="page">${head}${meta}${banner}${legend}${items}${addons}${totals}${terms}</div>`;
}

/* full standalone HTML (print / new tab / iframe) */
function fullHTML(doc, opts){
  opts = opts||{};
  const bar = opts.embed ? '' :
    `<div class="toolbar no-print"><span>Estimate ${esc(doc.meta.number)}</span><button onclick="window.print()">Save as PDF / Print</button></div>`;
  const barCSS = opts.embed ? '' : `
    body{margin:0;background:#e9eaec}
    .toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;
      padding:10px 18px;background:#1c1c1a;color:#fff;font:600 13px 'IBM Plex Mono',monospace}
    .toolbar button{font:600 13px 'IBM Plex Mono',monospace;padding:8px 16px;border:0;border-radius:4px;background:#e7e3d8;color:#1c1c1a;cursor:pointer}
    .toolbar button:hover{background:#d8d3c4}
    .page{box-shadow:0 2px 16px rgba(0,0,0,.16);margin:22px auto}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Estimate ${esc(doc.meta.number)}</title>${FONT_LINK}
    <style>${CSS}\n${barCSS}</style></head>
    <body>${bar}${estimateBody(doc)}</body></html>`;
}

function printDocument(doc){
  const old = document.getElementById('print-frame'); if(old) old.remove();
  const f = document.createElement('iframe');
  f.id='print-frame'; f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(f);
  const fdoc = f.contentWindow.document;
  fdoc.open(); fdoc.write(fullHTML(doc,{embed:true})); fdoc.close();
  const go = ()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){} };
  if(fdoc.readyState==='complete') setTimeout(go,300); else f.onload = ()=> setTimeout(go,300);
}
function openDocument(doc){
  const w = window.open('','_blank');
  if(!w){ printDocument(doc); return; }
  w.document.open(); w.document.write(fullHTML(doc,{})); w.document.close();
}

global.BuilderPrint = { CSS, FONT_LINK, estimateData, estimateBody, fullHTML, printDocument, openDocument,
  TEMPLATES:[{key:'design',name:'Build Play standard',blurb:'Mono work table, add-ons, terms.'}] };

})(typeof window!=='undefined'?window:this);
