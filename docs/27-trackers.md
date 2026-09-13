# Design brief — TRACKERS
**MAIN** window, MDI child. Opened by `Trackers` on the Project Browser
toolbar. Follows `docs/14-list-window-template.md`.
Apply `03f-money-formatting.md`, `11-date-formatting.md` and
`22-unknowns-and-alarms.md`.

**Style reference:** `docs/design/contacts.v2.dc.html` for the grouped list,
`docs/design/equipment-render2.v6.dc.html` for the detail pane.

---

## What it is

**Everything that renews.** Insurance, bonds, licences, classifications — the
standing obligations that let you work at all, and which fail silently by
simply reaching a date.

```
a lapsed general liability policy   you cannot be on site
a lapsed ROC licence                you cannot bid
a lapsed registration               the truck cannot leave the yard
```

**None of these are project work and none of them announce themselves.** That
is the whole argument for the screen: they are invisible until the day they
matter, and then they are catastrophic.

---

## ★ It is the same table as equipment compliance

`equipment_compliance` already tracks registration, DOT inspection and
insurance for a machine: a named thing, a last-done date, an interval, an
expiry, a countdown. **A company obligation is that with a different owner.**

So they become **one table** — `trackers` — with the polymorphic owner pattern
already used by `fees` and `equipment_specifications`:

```
owner = company      general liability · ROC licence · surety bond
owner = machine      the F-450's registration and DOT inspection
```

### And the window shows both

**The question "what is about to expire" does not care whose.** A truck whose
registration lapses stops you working exactly like a lapsed policy does, so
both belong in one list — with equipment items in their own band so the default
view is not cluttered.

`docs/18`'s Equipment window keeps its `Maintenance` counters; they now read
from `trackers` rather than a table of their own.

---

## ⛔ SCOPE

One window on the teal desk. No dialogs open.
One well-formed document, nothing after `</x-dc>`.
Window **1000 × 600**.

The item dialog is **specified below but not rendered** — a second pass.

---

## Chrome

```
title bar    Trackers
menu         File  Edit  View  Tracker  Window  Help
toolbar      New tracker · Record renewal… ‖ Properties · Deactivate
filter band  Find [              ]   Category [ All      ▼ ]
             ☐ Show equipment   ☐ Show inactive
status bar   left:  ⚠ Lapsed 1 · ⚠ Expiring < 60 days 0 · 8 tracked
             right: next renewal — General liability, 14 Nov 2026
```

**`☐ Show equipment` is unticked by default.** Company obligations are the
everyday list; the truck's paperwork is there when you want the whole picture.
In the render it is **ticked**, so both bands show.

The status bar's right segment answers the question you actually open this
window with: **what is next.**

---

## List — grouped by category

```
gutter ±   NAME                        ISSUER              REFERENCE      EXPIRES        DAYS
 14px 20px ──────────────────────────  ──────────────────  ───────────    ───────────    ──────
           minmax(0,1fr)               160px               110px          92px           64px, R

−  INSURANCE
 ▶   General liability                 Acme Mutual         GL-4471        14 Nov 2026        62
     Workers compensation              SCF Arizona         WC-88120       01 Jan 2027       110
     Commercial auto                   Acme Mutual         CA-4472        14 Nov 2026        62
−  BONDS
     Contractor licence bond           Western Surety      B-229140       30 Jun 2027       290
−  LICENCES
     AZ ROC contractor licence         AZ ROC              ROC-334982     31 Mar 2027       199
     Mesa business licence             City of Mesa        BL-9921        31 Dec 2026       109
−  CLASSIFICATIONS
     ROC A-14 · Fencing                AZ ROC              —                  —              —
−  EQUIPMENT
     2012 Ford F-450 · registration    AZ MVD              —              31 Jan 2027       140
     2012 Ford F-450 · DOT inspection  AZ DPS              —              30 Aug 2026       −14
```

