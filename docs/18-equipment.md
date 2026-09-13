# Design brief — EQUIPMENT
**MAIN** window, MDI child. Opened by `Equipment` on the Project Browser toolbar
— **renamed from `Vehicles`**, because a boom lift is not a vehicle.
Follows `docs/14-list-window-template.md`, **FACET + LIST + DETAIL variant**.
**Two tabs: `Owned` and `Rented`.**

**Style reference:** `docs/design/reference/ideas-6b-catalog.dc.html`.
Take its **shape** — tab strip, sunken inset panel, three panes at
`214px / 1fr / 330px`, facet groups with counts, bevelled sortable table,
detail card, two-segment status bar.
**Do not take** its navy selection, its 11 px type, its notes panel, or its
content. See `docs/14` for the full do-not-take list.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/contacts.v2.dc.html` for the list pane,
`docs/design/project-browser.v14.dc.html` for cursor and type.

---

## ⛔ SCOPE — two renders, in this order

**Render 1 · the window.** One MDI child on the teal desk, `Owned` tab active.
Three panes inside one sunken inset panel. No dialogs open, no menu open.
Window **1180 × 640**.

**Render 3 · the log entry dialog**, two 600 px panels side by side.

**Render 4 · the sheet's other three tabs**, three 980 px panels stacked.

**Render 2 · everything together, in TWO ROWS on one canvas.**

```
row 1   Equipment window            1180 × 640
row 2   Equipment properties  600   +   Fuel prices  480      18 px apart
```

Two rows, not one, because three panels side by side is 2,300 px of canvas and
this renderer has produced malformed output on wide layouts before. Nothing
wider than 1,180 px on either row.

Row 2 sits on a `rgba(0,0,0,.42)` scrim strip; row 1 sits on the teal desk.

Each is its own file. One well-formed document, nothing after `</x-dc>`.

---

## Render status

```
✔ equipment window                 v2 → v6   accepted
✔ properties · Maintenance         v5 → v6   accepted
✔ fuel prices dialog               v6        accepted
✔ properties · General / Specifications / Rate   v2   accepted
✔ add a specification popup        v2        accepted — not asked for, kept
✔ log entry · add + edit           v1        accepted, no changes
▢ RENTED tab                       never drawn
```

**Two fixes, both small:**

1. `equipment-render2.v6` still sets the properties sheet at `11px Tahoma`
   with `letter-spacing: normal`. The three-tab render got this right at
   `10px` / `.05em`; the sheet inside render 2 did not. Same sheet, two sizes.
2. Every render still uses the invented fleet. See below.

**`＋ Add a specification` was invented by the render and is kept.** Its
`Applies to ◉ All Ford F-450s / ○ This unit only` puts the scope question where
the row is created rather than leaving it to which box you happened to click,
and its `Name` dropdown over names already in use is the right answer to
`Bed length` becoming `bed len` on the next truck. Fold it into the brief as
specified.

---

## ★ TOW CAPACITY — the render was ahead of the model

The General tab now carries `Tow capacity` as a fit field, on the grounds that
*"the mobilization check reads all four."* **It did not.** `docs/06` checked
the deck only — weight against trailer payload, length and width against the
deck — and never asked whether the truck could pull the result.

**The real fleet is what makes that indefensible.** A Bobcat T66 on a 20 ft
flatbed behind an F-450 is precisely the question a tow rating answers, and it
is the only load Damian routinely hauls.

So the check is added rather than the field demoted:

```
DECK FIT   load weight ≤ trailer capacity
           AND longest ≤ deck length  AND  widest ≤ deck width
TOW FIT    trailer tare + load weight ≤ truck tow capacity
```

That needs one more number than the render shows: **a trailer's tare weight**,
its own empty weight, which counts against the truck's rating alongside the
load. `equipment.tare_weight_lb`.

---

## ⚠ THE REAL FLEET — replace every invented unit

Damian owns **three** things. Every render so far used invented equipment;
these replace it everywhere.

```
Trucks     2012 Ford F-450
Trailers   20 ft flatbed trailer
Loaders    Bobcat T66 skid steer          ← NOT a vehicle
```

### What this settles: one unit per type

**He owns one of each, so every type has exactly one unit.** The type/unit
layer stays in the schema — a rental offering is type-level, and
`equipment_requirements` must point at a type so owned and rented can both
satisfy it — but **the Equipment window never mentions it.** A row is a unit;
`Type` appears only as a dropdown inside the properties sheet.

Do not surface the distinction in the list, in a column, or in a group band.

### What this changes: the Bobcat is not a vehicle

```
capacity · deck     blank. those belong to a CARRIER.
identifier          a SERIAL, not a VIN.
rate                per HOUR, typed. the per-mile build-up does not apply —
                    a skid steer does not accrue cost by driving to site.
