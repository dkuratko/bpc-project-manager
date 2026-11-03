# Design brief — EQUIPMENT TYPE DIALOG
**One POPUP, two modes.** `New type` / `Type properties — trailer`.
Opened by `New type` on the Equipment window's toolbar.
Apply `11-date-formatting.md`.

**Style reference:** `docs/design/supplier-dialog.v3.dc.html` — **FINAL**.
Same grammar, same widths, same button geometry.

---

## ⛔ SCOPE

Two dialogs side by side on a `rgba(0,0,0,.42)` scrim, **600 px** each, 18 px
apart, top-aligned.

```
NEW — a blank form
PROPERTIES — the same dialog, reopened
```

One well-formed document. Nothing after `</x-dc>`.

**600 px, not 480.** `docs/12`'s rule: fewer fields makes a dialog **shorter,
never narrower**. 480 px belongs to row editors — `Add a rate`, `Add a fee`,
`Add a specification` — which are opened *from inside* another dialog. This one
is opened from a toolbar and creates an entity, so it is 600 like every other.

---

## The whole dialog

It is two fields, and that is the point.

```
┌ Identify it ─────────────────────────────────────────────┐
  Name        [ trailer ]   ★
              generic — "boom lift", not "64' boom lift"

  ☑ This is a vehicle — it carries or tows
              machines of this type get payload, capacity, tare,
              deck and tow-rating fields
```

### `Name` is generic, and the explanation line says so

A type is what the **work** requires. A job needs *a boom lift*; which one
turns up is a sourcing decision made later. Getting a model number in here is
the likeliest mistake, so the line sits under the field rather than in a tip.

### `This is a vehicle` is not cosmetic

It decides whether machines of this type get **carrier fields** at all —
payload, capacity, tare weight, deck dimensions, tow rating. A `boom lift` has
none of them; a `trailer` needs all but the first and last.

#### Unticking it on a type that already has machines

```
  ☐ This is a vehicle — it carries or tows
    ⚠ 2 machines of this type carry deck dimensions. Unticking hides
      those fields. The values are kept.
```

An alarm block would be too loud — this is a caveat, not a fault — so it is
`#a00` text inline under the checkbox. **"The values are kept" is the part that
matters**: an irreversible-looking change that is actually reversible should
say so, or nobody will ever tick the box back.

---

## Tip block · `#ffffe1`

```
A type is a name and a role. Nothing else.

"truck" has no payload, no VIN and no make — the 2012 F-450 does. Every
dimension, weight, rating and specification lives on the machine, so that
a requirement can point at "a boom lift" without caring whose turns up.
```

---

## Properties mode only

Two rows at the **top** of "Identify it", grey labels, exactly as the supplier
dialog does it:

```
Added       [ 04 Jan 2025 ]  read-only chip   ·  Status  Active
Machines    [ 2 ]  read-only chip             ·  Cannot be deleted
            1 owned · 1 rental offering
```

`Machines` is why `Delete` is absent: a type with anything under it cannot go
without orphaning it. At `0` the trailing text reads `Can be deleted` in
`#404040` and the breakdown line is absent.

The breakdown line sits in the value column beneath, in `#808080`.

---

## Render exactly this

**LEFT — `New type`**

`Name` empty with the `#a0a0a0` placeholder `generic kind, e.g. boom lift`.
`This is a vehicle` **unticked**. No `Added` or `Machines` rows, no caveat.
Buttons `Create` 110 px (default, outlined bold) · `Cancel` 78 px.

**RIGHT — `Type properties — trailer`**

`Name` reads `trailer`, `This is a vehicle` **ticked**, no caveat line —
it is ticked, so nothing is being hidden. Both read-only rows present.
Buttons `OK` 110 px (default, outlined bold) · `Cancel` 78 px. **No `Apply`.**

---

## Failure modes — do not reproduce

- **480 px.** Shorter, never narrower.
- **A model number in the sample.** `trailer`, not `20 ft flatbed`.
- **A category field.** There are no categories; the type is the grouping.
- **Specs, dimensions or a rate on this dialog.** They live on the machine.
- **The caveat on the New panel**, or on a ticked box.
- **An alarm block for the caveat.** Inline `#a00` text.
- **`Added` or `Machines` on the New state.**
- **An `Apply` button.**
- **11 px type.**
