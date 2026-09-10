# Design brief — CUSTOMER & CONTACT DIALOGS
**Two POPUPs, each with two modes.** `New customer` / `Customer properties`,
and `New contact` / `Contact properties`. Opened from the Contacts window's
toolbar, its right-click menu, or by double-clicking a row.
Apply `11-date-formatting.md`.

**Style reference:** `docs/design/new-project.v2.dc.html` — **FINAL**.
Copy its dialog grammar exactly.

---

## ⛔ SCOPE

Render **exactly two dialogs, side by side** on a `rgba(0,0,0,.42)` scrim —
which shows both dialogs *and* both modes in two panels:

- Left: **`New Customer`**, empty, a blank form.
- Right: **`Contact properties — Ashley Doran`**, filled in.

Captions above each in `#fff` bold 11 px:
`NEW — a blank form` and `PROPERTIES — the same dialog, reopened`

Both **600 px** wide, top-aligned, 18 px apart.
No window behind them. Nothing after `</x-dc>`. One well-formed document.

---

## New and Properties are one dialog

Exactly as `docs/12` settled for New Project: **the same dialog reopened.**

```
              NEW                        PROPERTIES
title bar     New Customer               Customer properties — Exerplay, Inc.
fields        empty                      filled
default btn   Create                     OK
extra         —                          a read-only Added / Status row
```

Nothing else differs. **Do not design two layouts.**

---

## Width — settled, not re-argued

**Every popup in this application is 600 px.** New Project, New Option /
New Version, and both of these. A shared width means the `100px 1fr` field grid
lines up identically in every dialog, so the labels of one popup sit exactly
where the labels of the last one did.

A dialog with fewer fields is *shorter*, never narrower.

---

## The dialog grammar — inherited, not re-decided

```
WIDTH            600 px
SPACING          dialog padding 10px 9px 9px · 10 px between group boxes ·
                 group box padding 13px 9px 8px
FIELD ROWS       grid-template-columns: 100px 1fr · gap 4px 8px ·
                 align-items: center
READ-ONLY VALUE  #c0c0c0 ground · var(--t) sunken bevel · #404040 text
EDITABLE FIELD   #fff ground · var(--s) bevel
DROPDOWN         white field, #c0c0c0 raised arrow button inside its right edge
EXPLANATION      grey #404040 at line-height 1.5, in the VALUE column with an
                 empty label cell beside it
TIP BLOCK        #ffffe1 · 1 px black inset
RECORD BLOCK     #ffffc0 · 1 px #808080 inset · prefixed 📋
BUTTONS          fixed width, right aligned. default outlined 1 px black,
                 offset 1 px, bold.  Create 110 px · OK 110 px · Cancel 78 px
```

---

## DIALOG 1 · Customer

### Group box · "Identify it"

```
Name        [ Exerplay, Inc. ]   ★
Kind        [ rep/dealer                                   ▼ ]
```

`Kind` lists `rep/dealer · GC · school · owner`, from `customers.kind`.
An explanation line beneath it:

> Who you invoice, not who owns the playground. A rep sells the equipment
> and subs the install to you; on a school job you may invoice the district
> directly.

That distinction is the whole reason `kind` exists — it is a **subcontracted
installer's** customer list, so "customer" means whoever pays, which is often
not the site owner.

### Group box · "Where they are"

```
Address     [ 4501 Osuna Rd NE ]
City        [ Albuquerque    ]  State [ NM ]  Zip [ 87109 ]
```

Same row shape as New Project's Site box — City 132 px, State 38 px, Zip 66 px,
with 8 px grey labels between. **Copy that row verbatim.**

**No distance or drive time here.** Those belong to a *site*, and a customer is
not a site — Exerplay's office is in Albuquerque and its jobs are all over
Arizona. Mobilization is priced from the project's site address, never from
this one.

### Group box · "Notes"

A 36 px white sunken area, exactly New Project's Notes box.

### Properties mode only

One extra read-only row at the top of "Identify it":

