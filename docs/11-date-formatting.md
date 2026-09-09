# DATE FORMATTING
Cross-cutting. Applies to **every screen and every document**. Hand this
alongside any brief, the same as `03f-money-formatting.md`.

---

## The rule

**Every date carries its year. Everywhere. No exceptions.**

```
DATE            22 Sep 2026
DATE + TIME     08 Sep 2026 14:22
NONE            —
```

No `22 Sep`. No `14 Mar 27`. No dropping the year because it happens to be the
current one.

## Why

A version can sit as a standing offer for months, a warranty runs a year past
completion, and post cost gets done long after the job. **The list you are
looking at will routinely contain more than one year**, and a bare `22 Sep` is
ambiguous the moment it does — which is exactly when it matters, because a
quote from last September is dead and one from this September is live.

Two-digit years are worse than useless: `14 Mar 27` reads as a day-month-year
*and* as a date in 2027, and you have to know which to know what you are seeing.

## Where this changes what is already written

```
09  Version view    "Dates are 22 Sep, with the year only when it is not this
                    one" — DELETED. every date gains its year.
07  Project browser sample dates gain years
03* cost breakdown  quote validity, quote dates
05* estimate editor created / sent / expiry
06  mobilization    nothing dated
```

Every rendered screen shows dates without years. **This is a build-time change,
not a re-render** — the format is mechanical and identical everywhere.

## Column widths

`22 Sep 2026` is roughly 66 px at 10 px Tahoma, against 40 px for `22 Sep`.
Columns holding a date need **80 px**, not 56. The ones affected:

```
07  project browser   version rows, the Date column if it returns
09  version view      Progress, Shipments, Documents created / sent
05  estimate editor   identity strip, status strip
```

## Printed documents

Estimates and invoices already carry full dates — `8/20/2026` on the real ones.
**Leave the printed format alone**; it is what your customers already receive.
This rule governs the application's screens.
