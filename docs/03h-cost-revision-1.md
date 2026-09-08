# Cost Zone — REVISION 1
Applies to `Cost Zone v1`. Everything not mentioned here stays exactly as it is.

**Change:** the by-component view needs to collapse. It is 40 lines deep on a
small job; on a real playground it will be several hundred.

---

## Two levels of collapse

Both use the same triangle already built for scope groups on tab 1 — filled
triangle pointing down when open, pointing right when closed.

```
▾ PlayBooster PB-4400 ....................................... $7,358.43   ← level 1: GROUP
     ▾ Post, 5″ × 12′  ×6 ................................... $4,628.29   ← level 2: COST OBJECT
          procurement  concrete  2.79 CY × $309.9416 .....  $864.74        ← cost lines
          procurement  Rebar Cage B  6 EA × $152.8333 ....  $917.00
          …
     ▸ Deck, square 48″  ×4 ................................. $1,333.61   ← collapsed object
```

**A collapsed row always keeps its subtotal.** Collapsing hides detail, never
money. Every level still adds up on screen.

---

## Render these states

To prove all of it in one screen:

```
▾  PlayBooster PB-4400 ..................................... $7,358.43
      ▸ Deck, square 48″  ×4 ............................... $1,333.61     collapsed
      ▾ Post, 5″ × 12′  ×6 ................................. $4,628.29     expanded, all 6 lines
      ▸ Slide, 6 ft spiral  ×1 ..............................   $580.53     collapsed
      ▸ Arch Climber Panel  ×2 ..............................   $306.00     collapsed
      ▸ Barrier Panel  ×3 ...................................   $306.00     collapsed
      ▸ Grab Handle, straight  ×6 ...........................   $204.00     collapsed

▸  Shade and site furnishings .............................. $2,530.70     WHOLE GROUP collapsed
                                                                            no children shown

▾  Direct services ......................................... $2,572.94
      ▾ Site excavation  12.00 CY .......................... $1,865.74     expanded, 3 lines
      ▾ Remove EWF surfacing  1,700 SF .....................   $707.20     expanded, 1 line
                                                                            + the ⚠ row

                                                    TOTAL   $12,462.07
```

That reads far better than v1 — the shape of the job is visible at a glance,
and one object is open to show what detail looks like.

---

## Cost object rows carry manufacturer and part number

A row that says only `Post, 5″ × 12′` does not identify what was actually
priced. Match tab 1: manufacturer, then part number in monospace, then quantity.

```
     ▾ Post, 5″ × 12′        Landscape Str.   PB-P512     ×6 ....... $4,628.29
     ▸ Deck, square 48″      Landscape Str.   PB-D4848    ×4 ....... $1,333.61
     ▸ Slide, 6 ft spiral    Landscape Str.   PB-S6SP     ×1 .......   $580.53
     ▸ Arch Climber Panel    Landscape Str.   PB-88412    ×2 .......   $306.00
     ▸ Barrier Panel         Landscape Str.   PB-BR100    ×3 .......   $306.00
     ▸ Grab Handle, straight Landscape Str.   PB-2201     ×6 .......   $204.00

     ▾ 24x24x12 Hip Shade    Shade Systems    HIP-242412  ×1 ....... $2,181.07
     ▾ Bench, 6 ft           Exerplay         BN-6        ×1 .......   $349.63
```

Manufacturer in grey `#404040`, part number in `Lucida Console` black —
the same treatment tab 1 uses.

**Direct services have neither**, so those two cells stay genuinely blank:

```
     ▾ Site excavation                                12.00 CY ..... $1,865.74
     ▾ Remove EWF surfacing                          1,700 SF .....    $707.20
```

Their quantity sits where the `×n` sits on component rows.

---

## A problem must never be hidden by a collapse

`Remove EWF surfacing` carries the `⚠ disposition · removed EWF · — not selected —`
row. If that object or its group is collapsed, **the collapsed header shows a
`⚠` at its left** so the problem is still visible:

```
▸ ⚠ Remove EWF surfacing  1,700 SF ..........................   $707.20
```

Collapsing is for tidying detail, never for hiding a hole in the estimate.

---

## Collapse all / Expand all

Add to the **View** menu: `Collapse all` and `Expand all`. Menu only — no
toolbar button, the toolbar is full.

---

## Two fixes while you are in there

**1. `Direct services` has no subtotal.** The two real groups show one; this one
shows nothing, so the total cannot be checked by adding the three group lines.
It should read **$2,572.94**, and then:

```
$7,358.43  +  $2,530.70  +  $2,572.94  =  $12,462.07 ✓
```

**2. Remove the annotation `← NOT a scope group. ungrouped cost objects.`**
That was wording from the brief explaining the design to you, and it has leaked
into the interface. `Direct services` is self-explanatory as a heading. Style it
the same as the group headers, just without a triangle-group identity behind it.

---

## Unchanged

Window, chrome, greyed toolbar, tab strip, the view toggle and reconciliation
chip, the cost-type summary strip, the worked-allocation tip block, the price
ladder, and **every figure on the screen**. All money keeps `$` and two decimals.
