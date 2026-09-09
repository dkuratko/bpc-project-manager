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

**Selection is `▶` plus a 1 px dotted black rectangle around the row. No fill.**
The status tint is never covered. There are **no colour chips** — they only
existed to survive a cursor that filled the row, and that cursor is gone.

A problem also shows its flag glyph and puts the Status text in `#a00`.

## Expansion

Versions become ordinary indented rows in the same table. No inset box, no
sub-table, no action buttons. Actions live on a **right-click menu**:

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
     white        26-10A1  Sent, awaiting      + bench, moved ramp                                                                     $18,240.00   28.7  $
     white        26-10B0  Not sent            Shade only                                                                               $4,180.00   28.0
     blue    +  26-11     AWAITING DELIVERY    Desert Ridge HOA — PlayBooster   Desert Ridge HOA  Marla Whitfield  Phoenix, AZ    2                        ⚑
     white   +  26-12     Quoting              Verrado Elementary — Ramada Add  Litchfield ESD    Dana Ruiz        Buckeye, AZ    1                        $
     white   +  26-13     Quoting              Riparian Preserve — Nature Play  Town of Gilbert   Alan Cortez      Gilbert, AZ    1
  ▌  white   +  26-14     Quoting · blocked    Skyline HS — Bleacher Shade      Mesa USD          Priya Nand       Mesa, AZ       2                        !
```

```
gut     the 14 px gutter. ▶ = selected, ▌ = 4 px #CC0000 problem lip.
        NOT a column header — leave it unlabelled.
26-10   SELECTED — ▶ in the gutter + dotted rectangle. NO fill.
        row tint stays white. expanded.
26-09   GREEN row with a red lip — scheduled, no equipment on the lot.
        the row keeps its real phase; the lip says it is wrong.
26-14   WHITE row with a red lip — blocked from issuing.
        Status text on both problem rows is #a00.
```

Default sort: **project number ascending**. Header click flips.

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
