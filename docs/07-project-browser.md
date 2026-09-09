# Design brief — PROJECT BROWSER
The application frame. **MAIN**, the first thing you see on launch.
Apply `03f-money-formatting.md`.

**Style reference:** `docs/design/reference/ideas-5a-projects-main-page.dc.html`
Take its *look* — window chrome, toolbar, filter band, counter tiles,
expandable rows with an inset panel, flag legend in the status bar, dense
Win2000 table. **Do not take its content.** 5a predates most of the model and
its columns, statuses and vocabulary are wrong.

---

## ⛔ SCOPE

One screen. The frame and its list. No child windows over it, no dialogs,
no open menus. One state.

## ⛔ RENDER THE VALUES LITERALLY

Every figure, status and date below is final and comes from the current model.

---

## What 5a gets wrong — do not reproduce

```
"Current estimate" column .... there is no current estimate. every version is
                               a standing offer and several can be approved.
"Won · B0" ................... not a status. the lifecycle is listed below.
"renditions A0 / A1" ......... renditions do not exist. A0 and A1 are VERSIONS
                               under option A. an option is a letter and
                               nothing else.
"Type" and "Due" filters ..... neither is in the model.
"Multi-option proposal" ...... not a decided feature.
BPCp 26-245  (space) ......... hyphenated everywhere else: BPCp-26-10
```

## The vocabulary that IS current

```
PROJECT   BPCp-26-10   a container. no status of its own.
VERSION   A0 A1 B0     the job. approved independently. never dies.
DOCUMENTS BPCc- cost breakdown · BPCe- estimate · BPCi- invoice
          BPCco- change order · BPCpc- post cost

VERSION LIFECYCLE
   (none)                     a standing offer. no status before approval.
   ACCEPTED · AWAITING DELIVERY · EQUIPMENT RECEIVED · SCHEDULED · ACTIVE
   COMPLETED, PAYMENT REQUIRED · INVOICE SENT, PAYMENT REQUIRED
   COMPLETED, PAID · WARRANTY · COMPLETED
```

---

## Layout

```
title bar
menu ......... File Edit View Project Version Catalog Reports Window Help
toolbar ...... New project · New version ‖ Open · Duplicate…
               ‖ Catalog ▸ · Contacts · Vehicles       right: Estimator [ ▼ ]
filter band .. Find [ ] Customer [ ▼ ] Status [ ▼ ]
               ☑ Show versions  ☐ Show completed       right: Saved views ▼
counters ..... five tiles, equal width, each a filter
list ......... sunken white, bevelled header
status bar ... hints + flag legend   |   count + view
```

Window **1420 px**.

### The five counters

Raised `#c0c0c0` tiles — grey label, big monospace figure, grey sub-line.
Each is a filter. Two are warnings and carry `#a00` sub-lines.

```
Quoting              Awaiting delivery     Scheduled this week
$151,440.00          1 job                 1 job
4 projects           ships 19 Sep          no equipment on the lot   ← #a00

Unpaid               Quotes expiring
$5,390.00            1
1 invoice · 4 days   within 14 days                                  ← #a00
```

### List columns

| col | w | align |
|---|---|---|
| ± | 20 | centre |
| Project ▲ | 106 | left, monospace |
| Name | flex | left |
| Customer | 150 | left |
| Location | 112 | left |
| Versions | 108 | left |
| Value | 104 | right |
| GM % | 52 | right |
| Status | 168 | left |
| Next | 84 | left |
| Flags | 44 | centre |

**Value and GM% show approved money in black.** When nothing is approved they
show the most recent version's figures **in grey `#808080`** — a working
number, not committed money. That distinction is the whole point of the column
and must be visible.

---

## Render exactly this

```
− BPCp-26-10  San Tan Shade Installation      Exerplay, Inc.    Gilbert, AZ
                 3 · none approved   $17,500.00  28.8   Quoting · 1 not sent    07 Oct
                                        ↑ grey        ↑ grey
    ┌ inset ────────────────────────────────────────────────────────────────────┐
    │ Version  Scope                       Cost         Sell     GM   Estimate   │
    │ A0       PlayBooster + hip shade  $12,462.07  $17,500.00  28.8  not sent   │
    │ A1       + bench, moved ramp      $13,006.44  $18,240.00  28.7  sent 07 Sep│
    │ B0       Shade only                $3,011.90   $4,180.00  28.0  not sent   │
    │                                                                            │
    │ [Open version ▸] [New version] [Record approval…] [Post cost ▸]           │
    │                       Site: hard clay · swell 1.25 · access ×1.30          │
    └────────────────────────────────────────────────────────────────────────────┘

+ BPCp-26-09  Dobson Park Ramadas             Exerplay, Inc.    Chandler, AZ
                 2 · A0 approved   $15,250.00  22.4   SCHEDULED               22 Sep   !
+ BPCp-26-08  Doris J. Thompson Fitness       Exerplay, Inc.    Tucson, AZ
                 1 · A0 approved   $25,969.00  19.1   ACTIVE                  02 Oct
+ BPCp-26-11  Desert Ridge HOA — PlayBooster  Desert Ridge HOA  Phoenix, AZ
                 2 · B0 approved   $96,310.00  19.1   AWAITING DELIVERY       19 Sep   ⚑
+ BPCp-26-07  The Cypress at South Mountain   Exerplay, Inc.    Phoenix, AZ
                 1 · A0 approved    $5,390.00  21.0   INVOICE SENT            04 Sep   !
+ BPCp-26-12  Verrado Elementary — Ramada Add Litchfield ESD    Buckeye, AZ
                 1 · none approved  $28,640.00  22.4   Quoting · sent 28 Aug   11 Sep   $
+ BPCp-26-13  Riparian Preserve — Nature Play Town of Gilbert   Gilbert, AZ
                 1 · none approved  $43,900.00  20.8   Quoting · not sent
+ BPCp-26-14  Skyline HS — Bleacher Shade     Mesa USD          Mesa, AZ
                 2 · none approved  $61,400.00  15.2   Quoting · blocked                !
```

`BPCp-26-10` is **expanded and selected** — project row `#000080`, white text.
Grey Value and GM% on every `none approved` row; black on the approved ones.

### The flags

```
!  scheduled, no equipment on the lot     26-09   ← the dangerous one
⚑  change order pending approval          26-11
!  invoice unpaid, 4 days                 26-07
$  quote expiring within 14 days          26-12
!  blocked from issuing                   26-14
```

Max three glyphs per row; a fourth becomes `+2` with the rest on hover.

### Status bar

```
Enter opens a version · → expands · Ctrl+N new project
! blocked or overdue · ⚑ change order · $ quote expiring   │  8 of 42 · view: Open
```

---

## Rules

- **A project has no status of its own.** The Status column is a rollup —
  the approved version's lifecycle state when there is one, otherwise
  `Quoting · …` describing where the quotes stand.
- **Versions column is a count plus which one is approved**, never a sum.
- **Grey means not committed.** A project with three quotes shows one working
  figure in grey. Black means the customer said yes.
- **`Next` is context-sensitive** — quote expiry, install date, or invoice
  date, whichever applies.
- **Every flag is derived**, never typed.
- Money carries `$` and two decimals. GM% one decimal, no sign.
- Counters are filters.
