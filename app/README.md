# app — Build Play Contracting · Project Manager

Rebuilt from the walkthrough in `../docs/`. **Nothing is carried over from
`../reference/v0`** — that was a different vision and it is not implementable
here.

```
npm start      open the application
npm test       the derivation, the seed, the board
npm run check  build the schema into a throwaway database and verify it
npm run rebuild  after changing Node or Electron versions — see below
```

## Where things are

```
main.js        the frame. one window, no chrome of its own, two kinds of
               IPC: plain reads, and domain calls where a derivation is
               involved.
preload.js     the only path between a screen and the database.
db/open.js     one file, WAL, foreign_keys ON. The schema is NOT copied
               here — ../docs/02-schema.sql stays the single source.
db/status.js   status, derived. There is no status column anywhere.
db/board.js    every project, its versions, and the status of each.
db/seed.js     sample data, every record traceable to an approved render.
ui/win2000.css the vocabulary all 29 renders repeated as inline styles.
ui/shell.js    the teal desk and the windows on it.
ui/screens/    one file per screen.
```

## The rules it is built to

`../docs/00-TREE.md` is the master record; these three sections govern the
code more than the rest:

- **§0 design principles** — nothing silently assumed, templates vs
  commitments, one allocation rule.
- **§9b navigation** — what opens what, and the four rules underneath: a MAIN
  window asked for twice raises the one that is open; a popup opened from a
  popup stays modal to its parent; nothing navigates on save except the two
  buttons that say they will; the project browser has no close button at all.
- **§12 reference only** — `reference/v0`. Do not build on it.

`../docs/04-design-index.md` says which render is canonical for which screen.
Build a screen from its render, not from memory.

## Native modules

`better-sqlite3` is compiled, so it has to match the runtime's ABI. Electron
bundles its own Node, which is usually a different version from the one on the
machine — so after `npm install`, or after changing either version:

```
npm run rebuild
```

The tests run with `ELECTRON_RUN_AS_NODE=1` for the same reason: they exercise
the exact runtime the app uses, not a second Node that happens to be installed.
