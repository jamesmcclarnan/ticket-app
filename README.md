# Lewis Pies Ticket Submission App

IT / Technical ticket submission app, replacing the Microsoft Forms + Power
Automate intake route for `I2) IT Support tickets` in Agilebase.

No build step: plain HTML/CSS/JS plus one Vercel serverless function.

## Structure

```
ticket-app/
├── index.html            Markup only
├── css/styles.css        All styling
├── js/app.js             Screen navigation, validation, submit logic
├── assets/               Tile photos
├── api/submit-ticket.js  Serverless function: validates, then writes to Agilebase
├── lib/ticket-config.js  Agilebase table ID, field codes, limits (edit field codes here)
├── package.json
└── .env.example
```

## How a submission works

1. The browser sends a JSON POST to `/api/submit-ticket` containing only:
   category, name, email, dept, issueType, details.
2. The function checks the category, required fields, email shape and length
   limits, and ignores anything else in the payload.
3. It builds the Agilebase write request server-side (same query-string
   pattern as the stock take app: `Public.ab` with `c`, `t`,
   `save_new_record=true` and one parameter per field code) and sends it with
   the API key as a Bearer header.
4. Agilebase returns `row_id`, which is shown on the confirmation screen.

The browser never sees the Agilebase URL, table ID, field codes or key.

## Environment variables (Vercel -> Settings -> Environment Variables)

| Name | Purpose |
|---|---|
| `AB_TICKETS_API_KEY` | Key used for the write. Required. |
| `AB_ENVIRONMENT` | `live` writes to the live instance. Anything else, or unset, writes to the test instance. |

## Known limits and deferred items

- File attachments are hidden in V1 (AB file fields need their own upload
  handling). To restore the UI, remove the `hidden` attribute from the two
  "Attachment (optional)" fields in `index.html`; the upload itself still has
  to be built.
- Details is capped at 1000 characters because the data travels in the URL.
- No server-side idempotency token. The submit button locks while a request is
  in flight, and the Agilebase duplicate flag catches repeats within 24 hours.
- Technical issue types are placeholders (A-F) until the Technical team replies.
- Dept and IT issue type options in the form should match the values already
  used in Agilebase / the old MS Form.
- Ticket reference on the confirmation screen is Agilebase's `row_id`; confirm
  it matches the Ticket ID field on the first test.
- Custom domain (`tickets.lewispies.co.uk`) not set up yet.
