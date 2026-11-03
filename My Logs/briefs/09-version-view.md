# Design brief — VERSION VIEW
**MAIN**, an MDI child window — not a popup. Opened by double-clicking a version
in the Project Browser, and it **stays open** while you work elsewhere.
Apply `03f-money-formatting.md`, `08-status-colours.md` and `11-date-formatting.md`.

```
Project Browser (the frame)
   double-click a version  →  THIS WINDOW
                                 [Cost breakdown] →  MDI child
                                 [Estimate]       →  MDI child
                                 [Post cost]      →  MDI child
                                 [Record …]       →  popups
```

Two jobs open at once is two version views plus whatever each has open beneath
it, all listed in the Window menu.

---

## ⛔ SCOPE

One screen, one state. No dialogs, no menus open, no second window.

## ⛔ RENDER THE VALUES LITERALLY

Every figure, date and status below is final.

---

## What it is

**The hub for one job.** A version is the job — it has its own estimate, its own
schedule, its own invoice, its own warranty — and this is where you see where it
stands and jump to the screens that do the work.

It is a **status page, not a working surface.** Almost everything on it is
read-only. The work happens in the cost breakdown, the estimate editor and the
dialogs the toolbar opens.

---

## Window

**1000 × 780**, MDI child on the teal desk. **10 px Tahoma, `letter-spacing:
.05em`** — same as the browser.

```
Version 26-09A0 — Dobson Park Ramadas                        [_][□][×]
File   Edit   Version   Documents   Tools   Help
[Cost breakdown] [Estimate] ‖ [Record approval…] [Record shipment…]
[Schedule…] [Invoice…] ‖ [Post cost]
```

`Post cost` is **greyed** — the job is not complete.

### Identity strip

Sunken band, two rows, grey labels:

```
Customer   Exerplay, Inc. · Grant Smith      Project    26-09 Dobson Park Ramadas
Site       1625 W Ryan Rd, Chandler AZ       Version    Option A · version 0
```

### Status strip

Full width, **tinted with the status colour** — here `#8ECF8E` green for
`Scheduled` — with a 4 px `#CC0000` lip at the left because there is a problem.

```
▌  Scheduled            install 22 Sep 2026          ⚠  No equipment on the lot
                                                   Play Structure PS-4400
                                                   outstanding · ship date
                                                   was 02 Sep 2026
```

Status name in 15 px bold. The alert on the right in `#a00`.

---

## Body — two columns

### ⛔ STRUCTURE — this is what broke the last attempt

The body is **one flex row containing exactly two children**, both inside it,
both inside the window, and the whole file is **one well-formed document**.

```
<body row>
   <left  width:430px flex:none>   Progress · Shipments
   <right flex:1 min-width:0>      Documents · Money · Schedule
</body row>
```

In the previous render the right column was emitted **after `</html>`** and cut
off mid-box. Nothing may appear after `</x-dc>`.

**Five group boxes, not six.** Warranty folds into Schedule as three extra rows
— it is three lines and does not earn a box of its own. Fewer boxes is also
less markup to get wrong.

**Boxes size to their content and stack from the top.** They do not stretch to
fill the window. Leftover height sits empty at the bottom of the shorter column.

Window is **1000 × 780** — the right column is the taller of the two and 700
was not enough for it.

Group boxes are sunken with legend chips, the Requirements tab's construction.

### LEFT · "Progress"

The lifecycle from `Accepted` onward, one row each, with its date. This is the
spine of the screen.

```
   ✓  Accepted                    02 Sep 2026    PO 4471-B
   ✓  Awaiting delivery           02 Sep 2026
   ⚠  Equipment received             —      1 of 2 shipments
   ●  Scheduled                   22 Sep 2026    ← current
      Active
      Invoice sent
      Completed, paid
      Warranty
      Completed
```

```
✓  done, black
⚠  reached but incomplete, #a00
●  current, bold, with a 9 px square of the status tint before it
   future states in #909090, no marker
```

### LEFT · "Shipments"

```
Expected ship date              02 Sep 2026      ⚠ 7 days late
   #1   received 28 Aug 2026   ✓  4 crates · 12 photos
        Ramada frame · hardware · fabric
   #2   not received      ⚠  Play Structure PS-4400

                                 1 of 2 components received
```

### RIGHT · "Documents"

