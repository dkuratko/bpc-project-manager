# BPC — Master Tree
**Living document.** Ask for "the tree" any time and this is what gets shown.
Draft 8 · 2026-09-07 · process walked · schema drafted · screens in progress

`✔` confirmed · `[?]` assumption · `▢` not discussed · `★` open decision (elsewhere: emphasis)

---

## 0 · DESIGN PRINCIPLES ✔ — emerged from the walkthrough, apply everywhere

```
EXTENSIBLE LISTS, NOT FIXED COLUMNS
   component specifications ── name · value · unit
   project conditions ──────── name · multiplier · tags
   procurement fees ────────── name · basis · amount · condition
   adding a new kind of thing is data entry, never a migration

COMPLETENESS GATES, NOT APPROVAL WORKFLOWS
   component ── readiness gate ──▶ can't Mark Active until complete
   version ──── issuability gate ─▶ can't issue BPCe- until complete
   no second person, no sign-off. just: is it finished.

NOTHING SILENTLY ASSUMED
   interpolation is a SUGGESTION OFFERED TO A PERSON,
   never a value inside a calculation
   show what is known · alarm what is missing · never invent

TEMPLATES vs COMMITMENTS
   catalog holds defaults. the version holds the only committed dollars.
   every template value is overtypeable on the version.

ONE ALLOCATION RULE
   every dollar lands on exactly one cost object, in proportion to what it caused
```

---

## 1 · DATA STRUCTURE ✔

```
PROJECT ─── BPC-26-10 ─── "San Tan Shade Installation"
│   ✔ the job / the location. a container. IS the quote request.
│   ✔ customer · contact · title · site address · native material · conditions
│   ✔ BPC-YY-# · increments · resets every January
│   ✔ no lifecycle of its own — status rolled up from versions
│
├── OPTION A ── ✔ A LETTER AND NOTHING ELSE. no name, no data, no scope.
│   ├── A0 ── ✔ THE VERSION IS THE JOB. holds the scope.
│   ├── A1     ✔ own estimate · invoice · schedule · everything
│   └── A2     ✔ never dies. you can be on A5 and they approve A2.
│               ✔ 30-day expiry — nothing is ever off the table
└── OPTION B …

✔ Customer selects VERSIONS. Possibly more than one → independent jobs.
```

### VERSION LIFECYCLE ✔ — the project's status is the rollup of these

```
  ─────   estimate created → estimate sent → "Sent, awaiting" · 30-day expiry
          ✔ no status at all before approval. a version is a standing offer.
  ✔       ACCEPTED ......................... PO or signed estimate back
  ✔       AWAITING DELIVERY ................ waiting on someone else's order
  ✔       EQUIPMENT RECEIVED ............... complete, at your lot
  ✔       SCHEDULED ....................... customer set the date
  ✔       ACTIVE .......................... work underway, NOT yet invoiced.
                                            covers the gap after the crew
                                            leaves — completion IS the invoice.
  ✔       INVOICE SENT, PAYMENT REQUIRED .. ▶ warranty clock starts
  ✔       COMPLETED, PAID
  ✔       WARRANTY ........................ paid, still covered
  ✔       COMPLETED ....................... terminal, on warranty expiry

  ✔ STATUS COLOURS — a progression ramp, not semantics. see docs/08.
       1–5 white #ffffff · 6–7 blue #9CC3E2 · 8 light green #B5E3B5
       9 green #8ECF8E · 10 yellow #F5E183 · 11 orange #F0B778
       12–14 red #E89494        (14 statuses — "completed, payment
       required" was removed; completion IS the invoice)
       A RED ROW ALWAYS MEANS FINISHED. problems never tint a row —
       a 4px #CC0000 lip in the left gutter, plus a flag, plus #a00 text.
       CURSOR: a 3px black SPINE down the whole selected group (project +
       its expanded versions) plus ▶ on the project row. NOTHING ELSE —
       no wash, no fill, no darkening. the status tint is identical
       selected or not. no colour chips.
  ✔ "completed, payment required" REMOVED — it had no trigger of its own.
```

