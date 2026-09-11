# Design brief — EQUIPMENT
**MAIN** window, MDI child. Opened by `Equipment` on the Project Browser toolbar
— **renamed from `Vehicles`**, because a boom lift is not a vehicle.
Follows `docs/14-list-window-template.md`. **Two tabs: `Owned` and `Rented`.**

⚠ **A style reference for this screen is outstanding** — an older catalog
render Damian wants it to follow. Do not render until it arrives; it may
replace the navigation described below.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/contacts.v2.dc.html` for the list pane,
`docs/design/project-browser.v14.dc.html` for cursor and type.

---

## ⛔ SCOPE

One window on the teal desk. **Two panes inside it** — a tree on the left, a
list on the right, split by a draggable bar. No dialogs, no menu rendered.
One well-formed document, nothing after `</x-dc>`.
Window **1000 × 640**.

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

## OWNED and RENTED are TABS  ★ pending a style reference

The window carries two tabs, and **that is a structural decision, not a
cosmetic one**:

```
┌ Owned ┐ Rented ─────────────────────────────────────────────┐
```

It removes the top level of the hierarchy and takes a whole problem with it:

```
BEFORE   tree: Owned → category → unit
               Rentals → supplier → category → offering
         one list whose COLUMNS SILENTLY CHANGE as you click around

AFTER    tab Owned    category → unit              2 levels
         tab Rented   supplier → category → offering   3 levels
         each tab has ONE column set, fixed, visible in its header
```

**The columns were the real problem.** An owned unit has a VIN, capacity, deck
and a computed `$/mi`; a rental has a rate, a minimum and delivery fees. With
one list those headers had to change under you depending on what the tree
selection happened to be — which is exactly the kind of thing that makes a
screen feel unpredictable. A tab is a promise about what the columns are.

### What each tab needs

```
OWNED    two levels — a plain GROUPED LIST. category bands, units beneath.
         no tree at all. this is Contacts' grammar, unchanged.

RENTED   three levels — TREE + LIST. suppliers in the tree, their offerings
         in the list, grouped by category.
```

So the tree survives on one tab only. `docs/14`'s tree + list variant still
earns its place — the Catalog Browser will need it — but the owned side gets
simpler than the previous draft had it.

### Still needed: the style reference

Damian has an older reference render for the **catalog** that he wants this to
follow. **It has not arrived yet** — ask before rendering. The tab structure
above is settled; the navigation idiom inside each tab is not, and the
reference may well replace the tree.

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

## LEFT PANE · the tree — 230 px

```
⊟ Owned
    Trucks (2)
    Trailers (1)
    Lifts (1)
⊟ Rentals
  ⊟ United Rentals
      Lifts (2)
      Trailers (1)
  ⊞ Sunstate Equipment
```

- Sunken white panel, `var(--s)` bevel, full height of the body.
- **Win2000 tree control:** `⊞` / `⊟` boxes — 9 px, 1 px `#808080` border,
  white ground, a black `+` or `−` — joined by **1 px dotted `#808080`
  connector lines.** No folder icons.
- Categories carry their count in `#808080`. Suppliers do not — a supplier
  with nothing under it is still a supplier.
- `Sunstate Equipment` renders **collapsed** to prove the control.

### Selection in the tree

**`▶` before the selected node's label, bold label. No fill.**

This is the one place the settled cursor rule — *arrow and spine, no shading* —
has to adapt: a spine marks a group of rows, and a tree node is not a group of
rows. The arrow survives, the spine does not. **Win2000's navy selection bar is
not used**; it was tried and rejected for the list cursor, and the tree follows
the list.

**Render with `Owned` selected** — the top node.

---

## RIGHT PANE · the list — its columns follow the tree

The divider between panes is a 4 px `#c0c0c0` bar with a raised bevel —
Win2000's splitter.

### When an OWNED node is selected — the render shows this

