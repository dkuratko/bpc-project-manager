# Design brief — NEW VERSION
**POPUP**, alone on a `rgba(0,0,0,.42)` scrim. Opened by `New version` on the
browser toolbar, by `New version` on the project browser's right-click menu, or
from the version view's toolbar.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/new-project.v2.dc.html` — **FINAL**.
Copy its dialog grammar exactly. It is the template for every popup.

**Do not use** `docs/design/reference/ideas-9b-new-version-dialog.dc.html` for
content. 9b is the same dialog from a superseded model: it called an option a
"version" and a version a "rendition", and it opened the estimate instead of
the cost breakdown. Its *notes panel* is still worth reading — two of the three
problems it lists are fixed here, and the third is a real open question.

---

## ⛔ SCOPE

One dialog, alone on the scrim. No window behind it. No notes panel. One state.
One well-formed document, nothing after `</x-dc>`.

---

## The dialog grammar — inherited, not re-decided

Identical to `12-new-project.md`. Restated so nothing has to be looked up:

```
WIDTH            600 px
SPACING          dialog padding 10px 9px 9px · 10 px between group boxes ·
                 group box padding 13px 9px 8px
FIELD ROWS       grid-template-columns: 100px 1fr · gap 4px 8px ·
                 align-items: center
READ-ONLY VALUE  #c0c0c0 ground · var(--t) sunken bevel · #404040 text.
                 a chip, visibly not a field.
EDITABLE FIELD   #fff ground · var(--s) bevel
DROPDOWN         white field, #c0c0c0 raised arrow button inside its right edge
EXPLANATION      grey #404040 at line-height 1.5, in the VALUE column with an
                 empty label cell beside it. sits under what it explains.
TIP BLOCK        #ffffe1 · 1 px black inset · the rule or the caveat
RECORD BLOCK     #ffffc0 · 1 px #808080 inset · prefixed 📋 · what this action
                 will WRITE DOWN, permanently
BUTTONS          fixed width, right aligned. default outlined 1 px black,
                 offset 1 px, bold.
```

**One departure:** this dialog has radio groups, which New Project does not.
A radio is `◉` / `○` in the text flow at 10 px — no custom control, no bevel.
Each radio's consequence line sits directly under it in `#404040`, indented to
clear the glyph. The selected radio's label is plain black; the unselected
labels are plain black too. **Do not grey out the unselected options** — they
are equal choices, not a disabled state.

---

## Why this dialog exists

A project already holds `26-10A0`, `26-10A1`, `26-10B0`. The user wants a
fourth. There are two completely different things they might mean, and
**telling them apart is the most likely user error in the application**:

- a **different answer** to the customer's problem — different equipment,
  different approach. That is a new **option**: letter `C`, and `C0` in it.
- the **same answer**, priced or worded again. That is a new **version** inside
  an existing option: `B1`.

One command, `New version`, opens one dialog that makes the user choose. Two
separate menu items would make them choose *before* the dialog could help.

---

## Content

### Title bar

```
New Version
```

### Group box 1 · "What kind"

```
Kind        ◉ A different answer — new option
              creates option C, and version C0 inside it
            ○ The same answer, priced or scoped again
              creates B1, inside option [ B ▼ ]

            An option is a letter and nothing else. Both choices create
            exactly one thing — a version. The only difference is
            whether the letter is new.
```

Render with **the first radio selected**.

The `[ B ▼ ]` picker is a dropdown listing the project's existing letters
(`A`, `B`). It belongs to the second radio and sits inline in its consequence
line. It is **not** greyed even though the second radio is unselected — a user
reaching for the picker is choosing the radio.

The explanation line under both is the load-bearing sentence in this dialog. It
is literally true of the schema: there is no options table. `C` exists because
`C0` exists.

### Group box 2 · "Identify it"

