# LIST WINDOW TEMPLATE
**From the Project Browser.** Applies to every MAIN screen that shows **many
things instead of one**: Contacts · Catalog · Vehicles · Shipments · Active
versions.

`docs/10-main-window-template.md` calls the Project Browser "the exception."
It is not an exception, it is the **second template**, and there are four more
windows about to need it.

---

## The idea

`docs/10`'s MAIN template answers *whose job is this · where does it stand ·
what happens next*. A list window cannot answer any of those, because it is not
looking at one thing. It answers a different set: **what is in here · how do I
narrow it · what is selected.**

```
title bar
menu
toolbar
─────────────────────────────────────────────────────────────────
FILTER BAND        Find [        ] + up to two dropdowns + checkboxes
                   right-aligned: Saved views ▼   (optional)
─────────────────────────────────────────────────────────────────
[ COUNTERS ]       OPTIONAL — see the rule below. equal-width tiles,
                   each one a filter.
─────────────────────────────────────────────────────────────────
LIST               sunken white, bevelled header. the body.
─────────────────────────────────────────────────────────────────
[ SCREEN STRIP ]   optional. one line about the SELECTED row —
                   its note, its warning, its total.
─────────────────────────────────────────────────────────────────
STATUS BAR         hints / legend  │  count + view
```

## Rules

- **No identity strip.** There is no single thing to identify.
- **No status strip, and no whole-window tint.** Many rows, many states. State
  lives in the rows.
- **Counters are optional, and they are not decoration.** A counter row is
  earned only when the counts are a **to-do list** — the Project Browser has
  them because "3 awaiting delivery" is work waiting for you. A count of
  contacts by kind is trivia. When in doubt, leave them out; a filter dropdown
  does the same job without pretending to be urgent.
- **The status bar carries the count**, always, in the same place.

## Grouped lists reuse the Project Browser's grammar exactly

Any list with a parent/child shape — customers over people, categories over
components, trucks over trailers — uses `docs/07-project-browser.md`'s
vocabulary without re-deciding a single value:

```
GUTTER       14 px, unlabelled, the FIRST column. wide enough to hold the
             3 px spine AND the ▶ beside it. never 8 px — the spine has
             nowhere to go and quietly disappears.
EXPAND       20 px, the SECOND column, unlabelled. a monospace − on an
             expanded parent, + on a collapsed one, centred. blank on
             every child row.
CURSOR       ▶ in the gutter on the parent row, plus a 3 px black spine
             down the whole selected group. NOTHING ELSE.
             NO shading, NO wash, NO fill, NO colour chip.
ROWS         alternating tint on child rows for readability
PARENT BAND  a band, not a divider — it says which group you are in
CHILD RULE   1 px #d4d4d4 between children
PROBLEM      never a row tint. a 4 px #CC0000 lip in the left gutter,
             plus a flag, plus #a00 text.
TYPE         10 px Tahoma, letter-spacing .05em. not 11 px.
DATES        every date carries its year. see docs/11.
```

**A collapsed group renders NO child rows.** Not one summary row, not a
"— 2 items" placeholder, nothing. The `+` in the expand column is the entire
indication that something is inside, exactly as the Project Browser does it.
A placeholder child row is a row the user can select, which means it needs a
selection behaviour, a right-click menu and a keyboard rule — all for a thing
that is not data.

**The selection colour was decided once, after four rounds, and is closed.**
Arrow and spine only. Do not re-open it per screen.

## Deleting from a list window

Anything a job references **never dies** — the same rule as a version. A list
window's `Delete` is only ever available on a row nothing points at. Everything
else **deactivates**, and comes back with `☑ Show inactive`.

## Adoption

```
✔ PROJECT BROWSER    where it came from. FINAL v14. has counters, and
                     earns them.
◐ CONTACTS           docs/15. grouped, no counters.
▢ CATALOG BROWSER    grouped. the dense one.
▢ VEHICLES           small and flat.
▢ SHIPMENTS          flat, dated, probably earns counters.
▢ ACTIVE VERSIONS    flat. earns counters.
```
