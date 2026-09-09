# STATUS COLOURS & LIFECYCLE
Decided 2026-09-08. Applies to every screen that shows a version's state.

---

## The ramp

Colour tracks **position in the lifecycle**, not meaning. Green early, red late.
It is a progression, not a semantic scale — red does **not** mean bad here.

```
 1  Draft — no estimate yet                              #ffffff   white
 2  Estimate created, not sent                           #ffffff   white
 3  Sent, awaiting                                       #ffffff   white
 4  Expired — 30 days, no answer                         #ffffff   white
 5  Blocked — cannot issue                               #ffffff   white
────────────────────────────────────────────────────────────────────────
 6  Accepted                                             #c8e6c9   green
 7  Awaiting delivery                                    #c8e6c9   green
 8  Equipment received                                   #f5f0c0   light yellow
 9  Scheduled                                            #f0e08a   yellow
10  Active                                               #f4c7d4   pink
11  Invoice sent, payment required  ▶ warranty starts    #f7cfa0   orange
12  Completed, paid                                      #e0b0b0   red
13  Warranty — paid, still covered                       #e0b0b0   red
14  Completed — terminal, on warranty expiry             #e0b0b0   red
```

**ACTIVE covers more than crew-on-site.** A job stays `ACTIVE` from the moment
work starts until the invoice goes out — including the gap after the crew has
left and before you have billed. Completion *is* the invoice, so there is no
state between them.

All tints are pale enough that 11 px black text stays crisp. Statuses 1–5 share
white; the Status **text** carries the difference, since nothing has been won
yet and colour would only add noise.

✔ **"Completed, payment required" was removed.** It sat between finishing work
and billing for it and had no trigger of its own — completion *is* the invoice.
Fourteen statuses, not fifteen.

---

## Problems ARE a tint — red serves both

Decided: red carries both *finished* and *problem*. The two tints sit close, so
a problem row is reinforced rather than relying on colour alone:

```
PROBLEM   #ffadad  ground — OVERRIDES the phase tint
        + 3 px #a00 bar down the left edge
        + the flag glyph
        + Status text in #a00

DONE      #e0b0b0  ground, no edge bar, black text
```

The edge bar and the red status text are what separate them at a glance. A
completed job is quiet red; a broken one is red **with a hard red edge and red
text**, and its status reads `SCHEDULED` in `#a00` rather than in black.

A problem row loses its phase tint. That is the accepted trade — attention wins
over position.

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
