# Design brief — MOBILIZATION PANEL
**POPUP**, 720 px. Opened by `Mobilization…` on the cost breakdown's
**Purchasing** tab, where every other sourcing decision already lives.
Follows the Equipment window's grammar — caps section labels over white sunken
boxes, bevelled table headers.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

---

## Why it exists

`docs/06` designed the mobilization cost model and **gave it no screen.** The
formula is real, the trips number reaches the estimate, and until now there was
nowhere to see *why* it says 2 instead of 1.

Trips come from weight and dimensions:

```
TRIPS = ceil( total haul weight ÷ combined capacity )
```

So the panel's first job is to show **what is on the truck** — every component,
every owned machine, what each weighs, how long it is — and its second is to
show the capacity it is measured against.

---

## ⛔ SCOPE

One popup, 720 px, alone on a `rgba(0,0,0,.42)` scrim.
One well-formed document, nothing after `</x-dc>`.

---

## Box 1 · LOAD — what the user actually asked to see

```
FROM        ITEM                          QTY   EACH      TOTAL      LONGEST  WIDEST  HAULED
component   Steel post 6" × 22 ft           8   310 lb   2,480 lb    22.0 ft  0.5 ft    ✓
component   Roof panel                     12    95 lb   1,140 lb    10.0 ft  3.0 ft    ✓
component   Hardware and footing cages      1   640 lb     640 lb        —       —      ✓
equipment   Bobcat T66 skid steer           1     [?]        [?]        [?]     [?]     ✓
──────────────────────────────────────────────────────────────────────────────
                                                        4,260 lb +[?]  22.0 ft  3.0 ft

⚠ Bobcat T66 has no shipping weight. The trip count is a guess until it does.
```

`2,480 + 1,140 + 640 = 4,260 lb`, and the total is written **`4,260 lb + [?]`**
rather than `4,260 lb`.

### A missing weight must alarm, never quietly shrink the total

This is `NOTHING SILENTLY ASSUMED` at its most literal. A component with no
`ship_weight_lb` contributes nothing to a sum, so the load looks lighter, so
the trip count comes out lower, so the estimate is short a trip — **and every
number on screen still reconciles.** The `[?]` and the red line are the only
thing standing between that and a wrong bid.

Same rule as the cost zone: show what is known, alarm what is missing, never
invent.

### `FROM` says where each row came from

```
component   from the version's scope — ship_weight_lb × qty
equipment   an OWNED machine you are hauling
rental      a COLLECTED rental. a delivered one never appears — the
            supplier brings it, which is what its delivery and pickup
            fees are.
```

**`rental` rows are the ones people forget.** A compactor you fetch from
Sunstate is 220 lb on your trailer and a stop on your route, and it looks
exactly like something the supplier handles until you check the `MOVE` on its
offering.

### `HAULED` — because not everything rides your rig

```
✓   it ships to your lot, and you take it out
✗   it ships DIRECT TO SITE — the manufacturer's truck delivers it
```

Damian is a subcontracted installer and **usually does not furnish the
equipment.** A playground that ships direct to the site never touches his
flatbed, and counting it would invent trips he does not make.

Defaults to `✓`; `shipments.destination` already carries `lot` / `site`, and at
quoting time this is the estimator's assumption, overtypeable per row.

---

## Box 2 · CAPACITY

```
Truck bed payload            2012 Ford F-450         4,800 lb
Trailer capacity             20 ft flatbed          10,600 lb
──────────────────────────────────────────────────────────────
Combined capacity                                   15,400 lb
```

The middle line only appears **when the cap actually bites** — when the truck
cannot pull the trailer fully loaded. If it can, the trailer's own capacity
stands and the line is absent rather than showing a no-op.

---

## Box 3 · TRIPS

```
Computed      ceil( 12,880 ÷ 15,400 )  =  1      from known weights only
Used          [ 2 ] ✎ overtyped

⚠ Longest item 22.0 ft exceeds the 20.0 ft deck.
```

`from known weights only` sits beside the computed figure in `#a00` **whenever
any row is missing a weight.** A trip count that looks confident while one
contributor is unaccounted for is the failure this panel exists to prevent —
but refusing to show a number at all would be worse, so it shows the number and
says what it does not know.

**Trips stay overtypeable** — `docs/06` settled that, because trips also depend
on customer demand and site access, not just arithmetic. The panel shows the
computed figure beside the used one so an override is visible rather than
silent.

### The dimension alarm is separate from the weight one

A 22 ft post bundle on a 20 ft deck **is not a weight problem and no number of
trips fixes it.** It needs a longer trailer, a different bundle, or a delivery
direct to site. Splitting the load across two trips changes nothing.

`docs/06` uses this exact example to argue dimensions are checked independently
of weight. This is where that check becomes visible.

---

## Box 4 · COST — the formula, made visible

```
Labour      2 trips × (2 × 0.40 hr drive + 0.00 load) × $[?] crew    $[?]
Vehicles    2 trips × 2 × 18.0 mi × $[?] /mi                          $[?]
Rentals     —                                                            —
Per diem    0 nights                                                     —
────────────────────────────────────────────────────────────────────
Mobilization                                                          $[?]
```

Each line names its own arithmetic, the same way the rate build-up does —
nobody should have to trust a total they cannot see.

`load_hr_per_trip` shows `0.00` by default and says so: the two real charged
figures Damian had already priced sat at or below the zero-load column, which
is what proved load time is already inside the install durations.

---

## The figures — sample, and consistent

Use the sample fleet from `docs/18`.

```
LOAD       2,480 + 1,140 + 640 + 8,400 + 220  =  12,880 lb   + one unknown
CAPACITY   bed 4,800  +  trailer 10,600       =  15,400 lb
           the tow cap does NOT bite here: 3,400 tare + 10,600 = 14,000
           ≤ 16,000, so the `capped by tow rating` line is ABSENT —
           the correct rendering of a well-matched rig
TRIPS      ceil(12,880 ÷ 15,400) = 1   ·   used [ 2 ] ✎ overtyped
```

**Exactly one cell is blank**, and it is the alarm being demonstrated rather
than missing data. Sample data is fine everywhere in this project; a **total
that silently omits a contributor** is the bug this panel exists to prevent,
and a render has to show it happening.

---

## Failure modes — do not reproduce

- **A total that silently omits a missing weight.** `4,260 lb + [?]`.
- **Rented equipment in the load.** The supplier delivers it.
- **One alarm for weight and dimensions.** They fail differently and only one
  of them is fixed by another trip.
- **A non-overtypeable trip count.**
- **The tow-cap line when the cap does not bite.**
- **Filling in the shade fabric's weight.** It is blank on purpose, to show
  the alarm. Every other cell carries a figure.
- **Omitting the `rental` row**, or showing a delivered rental in the load.
- **A trip count with no `from known weights only` caveat** while a row is
  missing a weight.
