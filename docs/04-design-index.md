# Design index — approved screens

**Approved files are committed to this repo under `docs/design/`.** That copy is
canonical — build from it, and it carries git history.

Working iterations (v1, v2, v3…) stay in the design workspace at
`~/Desktop/BPC [full walkthrough] APP/design/sample ui/` and are not committed.
When a screen is approved, its final is copied in here and recorded below.

`✔ FINAL` = approved, build from this · `◐ ITERATING` · `▢ NOT STARTED`

## Screen kinds

Your workspace folders already carry this as `[M]` and `[p]`. Recorded here so
it survives outside the folder names.

```
MAIN   a primary application window. title bar · menu · toolbar · status bar.
       you navigate TO it and it stays open while you work.
       teal desk visible around it.

POPUP  a modal dialog on a translucent scrim. opened FROM a main window,
       blocks it, closes back to it. no menu bar, no status bar.
       may open a further popup (New Footing Spec opens from inside the wizard).
```

✔ **MDI — decided.** MAIN windows are child windows inside one Project Manager
frame. There is a Window menu, Cascade, and Ctrl+Tab between open jobs. Several
versions can be open at once. The teal desk every screen renders on is the MDI
client area.

✔ **Menus and toolbars live on the CHILD**, not the frame. The frame keeps a
thin File · Window · Help menu. See the note at the end of this file.

---

## Cost Breakdown — BPCc

| # | Screen | Kind | Status | File | Brief |
|---|---|---|---|---|---|
| 1 | Scope | MAIN · tab 1 | **✔ FINAL v4** | `docs/design/cost-breakdown-01-scope.v4.dc.html` | `03a` + `03b` + `03c` |
| 2 | Requirements | MAIN · tab 2 | **✔ FINAL v1** | `docs/design/cost-breakdown-02-requirements.v1.dc.html` | `03d` |
| 3 | Purchasing | MAIN · tab 3 | **✔ FINAL v1** *(pending $ format)* | `docs/design/cost-breakdown-03-purchasing.v1.dc.html` | `03e` |
| 4 | Cost | MAIN · tab 4 | **✔ FINAL v2** | `docs/design/cost-breakdown-04-cost.v2.dc.html` | `03g` + `03h` |
| — | Problems panel | POPUP | **✔ FINAL v1** | `docs/design/cost-breakdown-problems-panel.v1.dc.html` | `03i` |

## Shell

| # | Screen | Kind | Status | File | Brief |
|---|---|---|---|---|---|
| — | Project browser | MAIN · the frame | **✔ FINAL v14** | `docs/design/project-browser.v14.dc.html` | `07` + `08` |

The MDI frame's client area **is** the browser. Rows expand to versions;
option groups get labelled bands; the cursor is a gutter arrow plus a black
spine down the whole selected group, and never touches the row's status tint.

## Estimate

| # | Screen | Kind | Status | File | Brief |
|---|---|---|---|---|---|
| — | Estimate editor | MAIN | **✔ FINAL v12** | `docs/design/estimate-editor.v12.dc.html` | `05f` · `05g` · `05h` |

**★ One build-time addition.** The rendered `Optional add-ons` box lists its one
row but has no way to create another — the brief gained that after the render.
Add a `#dfdfdf` footer row with `＋ Add option` inside that box, and make its
label and amount editable on double-click like every other cell. Mechanical;
no re-render.
| — | Version view | MAIN | **✔ FINAL v3** | `docs/design/version-view.v3.dc.html` | `09` |

All MAIN screens follow `10-main-window-template.md`: identity strip, tinted
status strip, body, optional screen strip, derived status bar. The cost
breakdown's four tabs adopt it **at build time** — the change is chrome only and
identical on each, so they are not re-rendered.

**Build note.** The toolbar still carries separate `Inclusion` and `Exclusion`
buttons from an earlier draft. Notes were consolidated into one row type with a
kind, as the footer's `＋ Note ▾` correctly shows. Collapse the toolbar to match
when building — do not re-render for it.

