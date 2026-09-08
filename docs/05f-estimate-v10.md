# Estimate Editor — v10
Applies to `Estimate Editor v9`. **The estimate pane's look is right and stays.**
Six changes, two of them structural. The cost-objects pane changes too.

---

## 1 · Selection is grey — keep it

`#c0c0c0` ground, black text. No navy anywhere on this screen.

## 2 · No visible field until you edit

The sunken box around `SITE WORK — excavation and EWF removal` must not be there.

```
normal .......  plain text on white. no box, no border, nothing.
double-click .  that cell becomes a sunken white field with a caret.
click away ...  the box disappears again.
```

Single click selects the row. **Double click edits.** Render `SITE WORK` mid-edit
so the state is visible, and every other cell as plain text.

## 3 · Right-click menu

On any row in the estimate pane. Standard Win2000 popup — `#c0c0c0`, raised
bevel, drop shadow, hover `#000080`/white.

```
   Add sub-item
   Add option
   Add note          ▸   Disclaimer · Inclusion · Exclusion · Assumption
   ─────────────────────
   Move up
   Move down
   ─────────────────────
   Delete
```

Render it open over the `EXERPLAY 6 ft Bench` row, with `Delete` highlighted.

---

## 4 · Cost objects attach to sub-items and options, not just lines

This is the gap. A sub-item and an option are both real priced things with cost
behind them, and neither could be an assignment target.

**Every priced row gets a reference**, shown in a new 42 px `REF` column at the
far left of the estimate pane, grey, editor-only — **it never prints**.

```
01      line
01.1    sub-item of line 01
02.O1   option 1 on line 02
J.O1    job-level option
```

The cost-objects pane's `Assigned` dropdown offers **all of these**, not only
line numbers. That is the whole fix — the schema already allows it, since
sub-items and options are rows in the same table as lines.

**A line's cost is everything assigned to it or to anything beneath it.** An
object on `01.1` counts toward `01`. Sub-items remain a partial breakdown, so a
line may hold objects directly as well.

## 5 · Expand a row to see what is in it

A collapse triangle on every priced row. Expanded, it lists that row's cost
objects and closes with cost, price and margin. Grey, indented, read-only —
and **this is the one place cost appears in the estimate pane.** It never prints.

```
▾ 01   INSTALLATION of Design #4471                —   $10,588.82  $10,588.82
         Deck, square 48″            ×4     $1,333.61
         Post, 5″ × 12′              ×6     $4,628.29
         Slide, 6 ft spiral          ×1       $580.53
         Arch Climber Panel          ×2       $306.00
         Barrier Panel               ×3       $306.00
         Grab Handle, straight       ×6       $204.00
         ──────────────────────────────────────────────
         cost $7,358.43  ·  price $10,588.82  ·  margin 30.5%
```

Render **01 expanded** and everything else collapsed.

`Mobilization` has no cost objects — expanded it would read
`— no cost objects —` in grey. Leave it collapsed but note the state exists.

### Why this matters

Margin per line falls straight out, and it is the thing the whole cost-object
mapping was built for:

```
01  INSTALLATION of Design #4471 ....  30.5%
02  Hip Shade .......................  30.5%
03  Bench ...........................  30.5%
04  SITE WORK .......................   8.7%   ← the line you discounted
```

---

## 6 · The cost-objects pane

**It is missing the add-option scope deltas.** Options are priced from their own
cost objects, which is why they had nothing to attach to. Add them, grouped
under their delta, beneath the base scope.

```
Item                          Qty        Cost      Assigned
─────────────────────────────────────────────────────────────
BASE SCOPE
PlayBooster PB-4400
   Deck, square 48″           ×4    $1,333.61      01.1 ▼
   Post, 5″ × 12′             ×6    $4,628.29      01.1 ▼
   Slide, 6 ft spiral         ×1      $580.53      01.1 ▼
   Arch Climber Panel         ×2      $306.00      01.1 ▼
   Barrier Panel              ×3      $306.00      01.1 ▼
   Grab Handle, straight      ×6      $204.00      01.1 ▼
Shade and site furnishings
   24x24x12 Hip Shade         ×1    $2,181.07      02   ▼
   Bench, 6 ft                ×1      $349.63      03   ▼
Direct services
   Site excavation      12.00 CY    $1,865.74      04.1 ▼
   Remove EWF surfacing 1,700 SF      $707.20      04.2 ▼
                              10 of 10 assigned ✓  $12,462.07

ADD OPTION — Footing installation
   Excavate footing, F-3x12   ×4      $612.40      02.O1 ▼
   Set & pour footing         ×4      $317.10      02.O1 ▼
ADD OPTION — Private utility line locate
   Private line locate        ×1    $1,050.00      J.O1  ▼
                               3 of 3 assigned ✓    $1,979.50
```

`BASE SCOPE` and each `ADD OPTION —` heading is a `#dfdfdf` band. Two separate
footers — option cost is not part of the base total, exactly as option price is
not part of the estimate total.

---

## Unchanged

Row grammar, 17 px rows, the `0 / 14 / 26` indent ladder, yellow notes, the
`(Optional)` chip, the totals block, the add-ons block, the footer add-row, the
price bar, and every figure. Still under ~460 px for the estimate pane with 01
expanded.

## Rules

- **No box on a cell that is not being edited.**
- **No navy.** Selection is `#c0c0c0`.
- **Cost appears only inside a row expansion**, never in the document body,
  and never on the printed estimate.
- The `REF` column is editor-only and does not print.
- A line's cost includes everything on its sub-items.
