# Design brief — COST BREAKDOWN, tab 4 of 4: COST
Build Play Contracting Project Manager.
Continues from tabs 1–3. **Apply `03f-money-formatting.md` throughout.**

---

## ⛔ SCOPE OF THIS RENDER

Draw **one screen only**: the Cost Breakdown window with **tab 4 (Cost) active**.
No other tab's content, no dialog, no overlay, no second window.

## ⛔ RENDER THE VALUES LITERALLY — compute nothing

Every figure below has been computed and checked, including the rounding
residuals. Type them exactly. **Do not derive, extend, or invent any number.**
An earlier attempt at this screen invented the allocation and came out $122.49
adrift while claiming it reconciled.

---

## Carried over

Window at **1280 px**, same chrome, menu, context strip, tab strip, `2 problems`
chip. **Tab 4 active.** Toolbar: `Add component`, `Add service`,
`New one-time…` **greyed**; `Recalculate` enabled; `Issue estimate` greyed.

Price ladder, with `$` per 03f:
```
Cost          + conditions     = adjusted      + contingency 5%   + markup 20%     COMPUTED PRICE
$12,462.07      $1,884.31        $14,346.38       $717.32           $2,869.28        $17,932.98
```
Red line beneath: `Cannot issue estimate — 2 problems`

---

## The view toggle

At the top of the panel, two radio buttons on one line, plus a reconciliation chip
right-aligned:

```
( ) By purchase        (•) By component            both views  $12,462.07  ✓ reconciles
```

**By component is the selected view.** Render **only that view's content** —
do not draw both stacked. The chip is the screen's proof of correctness and
should read as reassuring, not decorative.

---

## The panel — BY COMPONENT

Grouped by the **scope groups from tab 1**, with subtotals. Money right-aligned
monospace with `$`. Rates shown as `qty × rate` in grey so any line can be traced.

```
PlayBooster PB-4400                                                    $7,358.43
   Deck, square 48″  ×4                                                $1,333.61
      equipment    telehandler   3.00 hr × $172.5352 ........   $517.61
      labor        Installer    12.0 man-hr × $68.00 .........   $816.00
   Post, 5″ × 12′  ×6                                                  $4,628.29
      procurement  concrete      2.79 CY × $309.9416 .........   $864.74
      procurement  Rebar Cage B     6 EA × $152.8333 .........   $917.00
      equipment    telehandler   5.20 hr × $172.5352 .........   $897.18
      equipment    mixer         2.00 hr × $42.00 ............    $84.00
      disposition  native soil   2.79 CY × $83.6445 ..........   $233.37
      labor        Installer    24.0 man-hr × $68.00 ......... $1,632.00
   Slide, 6 ft spiral  ×1                                                 $580.53
      equipment    telehandler   1.00 hr × $172.5352 .........   $172.53
      labor        Installer     6.0 man-hr × $68.00 .........   $408.00
   Arch Climber Panel  ×2                                                 $306.00
      labor        Installer     4.5 man-hr × $68.00 .........   $306.00
   Barrier Panel  ×3                                                      $306.00
      labor        Installer     4.5 man-hr × $68.00 .........   $306.00
   Grab Handle, straight  ×6                                              $204.00
      labor        Installer     3.0 man-hr × $68.00 .........   $204.00

Shade and site furnishings                                             $2,530.70
   24x24x12 Hip Shade  ×1                                              $2,181.07
      equipment    telehandler   2.00 hr × $172.5352 .........   $345.07
      labor        Installer    27.0 man-hr × $68.00 ......... $1,836.00
   Bench, 6 ft  ×1                                                        $349.63
      procurement  concrete      0.12 CY × $309.9416 .........    $37.19
      equipment    mixer         0.40 hr × $42.00 ............    $16.80
      disposition  native soil   0.12 CY × $83.6445 ..........    $10.04
      labor        Installer     4.2 man-hr × $68.00 .........   $285.60

Direct services                    ← NOT a scope group. ungrouped cost objects.
   Site excavation  12.00 CY                                           $1,865.74
      equipment    telehandler   3.00 hr × $172.5352 .........   $517.61
      disposition  native soil  12.00 CY × $83.6445 ......... $1,003.73
      labor        Operator      4.2 man-hr × $82.00 .........   $344.40
   Remove EWF surfacing  1,700 SF                                        $707.20
      labor        Laborer      13.6 man-hr × $52.00 .........   $707.20
   ⚠ disposition  removed EWF   62.96 CY   — not selected —          not costed

                                                          TOTAL     $12,462.07
```

The `⚠` line sits inside *Remove EWF surfacing*, on the pink error ground, and is
**not** included in that object's subtotal — because it has no cost yet.

### Cost-type summary strip, across the bottom of the panel

```
Labor $6,845.20  │  Equipment $2,550.80  │  Procurement $1,818.93  │  Disposition $1,247.14  │  Product $0.00
```

---

## The worked-allocation tip block

This is the mechanism the whole application rests on, so it is shown, not hidden:

> **Concrete.** 2.91 CY required, 3.50 CY bought, **$901.93** all-in.
> Effective rate = $901.93 ÷ **2.91 required** = **$309.9416/CY** — over required,
> not purchased, so waste and fees ride back to whoever caused them.
> Posts 2.79 → $864.7370 → **$864.73** · Bench 0.12 → $37.1930 → **$37.19**
> Floors sum to $901.92, one cent short. The largest discarded fraction was the
> posts, so the cent goes there: **$864.74**. Total **$901.93**, exactly.

---

## Rules this render must not break

- **The two views must total identically.** The chip says `$12,462.07 ✓ reconciles`;
  the by-component figures above sum to exactly that. Check the subtotals:
  `$7,358.43 + $2,530.70 + $2,572.94 = $12,462.07`.
- **Every dollar lands on exactly one cost object.** Nothing is unallocated,
  nothing is smeared. `Site excavation` and `Remove EWF surfacing` are cost
  objects in their own right — direct services with no component above them —
  and they carry **$2,572.94** of this job, roughly a fifth of it. If they are
  missing, or their cost has been pushed onto the products, the model has been
  broken.
- **The undecided disposition is shown and excluded.** `— not selected —` is not
  `$0.00`. It means the total is *incomplete*, not that hauling is free.
- **`$` and two decimals on every money figure** (03f). Quantities and
  percentages never carry `$`.
- **Render only the selected view.** By component. Not both.