## 2 · DOCUMENT REFERENCE ✔

```
BPC c - 26 - 10 A 0        ✔ c  = cost breakdown   ✔ i  = invoice
│   │    │    │  │ └─ version                      ✔ e  = estimate
│   │    │    │  └─── option                       ✔ co = change order
│   │    │    └────── project number               ✔ pc = post cost
│   │    └─────────── year                         ▢ more types TBD
│   └──────────────── document type
└──────────────────── company

✔ REVISION suffix on a submitted estimate:  BPCe-26-26A0 REV1
     stackable (REV2) but rare — that would mean the first was a mistake
```

## 3 · PEOPLE ✔

```
CONTACTS ── CUSTOMER (who pays — often a rep like Exerplay, sometimes a GC or school)
            CONTACT  (the person)
✔ You are a contracted installer.
✔ You usually DON'T purchase the equipment — the customer furnishes it.
     → many versions carry NO product cost · the component still drives everything under it
```

---

## 4 · CATALOG ✔ — COMPLETE

> **The catalog says what work requires. The version says how much.
> Procurement and disposition say what it costs. Cost flows back to
> whatever caused it, in proportion to what it caused.**

```
CATALOG ─── reusable · job-independent · TEMPLATE values only
│
├── PRIMITIVES
│   ├── MATERIAL ── ✔ ONE substance in ONE state. very specific.
│   │               ✔ "spoils" is NOT a material — native soil, demolished
│   │                 concrete and removed EWF are three different disposal bills
│   │               ✔ one list. role emerges from which pricing templates exist.
│   │               ✔ base unit · density lb/CY · swell factor
│   │               ✔ removed EWF ≠ new EWF (wet, compacted, sand-laden)
│   │               ✔ SOIL TYPE dissolved into this — see §5
│   ├── LABOR ROLE ─ $/hr
│   └── EQUIPMENT ── ✔ NOT just a $/hr. equipment needs PROCUREMENT.
│                    ✔ SOURCING METHODS, same shape as material procurement:
│                         Owned .......... $95.00/hr internal
│                         United Rentals . $650/day · 3-day min
│                                          fees: delivery $250 · pickup $250
│                    ✔ POOLS across the job — one rental, one delivery, one
│                         pickup, allocated back by hours each object used
│                    ✔ hours ≠ days. rental days DERIVE (ceil(hr÷8), honor
│                         minimum) then OVERTYPE on the version.
│                    ✔ sourcing decided at COST BREAKDOWN, known by scheduling
│
├── DEFINITIONS ── borrowed by components, never owned
│   │
│   ├── FOOTING SPEC ── ✔ PURE GEOMETRY. shape · diameter · depth.
│   │                   ✔ NO post displacement — dropped entirely
│   │                   ✔ concrete = excavation = spoils (one number, three labels)
│   │
│   ├── ASSEMBLY ────── ✔ rebar cages live here, not in materials
│   │                   ✔ premade ──▶ resolves to a MATERIAL (EA) with procurement
│   │                                 methods. buys exactly like ready-mix. POOLS.
│   │                   ✔ field_fab ▶ KEEP IN MODEL, DEFER THE BUILD
│   │                                 sourcing_mode + bar schedule fields + stub
│   │                                 defer: rebar per bar size · weight table ·
│   │                                 cutting/tying services · bar stock waste
│   │
│   └── SERVICE ─────── ✔ CREW COMPOSITION: [role × count]
│                       ✔   "3 Installers" is a one-row composition
│                       ✔   1 Operator + 1 Laborer prices a machine correctly
│                       ✔ stores DURATION per unit, not man-hours
│                       ✔   cost = Σ (duration × role count × role rate)
│                       ✔   man-hours = duration × crew size, DERIVED, shown too
│                       ✔ equipment hours are their OWN field [?]
│                       ✔ carries TAGS — explicit, both ends
│                       ├── (a) spec-bound ─ rate table, one row per footing spec
│                       │                    NULL spec = flat rate
│                       │                    missing row → SUGGEST, never assume
│                       └── (b) standalone ─ own per-unit rate
│                                            ▸ generates <material>/unit
│                                            ▸ consumes  <material>/unit
│
├── COMPONENTS
│   └── COMPONENT ── ✔ PART NUMBER IS IDENTITY. no configurator.
│       │            ✔ 20x20x12 ≠ 20x20x10 ≠ 20x20x12-6-post = 3 components
│       │            ✔ name · model · mfr · type · free-form specifications
│       │            ✔ NO cost field, ever
│       │            ✔ STATUS: Draft · Active · One-time (promotable to catalog)
│       └── INSTALLATION METHOD (1..n) ── one part number, >1 way to install
│            │    ✔ duration · crew · post length · burial depth · default?
│            │    ✔ NO complexity factor — moved to project conditions
│            └── REQUIREMENT CHECKLIST ── what installing ONE unit needs
│                 ├─▶ FOOTING SPEC  qty · tag "footings"
│                 ├─▶ ASSEMBLY      qty
│                 └─▶ SERVICE (a)   qty · tag "footings"
│                 ✔ the TAG is the join · footing count defaults from post count
│
└── PRICING TEMPLATES ── defaults, NOT commitments. always overtypeable per version.
    │
    ├── PROCUREMENT METHOD ── per material
    │   ✔ purchase unit + CONVERSION TO BASE UNIT ("1 bag = 0.0222 CY")
    │   ✔   ← the gap in the old schema: purchase_unit existed, the factor didn't
    │   ✔ unit price · waste % · purchase rounding · minimum
    │   ✔ NO STOCK. deletes stock qty, fallback method, shortfall logic.
    │   ✔ FEES — a dynamic list, not fixed columns:
    │        name · basis (flat / per-unit / percent) · amount · condition
    │        Delivery      flat      $85.00   always
    │        Short load    flat     $150.00   purchased < 4.00 CY
    │        Fuel          percent       3%   always
    │   ✔ WASTE default CHAINS: material → procurement method → version
    │        concrete 5% → bagged 8% → this job 12%. lower tiers optional.
    │
    └── DISPOSITION METHOD ── per output material
        ✔ per load / per ton · manifest required?
        ✔ SAME dynamic fee list as procurement — one mechanism, used twice
             Transport flat $220 always · Manifest flat $45 always
             Minimum load flat $95 if tons < 5.00
```