ship weight & dims  IT HAS THEM, because it rides the flatbed. See docs/06.
```

### Numbers still needed — the render should wait for these

```
F-450         VIN · plate · odometer · purchase price · salvage · life miles
              mpg · annual miles · annual maintenance · insurance + registration
              tow rating · GVWR · bed length
              ★ it is a 2012, so the depreciation figures are nothing like the
                new-truck numbers used so far
20 ft flatbed VIN · capacity lb · deck width · rate inputs
Bobcat T66    serial · operating weight · length × width × height
              hourly rate · in-service date
compliance    registration, DOT and insurance dates for each
rentals       who you rent from, what, and at what rate
```

**Nothing invented gets rendered.** Give me the ones you have and the rest can
carry a visible `[?]` rather than a plausible-looking lie.

---

## The idea — three kinds of thing, all already in the catalog

```
EQUIPMENT TYPE    "Ford F-450" · "64' boom lift"
                  what the work REQUIRES. no price, no owner.
                  equipment_requirements already points here.

OWNED UNIT        one physical asset — THIS F-450, VIN 1FDUF4HT5NEC00001.
                  its own costs, its own mileage, its own history.
                  you can own two of the same type; they are two units.

RENTAL OFFERING   a supplier's class — United Rentals' 64' boom lift.
                  NOT serial-specific. you rent "a 64' boom", not that one.
                  its own rate, minimum and delivery fees.
```

**Owned units and rental offerings are both sourcing methods** — both are ways
of satisfying a requirement for a type. That is exactly the shape the catalog
was designed with: requirement first, sourcing second. Nothing here bends it.

The asymmetry is real and is the whole reason for the layout below: an owned
unit is identified by a **serial**, a rental is identified by **who you rent it
from**.

---

## Two tabs, three panes

```
┌ Owned ┐ Rented ────────────────────────────────────────────────────┐
│ ┌ facets ──────┬ list ──────────────────────┬ detail ────────────┐ │
│ │ Search…      │  the units, sortable       │  the selected unit │ │
│ │ ▾ By category│                            │  in full           │ │
│ │ ▾ Maintenance│                            │                    │ │
│ └──────────────┴────────────────────────────┴────────────────────┘ │
```

### Why tabs, and why facets instead of a tree

**Tabs, because the columns differ.** An owned unit has a VIN, capacity, deck
and a computed `$/mi`; a rental has a rate, a minimum and delivery fees. In one
list those headers would change under you depending on what you clicked. **A
tab is a promise about what the columns are.**

**Facets, because a tree forces one order of nesting.** Rentals are naturally
`supplier → category → offering` — but you just as often want to ask *"who
rents me lifts"*, which is `category → supplier`. A tree makes you pick one.
Facet groups let both exist at once, each filtering one flat list, and the
four-level depth problem disappears because **there is no nesting left.**

An earlier draft of this brief used a tree. The reference is better and it is
replacing it.

---

## Chrome

```
title bar    Equipment
menu         File  Edit  View  Equipment  Window  Help
toolbar      New type · New unit · New offering · New supplier
             ‖ Properties · Deactivate  ‖ Fuel prices…
filter band  Find [                    ]   ☐ Show inactive
status bar   left:  equipment on a version cannot be deleted
             right: 4 owned · 2 suppliers · 4 offerings · rates: computed
```

`Find` searches both panes — a match in the list expands its path in the tree.

`rates: computed` is `app_settings.vehicle.rate_method`, read-only.

---

## TAB · Owned  ★ rendered

### v2 folded the facet rail away — accepted

The render replaced the 214 px facet column with **three dropdowns in the
filter band** (`Category` · `Status` · `Sort`) and moved the maintenance
counters into the **status bar**. That is better and it stands: it buys ~220 px
for the list, and two dropdowns filter simultaneously exactly as two facet
groups did. The list is grouped by category again, with `±` bands.

**One correction:** the selected row gets `▶` **and the 3 px black spine down
its category group**. The list is grouped again, and every other grouped list
in this application carries the spine. v2 has the arrow alone.

### Maintenance counters — now in the status bar

```
Maintenance   ⚠ Rate over 12 months old 1   ⚠ Registration expiring < 60 days 1
              Unused 12 months 0
```

Red `#a00` when the count is non-zero, `#808080` when it is zero. Each is
clickable and filters the list.

#### The maintenance group is a standing audit

