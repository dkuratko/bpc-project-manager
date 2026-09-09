# Design brief — PROJECT BROWSER
The application frame. **MAIN**, the first thing you see on launch.
Apply `03f-money-formatting.md` and `08-status-colours.md`.

**Style reference:** `docs/design/reference/ideas-5a-projects-main-page.dc.html`
Take its *look* — window chrome, toolbar, filter band, counter tiles, expandable
rows, flag legend in the status bar, dense Win2000 table. **Not its content.**
5a predates the model.

---

## ⛔ SCOPE

One screen. The frame and its list. No child windows, no dialogs, no open menus.

## ⛔ RENDER THE VALUES LITERALLY

Every figure, status and colour below is final.

---

## What 5a gets wrong — do not reproduce

```
"Current estimate" column .... does not exist. every version is a standing
                               offer and several can be approved.
"Won · B0" ................... not a status.
"renditions A0 / A1" ......... A0 and A1 are VERSIONS under option A. an
                               option is a letter and nothing else.
"Type" / "Due" filters ....... not in the model.
inset panel on expansion ..... no. versions expand as ordinary rows.
BPCp 26-245 .................. the browser shows the bare number: 26-10
```

---

## Window & layout

**1420 px.** Menu with accelerator underlines.

```
title bar .... Build Play Contracting — Project Manager
menu ......... File Edit View Project Version Catalog Reports Window Help
toolbar ...... New project · New version ‖ Open · Duplicate…
               ‖ Catalog ▸ · Contacts · Vehicles     right: Estimator [ ▼ ]
filter band .. Find [ ] Customer [ ▼ ] Status [ ▼ ]
               ☑ Show versions  ☐ Show completed     right: Saved views ▼
counters ..... five tiles, equal width, each a filter
list ......... sunken white, bevelled header
status bar ... hints + flag legend  │  count + view
```

## The five counters

Raised `#c0c0c0` tiles — grey label, big monospace figure, grey sub-line.
Warning sub-lines in `#a00`.

```
Awaiting answer        Won, in progress       Scheduled this week
$46,880.00             $137,529.00            1 job
2 sent · oldest 28 Aug 4 jobs                 22 Sep · no equipment   ← #a00

Unpaid                 Problems
$5,390.00              2
1 invoice · 4 days     1 no equipment · 1 blocked   ← #a00
```

## Columns

| col | w | project row | version row |
|---|---|---|---|
| *(gutter)* | 14 | `▶` selected · `▌` problem | same |
| ± | 20 | − / + | blank |
| Project | 112 | `26-10` | `26-10A0` indented, monospace |
| Status | 190 | rollup | its own |
| Name | flex | project name | the version's scope line |
| Customer | 150 | ✓ | blank |
| Contact | 130 | ✓ | blank |
| Location | 112 | ✓ | blank |
| Versions | 58 | count | blank |
| Value | 104 | **blank** | this version's sell |
| GM % | 54 | **blank** | this version's GM |
| Flags | 44 | rolled up, max 3 | its own |

**Value and GM% never appear on a project row.** A project has no value — its
versions do. Expand to see money.

## Status colour — row tint

Row tint is the ramp from `08-status-colours.md`:

```
 1–5   quoting                                #ffffff   white
 6–7   Accepted · Awaiting delivery           #7FB3E0   blue
 8     Equipment received                     #A6DE9B   light green
 9     Scheduled                              #6BC96B   green
10     Active                                 #FFE24D   yellow
11     Invoice sent, payment required         #FFA94D   orange
12–14  Paid · Warranty · Completed            #F5766E   red
```

**A red row always means finished.** Problems never tint a row.

## Gutter, problem lip and cursor

A **14 px gutter** sits left of the `±` column and carries both:

```
▶   black, on the selected row
▌   a 4 px #CC0000 lip — this row has a problem
```

**Selection is `▶` in the gutter, a 2 px solid black rectangle around the row,
and a 15% black wash over the row's own tint.** The tint darkens; it is never
replaced. There are **no colour chips** — they existed only to survive a cursor
that hid the row colour, and this one does not.

### The selected row is shaded, not filled

A **15% black wash** over whatever tint the row already has. It darkens rather
than replaces, so the status colour survives selection.

```
rgba(0, 0, 0, 0.15)  over the row's own tint
```

Computed, so there is no ambiguity if alpha renders oddly:

```
tint            normal      selected
────────────────────────────────────
white           #ffffff  →  #d9d9d9
blue            #7FB3E0  →  #6C98BE
light green     #A6DE9B  →  #8DBD84
green           #6BC96B  →  #5BAB5B
yellow          #FFE24D  →  #D9C041
orange          #FFA94D  →  #D99041
red             #F5766E  →  #D0645E
```

