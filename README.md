# Build Play Contracting — Project Manager 1.0

A Windows 2000–style desktop project tracker, built with Electron from the design blueprints
(`0 Conventions` + `1 Shell`). This first build is the **Shell**: the Project Browser (Screen 01)
and the New Project dialog (Screen 02).

## Run it

```bash
npm start
```

(The first `npm install` already downloaded Electron. If you ever move the folder, run `npm install` again.)

## What works in this build

- **Project Browser** — the MDI application frame: title bar, menu bar, toolbar, filter band,
  folder tree, sortable project list, and status bar, all in the Win2000 look.
- **Folder tree scoping** — All Projects, Active broken out by stage, Attention Required
  (swaps the Stage column for an Alert column), On Hold, Closed, By Customer, Recently Viewed, Archive.
- **Filter band** — Status / Stage / Customer drop-downs, free-text Find, and "Attention only".
- **Sorting** — click any column header; click again to reverse. Defaults to Next date, ascending.
- **New Project** (Ctrl+N) — the full dialog with auto-assigned ID, required-field validation,
  duplicate customer+address warning, add-a-customer on the fly, and "open after creating".
- **Open a project** — double-click / Enter opens an MDI child window (a placeholder standing in for
  the Workspace, which is design Sheet 03). The Window menu, Cascade, and Ctrl+Tab all work.
- **Right-click a row** — context menu: Open, Uploads, Set Stage ▸, Set Status ▸, Clear Flag, Properties.
- **Local persistence** — everything is saved to this machine (Electron localStorage) and restored
  on next launch. It starts seeded with the 12 sample projects from the blueprint.

Uploads, printing, import/export, and options are stubbed with a note — those belong to the later
design sheets (Workspace, Money & paper, Field, Record, Storyboard).

## Where the data lives

`~/Library/Application Support/Build Play Contracting - Project Manager/` (Local Storage).
Delete that folder to reset back to the seeded sample data.

## Project layout

```
main.js            Electron main process (frameless window + window controls)
preload.js         Bridges the min/max/close buttons
renderer/
  index.html       The application frame markup
  styles.css       Windows 2000 visual language (bevels, gradients)
  data.js          Stage/status/flag model + the 12 seed projects
  app.js           All UI logic: tree, list, filters, dialogs, MDI windows
```
