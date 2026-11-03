# My Logs

Everything we kept as we designed and built the application, in one place.

**These are copies.** The originals live in `docs/` and are still the working
set — `app/db/open.js` reads `docs/02-schema.sql` at runtime, so nothing here
was moved. Refresh this folder whenever you want a current snapshot.

Taken **03 Nov 2026**.

---

## notes/ — the three living documents

| File | What it is |
|---|---|
| `00-TREE.md` | **The tree and the process breakdown.** The master document — the model, the fourteen statuses, the navigation map rebuilt from all 27 briefs, every decision we made and why, what is built, and the open questions. Start here. |
| `02-schema.sql` | **The database.** 79 tables. Every rule we settled is either enforced here or commented here — why status has no column, why a type carries no physical facts, why a version never dies. |
| `04-design-index.md` | **The render index.** Every screen, its status, its canonical `.dc.html`, and which brief it came from. Also carries the build-time fix blocks — changes agreed after a render was approved, to apply when building rather than re-render for. |

`docs/01-process-map.md` is **not** here: it was the first pass, written before
the walkthrough, and `00-TREE.md` supersedes it. Say the word if you want it
anyway.

---

## renders/ — the 29 approved screens

Everything you rendered in Claude Design and approved. Open any of them in a
browser.

**Cost breakdown** — the four tabs and the problems panel
```
cost-breakdown-01-scope.v4            cost-breakdown-03-purchasing.v1
cost-breakdown-02-requirements.v1     cost-breakdown-04-cost.v2
cost-breakdown-problems-panel.v1
```

**The estimate**
```
estimate-editor.v12
```

**The shell and the job**
```
project-browser.v14      version-view.v3
new-project.v2           new-option-version.v3
```

**Contacts**
```
contacts.v2              customer-contact-dialogs.v1
```

**Equipment** — the window, both tabs, the property sheet, the logs
```
equipment.v2                  equipment-render2.v5
equipment-rented.v2           equipment-render2.v6
equipment-type.v1             equipment-properties-tabs.v2
equipment-log-entry.v1        supplier-dialog.v3
rental-offering.v1            mobilization-panel.v1
```

**The record dialogs** — the only places status changes
```
record-dialogs.v13       schedule-dialog.v1
record-shipment.v2       invoice-dialog.v1
                         invoice-progress-billing.v2
```

**Trackers and the catalog**
```
trackers.v1              component-wizard.final
```

---

## What is NOT in here, and why

`docs/design/reference/` holds the old mock-ups and two real estimate PDFs you
supplied as source material. We took shape from them, never content — and in
several places deliberately rejected them (the navy selection, the 11px type,
the notes panel). They are inputs, not things we made, so they are not in
`renders/`.

`docs/design/preview/` is one working preview file, superseded by the v12
render.

The 27 design briefs themselves are in `docs/` as `03a`–`27`. They are the
instructions each render was drawn from — say the word and I will add them.
