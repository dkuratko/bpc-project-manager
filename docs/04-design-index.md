# Design index — approved screens

**Approved files are committed to this repo under `docs/design/`.** That copy is
canonical — build from it, and it carries git history.

Working iterations (v1, v2, v3…) stay in the design workspace at
`~/Desktop/BPC [full walkthrough] APP/design/sample ui/` and are not committed.
When a screen is approved, its final is copied in here and recorded below.

`✔ FINAL` = approved, build from this · `◐ ITERATING` · `▢ NOT STARTED`

---

## Cost Breakdown — BPCc

| # | Screen | Status | File | Brief |
|---|---|---|---|---|
| 1 | Scope | **✔ FINAL v4** | `docs/design/cost-breakdown-01-scope.v4.dc.html` | `03a` + `03b` + `03c` |
| 2 | Requirements | ◐ brief written | — | `03d` |
| 3 | Purchasing | ▢ | — | — |
| 4 | Cost | ▢ | — | — |

**Tab 1 · Scope — v4 · FINAL**
Identity columns (icon · Item · Manufacturer · Part number · Category · Method ·
Footing · Qty · Unit · ✕), manual scope groups with collapse, add options with
line/job attachment, price ladder, `2 problems` chip.
*Known gap for build:* the collapsed group carries no children in the markup, so
ungrouped rows sit directly under its header and read as its contents. Needs a
separator when built.

---

## Catalog

| # | Screen | Status | File | Brief |
|---|---|---|---|---|
| — | New Component Wizard (3 steps) | **✔ FINAL** | `docs/design/component-wizard.final.dc.html` | — |
| — | Readiness panel | **✔ FINAL** | *(same file)* | — |
| — | New Footing Spec, inline | **✔ FINAL** | *(same file)* | — |

*Superseded by later decisions — fix when building, do not re-render:*
- `Complexity 1.20 × labor` on the installation method → **removed**, replaced by project conditions
- `Post displ.` on the footing spec → **removed**, concrete = excavation
- `Labor hours 26.0` → is **duration**, not man-hours; screen must show both
- live take-off showed a figure that included an unrated service → must show
  only what is known and alarm the rest

---

## Not yet designed

```
▢ NEW PROJECT dialog          ▢ PROJECT LIST            ▢ VERSION VIEW
▢ ESTIMATE EDITOR             ▢ CATALOG BROWSER         ▢ CONTACTS
▢ ACTIVE VERSIONS LIST        ▢ CALENDAR                ▢ SHIPMENTS
▢ POST COST                   ▢ PROBLEMS PANEL (cost breakdown)
```

---

## Briefs in this repo

```
03   design-cost-breakdown.md ...... all four zones. reference only — do NOT
                                     hand this to a renderer, it produces one
                                     canvas containing everything.
03a  design-scope-zone.md .......... tab 1, scope only
03b  scope-revision-1.md ........... identity columns
03c  scope-revision-2.md ........... groups
03d  requirements-zone.md .......... tab 2
```

## Origin of committed files

```
docs/design/cost-breakdown-01-scope.v4.dc.html
    from  [M] cost breakdown - scope v1/Scope Zone v4.dc.html
docs/design/component-wizard.final.dc.html
    from  [p] component creation v1/New Component Wizard - Dialogs.dc.html
```

Both reference `./support.js`, which is supplied by Claude Design's canvas
runtime and is not committed. They render inside that environment, not standalone.

---

## Rules that hold across every screen

```
1. No dollar figure in Scope or Requirements. Prices exist from Purchasing on.
2. Never show an inferred number as if measured. Show what is known, alarm the gap.
3. Money is hundredths, truncated, residual to the largest discarded fraction.
4. Quantity subtotals reconcile too — every column adds up.
5. "— not selected —" and "$0.00" are different states and must look different.
6. One screen per brief. One window. No dialogs unless the brief is the dialog.
```