`Rate over 12 months old` reads `vehicle_rate_inputs.computed_at`. It exists
because **a rate nobody has recomputed since fuel was $2.90 is still a number
on a bid**, and nothing else in the app would ever mention it.

#### Registration expiry earned a typed column, right here

The specs tab puts tow rating and odometer in a list because **nothing reads
them**. `Registration expiring < 60 days` reads registration expiry — so by
that same rule it is now a typed field, `equipment_sourcing_methods
.registration_expires_at`, not a spec row.

**The facet is what promoted it.** That is the rule working, not an exception
to it: a truck whose registration lapsed cannot legally leave the yard, which
is worth a column and an audit line.

### List — the middle pane

```
NAME ▲                     VIN / SERIAL         CATEGORY   CAPACITY   DECK L × W      RATE
──────────────────────     ──────────────────   ────────   ────────   ────────────    ──────────
minmax(0,1fr)              150px                80px       76px, R    100px           90px, R

▶ Ford F-450               1FDUF4HT5NEC00001    Trucks     4,800 lb    9.0 × 7.0 ft    $0.91 /mi
  Ford F-350 — ¾ ton       1FT8W3BT2MEC00002    Trucks     3,200 lb    8.0 × 6.5 ft    $0.79 /mi
        ⚠ rate computed 14 Aug 2025 — 13 months old
  Genie S-45 boom lift     S45-0000-0004        Lifts         —            —         $210.00 /day
  20 ft equipment trailer  5JW1C2027M1000003    Trailers   7,000 lb   20.0 × 8.5 ft    $0.31 /mi
```

Flat and sortable — `NAME ▲` carries the sort arrow, and any header sorts.
**No grouping and no expand column**, because the facets do that job now.

- **The F-350 row is `#a00`**, with its reason beneath it. This is a catalog,
  not a job list, so there is no status ramp to conflict with — `#a00` text
  means *this row has a problem*, exactly as the reference uses it.
- **The lift has `—` for capacity and deck.** Those exist to choose the trailer
  for mobilization; a lift is cargo, not a carrier.
- **The cursor is on the Ford F-450** — `▶` in the gutter. **No spine** on this
  tab: a spine marks a group, and a flat list has none.

All VINs and serials are **invented** and end in `0000N`.

### Detail — 330 px, the selected unit in full

`#c0c0c0` ground, raised bevel. 12 px bold title, `#404040` subtitle, then
labelled sections in white sunken boxes.

```
Ford F-450
Trucks · owned · in service 14 Mar 2024

FIT
  Capacity 4,800 lb   ·   Deck 9.0 × 7.0 ft

RATE  $0.9054 /mi                    computed 08 Sep 2026
  Fuel           $3.85 ÷ 12 mpg                       0.3208
  Maintenance    $2,520 ÷ 18,000 mi                   0.1400
  Tyres          $1,600 ÷ 50,000 mi                   0.0320
  Depreciation   ($78,000 − $20,000) ÷ 250,000 mi     0.2320
  Fixed          ($2,600 + $650) ÷ 18,000 mi          0.1806
                                                     ───────
                                                      0.9054

SPECIFICATIONS
  Make Ford · Model F-450 Super Duty · Year 2022 · Fuel Diesel
  Tow rating 16,000 lb · GVWR 14,000 lb · Bed 8.0 ft

THIS UNIT
  VIN 1FDUF4HT5NEC00001
  Plate AZ CG-84102 · Odometer 41,280 mi
  Registration expires 31 Jan 2027

USED ON
  12 versions · last 26-09A0, 22 Aug 2026

[ Edit equipment… ]        [ Recompute rate ]
```

`$0.9054` here, `$0.91 /mi` in the column — **four decimals where the
components have to visibly sum, two where it is a price.** The detail pane is
where that is checked.

**The detail pane replaces the screen strip.** They answer the same question at
different sizes, so this window has no strip.

### Status bar

```
left:   4 owned · 1 rate over 12 months old · 1 registration expiring
right:  Equipment · 4 owned · 4 rented
```

---

## TOOLBAR · `Fuel prices…`  — render 2, row 2

**One place to change fuel, and every computed rate follows.**

Today `vehicle_rate_inputs.fuel_price` is typed per unit, so a fuel rise means
editing every truck and remembering which ones you did. It becomes a **global
setting with a per-unit override**.

### The wrinkle: fuel price is per fuel type, not per fleet

A diesel F-450 and a gasoline pickup do not move together. One global number
would be wrong the moment the fleet is mixed, so the setting is **one price per
fuel type**, and a unit's `Fuel` specification says which one it uses.

### The dialog — 480 px, the window's grammar