### Component wizard ✔ designed

```
STEP 1 IDENTITY ....... name · mfr · part number · type · status
                        ✔ "Copy from <existing>" brings profiles + requirements + specs
                        ✔ no cost field, deliberately
STEP 2 SPECIFICATIONS . free-form name/value/unit · no schema change per category
                        ✔ "what it is, not how it goes in"
                        ✔ POST COUNT defaults the footing count on step 3
STEP 3 INSTALLATION ... tab per method · labor & geometry · LIVE TAKE-OFF
                        ✔ inline create of footing spec / service / assembly
                        ✔ take-off shows only what is KNOWN. alarms the gap.
                          NEVER an inferred value:
                             Labor  5.6 hr ⚠ incomplete — Excavate Footing
                                            has no rate for F-3x12
READINESS PANEL ....... ✔ Mark Active disabled until every ✓
                        ✔ Fix… pre-fills an interpolated SUGGESTION (2.65 hr)
                          from the volume curve — accept or overtype
                        ✔ once accepted it is a real rate row. EXACT. no lingering flag.
```

---

## 5 · PER-JOB ✔

```
══ boundary ══ below is per-job ══ dollars are committed here ══

PROJECT
├── native material ── ✔ picked from the material list
│                      ✔ SOIL TYPE no longer exists as an entity:
│                           density ──▶ material
│                           swell ────▶ material (concrete and EWF swell too)
│                           dig factor ▶ project condition modifier
│
└── CONDITIONS ── ✔ modifiers. replaced per-component complexity.
        soil — hard clay        × 1.15   applies to: EXCAVATION
        access — no site access × 1.30   applies to: EXCAVATION, MATERIAL HANDLING
        winter                  × 1.10   applies to: all labor
    ✔ name · multiplier · set of SERVICE TAGS it touches
    ✔ STACK MULTIPLICATIVELY (1.15 × 1.30 = 1.495)
    ✔ adjust the UNDERLYING VALUE → hours right for scheduling, cost follows
    ✔ applied BEFORE markup · can NEVER touch product cost

VERSION
├── COST OBJECT ── anything that can cause cost. exactly two kinds:
│   ├── SCOPE ROW ....... component + method + footing override (optional)
│   └── DIRECT SERVICE .. no component, attaches to the version
│   ✔ one allocation rule, no orphan tier, no smearing, sums exact
│   ✔ footing override onto an unrated service → compute what you can,
│     alarm the hole, BLOCK issuing BPCe- until resolved
│
└── PRICING DECISIONS ── the only committed dollars
    pooled procurement (1/material) · discrete product (1/scope row)
    disposition (1/output + subtype)
    ✔ price is OVERTYPEABLE, not just method-pickable
```

