# Design brief — CONTACTS
**MAIN** window, MDI child. Opened by `Contacts` on the Project Browser toolbar.
Follows `docs/14-list-window-template.md`. Apply `11-date-formatting.md`.

**Style reference:** `docs/design/project-browser.v14.dc.html` — **FINAL**.
This screen is its grouped list with different columns. Take the cursor, the
banding, the row rules and the type sizing verbatim. **Do not re-decide any of
them.**

---

## ⛔ SCOPE

One window on the teal desk. No dialogs open, no right-click menu rendered.
One well-formed document, nothing after `</x-dc>`.
Window **1000 × 640**.

---

## The idea

Two levels, one list: **a customer is a company, a contact is a person.**
Grant Smith works at Exerplay; Exerplay is who pays. That is exactly the
parent/child shape the Project Browser already renders, so this screen is that
list with different columns — customers as parent bands, people indented under
them, expand and collapse, `▶` and spine for the cursor.

**No counters.** Counting contacts by kind is trivia, not a to-do list. The
`Kind` dropdown in the filter band does the same job without pretending to be
urgent. This is the rule in `docs/14` being applied, not an omission.

---

## Chrome

```
title bar    Contacts
menu         File  Edit  View  Contact  Window  Help
toolbar      New customer · New contact ‖ Properties · Deactivate
             right: nothing
filter band  Find [                    ]   Kind [ All        ▼ ]
             ☑ Show people   ☐ Show inactive
status bar   left:  double-click to edit · a contact on a project cannot
                    be deleted
             right: 4 customers · 8 people
```

`☑ Show people` collapses the whole list to companies only — the same idea as
the browser's `☑ Show versions`, and the same control in the same place.

---

## Columns

Parent rows (customers) and child rows (people) carry **different** columns in
the same grid. This is what the Project Browser already does and it works:

```
gutter  NAME                          TITLE / KIND        PHONE           EMAIL                    PROJECTS
  8px   ─────────────────────────     ──────────────      ─────────────   ──────────────────────   ────────
        320px                         150px               110px           220px                    70px, right
```

- **Customer row** — `NAME` is the company, bold. `TITLE / KIND` shows the kind
  (`rep/dealer` · `GC` · `school` · `owner`). `PHONE` and `EMAIL` are blank —
  a company is not a person and does not get a personal phone number. The
  `PROJECTS` count is the company's total.
- **Contact row** — indented. `NAME` is the person, `TITLE / KIND` is their job
  title, `PHONE` and `EMAIL` are theirs, `PROJECTS` is how many they are on.

`PROJECTS` is a count, never money — **no `$`, no decimals.** Right-aligned
because it is a number. Clicking one opens the Project Browser filtered to that
person.

---

## Render exactly this

```
▶ Exerplay, Inc.                   rep/dealer                                            22
    Grant Smith                    Regional Sales Mgr   (505) 555-0142  grant@exerplay.com       12
    Maria Villanueva               Project Coordinator  (505) 555-0188  maria@exerplay.com        8
    Dave Ruiz                      Estimator            (505) 555-0164  druiz@exerplay.com        2
  City of Tucson                   owner                                                          4
    Angela Reyes                   Parks Project Mgr    (520) 555-0119  areyes@tucsonaz.gov       3
    Tom Baptiste                   Inspector            (520) 555-0137  tbaptiste@tucsonaz.gov    1
  Haydon Building Corp             GC                                                             4
    Kyle Nunez                     Superintendent       (602) 555-0173  knunez@haydonbc.com       4
  Chandler Unified School District school                                                         6
    ▸ collapsed — 2 people
```

**The cursor is on `Exerplay, Inc.`** — `▶` in the gutter, 3 px black spine
down the company row and all three of its people. **No shading whatsoever.**
The last group renders collapsed to prove the control exists.

Counts add up: 12 + 8 + 2 = 22 · 3 + 1 = 4 · 4 = 4. Chandler's 6 is the sum of
two people not shown.

Phone format `(505) 555-0142` throughout. All names and numbers here are
invented.

---

## Screen strip — the selected row's note

One line above the status bar, sunken, grey label:

```
Note   Prefers text over email. Sends POs on Fridays.
```

`contacts.notes` and `customers.notes` both exist and are the only fields that
do not fit a column. When the selected row has none, the strip reads
`— no note —` in `#808080` and stays put. **It never collapses**, or every
selection change would jog the list.

---

## Deactivate, not delete

The toolbar says `Deactivate`, not `Delete`, and that is deliberate.

A contact that has ever been on a project **cannot be deleted** — deleting it
would blow a hole in that project's history, which is the same rule that makes
a version never die. `Deactivate` sets `active = 0`: the person leaves every
picker in the app but stays on the projects they were on. `☐ Show inactive`
brings them back into this list, rendered in `#808080`.

`Delete` exists only on a row with `PROJECTS` = 0, and lives on the right-click
menu, never the toolbar. **Do not render the menu open.**

---

## Editing

Double-click a row, or `Properties`, opens a popup following New Project's
dialog grammar — `docs/12`, `docs/design/new-project.v2.dc.html`. Two of them,
`Customer properties` and `Contact properties`, briefed later. Nothing on this
screen is edited in place.

`New contact` creates the person under whichever customer is selected. If a
customer row is selected, that company; if a person is selected, their company.

---

## Failure modes — do not reproduce

- **Shading the selected row.** `▶` and the spine only. Settled after four
  rounds on the browser; not re-open here.
- **A counter row.** Kind counts are not a to-do list.
- **Phone or email on a company row.** A company is not a person. Those cells
  are empty.
- **`$` or decimals on `PROJECTS`.** It is a count.
- **A `Delete` button on the toolbar.** `Deactivate`. Delete is right-click
  only, and only on an unreferenced row.
- **11 px type.** 10 px Tahoma, `letter-spacing: .05em`, like the browser.
- **A screen strip that hides when empty.** It reads `— no note —` and holds
  its height.
- **In-place editing.** Everything goes through a properties popup.