Caps section labels over white sunken boxes, exactly like the properties
sheet. No group boxes.

```
PRICES
┌──────────────────────────────────────────────────────────┐
│ Diesel     current $3.85 /gal      new  [ $4.12 ]        │
│ Gasoline   current $3.40 /gal      new  [ $3.58 ]        │
│                                    set 12 Jun 2026       │
└──────────────────────────────────────────────────────────┘

WHAT THIS RECOMPUTES
┌──────────────────────────────────────────────────────────┐
│ Ford F-450              $0.9054 → $0.9279 /mi   +$0.0225 │
│ Ford F-350 — ¾ ton      $0.7897 → $0.8090 /mi   +$0.0193 │
│ 20 ft equipment trailer $0.3100 → $0.3100 /mi  unchanged │
│                                                no engine │
└──────────────────────────────────────────────────────────┘
                                  3 of 4 units · 2 rates change
```

```
 tip   Rates already on a sent estimate do not move.
       A recompute reaches the next calculation, never a document you
       have issued — the same rule as every other template in the app.
```

```
[ Update & recompute ]   [ Cancel ]
       160 px, default       78 px
```

**The preview is the point.** A button that silently rewrote every rate would
be the kind of thing you stop trusting; showing the two rates that move, and
the one that does not, makes it a decision rather than a leap.

**The trailer is the honest detail.** Its `$0.31 /mi` is tyres, depreciation
and maintenance — it has no engine, so fuel cannot touch it. A dialog that
listed it as changing would be wrong in a way nobody would notice.

`Update & recompute` stamps `computed_at` on every unit it touches, which is
what clears the `Rate over 12 months old` counter.

---

## TAB · Rented — specified, not rendered

Same three panes, different facets and columns.

```
▾ By supplier              ▾ By category           ▾ Maintenance
    United Rentals    3        Lifts        2          No rate set        0
    Sunstate          1        Trailers     1          Rate not confirmed
                               Trucks       1            in 6 months      2
```

**Both facet groups at once** is the whole argument for facets over a tree:
*"what do United rent me"* and *"who rents me lifts"* are both one click.

```
NAME ▲              SUPPLIER          CATEGORY   RATE           MINIMUM   FEES
64' boom lift       United Rentals    Lifts      $485.00 /day   1 day     Delivery $150.00 · Pickup $150.00
45' boom lift       United Rentals    Lifts      $365.00 /day   1 day     Delivery $150.00 · Pickup $150.00
20 ft trailer       United Rentals    Trailers    $85.00 /day   3 days    —
¾ ton pickup        Sunstate Equip.   Trucks     $145.00 /day   1 day     —
```

**No VIN column.** You rent *a* 64' boom, not a specific one — the missing
column is the entire difference between the two tabs.

Detail pane: the offering, its fees itemised, the supplier's phone and account
reference, and `USED ON`.

---

## Where these rates go

**This list is the price list. The job's cost is worked out elsewhere.** The
cost breakdown's Purchasing tab asks, per version, *which* unit or offering
satisfies each required type, and prices it there — periods, minimums, fees and
the effective rate over required hours:

```
Telehandler   14.2 hr   United Rentals ▼   3 days   $650.00 /day   $500.00   $2,450.00   $172.54 /hr
```

That `Sourcing ▼` **is this list**, filtered to what can satisfy the type.

```
truck · trailer    → MOBILIZATION        per mile, computed
everything else    → Purchasing tab      per hour or day, minimums, fees
```

**Templates, not commitments.** A rate edited here reaches the next
calculation, never an estimate already sent, and any rate can be overtyped on a
single version when a supplier gives you a deal on one job.

---

## Rates — computed for vehicles, typed for everything else

```
owned vehicle      $/mile, COMPUTED from fuel, maintenance, tyres,
                   depreciation and fixed costs. stamped with a date.
owned non-vehicle  $/day or $/hr, TYPED for now.
rental             whatever the supplier charges. never per mile.
```

**A per-day build-up for owned non-vehicles is deferred, not forgotten.** A
lift's day rate should come from depreciation, maintenance and insurance over
working days, the same way a truck's mile rate does. Logged in `00-TREE.md`
§10. Until then the typed rate is labelled `typed` in the strip, so it is never
mistaken for a computed one.

---

## POPUP · Equipment properties  — render 2, row 2

**A Win2000 tabbed property sheet.** 600 px, four tabs, `OK` / `Cancel`.

### ★ It uses the EQUIPMENT WINDOW's grammar, not New Project's

