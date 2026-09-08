# Estimate Editor — RIGHT PANE
Modelled on the real estimates. **Section 02 · ESTIMATE OF WORK only.**
All previous versions of this brief and both exploration briefs are withdrawn.

Reference PDFs, committed:
```
docs/design/reference/estimate-26-138A0-subitems.pdf   ← sub-items
docs/design/reference/estimate-26-142A0-options.pdf    ← optional add-ons
```

---

## ⛔ SCOPE

Redraw **only the right-hand pane** of the Estimate editor. Window, menu,
toolbar, context strip, left-hand cost objects pane and price bar are unchanged.

## The one thing to get right

The reference documents are **readable because of colour and spacing**, not
despite them. Keep both. The typeface stays Tahoma 11px to match the app; the
tint bands, the olive notes, the grey de-emphasis and the generous vertical
rhythm all carry over exactly.

This pane will be **less dense than the Scope tab, deliberately.** It is a
document, not a data grid.

---

## Palette

```
band, sub-item / option ......  #f5f5f0   full-width tint behind the row and
                                          everything attached to it
note text ....................  #8a7538   olive. ITALIC.
secondary grey ...............  #909090   qty and unit price on sub-item rows
unit label grey ..............  #a0a0a0   the "/ EA" half of a qty
description grey .............  #707070   plain, not italic
chip fill / border / text ....  #eeeeee / #d0d0d0 / #555555
rule between line groups .....  #d8d8d8   1px, full width
column header rule ...........  #000000   1px, under ACTIVITY / QTY / …
title, amount ................  #000000   bold
```

## Spacing

```
between line groups ..........  16 px
chips row → title row ........   3 px      they belong together
title → note .................   5 px
tint band, inner padding .....  9 px top and bottom, 10 px left of the ↳
sub-item title → description .   4 px
row height ...................  breathe. ~11 px vertical padding on money rows.
```

---

## Columns

`ACTIVITY` (flex, wraps) · `QTY` (100, right) · `UNIT PRICE` (100, right) ·
`AMOUNT` (110, right). Header row in letterspaced grey caps with a black rule
beneath — as in the PDFs, not a `#c0c0c0` bevelled table header.

## Row grammar

```
LINE          ( chip )( chip )   on their own row, left
              BOLD TITLE         next row
              *olive italic note (optional)
              money columns align to the CHIPS row
              a line may have NO chips — see Mobilization

SUB-ITEM      on a #f5f5f0 band spanning the full width
              ↳  bold title
              qty and unit price in GREY, amount in BLACK BOLD
              amount is INCLUDED in the line above — it never reaches the total
              may carry a plain grey description line
              may carry an olive italic note

OPTION        identical to a sub-item, except:
              a ( Optional ) chip after the ↳
              amount prefixed "+" and EXCLUDED from the total
              the whole row, amount included, in GREY

The tint band wraps the sub-item or option AND its description and note.
```

---

## Render exactly this

```
( Installation )( Design )                        —      $10,588.82   $10,588.82
INSTALLATION of Design #4471
*Site graded not included. Site is to be prepped before arrival.
▓ ↳ Landscape Structures PlayBooster PB-4400 Installation
▓                                            1 / EA      $6,660.13    $6,660.13
▓   Six posts direct-buried, decks, slide, panels and hardware
▓   *Permitting is not included.

( Installation )( Shade )                    1 / EA      $3,138.57    $3,138.57
SHADE SYSTEMS 24'x24'x12' Hip Shade [#HIP-242412] Installation [SM]
*Footings not installed, to be installed before arrival by others, verified
level and within 1/4 in over 10 ft.
▓ ↳ ( Optional ) Footing installation        4 / EA        $261.25   + $1,045.00
▓   *Priced assuming each footing is 3'x12'. Rebar cage included.

( Installation )( Site furnishing )          1 / EA        $503.12      $503.12
EXERPLAY 6 ft Bench [#BN-6] Installation [DB]

( Installation )( Site work )                     —      $2,819.49    $2,819.49
SITE WORK — excavation and EWF removal
▓ ↳ Site excavation                      12.00 / CY        $170.00    $2,040.00
▓ ↳ Remove EWF surfacing                1,700 / SF          $0.45       $765.00
▓   *Easy access to EWF dump location is required.

Mobilization                                      —        $450.00      $450.00
Multi-trip

                                                    SUBTOTAL      $17,500.00
                                                    TAX             Included
                                                    TOTAL         $17,500.00
```

`▓` marks the tint band; do not draw that character.

**The arithmetic, which must hold:**
`$10,588.82 + $3,138.57 + $503.12 + $2,819.49 + $450.00 = $17,500.00`

Sub-items never reach the total — the PlayBooster's `$6,660.13` sits inside the
`$10,588.82`, and Site work's two sub-items come to `$2,805.00` inside
`$2,819.49`. **They are a partial breakdown and do not have to sum.** That is
deliberate and must not be "corrected."

### Project-level options block

Beneath the table, after a rule, in letterspaced grey caps:

```
OPTIONAL ADD-ONS — NOT INCLUDED UNLESS ACCEPTED

   ☐  Private utility line locate                                    + $1,200.00
```

---

## Editing

Selection: one row on `#000080`, white text. Render the **Hip Shade** line
selected. Text is plain until clicked — render the `SITE WORK` title as the only
cell in edit state, sunken with a caret.

Footer add-row, `#dfdfdf`, spanning the pane:

```
＋ Line     ＋ Sub-item     ＋ Option     ＋ Description     ＋ Note ▼
```

`＋ Note ▼` opens a kind list: Disclaimer · Inclusion · Exclusion · Assumption.

---

## Rules this render must not break

- **Colour and spacing are the point.** A dense grey grid is a failure even if
  every value is correct.
- **Sub-items are included, options are excluded.** The `( Optional )` chip and
  the leading `+` are the only difference, and both must be unmistakable.
- **Sub-items do not have to sum to their line.**
- **Notes wrap.** The long one runs to two lines.
- **No cost figures.** Cost lives in the left pane.
