# Lewis Pies Ticket Submission App

IT / Technical ticket submission app, replacing the Microsoft Forms + Power
Automate intake route for `I2) IT Support tickets` in Agilebase.

No build step — plain HTML/CSS/JS, deployed on Vercel the same way as the
stock take app. Nothing to compile or bundle; open `index.html` in a browser
(or run `vercel dev`) and it works as-is.

## Structure

```
ticket-app/
├── index.html          Markup only — no inline styles or scripts
├── css/
│   └── styles.css      All styling
├── js/
│   └── app.js           Screen navigation, validation, file-drop handling
├── assets/
│   ├── james.jpg        IT tile photo
│   └── britt.jpg         Technical tile photo
├── api/
│   └── proxy.js          Placeholder — see "What's NOT done yet" below
├── package.json
├── .gitignore
└── .env.example          Documents env vars the proxy will need later
```

The Lewis Pies logo is kept as inline SVG directly in `index.html` (in two
places — the header and the homescreen) rather than as a separate file. This
is deliberate: the logo includes live text (the "1936" mark) set in a Google
Font, and inline SVG is the only reliable way to guarantee that renders
correctly everywhere — an external `.svg` file loaded via `<img>` doesn't
reliably pick up page-level web fonts across browsers. If this ever becomes
annoying to maintain, the real fix is converting "1936" to a vector path
(removing the font dependency entirely), not moving it to an external file.

## What's done

- Full 3-screen flow: category choice → form (IT or Technical fields,
  shown/hidden based on category) → confirmation
- Client-side validation on required fields
- Working file picker + drag-and-drop on the attachment field (selects a
  real file in the browser — nothing uploaded anywhere yet)
- Screen transitions, loading state on submit, confirmation animation

## What's NOT done yet

- **No Agilebase integration.** `api/proxy.js` is a stub that returns
  `501 Not Implemented`. The Submit button currently just shows the
  confirmation screen locally — it does not send data anywhere.
- **No duplicate-submission protection.** Before wiring up the real API
  call, add an idempotency token: generate a random ID client-side when the
  form loads, send it with the submission, and have the proxy (or an AB-side
  view) reject a second request carrying the same token. This is cheap
  insurance against double-taps or back-button resubmits.
- **Technical issue type options are placeholders** (Placeholder A–F) until
  the Technical team gets back with real categories post-audit.
- **No real ticket reference on confirmation** — currently hardcoded
  `#000000`. Needs to show the actual AB-assigned Ticket ID once the API
  call is wired up.
- **Not yet deployed anywhere.** No GitHub repo, no Vercel project exists
  for this yet — next step is pushing this folder to a new repo and
  connecting it to Vercel, same as the stock take app.
- **No custom domain.** Once a Vercel project exists, add
  `tickets.lewispies.co.uk` as a custom domain (Settings → Domains) rather
  than relying on the default `.vercel.app` URL — keeps the QR code stable
  long-term regardless of what happens to the Vercel project itself.

## Local development

No installs needed to just look at it:

```
open index.html
```

For testing the API route locally once it's built out, you'll need the
Vercel CLI:

```
npm i -g vercel
vercel dev
```
