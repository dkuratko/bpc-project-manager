# Project Browser — REVISION 2
Supersedes revision 1 where they differ. Window, menu, toolbar, filter band and
status bar are unchanged.

---

## 1 · Darker ramp

Rev 1's tints were too pale. Same hues, more saturation — all still light
enough for 11 px black text.

```
 1–5   quoting                                   #ffffff   white
 6–7   Accepted · Awaiting delivery              #c8e6c9   green
 8     Equipment received                        #f5f0c0   light yellow
 9     Scheduled                                 #f0e08a   yellow
10     Active                                    #f4c7d4   pink
11–12  Invoice sent · Completed, payment req     #f7cfa0   orange
13–15  Paid · Warranty · Completed               #e0b0b0   red

PROBLEM                                          #ffadad   brighter red
       + 3 px #a00 left-edge bar + flag + Status text in #a00
```

Done-red is duller and browner; problem-red is brighter and pinker. With the
edge bar and red text on top, they read apart.

## 2 · New column order

```
col            w      project row                version row
──────────────────────────────────────────────────────────────────────────
±              20     − / +                      blank
Project       112     26-10                      26-10A0   indented, monospace
Status        190     rollup + colour chip       its own + colour chip
Name          flex    San Tan Shade Installation the version's scope line
Customer      150     Exerplay, Inc.             blank
Contact       130     Grant Smith                blank
Location      112     Gilbert, AZ                blank
Versions       58     3                          blank
Value         104     BLANK                      this version's sell
GM %           54     BLANK                      this version's GM
Date           84     see §5                     the version's date
Flags          44     rolled up, max 3           its own
```

**Value and GM% are blank on project rows.** A project has no value — its
versions do. That is more honest than any rollup and it removes the whole
grey-versus-black question from rev 1.

**Version rows carry the full reference** — `26-10A0`, not `A0`.

**Status moves to second**, right after the number, because it is what you scan
for.

## 3 · Selection is grey, and the status colour survives it

Navy hid the row colour. Selection becomes **`#c0c0c0` with black text**, which
also matches the estimate editor — one selection colour across the app.

To keep the status readable under selection, the **Status cell carries a colour
chip**: a 9 × 9 px square of the status tint with a 1 px `#808080` border, sitting
before the text.

```
  ▪ SCHEDULED            chip is #f0e08a
  ▪ AWAITING DELIVERY    chip is #c8e6c9
```

Row tint and chip always agree. Under selection the tint is replaced by grey and
**the chip is what tells you where the job stands.**

## 4 · No inset panel — unchanged from rev 1

Versions expand as ordinary indented rows in the same table, same columns.
Actions live on a right-click menu.

## 5 · `Date` — rename, and a question

Rev 1 called it `Next`, which explains nothing. It is **the one date that
matters for the current status**:

```
Sent, awaiting ........  the expiry date
Awaiting delivery .....  the expected ship date
Scheduled .............  the install date
Invoice sent ..........  the invoice date
Warranty ..............  the expiry date
everything else .......  blank
```

★ **Keep it or drop it?** The counters already surface what is urgent, so this
column may be redundant. It is one column either way.

---

## 6 · The five counters — ★ tell me what you want here

Rev 1 had `Quoting · Awaiting delivery · Scheduled this week · Unpaid ·
Quotes expiring`. You want them changed but have not said to what.

A starting proposal, mapped to the statuses that now drive the row colours:

```
Quoting             Awaiting delivery      Scheduled
$151,440.00         2 jobs                 1 job
6 versions out      earliest 19 Sep        22 Sep

Unpaid              Problems
$5,390.00           2
1 invoice · 4 days  1 no equipment · 1 blocked
```

Each is a filter. Overwrite any of them.

---

## Render exactly this

```
tint    ±  Project   Status                 Name                             Customer          Contact       Location      Vers  Value       GM%   Date     Flags
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
orange  +  26-07     ▪ INVOICE SENT         The Cypress at South Mountain    Exerplay, Inc.    Grant Smith   Phoenix, AZ    1                       04 Sep   !
prob    +  26-09     ▪ SCHEDULED            Dobson Park Ramadas              Exerplay, Inc.    Grant Smith   Chandler, AZ   2                       22 Sep   !
pink    +  26-08     ▪ ACTIVE               Doris J. Thompson Fitness        Exerplay, Inc.    Grant Smith   Tucson, AZ     1                       02 Oct
white   −  26-10     ▪ Quoting              San Tan Shade Installation       Exerplay, Inc.    Grant Smith   Gilbert, AZ    3                       07 Oct
white         26-10A0  ▪ Not sent           PlayBooster + hip shade                                                              $17,500.00  28.8
white         26-10A1  ▪ Sent, awaiting     + bench, moved ramp                                                                  $18,240.00  28.7   07 Oct   $
white         26-10B0  ▪ Not sent           Shade only                                                                            $4,180.00  28.0
green   +  26-11     ▪ AWAITING DELIVERY    Desert Ridge HOA — PlayBooster   Desert Ridge HOA  Marla Whitfield Phoenix, AZ  2                       19 Sep   ⚑
white   +  26-12     ▪ Quoting              Verrado Elementary — Ramada Add  Litchfield ESD    Dana Ruiz     Buckeye, AZ    1                       11 Sep   $
white   +  26-13     ▪ Quoting              Riparian Preserve — Nature Play  Town of Gilbert   Alan Cortez   Gilbert, AZ    1
prob    +  26-14     ▪ Quoting · blocked    Skyline HS — Bleacher Shade      Mesa USD          Priya Nand    Mesa, AZ       2                                !
```

```
26-10  EXPANDED and SELECTED — grey #c0c0c0, black text, chip still visible
26-09  PROBLEM #ffadad + red edge bar + "SCHEDULED" in #a00 — scheduled,
       no equipment on the lot
26-14  PROBLEM — blocked from issuing
Value and GM% appear ONLY on version rows
▪ is the colour chip, not a character — draw a 9 × 9 px square
```

Default sort: project number ascending. Header click flips.
