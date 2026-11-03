# Design brief — INVOICE DIALOG
**POPUP**, 600 px, **two modes of one living record**. Opened by `Invoice…` on
the Version View toolbar.
Apply `03f-money-formatting.md`, `11-date-formatting.md` and
`22-unknowns-and-alarms.md`.

**Style reference:** `docs/design/record-shipment.v2.dc.html` — **FINAL**, the
closest sibling.

---

## ⛔ SCOPE

**Two dialogs side by side** on a `rgba(0,0,0,.42)` scrim, 600 px each, 18 px
apart, top-aligned — **the same dialog at two moments.**

```
SENT — recorded when the invoice goes out
PAID — the same dialog, reopened when it clears
```

One well-formed document. Nothing after `</x-dc>`.

---

## A living record, not two dialogs

```
sent   →   paid
```

You record the invoice going out, and come back weeks later to record the
money arriving. **Both moments change the status**, which makes this the only
record dialog where the preview says `becomes` twice.

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
MONEY            right-aligned, $ and two decimals, 'Lucida Console'
REQUIRED         ★ in #a00
TIP BLOCK        #ffffe1 · 1 px black inset
RECORD BLOCK     #ffffc0 · 1 px #808080 inset · 📋 · the STATUS PREVIEW
BUTTONS          Record 110 px (default, outlined bold) · Cancel 78 px
TYPE             10 px Tahoma, letter-spacing .05em. never 11 px.
```

---

## Group box · "The invoice"

```
Project     [ 26-09  Dobson Park Ramadas ]        read-only chip
Version     [ 26-09A0 ]  Option A · version 0     read-only chip
Reference   [ BPCi-26-09A0 ]  read-only chip      assigned on save
Sent        [ 25 Sep 2026 ]   ★
Amount      [ $43,270.00 ]
            approved scope plus change orders
Paid        [            ]
            receivables live in QuickBooks
```

`Reference` is `assigned on save` for the same reason every other number is:
two people invoicing at once would both be shown the same one.

### `Paid` is not the app chasing money

The grey line under it says so. **It exists so the status can move**, not so
this becomes an accounts-receivable system — that was ruled out of scope on day
one and stays out.

On the **SENT** panel it is empty. On the **PAID** panel it reads
`02 Oct 2026`.

---

## Group box · "Progress billing" — only when it applies

```
☐ This is one draw of several
```

**Unticked in both rendered panels.** Most jobs bill once, and an unticked box
shows nothing beneath it.

Ticked, it reveals the schedule — **see the separate section below.**

---

## Group box · "Warranty"

```
Starts      [ 25 Sep 2026 ]  read-only chip     the day the invoice is sent
Length      [ 12 ] months
Expires     [ 25 Sep 2027 ]  read-only chip     derived
```

**Sending the invoice starts the warranty clock**, and that is a real
consequence of this dialog rather than a detail hidden on another screen.
`Starts` is a chip because it *is* `Sent` — it cannot be set independently, and
a field you could type into would suggest otherwise.

`Expires` is `Starts + Length` and recomputes as you change the months.

Identical on both panels: **paying does not move the warranty.**

---

## Status preview — `becomes`, twice

### SENT panel

```
📋 26-09A0 becomes
   INVOICE SENT, PAYMENT REQUIRED   25 Sep 2026
   ──────────────────────────────
   Warranty runs to 25 Sep 2027. Record Paid here when it clears.
```

Chip ground `#F0B778`, the ramp's orange. **No lip** — nothing is wrong.

### PAID panel

```
📋 26-09A0 becomes
   WARRANTY   until 25 Sep 2027
   ─────────
   Paid 02 Oct 2026. Covered for another 358 days, then the job goes
   COMPLETED on its own with nothing to record.
```

Chip ground `#E89494`, the ramp's red. **A red row always means finished** —
and a paid job in warranty is finished, which is exactly what the ramp is for.

`358` is `25 Sep 2027 − 02 Oct 2026`.

---

## PROGRESS BILLING — render 11, its own panel

Ticking the box turns the dialog into one draw of several, and that changes
more than a reference suffix.

```
☑ This is one draw of several

  Draw       [ 2 ] of [ 3 ]        Label  [ Progress ]
             Reference becomes  BPCi-26-09A0-2/3

  DRAW   LABEL       AMOUNT        SENT           PAID
  1/3    Deposit     $12,981.00    14 Aug 2026    28 Aug 2026
  2/3    Progress    $17,308.00    25 Sep 2026    —            ← this one
  3/3    Final       $12,981.00    —              —
  ＋ Add a draw…
  ────────────────────────────────────────────────────────────
         Scheduled                 $43,270.00     matches the job
```

