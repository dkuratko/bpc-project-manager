# BPC — Master Tree
**Living document.** Ask for "the tree" any time and this is what gets shown.
Draft 10 · 2026-10-04 · process walked · schema drafted · 29 renders final

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
│   │          ✔ EXACTLY ONE ESTIMATE PER VERSION. pricing the job again
│   │            makes A1 — that is what A1 IS FOR. the only second
│   │            estimate document A0 can hold is BPCe-…A0 REV1, and a
│   │            REV is created BY an approval. so nothing ever picks
│   │            among a version's estimates: there is one.
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
  ★       COMPLETED, PAID ................ ▢ NOTHING CAN PRODUCE THIS.
                                            the warranty clock starts when
                                            the invoice is SENT, so a job is
                                            always inside warranty by the
                                            time it is paid — this status
                                            would last zero time. IDENTICAL
                                            argument to the removed
                                            "completed, payment required".
                                            proposed for removal; 14 → 13.
                                            see docs/26.
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
✔ UNKNOWNS AND ALARMS — adopted, see docs/22. how the app says "I do
     not know" and "this is wrong", from the mobilization panel.
     [?] chip #a00 on #ffffe1 — NEVER an empty cell, a zero or a dash.
     — means not applicable; 0 means zero; [?] means unknown and it
     MATTERS. unknowns PROPAGATE: 4,260 lb + [?], and a derived value
     with an unknown input is itself [?] all the way to the bottom line.
     but show what IS computable, with the caveat inline in #a00.
     THREE BLOCK GROUNDS, three meanings: #ffe0e0/#a00 alarm (wrong now)
     · #ffffe1/#000 tip (a rule) · #ffffc0/#808080 record (what gets
     written). every alarm names what would fix it. excluded rows stay
     visible in #808080 — deleting them loses the evidence the app
     considered them.
✔ NO ROWS OF INPUTS — adopted, see docs/12. at most ONE free-text or
     numeric input per row in any dialog or property sheet; pickers and
     checkboxes do not count. over that, the row is DISPLAY ONLY and a
     480 px ROW EDITOR POPUP does the typing. a row of three
     heterogeneous fields is a form pretending to be a table.
     document editors are exempt — editing rows in place is their job.
✔ NEW PROJECT — FINAL v2 (POPUP)
     its dialog grammar is the template for every popup that follows:
     100px/1fr field grid · read-only values as #c0c0c0 chips · grey
     explanation lines in the value column · #ffffe1 tip for a rule ·
     #ffffc0 📋 block for what the action permanently records.
✔ LIST WINDOW TEMPLATE — adopted. see docs/14.
     the SECOND template, for screens showing MANY things: contacts ·
     catalog · vehicles · shipments · active versions.
     filter band · [counters] · list · [screen strip] · status bar.
     no identity strip, no status strip — a list is not looking at one
     thing. COUNTERS ARE EARNED, not decoration: only when the counts
     are a to-do list. grouped lists reuse the project browser's cursor,
     banding and row rules verbatim.
✔ CONTACTS — FINAL v2 (MAIN, list). docs/15. grouped, no counters.
✔ CUSTOMER + CONTACT DIALOGS — FINAL v1 (POPUP, 2 dialogs × 2 modes).
     TWO popups, each with a NEW and a PROPERTIES mode — one dialog
     reopened, exactly as new project settled it.
     EVERY POPUP IS 600 px. fewer fields makes a dialog SHORTER, never
     narrower, so the 100px field grid lines up across all of them.
     automatic-recipient rules are authored on the PERSON WHO GETS
     ADDED, one place only, via a single dropdown whose chosen option
     is itself the scope (a colleague, or the whole company).
     AUTOMATIC RECIPIENTS: "wherever Grant goes, cc Ashley" is a standing
     fact about PEOPLE, so contact_defaults attaches a rule to either a
     person or a company. it SUGGESTS — adding Grant to a project writes
     an ordinary cc row that is then editable, deletable and never
     re-evaluated. never a live lookup at send time.
✔ MAIN WINDOW TEMPLATE — adopted. see docs/10.
     identity strip · tinted status strip · body · optional screen strip ·
     derived status bar whose "Next" says what has to happen for the job
     to move, and where a problem always displaces the ordinary next step.
     cost breakdown adopts it AT BUILD — chrome only, no re-render.
