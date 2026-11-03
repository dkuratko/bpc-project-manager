# MAIN WINDOW TEMPLATE
**Adopted 2026-09-09**, from the Version View. Applies to every **MAIN** screen.

---

## The idea

Every MAIN window answers the same three questions before you look at anything
else: **whose job is this · where does it stand · what has to happen next.**
The Version View put those in fixed places. If every MAIN screen does the same,
the app stops being a set of tools and starts being one thing.

```
title bar
menu
toolbar
─────────────────────────────────────────────────────────────────
IDENTITY STRIP     who · where · which project · which version
                   sunken band, two rows, grey labels
─────────────────────────────────────────────────────────────────
STATUS STRIP       tinted with the status colour
                   ▌ 4 px #CC0000 lip when there is a problem
                   state name 15 px bold · key date · alert right in #a00
─────────────────────────────────────────────────────────────────
BODY               whatever the screen is for. this is the only part
                   that differs between screens.
─────────────────────────────────────────────────────────────────
[ SCREEN STRIP ]   optional. a screen's own summary — the cost
                   breakdown's price ladder, the estimate's
                   computed-vs-quoted.
─────────────────────────────────────────────────────────────────
STATUS BAR         ⚠ Next — derived │ lock state │ changed · by whom
```

## Rules

- **`Next` is always derived, never typed**, and a problem always displaces the
  ordinary next step.
- **The status strip is the only tinted region.** Never the whole window.
- **The identity strip is read-only on every screen.** It is inherited from the
  project and never retyped, which was settled the day the cost breakdown was
  designed.
- Screens may add a SCREEN STRIP above the status bar. They may not move the
  identity strip, the status strip or the status bar.

## Where it already half-exists

```
COST BREAKDOWN   has an identity strip (customer · site · native material ·
                 conditions) and a price ladder. NO status strip; its
                 "2 problems" chip sits on the tab strip instead.
ESTIMATE EDITOR  has an identity strip and a price bar. NO status strip.
PROJECT BROWSER  the exception — it is the frame and shows many jobs, so it
                 has counters and a list instead. It keeps its own status bar.
VERSION VIEW     the full template.
```

## Adoption

```
✔ VERSION VIEW        the full template. where it came from.
✔ ESTIMATE EDITOR     v11. identity strip, status strip, price bar as the
                      screen strip, derived status bar. panes untouched.
▢ COST BREAKDOWN      chrome only, and identical across all four tabs:
                        · context strip becomes the IDENTITY STRIP
                        · a STATUS STRIP is added; the "2 problems" chip
                          leaves the tab strip and becomes its alert
                        · the price ladder becomes the SCREEN STRIP
                        · a derived STATUS BAR is added
                      ★ NO RE-RENDER NEEDED. the change is mechanical and
                        the same on every tab — specify once, apply at build.
—  PROJECT BROWSER    exempt. it is the frame and shows many jobs, so it
                      keeps its counters, its list and its own status bar.
```
