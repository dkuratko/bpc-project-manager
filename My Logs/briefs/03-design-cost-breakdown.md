# Design brief — COST BREAKDOWN screen
For Claude Design. Build Play Contracting Project Manager.
Companion to the New Component Wizard, same visual language.

---

## What this screen is

The centre of the application. Everything else is downstream of it.

The cost breakdown is **not a spreadsheet you type into** — it's a pipeline with
four zones, and only two of them accept input. Zones 2 and 4 are computed and
read-only; their job is to let you catch a mistake before money is involved.

```
ZONE 1  SCOPE ────────── you input
ZONE 2  REQUIREMENTS ─── computed, read-only   ← the review surface
ZONE 3  PURCHASING ───── you decide            ← the only committed dollars
ZONE 4  COST ─────────── computed, read-only   ← two views that must reconcile
```

The document is `BPCc-26-10A0`. It inherits customer, address, contact and
site conditions from the project — none of that is ever retyped here.

---

## Visual language

Identical to the New Component Wizard:

- Windows 2000 / MDI child window. Tahoma 11px, `#c0c0c0` chrome, `#008080` desk.
- Bevels via inset box-shadow: `inset -1px -1px #0a0a0a, inset 1px 1px #fff,
  inset -2px -2px #808080, inset 2px 2px #dfdfdf`
- Sunken fields: white ground, reversed bevel.
- Title bar gradient `#000080 → #1084d0`, white bold text.
- Numeric cells in `Lucida Console` monospace, right-aligned.
- Yellow tip blocks `#ffffe1` with a 1px black inset.
- Error/alert rows `#ffe0e0` with `#a00` text.
- Group boxes: sunken panel, legend chip overlapping the top-left border.

---

## Window chrome

```
┌─ Cost Breakdown BPCc-26-10A0 — BPC-26-10 San Tan Shade Installation ──[_][□][×]┐
│ File   Edit   Scope   Pricing   View   Tools   Help                            │
│ [Add component] [Add service] [New one-time…] │ [Recalculate] │ [Issue estimate]│
├────────────────────────────────────────────────────────────────────────────────┤
│ Customer  Exerplay, Inc. · Grant Smith    Site  San Tan Elementary, Gilbert AZ  │
│ Native material  Native soil — hard clay   Conditions  ×1.15 soil  ×1.30 access │
├────────────────────────────────────────────────────────────────────────────────┤
│ ▌1 · Scope▐ │ 2 · Requirements │ 3 · Purchasing │ 4 · Cost │        ⚠ 2 problems │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│                            ZONE CONTENT                                        │
│                                                                                │
├────────────────────────────────────────────────────────────────────────────────┤
│ Cost $8,062.50  ×conditions $9,271.88  +cont 5%  +markup 20%   ▶ $11,590.00     │
│ ⚠ Cannot issue estimate — 2 problems                                           │
└────────────────────────────────────────────────────────────────────────────────┘
```

Tabs are **steps**, but freely navigable — not a wizard. The context strip and
the price ladder are always visible, on every tab.

---

## ZONE 1 — SCOPE

The only free-form input. Two tables plus add-option groups.

**Group box: "Base scope"** — a table.

| col | notes |
|---|---|
| Type | `Component` / `Service` icon |
| Item | name + part number, monospace part no. |
| Method | dropdown, installation methods for that component; blank for services |
| Footing | override dropdown; shows `— catalog —` when not overridden |
| Qty | editable, right-aligned |
| Unit | |
| ✕ | remove |

Rows:
```
Component  24x24x12 Hip Shade   HIP-242412   DB — Direct bury   — catalog —   1  EA
Component  Bench, 6 ft          BN-6         SM — Surface mount — catalog —   4  EA
Service    Site excavation                                                   12.00 CY
Service    Remove EWF surfacing                                           1,700  SF
```

Footer row: `＋ Add component ▼   ＋ Add direct service ▼   ＋ New one-time component…`

**Group box: "Add options"** — collapsible sub-tables, one per option. Each has
its own header showing name, attachment (`job` or a line), and its marginal
price once calculated.

```
▾ Private utility line locate                    job level          $1,200.00
     Service   Private line locate                              1  LS
▸ Footing installation                           line: Shade      $1,045.00
```

Header buttons: `＋ New add option…`

**Yellow tip block at the bottom:**
> Add options are priced as a **marginal recompute** — what the job costs with
> them, minus what it costs without. That is why an option can come out cheaper
> than pricing it on its own: it rides on the same concrete truck.

---

## ZONE 2 — REQUIREMENTS

Computed, read-only. **Grey/disabled field styling throughout** so it reads as
output. Six group boxes, stacked in two columns.

