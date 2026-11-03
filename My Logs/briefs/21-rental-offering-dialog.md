# Design brief — RENTAL OFFERING DIALOG
**One POPUP, two modes**, plus **two row editors**.
`New offering` / `Offering properties — 64' boom lift`, opened from the
Equipment window's `Rented` tab.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/supplier-dialog.v3.dc.html` — **FINAL**, and
the closest sibling. Same grammar, same widths, same button geometry.

---

## ⛔ SCOPE — four dialogs, in TWO ROWS

```
row 1   New offering  600   +   Offering properties  600      18 px apart
row 2   Add a rate    480   +   Add a fee            480      18 px apart
```

Four across would be 2,160 px of canvas. Two rows, 22 px between them, all on
one `rgba(0,0,0,.42)` scrim.

Captions in `#fff` bold 11 px above each:

```
NEW — a blank form, showing the collected-with-no-weight alarm
PROPERTIES — the same dialog, reopened
ADD A RATE — a row editor
ADD A FEE — a row editor
```

One well-formed document. Nothing after `</x-dc>`.

---

## The dialog grammar

Identical to the supplier dialog. Restated so nothing has to be looked up:

```
WIDTH            600 px for the offering · 480 px for a row editor
SPACING          dialog padding 10px 9px 9px · 10 px between group boxes ·
                 group box padding 13px 9px 8px
FIELD ROWS       grid-template-columns: 100px 1fr · gap 4px 8px
READ-ONLY VALUE  #c0c0c0 ground · var(--t) bevel · #404040 text — a chip
EDITABLE FIELD   #fff ground · var(--s) bevel
MONEY            right-aligned, $ and two decimals, 'Lucida Console'
DATE             80 px. always dd Mmm yyyy.
REQUIRED         ★ in #a00
TIP BLOCK        #ffffe1 · 1 px black inset
BUTTONS          right aligned, default outlined 1 px black offset 1 px, bold
TYPE             10 px Tahoma, letter-spacing .05em. never 11 px.
```

---

## ⛔ NO ROWS OF INPUTS

`docs/12`'s rule, and this dialog is why it exists.

```
at most ONE free-text or numeric input per row.
pickers and checkboxes do not count.
over that, the row is DISPLAY ONLY and ＋ Add a … opens a row editor.
```

**The `Rates` and `Fees` tables below are display only.** Double-click a row to
edit it. Their `✕` removes a row; nothing else in them is interactive.

---

## DIALOG 1 · the offering

### Group box · "Identify it"

```
Supplier    [ United Rentals                       ▼ ]   ★
Type        [ boom lift                            ▼ ]   ★
Move        ◉ Delivered    ○ Collected
```

`Type` is **generic** — `boom lift`, `truck`, `trailer`, `loader`. It is what
the work requires. The offering's own name comes from the type plus its specs;
there is no separate name field.

#### On the NEW panel, `Move` is `Collected` and shows the alarm

```
Move        ○ Delivered    ◉ Collected
            ⚠ boom lift has no shipping weight. A collected rental rides
              your trailer and the mobilization panel cannot count it.
                                              [ Set it on the type… ]
```

In `#a00`, in the value column under the radios. **A collected rental is load**,
and the moment you choose `Collected` is when that gap is cheapest to notice —
not when a trip count comes out wrong three weeks later.

On the PROPERTIES panel `Move` is `Delivered` and **no alarm shows**.

### Group box · "Rates"

```
BASIS      RATE            MINIMUM
day        $485.00         1 day            ✕
week       $1,455.00       —                ✕
＋ Add a rate…
                           cheaper from 4 days

Confirmed  [ 14 Mar 2026 ]              [ Confirm today ]
```

A bevelled `#c0c0c0` header — `var(--r)`, `#404040` caps at `letter-spacing
.11em` — over white sunken rows. Columns `62px 1fr 90px 19px`.

`cheaper from 4 days` is derived, grey, right-aligned under `MINIMUM`:
`4 × 485 = $1,940` against `$1,455`.

`[ Confirm today ]` is 96 px. **It stamps the date without touching the rate** —
you rang them, the price is still `$485.00`, and `Card unconfirmed 12 months`
should stop nagging. Without it the only way to clear that counter is to edit a
number that is already correct.

On the NEW panel: **one empty row**, `＋ Add a rate…`, no `cheaper from` line,
`Confirmed` empty.

### Group box · "Fees"

```
NAME             BASIS         AMOUNT
Delivery         flat          $150.00       ✕
Pickup           flat          $150.00       ✕
Damage waiver    percent       12.0%         ✕
＋ Add a fee…
```

Columns `1fr 90px 90px 19px`. On the NEW panel: **no rows**, just
`＋ Add a fee…`.

### Group box · "Last paid" — PROPERTIES only

```
Rate        [ $520.00 ] /day
When        [ 22 Aug 2026 ]      on  26-09A0
            from post cost · recorded 04 Sep 2026
⚠ Card is $35.00 under the last invoice
```

**Absent entirely on the NEW panel** — nothing has been paid yet.

The `from post cost · recorded 04 Sep 2026` line is grey provenance, and it is
not decoration: a post-costed figure ties to a job and reconciles against an
invoice, a typed one is what you remembered. A typed value reads
`typed · 12 Sep 2026` instead.

The warning line is `#a00`, separated by a 1 px `#ececec` rule.

### Properties mode only

Two rows at the **top** of "Identify it", grey labels:

```
Added       [ 11 Feb 2025 ]  read-only chip   ·  Status  Active
Rented on   [ 6 ]  read-only chip             ·  Cannot be deleted
```

### Buttons

```
NEW           Create 110 px  ·  Cancel 78 px
PROPERTIES    OK     110 px  ·  Cancel 78 px
```

**No `Apply`.**

---

## DIALOG 2 · `Add a rate` — 480 px

```
Basis     [ week            ▼ ]   ★    day · week · month
Rate      [ $1,455.00 ]           ★
Minimum   [          ]                 periods, optional
```

One group box, `Rates`. A grey explanation under `Basis`:

> One row per basis at most. A second `week` row would be two prices for the
> same thing.

Buttons `Add` 110 px (default) · `Cancel` 78 px.
Title `Add a rate — 64' boom lift`. Reopened to edit it reads
`Rate — week` with `OK`.

---

## DIALOG 3 · `Add a fee` — 480 px

```
Name      [ Damage waiver ]       ★
Basis     [ percent         ▼ ]   ★    flat · per period · percent
Amount    [ 12.0 ] %                   unit follows the basis
```

One group box, `Fee`. A grey explanation under `Amount`:

> A percent fee is of the rental base — rate × periods — before other fees,
> so two percent fees never compound.

`Amount`'s trailing unit is `%` for percent and `$` leading otherwise, and it
**changes with the basis**.

Buttons `Add` 110 px (default) · `Cancel` 78 px.

---

## Failure modes — do not reproduce

- **Editable cells in the Rates or Fees tables.** Display only.
- **A `Last paid` box on the New panel.** Nothing has been paid.
- **An alarm on the Properties panel.** It is `Delivered` there.
- **`Confirm today` changing the rate.** It stamps a date.
- **A name field on the offering.** The type names it.
- **Provenance shown the same for typed and post-costed figures.**
- **An `Apply` button.**
- **11 px type.**
- **Four dialogs in one row.** Two rows.
