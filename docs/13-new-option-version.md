# Design brief — NEW OPTION / NEW VERSION
**One popup, two roles.** The role is set by **which command was pressed**, not
by a control inside the dialog.

**POPUP**, alone on a `rgba(0,0,0,.42)` scrim. Opened by `New option` or
`New version` — adjacent on the browser toolbar, adjacent on the project
browser's right-click menu, and never separated.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

**Style reference:** `docs/design/new-project.v2.dc.html` — **FINAL**.
Copy its dialog grammar exactly. It is the template for every popup.

**Content reference:** `docs/design/reference/ideas-9b-new-version-dialog.dc.html`
— but read the warning in §"What 9b actually is" before using it.

---

## The idea

Both commands create **exactly one thing: a version row.** An option is a
letter and nothing else — `C` exists because `C0` exists. There is no options
table.

So the two roles differ in exactly one place — **where the new version goes** —
and are identical everywhere else, because everywhere else is describing the
same object:

```
              ROLE A · New option          ROLE B · New version
              ─────────────────────        ─────────────────────
title bar     New Option                   New Version
box 1         Option is a NEW LETTER       Option is a PICKER
              chip · C · assigned on save  A ▼ B  ·  pre-set from launch
              → creates C0                 → creates B1
              Name defaults "… Opt. C"     Name defaults "… Opt. B"
─────────────────────────────────────────────────────────────────
box 2         IDENTICAL — Start from / Copy / Empty
tip block     IDENTICAL
record block  IDENTICAL
buttons       IDENTICAL
```

**One row of one group box is the entire difference.** That is the design.

---

## ⛔ SCOPE — read this before rendering

Render **exactly two dialogs, side by side**, one in each role, so the shared
part is visibly shared. This is a deliberate exception to the usual one-dialog
rule and the only reason for it: the brief's whole claim is that the bottom two
thirds are identical, and a single dialog cannot show that.

- Left: **Role A · New option.** Above it, a caption in `#fff` bold 11 px:
  `NEW OPTION — mints a letter`
- Right: **Role B · New version.** Caption: `NEW VERSION — joins a letter`
- Both 600 px wide, top-aligned, 18 px apart.
- **No notes panel. No third state. Nothing after `</x-dc>`.**
- One well-formed document.

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

**One departure:** this dialog has a radio group, which New Project does not.
A radio is `◉` / `○` in the text flow at 10 px — no custom control, no bevel.
Selected and unselected labels are both plain black, and the controls belonging
to an unselected radio stay live. **Do not grey anything out** — a user
reaching for the source dropdown is choosing that radio.

---

## Why the role is set outside the dialog

A project already holds `26-10A0`, `26-10A1`, `26-10B0`. Two completely
different things a user might want next, and **telling them apart is the most
likely user error in the application**:

- a **different answer** to the customer's problem — different equipment, a
  different approach. A new **option**: letter `C`, and `C0` in it.
- the **same answer**, priced or worded again. A new **version** inside an
  existing option: `B1`.

**No kind-radio inside the dialog.** The two commands sit next to each other in
the toolbar and the menu, permanently visible, which teaches the distinction
better than a radio does — a radio is only seen at the moment of creation,
whereas the adjacent pair is seen every time the toolbar is. A radio would also
ask a question the command has already answered.

Each role carries a one-line pointer to the other, for someone who picked
wrong.

---

## Content

### Title bar

Role A: `New Option`   ·   Role B: `New Version`

### Group box 1 · "Identify it" — the only part that differs

**Role A · New option**

```
Project     [ 26-10  San Tan Shade Installation ]      read-only chip
Option      [ C ]  read-only chip            new letter · assigned on save
Reference   [ 26-10C0 ]  read-only chip
Name        [ San Tan Shade Installation Opt. C ]      ← defaulted, editable
Note        [ Customer asked for a cheaper approach 04 Sep 2026 ]
Created     [ 09 Sep 2026 ]  read-only chip            today · not editable
```

