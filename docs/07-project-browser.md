# Design brief — PROJECT BROWSER
The application frame. **MAIN**, and the first thing you see on launch.
Apply `03f-money-formatting.md`.

---

## ⛔ SCOPE

One screen. The frame with its list. No child windows floating over it, no
dialogs, no menus open. One state.

## ⛔ RENDER THE VALUES LITERALLY

Every figure and date below is final.

---

## What it is

The MDI frame's client area **is** the project browser. You launch the app and
see your jobs; opening a version floats a child window over this.

**Rows expand.** A project is a container and the version is the job, so one
list shows both levels rather than a list and a separate drill-down. The
"what's happening this week" view is this same list with a different scope
selected — not another screen.

```
PROJECT ROW    the container. no status of its own — everything shown is
               rolled up from its versions.
VERSION ROW    the job. its own status, its own dates, its own money.
               double-click opens the Version View as a child window.
```

---

## Window

Full MDI frame at **1280 × 720**, teal desk visible only as a thin border —
this window is the application.

```
Build Play Contracting — Project Manager                      [_][□][×]
File   Edit   View   Project   Window   Help
[New project] [Open] ‖ [New estimate] ‖ [Refresh]
```

Menu is the frame's own: thin, as decided. Child windows carry their own.

---

## Layout

```
┌──────────────┬──────────────────────────────────────────────────────┐
│  SCOPE TREE  │  FILTER BAND                                         │
│  190 px      ├──────────────────────────────────────────────────────┤
│              │  THE LIST                                            │
│              │                                                      │
└──────────────┴──────────────────────────────────────────────────────┘
   STATUS BAR
```

### Scope tree — 190 px, sunken white, standard Win2000 tree

```
   All projects                    7
   ▾ Active                        3
       Awaiting delivery           1
       Scheduled                   1
       On site                     1
   Quoting                         3
   Completed, unpaid               1
   Warranty                        2
   Closed                          4
   ▸ By customer
   ▸ By year
```

`Scheduled` is the selected node — highlighted `#000080`, white text. Counts
right-aligned in grey.

### Filter band — `#c0c0c0`, one row, sunken border

```
Customer [ All            ▼]   Status [ All          ▼]   Find [            ]   ☐ Alerts only
```

### The list — sunken white, bevelled column header

| col | w | align |
|---|---|---|
| ▾ | 18 | centre |
| Project / Version | flex | left |
| Title | 250 | left |
| Customer | 130 | left |
| Site | 110 | left |
| Status | 190 | left |
| Value | 100 | right |
| Next | 76 | left |
| ⚠ | 24 | centre |

**Project rows** are bold with a `#dfdfdf` band, exactly the scope-group band
used on the Scope tab. **Version rows** are plain white, indented 22 px, with
their ref in monospace.

---

## Render exactly this

```
▾ BPC-26-10  San Tan Shade Installation      Exerplay, Inc.  Gilbert AZ
                                        1 approved · 3 quoted   $17,500.00  22 Sep  ⚠
    A0   quoted · sent 07 Sep · expires 07 Oct                   $17,500.00  07 Oct
    A1   quoted · not sent                                       $18,240.00
    A2   ★ APPROVED · SCHEDULED 22 Sep                           $17,500.00  22 Sep  ⚠
    B0   quoted · not sent                                        $4,180.00

▸ BPC-26-09  Dobson Park Ramadas             Exerplay, Inc.  Chandler AZ
                                        1 approved · 1 quoted   $15,250.00  18 Sep

▸ BPC-26-08  Doris J. Thompson Fitness       Exerplay, Inc.  Tucson AZ
                                        1 approved             $25,969.00  02 Oct

▸ BPC-26-07  The Cypress at South Mountain   Exerplay, Inc.  Phoenix AZ
                                        completed, unpaid       $5,390.00  invoice 04 Sep  ⚠

▸ BPC-26-06  Verrado Elementary Playground   Miracle SW      Buckeye AZ
                                        2 quoted                        —

▸ BPC-26-05  Desert Vista HOA Shade          Desert Vista HOA Scottsdale AZ
                                        warranty to 14 Mar 27  $11,400.00

▸ BPC-26-04  Kino Sports Complex Surfacing   Sundt (GC)      Tucson AZ
                                        warranty to 02 Jan 27  $38,750.00
```

`BPC-26-10` is **expanded**; every other project is collapsed.
Version `A2` is the **selected row** — `#c0c0c0` ground, black text. No navy
on a row; navy is menus only.

### The alerts

Two, both derived, never typed:

```
BPC-26-10 A2   ⚠  scheduled 22 Sep · equipment not received
                  Play Structure PS-4400 outstanding, ship date was 02 Sep
BPC-26-07      ⚠  invoice sent 04 Sep · 4 days
```

Render the first as a tooltip-styled `#ffffe1` block pinned beneath the list,
showing only the A2 alert since that row is selected.

### Status bar

```
7 projects · 3 active · 2 alerts                      Scheduled — 1 project
```

---

## Rules

- **A project row has no status of its own.** What it shows is a rollup —
  `1 approved · 3 quoted`, or the single state when there is only one.
- **Value on a project row is the approved money**, not the sum of every
  quoted version. A project with four quotes and one approval is worth what
  was approved. Projects with nothing approved show `—`.
- **Alerts are derived.** A scheduled version with no equipment on the lot is
  the most dangerous state in the business and must be visible from here.
- Money carries `$` and two decimals. Dates are `07 Sep`, `14 Mar 27` when the
  year is not this one.
- No navy on list rows. Selection is `#c0c0c0`.
