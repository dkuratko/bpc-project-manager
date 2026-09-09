# Design brief — PROJECT BROWSER
The application frame. **MAIN**, and the first thing you see on launch.
Based on `docs/design/reference/ideas-5a-projects-main-page.dc.html`.
Apply `03f-money-formatting.md`.

---

## ⛔ SCOPE

One screen. The frame and its list. No child windows over it, no dialogs,
no open menus. One state.

## ⛔ RENDER THE VALUES LITERALLY

Every figure and date below is final.

---

## Carried from 5a, unchanged

Window **1420 px**. Menu with accelerator underlines. The toolbar, the filter
band, the five counter tiles, the expandable rows with an inset panel, the flag
legend in the status bar. All of it was right.

## Translated to the current model

5a predates two decisions and must be corrected:

```
5a said                          the model is
─────────────────────────────────────────────────────────────────────
"version A" + "renditions A0/A1"  OPTION letter + VERSION number.
                                  A0, A1, B0 are versions. an option is a
                                  LETTER AND NOTHING ELSE. renditions do
                                  not exist.
"Current estimate BPCe 26-245A0"  correct, but it is the estimate OF a
                                  version, not of an option.
BPCp 26-245  (space)              BPCp-26-10  (hyphen), matching every
                                  other reference in the app
```

---

## Acting on your own four critiques

**1. "No current version" reads badly.** Fixed as you proposed: a project
carries a **`current_version`** pointer, set by hand. The Value, GM% and Status
columns describe **that version only** — never a sum, never a guess at intent.
A project with no current version shows `—` across those three columns and a
status of `no current version`. Schema gains `projects.current_version_id`.

**2. Bid due is meaningless on won work.** The column becomes **`Next`** — the
soonest actionable date on the current version, whatever kind it is. A quote
shows its expiry, a scheduled job shows its install date, an unpaid job shows
the invoice date. One column, always relevant.

**3. Actuals are unreachable.** The inset panel's action row gains
**`Post cost ▸`**, enabled only on versions that are complete.

**4. Three flags will become eight.** Capped at **three glyphs**; a fourth
renders as `+2` and the full list is a hover. Legend stays in the status bar.

**5.** The `Estimator` filter is now supportable — the schema has `users`. It
filters on `projects.owner_user_id`.

---

## Layout, top to bottom

```
title bar
menu ......... File Edit View Project Version Catalog Reports Window Help
toolbar ...... New Project · New Version ‖ Open · Duplicate… · Print list
               ‖ Catalog ▸ · Rates & Resources          right: Estimator [ ▼ ]
filter band .. Find [ ] Status [ ▼ ] Type [ ▼ ] Due [ ▼ ]
               ☑ Show versions  ☐ Show lost / complete   right: Saved views ▼
counters ..... five tiles, equal width
list ......... sunken white, bevelled header
status bar ... hints + flag legend   |   count + view
```

### The five counters

Raised `#c0c0c0` tiles. Grey label, big monospace figure, grey sub-line.
**Each is a filter** — clicking one scopes the list to it.

```
Open pipeline        Awaiting customer     Installs this week
$41,690.00           $18,240.00            2 jobs
5 projects ·         1 estimate sent       1 without equipment      ← #a00
current version only

Change orders        Quotes expiring
$2,850.00            1
1 pending approval   within 14 days                                 ← #a00
```

### List columns

| col | w | align |
|---|---|---|
| ± | 20 | centre |
| Project ▲ | 104 | left, monospace |
| Name | flex | left |
| Customer | 150 | left |
| Location | 112 | left |
| Vers | 46 | centre |
| Current estimate | 122 | left, monospace |
| Value | 100 | right |
| GM % | 54 | right |
| Status | 130 | left |
| Next | 84 | left |
| Flags | 44 | centre |

---

## Render exactly this

```
− BPCp-26-10  San Tan Shade Installation        Exerplay, Inc.   Gilbert, AZ
                    3   BPCe-26-10A0    $17,500.00  28.8   Draft · not sent   —
    ┌ inset panel ──────────────────────────────────────────────────────────┐
    │ Version  Scope                        Cost        Sell    GM   Estimate │
    │ A0 ★     PlayBooster + hip shade  $12,462.07  $17,500.00  28.8  not sent│
    │ A1       + bench, moved ramp      $13,006.44  $18,240.00  28.7  sent 07 Sep
    │ B0       Shade only                $3,011.90   $4,180.00  28.0  not sent│
    │                                                                         │
    │ [Open version A0 ▸] [Compare A0 ↔ A1] [New version] [Post cost ▸]      │
    │                    Site: hard clay · swell 1.25 · access ×1.30          │
    └─────────────────────────────────────────────────────────────────────────┘

+ BPCp-26-09  Dobson Park Ramadas               Exerplay, Inc.   Chandler, AZ
                    2   BPCe-26-09A0    $15,250.00  22.4   Scheduled          22 Sep   !
+ BPCp-26-08  Doris J. Thompson Fitness Course  Exerplay, Inc.   Tucson, AZ
                    1   BPCe-26-08A0    $25,969.00  19.1   On site            02 Oct
+ BPCp-26-11  Desert Ridge HOA — PlayBooster    Desert Ridge HOA Phoenix, AZ
                    2   BPCe-26-11B0    $96,310.00  19.1   Won · B0                    ⚑
+ BPCp-26-12  Verrado Elementary — Ramada Add   Litchfield ESD   Buckeye, AZ
                    1   BPCe-26-12A1    $28,640.00  22.4   Sent 28 Aug        11 Sep   $
+ BPCp-26-13  Riparian Preserve — Nature Play   Town of Gilbert  Gilbert, AZ
                    1   BPCe-26-13A0    $43,900.00  20.8   Draft              25 Sep
+ BPCp-26-14  Skyline HS — Bleacher Shade       Mesa USD         Mesa, AZ
                    2   —                        —      —   no current version         !
```

`BPCp-26-10` is **expanded and selected** — the project row on `#000080` with
white text, classic list selection. `A0` in the inset carries a `★` marking it
the current version.

**Note `BPCp-26-14`.** Two drafts, neither marked current, so Value, GM% and
Next all show `—` and the status says so plainly. That is the fix to your first
critique, rendered.

### The flags

```
⚑  pending change order        26-11
$  quote expiring              26-12
!  blocked from issuing        26-14
!  scheduled, no equipment     26-09     ← the dangerous one
```

Max three glyphs per row; a fourth becomes `+2`.

### Status bar

```
Enter opens the current version · → expands · Ctrl+N new project
⚑ change order · $ quote expiring · ! blocked        │   7 of 42 projects · view: Open
```

---

## One inconsistency to settle

The estimate editor uses **grey** `#c0c0c0` for a selected row, because there
the selection doubles as an editing context and navy was too loud. A browse
list has no such problem and **navy is the Win2000 norm**, which is what 5a
uses and what this brief specifies.

Two different selection colours in one application is defensible — one is a
cursor, one is a highlight — but it should be a decision rather than an
accident. Say if you would rather both were grey.

---

## Rules

- **Value, GM% and Status describe the CURRENT VERSION only.** Never a sum.
  A project quoted three ways is one row worth $17,500.00, not $39,920.00.
- **No current version means dashes**, not the highest draft.
- **`Next` is context-sensitive** — expiry, install date, or invoice date,
  whichever applies to the current version.
- Money carries `$` and two decimals. GM% is one decimal, no sign.
- Counters are filters, not decoration.
