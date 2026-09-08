# MOBILIZATION — cost model
Decided 2026-09-08. No formula existed; this designs one.

---

## What it is

A **standalone service, unit = trip**. Nothing about it is a special case —
conditions, markup and allocation to cost objects all work on it unchanged.

A truck and a trailer are **ordinary equipment**. Owned or rented is already how
equipment sourcing works, so no new entity was needed. The only extension is a
`mile` rate basis, because an owned vehicle's cost is fuel, tyres, maintenance
and depreciation — all of which scale with distance, not time.

---

## The formula

```
MOBILIZATION =

    trips × (2 × drive_time_hr + load_hr) × Σ(crew count × role rate)
                                                            ← labour, per trip

  + trips × 2 × distance_mi × Σ(owned vehicle $/mile)
                                                            ← owned vehicles

  + Σ( rented vehicle: days × $/day + fees )
                                    ← rentals are per JOB, not per trip. a
                                      trailer rented for three days covers
                                      every trip inside those three days.

  + nights × crew × per_diem   +   nights × rooms × room_rate
                                                            ← only when staying
```

Distance and drive time are **both typed on the project, one way**. Neither is
derived from the other, so there is no average-speed assumption to argue with —
you know both numbers.

## Choosing the trailer

Weight does not enter the cost directly. **It picks the vehicle**, and so do
dimensions — a 22 ft post bundle needs a long deck whatever it weighs.

```
EQUIPMENT (vehicles only)   capacity_lb · deck_length_ft · deck_width_ft

COMPONENT                   ship_weight_lb · ship_length_ft
                            ship_width_ft · ship_height_ft

VERSION totals              weight = Σ(ship_weight × qty)
                            longest = MAX(ship_length) across scope
                            widest  = MAX(ship_width)

FITS IF   weight ≤ capacity   AND   longest ≤ deck length   AND   widest ≤ deck width

TRIPS     computed = max(1, ceil(weight ÷ capacity))
          ★ always overtypeable — trips also depend on customer demand and
            on what will physically nest on a deck, which no formula knows.
```

Length is usually the binding constraint, not weight.
`installation_methods.post_length_ft` is already in the catalog, so the app can
pre-fill *longest piece* from the tallest post in scope.

---

## Worked against two real jobs

Rates below are placeholders — truck `$0.95/mi`, trailer `$0.45/mi`,
crew 3 × Installer at `$68.00/hr`.

```
MESA — 20 mi, 0.4 hr each way, 1 trip
                                   load 0.0 hr      load 1.0 hr
   labour   (0.8 + load) × $204      $163.20          $367.20
   vehicle   2 × 20 × $1.40           $56.00           $56.00
                                    ─────────        ─────────
                                     $219.20          $423.20     charged $450

TUCSON — 115 mi, 2.0 hr each way, 2 trips
   labour   2 × (4.0 + load) × $204 $1,632.00        $2,040.00
   vehicle  2 × 2 × 115 × $1.40       $644.00          $644.00
                                    ─────────        ─────────
                                   $2,276.00        $2,684.00     charged $2,200
```

**What this tells us:** the charged figures sit at or below the zero-load
column, which suggests load and unload time is already inside the install
service durations and should NOT be counted again in mobilization. Hence
`load_hr_per_trip` defaults to **0**.

---

## Schema

```
equipment            + is_vehicle · capacity_lb · deck_length_ft · deck_width_ft
equipment_sourcing   + 'mile' rate basis
components           + ship_weight_lb · ship_length_ft · ship_width_ft · ship_height_ft
projects             + distance_mi · drive_time_hr        (both ONE WAY)
version_mobilization   trips · trips_computed · trips_overridden · load_hr_per_trip
                       total_weight_lb · longest_piece_ft · widest_piece_ft
                       truck_equipment_id · trailer_equipment_id · nights · rooms
```

## Still open

```
★ per diem and lodging — per person per night, per room per night, and what
  decides the nights. Tucson at 115 mi is a long day but same-day, so it did
  not trigger. Where is your line?
★ the truck's $/mile — one number you type, or computed from mpg, fuel price,
  maintenance $/mi and purchase price ÷ life miles? The second is a small
  dialog you fill in once per vehicle, and it is the number that decides
  whether you are actually being paid for wear.
```
