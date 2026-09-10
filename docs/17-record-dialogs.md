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

- Left: **`Record approval — 26-12A0`** with `Create revision` **unticked** —
  the as-quoted mode, so the add options section IS shown, with `01.O1` nested
  under its context row and `J.O1` at top level. `Approved job scope
  $40,610.00`, clean `ACCEPTED` preview, button reads `Record`.
- Right: **`Line items — BPCe-26-12A0`**, what the checkbox opens — every
  priced row, sub-items and add options included, 4 benches of 6, the no-total
  footer, button reads `Use this & create REV1`.

Captions above each in `#fff` bold 11 px:
`RECORD APPROVAL — as quoted, the default` and `LINE ITEMS — after ticking Create revision`

**These are two different moments, not one screen with a popup over it.** The
left dialog is showing the mode where the add options section exists; tick the
box and that section is gone. Render them as two independent panels.

Both **600 px**, top-aligned, 18 px apart. **The right one is a child of the
left**, so render it slightly lower — 22 px — the way a modal opened from a
modal sits.

`Schedule…`, `Record shipment…` and `Invoice…` are **fully specified below but
not rendered** — same grammar, and they can follow in their own pass.
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

### Group box · "What they took" — two modes, one checkbox

```
Base         ☑  BPCe-26-12A0                              $38,420.00
             ☐  Create revision — the PO does not take every line


Add options     01     Ramada — 20 ft × 20 ft hip
                ☑  01.O1   Drilled footings, 4 posts        $2,190.00
                ☐  J.O1    Security fence, 120 LF           $4,850.00
                ──────────────────────────────────────────────────────
                   Approved job scope                      $40,610.00
```

**The `Add options` row carries an extra `10 px` above it** — a clear break
from the base block, not just another grid row. They are two different
questions: *did they take the estimate*, and then *what else did they add*.
Everything else keeps the standard `4px 8px` grid gaps.

`38,420.00 + 2,190.00 = 40,610.00`. The fence was not taken.

#### `☐ Create revision` is a checkbox, not a button

Ticking it **opens the Line items popup immediately** and switches the whole
box into its other mode. Untick it and the revision is discarded.

Once ticked, the row carries a summary and a way back in:

```
☑  Create revision — 4 of 5 lines · 4 of 6 benches        [ Edit… ]
```

#### The add options section only exists in the as-quoted mode

**Tick `Create revision` and the add options section disappears entirely.**
Not greyed — gone.

That is not a shortcut, it is the only coherent arrangement. In the revision
mode every priced row on the estimate — base lines, sub-items, line options and
job options alike — is decided **inside the popup**, because the PO is one
document and reading it should mean filling in one list. Leaving add options
behind on the parent would split one decision across two windows and require
them to stay in sync.

```
as quoted        base is a single tick · add options decided HERE
create revision  everything decided in the popup · this section is gone
```

#### How add options show what they attach to

The editor numbering from `document_lines` is doing real work:

```
01        a line
01.O1     ADD OPTION 1 ON LINE 01   ← specific. the footings for the ramada.
J.O1      ADD OPTION 1 AT JOB LEVEL ← general. the security fence.
```

A **line-specific** option is nested under its line, and the line above it is
**context only — no checkbox.** The line itself is not being decided here; the
whole base was taken with one tick. It is there so you can see what the option
belongs to.

A **general** option sits at the top level, where a line would, with nothing
above it.

```
   01     Ramada — 20 ft × 20 ft hip          ← context row, NO checkbox
   ☑  01.O1   Drilled footings, 4 posts       ← nested. belongs to 01.
   ☐  J.O1    Security fence, 120 LF          ← top level. belongs to the job.
```

Indentation shows it, the reference proves it, and a line with no options of
its own never appears at all.

### Tip block · `#ffffe1`

```
A PO that does not match the estimate creates REV1.

Open Line items and record what was actually ordered. Any line dropped or
re-quantified makes this an approval AND a revision — REV1 is issued
carrying that scope, and REV1 is what the job runs on from then on.

The new price is not the old price minus the missing lines. Dropping half a
concrete order leaves the rest more expensive per yard, and the recompute is
the only thing that knows that.
```

**Revisions are born here, not on another screen.** Nobody reads the same PO
twice, and re-keying it somewhere else is how scope and paper drift apart.

### Status preview

**When the PO matches — the render shows this:**

```
📋 26-12A0 becomes
   ACCEPTED   09 Sep 2026
   ─────────
   Approved scope $40,610.00. Next: awaiting delivery.
```

When Line items has been used:

```
📋 26-12A0 becomes
   ACCEPTED   09 Sep 2026
   ─────────
   And BPCe-26-12A0 REV1 is created, carrying 4 benches instead of 6.
   Its cost recomputes on open. REV1 is what the job runs on; the
   original stays on file, unchanged.
```

Chip ground `#9CC3E2` in both. **No lip** — a revision is not a problem, it is
Tuesday.

### Buttons — they change with the PO