**Footings**
```
F-3x12   3′ dia × 12′ deep      4 EA     from  Hip Shade
F-1.5x3  1.5′ dia × 3′ deep     8 EA     from  Bench, 6 ft  ×4
```

**Materials required — pooled across the whole job**
```
Concrete, ready-mix              7.45 CY     Hip Shade 4.20 · Benches 3.25
Rebar Cage A                        4 EA     Hip Shade 4
```

**Generated output**
```
Native soil — hard clay         19.85 CY bank   →  24.81 CY loose  (swell 1.25)
                                                Hip Shade 4.36 · Benches 3.49
                                                Site excavation 12.00
Removed EWF                     11.49 CY bank   Remove EWF surfacing
```

**Labor — duration, and man-hours derived**
```
Installer          31.4 hr duration    ×3 crew    94.2 man-hr
Operator            8.2 hr duration    ×1 crew     8.2 man-hr
```

**Equipment**
```
Telehandler        17.6 hr
Mixer               3.2 hr
```

**Products**
```
— none —    the customer furnishes the equipment on this job
```

Any row the app could not compute renders as an **error row** — pink ground,
red text — showing only what IS known, never an inferred figure:

```
⚠  Excavate Footing has no rate for F-1.5x3        [Fix…]
    Labor and equipment below exclude 8 footings
```

**Yellow tip block:**
> This zone exists so you catch *"that's not 12 footings"* before any money is
> involved. Nothing here is editable — change the scope on tab 1.

---

## ZONE 3 — PURCHASING

Where dollars enter. Four group boxes. **Every price cell is editable** — the
catalog supplies a default, never a commitment.

**Pooled materials**

| Material | Required | Method ▼ | Waste | Purchased | Unit price | Fees | Total | Eff. rate |
|---|---|---|---|---|---|---|---|---|
| Concrete, ready-mix | 7.45 CY | Ready-mix, ABC | 5% | 8.00 CY | 185.00 | 129.40 | 1,609.40 | 216.03 /CY |
| Rebar Cage A | 4 EA | Premade, Harris | 0% | 4 EA | 178.00 | 0.00 | 712.00 | 178.00 /EA |

Each row expands (▾) to show its **fee list**:
```
   Delivery          flat        $85.00    always
   Fuel surcharge    percent         3%    $44.40
   Short load        flat       $150.00    not applied — purchased ≥ 4.00 CY
```
Fees not applied render greyed.

**Equipment**

| Equipment | Required | Sourcing ▼ | Periods | Rate | Fees | Total | Eff. rate |
|---|---|---|---|---|---|---|---|
| Telehandler | 17.6 hr | United Rentals | **3** days ✎ | 650.00/day | 500.00 | 2,450.00 | 139.20 /hr |
| Mixer | 3.2 hr | Owned | — | 42.00/hr | 0.00 | 134.40 | 42.00 /hr |

The **Periods** cell shows a small pencil glyph and a tooltip:
> Derived: ceil(17.6 ÷ 8) = 3 days, minimum 3. Overtype when the work spreads
> across more days than it fills.

**Disposition**

| Output | Generated | Method ▼ | Basis | Loads / Tons | Fees | Total | Eff. rate |
|---|---|---|---|---|---|---|---|
| Native soil | 24.81 CY loose | Haul off, Miller Pit | per ton | 35.96 T | 265.00 | 1,631.48 | 82.19 /CY |
| Removed EWF | 14.36 CY loose | **— not selected —** | — | — | — | **—** | — |

The unselected row is an **error row**. Its tip:
> `— not selected —` is not `$0.00`. An output with no disposition is a hole in
> the estimate. Choose *Leave on site* if it genuinely costs nothing.

**Products** — one row per scope row that carries a purchased product.
Vendor, quote number, quote date, valid-until, unit price, freight, crating,
total. On this job: `— none. Equipment furnished by the customer. —`

---

## ZONE 4 — COST

Read-only. A **view toggle** at the top: `◉ By purchase   ○ By component`.
Both must display the same grand total; a reconciliation chip sits beside it.

**By purchase — how money actually leaves**
```
PROCUREMENT
   Concrete, ready-mix   8.00 CY  ABC Concrete   one order, one delivery   1,609.40
   Rebar Cage A             4 EA  Harris                                     712.00
EQUIPMENT
   Telehandler            3 days  United Rentals                           2,450.00
   Mixer                 3.2 hr   Owned                                       134.40
DISPOSITION
   Native soil          35.96 T   Miller Pit                               1,631.48
LABOR
   Installer            94.2 man-hr @ 68.00                                6,405.60
   Operator              8.2 man-hr @ 82.00                                  672.40
                                                                        ───────────
                                                                          13,615.28
```

