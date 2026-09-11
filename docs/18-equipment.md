# Design brief — EQUIPMENT
**MAIN** window, MDI child. Opened by `Equipment` on the Project Browser toolbar
— **renamed from `Vehicles`**, because a boom lift is not a vehicle.
Follows `docs/14-list-window-template.md`, **TREE + LIST variant**.
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

## Why a tree and a list, not one indented list

Your hierarchy is:

```
OWNED   → category → unit                          3 levels
RENTED  → supplier → category → offering           4 levels
```

Three reasons that forces the Windows Explorer layout — tree left, list right:

1. **Depth.** The Project Browser and Contacts handle two levels, parent and
   child. Four levels of indented rows in one list is unreadable, and every
   level adds another `±` column.
2. **Owned and rented need different columns.** An owned unit has a VIN,
   capacity, deck and a computed `$/mi`. A rental has a rate, a minimum and
   delivery fees. One list would need every column for both, half of them
   empty on every row. Two panes let the **list's columns follow the tree's
   selection.**
3. **The Catalog Browser will need exactly this.** Categories of components
   are deep too. Equipment is the smaller, simpler place to settle the pattern
   first.

This is added to `docs/14` as the **tree + list variant** of the list window.

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

## POPUP · Owned unit properties — specified, not rendered

600 px, New Project's dialog grammar.

```
Type        [ Ford F-450                              ▼ ]   ★
Category    [ Trucks ]  read-only chip — from the type
Label       [ Truck 2 ]                optional nickname
VIN/Serial  [ 1FDUF4HT5NEC00001 ]   ★
```

`Category` is a chip because it belongs to the **type**, not the unit — two
F-450s cannot be in two different categories.

Then the per-mile build-up from the previous brief, unchanged, when the type is
a vehicle; a single typed rate with its basis when it is not.

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
- **One deep indented list.** Tree left, list right.
- **Win2000's navy tree selection bar.** `▶` and bold, no fill.
- **A serial column on rentals.** You rent a class, not a unit.
- **Capacity or deck on a non-vehicle.** Blank, not zero.
- **`mile` as a rental basis.**
- **A typed rate presented as computed.** The strip says `typed`.
- **Category editable on a unit.** It comes from the type.
- **Real-looking VINs.** They end in `0000N`.
- **Shading the selected row.** `▶` and the spine.
