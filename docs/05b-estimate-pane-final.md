# Estimate Editor — RIGHT PANE, from the real document
Replaces every previous attempt. Both exploration briefs are withdrawn — the
real estimate `26-148A0` answers the question.

Reference: `docs/design/reference-real-estimate-26-148A0.dc.html`

---

## What the real format does

```
#  │ ACTIVITY · DESCRIPTION · OPTIONS              │ QTY / UNIT │ UNIT PRICE │ AMOUNT
───┼──────────────────────────────────────────────┼────────────┼────────────┼──────────
01 │ DUMOR - 6' Steel Bench [500-60HS] Install [SM]│    5 EA    │  $165.00   │ $825.00
   │ Surface mount to existing 4" concrete pad;
   │ layout staked with owner prior to drilling.
   │ ↳ Anchor bolts & epoxy, set into existing slab │            │            │ ($225.00)
   │ ↳ Freight consolidation to jobsite             │            │            │ ($150.00)
   │ [OPT] Surface-mount anchor kit in lieu of embed│    5 EA    │   $55.00   │ +$275.00
02 │ DUMOR - Grill [#21-00] Installation [EM]       │    1 EA    │  $225.00   │ $225.00
   DISCLAIMER · Grill location must clear all combustible overhead structures
   by 10'-0". Relocation after set is billed at T&M.
```

Five things I had wrong, all of them visible here:

```
1  LINES ARE UNIT-PRICED.  qty · unit · unit price · amount. not a lump figure.
2  SUBITEMS ARE INCLUSIVE.  "↳" and the amount in PARENTHESES — already inside
   the line total, not added to it. and they are a PARTIAL breakdown: line 01's
   $825.00 with $225.00 and $150.00 shown inside it. they do not have to sum.
3  OPTIONS CARRY UNIT PRICING TOO, with a leading "+", and are EXCLUDED from
   the total. the headline says so: "BASE SCOPE, OPTIONS EXCLUDED".
4  DISCLAIMERS ARE FULL-WIDTH ROWS, no columns, prefixed "DISCLAIMER ·".
5  A LINE TITLE IS  manufacturer - product [part number] Installation [method]
```

Plus three structures I did not have at all: a **legend row** explaining `↳`,
`( )` and `[OPT]`; a **project-level options block with checkboxes**; and a
**TERMS & EXCLUSIONS** paragraph at the foot.

---

## Build the right pane as this

Group box legend: **The estimate**. One table, white sunken ground.

### Legend strip — above the table, grey, small

```
↳ sub-item  ·  (amount) already included in the line total  ·  [OPT] optional, added only if accepted
```

### Columns

| col | width | align |
|---|---|---|
| # | 30 | centre, grey |
| ACTIVITY · DESCRIPTION · OPTIONS | flex | left, **wraps** |
| QTY / UNIT | 92 | right |
| UNIT PRICE | 92 | right |
| AMOUNT | 104 | right |

### Row kinds

```
LINE         numbered, bold title, all four money columns filled
DESCRIPTION  no number, no amounts. plain sentence, indented, WRAPS.
SUBITEM      "↳" prefix, indented. amount in PARENTHESES, no qty/unit price.
OPTION       "[OPT]" prefix. qty · unit price · amount with a leading "+".
NOTE         full-width, spans all columns. kind in caps then " · " then the
             text, wrapping. e.g.  DISCLAIMER · …   INCLUSION · …   ASSUMPTION · …
```

### The content — render exactly this

```
01  Landscape Structures - PlayBooster PB-4400 Install [DB]   1 LS  $10,588.82  $10,588.82
      Six posts direct-buried, decks, slide, panels and hardware per approved layout.
      ↳ Play structure assembly                                          ($3,928.69)
      ↳ Posts and footings                                               ($6,660.13)
      INCLUSION · Installed per manufacturer's installation drawings.

02  Shade Systems - 24x24x12 Hip Shade [HIP-242412] Install [SM]  1 EA  $3,138.57  $3,138.57
      DISCLAIMER · Footings not installed, to be installed before arrival by others,
      verified level and within 1/4 in over 10 ft.
      [OPT] Footing installation                              4 EA    $261.25   + $1,045.00

03  Exerplay - 6 ft Bench [BN-6] Installation [DB]              1 EA    $503.12     $503.12

04  Site work — excavation and EWF removal          ✎ overridden 1 LS  $3,269.49  $3,269.49
      ↳ Site excavation, 12.00 CY                                        ($2,370.86)
      ↳ Remove EWF surfacing, 1,700 SF                                     ($898.63)
      DISCLAIMER · Permits and permit fees by others.
```

`$10,588.82 + $3,138.57 + $503.12 + $3,269.49 = $17,500.00` ✓

### Project-level options block

Beneath the table, its own `#dfdfdf` heading band:

```
PROJECT-LEVEL OPTIONAL ADD-ONS — CHECK TO ACCEPT

   ☐  Private utility line locate                                     + $1,200.00
```

A real Win2000 checkbox, unticked.

### Totals

```
                                        SUBTOTAL      $17,500.00
                                        TAX           INCLUDED
                                        TOTAL         $17,500.00
```

### Terms & exclusions

A final block, heading `TERMS & EXCLUSIONS` on a `#dfdfdf` band, then one
wrapping paragraph of small text. Use the real one from `26-148A0` verbatim.

### Footer add-row

`#dfdfdf`, spanning the table:

```
＋ Line     ＋ Description     ＋ Sub-item     ＋ Option     ＋ Note ▼
```

`＋ Note ▼` carries a dropdown for the kind: Disclaimer · Inclusion · Exclusion ·
Assumption.

### Selection and editing

One row selected — `#000080` ground, white text. Render line **02** selected.
Text is plain until clicked; render `Posts and footings` mid-edit as the only
sunken cell on the pane.

---

## Left pane — one change

`Assigned line` becomes a dropdown per row, as previously specified, and its
values are now the numbered lines: `01 · 02 · 03 · 04`.

---

## Model changes this forces

Flagged for the schema, not for the renderer:

```
document_lines needs  quantity · unit · unit_price   in addition to amount
SUBITEMS are inclusive and partial — drop the "subitems must sum to parent" rule
OPTIONS are excluded from the total — the headline must say so
NOTES get a kind: disclaimer · inclusion · exclusion · assumption
TERMS & EXCLUSIONS is document-level boilerplate and IS reused between jobs,
   which contradicts the earlier "no boilerplate" decision. Per-line notes are
   still written fresh; this one paragraph is standing text.
```