Selecting `Owned` itself shows **every owned unit, grouped by category**, using
Contacts' grouped-list grammar exactly. Selecting one category shows just its
units, ungrouped.

```
gutter ±   NAME                     VIN / SERIAL         CAPACITY  DECK L × W     RATE
 14px 20px ───────────────────────  ───────────────────  ────────  ─────────────  ──────────
           minmax(0,1fr)            150px                76px, R   96px           86px, R

−  Trucks
 ▶   Ford F-450                     1FDUF4HT5NEC00001    4,800 lb   9.0 × 7.0 ft    $0.91 /mi   ◄
     Ford F-350 — ¾ ton             1FT8W3BT2MEC00002    3,200 lb   8.0 × 6.5 ft    $0.79 /mi
−  Trailers
     20 ft equipment trailer        5JW1C2027M1000003    7,000 lb  20.0 × 8.5 ft    $0.31 /mi   ◄
−  Lifts
     Genie S-45 boom lift           S45-0000-0004                                 $210.00 /day
```

**The cursor is on the Ford F-450** — `▶` and a 3 px spine down the whole
Trucks group, band row included. No shading.

- **`VIN / SERIAL`** in `'Lucida Console'` monospace. A road vehicle has a VIN,
  a lift has a serial; one column, because both answer *"which one is it"*.
- **The lift has no capacity or deck.** Those exist to choose the trailer for
  mobilization. They are blank, not zero.
- **The lift's rate is per day, not per mile.** A lift does not accrue cost by
  driving. See *rates* below.
- `◄` marks the default unit for its type, `#404040`, not a chip.

All VINs and serials here are **invented** — they end in `0000N` so nobody
mistakes them for real vehicles.

### When a RENTAL node is selected — specified, not rendered

Selecting a supplier shows its offerings grouped by category; selecting one of
its categories shows just those.

```
NAME                  RATE            MINIMUM    FEES
64' boom lift         $485.00 /day    1 day      Delivery $150.00 · Pickup $150.00
45' boom lift         $365.00 /day    1 day      Delivery $150.00 · Pickup $150.00
```

**No serial column.** You rent *a* 64' boom, not a specific one — that is the
entire difference between owned and rented, and the missing column says it.

`FEES` comes from `fees` rows owned by the sourcing method, which the schema
already supports (`owner_type = 'equipment_sourcing_method'`). Delivery and
pickup on a boom lift are real money and routinely forgotten, so they are on
the row rather than behind a popup.

Selecting `Rentals` itself shows the **suppliers** as rows — name, phone,
number of offerings.

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

## Screen strip — the selected row's detail

```
owned, per-mile   Rate  computed 08 Sep 2026 · fuel $0.3208 · maint $0.1400
                        · tyres $0.0320 · dep $0.2320 · fixed $0.1806
owned, per-day    Rate  typed · $210.00/day · Genie S-45
rental            Terms  United Rentals · 1 day minimum · delivery + pickup $300.00
```

The render shows the F-450's line.
`0.3208 + 0.1400 + 0.0320 + 0.2320 + 0.1806 = 0.9054`, shown as `$0.91 /mi`.
**Four decimals in the strip, two in the column** — the components are
fractions of a cent and stop visibly summing at two.

Never collapses. Empty reads `—`.

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

## POPUP · Equipment properties  ★ RENDER THIS

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

### Tab 1 · General — rendered

```
┌ Identify it ─────────────────────────────────────────────┐
  Type        [ Ford F-450                         ▼ ]  ★
  Category    [ Trucks ]  read-only chip — from the type
  Label       [ Truck 2 ]                optional nickname
  VIN         [ 1FDUF4HT5NEC00001 ]  ★
  In service  [ 14 Mar 2024 ]        ·  Status  Active

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

### Tab 2 · Specifications — rendered

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

### Tab 3 · Rate — specified, not rendered

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

### Render — two panels

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
- **One deep indented list.**
- **Owned and rented in one list.** They are tabs, and each tab's column
  header is a promise about what the columns are.
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
