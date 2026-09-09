# Estimate Editor — v12 · EXPERIMENT
Applies `10-main-window-template.md` chrome (as v11) **and** rebuilds the body
in the Version View's box grammar. This is a test — v11 stands until you
prefer this.

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

**Optional add-ons** — job-level only, in the Version View's labelled-row style:

```
☐  Private utility line locate                             + $1,200.00
```

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

## What this risks, and what to judge

The reason v10 put all three in one white surface is that **the estimate is a
document**, and your real ones read as one page — line items, then add-ons,
then totals, flowing together. Three boxes with bevelled frames between them
may read as three unrelated panels rather than one estimate.

Judge it on that: **does it still look like something you would send?**

If it does, the app gains one consistent body grammar across every screen.
If it does not, v11 stands and the Version View's grammar simply does not
belong on a document.
