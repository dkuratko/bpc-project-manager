# Build Play Contracting — Process & Flow
**Draft 1** · 2026-09-06 · working document, expect it to be wrong in places

> **SUPERSEDED IN PART — see `00-TREE.md`.** Written before the walkthrough. The
> project-level lifecycle assumed below is wrong: the lifecycle runs per *version*.
> Kept for the phase detail and failure modes, which still hold.

Scope decisions locked so far:
- Clean restart. `renderer/`, `estimator/`, `builder/`, `engine/` are **reference only**.
- Single user, one machine, local data. No accounts, no server, no sync.
- Map the whole lifecycle first, then cut to what the software actually touches.

`[?]` marks something I inferred rather than know. Correct or confirm each one.

---

## The spine

```
LEAD ─▶ ESTIMATE ─▶ PROPOSAL ─▶ AWARD ─▶ PROCURE ─▶ RECEIVE ─▶ INSTALL ─▶ CLOSEOUT ─▶ PAID ─▶ WARRANTY
         ▲               │                                                    │
         └── revise ─────┘                          change order ─────────────┘
```

Two things are **not** phases and must not be modeled as phases, because they can fire
from almost anywhere: **change orders** and **document generation**.

---

## 0 · Lead / Intake

**Starts when** someone contacts you, or a bid posting appears.

Sources `[?]`: municipal RFP or bid posting · school district facilities dept · HOA board ·
daycare / private owner · property management · manufacturer rep referral (Miracle etc.
hands you a lead attached to their equipment) · repeat customer · website inquiry.

**Work:** qualify it. Is there money behind it? Who decides, and when? Is it a hard-bid
with a due date or a negotiated conversation? Then the **site visit** — measure, photograph,
check access for a semi and for equipment, look at soil, note existing conditions and
utilities, find out where spoils can go.

**You decide:** pursue or pass. Bid vs. negotiated. Who the real decision-maker is.

**Produces:** customer + contact record · site record (address, access, soil, haul distance,
spoils permitted y/n) · site photos · bid documents and specs if public · a bid due date.

**Moves on when** you commit to producing a number.

**Where it breaks:** lead goes cold with no follow-up · site visit never happens so the
estimate is guesswork · bid due date passes.

> The old `engine/schema.sql` already captures most of the site data —
> `soil_type_id`, `swell_override`, `access_notes`, `haul_distance_mi`,
> `spoil_onsite_permitted`, `contamination_status`, `bid_due`. That was right.

**Questions**
1. Roughly what share of your work is hard-bid public vs. negotiated private?
2. Do you formally pass on jobs, or do they just fade? (Do you want a "lost/no-bid" record with a reason?)
3. Does a site visit always happen before you price, or do you price small jobs off drawings?

---

## 1 · Estimating

**Starts when** you commit to pricing it.

**Work, in order `[?]`:**
1. **Scope takeoff** — what is actually being built. Structure(s), surfacing area, site work, demo of existing.
2. **Equipment selection** — pick the manufacturer's components. Request a quote: unit price,
   freight, crating, **lead time**, and a **quote-valid-until date**.
3. **Installation requirements** — the manufacturer's install drawing dictates footings.
   Footing count/size → excavation volume → concrete volume → spoils generated.
   Spoils swell when dug; where do they go?
4. **Surfacing** — poured-in-place rubber, engineered wood fiber, tile. Priced by area/depth.
   Usually a sub `[?]`.
5. **Site work** — demo, grading, borders/edging, drainage, fence, concrete walks, electrical.
6. **Labor & equipment** — crew hours by task, machine hours.
7. **Indirects** — mobilization, permits, inspections, dumpster, portable toilet, travel/per diem.
8. **Markup and contingency** applied on top.

**You decide:** which component and which install method · procurement method per material
(ready-mix vs. bagged, delivered vs. picked up, from stock) · disposition per spoil pile
(leave, spread, haul off, dispose) · markup % · contingency % · what to carry as allowance.

**Produces:**
- **Cost breakdown** — internal, the real math.
- **Proposal / estimate document** — external, what the customer sees.
- A **version + rendition** identity. From your old data: `BPC-26-6C0` = project 26-6,
  scope version C, issue 0. New version letter = *different scope*; new rendition number =
  *same scope, re-issued*. That distinction was correct and worth keeping.

**Moves on when** the proposal goes out.

**Where it breaks:** manufacturer quote expires before you're awarded and the price moves ·
spoils/haul-off cost missed entirely (it's invisible until you're digging) · scope misread
from a spec book · alternates and allowances not tracked so the accepted number is ambiguous.

**Questions**
4. Do you bid **alternates** (add/deduct options) and **allowances**? Public work usually forces this.
5. Do you self-perform installation, or sub it? Concrete? Surfacing? Which parts are always subbed?
6. Is markup one number on the whole job, or different by cost type (equipment vs. labor vs. sub)?
7. How often does a job have more than one structure / more than one distinct scope area?