All still take 11 px black text. **The three signals stack** — arrow in the
gutter, 2 px black rectangle, and the shaded row — so selection is obvious from
across the screen while the status is still legible on the row itself.


A problem also shows its flag glyph and puts the Status text in `#a00`.

## Expansion

Versions become ordinary indented rows in the same table. No inset box, no
sub-table, no action buttons.

### Two weights of divider

```
between VERSIONS   1 px #d0d0d0        A0 → A1
between OPTIONS    1 px #808080        A1 → B0, plus 3 px extra space
                                       above and below
```

Both are hairlines. The difference is **darkness and breathing room**, not
thickness — a thick rule reads as a section break and an option is a smaller
thing than that.

An option is a letter and nothing else — a divider so the version list stays
readable — so the heavier rule just draws the thing it already is. No divider
above the first version or below the last.

Actions live on a **right-click menu**:

```
   Open version
   New version
   Record approval…
   ─────────────────
   Post cost ▸
   ─────────────────
   Delete
```

Do not render the menu open.

---

## Render exactly this

```
gut  tint    ±  Project   Status               Name                             Customer          Contact          Location      Vers  Value        GM%   Flags
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
     orange  +  26-07     INVOICE SENT         The Cypress at South Mountain    Exerplay, Inc.    Grant Smith      Phoenix, AZ    1                        !
  ▌  green   +  26-09     SCHEDULED            Dobson Park Ramadas              Exerplay, Inc.    Grant Smith      Chandler, AZ   2                        !
     yellow  +  26-08     ACTIVE               Doris J. Thompson Fitness        Exerplay, Inc.    Grant Smith      Tucson, AZ     1
▶    white   −  26-10     Quoting              San Tan Shade Installation       Exerplay, Inc.    Grant Smith      Gilbert, AZ    3
     white        26-10A0  Not sent            PlayBooster + hip shade                                                                 $17,500.00   28.8
     ────────────────────────────────────────  1 px #d0d0d0 — between versions
     white        26-10A1  Sent, awaiting      + bench, moved ramp                                                                     $18,240.00   28.7  $
     ────────────────────────────────────────  1 px #808080 + spacing — option A ends, B begins
     white        26-10B0  Not sent            Shade only                                                                               $4,180.00   28.0
     blue    +  26-11     AWAITING DELIVERY    Desert Ridge HOA — PlayBooster   Desert Ridge HOA  Marla Whitfield  Phoenix, AZ    2                        ⚑
     white   +  26-12     Quoting              Verrado Elementary — Ramada Add  Litchfield ESD    Dana Ruiz        Buckeye, AZ    1                        $
     white   +  26-13     Quoting              Riparian Preserve — Nature Play  Town of Gilbert   Alan Cortez      Gilbert, AZ    1
  ▌  white   +  26-14     Quoting · blocked    Skyline HS — Bleacher Shade      Mesa USD          Priya Nand       Mesa, AZ       2                        !
```

```
gut     the 14 px gutter. ▶ = selected, ▌ = 4 px #CC0000 problem lip.
        NOT a column header — leave it unlabelled.
26-10   SELECTED — ▶ in the gutter, 2 px solid black rectangle, and the row
        shaded to #d9d9d9 (white tint at 15% black). expanded.
26-09   GREEN row with a red lip — scheduled, no equipment on the lot.
        the row keeps its real phase; the lip says it is wrong.
26-14   WHITE row with a red lip — blocked from issuing.
        Status text on both problem rows is #a00.
```

### Sorting

**Default: project number ascending.** Any header click sorts by that column;
clicking the same header again reverses.

**Clicking `Status` sorts by lifecycle position, 1 → 14** — not alphabetically.
The list comes out as the ramp itself:

```
white      quoting, drafts, expired, blocked
blue       accepted · awaiting delivery
light grn  equipment received
green      scheduled
yellow     active
orange     invoice sent
red        paid · warranty · completed
```

Projects sort by their **rollup** status. Versions stay nested under their
project in option-and-version order regardless of the sort — the sort orders
projects, never versions.

### Flags

```
!  scheduled, no equipment      26-09       ⚑  change order pending    26-11
!  invoice unpaid, 4 days       26-07       $  quote expiring          26-12 · 26-10A1
!  blocked from issuing         26-14
```

Max three per row; a fourth renders `+2`, rest on hover.

### Status bar

```
Enter opens a version · → expands · Ctrl+N new project
! blocked or overdue · ⚑ change order · $ quote expiring   │   8 of 42 · view: Open
```

---

## Rules

- **A project has no status of its own.** The Status column is a rollup — the
  approved version's state when there is one, otherwise `Quoting`.
- **No money on project rows.** Value and GM% are version-level only.
- **Every flag is derived**, never typed.
- Money carries `$` and two decimals. GM% one decimal, no sign.
- Counters are filters.