A small table: reference · what · created · sent · state.

```
BPCc-26-09A0   Cost breakdown   14 Aug 2026     —          complete
BPCe-26-09A0   Estimate         20 Aug 2026     20 Aug 2026     accepted 02 Sep 2026
               Change orders    —          —          none
               Invoice          —          —          not raised
               Post cost        —          —          not started
```

Rows with no document show the type in `#909090` and a state in `#909090`.
Double-clicking a real reference opens it.

### RIGHT · "Money"

```
Quoted                                        $15,250.00
Approved                    PO 4471-B         $15,250.00
Change orders               none                   $0.00
                                              ───────────
Revised contract                              $15,250.00
Invoiced                                           $0.00
Paid                                               $0.00
                                              ───────────
Outstanding                                   $15,250.00

Cost $11,834.00  ·  margin 22.4%
```

The cost line in `#606060` — internal, never on a customer document.

### RIGHT · "Schedule"

```
Install date                22 Sep 2026
Duration                    3.1 days      24.8 hr · crew 3 × Installer
Equipment                   Telehandler 9.0 hr · Mixer 2.0 hr
Mobilization                2 trips · 18 mi · 0.4 hr each way
Materials to deliver        Concrete 4.50 CY · Rebar Cage B 6 EA
```

### RIGHT · "Schedule" continued — the warranty rows

Appended to the Schedule box after a 1 px `#ececec` rule. No separate box.

```
────────────────────────────────────────────────
Warranty starts             on invoice — not yet started
Warranty term               12 months
Warranty expires            —
```

---

## Status bar

Three sunken `var(--t)` segments across the foot, matching the browser and the
cost breakdown.

```
⚠ Next — receive Play Structure PS-4400 · 7 days late   │ Estimate locked 02 Sep 2026 │ changed 08 Sep 2026 14:22 · DK
                    flex                                          210 px              190 px
```

### The `Next` segment is derived

It is the single most useful line on the screen: **what has to happen for this
job to move.** Never typed, always computed from the same facts that drive the
status.

```
status                      Next reads
──────────────────────────────────────────────────────────────────────────
Draft                       Build the cost breakdown
Estimate created            Send the estimate
Sent, awaiting              Awaiting answer — sent 20 Aug 2026, 19 days
Expired                     Quote expired 19 Sep — reissue or close
Blocked                     Cannot issue — 2 problems in the cost breakdown
Accepted                    Waiting on equipment — expected 02 Sep 2026
Awaiting delivery           Waiting on equipment — expected 02 Sep 2026
Equipment received          Set an install date
Scheduled                   Install 22 Sep 2026
Active                      Raise the invoice when work is complete
Invoice sent                Awaiting payment — 4 days
Completed, paid             Post cost not started
Warranty                    Under warranty to 14 Mar 27
Completed                   —
```

**A problem overrides it.** When something is wrong the segment shows the
problem instead of the ordinary next step, prefixed `⚠` and in `#a00`:

```
⚠ Next — receive Play Structure PS-4400 · ship date was 02 Sep 2026, 7 days late
```

Which is the case rendered here — the job is `Scheduled`, so it would normally
read `Install 22 Sep 2026`, but the missing equipment wins.

### The other two segments

```
Estimate locked 02 Sep 2026     the document state. a locked estimate can never
                           be edited, so saying so on every screen is worth
                           the space.
changed 08 Sep 2026 14:22 · DK  when, and by whom. the schema has users.
```

---

## Rules

- **Status colour tints the status strip only**, not the whole window.
- **A problem shows as a 4 px `#CC0000` lip** on the status strip, plus `#a00`
  text. Never a red tint.
- **Almost nothing here is editable.** Dates, money and states are read-only;
  the toolbar opens the dialogs that change them.
- **A document row with no document is not blank** — it names the type in grey
  and says what state it is in, so you can see what has not happened yet.
- Money carries `$` and two decimals. Cost is `#606060`.
- **Every date carries its year** — `22 Sep 2026`. See `11-date-formatting.md`.
- **The status bar's `Next` is derived, never typed**, and a problem always
  displaces the ordinary next step.
- **One well-formed document.** Two columns, both inside one flex row, nothing
  after `</x-dc>`, nothing truncated.
- **Boxes size to content.** They never stretch to fill the window.
