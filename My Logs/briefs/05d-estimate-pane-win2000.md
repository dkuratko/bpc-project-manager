# Estimate pane — TRANSLATE TO WIN2000
Applies to `Estimate Editor v7`. **The layout and spacing from `05c` are right
and stay exactly as they are.** This brief changes only the surface vocabulary.

---

## The problem

v7 imports the reference PDF's *surface* into a Windows 2000 window:

```
#f5f5f0 soft tint          #8a7538 olive italic          #d8d8d8 hairlines
letter-spacing .11em caps  rounded #eeeeee pills         a soft white page
```

Those sit inside a `#c0c0c0` bevelled group box with Lucida Console money and
raised buttons. Two design languages, unresolved — which is what reads as
sloppy. Every element is fine alone; together they do not belong.

Win2000 has a native way of saying all of it. Translate each one and the pane
becomes clean without losing a single structural idea.

---

## The translation

| what it does | v7 (PDF surface) | → Win2000 |
|---|---|---|
| sub-item / option band | `#f5f5f0` soft tint | **`#dfdfdf`** — the band already used for scope groups and footer rows |
| note text | `#8a7538` olive italic | **`#ffffe1` ground behind the text only**, no border, black italic. The system tooltip colour. Unmistakably "a note", and already in the app. |
| separator between line groups | `#d8d8d8` hairline | **etched line** — 1 px `#808080` with 1 px `#ffffff` directly beneath. The classic engraved divider. |
| the money gutter rule | `#e0e0e0` 1 px | **etched vertical** — 1 px `#808080`, 1 px `#ffffff` to its right |
| column header | letterspaced grey caps + black rule | **`#c0c0c0` bevelled header row**, `var(--r)`, plain 11 px black — identical to the Scope, Purchasing and Cost tables |
| chips | rounded `#eeeeee`, `#d0d0d0` border, 9 px | **`#c0c0c0` with the thin etched bevel `var(--t)`**, 9 px black text, square corners. Reads like a status-bar segment. |
| section label ("OPTIONAL ADD-ONS…") | letterspaced grey caps | **`#dfdfdf` band, bold black**, like the JOB LEVEL band |
| totals block | soft rules, grey caps | plain black labels; **etched rule above TOTAL** |
| the page | white with 14/16 px padding | **sunken white well**, `var(--s)` — as every list in the app |

**Nothing else changes.** The 488 px text zone, the 284 px money gutter, the
0 / 18 / 34 indent ladder, the 16 px group rhythm, the wrapping, the row
grammar, every figure — all stay.

---

## Colour, after translation

```
black  #000000    titles, amounts, note text
grey   #404040    descriptions
grey   #808080    secondary numbers on sub-item and option rows, etched dark
grey   #c0c0c0    chrome, chips, column header
grey   #dfdfdf    bands
white  #ffffff    content ground, etched light
yellow #ffffe1    note ground
navy   #000080    selection only
red    #a00       problems only — never anything else
```

That is the whole palette. **No olive, no soft greys, no borders that are not
bevels.** If a colour is not in this list it should not appear in the pane.

---

## Three fixes while translating

**1. Selection spans the full row.** In v7 the navy highlight is wrapped around
the Hip Shade *title text* as an inline block, so it looks like a badge. It must
run the full width of the text zone, chips row included, as a Win2000 list
selection does.

**2. The gutter rule stops at the bands.** An etched vertical looks wrong
cutting through a `#dfdfdf` band. Break it where a band crosses, or run the band
over it — the band wins.

**3. Drop `text-wrap:pretty`.** Plain wrapping. It is invisible here and it is
not part of the vocabulary.

---

## The one judgement call

Notes lose the olive. That colour was doing real work — instant "this is a
caveat." The `#ffffe1` ground replaces it and is more Win2000 than any coloured
text would be, since the app already uses that yellow for tip blocks.

If it reads too heavy at one note per line, the fallback is **plain `#404040`
italic with the leading `*`** and no ground at all — differentiation from
indentation and italics alone. Try the yellow first.

Maroon and olive text are both wrong: `#a00` already means *problem* in this
application, and a second warm colour next to it would muddy that.