---

## 6 · COST PIPELINE ✔

```
SCOPE ─▶ EXPANSION ─▶ QUANTITIES ─▶ × CONDITIONS ─▶ PRICING ─▶ COST
                                                                │
                                                   ALLOCATION ◀─┘  internal only
                                                        │
   adjusted cost × (1 + markup)                         │
 + adjusted cost × contingency        ◀─────────────────┘
   ═ COMPUTED PRICE  (the target)
        │
        ▼  estimate autofills here · EVERY value adjustable
   QUOTED PRICE ── effective markup recomputes LIVE

   computed   $47,382.14   markup 22.0%
   quoted     $46,000.00   effective markup 18.4%   ▼ −$1,382.14
```

✔ **MARKUP, not margin** — `price = cost × (1 + m)`
✔ **ONE rate** for the whole job
✔ **Contingency separate, and NOT marked up** — `40,000 × 1.25 = $50,000`, additive
✔ **Cost is not adjustable. The estimate price is.**
✔ **The customer NEVER sees the breakdown** → allocation is purely internal:
your own analysis, change-order pricing, actual-vs-estimate later

### Five cost types ✔

| cost type | needs allocation? | basis |
|---|---|---|
| labor | no — already attached | the service instance's cost object |
| equipment | no — already attached | the service instance's cost object |
| product | no — 1:1 | its scope row |
| procurement | **yes** | required qty × effective rate |
| disposition | **yes** | generated qty × effective rate |

### The pooled-purchase rule ✔

```
1. AGGREGATE across the whole job ............ 7.45 CY required
2. PROCURE ONCE — waste, rounding, minimums,
   and every fee resolve here ................ 8.00 CY · $1,725.00
3. EFFECTIVE RATE over REQUIRED ............... 1,725 ÷ 7.45 = $231.5436…
4. ALLOCATE by what each object required ...... shade 4.20 → $972.48
                                                posts 3.25 → $752.52
                                                          ──────────
                                                          $1,725.00 ✓

BY PURCHASE ─── how money leaves.  BY COMPONENT ─── internal analysis.
                ↳ if these ever disagree, the app is broken
```

---

## 7 · ROUNDING ✔ — three roundings, never conflate

```
1. PURCHASE ..... a business rule. round UP to increment, honor minimums.
2. CALCULATION .. none. full precision. the effective rate is NEVER
                  rounded before it is multiplied.
3. PRESENTATION . hundredths. TRUNCATE, then LARGEST REMAINDER.
                  floor each · residual = total − sum(floors) · hand the cents
                  out one at a time to whoever was cut hardest
                  tie-break: largest quantity, then creation order
                  → truncation means you only ever GIVE cents, never claw back
                  → applies to quantity subtotals too, so every column adds up
                  → runs TWICE: once on cost, once on price
```

---

## 8 · PROCESS TREE — the quoting half ✔