✔ SHELL IS MDI — child windows in one Project Manager frame,
     Window menu, Cascade, Ctrl+Tab. the teal desk is the client area.
     ✔ EACH CHILD OWNS ITS OWN MENU AND TOOLBAR — decided 04 Oct 2026.
          which is what all 29 renders already show: every window carries
          File · Edit · View · <Screen> · Window · Help. the FRAME has no
          chrome of its own, only a drawn outer title bar and the teal
          desk. the Window menu lives on each child, listing what is open
          and offering Cascade — which is why every render has it.
          true Win2000 MDI puts one menu on the frame; that was rejected
          because it contradicts every approved render and would mean
          stripping chrome out of all of them.
✔ NEW OPTION / NEW VERSION — FINAL v3 (POPUP). docs/13.
     ONE popup, TWO roles. the role is set by which command was pressed,
     never by a control inside the dialog.
     both commands create exactly one thing — a VERSION row — so only
     the row that says WHERE IT GOES differs: a chip minting a new
     letter, or a dropdown of existing letters. box 2 (scope), both
     callout blocks and the buttons are identical in both roles.
     the option/version distinction is taught by ADJACENCY — the two
     commands sit next to each other in the toolbar and the menu and are
     never separated — plus a pointer line in each role to the other.
✔ RECORD DIALOGS — FINAL v13 (POPUP family). docs/17.
     approval + line items rendered. the REVISION STATE of the approval
     dialog is spec'd and not yet rendered; schedule, shipment and
     invoice are fully specified and not yet rendered.
     Record approval · Record shipment · Schedule · Invoice.
     THE ONLY FOUR PLACES STATUS CHANGES. everything else in the app is
     derived from what gets typed here, so every one of them ends with a
     STATUS PREVIEW: the version view's status strip in miniature,
     wearing the ramp colour the job is about to take, with the 4px red
     lip when the fact causes a problem. it updates live as you type.
     TWO SHAPES: events recorded once (approval, shipment) and living
     records reopened over time (schedule: install→started→completed,
     invoice: sent→paid). living records are NOT wizards — every field
     stays editable, because correcting a fact is what fixes status.
▢ CATALOG BROWSER ............ finding one component among many is a real problem
▢ INVOICE · POST COST ........ both documents. follow estimate v12's box grammar.
◐ EQUIPMENT — briefed in docs/18, awaiting render. (was "Vehicles" —
     a boom lift is not a vehicle.) TREE + LIST, the first screen to use
     that variant; the catalog browser will reuse it.
       OWNED   → type → unit           a unit is ONE ASSET, by serial/VIN
       RENTED  → supplier → type → offering   a CLASS, never serial
     A TYPE IS GENERIC — "truck", "boom lift", "trailer", "loader" — and
     carries NO PHYSICAL FACTS. "truck" has no payload, no VIN, no make;
     the 2012 F-450 does. every dimension, weight, rating and spec lives
     on the MACHINE. the type is what a requirement points at without
     caring whose machine turns up. no category list: with a handful of
     generic kinds the type IS the grouping.
     both are sourcing methods of an equipment TYPE, which is what the
     work requires — the requirement-first catalog, unbent.
     TWO TABS (owned · rented) because their COLUMNS differ, and inside
     each, FACETS not a tree: a tree forces one order of nesting, facets
     let "what do United rent me" and "who rents me lifts" both be one
     click. from ideas-6b-catalog. the catalog browser uses the same.
     vehicle units get a COMPUTED $/mile; everything else is typed for now.
     RENTED holds TWO RATES — the card costing uses and what you were last
     billed. last paid SUGGESTS updating the card, never overwrites: one
     invoice is a data point about a price, not a new price. grouped by
     SUPPLIER then TYPE, two band tiers. MOVE says delivered or collected,
     and a collected rental IS load on your own trailer.
◐ MOBILIZATION PANEL — briefed in docs/19. where the LOAD becomes
     visible: every component and owned machine, what each weighs and
     how long it is, against combined capacity. a missing ship weight
     ALARMS rather than quietly shrinking the total — otherwise the trip
     count comes out low and every number on screen still reconciles.
