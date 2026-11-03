# Estimate Editor — RIGHT PANE, rewritten
Replaces the right pane of `v1 - Estimate Editor` completely. Ignore the
previous revision; this supersedes it.

**Unchanged from v1:** window, menu, toolbar, context strip, `2 problems` chip,
the tip block, and the price bar. **Two changes to the left pane**, at the end.

---

## Why it is being rewritten

v1's right pane was a free-form outline: every value a permanently sunken input
box, notes truncated to one line, no visible selection, and inline affordances
that exist nowhere else in the application.

**Every other surface in this app is a table** — Scope, Purchasing, Cost, the
component wizard. Header row, typed rows, footer add-row. The estimate pane must
be the same thing. That is the whole fix.

---

## The estimate is a table

Group box legend: **The estimate**. Inside it, one table on a white sunken
ground, exactly the construction used by the Scope tab.

### Columns

| col | width | align | notes |
|---|---|---|---|
| ▾ | 18 | centre | collapse triangle, LINE and JOB LEVEL rows only |
| Type | 88 | left | grey. `Subitem` · `Inclusion` · `Exclusion` · `Option` |
| Description | flex | left | **wraps.** never truncated. |
| Amount | 112 | right | monospace, `$` and two decimals |

Header row in `#c0c0c0` with the raised bevel, same as every other table.

### Row kinds

```
LINE          a #dfdfdf band spanning the table, bold, with a collapse
              triangle and its amount at the right. exactly the scope-group
              band from tab 1. the Type cell is empty on these rows —
              the band itself says what it is.

SUBITEM       ordinary white row. Type reads "Subitem". Description indented
              one level. amount right-aligned.

INCLUSION     ordinary white row. Type reads "Inclusion". Description carries
              a ✓ then WRAPPING text. Amount cell shows an em dash.

EXCLUSION     same, with ✗.

OPTION        ordinary white row. Type reads "Option". Description carries a
              ＋ then the label. Amount is the option's price.

JOB LEVEL     a #dfdfdf band like a LINE, bold, but with NO amount. Holds the
              job-wide inclusions, exclusions and options that follow it.
```

### The table, exactly

```
▾  │            │ INSTALLATION of Design #4471                    │ $10,588.82
   │ Subitem    │    Play structure                               │  $3,928.69
   │ Subitem    │    Posts and footings                           │  $6,660.13
   │ Inclusion  │    ✓ installed per manufacturer's installation
   │            │      drawings                                   │         —
▾  │            │ Shade and site furnishings                      │  $3,641.69
   │ Exclusion  │    ✗ footings not installed, to be installed
   │            │      before arrival by others, verified level
   │            │      and within 1/4 in over 10 ft               │         —
   │ Option     │    ＋ Footing installation                      │  $1,045.00
▾  │            │ Site work                          ✎ overridden │  $3,269.49
   │ Exclusion  │    ✗ permits and permit fees by others          │         —
▾  │            │ JOB LEVEL                                       │
   │ Exclusion  │    ✗ private utility locating by others         │         —
   │ Option     │    ＋ Private utility line locate               │  $1,200.00
```

The wrapped exclusion under *Shade and site furnishings* runs to **three lines**
and its dash sits on the last of them. This is deliberate — it proves the cell
wraps rather than truncating.

### Footer add-row

Spanning all columns, `#dfdfdf` ground, exactly like the Scope tab's:

```
＋ Line     ＋ Subitem     ＋ Inclusion     ＋ Exclusion     ＋ Add option
```

Five small raised buttons. They insert relative to the selected row.

### Total row

Below the footer, a single row with a rule above the amount:

```
                                                   TOTAL       $17,500.00
```

---

## Selection and editing

**One row is selected**: full-width `#000080` ground, white text, the classic
Win2000 list selection. Render `Shade and site furnishings` selected.

**Text is plain until you click it.** Only the cell being edited becomes a
sunken white field. Render `Posts and footings` mid-edit — that one Description
cell sunken with a caret, everything else plain text on white.

Nothing else on this pane is a box.

---

## Two changes to the LEFT pane

**1. Delete the assign / unassign strip idea entirely.** There is no strip.

**2. The `Assigned line` column becomes a dropdown**, one per row — the same
sunken-field-with-a-raised-arrow-button used for Method, Footing, Procurement
method and Sourcing everywhere else in the app. Assigning a cost object to a
line is choosing from a list on its own row. No cross-pane selection, no
buttons, no drag.

An unassigned object shows `— unassigned —` in `#a00` on a `#ffe0e0` row, and
the footer count drops. In this render all ten are assigned, so the footer still
reads `10 of 10 assigned ✓  $12,462.07`.

---

## Rules this render must not break

- **It must look like the Scope tab.** Same header row, same band treatment for
  groupings, same footer add-row. If it does not look like it belongs to the
  same application, it is wrong.
- **Descriptions wrap. Nothing is ever truncated.**
- **No permanent input boxes.** Exactly one cell is in edit state.
- **No cost figures.** The customer sees prices. Cost lives in the left pane.
- Subitems sum to their line: `$3,928.69 + $6,660.13 = $10,588.82`.
  Lines sum to the total: `$10,588.82 + $3,641.69 + $3,269.49 = $17,500.00`.
