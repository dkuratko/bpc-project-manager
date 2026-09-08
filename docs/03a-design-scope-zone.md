# Design brief — COST BREAKDOWN, tab 1 of 4: SCOPE
Build Play Contracting Project Manager. Companion to the New Component Wizard,
same visual language.

---

## ⛔ SCOPE OF THIS RENDER — read first

Draw **one screen only**: the Cost Breakdown window with **tab 1 (Scope) active**.

Do **NOT** draw:
- the Requirements, Purchasing or Cost tabs' contents — those are separate briefs
- the Problems dialog, or any dialog, popup or overlay
- more than one window
- any variant, state, or alternative layout of this screen

The other three tabs exist **only as inactive tab headers** in the tab strip.
Everything below the tab strip is Scope content and nothing else.

## ⛔ RENDER THE VALUES LITERALLY — compute nothing

Every number, label and total in this brief is final and verified. Type them
exactly as written. Do not derive, recalculate, extend, or invent any figure,
and do not add rows, columns or items that are not listed here.

---

## Canvas and window

A single Windows 2000 application window, **1100 px wide × approximately 720 px
tall**, centred on a `#008080` teal desk with ~40 px of desk visible around it.

Not a wide banner. Not a tall scroll. A normal desktop application window with
the proportions of something you'd actually work in.

---

## Visual language

Matches the New Component Wizard exactly:

- Tahoma 11px. Chrome `#c0c0c0`. Desk `#008080`.
- Raised bevel: `inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf`
- Sunken field: white ground, bevel reversed.
- Title bar: gradient `#000080 → #1084d0`, bold white text, three system buttons at the right.
- Numeric cells: `Lucida Console` monospace, right-aligned.
- Tip blocks: `#ffffe1` ground, 1px black inset border, normal weight text.
- Group box: sunken panel with a legend chip overlapping its top-left border,
  chip painted `#c0c0c0`, bold.

**Draw UI states as real UI, never as text glyphs.** An active tab is *inset
and bold with a lighter face*; an expanded section shows a *small filled
triangle*; a dropdown is a *sunken field with a raised square button carrying a
small arrow*. Do not print characters like ▌ ▐ ▾ ▸ ◉ ○ into the markup — the
last render did, and every label came out doubled.

---

## Regions, top to bottom

### 1 · Title bar
`Cost Breakdown BPCc-26-10A0 — BPC-26-10 San Tan Shade Installation`
Minimise / maximise / close at the right.

### 2 · Menu bar
`File   Edit   Scope   Pricing   View   Tools   Help`

### 3 · Toolbar
Raised buttons, two groups separated by a vertical divider:
`Add component` · `Add service` · `New one-time…` ‖ `Recalculate` ‖ `Issue estimate`
`Issue estimate` is **disabled** (grey text) — there are unresolved problems.

### 4 · Context strip
A sunken band, two rows, four labelled read-only values. Labels in grey,
values in black. This is inherited from the project and is never typed here.

```
Customer          Exerplay, Inc. · Grant Smith
Site              San Tan Elementary, Gilbert AZ
Native material   Native soil — hard clay
Conditions        soil ×1.15 · access ×1.30
```

### 5 · Tab strip
Four tabs, left aligned: `1 · Scope`  `2 · Requirements`  `3 · Purchasing`  `4 · Cost`
**Tab 1 is active** — lighter face, bold, joined to the panel below.
Tabs 2–4 are inactive: raised, grey text.

At the far right of the strip, a red warning chip: `2 problems`.
It is a clickable-looking chip. It does **not** open anything in this render.

### 6 · Group box — "Base scope"

A table on a white sunken ground. Columns and widths:

| Type (90) | Item (flex) | Method (170) | Footing (130) | Qty (70) | Unit (50) | ✕ (24) |

Type cells show a small square icon plus the word `Component` or `Service`.
Method and Footing cells are **dropdowns** on component rows, and **empty** on
service rows. Qty cells are editable sunken fields. The ✕ column is a grey
delete glyph.

Rows, exactly:

```
Component   24x24x12 Hip Shade  HIP-242412    SM — Surface mount   — none —        1  EA
Component   Bench, 6 ft  BN-6                 DB — Direct bury     — catalog —     4  EA
Service     Site excavation                                                    12.00  CY
Service     Remove EWF surfacing                                                1,700  SF
```

Part numbers (`HIP-242412`, `BN-6`) in monospace, grey.

Footer row inside the table, `#dfdfdf` ground, spanning all columns:
`＋ Add component ▼    ＋ Add direct service ▼    ＋ New one-time component…`
as three small raised buttons.

### 7 · Group box — "Add options"

Two collapsible sections. Each header is a full-width `#dfdfdf` band carrying,
left to right: an expand triangle, the option name in bold, its attachment in
grey, and its price right-aligned in monospace.

**First option — EXPANDED:**
```
   Footing installation            line: 24x24x12 Hip Shade        $1,045.00
```
Its body is a small table in the same columns as Base scope, two rows:
```
Service   Excavate footing, F-3x12                                 4  EA
Service   Set & pour footing                                       4  EA
```

**Second option — COLLAPSED** (header only, no body):
```
   Private utility line locate     job level                       $1,200.00
```

Below both, a small raised button: `＋ New add option…`

### 8 · Tip block

Full width, below the group boxes:

> **Add options are priced as a marginal recompute** — what the job costs with
> them, minus what it costs without. That is why an option can come out cheaper
> than pricing it on its own: it rides on the same concrete truck.

### 9 · Status bar — the price ladder

A single row of small sunken cells, each with a grey label above a monospace
value, separated by arrow glyphs. The final cell is bold with a black outline.

```
Cost            + conditions        = adjusted        + contingency 5%     + markup 20%      COMPUTED PRICE
13,615.28         2,063.86            15,679.14           783.96            3,135.83           19,598.93
```

Directly beneath it, a red single-line message:
`Cannot issue estimate — 2 problems`

---

## Rules this render must not break

- **No dollar figure appears anywhere in the Base scope table.** Components,
  footings and services carry no price. The only money on this screen is the
  two add-option prices and the status-bar ladder. If a component row shows a
  cost, the model has been violated.
- **The window is an application window**, not a poster. One window, normal
  desktop proportions, teal desk visible around it.
- **Nothing overlaps anything.** No floating panel, no dialog, no scrim.
- **Every label appears exactly once.** Check the tab strip especially.
- Service rows have **empty** Method and Footing cells — not dashes, not
  dropdowns, genuinely blank.
