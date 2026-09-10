# Design brief — VEHICLES
**MAIN** window, MDI child. Opened by `Vehicles` on the Project Browser toolbar.
Follows `docs/14-list-window-template.md`.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/contacts.v2.dc.html` and
`docs/design/project-browser.v14.dc.html`. This is the same grouped list with
different columns. **Do not re-decide the cursor, the banding or the type.**

---

## ⛔ SCOPE

One window on the teal desk. No dialogs open, no menu rendered.
One well-formed document, nothing after `</x-dc>`.
Window **1000 × 560**.

The two popups are **specified below but not rendered** — they follow New
Project's dialog grammar and can have their own pass.

---

## The idea

`docs/06-mobilization.md` decided that **a truck and a trailer are ordinary
equipment.** They are not a new entity, they are `equipment` rows with
`is_vehicle = 1` and three extra columns, sourced exactly the way every other
piece of equipment is sourced: owned, or rented from someone.

That gives the screen its shape without inventing anything:

```
VEHICLE            an equipment row. capacity and deck dimensions.
  SOURCING METHOD  owned, or rented from a named supplier. carries the rate.
  SOURCING METHOD  a vehicle can have several — you own a trailer AND
                   sometimes rent one when both jobs land in a week.
```

**Parent and child again**, so it reuses the Project Browser's grouped-list
grammar unchanged. **No counters** — counting vehicles by kind is not a to-do
list. `docs/14`'s rule, applied.

---

## Chrome

```
title bar    Vehicles
menu         File  Edit  View  Vehicle  Window  Help
toolbar      New vehicle · New method ‖ Properties · Deactivate
filter band  Find [                    ]   Show [ All        ▼ ]
             ☐ Show inactive
status bar   left:  a vehicle in use on a version cannot be deleted
             right: 2 vehicles · 4 methods · rates: computed
```

`Show` filters `All · Owned · Rented`.

**`rates: computed`** in the status bar is `app_settings.vehicle.rate_method`,
read-only. Tier 2 — a vehicle tracker deriving `$/mile` from real odometer and
fuel logs — is deferred, and the status bar is where you can see which tier you
are on without opening anything.

---

## Columns

```
gutter  ±   NAME                          CAPACITY   DECK L × W      BASIS   RATE       TERMS
 14px  20px ──────────────────────────    ────────   ───────────     ─────   ────────   ──────────
            minmax(0,1fr)                 80px, R    100px           48px    90px, R    150px
```

- **Vehicle row** — `NAME` bold. `CAPACITY` and `DECK` are its own facts and
  belong only here. `BASIS`, `RATE` and `TERMS` are blank: a vehicle has no
  rate, it is *sourced*.
- **Method row** — indented. `NAME` is the method (`Owned`, a supplier).
  `CAPACITY` and `DECK` blank. `BASIS`, `RATE`, `TERMS` are its own.

**This split is the schema showing through, and it is worth preserving.**
`equipment` has no rate column at all — that was decided when the catalog was
designed, and putting a rate on a vehicle row here would quietly undo it.

`CAPACITY` right-aligned with a thousands separator and no `$`. `DECK` reads
`20.0 × 8.5 ft`. `RATE` right-aligned, `$` and two decimals, with its unit
after: `$0.79 /mi`, `$145.00 /day`.

---

## Render exactly this

```
−  Ford F-350 — ¾ ton                     3,200 lb   8.0 × 6.5 ft
     Owned                                                        mile   $0.79 /mi    ◄ default
     Sunstate Equipment                                           day  $145.00 /day
−  20 ft equipment trailer                7,000 lb  20.0 × 8.5 ft
   ▶ Owned                                                        mile   $0.31 /mi    ◄ default
     United Rentals                                               day   $85.00 /day   3-day minimum
```

**The cursor is on the trailer's `Owned` row** — `▶` in the gutter and a 3 px
black spine down the whole trailer group, parent row included, because the
spine marks the group. **No shading.**

`◄ default` marks `is_default` — the method used unless a version overrides it.
Grey `#404040`, not a chip.

Both groups expanded, `−` in the expand column on both.

---

