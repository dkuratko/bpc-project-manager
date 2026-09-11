# LIST WINDOW TEMPLATE
**From the Project Browser.** Applies to every MAIN screen that shows **many
things instead of one**: Contacts · Catalog · Equipment · Shipments · Active
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

## The FACET + LIST + DETAIL variant — for a catalog

**Reference:** `docs/design/reference/ideas-6b-catalog.dc.html`.

When a list is long and has several independent ways of being sliced, it stops
being a hierarchy and becomes a **catalog**: three panes inside a sunken inset
panel, under a tab strip.

```
┌ tabs ───────────────────────────────────────────────────────────────┐
│ ┌ facets 214px ┬ list  1fr ─────────────────┬ detail 330px ────────┐ │
│ │ Search…      │ bevelled sortable header   │ the selected row,    │ │
│ │              │                            │ in full              │ │
│ │ ▾ By x       │ rows                       │  · title + subtitle  │ │
│ │     a    12  │                            │  · labelled sections │ │
│ │     b     9  │                            │    in white sunken   │ │
│ │ ▾ By y       │                            │    boxes             │ │
│ │     c    48  │                            │  · buttons at foot   │ │
│ │ ▾ Maintenance│                            │                      │ │
│ │     stale 11 │  ← red counts              │                      │ │
│ └──────────────┴────────────────────────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Facets beat a tree, and this is the reason

A tree forces **one** order of nesting. Rentals are naturally
`supplier → category → offering`, but you just as often want
`category → supplier`. A tree makes you pick; **facet groups let both exist at
once, each filtering one flat list.** The four-level depth problem disappears
because there is no nesting left.

```
▾ By supplier          ▾ By category
    United Rentals 3       Lifts      2
    Sunstate       1       Trailers   1
```

### Maintenance facets — the part worth stealing

The reference's third group is not navigation, it is a **standing audit**:

```
▾ Maintenance
    No production rate              3     ← #a00
    Rate never validated           11     ← #a00
    Unused 12 months                6
```

Red counts for things that are wrong, grey for things that are merely
interesting. **A catalog rots quietly** — a rate nobody has checked since 2023
is still a number on a bid — and this is where the rot is visible without
anyone going looking. Every catalog screen gets a maintenance group.

**A maintenance facet can only count what the schema stores.** If a facet is
worth having and the data is a free-text spec row, that is the signal to
promote it to a typed column — see `docs/18`, where registration expiry earned
one exactly this way.

### The detail pane replaces the screen strip

A one-line strip cannot hold a rate build-up or a spec list. Where a screen has
a detail pane, **it has no screen strip** — they answer the same question at
different sizes.

```
GROUND       #c0c0c0, raised bevel — a panel, not a sunken well
TITLE        12 px bold, then a #404040 subtitle line
SECTIONS     a bold caps label, then a white sunken box
FOOT         one or two buttons, full width, the primary one bold
```

### What NOT to take from the reference

```
✘ NAVY SELECTION   #000080 with white text, in both the facet list and the
                   table. Rejected for the project browser after four rounds
                   and rejected here: ▶ plus a bold label on a facet, ▶ plus
                   the 3 px spine on a list row. No fill anywhere.
✘ 11 px Tahoma     10 px with letter-spacing .05em, like every other screen.
✘ THE NOTES PANEL  a design-review artifact, never part of the app.
✘ ITS CONTENT      it is a services catalog. Take the shape, not the columns.
```

## Deleting from a list window## Deleting from a list window

Anything a job references **never dies** — the same rule as a version. A list
window's `Delete` is only ever available on a row nothing points at. Everything
else **deactivates**, and comes back with `☑ Show inactive`.

## Adoption

```
✔ PROJECT BROWSER    where it came from. FINAL v14. has counters, and
                     earns them.
◐ CONTACTS           docs/15. grouped, no counters.
▢ CATALOG BROWSER    FACET + LIST + DETAIL. what the variant came from.
◐ EQUIPMENT          docs/18. FACET + LIST + DETAIL — where it was settled.
▢ SHIPMENTS          flat, dated, probably earns counters.
▢ ACTIVE VERSIONS    flat. earns counters.
```
