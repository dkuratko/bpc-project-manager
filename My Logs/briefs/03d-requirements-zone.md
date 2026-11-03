# Design brief — COST BREAKDOWN, tab 2 of 4: REQUIREMENTS
Build Play Contracting Project Manager.
Continues from `Scope Zone v4`. Same window, different tab.

---

## ⛔ SCOPE OF THIS RENDER

Draw **one screen only**: the Cost Breakdown window with **tab 2 (Requirements)
active**.

Do **NOT** draw the Scope, Purchasing or Cost tabs' contents, any dialog, any
overlay, any second window, or any alternative state. Tabs 1, 3 and 4 exist only
as inactive headers.

## ⛔ RENDER THE VALUES LITERALLY — compute nothing

Every number below is final. Type them exactly. Do not derive, recalculate,
extend or invent any figure, and add no rows that are not listed.

---

## Carried over from Scope Zone v4 — unchanged

Reuse these **exactly** as they render in v4:

- window: 1180 px wide, teal desk, same chrome and title bar
- menu bar, toolbar (`Issue estimate` still disabled/grey)
- context strip: Customer / Site / Native material / Conditions
- tab strip, `2 problems` chip at the right — but **tab 2 is now the active tab**
- the status-bar price ladder and the red `Cannot issue estimate — 2 problems`
  line, with identical values

Only the panel between the tab strip and the price ladder changes.

---

## The panel

Everything on this tab is **computed and read-only**. It must look like output,
not input: no editable fields, no dropdowns, no ✕ buttons. Values sit on the
`#c0c0c0` chrome in sunken `var(--t)` wells, or as plain text in a white sunken
list — but nothing looks typeable.

Six group boxes in **two columns**, and the columns mean something, so reading
down either one makes sense:

```
LEFT — what the job consumes and produces     RIGHT — what it takes to do it
   Footings                                      Labor
   Materials required                            Equipment
   Generated output                              Products
```

Do not interleave them into one flowing sequence — the first attempt at this
screen did, and the reading order came out scrambled.

---

## LEFT COLUMN

### Group box: "Footings"

```
F-2x4    2′ dia × 4′ deep      6 EA      from  Post, 5″ × 12′  ×6
F-1x2    1′ dia × 2′ deep      2 EA      from  Bench, 6 ft
```
Spec name in monospace. Geometry and source in grey.

### Group box: "Materials required — pooled across the whole job"

```
Concrete, ready-mix          2.91 CY     Posts 2.79 · Bench 0.12
Rebar Cage B                    6 EA     Posts 6
```
The right-hand text is grey — it says which cost objects contributed.

### Group box: "Generated output"

```
Native soil — hard clay     14.91 CY bank   →   18.64 CY loose   swell 1.25
                            Posts 2.79 · Bench 0.12 · Site excavation 12.00

Removed EWF                 62.96 CY bank   →   72.40 CY loose   swell 1.15
                            Remove EWF surfacing 1,700 SF
```
Two lines per output: quantities on the first, contributors in grey below.

---

## RIGHT COLUMN

### Group box: "Labor — duration, and man-hours derived"

```
Installer      28.4 hr duration    × 3 crew     85.2 man-hr
Laborer         6.8 hr duration    × 2 crew     13.6 man-hr
Operator        4.2 hr duration    × 1 crew      4.2 man-hr
```
`man-hours` label in grey — it is derived, not entered.

**Then, inside this same panel, an error row** — pink `#ffe0e0` ground, `#a00`
text, spanning the panel width:

```
⚠  Excavate Footing has no rate for F-2x4          [Fix…]
    The hours above exclude 6 footings.
```
`Fix…` is a small raised button.

### Group box: "Equipment"

```
Telehandler        14.2 hr
Mixer               2.4 hr
```

Same error treatment inside this panel:

```
⚠  Excavator hours for 6 footings not included — Excavate Footing
    has no rate for F-2x4.
```
No `Fix…` button here — it is the same gap, already actionable above.

### Group box: "Products"

```
— none —      the customer furnishes the equipment on this job
```
Grey, centred, no table.

---

## The tip block

Full width, beneath both columns:

> **Only Labor and Equipment are short.** Footings, materials and generated
> output are complete, because those come from the footing **spec** — pure
> geometry. Hours come from the **service**, and that service has no rate for
> `F-2x4`. Nothing has been guessed to fill the gap.

---

## Rules this render must not break

- **No dollar figure appears anywhere on this tab.** Not one. Prices exist from
  tab 3 onward. If a footing, material, output, hour or product shows a cost,
  the model has been violated.
- **Nothing is editable.** No dropdowns, no input wells, no delete glyphs.
- **Never show an inferred number.** The Labor panel shows the hours that are
  genuinely known and states what is missing. It does not blank out, and it does
  not fill the hole with an interpolated figure.
- **Two columns, in the order given.** Left is quantities, right is effort.
- Error rows live **inside the panel they belong to**, never floating between panels.