---

## 2 · Proposal → Award → Contract

**Starts when** the proposal is issued.

**Work:** follow up. Answer questions. Revise — which loops back to estimating and produces
either a new rendition (same scope, re-issued) or a new version (scope changed).
Customer accepts. Then the paperwork: signed proposal, contract, or a **purchase order**.
Public work adds bonds, certificates of insurance, W-9, prevailing wage acknowledgment `[?]`.

**Produces:** signed acceptance · contract or PO · **contract value** — which must reconcile
against the accepted rendition.

**Moves on when** you have signed paper. Not before.

**Where it breaks:** the PO amount doesn't match the accepted estimate (your old app already
had a *PO short* flag — so this happens) · PO never arrives and work starts anyway ·
award goes to a competitor and nothing records why.

**Questions**
8. What's the actual gate for you — a signed proposal, a customer PO, or both?
9. Do you ever start work before paper is in hand? (If yes, the app should be able to say so, loudly.)
10. How long, typically, from proposal sent to award? Days, weeks, or a school board's next meeting?

---

## 3 · Procurement

**Starts when** the contract is executed. This is the moment **estimated cost becomes
committed cost** — the single most important state change in the whole system.

**Work:** re-confirm the manufacturer quote is still valid, then place the order. Get an
**order acknowledgment** with a ship date. Submittals to the owner/architect for approval
before release on public work `[?]`. Order surfacing. Issue sub POs. Concrete and aggregate
get ordered later, closer to install.

**You decide:** which vendor · when to release (against lead time and site readiness) ·
whether to accept a revised lead time.

**Produces:** purchase orders out · order acknowledgments with dates · submittal package ·
approved shop drawings.

**Moves on when** everything is ordered and acknowledged with real dates.

**Where it breaks:** quote expired → price increase eats margin directly · acknowledgment
never chased so nobody knows the ship date · submittal rejected → redesign → re-order ·
ordered too early and there's nowhere to store it.

> This is the biggest gap in the old code. There was no notion of a **commitment** —
> only estimated cost. You cannot see margin erosion without it.

**Questions**
11. Typical lead time on a play structure? 8 weeks? 16?
12. Do you issue formal POs to vendors and subs, or is it email/phone?
13. Submittals — required on your public work, or rare?

---

## 4 · Delivery / Receiving

**Starts when** the manufacturer ships.

**Work:** get the ship notice and BOL. Schedule receiving — a semi needs somewhere to unload,
a machine to unload it, and a person there. Deliver to the **site** or to your **yard**.
Check against the packing list. Photograph and report damage or shortage **immediately** —
freight claim windows are short.

**Produces:** BOL · packing lists · receiving report · damage photos · freight claim.

**Moves on when** material is on hand and verified complete.

**Where it breaks:** ships later than promised (your old app flagged this) · short or damaged
shipment discovered at assembly instead of at receiving · nowhere to store it · arrives
before the site is ready.

**Questions**
14. Do you have a yard you can receive and store into?
15. How often does a shipment arrive short or damaged? Is a formal receiving check worth building?

---

## 5 · Installation

**Starts when** material is on hand, the site is ready, and a crew is free.

**Work `[?]`:** schedule the crew. Mobilize. Locate utilities. Layout. Demo/excavate.
Dig footings, set posts, pour concrete. Haul or spread spoils. Cure. Assemble the structure.
Border/edging. Surfacing (often a sub, and usually needs the concrete cured first). Site
restoration. Punch walk. Safety inspection — CPSI `[?]`. City inspection if permitted.

**Produces:** daily field reports · photos · **labor hours by person** · **equipment hours** ·
concrete delivery tickets · sub invoices · inspection reports · punch list · owner sign-off.

**Moves on when** punch is clear and the owner accepts.

**Where it breaks:** weather · unforeseen conditions — rock, utilities, bad soil, buried
debris → **change order** · parts missing, discovered mid-assembly · surfacing sub can't
come when the concrete is ready · inspection failure.

> Field capture is what makes actual-vs-estimate possible. Right now it's almost certainly
> paper. Whether the app touches this is a real decision, not a given — see Q17.

**Questions**
16. How many crews, and how many jobs run at once?
17. Do you want to capture actual hours and costs in this app, or is it estimate-and-track-only?
    (This is the single biggest scope question in the whole project.)
18. Who does the safety inspection — you, a third party, the city?

---

## 6 · Change orders *(cross-cutting)*

Can fire any time after award, from four sources: **owner scope change** · **unforeseen site
condition** · **design/spec error** · **your own estimating miss**.

**Work:** price the delta against the currently approved scope. Submit. Get **written**
approval. Then perform.