**This popup is the detail pane with its values made editable.** Same sections
in the same order, same look — only the text becomes fields. That is the whole
design, and it is why the earlier draft was wrong: it used New Project's
group-box-and-field-grid grammar, which belongs to short form dialogs and made
a property sheet full of tables feel like a different application.

```
✔ TAKE FROM THE WINDOW
  tab strip        active tab #dfdfdf, raised, flush with the panel below;
                   inactive #c0c0c0, sitting 1 px lower. exactly the
                   Owned/Rented strip.
  section label    #404040 caps, letter-spacing .11em, 3 px above its box
  section body     a WHITE SUNKEN BOX — var(--s), #fff, padding 5px 7px
  tables           bevelled #c0c0c0 header, var(--r), the list's own header
  numbers          'Lucida Console' monospace, right-aligned

✘ DO NOT USE
  group boxes with a floating legend        ← New Project's grammar
  the 100px / 1fr field grid                ← New Project's grammar
```

Fields inside a white box are ordinary `var(--s)` inputs; read-only values are
plain text, not `#c0c0c0` chips — the detail pane shows plain text and this is
its twin.

**Buttons stay dialog-style**: right-aligned `OK` 110 px (default, outlined
bold) and `Cancel` 78 px. The detail pane's full-width buttons belong to a
pane, not a dialog.

```
┌ General ┐ Maintenance │ Specifications │ Rate ─────────────┐
```

`Maintenance` sits second because it is the tab you open most often — a rate is
set once a year, a service happens every few months.

Tabs because there are three unrelated jobs here and one scrolling column would
bury all of them. The cost breakdown already established tabs in this
application, so nothing new is being introduced.

### Which specs are typed fields, and which are list rows

**The engine reads three numbers about a vehicle and no others**, so exactly
three get typed fields. Everything else — make, model, year, plate, tow rating
— lives in an editable list of `name · value · unit` rows.

```
TYPED FIELD    the engine reads it. capacity_lb · deck_length_ft ·
               deck_width_ft — the mobilization fit check, docs/06.
LIST ROW       everything else. adding one is data entry, never a migration.
```

This is `component_specifications` applied to equipment, and the same design
principle: **extensible lists, not fixed columns.**

**Tow rating is a list row, not a field — deliberately.** It looks like it
belongs beside capacity, but nothing checks it: `docs/06` verifies the load
fits the trailer, not that the truck can pull it. **A spec earns a typed field
the day the engine reads it, and not before.** If the fit check later gains a
tow check, tow rating is promoted then.

### The sheet's settled grammar — v5, with one correction

v5 rendered at **980 px with group boxes and floating legends**, not the caps
labels over white boxes this brief first asked for. **That stands.** Group
boxes *are* the Win2000 property-sheet idiom, tables need the width, and it
reads correctly beside the 6b reference. The earlier instruction is withdrawn.

**One correction: type is 10 px Tahoma with `letter-spacing: .05em`.** v5 set
`11px` and `letter-spacing: normal`. Every other window in this application is
10 px — the project browser, contacts, the equipment window directly above it —
and a property sheet in a different size reads as a different program. Three
more tabs at 11 px would cement it, which is why it is worth fixing now.

Everything else from v5 carries: 980 px, group boxes, bevelled table headers,
`OK` · `Cancel` · `Apply` at 78 px each.

**Today, for every derived day-count on this sheet, is 11 Sep 2026** — the date
v5's figures were computed against. Keep them.

### Tab 1 · General — ★ render 4

Two boxes across the top in a `1fr 300px` grid, then compliance full width.

```
┌ Identity ───────────────────────────┐ ┌ Fit — what mobilization checks ──┐
  Type       [ Ford F-450        ▼ ] ★    Capacity  [ 4,800 ] lb
  Category     Trucks   from the type     Deck      [ 9.0 ] × [ 7.0 ] ft
  Label      [ Truck 2 ]   nickname
  VIN        [ 1FDUF4HT5NEC00001 ]  ★     These three belong to the TYPE.
  In service [ 14 Mar 2024 ]              Editing them changes every unit
  Status       Active                     of it. Blank on anything that is
                                          not a vehicle.
                                          ☑ Default unit for Ford F-450
```

```
┌ Compliance ──────────────────────────────────────────────────────────────┐
  ITEM             LAST          EVERY        EXPIRES       STATUS
  Registration     01 Feb 2026   12 months    31 Jan 2027   142 days        ✕
  DOT inspection   30 Aug 2025   12 months    30 Aug 2026   12 days over    ✕
  Insurance        01 Jan 2026   12 months    31 Dec 2026   111 days        ✕
  ＋ Add an item
```

