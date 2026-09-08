# Estimate pane — LEGIBILITY REBUILD
Applies to the right pane. Same content, same reference documents, same
Win2000 language. **The problem is that everything collides. This brief is
about space, not structure.**

Read with `05b-estimate-pane-final.md` for content; where they disagree, this
one wins.

---

## Why it looks jumbled

The reference PDFs are a wide printed page with a lot of air between the text
and the numbers. The pane is about **780 px** with **11 px Tahoma**. Dropped in
unchanged, the text runs into the money columns, the four kinds of indented
text all look alike, and rules appear between things that belong together.

Three rules fix it.

---

## RULE 1 — a hard money gutter

Split the pane into two zones with a **1 px `#e0e0e0` vertical rule** running
the full height of the table.

```
│←──────────── TEXT ZONE, 488 px ────────────→│←──── MONEY GUTTER, 284 px ────→│
│                                             │   QTY 76  UNIT 100  AMOUNT 108 │
```

**Text never enters the gutter. Money never leaves it.** Every title, note,
description and chip wraps inside 488 px. That single constraint removes most
of the confusion, because the eye gets one reliable place to find a number.

12 px of padding on the gutter's left edge.

## RULE 2 — a strict indent ladder

Four levels, no exceptions. Each is a fixed left offset inside the text zone.

```
 0 px   chips row
 0 px   LINE TITLE                       bold black
 0 px   line note                        olive italic
────────────────────────────────────────────────────── tint band starts
18 px   ↳ SUB-ITEM TITLE                 bold black
18 px   ↳ ( Optional ) OPTION TITLE      grey
34 px   description                      plain #707070, no marker
34 px   *note                            olive italic, * marker
────────────────────────────────────────────────────── tint band ends
```

A line's own note sits at **0 px**, not indented — it belongs to the line, not
to a child. That is what currently makes it read as a sub-item.

## RULE 3 — rules only between line groups

A `#d8d8d8` hairline goes **between one line group and the next, and nowhere
else.** Never between a line and its own note, sub-item or option. Those are
one unit and must look like one.

16 px of space above each hairline, 16 px below.

---

## Vertical rhythm

```
chips row → title ..............   3 px
title → line note ..............   5 px
line note → tint band ..........   8 px
inside band, top and bottom ....   9 px
sub-item title → description ...   4 px
description → note .............   4 px
between line groups ............  16 px · hairline · 16 px
money rows, vertical padding ...   4 px   (the row is already tall enough)
```

## Chips are metadata, not buttons

Shrink them. **9 px** text, `2 px 7 px` padding, fill `#eeeeee`, 1 px `#d0d0d0`
border, text `#555`, 4 px gap between two chips. They should read as a quiet
caption above the title — at 11 px with button-sized padding they currently
compete with it.

## The money block aligns to the title, not the note

The QTY / UNIT PRICE / AMOUNT for a line sits vertically centred against the
**chips row + title row** as one unit. It does not drift down past the note.

## Type

```
LINE TITLE .......  11 px Tahoma BOLD, #000
chips ............   9 px Tahoma, #555
line note ........  11 px Tahoma ITALIC, #8a7538
sub-item title ...  11 px Tahoma BOLD, #000
option title .....  11 px Tahoma, #909090
description ......  11 px Tahoma, #707070
money ............  11 px Lucida Console
   line amount ...  BOLD #000        ·  line qty / unit price ...  #000
   sub-item amount  BOLD #000        ·  sub-item qty / unit .....  #909090
   option, all ...  #909090, amount prefixed "+"
   unit half ("/ EA") always #a0a0a0
```

---

## The result, to scale

```
ACTIVITY                                    │      QTY   UNIT PRICE      AMOUNT
════════════════════════════════════════════╪═══════════════════════════════════
(Installation)(Design)                      │        —   $10,588.82  $10,588.82
INSTALLATION of Design #4471                │
*Site graded not included. Site is to be    │
 prepped before arrival.                    │
 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
 ▓  ↳ Landscape Structures PlayBooster      │   1 / EA    $6,660.13   $6,660.13
 ▓    PB-4400 Installation                  │
 ▓      Six posts direct-buried, decks,     │
 ▓      slide, panels and hardware          │
 ▓      *Permitting is not included.        │
────────────────────────────────────────────┼───────────────────────────────────
(Installation)(Shade)                       │   1 / EA    $3,138.57   $3,138.57
SHADE SYSTEMS 24'x24'x12' Hip Shade         │
[#HIP-242412] Installation [SM]             │
*Footings not installed, to be installed    │
 before arrival by others, verified level   │
 and within 1/4 in over 10 ft.              │
 ▓  ↳ (Optional) Footing installation       │   4 / EA      $261.25  + $1,045.00
 ▓      *Priced assuming each footing is    │
 ▓       3'x12'. Rebar cage included.       │
────────────────────────────────────────────┼───────────────────────────────────
```

Long titles **wrap inside the text zone**. They never truncate and never reach
the gutter.

The tint band spans the full pane width, crossing the gutter, so a sub-item's
money is visibly part of the band it belongs to.

---

## Rules this render must not break

- **Nothing crosses the gutter rule** except a tint band.
- **A line and its children are one visual unit** — no hairline inside a group.
- **The four indent levels are exact.** 0 / 18 / 34, and a line's own note at 0.
- **Everything wraps. Nothing truncates.** Two titles and two notes in the
  sample above run to more than one line; they must render that way.
- Sub-item amounts are **included** in the line above; option amounts carry a
  **+** and are **excluded**. Sub-items need not sum to their line.
- Still Win2000 — Tahoma, the group box, the sunken white ground, the `#dfdfdf`
  footer add-row. Only the *spacing* comes from the PDF.