▢ CALENDAR · SHIPMENTS · ACTIVE VERSIONS LIST
```

---


## 9b · NAVIGATION — how you get anywhere ✔
**Rebuilt 04 Oct 2026** from all 27 briefs. The earlier version predated
Equipment, Trackers and every popup designed after 09 Sep. This is the map the
build works from, so it has to be complete rather than representative.

```
FRAME ─── PROJECT BROWSER
          always present. IT IS THE CLIENT AREA and never closes — no close
          button at all, not a disabled one. opens filling the desk; the teal
          shows when you un-maximise it. docs/07.

  toolbar  New project ─────────▶ NEW PROJECT              popup
           New option ──────────▶ NEW OPTION / NEW VERSION popup, role A
           New version ─────────▶ NEW OPTION / NEW VERSION popup, role B
           Open ────────────────▶ VERSION VIEW             MDI child
           Catalog ▸ ───────────▶ CATALOG BROWSER          MDI child  ▢
           Contacts ────────────▶ CONTACTS                 MDI child
           Equipment ───────────▶ EQUIPMENT                MDI child
           Trackers ────────────▶ TRACKERS                 MDI child
  list     double-click PROJECT ─▶ expands in place. NO window.
           double-click VERSION ─▶ VERSION VIEW            MDI child
           right-click ─────────▶ Open version · New option · New version ·
                                   Record approval… · Post cost ▸ · Delete
  counters click a tile ────────▶ filters the list. no window.

VERSION VIEW ─── MDI child, the hub for one job. stays open.
  [Cost breakdown] ────────────▶ COST BREAKDOWN            MDI child, 4 tabs
  [Estimate] ──────────────────▶ ESTIMATE EDITOR           MDI child
  [Post cost] ─────────────────▶ POST COST                 MDI child  ▢
                                  greyed until the job is complete
  [Record approval…] ──────────▶ RECORD APPROVAL           popup
  [Record shipment…] ──────────▶ RECORD SHIPMENT           popup
  [Schedule…] ─────────────────▶ SCHEDULE                  popup
  [Invoice…] ──────────────────▶ INVOICE                   popup

COST BREAKDOWN ─── MDI child
  "2 problems" chip ───────────▶ PROBLEMS PANEL            popup
  [Issue estimate] ────────────▶ creates BPCe- · opens the ESTIMATE EDITOR
  [Add component ▼] ───────────▶ catalog picker            popup  ▢
  [New one-time…] ─────────────▶ COMPONENT WIZARD          popup
  Fix… on a rate gap ──────────▶ SERVICE RATE TABLE        popup  ▢
  Purchasing · [Mobilization…] ▶ MOBILIZATION PANEL        popup

ESTIMATE EDITOR ─── MDI child
  right-click a row ───────────▶ context menu · Delete
  ＋ Add option ───────────────▶ a job-level add option, created in place
  [Issue estimate] ────────────▶ locks it. forever.

CONTACTS ─── MDI child
  New customer / dbl-click ────▶ CUSTOMER properties       popup
  New contact / dbl-click ─────▶ CONTACT properties        popup
  PROJECTS count ──────────────▶ filters the PROJECT BROWSER. no window.

EQUIPMENT ─── MDI child, two tabs: Owned · Rented
  New type ────────────────────▶ EQUIPMENT TYPE            popup
  New unit / Properties ───────▶ EQUIPMENT PROPERTIES      popup, 4 tabs
      Maintenance · ＋ Add an entry ▶ LOG ENTRY            popup
      Specifications · ＋ Add ──▶ ADD A SPECIFICATION      row editor
      General · ＋ Add an item ─▶ ADD A COMPLIANCE ITEM    row editor
  New offering / Properties ───▶ RENTAL OFFERING           popup
      Rates · ＋ Add a rate ───▶ ADD A RATE                row editor
      Fees  · ＋ Add a fee ────▶ ADD A FEE                 row editor
  New supplier / Properties ───▶ SUPPLIER                  popup
  Fuel prices… ────────────────▶ FUEL PRICES               popup
  detail · [Set it on the type…] ▶ EQUIPMENT TYPE          popup

TRACKERS ─── MDI child
  New tracker / Properties ────▶ TRACKER                   popup  ▢
  Record renewal… ─────────────▶ RECORD RENEWAL            popup  ▢
  counters ────────────────────▶ filter the list. no window.

POPUPS THAT OPEN POPUPS ─── the only three
  RECORD APPROVAL · ◉ Create revision ▶ LINE ITEMS         popup
  INVOICE · ＋ Add a draw ─────────────▶ ADD A DRAW        row editor
  any ＋ Add a … row ─────────────────▶ its row editor     480 px
