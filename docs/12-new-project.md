# Design brief — NEW PROJECT
**POPUP**, alone on a `rgba(0,0,0,.42)` scrim. Opened by `New project` on the
browser toolbar, or `Ctrl+N`.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/reference/ideas-9b-new-version-dialog.dc.html`
Take its dialog grammar — see below. Not its content; 9b is an old New Version
dialog from a superseded model.

---

## ⛔ SCOPE

One dialog, alone on the scrim. No window behind it. One state.
One well-formed document, nothing after `</x-dc>`.

---

## The dialog grammar, from 9b

This is the part to copy exactly.

```
WIDTH            600 px
SPACING          tight. dialog padding 10px 9px 9px · 10 px between group
                 boxes · group box padding 13px 9px 8px. these dialogs are
                 dense on purpose — a popup that fills the screen to hold
                 nine fields reads as heavier than the job it is doing.

FIELD ROWS       a CSS grid inside each group box:
                    grid-template-columns: 100px 1fr
                    gap: 4px 8px, align-items: center
                 label left in plain text, field right. not flex rows with
                 fixed-width label spans — the grid is what makes every
                 group box align down one edge.

READ-ONLY VALUE  #c0c0c0 ground · var(--t) sunken bevel · #404040 text
                 a chip, visibly not a field. never bare grey text.

EDITABLE FIELD   #fff ground · var(--s) bevel

DROPDOWN         white field with a #c0c0c0 raised arrow button inside its
                 right edge

EXPLANATION      a grey #404040 line at line-height 1.5, occupying the VALUE
                 column with an empty label cell beside it. sits under the
                 field it explains.

TIP BLOCK        #ffffe1 · 1 px black inset · the rule or the caveat

RECORD BLOCK     #ffffc0 · 1 px #808080 inset · prefixed 📋
                 what this action will WRITE DOWN, permanently.
                 a different weight from the tip block, deliberately.

BUTTONS          fixed width, right aligned. the default is outlined
                 1 px black, offset 1 px, and bold.
```

---

## Content

### Title bar

```
New Project
```

Reopened to edit, the title reads `Project properties` and `Create` reads `OK`.

### Group box · "Identify it"

```
Project number   [ 26-15 ]  ← read-only chip     assigned on save
Title            [ San Tan Shade Installation                      ]  ★
Estimator        [ DK — Damian Kuratko                            ▼]
Created          [ 09 Sep 2026 ]  ← read-only chip   today · not editable
```

`Created` is grey-labelled and never editable. It is `projects.created_at`,
and it carries its year like every date in the app.

Under the number, an explanation line:

> Numbers run `26-1` upward and reset every January. **The number is assigned
> when you save, not now** — two people with this dialog open would otherwise
> both be shown `26-15`.

### Group box · "Customer"

```
Customer   [ Exerplay, Inc.                    ▼] [＋]                 ★
Contacts   [ Grant Smith                       ▼]  primary   [＋] [✕]
           [ Maria Villanueva                  ▼]  site      [＋] [✕]
           ＋ Add another contact
```

**A project has several contacts, each with a role** — the person who asked,
the person on site, whoever pays. Roles are an open list, not a fixed set.
`[＋]` creates a contact inline without losing what you have typed; `[✕]`
removes that row. `＋ Add another contact` is grey text, not a button.

### Group box · "Site"

```
Address    [ 1625 W Ryan Rd                                        ]
City       [ Chandler       ]   State [ AZ ]   Zip [ 85286   ]
Distance   [  18 ] mi           Drive time [  24 ] min each way
```

Explanation under the last row:

> Both price mobilization — distance drives the vehicle, drive time drives the
> crew. Neither is required now.

### Group box · "Notes"

A 44 px white sunken area, empty.

### Tip block

> Only **Title** and **Customer** are required. Everything else can be added
> later — this dialog reopens as **Project properties**.
> **Native material and site conditions are not here.** They are learned from
> the site, not from the request, and live on the cost breakdown's
> *Site conditions* box.

### Record block

> 📋 **Creates project `26-15` and version `A0`, and opens A0's cost breakdown.**
> The project number is taken at that moment. `A0` starts empty — there is no
> earlier version to copy on a new project.

### Buttons

```
[ Create ]  [ Create & start version A0 ]  [ Cancel ]
     110 px            170 px                78 px
```

`Create & start version A0` is the **default** — outlined and bold. Creating a
project you are not about to quote is the rare case.

---

## Rules

- **Only Title and Customer are required.**
- **The project number is a read-only chip and is assigned on save**, not when
  the dialog opens.
- Read-only values are chips, never bare text. Editable fields are white.
- No status, no dates, no money — a project is a container and has none.
- One dialog, alone on the scrim.