The `DOT inspection` row is **`#a00` throughout**, `STATUS` reading
`12 days over` in bold. It is the row the window's
`Registration expiring < 60 days` counter and v5's `Current state` table are
both pointing at.

**Compliance is a list, not three fields.** Registration, DOT inspection and
insurance are the ones you have today; the fourth is data entry, not a
migration. `EXPIRES` is `LAST + EVERY` and is computed, so logging a renewal
moves it without anyone typing a date twice.

**`Plate` is not here.** It is a specification — see below — because nothing
reads it. VIN is a column because it identifies the unit in a list; a plate
does not.

### Tab 2 · Maintenance — rendered at v5

```
DUE
┌──────────────────────────────────────────────────────────┐
│ Odometer      [ 41,280 ] mi    as of  [ 08 Sep 2026 ]    │
│ Next service  [ 45,000 ] mi              3,720 mi away   │
│ Registration    31 Jan 2027                 142 days     │
│                                  from the General tab    │
└──────────────────────────────────────────────────────────┘

LOG                                          [ ＋ Add an entry ]
┌ DATE ──────── ODOMETER ─ KIND ──── WORK ──────── COST ───┐  ← bevelled header
│ 02 Aug 2026   38,940 mi  service   Oil, filters   $184.00 ✕│
│ 28 May 2026   35,110 mi  tyres     Front pair     $684.00 ✕│
│ 14 Mar 2026   31,220 mi  repair    Front brakes   $612.00 ✕│
│ 09 Nov 2025   24,610 mi  service   Oil, filters   $142.00 ✕│
└──────────────────────────────────────────────────────────┘
              Last 12 months · service + repair      $938.00
```

The `LOG` table uses the **equipment list's own header** — `#c0c0c0` ground,
`var(--r)` bevel, `#404040` caps at `letter-spacing .11em` — so the sheet and
the window read as one thing.

Columns `84px 76px 62px minmax(0,1fr) 70px 19px`. `KIND` is a dropdown on each
row; `✕` removes it.

`KIND` is `service · tyres · repair` — a dropdown on each row.

#### Why `KIND` exists, and why tyres are separate

**The rate build-up already has a tyres line of its own.** If a tyre purchase
counted toward maintenance it would be charged twice, in two different rows of
the same rate. So the log tags it, and the 12-month total sums
`service + repair` only.

`$184.00 + $612.00 + $142.00 = $938.00`. The $684.00 of tyres is deliberately
excluded.

#### The log is a suggestion, never a value

The Rate tab assumes `$2,520 /yr` maintenance. The log says `$938.00`. The tab
says so and **does nothing about it**:

```
 tip   Rate tab assumes $2,520 /yr. The log shows $938.00 over 12 months,
       from entries starting 09 Nov 2025 — less than a full year, so it
       under-reports. Review it before you change anything.
                                                   [ Use $938.00 ]
```

**Interpolation is a suggestion offered to a person, never a value inside a
calculation** — the design principle, applied. The button exists; it is never
pressed for you. And the caveat about the log's age is the honest part: a young
log always looks cheap.

This is the same loop post cost runs on the catalog's rate tables, which is
what makes it feel like the rest of the application rather than a bolt-on.

### Tab 3 · Specifications — ★ render 4

```
┌ All Ford F-450s ─────────────────────────────────────────────────────────┐
  NAME                VALUE                        UNIT
  Make                Ford                                                  ✕
  Model               F-450 Super Duty                                      ✕
  Year                2022                                                  ✕
  Fuel                Diesel                                                ✕
  Tow rating          16,000                       lb                       ✕
  GVWR                14,000                       lb                       ✕
  Bed length          8.0                          ft                       ✕
  ＋ Add a specification

┌ This unit only ──────────────────────────────────────────────────────────┐
  Licence plate       AZ CG-84102                                           ✕
  Colour              Oxford White                                          ✕
  Toll tag            AZ-4471-92                                            ✕
  ＋ Add a specification
```

**Two boxes because scope differs** — editing `Year` changes every F-450,
editing `Licence plate` does not.

`Fuel` is `Diesel` here, and that single row is what tells the Rate tab which
global fuel price to use. **A specification with a consequence**, which is
exactly why the split between fields and rows is by *what reads them* rather
than by how important they look.

**`Odometer` has left this list.** It is a field on the Maintenance tab now,
because the log's interval arithmetic reads it — the rule promoting a spec the
day something reads it, for the third time.

### Tab 4 · Rate — ★ render 4

```
┌ Basis ───────────────────────────────────────────────────────────────────┐
  Method        ◉ Computed from inputs        ○ Typed
  Annual miles  [ 18,000 ] mi/yr        used by 3 of the 5 lines below
```