```
0. REQUEST ARRIVES ── email/text/call. channel not tracked.
   └─▶ NEW PROJECT ── auto number · customer + contact from Contacts
                      title · site address · native material · conditions
                      ▢ exact field list TBD

1. COST BREAKDOWN ── BPCc-26-10A0        ★ THE ROOT OF EVERYTHING
   ✔ where SCOPE IS CREATED. inherits project data. never retype.
   ✔ creating one creates the version it sits on
   ✔ four zones: scope · requirements · purchasing · cost
   ✔ equipment sourcing decided HERE — owned or rented, which vendor

2. ESTIMATE ── BPCe-26-10A0
   ✔ a HIERARCHY YOU COMPOSE, not a projection of the breakdown
   ✔ SCOPE GROUPS DEFAULT THE LINES — a group built while scoping seeds an
        estimate line, label and members both. still renameable, splittable,
        mergeable. stops you doing the same grouping twice.
   ✔ modelled on the REAL estimate 26-148A0 — see docs/design/
   ✔ lines are UNIT PRICED: # · title · qty/unit · unit price · amount
   ✔ line title = manufacturer - product [part number] Install [method]
   ✔ every line is a NODE. a node carries:
        description · subitems · options · notes
   ✔ SUBITEMS are INCLUSIVE and PARTIAL — "↳" and the amount in parentheses,
        already inside the line total, and they need not sum to it
   ✔ OPTIONS are EXCLUDED from the total, shown with a leading "+"
        headline reads "BASE SCOPE, OPTIONS EXCLUDED"
   ✔ NOTES replace inclusions/exclusions — one row type with a KIND:
        disclaimer · inclusion · exclusion · assumption
   ✔ project-level options block with CHECKBOXES — "check to accept"
        each sitting directly under whatever it modifies
   ✔ the job is just the root node — job-level and line-level behave identically
   ✔ usually one line. sometimes a design # with children.
   ✔ DESIGN # — customer's reference for a package. usually one per version,
        must allow several.
   ✔ BOTTOM-UP: edit a child → parent → total
   ✔ autofills to computed price · EVERY value overtypeable
   ✔ effective markup recomputes LIVE against the computed price
   ✔ inclusions / exclusions are FREE TEXT. no boilerplate library.
   ✔ dates: ESTIMATE CREATED → ESTIMATE SENT · "Sent, awaiting" · 30-day expiry
   ✔ ★ LOCKED ON SUBMISSION. cannot be edited. ever.

3. APPROVAL ── PO or signed estimate back
   ✔ record the METHOD and hold the EVIDENCE — not one fixed form
        Exerplay usually a PO · sometimes signed estimate + email approval
   ✔ they approve one or more VERSIONS, any age
   ✔ APPROVED JOB SCOPE = base + the add options they took
   ✔ status ──▶ ACCEPTED
```

### The four paths after submission ✔ — all of it follows from the lock

```
they ACCEPT an add option that was on the estimate
   └──▶ nothing new. already offered, already priced.

they want something NOT on the estimate
   └──▶ NEW VERSION.  A0 → A1.  fresh estimate, fresh submission.

the PO doesn't match the estimate — 5 benches quoted, 4 ordered
   └──▶ REVISION.  BPCe-26-26A0 REV1
        ✔ carries SCOPE, not just paper. cost RECOMPUTES.
        ✔ REV1 is what the job actually runs on.

anything at all after the PO
   └──▶ CHANGE ORDER.  BPCco-
        ✔ can be NEGATIVE (a credit)
```

### ✔ ONE ENGINE, THREE MOMENTS

```
ADD OPTION ..... a scope delta offered WITH the estimate      additive only
REVISION ....... a scope delta imposed BY the PO              usually subtractive
CHANGE ORDER ... a scope delta AFTER the PO                   either direction

all three priced the same way — a MARGINAL RECOMPUTE:
     delta price = cost(scope with it) − cost(scope without it)

NEVER add or subtract allocated cost. example, dropping 4 of 8 CY:
     before  8.00 CY × $185 + $85 delivery ................ $1,565  ($195.63/CY)
     after   4.00 CY × $185 + $85 delivery + $150 SHORT LOAD .. $975  ($243.75/CY)
     credit  $590      NOT 4 × 195.63 = $782.52
     → the concrete still on the job got 25% more expensive per yard
     → your model sees this. a spreadsheet never will.

add options can be LINE-SPECIFIC or JOB-LEVEL, same as inclusions/exclusions
```

