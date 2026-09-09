# Estimate Editor — v11
Applies to `Estimate Editor v10`. **The two panes are approved and do not
change.** This applies the MAIN window template from `10-main-window-template.md`.

---

## ⛔ SCOPE

One screen, one state. The body — cost objects pane and estimate pane — is
**exactly v10**. Only the chrome around it changes.

---

## What changes

```
ADD      identity strip     under the toolbar
ADD      status strip       tinted, with the problem lip
KEEP     body               v10, untouched
KEEP     price bar          becomes the template's SCREEN STRIP
ADD      status bar         ⚠ Next │ lock state │ changed
REMOVE   the "2 problems in the cost breakdown" chip from the context strip —
         it moves into the status strip's alert
```

## Identity strip

Sunken band, two rows, grey labels. Replaces v10's context strip.

```
Customer   Exerplay, Inc. · Grant Smith     Project   26-10 San Tan Shade Installation
Site       San Tan Elementary, Gilbert AZ   Version   Option A · version 0
```

## Status strip

Full width, tinted with the estimate's own state. `Not sent` is status 2, which
is **white** — so the strip is white here, and the `#CC0000` lip is what carries
the problem.

```
▌  Not sent          created 07 Sep          ⚠  2 problems in the cost breakdown
                                                Excavate Footing has no rate
                                                for F-2x4 · Removed EWF has no
                                                disposition
```

State name 15 px bold. Alert right, `#a00`.

## Screen strip — the price bar, unchanged

```
COMPUTED   $17,932.98   markup 20.00%
QUOTED     $17,500.00   effective markup 16.98%              ▼ −$432.98
```

Drop v10's third red line — `Cannot issue — 2 problems` — it is now said by the
status strip and the status bar, and three times is twice too many.

## Status bar

```
⚠ Next — fix 2 problems in the cost breakdown before issuing  │ Draft · not locked │ changed 08 Sep 14:22 · DK
                       flex                                          190 px              190 px
```

Derived, and the problem displaces what would otherwise read `Send the estimate`.

---

## Everything else is v10

Two panes, 430 px cost objects on the left with BASE SCOPE and ADD OPTION bands,
the estimate table with its REF column, row expansion showing cost · price ·
margin, grey selection, edit on double-click only, the footer add-row, the
right-click menu. **Do not redraw any of it.**

10 px Tahoma, `letter-spacing: .05em`, to match the browser and version view.
