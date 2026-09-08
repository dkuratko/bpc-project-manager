# Exploration brief — ESTIMATE DOCUMENT PANE, ten approaches

**This brief deliberately breaks the usual "one screen per render" rule.**
Produce **ten variants on one canvas**, stacked vertically, so they can be
compared and one chosen. Nothing here is final; the winner gets integrated and
tweaked afterwards.

---

## What is being explored

Only the **right-hand pane of the Estimate editor** — the document itself.
Not the window, not the menu, not the toolbar, not the left-hand cost objects
pane, not the price bar. Just the pane, ten times.

Three attempts have failed. v1 made every value a permanent sunken input box —
a form, not a document. v3 made it a typed table, which is closer but still
reads as data entry rather than as the thing Grant Smith will actually receive.
So this time: ten genuinely different structures, not ten skins.

---

## Rules for all ten

```
WIDTH        each variant ~800 px, the pane's real width. all identical, so
             they can be compared fairly.
LANGUAGE     Windows 2000 throughout. Tahoma 11px. #c0c0c0 chrome, white
             sunken content areas, the standard bevels. money right-aligned
             Lucida Console with $ and two decimals.
CONTENT      the SAME content in every variant — the estimate below. no
             variant may drop, add or reword anything.
LABEL        each variant preceded by a black tag with its letter and a
             one-line description, e.g.  [ D ]  Group box per line
SPACING      40 px of teal between variants so they read as separate options.
```

## The content — identical in all ten

```
LINE      INSTALLATION of Design #4471                            $10,588.82
  sub       Play structure                                         $3,928.69
  sub       Posts and footings                                     $6,660.13
  incl      installed per manufacturer's installation drawings

LINE      Shade and site furnishings                                $3,641.69
  excl      footings not installed, to be installed before arrival by
            others, verified level and within 1/4 in over 10 ft
  option    Footing installation                                    $1,045.00

LINE      Site work                              ✎ overridden       $3,269.49
  excl      permits and permit fees by others

JOB LEVEL
  excl      private utility locating by others
  option    Private utility line locate                             $1,200.00

                                              TOTAL                $17,500.00
```

The long exclusion **must wrap to at least two lines** in every variant. If a
variant cannot show a sentence without truncating it, that variant has failed
and the failure should be visible.

---

## The ten

**[ A ] Typed table** — baseline, as built in v3. Columns `▾ · Type · Description ·
Amount`. LINE and JOB LEVEL as `#dfdfdf` bands. Included so the others have
something to beat.

**[ B ] Printed document** — render it as the estimate the customer receives.
White page, a heading, line items with leader dots, notes as indented
paragraphs, a ruled total. Editing happens in place but it always looks like
the output. No Type column, no grid.

**[ C ] Outline left, detail right** — split the pane. A narrow tree on the left
showing only lines and their amounts. On the right, a detail panel for the
selected line: its subitems in a small table, and its inclusions, exclusions and
options in proper multi-line text areas.

**[ D ] Group box per line** — each estimate line is its own sunken group box
with the line name as its legend and the amount at its top right. Inside it, the
subitems, notes and options. Stacked down the pane. Pure Win2000 — it is just
group boxes, which this app already uses everywhere.

**[ E ] Line table, tabbed detail** — a compact table of lines only at the top.
Beneath it, a tab strip for the selected line: `Subitems · Inclusions ·
Exclusions · Options`, each tab a small table of its own.

**[ F ] Money and prose separated** — the table carries only rows that have an
amount: lines, subitems, options. Inclusions and exclusions move to a second
panel beneath, listed with the line each belongs to. Numbers never share a grid
with sentences.

**[ G ] Explorer tree** — no Type column at all. Type is carried by a small icon
and indent depth, the way a file tree works. Amounts in a right-hand column.
Denser than A.

**[ H ] Spreadsheet grid** — row numbers down the left, visible cell borders,
one cell showing a focused edit box with a caret. Tab moves cell to cell.
Frankly Excel-like.

**[ I ] Listbox and property sheet** — lines in a classic listbox on the left.
On the right, a property sheet for the selected line: labelled fields, and a
genuine multi-line edit box for notes with its own scrollbar.

**[ J ] Sections with prose** — no Type column and no grid lines. Each line is a
bold heading with its amount right-aligned; subitems indented beneath; notes as
indented italic prose in grey with a ✓ or ✗ leader. Options as a `＋` line.
Reads as a document, edits as a list.

---

## What to judge them on

Not prettiness. The winner has to survive:

```
1  a 40-word exclusion that wraps
2  a line with six subitems
3  a job with nine lines
4  being read by someone who is deciding whether to discount one line
5  looking like it belongs in the same application as the Scope tab
```

Include the same three lines in every variant so 2 and 3 can be judged by
extrapolation.
