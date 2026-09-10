# Design brief — THE RECORD DIALOGS
**Four POPUPs, one family.** `Record approval…` · `Record shipment…` ·
`Schedule…` · `Invoice…` — the four buttons on the Version View toolbar that
currently go nowhere.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/new-project.v2.dc.html` — **FINAL**.
Copy its dialog grammar. Every popup is 600 px.

---

## The idea — these four dialogs are the only place status changes

There is **no status column anywhere in the schema.** All fourteen statuses are
derived from independent facts, because reality does not enforce an order
between them: a job can be scheduled before its equipment lands.

These four dialogs record those facts. **Nothing else in the application
changes what a job's status is.** Everything else — the browser's row tint, the
version view's status strip, the derived `Next` in every status bar — is a
consequence of what gets typed here.

That makes one thing mandatory in all four: **before you commit, the dialog
shows you the status you are about to cause.**

---

## THE STATUS PREVIEW — the shared invention

Every one of the four ends with a record block that is **a preview of the
status strip the Version View will show afterwards.** Same `#ffffc0` ground and
📋 prefix as any record block, but carrying a live status chip:

```
📋 26-09A0 becomes
   ▌ SCHEDULED   22 Sep 2026        ⚠ no equipment received
   ────────────
   Nothing else changes. Correct any fact and the status recomputes.
```

Rules for the chip:

```
GROUND     the status's own ramp colour from docs/08 —
           6–7 #9CC3E2 · 8 #B5E3B5 · 9 #8ECF8E · 10 #F5E183 ·
           11 #F0B778 · 12–14 #E89494 · 1–5 #ffffff
BEVEL      var(--t), so it reads as a chip and not a highlight
NAME       11 px bold, the status name, plus its key date after it
PROBLEM    a 4 px #CC0000 lip on the chip's LEFT edge, plus the alert
           text to the right in #a00. NEVER a red tint.
NO CHANGE  when the fact does not move the status, the chip shows the
           CURRENT status and the line beneath reads
           "Status does not change — <why>."
```

This is the version view's status strip in miniature, and deliberately so: the
thing you are about to cause should look like the thing you will then see.

**The preview updates live** as fields change. Tick the last outstanding
shipment item and the chip goes from `AWAITING DELIVERY` to
`EQUIPMENT RECEIVED` while you watch.

---

## Living records vs events

The four are not the same shape, and it matters:

```
EVENTS — recorded once, one row per occurrence
  Record approval…    a PO arrives. usually once, occasionally again.
  Record shipment…    one dialog per truck. shipment 2 of 3.

LIVING RECORDS — one row per version, reopened and added to over time
  Schedule…           install date → started → completed
  Invoice…            sent → paid
```

A living record's dialog reopens with what is already known filled in and grey,
and only the next empty field in focus. **They are not wizards** — any field can
be corrected at any time, because the whole point of deriving status is that
correcting a fact fixes everything downstream.

---

## ⛔ SCOPE

Render **exactly two dialogs, side by side** on a `rgba(0,0,0,.42)` scrim —
the two carrying the most design weight:

- Left: **`Record approval — 26-12A0`**, an event, showing a PO that does
  **not** match: 4 benches of 6, the security fence declined, the footings
  taken under their line. Button reads `Record & create REV1`.
- Right: **`Schedule — 26-09A0`**, a living record, showing the equipment
  alert and a red-lipped status chip.

Captions above each in `#fff` bold 11 px:
`EVENT — recorded once` and `LIVING RECORD — reopened and added to`

Both **600 px**, top-aligned, 18 px apart.
`Record shipment…` and `Invoice…` are **fully specified below but not
rendered** — they are the same grammar and can follow later.
Nothing after `</x-dc>`. One well-formed document.

---

## The dialog grammar — inherited, not re-decided

```
WIDTH            600 px
SPACING          dialog padding 10px 9px 9px · 10 px between group boxes ·
                 group box padding 13px 9px 8px
FIELD ROWS       grid-template-columns: 100px 1fr · gap 4px 8px
READ-ONLY VALUE  #c0c0c0 ground · var(--t) bevel · #404040 text
EDITABLE FIELD   #fff ground · var(--s) bevel
DATE FIELD       80 px wide, never 56. always dd Mmm yyyy.
MONEY            right-aligned, $ and two decimals, monospace
CHECKBOX         13 px, var(--s) bevel, white ground, ✓ in monospace
RADIO            ◉ / ○ in the text flow. controls under an unselected
                 radio stay live.
TIP BLOCK        #ffffe1 · 1 px black inset
RECORD BLOCK     #ffffc0 · 1 px #808080 inset · 📋 · THE STATUS PREVIEW
BUTTONS          Record 110 px (default, outlined bold) · Cancel 78 px
```

---

## DIALOG 1 · Record approval  ★ rendered

### Group box · "What came back"