**Reference estimates** (`docs/design/reference/`) are the source for the
document pane. Both are current; they show different row types.

**Tab 1 · Scope — v4 · FINAL**
Identity columns (icon · Item · Manufacturer · Part number · Category · Method ·
Footing · Qty · Unit · ✕), manual scope groups with collapse, add options with
line/job attachment, price ladder, `2 problems` chip.
*Known gap for build:* the collapsed group carries no children in the markup, so
ungrouped rows sit directly under its header and read as its contents. Needs a
separator when built.

---

## Catalog

| # | Screen | Kind | Status | File | Brief |
|---|---|---|---|---|---|
| — | New Component Wizard (3 steps) | POPUP | **✔ FINAL** | `docs/design/cost-breakdown-03-purchasing.v1.dc.html
    from  [M] cost breakdown - purchasing/v1 - Purchasing Zone.dc.html
docs/design/cost-breakdown-04-cost.v2.dc.html
    from  [M] cost breakdown - cost /Cost Zone v2.dc.html
docs/design/cost-breakdown-problems-panel.v1.dc.html
    from  [p] cost breakdown - problem panel/Problems Panel.dc.html
docs/design/component-wizard.final.dc.html` | — |
| — | Readiness panel | POPUP | **✔ FINAL** | *(same file)* | — |
| — | New Footing Spec | POPUP *(from the wizard)* | **✔ FINAL** | *(same file)* | — |

*Superseded by later decisions — fix when building, do not re-render:*
- `Complexity 1.20 × labor` on the installation method → **removed**, replaced by project conditions
- `Post displ.` on the footing spec → **removed**, concrete = excavation
- `Labor hours 26.0` → is **duration**, not man-hours; screen must show both
- live take-off showed a figure that included an unrated service → must show
  only what is known and alarm the rest

---

## Popups

| # | Screen | Kind | Status | File | Brief |
|---|---|---|---|---|---|
| — | New Project | POPUP | **✔ FINAL v2** | `docs/design/new-project.v2.dc.html` | `12` |
| — | Record dialogs (4) | POPUP · family | **✔ FINAL v13** · revision state unrendered | `docs/design/record-dialogs.v13.dc.html` | `17` |
| — | New Option / New Version | POPUP · two roles | **✔ FINAL v3** | `docs/design/new-option-version.v3.dc.html` | `13` |
| — | Customer / Contact dialogs | POPUP · 2 × 2 modes | **✔ FINAL v1** | `docs/design/customer-contact-dialogs.v1.dc.html` | `16` |
| — | Mobilization panel | POPUP | briefed, awaiting render | — | `19` |
| — | Equipment · Owned tab | MAIN · list + detail | v6 accepted | `docs/design/equipment-render2.v6.dc.html` | `18` |
| — | Equipment · Rented tab | MAIN · list + detail | design approved, awaiting render | — | `18` |
| — | Equipment properties · 4 tabs | POPUP | v2 + v6 accepted | `docs/design/equipment-properties-tabs.v2.dc.html` | `18` |
| — | Add a specification | POPUP | v2 accepted | same file | `18` |
| — | Log entry · add + edit | POPUP | v1 accepted | `docs/design/equipment-log-entry.v1.dc.html` | `18` |
| — | Fuel prices | POPUP | v6 accepted | `docs/design/equipment-render2.v6.dc.html` | `18` |
| — | New supplier | POPUP | **not designed** | — | `18` |
| — | New type / categories | POPUP | **not designed** | — | `18` |
| — | Rental offering properties | POPUP | outlined only | — | `18` |
| — | Contacts | MAIN · list | **✔ FINAL v2** | `docs/design/contacts.v2.dc.html` | `14` + `15` |

Its dialog grammar — the `100px 1fr` field grid, read-only values as `#c0c0c0`
chips, grey explanation lines, and the two callout weights (`#ffffe1` for a
rule, `#ffffc0` 📋 for what the action records) — is the template for **every
popup that follows.**

### Build-time fixes — approved, do NOT re-render

**Contacts v2** — four mechanical corrections, all in `docs/15`:

