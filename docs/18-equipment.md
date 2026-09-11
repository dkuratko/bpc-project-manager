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

**Render 2 · the properties sheet**, once the window is approved. Two 600 px
dialogs side by side, the same sheet on its `General` and `Specifications`
tabs.

Each is its own file. One well-formed document, nothing after `</x-dc>`.

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
             ‖ Properties · Deactivate
filter band  Find [                    ]   ☐ Show inactive
status bar   left:  equipment on a version cannot be deleted
             right: 4 owned · 2 suppliers · 4 offerings · rates: computed
```

`Find` searches both panes — a match in the list expands its path in the tree.

`rates: computed` is `app_settings.vehicle.rate_method`, read-only.

---

## TAB · Owned  ★ rendered

### Facets — 214 px

```
[ Search equipment…                    ]

▾ By category
    Trucks                            2
    Trailers                          1
    Lifts                             1
▾ By status
    Active                            4
    Inactive                          0
▾ Maintenance
    Rate over 12 months old           1     ← #a00
    Registration expiring < 60 days   1     ← #a00
    Unused 12 months                  0
```

Counts in `#808080`, **red `#a00` when the count is a problem** and grey when
it is zero. Selected facet: **`▶` and a bold label, no fill** — the reference's
navy bar is not used.

Render with **`By category ▸ Trucks`** selected.

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

## POPUP · Equipment properties  — render 2

**A Win2000 tabbed property sheet.** 600 px, three tabs, `OK` / `Cancel`.

Take the tab strip **verbatim** from the cost breakdown's four tabs —
`docs/design/cost-breakdown-01-scope.v4.dc.html`. Do not re-invent it.

```
General   │  Specifications  │  Rate
```

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

### Tab 1 · General — render 2

```
┌ Identify it ─────────────────────────────────────────────┐
  Type        [ Ford F-450                         ▼ ]  ★
  Category    [ Trucks ]  read-only chip — from the type
  Label       [ Truck 2 ]                optional nickname
  VIN         [ 1FDUF4HT5NEC00001 ]  ★
  In service  [ 14 Mar 2024 ]        ·  Status  Active
  Registration expires  [ 31 Jan 2027 ]
             counted by the Maintenance facet — that is why it is a
             field and not a spec row

┌ Fit — the only specs the engine reads ───────────────────┐
  Capacity    [ 4,800 ] lb
  Deck        [ 9.0 ] × [ 7.0 ] ft

  Mobilization checks weight, length and width independently:
  a 22 ft post bundle needs a long deck whatever it weighs.
  Blank on anything that is not a vehicle.
```

`Category` is a chip because it belongs to the **type** — two F-450s cannot sit
in two different categories.

The `Fit` box carries a grey note: **these three belong to the type**, so
editing them changes every unit of it.

### Tab 2 · Specifications — render 2

**Two boxes, because scope matters.** Editing `Year` changes it for every
F-450; editing `Licence plate` does not.

```
┌ All Ford F-450s ─────────────────────────────────────────┐
  NAME                  VALUE                    UNIT
  Make                  Ford                                  ✕
  Model                 F-450 Super Duty                      ✕
  Year                  2022                                  ✕
  Fuel                  Diesel                                ✕
  Tow rating            16,000                   lb           ✕
  GVWR                  14,000                   lb           ✕
  Bed length            8.0                      ft           ✕
  ＋ Add a specification

┌ This unit only ──────────────────────────────────────────┐
  Licence plate         AZ CG-84102                           ✕
  Odometer              41,280                   mi           ✕
  Registration expires  31 Jan 2027                           ✕
  ＋ Add a specification
```

Columns `minmax(0,1fr) 150px 60px 19px`. `NAME` and `VALUE` are plain white
fields, `UNIT` is a short one, `✕` removes the row — the same row controls as
New Project's contacts list. **Copy those verbatim.**

`Odometer` and `Registration expires` are list rows and not fields for the same
reason as tow rating: **nothing reads them yet.** The day something alerts on
an expiring registration, it earns a typed column and a date picker.

### Tab 3 · Rate — not rendered

The per-mile build-up, unchanged:

```
Fuel          [ $3.85 ] /gal  ÷  [ 12 ] mpg ................  $0.3208
Maintenance   [ $2,520 ] /yr  ÷  [ 18,000 ] mi/yr ..........  $0.1400
Tyres         [ $1,600 ] /set ÷  [ 50,000 ] mi .............  $0.0320
Depreciation  ([ $78,000 ] − [ $20,000 ]) ÷ [ 250,000 ] mi .  $0.2320
Fixed         ([ $2,600 ] + [ $650 ]) ÷ [ 18,000 ] mi/yr ...  $0.1806
              ─────────────────────────────────────────────────────────
              Computed rate                                   $0.9054 /mi
              last computed 08 Sep 2026            [ Recompute ]
```

Shown in the list as `$0.91 /mi`. For a non-vehicle the tab holds a single
typed rate and its basis instead.

### Render 2 — two panels

Two 600 px dialogs side by side on a `rgba(0,0,0,.42)` scrim, **the same
dialog on two different tabs**, 18 px apart, top-aligned. Captions in `#fff`
bold 11 px:

```
GENERAL — identity, and the three specs the engine reads
SPECIFICATIONS — everything else, a list not columns
```

Title bar on both: `Equipment properties — Ford F-450`.
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
- **An expand column.** The facets do that job.
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