---

## 8b · PROCESS TREE — the delivery half ✔

```
4. WAITING ── you usually DON'T buy the equipment. the long-lead item is
              ordered by someone else and you don't control it.
   ✔ you buy: concrete · cages · surfacing · aggregate — short lead,
        ordered once an install date exists
   ✔ customer provides a SHIP DATE
   ✔ ship date known ──▶ install date can be set ──▶ your material gets ordered
   ✔ change orders commonly land in this window

5. RECEIVING ── ✔ delivered to YOUR STORAGE LOT, not the site
   ✔ freight calls 1 DAY AHEAD with a date and window
   ✔ SHIPMENT is its own object. a version can have several.
        unload · store · MARK for reference · PHOTOS (condition evidence)
        notify the customer it landed
   ✔ completeness is CUMULATIVE across shipments, checked at COMPONENT level
        the app builds the expected list from the version's scope rows —
        you have no such document today
   ✔ crates are NOT opened until on site
        → part shortages surface MID-INSTALL, the expensive place to find them
        → a second mobilization caused by equipment you didn't buy
        → this is what an exclusion about "shortages by others" exists for
   ▢ storage duration: "it depends"

6. SCHEDULING ── ✔ MANUAL. the app supplies numbers, you place the work.
   ✔ CUSTOMER sets the install date. GC = tight, school = flexible.
   ✔ the app hands you:
        duration (from service durations) · crew composition ·
        equipment + hours · material to be delivered · receiving status
   ✔ TWO ZOOM LEVELS, both wanted:
        MONTH ── whole jobs as blocks
        WEEK  ── the individual services, placeable, so parallel work is visible
                 (3 panel crews on one day)
   ✔ CREWS ARE DYNAMIC — one today, built for N
   ✔ NO dependency modelling. cure time between pour and assembly:
        you just know. the app shows nothing.

7. INSTALLATION ── ✔ complete = off site and not coming back
   ✔ that is the invoice gate. no formal punch/acceptance step.

8. POST COST ── BPCpc-26-10A2      ★ CLOSES THE LOOP
   ✔ MIRRORS the cost breakdown exactly — same cost objects, five cost types
   ✔ actuals GATHERED AT THE END, not accumulated during
        → deliberate: an autopsy, not an early warning. low friction.
   ✔ sources already exist: concrete tickets · rental invoices ·
        payroll hours · photos. collection, not new work.
   ✔ VARIANCE FEEDS BACK AS SUGGESTIONS:
        "F-3x12 excavation: catalog 2.65 hr, last 3 jobs averaged 3.31 hr. Update?"
        → without this the catalog runs on unverified guesses forever
        → with it, every finished job makes the next estimate better

CATALOG ──▶ COST BREAKDOWN ──▶ ESTIMATE ──▶ JOB ──▶ POST COST
   ▲                                                    │
   └──────────────── variance feeds back ───────────────┘

9. INVOICING ── BPCi-26-10A0
   ✔ GATE: job physically complete — off site and not coming back
   ✔ DEFAULT: one invoice at completion (90% of jobs)
   ✔ OPTIONAL negotiated schedule: % up front, agreed milestones, remainder
        draws must sum to contract value + approved change orders
   ✔ NUMBERING — the invoice carries no classifiers, it CITES instead:
        one invoice ....... BPCi-26-10A0
        several ........... BPCi-26-10A0-1/3 · -2/3 · -3/3
        denominator fixed when the schedule is agreed
        "per BPCe-26-10A0 REV1 · BPCco-26-10A0-1"
   ✔ CHANGE ORDERS ROLL INTO THE FINAL INVOICE — denominator never moves
   ✔ LAYOUT — the estimate's twin:
        line items (incl. accepted line add options)
        JOB ADD OPTIONS
        CHANGE ORDERS            ← bottom

10. PAYMENT ── ✔ LIVES IN QUICKBOOKS. no receivables, no aging, no amounts.
    ✔ this app carries STATUS ONLY.

11. WARRANTY ── ✔ a PERIOD, not a status. starts when the INVOICE IS SENT.
    ✔ default 1 year, adjustable per version
    ✔ overlaps the payment statuses — clock runs before the status says so
    ✔ on expiry the status becomes COMPLETED (terminal)
    ✔ callbacks are RARE — only installation damage
    ✔ a callback is REWORK YOU DON'T GET PAID FOR
         [?] recorded against the version so real margin is known
```

