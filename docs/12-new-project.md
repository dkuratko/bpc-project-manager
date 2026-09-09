# Design brief — NEW PROJECT
**POPUP**, on a translucent scrim, the way the component wizard dialogs were
presented. Opened by `New project` on the browser toolbar, or `Ctrl+N`.
Apply `03f-money-formatting.md` and `11-date-formatting.md`.

---

## ⛔ SCOPE

**One dialog, alone on a `rgba(0,0,0,.42)` scrim.** Do not draw the browser
behind it. One state. One well-formed document, nothing after `</x-dc>`.

---

## What it is

The first screen in the whole process. A project **is** a request to quote — it
comes in as an email, a text or a call — and this is the only thing standing
between that and a record.

So it is **deliberately small.** Fill in what the request told you and get out;
everything else is learned later and entered where it is used.

**The same dialog edits a project afterwards**, titled `Project properties`
instead of `New Project`, with `Create` reading `OK`. One dialog, two modes.

---

## Dialog

Windows 2000, **520 px** wide, `#c0c0c0`, standard bevel, drop shadow.
Title bar `#000080 → #1084d0`, white bold, close box at the right.

```
New Project
```

### Group box · "Identify it"

```
Project number    26-15        ← read-only, grey. "next in sequence"
Title             [ San Tan Shade Installation             ]   ★ required
Estimator         [ DK — Damian Kuratko                  ▼]
```

Project number is **not editable** and not a field — plain grey text with the
words `next in sequence` beside it. It resets to 1 every January.

### Group box · "Customer"

```
Customer          [ Exerplay, Inc.                       ▼] [＋]   ★ required
Contact           [ Grant Smith                          ▼] [＋]
```

Both pull from Contacts. `[＋]` is a small raised button that creates one
inline without losing what you have typed. The Contact list filters to the
chosen customer.

### Group box · "Site"

```
Address           [ 1625 W Ryan Rd                        ]
City              [ Chandler        ]  State [ AZ ]  Zip [ 85286    ]
Distance          [  18 ] mi          Drive time [ 0.4 ] hr each way
```

Distance and drive time price mobilization. You know roughly where the site is
as soon as you have the address, so they belong here — but neither is required.

### Group box · "Notes"

A three-line wrapping text area, empty.

### Tip block

`#ffffe1`, 1 px black inset:

> Only **Title** and **Customer** are required. Everything else can be added
> later — this dialog reopens as **Project properties**.
> **Native material and site conditions are not here.** They are learned from
> the site, not from the request, and live on the cost breakdown's
> *Site conditions* box.

### Buttons

```
[ Create ]   [ Create & start version A0 ]   [ Cancel ]
```

`Create & start version A0` is the **default**, outlined — creating a project
you are not about to quote is the rare case. It creates the project, creates
version `A0`, and opens its Cost Breakdown.

`Create` alone makes the project and closes, leaving it in the browser with
`0 versions`.

---

## Rules

- **Only Title and Customer are required.** Nothing else blocks creation.
- **The project number is never editable.**
- No status, no dates, no money on this dialog — a project has none of those.
  It is a container.
- One dialog, alone on a scrim. No window behind it.

---

## ★ Three things to confirm

**1. Distance and drive time — here or later?** They are the only fields on
this dialog you might not know from the request alone. They could move to the
cost breakdown with native material. Included here on the grounds that an
address implies them.

**2. Is `Estimator` right?** The schema has `projects.owner_user_id` and the
browser filters on it. With one user today it will always say `DK`. Worth
keeping for when there are more, or noise until then?

**3. Does a project ever get created without a quote following?** If not,
`Create` alone could go and the dialog would always start version A0.
