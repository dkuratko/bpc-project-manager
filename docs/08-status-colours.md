# STATUS COLOURS & LIFECYCLE
Decided 2026-09-08. Applies to every screen that shows a version's state.

---

## The ramp

Colour tracks **position in the lifecycle**, not meaning. Blue at the start,
red at the end. It is a progression, not a semantic scale — red does **not**
mean bad here, it means finished.

Standard hues, not pastels. All six still take 11 px black text; anything
bolder would force white text on the red and the blue, and the rows would stop
agreeing with each other.

```
 1  Draft — no estimate yet                          #ffffff   white
 2  Estimate created, not sent                       #ffffff   white
 3  Sent, awaiting                                   #ffffff   white
 4  Expired — 30 days, no answer                     #ffffff   white
 5  Blocked — cannot issue                           #ffffff   white
──────────────────────────────────────────────────────────────────────
 6  Accepted                                         #9CC3E2   blue
 7  Awaiting delivery                                #9CC3E2   blue
 8  Equipment received                               #B5E3B5   light green
 9  Scheduled                                        #8ECF8E   green
10  Active                                           #F5E183   yellow
11  Invoice sent, payment required ▶ warranty starts #F0B778   orange
12  Completed, paid                                  #E89494   red
13  Warranty — paid, still covered                   #E89494   red
14  Completed — terminal, on warranty expiry         #E89494   red
```

Values 6, 7, 9, 10 and 11 are taken from `Project Browser v14`. **8 and 12–14
are inferred** — no row in that render used them — and should be checked against
the others once they appear on screen together.

**ACTIVE covers more than crew-on-site.** A job stays `ACTIVE` from the moment
work starts until the invoice goes out — including the gap after the crew has
left and before you have billed. Completion *is* the invoice, so there is no
state between them.

✔ **"Completed, payment required" was removed.** It sat between finishing work
and billing for it and had no trigger of its own. Fourteen statuses, not fifteen.

---

## Problems are a LIP, not a tint

A problem never changes the row colour. **A red row always means finished
(12–14) and nothing else.**

```
PROBLEM   4 px #CC0000 lip down the left edge, inside the selector gutter
        + the flag glyph
        + Status text in #a00
```

The row keeps its real phase. A scheduled job with no equipment reads as
**green with a red lip** — where it actually is, visibly wrong.

---

## The row cursor — gutter marker

Selection must not cover the status colour, so it does not fill the row.

```
GUTTER    14 px, left of the ± column. holds two things:
             ▶  black, on the selected row
             ▌  the 4 px #CC0000 problem lip
          both can appear at once.
SELECTED  ▶ in the gutter
        + a 2 px SOLID black rectangle around the row
        + a 15% black wash over the row's own tint
          the tint DARKENS, it is never replaced.
```

The old database-app record selector — Access, FoxPro, dBASE. It reads at a
glance, costs no colour, and gives the problem lip a proper home.

The rectangle is **2 px solid black**, not a hairline focus dash — this is the
row you are working on and it should be unmistakable across a 1400 px window.

### The selected row is shaded, not filled

A **15% black wash** over whatever tint the row already has. It darkens rather
than replaces, so the status colour survives selection.

```
rgba(0, 0, 0, 0.15)  over the row's own tint
```

Computed, so there is no ambiguity if alpha renders oddly:

```
tint            normal      selected
────────────────────────────────────
white           #ffffff  →  #d9d9d9
blue            #9CC3E2  →  #85A6C0
light green     #B5E3B5  →  #9AC19A
green           #8ECF8E  →  #79B079
yellow          #F5E183  →  #D0BF6F
orange          #F0B778  →  #CC9C66
red             #E89494  →  #C57E7E
```

All still take 11 px black text. **The three signals stack** — arrow in the
gutter, 2 px black rectangle, and the shaded row — so selection is obvious from
across the screen while the status is still legible on the row itself.


```
 ▶ ▌ +  26-09   SCHEDULED              selected AND a problem
   ▌ +  26-14   Quoting · blocked      problem, not selected
 ▶   −  26-10   Quoting                selected, no problem
```

**No colour chips.** They existed only because the old grey cursor hid the row
tint. With the tint no longer covered, they have nothing to do.

## Overlay conditions

Conditions, not statuses. They can sit on any row and drive the edge bar and flag.

```
A  Scheduled, no equipment on the lot          !
B  Invoice unpaid past terms                   !
C  Quote expiring within 14 days               $
D  Change order pending approval               ⚑
E  Blocked from issuing                        !
```

Max three glyphs per row; a fourth renders `+2` with the rest on hover.
