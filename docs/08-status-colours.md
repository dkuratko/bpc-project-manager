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
 6  Accepted                                         #7FB3E0   blue
 7  Awaiting delivery                                #7FB3E0   blue
 8  Equipment received                               #A6DE9B   light green
 9  Scheduled                                        #6BC96B   green
10  Active                                           #FFE24D   yellow
11  Invoice sent, payment required ▶ warranty starts #FFA94D   orange
12  Completed, paid                                  #F5766E   red
13  Warranty — paid, still covered                   #F5766E   red
14  Completed — terminal, on warranty expiry         #F5766E   red
```

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
SELECTED  ▶ in the gutter + a 2 px SOLID black rectangle around the row
          NO fill. the status tint is untouched.
```

The old database-app record selector — Access, FoxPro, dBASE. It reads at a
glance, costs no colour, and gives the problem lip a proper home.

The rectangle is **2 px solid black**, not a hairline focus dash — this is the
row you are working on and it should be unmistakable across a 1400 px window.

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
