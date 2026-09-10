# Design brief — NEW VERSION
**POPUP**, alone on a `rgba(0,0,0,.42)` scrim. Opened by `New version` on the
browser toolbar, by `New version` on the project browser's right-click menu, or
from the version view's toolbar.
**Launched from a VERSION.** Its sibling, `New option`, is launched from a
project — see `docs/13-new-option.md`.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/new-project.v2.dc.html` — **FINAL**.
Copy its dialog grammar exactly.

**There is no reference render for this dialog.** `ideas-9b-new-version-dialog`
is *not* one, despite the name: it assigns a new letter (`Letter [ D ]`), which
makes it a New Option dialog in this model's vocabulary. 9b used "version" for
the letter and "rendition" for the priced thing; we use "option" and "version".
Do not copy its content — it is briefed as `docs/13-new-option.md`.

---

## ⛔ SCOPE

One dialog, alone on the scrim. No window behind it. No notes panel. One state.
One well-formed document, nothing after `</x-dc>`.

---

## The dialog grammar — inherited, not re-decided

Identical to `12-new-project.md` and `13-new-option.md`, **except the width.**

```
WIDTH            480 px   ← not 600. see below.
SPACING          dialog padding 10px 9px 9px · 10 px between group boxes ·
                 group box padding 13px 9px 8px
FIELD ROWS       grid-template-columns: 100px 1fr · gap 4px 8px ·
                 align-items: center
READ-ONLY VALUE  #c0c0c0 ground · var(--t) sunken bevel · #404040 text.
                 a chip, visibly not a field.
EDITABLE FIELD   #fff ground · var(--s) bevel
DROPDOWN         white field, #c0c0c0 raised arrow button inside its right edge
EXPLANATION      grey #404040 at line-height 1.5, in the VALUE column with an
                 empty label cell beside it
TIP BLOCK        #ffffe1 · 1 px black inset
RECORD BLOCK     #ffffc0 · 1 px #808080 inset · prefixed 📋
RADIO            ◉ / ○ in the text flow at 10 px. no custom control, no bevel.
                 controls belonging to an unselected radio stay live.
BUTTONS          fixed width, right aligned. default outlined 1 px black,
                 offset 1 px, bold.
```

**Why 480 and not 600.** This dialog knows more than its siblings before it
opens — the project, the option and the copy source are all already answered by
where it was launched from. What is left is three typed fields. A three-field
dialog stretched to 600 px reads as emptier than the job it is doing, which is
the same argument that compacted New Project. **A family is made by its
grammar, not by one width** — the grid, the chips, the two callout weights are
what make these dialogs siblings.

---

## Why this dialog is separate from New Option

A project already holds `26-10A0`, `26-10A1`, `26-10B0`. Two completely
different things a user might want next, and **telling them apart is the most
likely user error in the application**:

- a **different answer** to the customer's problem — different equipment, a
  different approach. New **option**: letter `C`, and `C0` in it.
  ← `docs/13-new-option.md`
- the **same answer**, priced or worded again. New **version** inside an
  existing option: `B1`. ← *this dialog*

They are two dialogs because **they have different defaults.** New Option is
launched from a project, where which version to copy from is a genuine choice.
This one is launched from a version, where the copy source is already answered:
the one you are standing on. Merging them would have forced a single control to
serve two acts whose answers are not equally open, and made the smaller act
carry a kind-radio and an option-picker it does not need.

The distinction is taught by **adjacency**: the two commands sit next to each
other in the toolbar and the menu, permanently visible, and each dialog carries
a one-line pointer to the other.

---

## Content

### Title bar

```
New Version
```

### Group box 1 · "Identify it"

```
Project     [ 26-10  San Tan Shade Installation ]      read-only chip
Option      [ B ]  read-only chip     a letter and nothing else · 1 version
Reference   [ 26-10B1 ]  read-only chip               assigned on save
Name        [ Repriced — Sep 2026 steel ]   ★
Why         [ Quote expired 04 Sep 2026, mill prices moved ]
Created     [ 09 Sep 2026 ]  read-only chip           today · not editable
```

**`Option` is a chip, never a picker.** Which option you are adding to was
decided by which version you launched from. Offering a letter dropdown here
would quietly turn this back into the merged dialog.

Its grey trailing text — `a letter and nothing else · 1 version` — does two
jobs: it states the model out loud, and the count tells you what you are
joining. `B` has `B0` today, so the new one is `B1`.

`Name` is required, and it names `B1`. `Why` gets an explanation line:

> Not paperwork. Writing the reason is what catches a new version being
> made when a different approach was meant.

`Reference` gets `assigned on save`, in grey, beside the chip. **The number is
not reserved when the dialog opens** — two estimators would both be shown `B1`;
only the one who saves first gets it.

### Group box 2 · "Scope"

```
Start from  ◉ Copy 26-10B0 — Surface mount, no ramada
            ○ Copy another version   [ 26-10A0 ▼ ]
            ○ Empty — build it up from the catalog

            Copies every scope row and direct service, the scope groups,
            markup and contingency, the mobilization facts, and every
            procurement and disposition method chosen. Never copies notes,
            the composed estimate, sent status, approvals, change orders,
            the schedule, shipments, invoices or actuals.
```

Render with **the first radio selected**.

**The first radio names its source in full** rather than hiding it in a
dropdown. That is the whole difference from New Option: here the answer is
already known, so it is stated, not asked. Copying the version you launched
from is what this dialog is for — `B0` priced again is `B1`.

The other two are escape hatches, ordered by how often they are right. `Copy
another version` lists every version in the project, `A0` first; a version
copied from is never "used up" and never dies.

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

This matters more here than anywhere. Repricing is the commonest reason to
make a version at all, so the one number that *cannot* reprice itself is
exactly the one that would embarrass you.

### Record block · `#ffffc0`, prefixed 📋

```
📋 B1 will carry: "Copied from 26-10B0 on 09 Sep 2026"
   Permanent, non-dismissable, no live link. Later corrections to B0
   never reach B1.
```

### Pointer line

Immediately above the buttons, in `#404040`:

> A genuinely different approach — different equipment, a different way to
> build it? That is **New option**, which starts a new letter.

### Buttons

Right aligned, `Create & open cost breakdown` is the default — outlined and
bold.

```
[  Create  ]  [ Create & open cost breakdown ]  [ Cancel ]
    110 px               184 px                    78 px
```

**Not "open the estimate".** The cost breakdown is where scope is created; the
estimate is composed from it afterwards. `Create` alone leaves you in the
browser with `B1` added to the list.

---

## Failure modes — do not reproduce

- **An option picker.** `Option` is a chip. The letter came from where you
  launched.
- **A kind-radio asking option-or-version.** That choice was made by which
  command you picked.
- **Numbering from 1 inside the option.** `version_number` is 0-based, so an
  option's first version is `B0` and the second is `B1`. A brand new option's
  first version is `C0`, never `C1`.
- **A `BPC` prefix or a type letter on the reference.** A bare version is
  `26-10B1`. `BPCc-`, `BPCe-`, `BPCi-` belong to documents.
- **Reserving the number on open.** `assigned on save`, always.
- **600 px.** This dialog is 480.