```
┌ Build-up ────────────────────────────────────────────────────────────────┐
  LINE            INPUTS                                            $/MI
  Fuel            $3.85 /gal · diesel, from Fuel prices ÷ [ 12 ] mpg  0.3208
                  ☐ override for this unit
  Maintenance     [ $2,520 ] /yr ÷ 18,000 mi/yr                       0.1400
                  log suggests $938.00 — see Maintenance
  Tyres           [ $1,600 ] /set ÷ [ 50,000 ] mi                     0.0320
  Depreciation    ([ $78,000 ] − [ $20,000 ]) ÷ [ 250,000 ] mi        0.2320
  Fixed           ([ $2,600 ] + [ $650 ]) ÷ 18,000 mi/yr              0.1806
  ────────────────────────────────────────────────────────────────────────
  Computed rate                                                  0.9054 /mi
  last computed 08 Sep 2026                              [ Recompute ]
```

`0.3208 + 0.1400 + 0.0320 + 0.2320 + 0.1806 = 0.9054`, shown in every list as
`$0.91 /mi`.

**`$3.85` is not an input on this tab.** It is the fleet-wide diesel price,
shown as plain text with its source named, and changed from `Fuel prices…` on
the toolbar. `☐ override for this unit` turns it into a field — which is what
`vehicle_rate_inputs.fuel_price` being nullable means.

**`Annual miles` appears once, at the top.** Three lines divide by it and v5's
detail pane repeated `18,000` in each of them. One field, referenced by name,
cannot drift out of step with itself.

**`Method ◉ Computed / ○ Typed`** is how an owned lift gets a rate: choose
`Typed` and the build-up is replaced by a single rate and basis. A non-vehicle
opens on `Typed` with `Computed` unavailable — there is no mileage to divide by.

The `log suggests $938.00` line is a grey pointer, not a button. **The button
lives on the Maintenance tab**, next to the evidence for it. A number you can
accept without seeing where it came from is the thing this application is
trying not to be.

### Render 4 — three panels, stacked

**Three instances of the sheet, one per row**, 980 px, 22 px apart, on a
`rgba(0,0,0,.42)` scrim. Three across would be 2,940 px of canvas.

Captions in `#fff` bold 11 px above each:

```
GENERAL — identity, the fit check, and compliance
SPECIFICATIONS — two scopes, type and unit
RATE — computed, with its inputs named
```

Title bar on all three: `Equipment properties — Ford F-450`, the tab strip
showing all four with the relevant one active.
Nothing after `</x-dc>`. One well-formed document.

## POPUP · Log entry — ★ RENDER 3, both states

**One dialog, two modes** — the pattern used everywhere else in this
application:

```
＋ Add an entry        →  Add log entry — Ford F-450      blank,  [ Add ]
double-click a row     →  Log entry — 02 Aug 2026         filled, [ OK  ]
```

A separate read-only viewer would be a third dialog showing the same fields
with nothing to gain. **The edit dialog IS the detail view**, exactly as
`Customer properties` is `New customer` reopened.

### Grammar — the SHORT FORM one, 600 px

This is a form of nine fields, so it uses **New Project's dialog grammar**:
group boxes, the `100px 1fr` field grid, `var(--s)` inputs.

That is not a reversal of the properties sheet's styling — it is the line
between two species:

```
PROPERTY SHEET   tables and a rate build-up. wide. caps section labels
                 over white sunken boxes, the Equipment window's grammar.
SHORT FORM       fields. 600 px. group boxes and the field grid.
```

`New Project`, `New Option`, the four record dialogs and this one are all the
second kind. The equipment properties sheet is the first.

### Group box · "When"

```
Date        [ 02 Aug 2026 ]   ★
Odometer    [ 38,940 ] mi        3,830 mi since the last entry
Kind        [ service                              ▼ ]   ★
            counts toward the rate's MAINTENANCE line
```

`Kind` is `service · repair · tyres · inspection`, and **the line beneath it
changes with the selection** — that is the double-charge guard moved to the
moment of entry:

```
service · repair     counts toward the rate's MAINTENANCE line
tyres                counts toward the rate's TYRES line — not maintenance,
                     or it would be charged twice
inspection           recorded only · no rate line
```

**This replaces the `In rate` column as a decision.** The column on the sheet
still *reports* it; nothing chooses it twice.

`3,830 mi since the last entry` is derived and grey — it is the sheet's
`Interval` column, computed as you type the odometer, so a typo is visible
immediately.

### Group box · "Work"