---

## 9 · SCREENS

```
✔ NEW COMPONENT WIZARD ....... 3 steps + readiness gate
✔ NEW FOOTING SPEC (inline)
✔ COST BREAKDOWN · tab 1 SCOPE — FINAL at v4 (identity columns + groups)
     briefs: docs/03-design-cost-breakdown.md  (all four zones, reference)
             docs/03a-design-scope-zone.md     (scope only)
             docs/03b-scope-revision-1.md      (identity columns)
             docs/03c-scope-revision-2.md      (groups)
✔ COST BREAKDOWN · tab 2 REQUIREMENTS — FINAL v1
✔ COST BREAKDOWN · tab 3 PURCHASING — FINAL v1 (pending $ format)
✔ COST BREAKDOWN · tab 4 COST — FINAL v2 (collapsible, reconciles at $12,462.07)
✔ COST BREAKDOWN · problems panel — FINAL v1 (POPUP)
✔ ESTIMATE EDITOR — FINAL v12 (MAIN)
✔ PROJECT BROWSER — FINAL v14 (MAIN, the frame)
✔ VERSION VIEW — FINAL v3 (MAIN)
✔ NEW PROJECT — FINAL v2 (POPUP)
     its dialog grammar is the template for every popup that follows:
     100px/1fr field grid · read-only values as #c0c0c0 chips · grey
     explanation lines in the value column · #ffffe1 tip for a rule ·
     #ffffc0 📋 block for what the action permanently records.
✔ MAIN WINDOW TEMPLATE — adopted. see docs/10.
     identity strip · tinted status strip · body · optional screen strip ·
     derived status bar whose "Next" says what has to happen for the job
     to move, and where a problem always displaces the ordinary next step.
     cost breakdown adopts it AT BUILD — chrome only, no re-render.
✔ SHELL IS MDI — child windows in one Project Manager frame,
     Window menu, Cascade, Ctrl+Tab. the teal desk is the client area.
     ★ menu/toolbar placement (frame vs child) still undecided
▢ NEW PROJECT · PROJECT LIST · PROJECT VIEW · VERSION VIEW ★
▢ COST BREAKDOWN EDITOR ★ .... the four zones
▢ ESTIMATE EDITOR ★ .......... autofill + override + live effective markup
▢ CATALOG BROWSER ............ finding one component among many is a real problem
▢ CONTACTS · ACTIVE VERSIONS LIST
```

---


## 9b · NAVIGATION — how you get anywhere ✔

```
FRAME                     Project Browser. always present, it IS the client
                          area. never closes.
   double-click a PROJECT   →  expands in place. no window.
   double-click a VERSION   →  opens VERSION VIEW

VERSION VIEW              MDI child. the hub for one job. stays open.
   [Cost breakdown]         →  COST BREAKDOWN     MDI child, 4 tabs
   [Estimate]               →  ESTIMATE EDITOR    MDI child
   [Post cost]              →  POST COST          MDI child
   [Record approval…]       →  popup
   [Record shipment…]       →  popup
   [Schedule…]              →  popup
   [Invoice…]               →  popup

COST BREAKDOWN            MDI child
   "2 problems" chip        →  PROBLEMS PANEL     popup
   [Issue estimate]         →  creates BPCe- and opens the ESTIMATE EDITOR
   [Add component ▼]        →  catalog picker     popup
   [New one-time…]          →  COMPONENT WIZARD   popup
   Fix… on a rate gap       →  SERVICE RATE TABLE popup

ESTIMATE EDITOR           MDI child
   right-click a row        →  context menu
   [Issue estimate]         →  locks it. forever.

CATALOG / CONTACTS / VEHICLES   from the browser toolbar. MDI children.
```