```

### Rules

**Everything MAIN stays open.** Two jobs, each with a version view and a cost
breakdown, is four child windows and the Window menu lists them all. That is
what MDI bought us and it is worth using — the alternative was closing one job
to look at another.

**Asking for a MAIN window twice raises the one that is open.** It never
stacks a duplicate nobody asked for.

**Popups block, then close back.** They record a fact or fix a gap; they never
hold anything you would want to keep looking at. Modal, on a
`rgba(0,0,0,.42)` scrim, over the window that opened them.

**A popup that opens a popup stays modal to its parent**, not to the window
behind it. Cancelling `Line items` returns to `Record approval`, not to the
version view — and cancelling `Record approval` discards the revision with it,
because the popup wrote nothing.

**Nothing navigates on save.** `Record` commits and closes back to where you
were. The two exceptions are explicit and labelled as such:
`Create & open cost breakdown` and `Issue estimate`.

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
✔ THE STATUS AND THE LIP COME FROM DIFFERENT FACTS. SCHEDULED comes from
    the install date; the red lip comes from the equipment being short.
    two dialogs, two facts, one row in the browser, neither knowing about
    the other. RECORDING A TRUCK DOES NOT SCHEDULE A JOB — three of its
    four outcomes hold the status and only move the alarm, and the record
    block's header says "status does not change" when it does not.
✔ SHIPMENT ITEMS are APPROVED or ISSUE — two outcomes, not three. the old
    ok/damaged/short was never exhaustive and nobody should classify a
    problem before describing it. AN ISSUE IS TRACKED: it keeps the item
    outstanding, raises an alert on the version while open, and closes
    only by reopening the shipment and switching it to approved —
    correcting the fact, never a separate resolve record. docs/25.
[?] does a lapsed company tracker belong on the project browser at all —
    one counter tile, or nothing? it must NOT lip project rows: versions
    carry their own problems and the lip would stop meaning either.
[?] is an unpaid warranty callback recorded against the version?
[?] does the app ever SEND anything itself, or only address documents and
    track that you sent them? contact_defaults assumes the latter.
[?] days_down on a maintenance log entry is recorded but never priced —
    the rate divides annual cost by annual MILES, so time off the road
    does not move $/mi. is that acceptable, or should annual_miles fall?
[?] a per-DAY cost build-up for owned non-vehicles (a lift: depreciation,
    maintenance, insurance over working days). typed until then, and
    labelled `typed` so it is never mistaken for a computed rate.
✔ suppliers is ONE LIST — anyone you pay, flagged is_rental / is_materials.
    some yards rent AND sell, and free text cannot be grouped. procurement
    and disposition gain supplier_id; their `vendor` text is retained only
    until the catalog screens are built. decided 12 Sep 2026.
[?] collecting a rental adds miles mobilization does not price — it charges
    the site distance only, not the detour to the yard and back.
[?] no way to create a version by copying TWO others — "A's site work with
    B's equipment" is a real request. copy one and hand-edit for now.
    (carried over from 9b's notes. see docs/13.)
```

## 11 · NEXT

```
▶ RECORD DIALOGS — briefed 10 Sep 2026, docs/17. awaiting render.
  then ─ CATALOG BROWSER
  then ─ INVOICE · POST COST documents
  then ─ CONTACTS · VEHICLES · CALENDAR · SHIPMENTS
  then ─ BUILD

CARRIED INTO THE BUILD, no re-render needed:
  estimate editor .... ＋ Add option footer in the Optional add-ons box
  cost breakdown ..... MAIN template chrome on all four tabs
  contacts ........... 14px gutter · 20px expand column · no placeholder
                       row on a collapsed group · blank AUTO on Exerplay
  contact dialog ..... Ashley's note reads "Sends POs on Fridays."
  new option ......... no record block while Empty is selected
  everywhere .......... every date carries its year

BUILD DECISIONS, 04 Oct 2026:
  shell ............. one Electron window. drawn outer title bar, teal desk
                      as the client area, children as floating windows that
                      each carry their own chrome.
  documents ......... printed to PDF, AND a copy written into the app's data
                      folder linked to the version — so BPCe-26-12A0 REV1 is
                      retrievable years later as the exact paper that was sent.
                      an issued document is evidence, not a view.
  attachments ....... COPIED into the app's data folder, never referenced in
                      place. the evidence for an approval is the last thing
                      that can afford to break when someone tidies a folder,
                      and one backup then covers everything.
  database .......... better-sqlite3, WAL, foreign_keys ON. one file in
                      userData. NOT sql.js — v0 used it, which is why v0 is
                      littered with db.save() and why missing one lost work.
  build order ....... the shell and every screen that is pure data entry
                      first. the money screens wait on the catalog, which has
                      no content and no screen to enter it with.

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
