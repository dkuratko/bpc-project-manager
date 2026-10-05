# v0 — the previous build. REFERENCE ONLY.

**Nothing here is built on.** It predates this project's walkthrough and was
set aside on 06 Sep 2026 — *"the other project has gotten too misconstrued"* —
and `00-TREE.md` §12 has listed it as reference-only since.

Kept because a few parts are worth looking at while rebuilding, not because
any of it is correct:

```
engine/schema.sql     35 tables. the current schema has 79 and a different
                      shape — options hold nothing, versions are the job,
                      cost objects are unified. do not diff them for truth.
estimator/win95.css   an early pass at the Win2000 vocabulary. the approved
                      renders in docs/design/ are the real source.
builder/              the document builder. its print CSS is the only part
                      no render replaces.
```

Everything that governs the rebuild is in `docs/`:
`00-TREE.md` for structure, `02-schema.sql` for data, `04-design-index.md`
for which render is canonical for which screen.
