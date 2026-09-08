# Estimate Editor — REVISION 1
Applies to `v1 - Estimate Editor`. **The left pane, window chrome, context strip,
tip block and price bar are all correct and unchanged.**

**Redo the right pane — "The estimate" — entirely.**

---

## What is wrong with it

```
1  EVERY value is a permanently sunken input box. Fourteen boxes floating in
   white. It reads as a form to fill in, not as a document you are writing.

2  Inclusions and exclusions are ONE-LINE fields that truncate with an ellipsis.
   A real exclusion is a sentence — "footings not installed, to be installed
   before arrival by others, verified level and within 1/4in over 10ft" — and
   it must wrap and be fully readable.

3  Nothing shows which row is SELECTED, so the toolbar's Inclusion / Exclusion /
   Add option buttons have no visible target.

4  There is no way to add anything without going up to the toolbar.

5  Dotted leaders (document) and sunken fields (form) fight each other.
```

---

## The model: an outline, not a form

**Text is plain until you click it.** Like renaming a file in Explorer: the row
shows ordinary text on white, and only the cell you are actually editing becomes
a sunken field. That single change is most of the fix.

Selection is a classic full-row highlight — `#000080` ground, white text.

```
▾  INSTALLATION of Design #4471 ..............................  $10,588.82
       Play structure ........................................   $3,928.69
       Posts and footings ....................................   $6,660.13
       ✓  installed per manufacturer's installation drawings
       ＋ subitem    ＋ inclusion    ＋ exclusion    ＋ add option

▾  Shade and site furnishings ................................   $3,641.69
       ✗  footings not installed, to be installed before arrival by
          others, verified level and within 1/4 in over 10 ft
       ＋  Footing installation ..............................   $1,045.00

▾  Site work ....................... ✎ overridden ............   $3,269.49
       ✗  permits and permit fees by others

───────────────────────────────────────────────────────────────────────────
JOB LEVEL
       ✗  private utility locating by others
       ＋  Private utility line locate .......................   $1,200.00

                                              TOTAL ..........  $17,500.00
```

### Row kinds

```
LINE        bold, collapsible triangle, amount right-aligned bold
SUBITEM     indented, plain weight, amount right-aligned
INCLUSION   ✓ in dark green, then WRAPPING text, grey-black. no amount.
EXCLUSION   ✗ in black, then WRAPPING text. no amount.
ADD OPTION  ＋ then label and amount, both plain weight
```

Notes wrap to as many lines as they need and hang-indent under the mark.
**Never truncate a note.**

### The inline add row

Under the **selected** node only, a single low-contrast row:

```
＋ subitem    ＋ inclusion    ＋ exclusion    ＋ add option
```

Small grey text, no button bevels — it should read as an affordance, not
furniture. It appears on whichever node is selected and nowhere else. The
toolbar buttons do the same thing for people who prefer the menu.

### JOB LEVEL

Not a line. A separated section beneath all the lines, above the total, with a
horizontal rule above it and the heading `JOB LEVEL` in bold grey small caps.
It holds job-wide inclusions, exclusions and add options. It has **no amount of
its own** — its add options carry their own prices.

---

## Render these states

To show the editing model without a second screen:

- **`Shade and site furnishings` is the selected row** — full-width navy
  highlight, white text, and its inline add row visible beneath its notes.
- **`Posts and footings` is being edited** — that one label sits in a sunken
  white field with a text cursor. Everything else is plain text.
- Its exclusion runs to **two wrapped lines**, so the wrapping is visible.
- All three lines expanded.

---

## Assigning cost objects to a line

Missing from v1 entirely, and it is the core act of this screen. Add a narrow
vertical strip **between the two panes**, about 34 px wide, holding two small
buttons stacked at the vertical centre:

```
   Assign  →
   ←  Unassign
```

Select rows in the left pane, select a line on the right, click `Assign →`.
Both buttons are **greyed** in this render, since nothing is selected in the
left pane.

---

## Unchanged

Window, menu, toolbar, context strip, the `2 problems` chip, the whole left
pane, the tip block, and the price bar with `COMPUTED $17,932.98` /
`QUOTED $17,500.00` / `effective markup 16.98%` / `▼ −$432.98`.

Every figure stays exactly as it is. `$` and two decimals throughout.
Subitems still sum to their parent: `$3,928.69 + $6,660.13 = $10,588.82`.