```
Version     [ 26-12A0  Verrado Elementary — Ramada Add ]   read-only chip
Against     [ BPCe-26-12A0   sent 28 Aug 2026            ▼ ]
Received    [ 09 Sep 2026 ]   ★
How         ◉ Purchase order    PO # [ 4501182 ]
            ○ Signed estimate
            ○ Email approval
Evidence    [ PO-4501182.pdf ]  [ Browse… ]
```

`Against` lists the estimates issued for this version, newest first. A version
can be approved against an older estimate — **nothing is ever off the table**,
and a customer sitting on a quote for five weeks then sending a PO is ordinary.

### Group box · "What the PO says" ★ the important one

**Every priced row on the estimate**, tickable and re-quantifiable. This is not
a list of add options — it is the estimate itself, checked off against the
paper in your hand.

```
                                              quoted   ordered      amount
☑  01     Ramada — 20 ft × 20 ft hip           1 ea     [ 1 ]   $22,480.00
   ☑  01.O1  Drilled footings, 4 posts         add option        $2,190.00
☑  02     Site work — grading and base         1 ls     [ 1 ]    $9,140.00
☑  03     Benches                              6 ea     [ 4 ]    $6,800.00
             ⚠ 4 of 6 — price recomputes in REV1
☐  J.O1   Security fence, 120 LF               job option        $4,850.00
```

#### The reference number says what an add option attaches to

This is the editor numbering from `document_lines`, and it is doing real work
here:

```
01        a line
01.1      a sub-item of line 01 — a partial breakdown, not tickable
01.O1     ADD OPTION 1 ON LINE 01     ← specific. the footings for the ramada.
J.O1      ADD OPTION 1 AT JOB LEVEL   ← general. the security fence.
```

Line options are **indented under their line**; job options sit at the bottom,
after a rule, in their own group. You never have to wonder which is which — the
indent shows it and the reference proves it.

#### Line options depend on their line

**Untick `01` and `01.O1` unticks with it, greyed, with the reason beside it:**

```
☐  01     Ramada — 20 ft × 20 ft hip           1 ea     [ 0 ]   $22,480.00
   ☐  01.O1  Drilled footings, 4 posts    — needs 01, which was not ordered
```

Footings for a ramada you are not supplying is not a thing anyone can order.
A job option (`J.O1`) has no such dependency — a security fence stands on its
own.

#### Quantities, not just ticks

*"Five benches quoted, four ordered"* is the common case and a tick cannot say
it. `ordered` defaults to `quoted` and is editable. Setting it below quoted —
or unticking a line outright — is what makes this **an approval AND a
revision.**

#### The footer, when the PO matches

```
────────────────────────────────────────────────────────────
Approved job scope                                $43,270.00
```

#### The footer, when it does not — the render shows this

```
────────────────────────────────────────────────────────────
⚠ The PO does not match the estimate.

  BPCe-26-12A0 REV1 will be issued carrying the scope above, and the
  cost recomputes against it. This dialog does not price it — dropping
  2 of 6 benches does not subtract 2 × $1,133.33.
```

**No total is shown in the revision case, and that is deliberate.** The new
price cannot be arrived at by arithmetic on this screen; it is a marginal
recompute against the scope that is actually happening. A dialog that guessed
would be lying in the one place it matters most.

### Status preview

When the PO matches:

```
📋 26-12A0 becomes
   ACCEPTED   09 Sep 2026
   ─────────
   Approved scope $43,270.00. Next: awaiting delivery.
```

**When it does not — the render shows this:**

```
📋 26-12A0 becomes
   ACCEPTED   09 Sep 2026
   ─────────
   And BPCe-26-12A0 REV1 is created, carrying 4 benches instead of 6
   and no security fence. Its cost recomputes on open.
   REV1 is what the job runs on. The original stays on file, unchanged.
```

Chip ground `#9CC3E2` in both. **No lip** — a revision is not a problem, it is
Tuesday.

---

## DIALOG 2 · Record shipment  — specified, not rendered

One dialog **per truck.**

### Group box · "The truck"

```
Version     [ 26-09A0  Dobson Park Ramadas ]   read-only chip
Shipment    [ 2 ] of 3 expected              sequence, editable
Received    [ 10 Sep 2026 ]   ★
Where       ◉ Lot    ○ Site
Truck log   [ EXP-88214 ]
```

### Group box · "What was on it"

Lists **everything still outstanding** for this version — never what has
already arrived. Completeness is cumulative at component level.

```
☑ PlayBooster PB-4400 structure          qty 1   [ ok        ▼ ]
☑ Shade sail 20 ft × 20 ft               qty 2   [ short     ▼ ]  ⚠
      [ 1 of 2 sails on the truck                              ]
☐ Benches, 6 ea                                  not on this truck

      2 of 3 line items received · 1 short
```

`condition` is `ok · damaged · short`. Anything but `ok` opens a one-line note
field beneath it and **keeps the item outstanding**, because a short crate is
not a received crate.

### Tip block · `#ffffe1`

