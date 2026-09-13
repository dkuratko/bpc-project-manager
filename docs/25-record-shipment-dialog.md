# Design brief — RECORD SHIPMENT DIALOG
**POPUP**, 600 px. Opened by `Record shipment…` on the Version View toolbar.
Apply `11-date-formatting.md` and `22-unknowns-and-alarms.md`.

**Style reference:** `docs/design/schedule-dialog.v1.dc.html` — **FINAL**, its
closest sibling. Same identity chips, same tip and record blocks, same buttons.

---

## ⛔ SCOPE

**One dialog**, alone on a `rgba(0,0,0,.42)` scrim, 600 px.
One well-formed document. Nothing after `</x-dc>`.

---

## One dialog per truck

An **event**, recorded once per delivery — not a living record. Three trucks
means three of these, and the completeness is cumulative across them.

This is the dialog that **clears the alarm the Schedule dialog raises.** Its
sample continues that job's story: `26-09A0` is already booked for 22 Sep, and
truck 2 arrives one sail short.

---

## The dialog grammar

```
WIDTH            600 px
SPACING          dialog padding 10px 9px 9px · 10 px between group boxes ·
                 group box padding 13px 9px 8px
FIELD ROWS       grid-template-columns: 100px 1fr · gap 4px 8px
READ-ONLY VALUE  #c0c0c0 ground · var(--t) bevel · #404040 text — a chip
EDITABLE FIELD   #fff ground · var(--s) bevel
DATE FIELD       80 px, never 56. always dd Mmm yyyy.
CHECKBOX         13 px, var(--s), white, ✓ in 'Lucida Console'
RADIO            ◉ / ○ in the text flow, no custom control
REQUIRED         ★ in #a00
TIP BLOCK        #ffffe1 · 1 px black inset
RECORD BLOCK     #ffffc0 · 1 px #808080 inset · 📋 · the STATUS PREVIEW
BUTTONS          Record 110 px (default, outlined bold) · Cancel 78 px
TYPE             10 px Tahoma, letter-spacing .05em. never 11 px.
```

---

## Group box · "The truck"

```
Project     [ 26-09  Dobson Park Ramadas ]        read-only chip
Version     [ 26-09A0 ]  Option A · version 0     read-only chip
Shipment    [ 2 ] of 3 expected
Received    [ 10 Sep 2026 ]   ★
Where       ◉ Lot    ○ Site
Truck log   [ EXP-88214 ]
```

`Shipment` is a small numeric field with `of 3 expected` in `#808080` beside
it — **editable**, because trucks arrive out of order and the count the
customer gave you is a guess.

`Where` matters to mobilization: a delivery **to site** never touches your
flatbed, and the mobilization panel's `HAULED ✗` reads from it.

---

## Group box · "What was on it"

Lists **everything still outstanding** for this version — never what has
already arrived. Completeness is cumulative at component level, so a second
truck shows only what the first did not bring.

```
                        [ Receive all ]

ITEM                             OUTSTANDING  RECEIVED   CONDITION
PlayBooster PB-4400 structure          1       [ 1 ]     ◉ Approved  ○ Issue
Shade sail 20 ft × 20 ft               2       [ 1 ]     ○ Approved  ◉ Issue
     ⚠  [ only 1 sail loaded — replacement promised 18 Sep         ]
Benches, 6 ea                          6       [ 4 ]     ◉ Approved  ○ Issue
        2 remaining after this truck
Shade posts, 4 ea                      4       [ 0 ]     —  not on this truck

          1 of 4 lines complete · 7 items outstanding · 1 issue open
```

Columns `minmax(0,1fr) 84px 60px 150px`. A bevelled `#c0c0c0` header.

### ★ `RECEIVED` is a quantity, not a tick

**A line arrives across several trucks and that is normal.** Six benches with
four on this truck and two on the next is a partial delivery, not a fault — so
the row records **how many came**, and `OUTSTANDING` counts down across
shipments.

```
OUTSTANDING   how many are still owed, before this truck
RECEIVED      how many were on it. 0 means it did not come.
```

**This replaces the checkbox entirely.** `RECEIVED 0` *is* "not on this truck",
so a tick beside it would be saying the same thing twice — and a row can then
be 4-of-6 without anyone inventing a third state to mean "partly ticked".

A row with `RECEIVED 0` shows **no condition selection**: nothing arrived, so
there is nothing to judge. It reads `— not on this truck` in `#808080`.

A partial row shows its remainder beneath in `#808080`:
`2 remaining after this truck`.

`[ Receive all ]` above the table fills every `RECEIVED` with its
`OUTSTANDING`. **Unloading a clean truck should be one click** — that was the
checkboxes' one virtue and it should not be lost with them.

### Quantity is a fact. Approved or Issue is a judgment.

These are **independent**, and keeping them apart is what makes partial
deliveries work:

```
6 of 6 · Approved    complete and fine
4 of 6 · Approved    partial and fine — the rest is coming
4 of 6 · Issue       partial and WRONG — six were promised on this truck
6 of 6 · Issue       all here, but damaged or not what was ordered
```

**The app cannot tell the third case from the second**, because the difference
is what the supplier promised for *this* truck — which nobody tracks and
nobody should. So the numbers are recorded and **you decide whether it is a
problem.**

### `EQUIPMENT RECEIVED` needs both to be clear

```
every line's OUTSTANDING is 0     AND     no issue is open
```