**Produces:** CO document · approval · a revised contract value that must flow into billing.

**Where it breaks:** work performed on a verbal, never papered, never billed · CO priced and
submitted but never chased to a decision · approved COs not rolled into the contract value,
so the final invoice is wrong.

> The old `change_orders` table diffed one calculation run against another and only
> committed the change on approval. That design was genuinely good — carry the idea forward.

**Question**
19. Roughly how many jobs get change orders, and are they usually owner-driven or site-condition-driven?

---

## 7 · Closeout & Billing

**Starts when** work is complete and accepted.

**Work:** assemble the closeout package — as-builts, O&M manuals, manufacturer warranty
letters, safety inspection certificate, lien waivers. Then invoice. Larger or public jobs
bill progressively (AIA G702/G703 style) with **retainage** held `[?]`.

**Produces:** invoice(s) · lien waivers · warranty documents · closeout package.

**Where it breaks:** closeout docs incomplete → the owner holds payment · retainage forgotten ·
approved COs missing from the final invoice.

**Questions**
20. Progress billing, or one invoice at completion? If progress — percent complete, or by milestone?
21. Retainage — do your customers hold it? What percent?
22. Lien waivers — required on your work?

---

## 8 · Payment & Close

Track the receivable. Follow up. Apply payment. Chase and release retainage.
Closed when paid in full. Your old app already flagged *Payment overdue*.

**Question**
23. Do you want real A/R aging here, or does that live in QuickBooks? `[?]` — what accounting system are you on?

---

## 9 · Warranty & Maintenance *(post-close)*

Substantial completion starts the warranty clock — typically 1 year on installation, longer
on manufacturer parts. Warranty callbacks. Annual inspections. Maintenance agreements.

> The sibling `Maintenance/` folder suggests this is real recurring revenue, not an afterthought.

**Question**
24. Is maintenance a real line of business, and should it be in this app or stay separate?

---

## What runs *across* every phase

These are the four things that make it software instead of a filing cabinet:

**A · Job cost, in three layers.** `Estimated` → `Committed` (POs and subcontracts issued) →
`Actual` (invoices received, hours worked). Margin is only visible when all three exist for
the same job. The old build had only the first layer.

**B · Documents.** Every phase emits paper: proposal, PO, submittal, CO, invoice, lien waiver,
closeout. You already have `Document Hub` and a template builder. Documents should be
*generated from job data*, not typed — and every generated document should be filed against
the job that produced it, with its version.

**C · Dates and attention.** Bid due · quote valid-until · promised ship · scheduled delivery ·
scheduled install · inspection · invoice due · warranty expiry. Every one of these is a
"next action" date, and the ones that pass without the state advancing are what your old
app called **flags**. Flags should be *derived from data*, never typed by hand — that part
of the old design was right.

**D · The money chain that must reconcile.**
```
Accepted estimate  →  Contract/PO value  →  + approved COs  →  Revised contract value
                                                                      ↓
                                                        Invoiced  →  Paid  →  Retainage released
```
Every one of those arrows is a place your old app had a flag for, which tells me every one
of them has burned you at least once.

---

## Open questions, collected

Answer what you can in any order — even partial answers move the schema forward.
The three that matter most are marked ★.

| # | Question |
|---|---|
| 1 | Share of hard-bid public vs. negotiated private work? |
| 2 | Do you want lost/no-bid records with a reason? |
| 3 | Site visit always before pricing? |
| 4 | Do you bid alternates and allowances? |
| 5 ★ | What do you self-perform vs. subcontract? |
| 6 | Markup: one rate, or by cost type? |
| 7 | Multiple structures / scope areas per job — common? |
| 8 | What's the gate to "awarded" — signature, PO, both? |
| 9 | Do you ever start work before paper? |
| 10 | Typical proposal-to-award time? |
| 11 | Typical lead time on a structure? |
| 12 | Formal POs to vendors and subs, or informal? |
| 13 | Are submittals required on your work? |
| 14 | Do you have a yard for receiving/storage? |
| 15 | How often are shipments short or damaged? |
| 16 | How many crews and concurrent jobs? |
| 17 ★ | **Capture actual hours/costs, or estimate-and-track only?** |
| 18 | Who performs the safety inspection? |
| 19 | Change order frequency and usual cause? |
| 20 ★ | Progress billing or single invoice? |
| 21 | Is retainage held, and at what percent? |
| 22 | Lien waivers required? |
| 23 | What accounting system are you on, and what stays in it? |
| 24 | Is maintenance in scope for this app? |

---

## Next, once the map is right

1. **Cut the line** — decide which parts of this the software touches and which stay manual.
2. **Entities & schema** — fall out of the map almost mechanically once step 1 is settled.
3. **Screens** — one per real decision point, not one per table.
