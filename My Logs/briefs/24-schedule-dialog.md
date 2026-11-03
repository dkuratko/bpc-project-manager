# Design brief — SCHEDULE DIALOG
**POPUP**, 600 px. Opened by `Schedule…` on the Version View toolbar.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/supplier-dialog.v3.dc.html` — **FINAL**, the
closest sibling for grammar. Alarm and unknown vocabulary from
`docs/22-unknowns-and-alarms.md`.

---

## ⛔ SCOPE

**One dialog**, alone on a `rgba(0,0,0,.42)` scrim, 600 px.
One well-formed document. Nothing after `</x-dc>`.
No window behind it, no second panel.

---

## Why this dialog matters

It is one of **four dialogs that are the only place status changes in the whole
application.** There is no status column anywhere; all fourteen statuses are
derived from independent facts, because reality does not enforce an order
between them — **a job can be scheduled before its equipment lands.**

This is the dialog where that happens, and the alert it raises is the one the
application exists for.

---

## A living record, not a wizard

One row per version, reopened as the job moves:

```
install date  →  started  →  completed
```

**Every field stays editable, always.** Correcting a fact is the entire
mechanism by which a derived status gets fixed, so a dialog that locked earlier
answers would break the model it serves.

---

## The dialog grammar

```
WIDTH            600 px
SPACING          dialog padding 10px 9px 9px · 10 px between group boxes ·
                 group box padding 13px 9px 8px
FIELD ROWS       grid-template-columns: 100px 1fr · gap 4px 8px
READ-ONLY VALUE  #c0c0c0 ground · var(--t) bevel · #404040 text — a chip
EDITABLE FIELD   #fff ground · var(--s) bevel
DATE FIELD       80 px wide, never 56. always dd Mmm yyyy.
REQUIRED         ★ in #a00
EXPLANATION      grey #404040 at line-height 1.5, in the VALUE column with an
                 empty label cell beside it
TIP BLOCK        #ffffe1 · 1 px black inset
RECORD BLOCK     #ffffc0 · 1 px #808080 inset · 📋 · the STATUS PREVIEW
BUTTONS          Record 110 px (default, outlined bold) · Cancel 78 px
TYPE             10 px Tahoma, letter-spacing .05em. never 11 px.
```

---

## Group box · "The dates"

```
Project     [ 26-09  Dobson Park Ramadas ]        read-only chip
Version     [ 26-09A0 ]  Option A · version 0     read-only chip
Install     [ 22 Sep 2026 ]   ★
            the customer sets this date, you do not
Buffer      [ 1 ] days
            how long you are holding either side
Started     [            ]
            when the crew is on site
Completed   [            ]
            off site and not coming back
```

**The two identity chips open every record dialog**, in this order, matching
the Version View's identity strip. Neither is ever a picker: this dialog can
only be opened from a version, so both facts are settled before it appears.

`Install` is **not derived from a duration.** The customer picks the day; the
schedule follows it. That is why there is no computed end date here.

`Started` and `Completed` are **empty in the render** — this job has not begun.

---

## Group box · "Equipment" — read-only, and the reason this dialog is dangerous

```
Received    0 of 4 lines complete · 13 items outstanding
            ⚠ nothing has arrived
            recorded in Record shipment… — read-only here
```

The count in plain text, the shortfall beneath it in `#a00`, and the boundary
in `#808080`.

**This is the job before any truck.** `Record shipment…` (`docs/25`) picks the
same job up later, at truck 2 — the two dialogs are consecutive moments, not
the same one, which is why one says *nothing has arrived* and the other says
*7 still outstanding*.

**It is here so a date cannot be set without seeing it.** Nothing on this box is
editable — shipments are recorded in `Record shipment…` — and it exists purely
so the fact is in front of you at the moment it matters.

---

## Tip block · `#ffffe1`

```
Completed does not complete the job.

Filling in Completed means the crew is off site. The job stays ACTIVE until
the invoice goes out, because completion IS the invoice — there is no
"completed, payment required" state. Use Invoice… when you bill it.
```

Genuinely counterintuitive, and it is the one removed status trying to reassert
itself. **Say it in the dialog, not only in the docs.**

---

## Status preview ★ the family's signature case

```
📋 26-09A0 becomes
   ▌ SCHEDULED   22 Sep 2026        ⚠ no equipment received
   ──────────────
   Scheduling a job whose equipment is not on the lot is the alert this
   application exists to raise. The date is not blocked — the job just
   carries the warning until the last crate lands.
```

A `#ffffc0` record block, 📋 prefixed, containing a **status chip**:

```
GROUND     #8ECF8E — the SCHEDULED green from docs/08's ramp
BEVEL      var(--t), so it reads as a chip and not a highlight
NAME       11 px bold, then its key date after it
LIP        a 4 px #CC0000 bar on the chip's LEFT edge
ALERT      to the right of the chip, #a00
```

### Green with a red lip is the whole point

**A red row always means finished, so a problem is never a tint.** The job's
real phase is `SCHEDULED` and it stays green; the lip says something about it
is wrong. This is exactly the `26-09` row already drawn in the Project Browser
— previewed here before it is caused.

### It does not block

The customer set that date. Reality does not care what the app thinks, so the
dialog warns and records. **An app that refused the date would simply be
lied to.**

---

## Buttons

```
[  Record  ]   [ Cancel ]
   110 px        78 px
```

Reopened later to fill in `Started`, the title reads
`Schedule — 26-09A0` and `Record` still reads `Record`. **No `Apply`.**

---

## Failure modes — do not reproduce

- **A status dropdown.** Status is derived. A dialog that let you pick one
  would break the entire model.
- **Blocking the date** because equipment is short. It warns.
- **A red tint** on the status chip. 4 px lip, `#a00` text.
- **A status chip in any colour but `#8ECF8E`.** It is the ramp's green.
- **An editable Equipment box.** Shipments are recorded elsewhere.
- **A computed end date.** The customer sets the day.
- **Wizard behaviour** — greying `Started` until `Install` is filled, or
  locking a date once entered.
- **A "completed, payment required" state** appearing anywhere.
- **56 px date fields**, or a date without its year.
- **11 px type.**
