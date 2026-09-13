# UNKNOWNS AND ALARMS — cross-cutting
**Adopted 2026-09-12**, from the Mobilization Panel.
Applies to **every screen**. Money keeps `03f`, dates keep `11`; this is how the
application says *"I do not know"* and *"this is wrong."*

**Reference:** `docs/design/mobilization-panel.v1.dc.html`.

---

## Why this is a document

`NOTHING SILENTLY ASSUMED` is the oldest principle in `00-TREE` §0, and until
now every screen invented its own way of honouring it. The Mobilization Panel
got it right and the vocabulary is worth naming so the next screen does not
start over.

---

## 1 · The `[?]` chip — a value that is not known

```
GLYPH      [?]
TEXT       #a00 · 'Lucida Console' monospace
GROUND     #ffffe1
BORDER     inset 0 0 0 1px #d8d0a0
PADDING    0 3px
```

**Never an empty cell, never a zero, never a dash.** Those three all read as
*"nothing"*, and nothing is a different claim from *"unknown"*. A dash means
**not applicable** — hardware has no length — and that distinction has to
survive.

```
[?]    we do not know this and it matters
—      this does not apply here
0      it is genuinely zero
```

---

## 2 · Unknowns propagate — they never quietly vanish

**A sum containing an unknown is written with the unknown still in it.**

```
✔  4,260 lb + [?]          three known rows and one that is not
✘  4,260 lb                the same total, silently short
```

**A derived value with an unknown input is itself `[?]`.** The Mobilization
Panel's crew rate is unknown, so `Labour` is `[?]`, so `Mobilization` is `[?]`
— all the way to the bottom line.

```
Labour        2 trips × (2 × 0.40 hr drive + 0.00 load) × [?] crew    [?]
Vehicles      2 trips × 2 × 18.0 mi × $1.26 /mi                    $90.72
──────────────────────────────────────────────────────────────────────
Mobilization                                                          [?]
```

**A partial total presented as complete is the failure this vocabulary
exists to prevent** — it reconciles perfectly and it is wrong.

### But show what IS computable

Refusing to show any number is not honesty, it is uselessness. Where a figure
can be computed from what is known, show it **with the caveat inline in
`#a00`**:

```
Computed   ceil( 12,880 ÷ 15,400 ) = 1      from known weights only
```

---

## 3 · The alarm block — something is wrong, not merely unknown

```
GROUND     #ffe0e0
BORDER     inset 0 0 0 1px #a00
TEXT       #a00, line-height 1.5
LAYOUT     ⚠ glyph in its own column, text flowing beside it
FIRST LINE bold — the problem in one sentence
REST       what it means and what fixes it
```

```
⚠  Longest item 22.0 ft exceeds the 20.0 ft deck.
   No number of trips fixes this — it needs a longer trailer, a
   different bundle, or a delivery direct to site.
```

**Every alarm says what would fix it.** An alarm that only reports is a
nuisance; one that names the remedy is a tool.

### One alarm per distinct failure

The panel carries two, deliberately: a missing weight and an over-length item.
They fail differently and only one of them is fixed by another trip. **Merging
them into one warning would lose the part that matters.**

### Alarm blocks are not tip blocks

```
#ffe0e0  1px #a00     ALARM — something on this screen is wrong now
#ffffe1  1px #000     TIP   — a rule or a caveat, always true
#ffffc0  1px #808080  RECORD — what this action will permanently write
```

Three grounds, three meanings. Do not reach for a red block to emphasise a
rule.

---

## 4 · Excluded rows stay visible

A row that is deliberately **not** counted renders in `#808080` with `—` in the
columns it does not contribute to, and its reason inline:

```
PlayBooster PB-4400 · direct to site    1   12,400 lb    —    —    —    ✗
```

**Deleting it would be worse.** `12,400 lb` is exactly the weight that wrecks a
trip count if someone later assumes it was forgotten rather than excluded. The
row is the evidence that the app considered it.

Same rule for an empty section: it renders and reads `— none —`. **Absence is
information.**

---

## 5 · The grey footnote

Under a box, `#808080`, line-height 1.5: the arithmetic nobody should have to
reconstruct.

```
$1.26 /mi is the F-450 at $0.81 plus the flatbed at $0.45.
```

```
A collapsed band still counts — COLLECTED RENTALS is folded and its
220 lb is in the total; ± is a view control and nothing more.
```

Use it for **why the numbers are what they are**, never for instructions.

---

## Where this already applies

```
✔ mobilization panel     where it came from
✔ cost breakdown         blank rows on missing rates, problems panel
✔ record dialogs         the status preview's ⚠ lip and #a00 text
✔ equipment              rate over 12 months · registration expiring
✔ rented tab             card differs from last paid
▢ every screen after this one
```