**By component — allocated**
```
Hip Shade  HIP-242412
   concrete      4.20 CY × 216.0268 ....................................  907.31
   cages            4 EA × 178.0000 ....................................  712.00
   telehandler   9.40 hr × 139.2045 .................................... 1,308.52
   labor        41.0 man-hr .............................................2,788.00
   disposition   4.36 CY × 82.1900 ......................................  358.35
Bench, 6 ft ×4
   concrete      3.25 CY × 216.0268 ....................................  702.09
   ...
Site excavation   ← a DIRECT SERVICE. its own cost object, not smeared.
   disposition  12.00 CY × 82.1900 ......................................  986.28
   ...
                                                                        ───────────
                                                                          13,615.28  ✓ reconciles
```

Under the allocation, a **worked-example tip block** — this is the mechanism
the whole application rests on, so show it:

> **Concrete.** 7.45 CY required, 8.00 CY bought, $1,609.40 all-in.
> Effective rate = 1,609.40 ÷ **7.45 required** = $216.0268/CY — over required,
> not purchased, so waste and fees ride back to whoever caused them.
> Shade 4.20 → 907.3128 → **907.31** · Benches 3.25 → 702.0873 → **702.08**
> Floors sum to 1,609.39, one cent short. Largest discarded fraction was the
> benches, so the cent goes there: **702.09**. Total $1,609.40 exactly.

**Cost-type summary strip** across the bottom of the zone:
```
Labor 7,078.00 │ Equipment 2,584.40 │ Procurement 2,321.40 │ Disposition 1,631.48 │ Product 0.00
```

---

## THE PRICE LADDER — status bar, always visible

```
 Cost 13,615.28  →  ×conditions 1.495  15,679.14  →  +cont 5% 783.96
                 →  +markup 20% 3,135.83  ═  COMPUTED PRICE  $19,598.93
```

Rendered as a horizontal chain of small sunken cells, each labelled. The final
cell is bold and outlined. Hovering any step shows what it did.

Conditions detail on hover: `soil — hard clay ×1.15 · access ×1.30 → 1.495`
plus a note: *product cost is never touched by conditions.*

---

## PROBLEMS PANEL

Same idea as the wizard's readiness panel, one tier up: this gates **issuing an
estimate**, not activating a component. Opened from the `⚠ 2 problems` chip.

```
┌ Problems — BPCc-26-10A0 ─────────────────────────────────────[×]┐
│ ⚠ CANNOT ISSUE ESTIMATE. 2 problems.                            │
│──────────────────────────────────────────────────────────────────│
│ ✓  Scope has 4 rows                                    tab 1     │
│ ✓  All components active                               catalog   │
│ !  Excavate Footing has no rate for F-1.5x3   [Fix…]   catalog   │
│ !  Removed EWF has no disposition selected    [Fix…]   tab 3     │
│ ✓  All 5 cost objects assigned to estimate lines       estimate  │
│ ○  No product quotes — not required on this job                  │
│──────────────────────────────────────────────────────────────────│
│ Fix… opens the Excavate Footing rate table with a blank F-1.5x3  │
│ row and an interpolated SUGGESTION of 0.85 hr from the volume    │
│ curve. Accept it or type the real number — it is never used      │
│ until you do.                                                    │
│                                    [ Issue estimate ] [ Close ]  │
└──────────────────────────────────────────────────────────────────┘
```

`Issue estimate` stays disabled until every ✓. No approval workflow, no second
person — just completeness.

---

## Renders wanted

1. **Zone 1 · Scope** — with the add-option group expanded.
2. **Zone 2 · Requirements** — including the pink unrated-service error row.
3. **Zone 3 · Purchasing** — concrete row expanded showing its fee list, and
   the unselected-disposition error row.
4. **Zone 4 · Cost** — *by component*, with the worked allocation tip block.
5. **Problems panel** — alone on a scrim, as the wizard dialogs were.

Optional 6th: **Zone 4 · by purchase**, to show the two views side by side.

---

## Rules a renderer must not break

- **No dollar figure appears anywhere in zones 1 or 2.** Prices exist only from
  zone 3 onward. If a component, footing or assembly shows a cost, the model
  has been violated.
- **Never show an inferred number as if it were measured.** A row that cannot
  compute shows what IS known and alarms the rest.
- **Money is hundredths, truncated, with the residual handed to the largest
  discarded fraction.** The two views of zone 4 must show identical totals.
- **Quantity subtotals also reconcile** — every column on every sheet adds up.
- `— not selected —` and `$0.00` are different states and must look different.
