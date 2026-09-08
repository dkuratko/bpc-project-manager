# Scope Zone — REVISION 1
Applies to `Scope Zone v2`. Everything not mentioned here stays exactly as it is.

**Change:** the Base scope table needs to identify a component fully. A scope
row might be a whole play structure, or it might be a single panel or a grab
handle — and right now you can't tell which, or who makes it.

---

## Replace the Base scope table's columns

The `Type` column is far too wide for two possible values. Shrink it to an icon
and spend the space on identity.

**New column set** (same set for the add-option sub-tables, so they align):

| # | Column | Width | Align | Notes |
|---|---|---|---|---|
| 1 | *(type icon)* | 26 | centre | no header text. filled navy square = component, hollow grey square = service. |
| 2 | Item | flex ≈ 325 | left | the product name |
| 3 | Manufacturer | 115 | left | blank on service rows |
| 4 | Part number | 105 | left | monospace, blank on service rows |
| 5 | Category | 105 | left | grey. what kind of thing it is. |
| 6 | Method | 150 | left | dropdown on components, blank on services |
| 7 | Footing | 110 | left | dropdown on components, blank on services |
| 8 | Qty | 58 | right | editable sunken field, monospace |
| 9 | Unit | 38 | left | |
| 10 | ✕ | 22 | centre | grey delete glyph |

Fixed columns total 729 px; Item takes the remainder. If rows feel cramped,
widening the window to **1180 px** is acceptable — nothing else changes.

Part number stays monospace but is now **black, not grey** — it's identifying
information, not a footnote.

---

## Replace the Base scope rows

Six rows now, deliberately spanning the full range from a whole structure down
to a piece of hardware. Render exactly these values:

```
icon  Item                     Manufacturer    Part number   Category          Method               Footing        Qty   Unit
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
▪C    24x24x12 Hip Shade       Shade Systems   HIP-242412    Shade structure   SM — Surface mount   — none —          1   EA
▪C    Bench, 6 ft              Exerplay        BN-6          Site furnishing   DB — Direct bury     — catalog —       4   EA
▪C    Arch Climber Panel       Miracle         PN-88412      Play panel        SM — Surface mount   — none —          2   EA
▪C    Grab Handle, straight    Miracle         HDL-2201      Hardware          BO — Bolt on         — none —          6   EA
▫S    Site excavation                                        Earthwork                                            12.00   CY
▫S    Remove EWF surfacing                                   Surfacing                                            1,700   SF
```

`▪C` = component icon, `▫S` = service icon — **draw these as the small squares
already in v2, not as letters or text.**

On service rows, Manufacturer / Part number / Method / Footing are genuinely
**blank** — no dashes, no empty dropdowns. Only Category is filled.

---

## Add-option sub-tables

Same columns, same alignment, so they line up under the main table. The two
service rows under *Footing installation* get `Earthwork` in Category and
nothing in Manufacturer / Part number / Method / Footing. Same for the
*Private utility line locate* row, Category `Site services`.

---

## Unchanged

Window chrome, menu, toolbar, context strip, tab strip, the `2 problems` chip,
the Add options group and its expand/collapse behaviour, the tip block, the
price ladder and the red "Cannot issue estimate" line all stay exactly as they
are in v2. Still one screen, still tab 1 only, still no dialogs or overlays.

Still: **no dollar figure anywhere in the Base scope table.** The only money on
this screen is the two add-option prices and the status-bar ladder.
