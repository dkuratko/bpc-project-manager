# Estimate pane — STRIP IT BACK
Applies to `Estimate Editor v8`. Supersedes `05b`, `05c` and `05d` for this pane.

---

## Keep exactly four things

```
1  the line item is CLEAR                     bold title, its own row
2  sub-items are  ↳ + title                   NOT bold. no description.
3  notes are highlighted YELLOW               #ffffe1 behind the text
4  options are  ↳ + (Optional) + title        greyed, amount prefixed +
```

## Delete everything else

```
✘ chips                    an extra row per line, and nothing depends on them
✘ line descriptions        stated as not necessary
✘ sub-item descriptions    stated as not necessary
✘ #dfdfdf tint bands       the ↳ and the indent already say "belongs above".
                           the band costs 18 px of padding per group and is
                           most of what makes this feel heavy.
✘ the vertical gutter rule the bevelled column header divides the columns,
                           the way a Win2000 list view does
✘ etched separators        8 px of white space between line groups instead
✘ letterspaced caps        plain 11 px Tahoma everywhere
```

Roughly two-thirds of the pane's height comes out. **That is the point.**

---

## The row grammar — four kinds, nothing else

```
LINE       bold black title · all four columns
             indent 0

SUB-ITEM   ↳ then title, NORMAL weight, black
             indent 14 (arrow) / 26 (text)
             qty and unit price #808080 · amount BLACK BOLD · included above

OPTION     ↳ then a (Optional) chip then title
             same indent as a sub-item
             whole row #808080 · amount prefixed "+" · excluded from the total

NOTE       italic, black, on a #ffffe1 ground behind the TEXT ONLY —
             not the full row, not a bordered block. leading *
             indent matches its parent: a line's note at 0,
             a sub-item's or option's note at 26. WRAPS. never truncates.
```

`(Optional)` is the only chip left: `#c0c0c0`, `var(--t)` bevel, 9 px, square.

## Metrics — tight

```
row height ..............  17 px   ·  3 px vertical padding on 11 px text
indent ladder ...........  0  /  14 (arrow)  /  26 (text)
between line groups .....  8 px of white space. NO RULE.
column header ...........  #c0c0c0, var(--r) bevel, plain 11 px black
content ground ..........  sunken white well, var(--s), 4 px padding
```

The whole pane should come in **under about 420 px tall** for this content.
If it is taller than that, something on the delete list has survived.

## Columns

`ACTIVITY` flex, bounded, wraps · `QTY` 76 right · `UNIT PRICE` 96 right ·
`AMOUNT` 104 right. Money is Lucida Console. The unit half of a qty
(`/ EA`) is `#808080`.

---

## Render exactly this

```
ACTIVITY                                        QTY    UNIT PRICE      AMOUNT
──────────────────────────────────────────────────────────────────────────────
INSTALLATION of Design #4471                      —    $10,588.82  $10,588.82
  *Site graded not included. Site is to be prepped before arrival.
  ↳ Landscape Structures PlayBooster PB-4400  1 / EA    $6,660.13   $6,660.13
    *Permitting is not included.

SHADE SYSTEMS 24'x24'x12' Hip Shade
[#HIP-242412] Installation [SM]                1 / EA   $3,138.57   $3,138.57
  *Footings not installed, to be installed before arrival by others,
   verified level and within 1/4 in over 10 ft.
  ↳ (Optional) Footing installation            4 / EA     $261.25  + $1,045.00
    *Priced assuming each footing is 3'x12'. Rebar cage included.

EXERPLAY 6 ft Bench [#BN-6] Installation [DB]  1 / EA     $503.12     $503.12

SITE WORK — excavation and EWF removal              —   $2,819.49   $2,819.49
  ↳ Site excavation                         12.00 / CY    $170.00   $2,040.00
  ↳ Remove EWF surfacing                    1,700 / SF      $0.45     $765.00
    *Easy access to EWF dump location is required.

Mobilization                                        —     $450.00     $450.00

                                              SUBTOTAL              $17,500.00
                                              TAX                     Included
                                              ───────────────────────────────
                                              TOTAL                 $17,500.00

OPTIONAL ADD-ONS — NOT INCLUDED UNLESS ACCEPTED          ← #dfdfdf band, bold
  ☐  Private utility line locate                                   + $1,200.00
```

Titles wrap inside the ACTIVITY column — the Hip Shade one runs to two lines and
its money centres against the pair. Notes wrap and are never cut.

`$10,588.82 + $3,138.57 + $503.12 + $2,819.49 + $450.00 = $17,500.00`
Sub-items sit inside their line and do not reach the total. They need not sum.

## Selection and editing

One row selected: full-width `#000080`, white text — render the **Hip Shade**
line. Text is plain until clicked: render `SITE WORK — excavation and EWF
removal` as the only cell in edit state.

## Footer add-row

`#dfdfdf`, `var(--t)`:
`＋ Line   ＋ Sub-item   ＋ Option   ＋ Note ▼`
with `sub-items are included · options are excluded` right-aligned in `#404040`.
`＋ Description` is gone with the descriptions.

---

## Rules

- **Under ~420 px tall.** Height is the test.
- **No tint bands, no chips except (Optional), no descriptions, no rules
  between groups.**
- Notes keep the yellow. Everything else is black, `#808080`, or `#c0c0c0`.
- Sub-item titles are **not bold**. Line titles are.
- Notes wrap; titles may wrap; nothing truncates.