**The cursor is on `General liability`** — `▶` in the gutter and a 3 px spine
down the whole `INSURANCE` group.

### The DOT inspection row is `#a00` throughout

`−14` days. **A negative countdown is not a small number, it is a different
state**, and the row says so in colour rather than expecting anyone to notice
a minus sign.

### The classification row has no expiry

`—` in both `EXPIRES` and `DAYS`, in `#808080`. A ROC classification does not
lapse on its own; it is a permission you hold. **`—` means not applicable**,
which is `docs/22`'s distinction and exactly why it exists — an empty cell here
would read as *unknown* and start someone hunting for a date.

---

## Detail pane — 330 px

```
General liability
Insurance · Acme Mutual · renews annually

COVER
  $2,000,000 each occurrence · $4,000,000 aggregate

CURRENT TERM
  15 Nov 2025  →  14 Nov 2026                  62 days left
  Policy GL-4471 · $4,180.00 /yr
  certificate-GL-4471.pdf

RENEWAL HISTORY
  14 Nov 2025   $4,180.00      +6.1%
  14 Nov 2024   $3,940.00      +4.2%
  14 Nov 2023   $3,782.00

REMINDS
  60 days before expiry

[ Record renewal… ]        [ Edit tracker… ]
```

### Renewal history is the point of keeping this

**A premium rising 6% a year is a fact you only see when the renewals are in
one place.** Same loop as the maintenance log suggesting a rate: the app does
not act on it, it just stops the number being invisible.

---

## Alerts — how it gets in front of you

```
lead time     per item, default 60 days. a licence wants 90; a policy 30.
counters      in this window's status bar, and clickable
project work  ★ NOTHING. a lapsed policy does not lip a project row.
```

**This is the one deliberate limit.** Trackers are company-level, and versions
carry *their own* problems — equipment short, quote expiring. Pushing a company
obligation onto every project row would make the browser's red lip mean two
unrelated things and stop it meaning either.

The Project Browser gets **one counter tile** instead, or nothing. That is a
decision for when it is built, logged in `00-TREE` §10.

---

## POPUP · Tracker — specified, not rendered

600 px, New Project's dialog grammar. `New tracker` / `Tracker properties`.

```
┌ Identify it ─────────────────────────────────────────────┐
  Category    [ Insurance                            ▼ ]  ★
  Name        [ General liability ]                       ★
  Issuer      [ Acme Mutual ]
  Reference   [ GL-4471 ]              policy or licence number

┌ This term ───────────────────────────────────────────────┐
  Effective   [ 15 Nov 2025 ]
  Expires     [ 14 Nov 2026 ]          blank if it does not lapse
  Renews      [ 12 ] months
  Cost        [ $4,180.00 ]  per term
  Document    [ certificate-GL-4471.pdf ]   [ Browse… ]

┌ Remind me ───────────────────────────────────────────────┐
  [ 60 ] days before it expires
```

`Expires` blank is how a classification is recorded — **not a missing date, a
thing that does not expire**, and the list shows `—` for it.

### `Record renewal…` is a separate, smaller dialog

It writes the **new term** and pushes the old one into history:

```
Renewed on   [ 14 Nov 2026 ]   ★
New expiry   [ 14 Nov 2027 ]   derived from Renews, overtypeable
Cost         [ $4,430.00 ]     was $4,180.00 · +6.0%
Document     [ Browse… ]
```

**Renewing is not editing.** Overtyping the expiry date on the properties
dialog would silently lose the history — and the history is the only reason
the rising premium is visible.

---

## Failure modes — do not reproduce

- **A second table for equipment compliance.** One `trackers` table.
- **An empty cell where a thing does not expire.** `—`, never blank.
- **A negative countdown in ordinary black.** The row is `#a00`.
- **A lapsed tracker lipping project rows.** Company obligations are not
  version problems.
- **Renewal by editing the expiry date.** It loses the history.
- **Counters that are not clickable.**
- **11 px type**, or a date without its year.
