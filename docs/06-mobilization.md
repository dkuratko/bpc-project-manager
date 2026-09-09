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

## Per diem and lodging ✔

**Recommended, never automatic.**

```
usable_hours_day  =  workday_hours − (2 × drive_time_hr)
install_days      =  ceil( install duration ÷ usable_hours_day )

RECOMMEND staying when   distance_mi > threshold   AND   install_days > 1
nights            =  install_days − 1
```

A single-trip day job gives `install_days = 1`, so no per diem — which is the
rule stated plainly. The drive-time term earns its place: at two hours each way
a ten-hour day leaves six usable hours, so a nine-hour install becomes two days
and you are staying, where a shorter drive would have kept it a day trip.

```
✔ distance threshold ....  a SETTING. ▢ value not established yet.
✔ room rate .............  entered PER VERSION — lodging is location-dependent
✔ per diem ..............  an UPLIFT ON PAY. the same % for every employee,
                           e.g. 10%. a setting, overtypeable per version.
```

### The two costs, when staying

```
PER DIEM   =  per_diem_pct × ( install labour + mobilization labour )
LODGING    =  nights × rooms × room_rate
```

Per diem rides on pay, so it needs no second rate table and it scales with crew
size and job length automatically. Lodging does not — a room in Tucson and a
room in Flagstaff are different numbers, which is why the rate is entered on the
version rather than held as a setting.

Worked, on a job that triggers a stay:

```
install labour        40.0 man-hr × $68.00 ............  $2,720.00
mobilization labour   24.0 man-hr × $68.00 ............  $1,632.00
                                                        ──────────
                                                         $4,352.00
per diem              × 10% ...........................    $435.20
lodging               2 nights × 2 rooms × $145.00 ....    $580.00
                                                        ──────────
                                          added by staying  $1,015.20
```

[?] Assumed: per diem applies to **all** labour on the version once `nights > 0`,
on the basis that if the job needs a stay, the crew is away for its duration.
If a long job mixes stay-over days with day trips, it would need to apply only
to the away days — say so and it becomes a day count rather than a total.

## The truck's $/mile ✔ — computed, not typed

**Tier 1 now.** One dialog per vehicle:

```
fuel          fuel_price ÷ mpg
maintenance   annual_maintenance ÷ annual_miles
tyres         tyre_set_cost ÷ tyre_life_miles
depreciation  (purchase_price − salvage_value) ÷ life_miles
fixed         (insurance + registration) ÷ annual_miles
                                                    ──────────
                                                    = $/mile
```

Worked, for a ¾-ton truck:

```
fuel          $3.85 ÷ 14 mpg ........................  $0.275
maintenance   $2,160 ÷ 18,000 mi ....................  $0.120
tyres         $1,400 ÷ 50,000 mi ....................  $0.028
depreciation  ($68,000 − $18,000) ÷ 250,000 mi ......  $0.200
fixed         ($2,400 + $600) ÷ 18,000 mi ...........  $0.167
                                                      ────────
                                                       $0.79/mile
```

**Tier 2 — a vehicle tracker — is deferred, and a setting exists to switch to
it.** `vehicle.rate_method` = `computed` today, `tracked` later. Logging real
odometer, fuel and maintenance would derive $/mile from what the truck actually
cost, and prompt *"computed says $0.79, last 12 months say $0.94. Update?"* —
the same loop post cost already runs on the catalog's rate tables.
