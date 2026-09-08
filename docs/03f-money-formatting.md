# Cross-cutting revision — MONEY FORMATTING
Applies to **every screen**, current and future. Hand this alongside any brief.

**Problem:** `$` currently appears only on fee sub-rows. Everywhere else money is
bare — `254.43`, `901.93`, `309.94 /CY`. On the Purchasing tab that puts
`83.64 /CY` immediately beside `14.91 CY` and `18.64 CY`, and it reads as a
third quantity rather than a price. It is not obvious which numbers are dollars.

---

## The rule

```
MONEY        always  $  ·  always two decimals  ·  thousands separated
             $185.00   ·   $1,247.14   ·   $12,462.07   ·   $0.00

RATE         money, then the unit
             $309.94 /CY   ·   $650.00 /day   ·   $42.00 /hr   ·   $83.64 /CY bank

QUANTITY     number and unit, never a $
             2.91 CY   ·   27.03 T   ·   14.2 hr   ·   6 EA   ·   3 days

PERCENT      number and %, never a $
             5%   ·   3%   ·   20%
```

Money stays right-aligned monospace. The `$` is part of the value, inside the
cell — not a column header, not a floating prefix.

---

## Negative money

Change orders can be credits, so this needs settling before it appears:

```
        ($590.00)        accounting convention, parentheses, no minus sign
```

Rendered in the same colour as any other figure — the parentheses carry the
meaning. Do not use red for negatives; red is reserved for problems.

---

## Cells that change

**Purchasing (tab 3)** — Unit price · Fees · Total · Eff. rate · Rate, in all
three tables:

```
before   185.00     254.43     901.93     309.94 /CY     650.00 /day
after   $185.00    $254.43    $901.93    $309.94 /CY    $650.00 /day
```

**Price ladder, every tab** — all six cells:

```
before    12,462.07     1,884.31    14,346.38     717.32    2,869.28    17,932.98
after    $12,462.07    $1,884.31   $14,346.38    $717.32   $2,869.28   $17,932.98
```

**Scope (tab 1)** — add-option prices already carry `$`. No change beyond the ladder.

**Requirements (tab 2)** — no money on the tab. Ladder only.

**Unchanged:** fee sub-rows already read `$85.00` / `$150.00`. The `3%` on the
fuel surcharge stays a percentage; its computed `$19.43` keeps its `$`.

---

## Also on tabs 1 and 2

Those two screens still carry the pre-v4 price ladder (`13,615.28` /
`19,598.93`). Correct values are above and in brief `03e`. Both changes are
status-bar only, so they can be made in one pass.