**Role B · New version**

```
Project     [ 26-10  San Tan Shade Installation ]      read-only chip
Option      [ B                                    ▼ ]   ← a real dropdown
Reference   [ 26-10B1 ]  read-only chip                assigned on save
Name        [ San Tan Shade Installation Opt. B ]      ← defaulted, editable
Note        [ Quote expired 04 Sep 2026, mill prices moved ]
Created     [ 09 Sep 2026 ]  read-only chip            today · not editable
```

**The `Option` row is the whole difference.** A chip in role A, a dropdown in
role B. Everything above and below it is the same row in the same place.

**The dropdown lists LETTERS, not versions** — `A`, `B`. It is pre-set from
whatever was selected when the command was pressed. Which specific version you
were looking at does not belong here: a new version of `A` is `A2` whether you
were on `A0` or `A1`. The version you were on matters only as the **copy
source**, which is the box below. Offering versions here would be the same
confusion the dialog exists to prevent.

**Changing the dropdown re-points three things:** `Reference` recomputes to the
next number in that letter, the Scope box's copy default follows to that
letter's newest version, and the `Name` default re-suffixes — `Opt. B` becomes
`Opt. A`. That is what makes the picker feel consequential instead of
decorative.

The `Name` default follows the dropdown **only until the user types in it.**
Once the field is dirty it stops following, and changing the dropdown never
overwrites what someone has typed. This is the single most likely thing to be
built wrong.

#### `Name` — defaulted, editable, never required

```
default  <project title> + " Opt. " + <letter>
         "San Tan Shade Installation" + " Opt. C"
```

**The name belongs to the version, never to the option.** An option is a letter
and holds nothing at all — there is no option name, no option record, no
options table. `C` exists only because `C0` exists.

So why does the default describe the *option*? Because "which approach is this"
is option-level meaning that the option cannot hold, so it is carried on the
version instead. `B0` and `B1` defaulting to the same name is correct and not a
collision: they are the same approach, priced twice. What tells them apart is
the reference and the note.

The field stays editable precisely so a version-specific name can override it
— `San Tan Shade Installation Opt. B — repriced Sep 2026`.

**No `★`.** A field that arrives with a value cannot be required. The red star
belongs on New Project's `Title` and `Customer`, which arrive empty.

#### `Note` — free text, optional, not an interrogation

Free text. No prompt, no forced justification, no explanation line beneath it.

An earlier draft called this `Why` and leaned on it to force the
option-versus-version distinction. That was always weak — anything can be typed
into a `Why` box, so it forced nothing — and it made the software interrogate
its user on every single version. **The adjacency of the two commands and the
pointer line carry that weight instead**, which is where it belonged.

`Reference` gets `assigned on save`, in grey. **Nothing is reserved when the
dialog opens** — two estimators would both be shown `C`, or both be shown `B1`;
only the one who saves first gets it.

### Group box 2 · "Scope" — identical in both roles

```
Start from  ◉ Copy  [ 26-10B0  Surface mount — no ramada  ▼ ]
            ○ Copy from another project…
            ○ Empty — build it up from the catalog

            Copies every scope row and direct service, the scope groups,
            markup and contingency, the mobilization facts, and every
            procurement and disposition method chosen. Never copies notes,
            the composed estimate, sent status, approvals, change orders,
            the schedule, shipments, invoices or actuals.
```

Render **Copy selected in both dialogs**, source `26-10B0` in both.

**In this example the two roles happen to show the same source.** Role A
pre-sets to the project's newest version (`B0`); role B pre-sets to the chosen
letter's newest version (`B`'s newest is also `B0`). That coincidence is what
lets the render prove the box is shared — but it is a coincidence of the
example, not a rule. Do not build it as a rule.