```
PO matches       [  Record  ]                    [ Cancel ]
PO differs       [ Record & create REV1 ]        [ Cancel ]
                        184 px, default
```

The button says what will happen. No hidden second document.

`Record` is disabled while **nothing** is ticked — there is no such thing as a
rejection here, and an approval of nothing is not one.

---

## DIALOG 1b · Line items  ★ rendered — opened by the checkbox

**Title bar:** `Line items — BPCe-26-12A0`

Opened when `Create revision` is ticked. It is a **detail sheet, not a
record**, and it holds **every priced row on the estimate**:

```
                                              quoted   ordered      amount
☑  01     Ramada — 20 ft × 20 ft hip           1 ea     [ 1 ]   $22,480.00
   ☑  01.1    Hip frame, 4 posts                                $14,200.00
   ☑  01.2    Fabric — Sunbrella, forest green                   $5,900.00
   ☑  01.O1   Drilled footings, 4 posts        [opt]             $2,190.00
☑  02     Site work — grading and base         1 ls     [ 1 ]    $9,140.00
☑  03     Benches                              6 ea     [ 4 ]    $6,800.00
             ⚠ 4 of 6 — price recomputes in REV1
☑  J.O1   Security fence, 120 LF               [opt]             $4,850.00
```

**Add options are here too**, nested exactly as they are on the parent — which
is why the parent's add options section goes away. One PO, one list.

#### `[opt]` marks an add option

A small tag in the `quoted` column — an add option has no quoted quantity, so
the column is free. `'Lucida Console'` monospace, `#404040`, in square
brackets, not a bevelled chip.

It gives the list a clean binary:

```
[opt] present    an add option — 01.O1 nested, or J.O1 at top level
indented, none   a sub-item — a partial breakdown of the line above it
top level, none  a line
```

**Line-specific versus general is already carried** by the indent and the
reference — `01.O1` sits under `01`, `J.O1` sits where a line would. `[opt]`
does not need to say it twice, so there is no `[opt·job]` variant.

**No `[opt]` tag on the parent dialog's add options section**, where every row
is an option already and the tag would be noise.

#### Sub-items do not sum to their line, and that is not a bug

`14,200.00 + 5,900.00 = 20,100.00`, against a line of `$22,480.00`. **Do not
"fix" this.** A sub-item list is a *partial* breakdown — a line may also hold
cost directly — which was settled when the estimate editor was designed. A
renderer or a build that made these add up would be inventing a rule the
business does not have.

Sub-items are tickable, because "they took the line but not that part of it"
is a real thing a PO can say. Unticking one **does not subtract its amount** —
nothing on this screen subtracts anything.

#### Quantities, not just ticks

*"Five benches quoted, four ordered"* is the common shape of a partial PO, and
a tick cannot say it. `ordered` defaults to `quoted` and is editable. Setting
it below quoted — or unticking any row — is what the revision will carry.

#### It creates nothing

**This popup writes nothing.** It hands its result back to `Record approval`,
and REV1 exists only once `Record` is pressed there. Cancel the approval and
the revision was never real — otherwise an abandoned approval would leave an
orphan REV1 on the version forever.

#### The footer — no total

```
────────────────────────────────────────────────────────────
⚠ The PO does not match the estimate.

  BPCe-26-12A0 REV1 will be issued carrying the scope above, and the
  cost recomputes against it. This dialog does not price it — dropping
  2 of 6 benches does not subtract 2 × $1,133.33.
```

**No total is shown, and that is deliberate.** The new price cannot be reached
by arithmetic on this screen; it is a marginal recompute against the scope that
is actually happening. A dialog that guessed would be lying in the one place it
matters most.

#### Buttons

```
nothing changed   [    OK    ]                   [ Cancel ]
something changed [ Use this & create REV1 ]     [ Cancel ]
                         184 px, default
```

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

## DIALOG 3 · Schedule  — specified, not rendered

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

### Status preview — with the lip  ★ the family's signature case

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
- **Pricing the revision** anywhere in this family. Line items names what
  changed; the recompute happens when REV1 opens.
- **A line-item table on the Record approval dialog.** One base row plus a
  checkbox. The table lives in the popup.
- **Add options showing in both modes.** They belong to the as-quoted mode
  only; the revision decides them in the popup.
- **A checkbox on an add option's context line.** That row is context.
- **Sub-items made to sum to their line.** They are a partial breakdown.
- **`[opt]` on the parent dialog.** Every row in that section is an option.
- **An `[opt]` variant that encodes job-versus-line.** The indent and the
  reference already do.
- **Base and add options as adjacent grid rows.** 10 px between them.
- **The popup writing anything.** It hands back; `Record` commits.
- **A total in the revision case.** There is no honest one to show.
- **Add options listed flat**, without their line and without the indent. A
  line option that looks job-level is an add option nobody can place.
- **A tickable line option whose line is unticked.**
- **A "completed, payment required" state** appearing anywhere.
- **56 px date fields.** 80 px, and every date carries its year.
