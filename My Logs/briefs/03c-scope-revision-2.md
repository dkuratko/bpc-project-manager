# Scope Zone — REVISION 2
Applies to `Scope Zone v3`. Everything not mentioned here stays exactly as it is.

**Change:** the Base scope table needs manual **groups**. A PlayBooster
playground arrives as decks, posts, panels, a slide and a fistful of hardware —
fifteen rows that are really one thing. Grouping them makes the table readable.

Groups are **purely presentational**. They are created by hand on every version,
they carry no data, and they change nothing about how anything is priced.
Think of them as folders in the list.

---

## The group header row

Reuse the band you already built for Add options — same `#dfdfdf` ground, same
`var(--t)` bevel, same triangle. It spans the full table width.

```
▾  PlayBooster PB-4400          Landscape Structures                    6 items
```

Left to right:
- expand / collapse triangle (down when open, right when closed — as in v3)
- **group name**, bold
- an optional **note** in grey `#404040` — here the manufacturer
- **item count** right-aligned, grey, e.g. `6 items`

**No money on a group header.** No subtotal, no price. This is the Scope tab.

Child rows sit **indented by 12 px** in the Item column — exactly the indent
already used for add-option children — and otherwise render identically to
normal rows, same columns, same widths.

**One level only.** Groups do not nest.

---

## Ungrouped rows

Rows not in any group render at the top level, unindented, mixed in among the
groups in whatever order they sit. There is no "Ungrouped" header — an
ungrouped row is just a row.

---

## Replace the Base scope rows

Render exactly this: one group expanded, one group collapsed, two ungrouped
service rows beneath them.

```
▾  PlayBooster PB-4400        Landscape Structures                        6 items
     Deck, square 48"         Landscape Str.   PB-D4848   Deck          DB — Direct bury    — catalog —     4   EA
     Post, 5" × 12'           Landscape Str.   PB-P512    Post          DB — Direct bury    — catalog —     6   EA
     Slide, 6 ft spiral       Landscape Str.   PB-S6SP    Slide         BO — Bolt on        — none —        1   EA
     Arch Climber Panel       Landscape Str.   PB-88412   Play panel    BO — Bolt on        — none —        2   EA
     Barrier Panel            Landscape Str.   PB-BR100   Play panel    BO — Bolt on        — none —        3   EA
     Grab Handle, straight    Landscape Str.   PB-2201    Hardware      BO — Bolt on        — none —        6   EA

▸  Shade and site furnishings                                            2 items

   Site excavation                                        Earthwork                                     12.00   CY
   Remove EWF surfacing                                   Surfacing                                     1,700   SF
```

The collapsed group shows its header only — no child rows.

Component icons on the child rows, service icons on the two ungrouped rows,
same squares as v3.

---

## Footer buttons

Add one button to the existing footer row, at the end:

`＋ Add component ▼`  `＋ Add direct service ▼`  `＋ New one-time component…`  `＋ New group…`

---

## Add options

Unchanged. `Footing installation` still reads `line: 24x24x12 Hip Shade` even
though that row now lives inside the collapsed group — that is correct and
intentional.

---

## Unchanged

Window chrome, menu, toolbar, context strip, tab strip, `2 problems` chip,
column set and widths from Revision 1, the Add options group, the tip block,
the price ladder and the red "Cannot issue estimate" line.

Still one screen, still tab 1 only, still no dialogs or overlays, and still
**no dollar figure anywhere in the Base scope table** — group headers included.