Copy is the default in **both** roles, including the new-option role where the
whole point is a *different* answer — because different answers still share
most of their scope. Surface mount and drilled footings are the same shade
assembly; only the footing work differs. Starting empty means retyping
everything the two have in common.

The dropdown lists every version in the project with its name, `A0` first. A
version copied from is never "used up" and never dies — `A0` can be the source
for `C0` today and still be approved next month.

### Tip block · `#ffffe1` — identical in both roles

```
Every number recomputes. One does not.

A copy carries decisions, never dollars — prices, effective rates and
allocations are all recalculated from the catalog against the new version's
own quantities. The single exception is a supplier quote you typed in by
hand: its vendor, quote number and price cannot be recalculated from
anything. It copies with its original quote date and the new version's
Purchasing tab flags it until you confirm or replace it.
```

This is 9b's own note — *"copying procurement decisions is arguable, D0
inherits A0's concrete vendor and its quote date, which will be stale"* —
answered rather than dismissed. In this model almost all of it recomputes,
because procurement stores the *method chosen*, not the price it produced. The
hand-typed product quote is the one place a stale number could reach a
calculation silently, so it is the one place that gets flagged. Nothing
silently assumed.

### Record block · `#ffffc0`, prefixed 📋 — identical in both roles

Role A:

```
📋 C0 will carry: "Copied from 26-10B0 on 09 Sep 2026"
   Permanent, non-dismissable, no live link. Later corrections to B0
   never reach C0.
```

Role B: the same block with `B1` in place of `C0`.

### Pointer line — identical in shape, opposite in content

Immediately above the buttons, in `#404040`:

- Role A: *Repricing or rewording something you already quoted? That is
  **New version**, not a new option.*
- Role B: *A genuinely different approach — different equipment, a different
  way to build it? That is **New option**, which starts a new letter.*

### Buttons — identical in both roles

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

## What 9b actually is

`ideas-9b-new-version-dialog.dc.html` is titled "New Version" but line 22 reads
`Letter [ D ] — assigned automatically`. It is minting a letter, so **in this
model's vocabulary it is the New Option role**, not New Version. 9b used
"version" for the letter and "rendition" for the priced thing; we use "option"
and "version".

Take its grammar and its two callout blocks. Do not take its vocabulary, its
`BPCe`-prefixed version references, or its `Create & open D0` button.

---

## Known gap — not solved here

9b's remaining note stands and this dialog cannot express it:

> **No way to create a version by copying two others.** "A's site work with
> B's equipment" is a real request.

Copying one version then hand-editing is the answer for now. Logged in
`00-TREE.md` §10.

---

## Failure modes — do not reproduce

- **A kind-radio asking option-or-version.** That choice was made by which
  command was pressed. The dialog never asks it.
- **A version list in the `Option` dropdown.** It lists letters. The version
  belongs to the copy source below.
- **Divergent bottoms.** Box 2, both callout blocks and the buttons are the
  same in both roles, pixel for pixel. If they drift, the design is lost.
- **Greying the unselected radio's controls.** The source dropdown stays live.
- **Naming the option.** `C` has no name and no record. The name belongs to
  `C0`. Any label reading "Option name" is wrong.
- **A `★` on `Name`.** It is defaulted, so it is never empty, so it cannot be
  required.
- **The `Name` default overwriting typed text** when the Option dropdown
  changes. It follows only until the field is dirty.
- **A `Why` field, or a prompt beneath `Note`.** It is a note. It asks nothing.
- **Numbering from 1 inside an option.** `version_number` is 0-based: a new
  option's first version is `C0`, never `C1`; `B`'s second version is `B1`.
- **A `BPC` prefix or a type letter on a version reference.** A bare version is
  `26-10C0`. `BPCc-`, `BPCe-`, `BPCi-` belong to documents, not to versions.
- **Reserving the letter or number on open.** `assigned on save`, always.
- **Rendering one dialog, or three.** Exactly two, side by side, captioned.