Two independent gates. Six benches all present with an open damage issue is
not received equipment, and neither is a clean truck that brought four of six.

### Approved or Issue — two options, not three

An earlier draft had `ok · damaged · short`. **Two is better:** you should not
have to pre-categorise a problem before describing it, and the categories were
never exhaustive anyway — wrong colour, wrong part number, and missing hardware
all fit none of them.

```
◉ Approved    default. what arrived is fine.
○ Issue       something is wrong. say what in the line below.
```

`Approved` is selected on every row that received anything, until someone says
otherwise.

### An Issue opens a text line, and it is not optional

Choosing `Issue` reveals a full-width field beneath the row, prefixed `⚠` in
`#a00`. **A problem nobody described is a problem nobody can chase**, so the
dialog will not record with an empty issue line.

---

## ★ An issue is TRACKED, not noted

This is the part that makes `Issue` more than a comment.

```
OPENS      the moment the shipment is recorded
KEEPS      the version from reaching EQUIPMENT RECEIVED, independently of
           whether every quantity has arrived
RAISES     an alert on the version, for as long as it is open
CLOSES     only when someone reopens this shipment and switches the row
           to Approved
```

**Resolving an issue is switching it to `Approved`.** No second dialog: the
replacement sail arrives, you reopen shipment 2, tick it over, and everything
downstream corrects itself. That is the same principle the whole status model
runs on — correct the fact, not the conclusion.

### What "monitored" means concretely

While any shipment issue is open, the version carries it everywhere a problem
is already shown:

```
PROJECT BROWSER   a 4 px #CC0000 lip in the gutter on that version's row
VERSION VIEW      the same lip on the status strip, alert text in #a00
STATUS BAR        ⚠ Next displaced — a problem always outranks the
                  ordinary next step
```

**Nothing new is invented to carry it.** An open shipment issue is a problem
like any other, and the application already knows how to show one.

---

## Tip block · `#ffffe1`

```
Crates are not opened until they are on site.

Tick what the truck delivered, not what the packing list claims. A part
shortage found mid-install is normal in this business — reopen the shipment
and change ok to short, and the status corrects itself.
```

---

## Status preview ★ — and why it usually says NOTHING changed

**Recording a truck does not schedule a job.** The install date did that, in
the `Schedule…` dialog. What a truck changes is whether the equipment is
there — which moves the **alarm**, not the status.

That distinction is the whole point of deriving status from independent facts,
and this is the dialog where it is most visible.

### The four outcomes

```
BEFORE                          AFTER THIS TRUCK        STATUS
awaiting, still incomplete      still incomplete        AWAITING DELIVERY
                                                        no change
awaiting, now complete          complete                EQUIPMENT RECEIVED
                                                        ★ CHANGES
scheduled, still incomplete     still incomplete        SCHEDULED + lip
                                                        no change, lip stays
scheduled, now complete         complete                SCHEDULED
                                                        no change, LIP CLEARS
```

**Three of the four do not move the status.** Only a delivery that completes a
job with no install date actually changes it — and even then it is the
completeness doing the work, not the act of recording.

### The block's header is conditional

```
status moves      📋 26-09A0 becomes
status holds      📋 26-09A0 — status does not change
```

**Render the second**, because that is what this sample causes:

```
📋 26-09A0 — status does not change

   ▌ SCHEDULED   22 Sep 2026        ⚠ 1 open shipment issue
   ───────────────
   Already scheduled for 22 Sep; recording a truck does not change that.
   What this moves: 7 items are still outstanding and one issue is open,
   so the red lip stays. It clears when every quantity is in and no issue
   remains.
```

`#8ECF8E` ground, `var(--t)` bevel, a 4 px `#CC0000` lip on the chip's **left**
edge, the alert to its right in `#a00`.

**A dialog that claimed credit for a status it did not cause would teach the
wrong model** — and this application's whole argument is that status is a
consequence of facts, not something an action stamps on.

### The lip and the status come from different places

```
SCHEDULED   comes from the install date          → Schedule…
the LIP     comes from the equipment being short → Record shipment…
```

Two dialogs, two facts, one row in the browser. Neither knows about the other.

---

## Buttons

```
[  Record  ]   [ Cancel ]
   110 px        78 px
```

**No `Apply`.** One truck, one commit.

---

## Failure modes — do not reproduce

- **Listing what has already arrived.** Outstanding only.
- **A three-way condition.** Approved or Issue.
- **A checkbox beside `RECEIVED`.** The quantity says it.
- **Treating a partial delivery as an issue.** Four of six is normal; only
  you know whether six were promised on this truck.
- **A condition selection on a row that received 0.**
- **`EQUIPMENT RECEIVED` on one gate.** Quantities clear AND no open issue.
- **An optional issue line.** The dialog will not record without it.
- **A separate resolve dialog.** Reopen the shipment and tick it Approved.
- **Radios on an unticked row.** It did not come on this truck.
- **A status dropdown.** Status is derived.
- **`becomes` when nothing moves.** Three of the four outcomes hold the
  status; the header says so.
- **Claiming this dialog schedules anything.** The install date does that.
- **A red tint** on the chip. 4 px lip, `#a00` text.
- **Turning the item list into row-editor popups.** It is the dialog's
  primary action, not a reference table.
- **A fixed `Shipment` number.** Trucks arrive out of order.
- **11 px type**, or a date without its year.
