# Project Browser — REVISION 1
Applies to `docs/07-project-browser.md`. Five changes. Everything else stands.

---

## 1 · Status colours — see `docs/08-status-colours.md`

Row tint is the **full ramp**, one tint per status group, not four phases:

```
 1–5   quoting — draft · created · sent · expired · blocked   #ffffff  white
 6–7   Accepted · Awaiting delivery                           #dff0d8  green
 8     Equipment received                                     #fdf6d3  light yellow
 9     Scheduled                                              #fbeeb0  yellow
10     Active                                                 #f8dde4  pink
11–12  Invoice sent · Completed, payment required             #fbe0c4  orange
13–15  Completed paid · Warranty · Completed                  #f5d0d0  red

PROBLEM  #ffe0e0  OVERRIDES the phase tint, and adds a 3 px #a00 left-edge
                  bar, the flag glyph, and Status text in #a00
```

Colour tracks **position**, not meaning — green early, red late. Red serves
both *finished* and *problem*; the edge bar and red status text are what
separate them.

**When a project is expanded, both rows are tinted** — the project row by its
rollup status, each version row by its own.

## 2 · Tints replace alternating stripes

You asked for stripes *or* something better. This is the something better:
stripes carry no information, tints carry status. Adding both would have them
fight.

Rows are separated instead by the **project row being visually heavier** —
bold, and a `#c0c0c0` left edge marker 3 px wide running its full height. That
is what groups the list, not banding.

## 3 · Drop the `p` from the displayed number

Show `26-10`, not `BPCp-26-10`. The classifier stays in the data and on
documents — `BPCe-26-10A0` is still the estimate's reference — but the browser
shows the bare number. The column header reads `Project`; nothing is lost.

## 4 · Default sort is project number

Ascending, `26-07` first. Clicking the header flips it. No other column is the
default sort.

## 5 · No inset panel — expand into the same table

Delete the bordered box, the nested sub-table and the action button row.
**A version renders as an ordinary indented row in the main list**, using the
main columns — exactly how scope groups expand on the Scope tab.

```
col          project row                    version row
────────────────────────────────────────────────────────────────
±            − or +                         blank
Project      26-10                          A0   indented 22 px, monospace
Name         San Tan Shade Installation      PlayBooster + hip shade
Customer     Exerplay, Inc.                  blank
Location     Gilbert, AZ                     blank
Versions     3 · none approved               blank
Value        rollup, grey when unapproved    this version's sell
GM %         rollup                          this version's GM
Status       rollup                          this version's own status
Next         soonest across versions         this version's date
Flags        rolled up, max 3                this version's flags
```

The actions that were in the panel move to a **right-click menu** on a version
row, matching the estimate editor:

```
   Open version
   New version
   Record approval…
   ─────────────────
   Post cost ▸
   ─────────────────
   Delete
```

Do not render the menu open. The site summary line (`Site: hard clay · swell
1.25 · access ×1.30`) belongs on the Version View, not here.

---

## Render exactly this

```
tint  ±  Project  Name                            Customer          Location      Versions           Value        GM%   Status                    Next     Flags
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
orange+  26-07    The Cypress at South Mountain   Exerplay, Inc.    Phoenix, AZ   1 · A0 approved    $5,390.00   21.0   INVOICE SENT             04 Sep    !
prob  +  26-09    Dobson Park Ramadas             Exerplay, Inc.    Chandler, AZ  2 · A0 approved   $15,250.00   22.4   SCHEDULED                22 Sep    !
pink  +  26-08    Doris J. Thompson Fitness       Exerplay, Inc.    Tucson, AZ    1 · A0 approved   $25,969.00   19.1   ACTIVE                   02 Oct
white −  26-10    San Tan Shade Installation      Exerplay, Inc.    Gilbert, AZ   3 · none approved $17,500.00   28.8   Quoting · 1 not sent     07 Oct
white       A0    PlayBooster + hip shade                                                           $17,500.00   28.8   not sent
white       A1    + bench, moved ramp                                                               $18,240.00   28.7   sent 07 Sep              07 Oct    $
white       B0    Shade only                                                                         $4,180.00   28.0   not sent
green +  26-11    Desert Ridge HOA — PlayBooster  Desert Ridge HOA  Phoenix, AZ   2 · B0 approved   $96,310.00   19.1   AWAITING DELIVERY        19 Sep    ⚑
white +  26-12    Verrado Elementary — Ramada Add Litchfield ESD    Buckeye, AZ   1 · none approved $28,640.00   22.4   Quoting · sent 28 Aug    11 Sep    $
white +  26-13    Riparian Preserve — Nature Play Town of Gilbert   Gilbert, AZ   1 · none approved $43,900.00   20.8   Quoting · not sent
prob  +  26-14    Skyline HS — Bleacher Shade     Mesa USD          Mesa, AZ      2 · none approved $61,400.00   15.2   Quoting · blocked                  !
```

The `tint` column is **not a column** — it names the row's background. Do not
draw it.

```
26-10  EXPANDED and SELECTED — navy, white text, tint suppressed under
       selection as any Win2000 list does
26-09  PROBLEM #ffe0e0 + red edge bar + "SCHEDULED" in #a00
       scheduled with no equipment on the lot
26-14  PROBLEM #ffe0e0 + red edge bar — blocked from issuing
26-07  orange · 26-08 pink · 26-11 green · 26-12/13 white
Value and GM% are GREY on every "none approved" row, black on approved ones
```

---

## Unchanged

Window 1420 px, menu, toolbar, filter band, the five counters, the flag legend
and status bar, the column set, and every figure. Money keeps `$` and two
decimals; GM% one decimal.
