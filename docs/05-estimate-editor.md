# Design brief — ESTIMATE EDITOR
`BPCe-26-10A0` · **MAIN window**, MDI child.
**Apply `03f-money-formatting.md`.**

---

## ⛔ SCOPE OF THIS RENDER

Draw **one screen only**: the Estimate editor, one window, one state.
No dialogs, no overlays, no second window, no alternative layouts.

## ⛔ RENDER THE VALUES LITERALLY

Every figure below is computed and verified, including the override arithmetic.
Type them exactly. Do not derive, extend or invent any number.

---

## What this screen is

The estimate is **not a projection of the cost breakdown.** It is a document you
compose. You pick cost objects, group them under a line, and write the label
yourself. The customer never sees a cost — only these lines and their prices.

Two panes:

```
LEFT   COST OBJECTS      what the job is made of, and where each one landed
RIGHT  THE ESTIMATE      the document Grant Smith will read
```

The left pane exists to make one rule visible: **every cost object must be
assigned to exactly one line.** When nothing is unassigned, the money adds up.

---

## Window

**1280 px**, Windows 2000, MDI child on the teal desk. Same chrome language as
the Cost Breakdown.

```
Estimate BPCe-26-10A0 — BPC-26-10 San Tan Shade Installation
File   Edit   Estimate   Insert   View   Tools   Help
[New line] [New subitem] [Inclusion] [Exclusion] [Add option] ‖ [Recalculate] ‖ [Issue estimate]
```

`Issue estimate` is **greyed**.

### Context strip

```
Customer   Exerplay, Inc. · Grant Smith        Created   07 Sep 2026
Site       San Tan Elementary, Gilbert AZ      Status    Draft — not sent
```

Right of the strip, a red chip: `2 problems in the cost breakdown`.
The estimate can be *composed* while the breakdown has problems. It cannot be
*issued*. Those are different things and this screen should make that obvious.

---

## LEFT PANE — Cost objects  (≈ 400 px, sunken white list)

Grouped by scope group. Columns: item · qty · allocated cost · assigned line.

```
PlayBooster PB-4400
   Deck, square 48″           ×4      $1,333.61     Design #4471
   Post, 5″ × 12′             ×6      $4,628.29     Design #4471
   Slide, 6 ft spiral         ×1        $580.53     Design #4471
   Arch Climber Panel         ×2        $306.00     Design #4471
   Barrier Panel              ×3        $306.00     Design #4471
   Grab Handle, straight      ×6        $204.00     Design #4471
Shade and site furnishings
   24x24x12 Hip Shade         ×1      $2,181.07     Shade and site furnishings
   Bench, 6 ft                ×1        $349.63     Shade and site furnishings
Direct services
   Site excavation       12.00 CY      $1,865.74     Site work
   Remove EWF surfacing  1,700 SF        $707.20     Site work

                          10 of 10 assigned  ✓        $12,462.07
```

Group headers bold, no triangle — this pane does not collapse.
The assigned-line column is grey. A footer line states the count and the total.

**All ten are assigned**, so the footer reads `10 of 10 assigned ✓` in normal
text. An unassigned row would show `— unassigned —` in red on a pink ground and
the footer would read `9 of 10 assigned ⚠`.

---

## RIGHT PANE — The estimate

A composed tree. Every line is a **node**; a node carries subitems, inclusions,
exclusions and add options, each sitting directly beneath it.

```
INSTALLATION of Design #4471 ................................. $10,588.82
     Play structure .......................................... $3,928.69
     Posts and footings ...................................... $6,660.13
     ✓ incl — installed per manufacturer's installation drawings

Shade and site furnishings .................................... $3,641.69
     ✗ excl — footings not installed, to be installed before arrival
     +  Footing installation ................................. $1,045.00

Site work ................................ ✎ overridden ....... $3,269.49
     ✗ excl — permits and permit fees by others

JOB
     ✗ excl — private utility locating by others
     +  Private utility line locate .......................... $1,200.00

                                                  TOTAL       $17,500.00
```

Line labels are **editable text** — sunken field on focus. Amounts are editable
monospace fields. Inclusions (`✓`, green-black) and exclusions (`✗`, black) are
free text. Add options carry a `+` and their own price.

**Subitems must sum to their parent**: `$3,928.69 + $6,660.13 = $10,588.82` ✓

`Site work` shows a small pencil glyph and the grey word `overridden` because
its amount was changed by hand.

---

## The price bar — bottom of the window

```
 COMPUTED    $17,932.98    markup 20.00%
 QUOTED      $17,500.00    effective markup 16.98%      ▼ −$432.98
```

Two rows in sunken wells. `QUOTED` is an editable field and is **bold**.
`▼ −$432.98` in red. Effective markup recomputes live as either the quoted total
or any line is changed.

Beneath it: `Cannot issue — 2 problems in the cost breakdown` in red.

---

## The tip block

> **Lines autofill in proportion to allocated cost.** The computed price of
> $17,932.98 spread across three lines by what each group actually cost —
> $7,358.43 / $2,530.70 / $2,572.94 of $12,462.07. Then you overtype whatever
> you want. Because every line traces back to its cost objects, you always know
> which line you discounted: **Site work** now carries $432.98 less margin than
> the others.

---

## Rules this render must not break

- **No cost appears in the right pane.** The customer sees prices, never costs.
  Allocated cost lives in the left pane only, and that pane is yours.
- **Subitems sum to their parent, lines sum to the total.** Both, exactly.
- **Every value is editable** — labels, amounts, notes, the quoted total.
- **Composing and issuing are different.** The screen is fully usable with two
  problems outstanding; only `Issue estimate` is blocked.
- `✓ incl` and `✗ excl` are free text. There is no library and no dropdown.
