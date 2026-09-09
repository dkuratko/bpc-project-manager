# Estimate Editor — v12 · APPROVED
Applies `10-main-window-template.md` chrome (as v11) **and** rebuilds the body
in the Version View's box grammar.

**Approved 2026-09-09**, on the condition that job-level add options can be
**created** in the Optional add-ons box, not merely listed. That is specified
below.

---

## ⛔ SCOPE

One screen, one state. One well-formed document, nothing after `</x-dc>`.
**1180 × 800.**

## What is being tested

v10's body is **two large panes**: a cost-objects list and one white surface
holding the line table, the add-ons block and the totals together. That reads
like a document, which was deliberate — your real estimates read that way.

The Version View instead uses **several small labelled boxes**. This applies
that grammar to the estimate.

```
BODY — one flex row, exactly two children, both inside it

LEFT   430 px, flex:none
   ┌ Cost objects ────────────────────┐     unchanged from v10
   └──────────────────────────────────┘

RIGHT  flex:1, min-width:0
   ┌ Estimate of work ────────────────┐     the line table, v10's grammar
   └──────────────────────────────────┘
   ┌ Optional add-ons ────────────────┐     job-level, with checkboxes
   └──────────────────────────────────┘
   ┌ Totals ──────────────────────────┐     subtotal · tax · total
   └──────────────────────────────────┘
```

Boxes size to content and stack from the top. They never stretch.

## The three right-hand boxes

**Estimate of work** — the v10 table exactly: REF · ACTIVITY · QTY · UNIT PRICE
· AMOUNT, line rows, `↳` sub-items, `(Optional)` rows, yellow notes, row
expansion showing cost · price · margin, the footer add-row. **Do not redraw
it.** Its totals block and add-ons block move out into the two boxes below.

**Optional add-ons** — job-level only, and **editable**. This is where job-wide
options are created, not just displayed.

```
☐  Private utility line locate                             + $1,200.00
☐  Hard-dig allowance — rock / caliche                     + $1,250.00
─────────────────────────────────────────────────────────────────────
＋ Add option
```

```
LABEL      plain text until clicked, then a sunken field. same rule as
           everywhere else — double-click to edit.
AMOUNT     editable, monospace, prefixed "+"
CHECKBOX   whether the customer ACCEPTED it. ticked when the PO comes back
           naming it. not a UI toggle for you.
＋ Add option   a #dfdfdf footer row inside this box, matching the estimate
           table's own footer add-row.
```

**Two places create add options, and they are different things:**

```
the estimate table's footer   ＋ Option   →  LINE-SPECIFIC. attaches to the
                                             selected line. renders as
                                             ↳ (Optional) inside the table.
this box's footer             ＋ Add option → JOB-LEVEL. belongs to no line.
```

Both are scope deltas priced as a marginal recompute; only their attachment
differs.

**Totals** — labelled rows, grey labels, monospace right-aligned:

```
Subtotal                                                   $17,500.00
Tax                                                          Included
──────────────────────────────────────────────────────────────────────
Total                                                      $17,500.00
```

## Chrome — as v11

Identity strip · tinted status strip with the problem lip · the price bar as
the SCREEN STRIP · derived status bar. See `05g`.

---

## What this settles

v10 kept the line table, add-ons and totals on one white surface deliberately —
the estimate is a document and the real ones read as one page. The open question
was whether three bevelled boxes would break that.

**They do not.** So the box grammar is not only for status pages: it holds on a
document too, and the app now has **one body grammar on every screen.**

That matters beyond this screen — the **INVOICE** and **POST COST** screens are
documents in the same sense, and both can now be designed the same way rather
than inventing a second convention.