```
Project     [ 26-10  San Tan Shade Installation ]      read-only chip
Reference   [ 26-10C0 ]  read-only chip                assigned on save
Name        [ Value engineered — surface mount, no ramada ]   ★
Why         [ Customer asked for a cheaper option 04 Sep 2026 ]
Created     [ 09 Sep 2026 ]  read-only chip            today · not editable
```

`Name` is required. This dialog only ever creates a **second or later** version
— the first, `A0`, comes from New Project's `Create & start version A0`, where
no name is needed because there is nothing yet to tell it apart from. Here
there always is.

`Why` gets an explanation line:

> Not paperwork. Writing the reason is what catches a new option being
> created when a version was meant.

`Reference` gets `assigned on save`, in grey, beside the chip — same treatment
and same reason as New Project's project number. **The letter is not reserved
when the dialog opens.** Two estimators with this dialog open would both be
shown `C`; only the one who saves first gets it. This is 9b's third note,
fixed.

### Group box 3 · "Scope"

```
Start from  ○ Empty — build it up from the catalog
            ◉ Copy  [ 26-10B0  Surface mount — no ramada  ▼ ]
            ○ Copy from another project…

            Copies every scope row and direct service, the scope groups,
            markup and contingency, the mobilization facts, and every
            procurement and disposition method chosen. Never copies notes,
            the composed estimate, sent status, approvals, change orders,
            the schedule, shipments, invoices or actuals.
```

Render with **Copy selected**, source `26-10B0`.

Copy is the default because copy is the truth — almost every version starts as
a variation of one that exists. Empty is offered first in the list because it
is the simpler idea, not because it is expected.

The dropdown lists every version in the project with its name, `A0` first.
A version being copied from is never "used up" and never dies — `A0` can be the
source for `C0` today and still be approved next month.

### Tip block · `#ffffe1`

```
Every number recomputes. One does not.

A copy carries decisions, never dollars — prices, effective rates and
allocations are all recalculated from the catalog against the new version's
own quantities. The single exception is a supplier quote you typed in by
hand: its vendor, quote number and price cannot be recalculated from
anything. It copies with its original quote date and the new version's
Purchasing tab flags it until you confirm or replace it.
```

This is 9b's second note — *"copying procurement decisions is arguable, D0
inherits A0's concrete vendor and its quote date, which will be stale"* —
answered rather than dismissed. In this model almost all of it recomputes,
because procurement stores the *method chosen*, not the price it produced. The
hand-typed product quote is the one place a stale number could reach a
calculation silently, so it is the one place that gets flagged. Nothing
silently assumed.

### Record block · `#ffffc0`, prefixed 📋

```
📋 C0 will carry: "Copied from 26-10B0 on 09 Sep 2026"
   Permanent, non-dismissable, no live link. Later corrections to B0
   never reach C0.
```

### Buttons

Right aligned, `Create & open cost breakdown` is the default — outlined and
bold.

```
[  Create  ]  [ Create & open cost breakdown ]  [ Cancel ]
    110 px               184 px                    78 px
```

**Not "open the estimate".** 9b opened its first estimate, which is backwards
here: the cost breakdown is where scope is created, and the estimate is
composed from it afterwards. `Create` alone leaves you in the browser with the
new version added to the list.

---

## Known gap — not solved here

9b's remaining note stands and this dialog cannot express it:

> **No way to create a version by copying two others.** "A's site work with
> B's equipment" is a real request.

Copying one version then hand-editing is the answer for now. Logged in
`00-TREE.md` §10.

---

## Failure modes — do not reproduce

- **Greying the unselected radio's controls.** The option picker and the copy
  source dropdown stay live. Both radio groups are choices, not toggles that
  disable each other's fields.
- **Two dialogs.** One command, one dialog, one choice made inside it.
- **Reserving the letter on open.** `assigned on save`, always.
- **Version numbering starting at 1.** A new option's first version is `C0`,
  not `C1`. `version_number` is 0-based inside its option.
- **A `BPC` prefix or a type letter on the reference.** A bare version is
  `26-10C0`. `BPCc-`, `BPCe-`, `BPCi-` belong to documents, not to versions.
