# Lewis Pies Ticket App

Public web app for raising **IT Support** tickets, **Technical** requests and
**Maintenance** jobs, written straight into Agilebase. IT and Technical go into the
`I2) IT Support tickets` table; Maintenance goes into `i1) Maintenance`. Live at
https://tickets.lewispies.co.uk. Replaces the old Microsoft Form + Power Automate
route for IT and Technical.

No build step: plain HTML/CSS/JS plus three Vercel serverless functions.

**Full details, decisions, gotchas and the launch checklist are in
[`docs/HANDOVER.md`](docs/HANDOVER.md).** Read that first.

## Structure

```
ticket-app/
├── index.html                Markup only
├── css/styles.css            All styling
├── js/app.js                 Screens, validation, attachments, submit
├── assets/                   Tile photos
├── icons/                    App icons and favicon
├── manifest.json             Home-screen install settings
├── api/submit-ticket.js      IT and Technical: validates, writes to Agilebase
├── api/submit-maintenance.js Maintenance: validates, writes to Agilebase (own key)
├── api/forms.js              Lists which forms are switched on (read only)
├── lib/ticket-config.js      Tables, field codes, limits, form list (edit codes here)
├── lib/helpers.js            Shared safety checks (text cleaning, attachments, date)
├── docs/HANDOVER.md          Handover and runbook
├── package.json
└── .env.example
```

## How a submission works

1. The browser validates the form, shrinks any photo (max 1600px JPEG), and sends
   one JSON POST to `/api/submit-ticket` (IT, Technical) or
   `/api/submit-maintenance` (Maintenance).
2. The function checks the form is switched on, accepts only its own known fields
   and a JPEG or PDF attachment, validates them, then writes to Agilebase's
   `Public.ab` endpoint with the key from an environment variable.
3. IT and Technical show Agilebase's new row ID as the ticket number. Maintenance
   shows the Maintenance Job Number only if Agilebase sends it back (its row ID is
   a different number), otherwise just "Job logged".

The browser never sees the Agilebase URL, tables, field codes or keys. The home
screen asks `/api/forms` which tiles to show; the server enforces the same list.

## Environment variables (Vercel -> Settings -> Environment Variables)

| Name | Purpose |
|---|---|
| `AB_TICKETS_API_KEY` | Key for writing IT and Technical tickets. Required |
| `AB_MAINTENANCE_API_KEY` | Separate key for Maintenance jobs. Required for Maintenance, no fallback |
| `ENABLED_FORMS` | Comma-separated forms that are on, e.g. `it,technical,maintenance`. Unset means `it,technical` |
| `AB_ENVIRONMENT` | Optional. Unset means live. Exactly `test` writes to the test instance (Maintenance refuses to run in test) |

Never leave `AB_ENVIRONMENT=test` set on Production. Changes apply only to
deployments made after the change. Preview builds write to the live Agilebase.

## Limits

- Attachments: one file, images or PDF, PDFs up to 3 MB (photos resized for you)
- Long text: 3 to 1,000 characters
- Technical issue types, Ticket Category and the Maintenance Site list must match
  Agilebase's allowed values exactly

## Working on it

```
cd ~/ticket-app
node --input-type=module -e "for (const f of ['forms','submit-maintenance','submit-ticket']) { await import('./api/'+f+'.js'); console.log('loads ok:', f); }"
node --check js/app.js && echo "syntax ok"
git --no-pager diff --stat
git add . && git commit -m "message" && git push
```

The first command is the **load check**. It catches undefined names and bad
imports that `node --check` misses, and it never contacts Agilebase.

Pushing to `main` deploys automatically. Pushing any other branch builds a
Preview. "Redeploy" in Vercel rebuilds the OLD commit (with the latest settings),
so use a new commit for new code.