```
Added       [ 14 Mar 2024 ]  read-only chip     ·  Status  Active
```

`Status` reads `Active` in black or `Inactive` in `#808080`. **It is not a
checkbox** — deactivating is a toolbar verb on the Contacts window, so putting
a second way to do it here would be two doors to one room.

### No automatic-recipient box on this dialog

A company-wide rule — *"copy the Chandler front office on everything"* — is
authored on **the person's** dialog, never here. See below.

---

## DIALOG 2 · Contact

### Group box · "Identify it"

```
Customer    [ Exerplay, Inc.                               ▼ ]  ★
Name        [ Ashley Doran ]   ★
Title       [ Sales Assistant ]
```

`Customer` is pre-set from whatever was selected when `New contact` was
pressed — a company row means that company, a person row means their company.
It stays a live dropdown, because people change employers and the record should
follow them.

### Group box · "Reach them"

```
Phone       [ (505) 555-0151 ]
Email       [ adoran@exerplay.com ]
```

Both optional. Phone renders in `'Lucida Console'` monospace so numbers align
down the Contacts list — v2's own idea, adopted.

### Group box · "Always include this person" ★ the interesting one

```
Copy them   [ whenever Grant Smith is on a project        ▼ ]  as [ cc ▼ ]  ✕
            ＋ Add a rule

            Empty means this person is only ever added by hand.
```

**One dropdown carries both kinds of rule.** Its options are:

```
whenever <colleague> is on a project     ← one entry per person at this company
on every <customer> project              ← the company-wide rule
```

Picking from one list is what makes the two kinds feel like one idea, which
they are: `contact_defaults` attaches to either a person or a company, and
which one you picked *is* the `scope_kind`. **There is no separate
person-or-company radio.** Adding one would be asking a question the dropdown
already answered.

Rows stack with `＋` / `✕`, exactly like New Project's contacts rows — copy
that row's controls verbatim. `as [ cc ▼ ]` sets `role`.

### Tip block · `#ffffe1`

```
A rule suggests. It does not bind.

When the trigger is added to a project, this person is written onto that
project as an ordinary cc — a row you can then edit or delete like any
other. The rule is never re-checked afterwards, so removing someone from
one job does not put them back.
```

This is the same principle as interpolation: **a suggestion to a person, never
a value that reasserts itself.** It is also the answer to the obvious bug — if
the rule were a live lookup at send time, deleting Ashley from one project
would silently undo itself.

### Group box · "Notes"

36 px, as above.

### Properties mode only

```
Added       [ 02 Aug 2025 ]  read-only chip     ·  Status  Active
Projects    [ 12 ]  read-only chip              ·  Cannot be deleted
```

`Projects` is why `Delete` is missing from the toolbar. When the count is `0`
the trailing text reads `Can be deleted` in `#404040` instead.

---

## Where a rule is authored — one place only

A company-wide rule can be *read* as belonging to the company, so it is
tempting to author it on the Customer dialog too. **Do not.** One rule with two
homes is how two homes start disagreeing.

Every automatic-recipient rule is authored on the **person who gets added**,
because that is the person you are thinking about when you set it up: you are
entering Ashley, and you know Ashley goes wherever Grant goes.

---

## Failure modes — do not reproduce

- **Two layouts for New and Properties.** One dialog, two modes.
- **A narrower dialog because it has fewer fields.** 600 px, always. Shorter,
  never narrower.
- **A person-or-company radio** above the rule dropdown. The dropdown's chosen
  option *is* the scope.
- **An automatic-recipient box on the Customer dialog.** Rules live on the
  person.
- **Distance or drive time on the Customer dialog.** A customer is not a site.
- **An `Active` checkbox.** Deactivating is a toolbar verb; `Status` here is
  read-only text.
- **A `Delete` button.** Neither dialog deletes. The Contacts window does.
- **`★` on anything with a default.** Only `Name`, `Kind`'s customer, and the
  contact's `Customer` and `Name` are required — and only `Name` fields arrive
  empty.
