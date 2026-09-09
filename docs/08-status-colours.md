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
 6  Accepted                                             #dff0d8   green
 7  Awaiting delivery                                    #dff0d8   green
 8  Equipment received                                   #fdf6d3   light yellow
 9  Scheduled                                            #fbeeb0   yellow
10  Active — crew on site                                #f8dde4   pink
11  Invoice sent, payment required  ▶ warranty starts    #fbe0c4   orange
12  Completed, payment required                          #fbe0c4   orange
13  Completed, paid                                      #f5d0d0   red
14  Warranty — paid, still covered                       #f5d0d0   red
15  Completed — terminal, on warranty expiry             #f5d0d0   red
```

All tints are pale enough that 11 px black text stays crisp. Statuses 1–5 share
white; the Status **text** carries the difference, since nothing has been won
yet and colour would only add noise.

★ **Open: what moves 11 → 12?** If the invoice is what completes a job, both
fire at the same moment and 12 never lives on its own. If something else marks
it — customer sign-off, a punch walk, your own call — that trigger needs
writing down. Until then 12 is unreachable in practice.

---

## Problems ARE a tint — red serves both

Decided: red carries both *finished* and *problem*. The two tints sit close, so
a problem row is reinforced rather than relying on colour alone:

```
PROBLEM   #ffe0e0  ground — OVERRIDES the phase tint
        + 3 px #a00 bar down the left edge
        + the flag glyph
        + Status text in #a00

DONE      #f5d0d0  ground, no edge bar, black text
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
