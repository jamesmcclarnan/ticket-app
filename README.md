# Lewis Pies Ticket App

Public web app for raising **IT Support** and **Technical** tickets, written
straight into the `I2) IT Support tickets` table in Agilebase. Live at
https://tickets.lewispies.co.uk. Replaces the old Microsoft Form + Power Automate route.

No build step: plain HTML/CSS/JS plus one Vercel serverless function.

**Full details, decisions, gotchas and the launch checklist are in
[`docs/HANDOVER.md`](docs/HANDOVER.md).** Read that first.

## Structure

```
ticket-app/
├── index.html            Markup only
├── css/styles.css        All styling
├── js/app.js             Screens, validation, attachments, submit
├── assets/               Tile photos
├── icons/                App icons and favicon
├── manifest.json         Home-screen install settings
├── api/submit-ticket.js  Serverless function: validates, writes to Agilebase
├── lib/ticket-config.js  Table ID, field codes, limits (edit codes here)
├── docs/HANDOVER.md      Handover and runbook
├── package.json
└── .env.example
```

## How a submission works

1. The browser validates the form, shrinks any photo (max 1600px JPEG), and sends
   one JSON POST to `/api/submit-ticket`.
2. The function accepts only the known ticket fields and a JPEG or PDF attachment,
   checks them, then writes to Agilebase's `Public.ab` endpoint with the key from
   an environment variable.
3. Agilebase returns the new row ID, shown as the ticket number.

The browser never sees the Agilebase URL, table, field codes or key.

## Environment variables (Vercel -> Settings -> Environment Variables)

| Name | Purpose |
|---|---|
| `AB_TICKETS_API_KEY` | Key for writing to Agilebase. Required |
| `AB_ENVIRONMENT` | Optional. Unset means live. Exactly `test` writes to the test instance |

Never leave `AB_ENVIRONMENT=test` set on Production. Changes apply only to
deployments made after the change.

## Limits

- Attachments: one file, images or PDF, PDFs up to 3 MB (photos resized for you)
- Details: 3 to 1,000 characters
- Technical issue types and Ticket Category must match Agilebase's allowed values exactly

## Working on it

```
cd ~/ticket-app
node --check js/app.js && node --check api/submit-ticket.js && node --check lib/ticket-config.js && echo "syntax ok"
git --no-pager diff --stat
git add . && git commit -m "message" && git push
```

Pushing to `main` deploys automatically. "Redeploy" in Vercel rebuilds the OLD
commit, so use a new commit for new code.
