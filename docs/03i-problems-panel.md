# Design brief — PROBLEMS PANEL
The last piece of the Cost Breakdown. Opened by the red `2 problems` chip that
sits on every tab. **Apply `03f-money-formatting.md`.**

---

## ⛔ SCOPE OF THIS RENDER

Draw **the dialog only**, alone on a translucent dark scrim, exactly the way the
New Component Wizard dialogs were presented. Do not draw the Cost Breakdown
window behind it. One dialog, one state.

## ⛔ RENDER THE VALUES LITERALLY

Every figure and label below is final.

---

## What this panel is

The **issuability gate**. Same idea as the component wizard's readiness panel,
one tier up: that one gates marking a component Active, this one gates issuing
an estimate.

No approval workflow, no second person, no sign-off. Just: **is it finished.**

---

## Dialog

Windows 2000, ~**560 px** wide, `#c0c0c0`, standard bevel, drop shadow.
Title bar gradient `#000080 → #1084d0` with a close box at the right:

```
Problems — BPCc-26-10A0
```

### Banner

Full width, pink `#ffe0e0` ground, 1px `#a00` inset border, `#a00` text, bold:

```
⚠  CANNOT ISSUE ESTIMATE.  2 problems.
```

### The checklist

A white sunken list. Four columns: status mark, text, action, source.
Status marks: `✓` black, `!` red `#a00`, `○` grey `#808080`.
Failing rows sit on a pink `#ffe0e0` ground across the full row.

```
✓   Scope — 10 rows in 2 groups, 2 add options                        tab 1
✓   All components Active                                             catalog
!   Excavate Footing has no rate for F-2x4                 [Fix…]     catalog
✓   All pooled materials have a procurement method                    tab 3
!   Removed EWF has no disposition selected                [Fix…]     tab 3
✓   Equipment sourcing decided — telehandler, mixer                   tab 3
○   No product quotes — customer furnishes the equipment              tab 3
✓   Markup 20% · contingency 5% set                                   version
```

Source column right-aligned, grey. `Fix…` is a small raised button, present only
on the two failing rows.

`○` is neither pass nor fail — it is a check that does not apply to this job.
It must look distinct from `✓`, because "not required" and "satisfied" are
different things.

### Explanation block

Yellow `#ffffe1`, 1px black inset, beneath the list:

> **Fix…** on the rate row opens the *Excavate Footing* rate table with a blank
> `F-2x4` row and an interpolated suggestion of **0.65 hr** pre-filled from the
> volume curve — between `F-1x2` at 0.35 hr and `F-3x12` at 2.65 hr.
> Accept it or type the real number. **It is never used in a calculation until
> you do.**

### Buttons

Bottom right:

```
[ Issue estimate ]   [ Close ]
```

`Issue estimate` is **disabled / grey** — it stays that way until every row is
`✓` or `○`. That is the entire gate.

---

## Rules this render must not break

- **`!` rows must be unmissable.** Pink row, red mark, and a `Fix…` that goes
  straight to the thing.
- **`○` must not read as a pass.** Grey, distinct from `✓`.
- **The interpolated 0.65 hr is a suggestion, not a value.** The wording has to
  say so — this is the single most important rule in the whole application and
  this dialog is where a person meets it.
- **No dollar figures on this panel** beyond the `Markup 20% · contingency 5%`
  line, which is percentages, not money.
- One dialog. No window behind it. No second state.