1. Gutter `8px` → **`14px`**. The 3 px selection spine had nowhere to sit,
   which is why v2 shows the `▶` with no spine beside it.
2. Add the **20 px expand column** as column two: monospace `−` on an expanded
   company, `+` on a collapsed one, blank on people.
3. Chandler renders **no child rows** — delete the `collapsed — 2 people`
   placeholder. The `+` is the whole indication.
4. Exerplay's company row `AUTO` cell is **blank**. Its rule belongs to Ashley,
   who is a person; Chandler is the company-rule example.

Grid becomes `14px 20px minmax(0,1fr) 148px 108px 200px 36px 64px`.

**New Option / New Version v3** — one:

1. The **New Option** dialog (left) has `Empty` selected, so it must show **no
   record block**. Delete it there. The block follows the Copy radio in both
   roles — a promise about a copy that is not happening is a false promise.

**Cost breakdown · tab 3 Purchasing v1** — one, from the Equipment register:

1. The equipment `Sourcing ▼` no longer offers a bare `Owned`. Owned
   equipment is now **individual units** with their own serial and their own
   rate, so the dropdown names the unit: `Ford F-450 · Truck 2`. Rentals read
   as before, by supplier. See `docs/18`.

**Equipment v6** — two:

1. The properties sheet inside render 2 is still `11px Tahoma` /
   `letter-spacing: normal`. The three-tab render has it right at `10px` /
   `.05em`. Same sheet, two sizes.
2. `FIT` needs the two fields added since: a truck's `Capacity` is its **bed
   payload** and should say so, and a trailer needs `Tare weight` beside its
   capacity. See `docs/06`.
3. The sample fleet is now the 2012 F-450 / 20 ft flatbed / Bobcat T66 with
   consistent figures — `docs/18`. The F-450's rate is `$0.81 /mi`, not
   `$0.91`: a used 2012 depreciates far less than the new truck first drawn.

**Record dialogs v13** — five, all mechanical:

1. The base pair is a **radio**, not two checkboxes:
   `◉ Taken as quoted — BPCe-26-12A0` / `○ Create revision — …`
2. Identity is **two rows**, on both panels and all four dialogs:
   `Project [ 26-12  Verrado Elementary — Ramada Add ]` then
   `Version [ 26-12A0 ]  Option A · version 0`
3. `Against` becomes **`Estimate`**, and is a **read-only chip carrying the
   sent date**, not a dropdown. A version has exactly one estimate.
4. The approval tip block's last line is wrong and reverses the model. Replace
   with: *"The price subtracts cleanly — unit rates are a promise and they
   hold. What does not subtract is your cost, because materials are pooled.
   REV1 recomputes that, and Line items can show you the damage before you
   accept."*
5. In Line items, the declined `J.O1`'s `$4,850.00` is **greyed**, matching how
   the same declined option renders on the parent.

**Customer / Contact dialogs v1** — one:

1. Ashley's `Notes` box reads **`Sends POs on Fridays.`**, matching the note the
   Contacts screen strip shows for her. One person, two documents, one note.

## Not yet designed

```
MAIN    ▢ VERSION VIEW
        ▢ CATALOG BROWSER   ▢ CONTACTS           ▢ ACTIVE VERSIONS LIST
        ▢ CALENDAR          ▢ SHIPMENTS          ▢ POST COST

POPUP   ▢ NEW PROJECT       ▢ NEW ADD OPTION     ▢ NEW GROUP
        ▢ NEW SERVICE       ▢ NEW ASSEMBLY       ▢ SERVICE RATE TABLE
        ▢ RECORD APPROVAL   ▢ RECORD SHIPMENT
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
03e  purchasing-zone.md ............ tab 3
03f  money-formatting.md ........... cross-cutting, applies to every screen
11   date-formatting.md ............ cross-cutting, applies to every screen
03g  cost-zone.md .................. tab 4
03h  cost-revision-1.md ............ collapsible groups
03i  problems-panel.md ............. the issuability gate (POPUP)
```

