# Design brief — SUPPLIER DIALOG
**One POPUP, two modes.** `New supplier` / `Supplier properties — United
Rentals`. Opened by `New supplier` on the Equipment window's toolbar, or by
`Properties` on a supplier band.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/new-project.v2.dc.html` — **FINAL**.
This is a short form, so it wears that dialog grammar exactly.

---

## ⛔ SCOPE

Render **exactly two dialogs, side by side** on a `rgba(0,0,0,.42)` scrim,
**600 px** each, 18 px apart, top-aligned.

Captions above each in `#fff` bold 11 px:

```
NEW — a blank form
PROPERTIES — the same dialog, reopened
```

One well-formed document. Nothing after `</x-dc>`.
**Render nothing else** — no window behind, no other dialogs.

---

## New and Properties are one dialog

```
              NEW                     PROPERTIES
title bar     New Supplier            Supplier properties — United Rentals
fields        empty, #a0a0a0 hints    filled
default btn   Create  110 px          OK  110 px
extra         —                       two read-only rows at the top
```

**Do not design two layouts.**

---

## The dialog grammar

```
WIDTH            600 px
SPACING          dialog padding 10px 9px 9px · 10 px between group boxes ·
                 group box padding 13px 9px 8px
FIELD ROWS       grid-template-columns: 100px 1fr · gap 4px 8px ·
                 align-items: center
READ-ONLY VALUE  #c0c0c0 ground · var(--t) bevel · #404040 text — a chip
EDITABLE FIELD   #fff ground · var(--s) bevel
CHECKBOX         13 px, var(--s), white, ✓ in 'Lucida Console'
DATE             80 px wide. always dd Mmm yyyy.
EXPLANATION      grey #404040 at line-height 1.5, in the VALUE column with an
                 empty label cell beside it
TIP BLOCK        #ffffe1 · 1 px black inset
BUTTONS          right aligned. default outlined 1 px black, offset 1 px, bold.
TYPE             10 px Tahoma, letter-spacing .05em. never 11 px.
```

---

## Group box · "Identify it"

```
Name        [ United Rentals ]   ★
Used for    ☑ Equipment rental      ☐ Materials      ★
Account     [ BPC-4471 ]        your account number with them
```

### A supplier is anyone you pay

**One list, not two.** Some yards rent *and* sell, so a supplier carries flags
for what you use them for rather than living in a separate table per use:

```
☑ Equipment rental    appears on the Rented tab and in offering pickers
☑ Materials           appears in procurement's vendor pickers
```

**At least one must be ticked**, and the `★` sits on the pair, not on either
box. A supplier used for nothing appears in no picker and is not a supplier.

This replaces procurement's free-text vendor name. Typing a company into three
screens is how `United Rentals` and `United Rentals, Inc.` become two companies
that cannot be grouped or totalled.

---

## Group box · "Reach them"

```
Phone       [ (602) 555-0181 ]
Email       [ phoenix@unitedrentals.com ]
```

Phone in `'Lucida Console'` monospace, so numbers align wherever they are
listed. **No contact people** — at a rental yard you deal with the branch.

---

## Group box · "Where"

```
Address     [ 2450 W Broadway Rd ]
City        [ Mesa ]  State [ AZ ]  Zip [ 85202 ]
```

Same row shape as New Project's Site box — City 132 px, State 38 px, Zip 66 px,
with 8 px grey labels between. **Copy that row verbatim.**

---

## Group box · "Notes"

A 36 px white sunken area, exactly New Project's Notes box.

---

## Tip block · `#ffffe1`

```
Collecting a rental is not free, and this app does not yet price it.

Mobilization charges the distance to the SITE. Fetching a compactor from
Mesa on the way to Tucson is real miles and real hours that no line
currently carries. The address is here so the gap is visible.
```

An honest gap stated where it would otherwise mislead — the same treatment as
`Days down are recorded, not priced`.

---

## Properties mode only

Two extra rows at the **top** of "Identify it", above `Name`:

```
Added       [ 14 Mar 2024 ]  read-only chip   ·  Status  Active
Offerings   [ 3 ]  read-only chip             ·  Cannot be deleted
```

Grey labels (`#808080`) on both, matching New Project's `Created` row.
`Offerings` is why `Delete` is absent from the toolbar — a supplier with rows
under it cannot go without taking its history. At `0` the trailing text reads
`Can be deleted` in `#404040`.

---

## Render exactly this

**LEFT — `New Supplier`**

Every field empty with `#a0a0a0` placeholder text: `company name, as you invoice
it` · `your account number` · `(000) 000-0000` · `name@company.com` · `street` ·
`city`. Both `Used for` boxes **unticked**. No `Added` or `Offerings` rows.
Buttons `Create` 110 px (default, outlined bold) · `Cancel` 78 px.

**RIGHT — `Supplier properties — United Rentals`**

Filled exactly as written above, `Equipment rental` ticked and `Materials`
unticked, the two read-only rows present.
Buttons `OK` 110 px (default, outlined bold) · `Cancel` 78 px.
**No `Apply`** — this dialog commits once.

---

## Failure modes — do not reproduce

- **Two layouts** for New and Properties.
- **11 px type**, or `letter-spacing: normal`. 10 px / `.05em`.
- **A contacts list.** One phone, one email.
- **A defaults box** for move or delivery fees. Those live on the offering.
- **`★` on one `Used for` box.** It belongs to the pair.
- **`Added` or `Offerings` on the New state.** Neither exists yet.
- **An `Apply` button.**
- **Distance or drive time.** A supplier is not a site.