## Screen strip — where the rate came from

One sunken line above the status bar. **Its content depends on what is
selected**, and this is the strip earning its place:

```
owned, per-mile     Rate  computed 08 Sep 2026 · fuel $0.2750 · maint $0.1200
                          · tyres $0.0280 · dep $0.2000 · fixed $0.1667
rented              Terms  3-day minimum · $85.00/day · United Rentals
vehicle row         Fit    3,200 lb · 8.0 × 6.5 ft deck
```

**Four decimals in the build-up, two in the column.** The components are
fractions of a cent and rounding them to hundredths would make them look like
they do not sum. `0.2750 + 0.1200 + 0.0280 + 0.2000 + 0.1667 = 0.7897`, shown
in the column as `$0.79 /mi`. That is the presentation rounding rule doing its
job, and the strip is where you can see it has not lost anything.

Empty selection reads `—`. **The strip never collapses.**

---

## POPUP · Vehicle properties — specified, not rendered

600 px, New Project's dialog grammar.

```
Name        [ Ford F-350 — ¾ ton ]   ★
Capacity    [ 3,200 ] lb
Deck        [ 8.0 ] × [ 6.5 ] ft
☑ This is a vehicle
```

**`☑ This is a vehicle`** is `equipment.is_vehicle`. Unticked, the three fields
above it grey out — this is the one place in the app where greying is right,
because they are genuinely inapplicable rather than merely unselected.

Capacity and deck exist to **choose the trailer**, not to price anything. A
22 ft post bundle needs a long deck whatever it weighs, so `docs/06` checks
weight, length and width independently.

---

## POPUP · Sourcing method properties — specified, not rendered  ★

The interesting one: it is where `$/mile` is built.

```
Vehicle     [ Ford F-350 — ¾ ton ]  read-only chip
Method      [ Owned ]   ★
Kind        ◉ Owned    ○ Rented
```

### When `Owned` — the rate build-up

**The rate is computed, not typed.** Every input is a number you can look up,
and the result is auditable a year later:

```
Fuel          [ $3.85 ] /gal  ÷  [ 14 ] mpg ................  $0.2750
Maintenance   [ $2,160 ] /yr  ÷  [ 18,000 ] mi/yr ..........  $0.1200
Tyres         [ $1,400 ] /set ÷  [ 50,000 ] mi .............  $0.0280
Depreciation  ([ $68,000 ] − [ $18,000 ]) ÷ [ 250,000 ] mi .  $0.2000
Fixed         ([ $2,400 ] + [ $600 ]) ÷ [ 18,000 ] mi/yr ...  $0.1667
              ─────────────────────────────────────────────────────────
              Computed rate                                   $0.7897 /mi
              last computed 08 Sep 2026            [ Recompute ]
```

`Fixed` is insurance plus registration. Each row shows its own arithmetic
inline, so nobody has to trust a total they cannot see.

**`[ Recompute ]` stamps `computed_at`.** The rate does not silently drift when
fuel changes — you change the input and press it, and the date says when the
number last reflected reality. A stale date is information.

### When `Rented`

```
Supplier    [ United Rentals ]
Rate        [ $85.00 ] per [ day ▼ ]
Minimum     [ 3 ] days
```

`per` lists `hour · day · week · month`. **Never `mile`** — that basis exists
because an owned vehicle's cost scales with distance; a rental is billed by
time whatever you do with it.

### Both

```
☑ Default for this vehicle
```

---

## Failure modes — do not reproduce

- **A rate on a vehicle row.** `equipment` has no rate column. Vehicles are
  sourced, methods are rated.
- **Counters.** Not a to-do list.
- **`mile` offered as a rental basis.** Rentals are billed by time.
- **A typed `$/mile`.** It is computed from inputs and stamped with a date.
- **Two decimals in the build-up.** Four, or the components stop summing.
- **`$` on capacity, or a missing thousands separator.** `3,200 lb`.
- **Shading the selected row.** `▶` and the spine.
- **8 px gutter.** 14 px, or the spine has nowhere to sit.
- **A "collapsed — N methods" placeholder row.** The `+` says it.