## Origin of committed files

```
docs/design/cost-breakdown-01-scope.v4.dc.html
    from  [M] cost breakdown - scope v1/Scope Zone v4.dc.html
docs/design/cost-breakdown-02-requirements.v1.dc.html
    from  [M] cost breakdown - requirements/Requirements Zone v1.dc.html
docs/design/cost-breakdown-03-purchasing.v1.dc.html
    from  [M] cost breakdown - purchasing/v1 - Purchasing Zone.dc.html
docs/design/cost-breakdown-04-cost.v2.dc.html
    from  [M] cost breakdown - cost /Cost Zone v2.dc.html
docs/design/cost-breakdown-problems-panel.v1.dc.html
    from  [p] cost breakdown - problem panel/Problems Panel.dc.html
docs/design/component-wizard.final.dc.html
    from  [p] component creation v1/New Component Wizard - Dialogs.dc.html
```

Both reference `./support.js`, which is supplied by Claude Design's canvas
runtime and is not committed. They render inside that environment, not standalone.

---

## ✔ MDI menu placement — DECIDED: B, child-owned

```
A · CLASSIC          menu bar and toolbar live on the FRAME and change to
                     match the active child. children have a title bar only.
                     authentic Win2000. one menu on screen no matter how many
                     jobs are open.
                     COST: all four cost-breakdown screens lose their menu and
                     toolbar — structural rework of approved work.

B · CHILD-OWNED      frame keeps a thin menu (File · Window · Help). each child
                     carries its own menu and toolbar, as designed today.
                     less authentic. three open jobs means three menu bars.
                     COST: nothing. every approved screen already works.
```

**B is decided.** The frame keeps a thin menu — File · Window · Help — and every
child window carries its own menu and toolbar exactly as designed. No approved
screen changes. The frame never has to swap a toolbar when you switch windows.

---

## A failure mode worth knowing

`Version View v2` emitted its entire right-hand column **after `</html>`**, cut
off mid-box. The content was correct; the file was malformed.

It happened on the screen with the most markup — six group boxes, each a grid of
labelled rows. When a brief asks for a lot of structure, say plainly:

```
· the exact column structure — one flex row, N children, all inside it
· that the output is ONE well-formed document with nothing after </x-dc>
· fewer, larger boxes rather than many small ones
```

## Rules that hold across every screen

```
1. No dollar figure in Scope or Requirements. Prices exist from Purchasing on.
2. Never show an inferred number as if measured. Show what is known, alarm the gap.
3. Money is hundredths, truncated, residual to the largest discarded fraction.
4. Quantity subtotals reconcile too — every column adds up.
5. "— not selected —" and "$0.00" are different states and must look different.
6. One screen per brief. One window. No dialogs unless the brief is the dialog.
7. Every date carries its year — 22 Sep 2026. Never a bare day-month, never
   a two-digit year. See brief 11. BUILD-TIME change on every rendered
   screen; date columns widen from 56 px to 80 px.
8. Money always carries $ and two decimals. Rates are $ then unit
   ($309.94 /CY). Quantities and percentages never carry $.
   Negatives in parentheses: ($590.00). See brief 03f.
9. Toolbar: Add component / Add service / New one-time… are ENABLED ONLY on
   tab 1. Greyed on tabs 2, 3 and 4 — they are scope actions.
   Recalculate stays enabled everywhere. Issue estimate follows the gate.

## Pending small fixes

- tab 1 Scope v4 ...... grey the three scope buttons? no — tab 1 is where they live.
                        add a separator above ungrouped rows (see note above).
- tab 2 Reqs v1 ....... grey the three scope buttons. ladder values + $ format.
- tab 3 Purchasing .... $ format on all money cells. drop the duplicated
                        derived-days tooltip (keep the tip block).
                        label the eff. rate basis.
- tabs 1 & 2 .......... price ladder still carries the pre-v4 figures
                        (13,615.28 / 19,598.93). Correct values, derived from
                        the v4 scope, are in brief 03e. Status-bar only.
```
