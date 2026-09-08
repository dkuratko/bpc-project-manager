# Design brief — COST BREAKDOWN, tab 3 of 4: PURCHASING
Build Play Contracting Project Manager.
Continues from `Scope Zone v4` and `Requirements Zone v1`.

---

## ⛔ SCOPE OF THIS RENDER

Draw **one screen only**: the Cost Breakdown window with **tab 3 (Purchasing)
active**. No other tab's content, no dialog, no overlay, no second window, no
alternative state.

## ⛔ RENDER THE VALUES LITERALLY — compute nothing

Every figure below is computed and verified. Type them exactly.

---

## Carried over — with two changes

Reuse the window, menu, toolbar, context strip, tab strip and status bar exactly
as they render in the earlier tabs, **except**:

**1. Tab 3 is the active tab.**

**2. The toolbar buttons `Add component`, `Add service` and `New one-time…` are
GREYED / disabled.** They are scope actions and belong to tab 1 only.
`Recalculate` stays enabled. `Issue estimate` stays disabled (2 problems).

**3. The price ladder carries NEW values.** The earlier tabs still show figures
from a scope that has since changed. These are correct for the v4 scope:

```
Cost         + conditions      = adjusted      + contingency 5%   + markup 20%    COMPUTED PRICE
12,462.07      1,884.31          14,346.38        717.32            2,869.28        17,932.98
```

Red line beneath, unchanged: `Cannot issue estimate — 2 problems`

---

## The panel — four independent group boxes, stacked

Unlike tab 1, these four tables are **independent**. They do not share a column
grid and must not be forced to align with each other. Give each the widths its
own content needs.

This is the densest screen in the application. If a table will not fit at
1180 px, widening the window to **1280 px** is acceptable — but do not shrink
the type or drop a column.

**Every price, method and quantity cell here is editable** — sunken white field
or a dropdown. The catalog supplies the default; nothing here is a commitment.

---

### Group box: "Pooled materials"

Columns: expand · Material · Required · Method · Waste · Purchased · Unit price ·
Fees · Total · Eff. rate

Row 1, **expanded**:
```
▾  Concrete, ready-mix   2.91 CY   Ready-mix, ABC ▼   5%   3.50 CY   185.00   254.43   901.93   309.94 /CY
```
Its fee sub-rows, indented, on a slightly inset ground:
```
      Delivery          flat            $85.00     always
      Short load        flat           $150.00     purchased < 4.00 CY          ← applied
      Fuel surcharge    percent             3%      $19.43
```

Row 2, **collapsed** (header only):
```
▸  Rebar Cage B            6 EA   Premade, Harris ▼   0%    6 EA    142.00    65.00   917.00   152.83 /EA
```

`Required`, `Total` and `Eff. rate` are read-only monospace. `Method`, `Waste`,
`Purchased` and `Unit price` are editable.

---

### Group box: "Equipment"

Columns: Equipment · Required · Sourcing · Periods · Rate · Fees · Total · Eff. rate

```
Telehandler   14.2 hr   United Rentals ▼   3 days ✎   650.00 /day   500.00   2,450.00   172.54 /hr
Mixer          2.4 hr   Owned ▼            —            42.00 /hr     0.00     100.80    42.00 /hr
```

The `Periods` cell carries a small pencil glyph and a tooltip:

> Derived: ceil(14.2 ÷ 8) = 2 days, raised to the 3-day minimum. Overtype when
> the work spreads across more days than it fills.

`—` in the Mixer's Periods cell because an owned machine bills by the hour.

---

### Group box: "Disposition"

Columns: Output · Bank · Loose · Method · Basis · Tons / Loads · Fees · Total ·
Eff. rate

```
Native soil — hard clay   14.91 CY   18.64 CY   Haul off, Miller Pit ▼   per ton   27.03 T   220.00   1,247.14   83.64 /CY bank
```

Second row is an **error row** — pink `#ffe0e0` ground, `#a00` text, `⚠` at the left:
```
⚠  Removed EWF            62.96 CY   72.40 CY   — not selected — ▼        —         —          —          —          —
```

Beneath the table, a yellow tip block:

> `— not selected —` is not `$0.00`. An output with no disposition is a hole in
> the estimate, not a free one. Choose **Leave on site** if it genuinely costs
> nothing.

---

### Group box: "Products"

```
— none.  Equipment furnished by the customer on this job.  —
```
Grey, centred, no table.

---

## The tip block — full width, beneath all four

> **The effective rate is computed over what was REQUIRED, not what was
> purchased.** Concrete lists at $185.00/CY and lands at **$309.94/CY**, because
> 2.91 CY is a small order carrying a delivery fee, a short-load fee and fuel
> across very little volume.
> That number is not a mistake — it is the real cost of buying concrete twice.
> Accepting the *Footing installation* add option would put 12.57 CY more on the
> same truck, kill the short-load fee, and drop this rate by more than half.

---

## Rules this render must not break

- **Every price cell is editable.** The catalog gives defaults, never commitments.
- **`— not selected —` must look different from `$0.00`.** One is a hole, the
  other is a decision.
- **Effective rate is over required / bank quantity**, never over purchased or
  loose. That is the entire point of the model.
- **Fees are a list, not columns.** Rows expand to reveal them; a fee that does
  not apply is shown greyed with its reason, not hidden.
- Four independent tables. **Do not force a shared column grid.**