```
Crates are not opened until they are on site.

Tick what the truck delivered, not what the packing list claims. A part
shortage found mid-install is normal in this business — reopen the shipment
and change ok to short, and the status corrects itself.
```

### Status preview

Whichever of these is true after the tick:

```
still outstanding, no install date    AWAITING DELIVERY    #9CC3E2
still outstanding, install date set   SCHEDULED  ⚠ ...     #8ECF8E + lip
all received, no install date         EQUIPMENT RECEIVED   #B5E3B5
all received, install date set        SCHEDULED            #8ECF8E
```

---

## DIALOG 3 · Schedule  ★ rendered

A **living record** — one row per version, reopened as the job moves.

### Group box · "The dates"

```
Version     [ 26-09A0  Dobson Park Ramadas ]   read-only chip
Install     [ 22 Sep 2026 ]   ★    set by the customer
Buffer      [ 1 ] days             how long you are holding either side
Started     [            ]         when the crew is on site
Completed   [            ]         off site and not coming back
```

`Install` carries a grey explanation: **the customer sets this date, you do
not.** That is why it is not derived from a duration.

`Started` and `Completed` stay empty in the render — this job has not begun.

### Group box · "Equipment" — read-only, and the reason this dialog is dangerous

```
Received    2 of 3 line items · 1 short
            ⚠ Shade sail 20 ft × 20 ft — 1 of 2 received 10 Sep 2026
```

Read-only, in `#a00`. It is here so you cannot set a date without seeing it.

### Tip block · `#ffffe1`

```
Completed does not complete the job.

Filling in Completed means the crew is off site. The job stays ACTIVE until
the invoice goes out, because completion IS the invoice — there is no
"completed, payment required" state. Use Invoice… when you bill it.
```

This is genuinely counterintuitive and it is the single removed status
reasserting itself. Say it in the dialog, not just in the docs.

### Status preview — with the lip

```
📋 26-09A0 becomes
   ▌ SCHEDULED   22 Sep 2026        ⚠ no equipment received
   ───────────
   Scheduling a job whose equipment is not on the lot is the alert this
   application exists to raise. The date is not blocked — the job just
   carries the warning until the last crate lands.
```

Chip ground `#8ECF8E` **green**, with the 4 px `#CC0000` lip on its left edge
and the alert to the right in `#a00`.

**A red row always means finished, so a problem is never a tint.** Green with a
red lip is exactly right: the job's real phase, visibly wrong. This is the
`26-09` row already rendered in the Project Browser, previewed before it is
caused.

---

## DIALOG 4 · Invoice  — specified, not rendered

The other **living record** — `sent`, then later `paid`.

### Group box · "The invoice"

```
Version     [ 26-09A0  Dobson Park Ramadas ]   read-only chip
Reference   [ BPCi-26-09A0 ]  read-only chip   assigned on save
Sent        [ 10 Sep 2026 ]   ★
Amount      [ $43,270.00 ]                     approved scope + change orders
Paid        [            ]                     set by hand
```

`Paid` carries a grey explanation: **receivables live in QuickBooks.** This
field exists so the status can move to `COMPLETED, PAID`, not so the app can
chase money.

### Group box · "Progress billing" — only when it applies

```
☑ This is one draw of several
  Draw    [ 1 ] of [ 3 ]   Label [ Deposit ]
  Reference becomes  BPCi-26-09A0-1/3
```

Unticked by default. Most jobs bill once.

### Group box · "Warranty"

```
Starts      [ 10 Sep 2026 ]  read-only chip   the day the invoice is sent
Length      [ 12 ] months                     adjustable
Expires     [ 10 Sep 2027 ]  read-only chip   derived
```

**Sending the invoice starts the warranty clock.** That is a real consequence
of this dialog and it belongs on it, not hidden.

### Status preview

```
📋 26-09A0 becomes
   INVOICE SENT, PAYMENT REQUIRED   10 Sep 2026
   ──────────────────────────────
   Warranty runs to 10 Sep 2027. Record Paid here when it clears.
```

Chip ground `#F0B778`.

---

## Failure modes — do not reproduce

- **A status dropdown, anywhere, in any of the four.** Status is derived. If a
  dialog lets you pick one, the entire model is broken.
- **A status preview that is not tinted**, or that is tinted by severity rather
  than by the ramp. The chip wears the status's own colour.
- **A red tint for a problem.** 4 px lip, `#a00` text. A red row means
  finished.
- **Blocking the date** in Schedule when equipment is short. It warns. It does
  not refuse — the customer sets that date and reality does not care what the
  app thinks.
- **Wizards.** Living records reopen with every field editable, always.
- **Pricing the revision** in Record approval. It names what changed and
  hands off; the recompute happens when REV1 opens.
- **A total in the revision case.** There is no honest one to show.
- **Add options listed flat**, without their line and without the indent. A
  line option that looks job-level is an add option nobody can place.
- **A tickable line option whose line is unticked.**
- **A "completed, payment required" state** appearing anywhere.
- **56 px date fields.** 80 px, and every date carries its year.
