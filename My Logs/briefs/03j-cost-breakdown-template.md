# Cost Breakdown — MAIN WINDOW TEMPLATE
Applies `10-main-window-template.md` to all four tabs. **Chrome only.**

**★ No re-render.** The change is identical on every tab and purely mechanical.
Specify once, apply when building. The four approved `.dc.html` files stay as
the reference for everything below the chrome.

---

## What changes

```
1  CONTEXT STRIP becomes the IDENTITY STRIP
      was   Customer · Site · Native material · Conditions
      now   Customer · Project        (row 1)
            Site     · Version        (row 2)
      Native material and Conditions move into the Scope tab's own body,
      where they belong — they are scope facts, not identity.

2  ADD a STATUS STRIP beneath it
      tinted with the version's status colour, 4 px #CC0000 lip when there
      is a problem, state name 15 px bold, alert right in #a00.
      ► the "2 problems" chip LEAVES the tab strip and becomes this alert.

3  TAB STRIP sits between the status strip and the body. Unchanged.

4  PRICE LADDER becomes the SCREEN STRIP. Unchanged.

5  ADD a STATUS BAR
      ⚠ Next — derived  │  lock state  │  changed · by whom
      and DELETE the red "Cannot issue estimate — 2 problems" line, which
      the status strip and status bar now say twice over.
```

## The result, on tab 1

```
title bar · menu · toolbar
─────────────────────────────────────────────────────────────────────────
Customer  Exerplay, Inc. · Grant Smith    Project  26-10 San Tan Shade Inst.
Site      San Tan Elementary, Gilbert AZ  Version  Option A · version 0
─────────────────────────────────────────────────────────────────────────
▌ Not sent      created 07 Sep      ⚠ 2 problems — Excavate Footing has no
                                       rate for F-2x4 · Removed EWF has no
                                       disposition
─────────────────────────────────────────────────────────────────────────
▌1 · Scope▐  2 · Requirements  3 · Purchasing  4 · Cost
─────────────────────────────────────────────────────────────────────────
                              the tab's body
─────────────────────────────────────────────────────────────────────────
Cost $13,615.28 → +conditions → adjusted → +cont → +markup → $19,598.93
─────────────────────────────────────────────────────────────────────────
⚠ Next — fix 2 problems before issuing │ Draft · not locked │ changed … · DK
```

Native material and Conditions gain a small **"Site conditions"** group box on
the Scope tab, beneath Add options.
