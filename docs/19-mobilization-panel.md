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
equipment   an OWNED machine you are hauling. rented equipment never
            appears: the supplier delivers it, which is what its delivery
            and pickup fees are.
```

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
Truck bed payload            F-450                    [?] lb
Trailer capacity             20 ft flatbed            [?] lb
  capped by tow rating       tow [?] − tare [?]    usable [?] lb
──────────────────────────────────────────────────────────────
Combined capacity                                     [?] lb
```

The middle line only appears **when the cap actually bites** — when the truck
cannot pull the trailer fully loaded. If it can, the trailer's own capacity
stands and the line is absent rather than showing a no-op.

---

## Box 3 · TRIPS

```
Computed      ceil( 4,260 + [?]  ÷  [?] )  =  [?]
Used          [ 2 ] ✎ overtyped

⚠ Longest item 22.0 ft exceeds the 20.0 ft deck.
```

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

## Numbers this panel cannot be rendered without

```
F-450          bed payload lb · tow capacity lb
20 ft flatbed  capacity lb · tare weight lb
Bobcat T66     operating weight lb · length × width × height
crew           who goes, and their rates
```

**Render it with `[?]` in those cells rather than plausible figures.** A panel
whose whole argument is *"a missing number must be visible"* cannot be
illustrated with invented ones.

---

## Failure modes — do not reproduce

- **A total that silently omits a missing weight.** `4,260 lb + [?]`.
- **Rented equipment in the load.** The supplier delivers it.
- **One alarm for weight and dimensions.** They fail differently and only one
  of them is fixed by another trip.
- **A non-overtypeable trip count.**
- **The tow-cap line when the cap does not bite.**
- **Invented weights.** `[?]` until Damian supplies them.