`12,981 + 17,308 + 12,981 = 43,270.00`, which is the job. **When they do not
match, the footer says so in `#a00`** — `⚠ draws total $41,000.00 · $2,270.00
short of the job` — because a billing schedule that does not add up to the work
is money you will never send an invoice for.

### ★ A DRAW IS NOT THE INVOICE

This is the thing drawing it exposed, and the brief had it wrong.

**The warranty clock starts when the invoice is sent** — but with draws, *which*
invoice? A deposit goes out before anyone turns up. If it started the warranty,
you would be covering a job you have not built.

```
draw 1 of 3    a deposit. the job has not started.
draw 2 of 3    progress. the crew is on site.
draw 3 of 3    THE INVOICE. warranty starts here.
```

**Only the final draw moves the status and starts the clock.** Every earlier
one leaves the job exactly where it was — the same shape as `Record shipment…`,
where three of four outcomes hold the status.

### The Warranty box on a non-final draw

```
Starts      —  not yet
            the clock starts when draw 3 of 3 is sent
Length      [ 12 ] months
Expires     —
```

`Starts` and `Expires` are `—`, **not `[?]`**. This is not unknown, it is *not
applicable yet* — `docs/22`'s distinction, and exactly the case it exists for.

### `Amount` is the draw, not the job

```
Amount      [ $17,308.00 ]
            draw 2 of 3 · job total $43,270.00
```

### The schedule is display-only

`docs/12`'s rule. `DRAW`, `SENT` and `PAID` are **derived** — sent and paid come
from opening each draw's own invoice — so only `LABEL` and `AMOUNT` are ever
typed, in a 480 px row editor:

```
Add a draw — 26-09A0
  Label     [ Progress ]      ★
  Amount    ◉ Percent  [ 40.0 ] %   →  $17,308.00
            ○ Fixed    [            ]
```

**Percent first**, because that is how a billing schedule is agreed — "30 on
signing, 40 at rough-in, 30 on completion" — and the dollars follow. A fixed
amount is there for the job where someone negotiated a number.

### Status preview — `status does not change`

```
📋 26-09A0 — status does not change

   ACTIVE   since 22 Sep 2026
   ─────────
   A draw is not the invoice. The job stays ACTIVE and the warranty clock
   does not start until draw 3 of 3 goes out.
```

Chip ground `#F5E183`, the ramp's yellow for `ACTIVE`. **No lip** — a
mid-job draw is not a problem.

### Render 11 — one panel

`Invoice — 26-09A0`, 600 px, alone on a `rgba(0,0,0,.42)` scrim, progress
billing **ticked**, everything as above. Caption in `#fff` bold 11 px:

```
PROGRESS BILLING — draw 2 of 3, and the warranty has not started
```

---

## ★ A model inconsistency this dialog exposes

`00-TREE` §1 lists **`COMPLETED, PAID`** as a status. **Nothing can ever
produce it.**

```
the derivation, from docs/02
    invoice sent          INVOICE SENT, PAYMENT REQUIRED
    paid, in warranty     WARRANTY
    warranty expired      COMPLETED
```

The warranty clock starts when the invoice is **sent**, so a job is always
inside its warranty by the time it is paid. `COMPLETED, PAID` would last **zero
time**.

**This is the identical argument that removed `COMPLETED, PAYMENT REQUIRED`** —
a status with no trigger of its own. It should go the same way, taking the
count from fourteen to thirteen.

**Not changed unilaterally.** The status list is load-bearing and Damian owns
it; this brief renders `WARRANTY` on the PAID panel, which is what the
derivation actually produces, and flags the list for correction.

---

## Buttons

```
[  Record  ]   [ Cancel ]
   110 px        78 px
```

Both panels. **No `Apply`** — and the PAID panel is the same dialog reopened,
so its button still reads `Record`, not `OK`.

---

## Failure modes — do not reproduce

- **A status dropdown.** Status is derived.
- **`Starts` as a typeable field.** It is `Sent`.
- **`Expires` typed rather than derived.**
- **The warranty box changing between panels.** Paying does not move it.
- **`COMPLETED, PAID` on the PAID panel.** The derivation says `WARRANTY`.
- **A lip on either chip.** Neither state is a problem.
- **Progress billing expanded** while its box is unticked.
- **A non-final draw moving the status** or starting the warranty.
- **`[?]` in the Warranty box on a non-final draw.** It is `—`: not
  applicable yet, not unknown.
- **A draw schedule that does not sum to the job**, shown without an alarm.
- **Typing `SENT` or `PAID` in the schedule.** They come from each draw's
  own invoice.
- **`OK` on the reopened panel.** It records; it does not close a form.
- **Receivables features** — ageing, reminders, part payments. QuickBooks.
- **11 px type**, or a date without its year.