**Everything MAIN stays open.** Two jobs, each with a version view and a cost
breakdown, is four child windows and the Window menu lists them all. That is
what MDI bought us and it is worth using — the alternative was closing one job
to look at another.

**Popups block, then close back.** They record a fact or fix a gap; they never
hold anything you would want to keep looking at.

---

## 10 · OPEN

```
✔ MOBILIZATION — COMPLETE.  see docs/06-mobilization.md
     standalone service, unit = trip · labour from drive time · owned vehicles
     by the mile · rentals per job, not per trip · trailer chosen by weight AND
     dimensions, length usually binding · per diem an uplift on pay · lodging
     per version · vehicle $/mile computed, Tier 1, tracker deferred
     ▢ distance threshold — stored, no value set. the stay recommendation
       cannot fire until a number goes in. not blocking.

✔ ESTIMATE EDITOR — FINAL v10
     two panes · REF column bridging them · cost objects assignable to lines,
     sub-items AND options · row expansion showing cost · price · margin
     · grey selection · edit on double-click only · right-click Delete
▢ VEHICLES screen — new. the Tier 1 $/mile dialog lives here.
✔ ESTIMATE EDITOR — FINAL v12. supersedes v10 and v11.
     ★ build-time: the Optional add-ons box needs a "＋ Add option" footer
       row — the brief gained it after the render. no re-render needed.
     MAIN template chrome + the body split into three boxes:
     "Estimate of work" · "Optional add-ons" · "Totals".
     job-level add options are CREATED in that box, not just listed —
     that was the condition of approval.
     ✔ SETTLES A BIGGER QUESTION: the box grammar holds on a DOCUMENT,
       not just on status pages. one body grammar on every screen, and
       the INVOICE and POST COST screens can follow it.

▢ the material list itself — principle settled, contents are data entry
[?] a "post cost outstanding" counter on the project browser — jobs finished
    with no post cost. the loop that keeps rate tables honest is the easiest
    thing to skip, and nothing else will remind you. NOTED, not taken.
[?] is an unpaid warranty callback recorded against the version?
```

## 11 · NEXT

```
▶ MOBILIZATION formula, then it becomes an ordinary standalone service and
  nothing downstream needs a special case
  then ─ estimate editor v10 render
  then ─ remaining screens: PROJECT LIST · VERSION VIEW · NEW PROJECT ·
         CATALOG BROWSER · CONTACTS · ACTIVE VERSIONS · CALENDAR ·
         SHIPMENTS · POST COST
  then ─ BUILD

OUT OF SCOPE, decided:
  payment / receivables / aging ....... QuickBooks
  approval workflows .................. none. completeness gates only.
  inventory / stock ................... none
  dependency & cure modelling ......... none. you just know.
  multi-user / accounts / sync ........ schema ready, one machine today
```

---

## 12 · REFERENCE ONLY — do not build on

```
renderer/ 2,811 ln · engine/ 695 ln + schema.sql · estimator/ 994 ln · builder/ 1,105 ln

WRONG in the old build:
  ✘ project-level lifecycle stages         — the lifecycle is per version
  ✘ superseded / rejected states           — versions never die
  ✘ version = scope, rendition = re-issue  — actual model is option(divider)/version(scope)
  ✘ post_displacement_cy on footing_specs  — dropped
  ✘ complexity_factor on installation profiles — moved to project conditions
  ✘ soil_types as an entity                — dissolved into material + conditions
  ✘ stock + fallback procurement            — no stock
  ✘ interpolate-and-flag inside the engine  — suggestions only, never in a calculation
  ✘ fixed fee columns                       — dynamic fee list
  ✘ purchase_unit with no conversion factor — real gap, now fixed
STILL RIGHT:
  ✓ requirement-first expansion, pooled procurement, effective-rate allocation
  ✓ change orders as diffs committed only on approval
  ✓ derived flags rather than typed status
```