```
Work        [ Oil, filters, rotate tyres ]   ★
Notes       [                             ]   36 px
```

### Group box · "Cost"

```
Vendor      [ Gilbert Fleet Service                ▼ ]
Invoice     [ GFS-40118 ]
Cost        [ $184.00 ]
Days down   [ 1 ]        ☐ unplanned
Attachment  [ GFS-40118.pdf ]   [ Browse… ]
```

`Vendor` is the `suppliers` list — the same one rentals use. A fleet shop and a
rental company are both people you pay, and two lists of vendors is how they
start disagreeing.

`☐ unplanned` separates *"in for its service"* from *"broke down"*. The sheet's
`Current state` table counts the unplanned ones.

### Tip block · `#ffffe1` — on the ADD state only

```
Days down are recorded, not priced.

The rate divides annual cost by annual MILES, so a week off the road
neither raises nor lowers $/mi. This number is here to tell you which
truck keeps stopping, not to feed a calculation.
```

**An honest gap, stated where it would otherwise mislead.** A reader seeing
`Days down` in a costing application will assume it reaches a rate. It does
not.

### Render 3 — two panels

Two 600 px dialogs side by side on a `rgba(0,0,0,.42)` scrim, 18 px apart,
top-aligned. Captions in `#fff` bold 11 px:

```
ADD — blank, from ＋ Add an entry
EDIT — the same dialog, double-clicked from the log
```

Left: `Add log entry — Ford F-450`, empty fields with `#a0a0a0` placeholders,
`Kind` unset, buttons `Add` 110 px (default) · `Cancel` 78 px.
Right: `Log entry — 02 Aug 2026`, filled as above, buttons `OK` 110 px
(default) · `Cancel` 78 px · **no `Apply`** — this dialog commits once.

Nothing after `</x-dc>`. One well-formed document.

---

## POPUP · Rental offering properties — specified, not rendered

```
Supplier    [ United Rentals                          ▼ ]   ★
Type        [ 64' boom lift                           ▼ ]   ★
Rate        [ $485.00 ] per [ day ▼ ]
Minimum     [ 1 ] days
Fees        Delivery   [ $150.00 ]  flat                       ✕
            Pickup     [ $150.00 ]  flat                       ✕
            ＋ Add a fee
```

`per` lists `hour · day · week · month` — **never `mile`**. Fee rows stack with
`＋` / `✕`, exactly like New Project's contacts rows.

---

## Failure modes — do not reproduce

- **Calling it Vehicles.** A lift is not a vehicle.
- **A tree.** Facets, two groups at once, one flat list.
- **Owned and rented in one list.** They are tabs, and each tab's column
  header is a promise about what the columns are.
- **The reference's navy selection.** `▶` and bold on a facet, `▶` on a row.
- **A screen strip.** The detail pane replaces it.
- **A spine on the owned list.** It is flat; a spine marks a group.
- **No spine on the selected row.** The list is grouped; it gets one.
- **One global fuel price.** Diesel and gasoline do not move together.
- **A fuel update with no preview**, or one that lists the trailer as
  changing. It has no engine.
- **Tyres counted as maintenance.** The rate has a tyres line already; it
  would be charged twice.
- **The maintenance log writing into the rate.** It suggests. You press it.
- **New Project's group boxes or field grid on this sheet.** It wears the
  window's grammar: caps section labels over white sunken boxes.
- **`#c0c0c0` chips for read-only values here.** Plain text, like the pane.
- **Three panels in one row.** Two rows; nothing wider than 1,180 px.
- **A separate read-only log viewer.** The edit dialog is the detail view.
- **An `In rate` choice on the log entry dialog.** It follows `Kind`.
- **`Days down` feeding a rate.** It is recorded, not priced.
- **A second vendor list.** Fleet shops live in `suppliers` with the rental
  companies.
- **Win2000's navy tree selection bar.** `▶` and bold, no fill.
- **A serial column on rentals.** You rent a class, not a unit.
- **Capacity or deck on a non-vehicle.** Blank, not zero.
- **`mile` as a rental basis.**
- **A typed rate presented as computed.** The strip says `typed`.
- **Category editable on a unit.** It comes from the type.
- **Real-looking VINs.** They end in `0000N`.
- **A typed field for a spec nothing reads.** Tow rating, GVWR, odometer and
  registration are list rows until the engine reads them.
- **One spec list.** Two boxes — type-level and unit-level — because editing
  `Year` changes every F-450 and editing `Licence plate` does not.
- **A new tab strip.** Take the cost breakdown's verbatim.
- **Shading the selected row.** `▶` and the spine.
