# Lewis Pies Ticket App: Handover

Last updated: November 2026. This is the single source of truth for how the
app is built, where everything lives, and why decisions were made. No secrets
belong in this file: variable *names* only, never values.

## 1. What it is

A public, installable web app at **https://tickets.lewispies.co.uk** that lets
anyone at Lewis Pies raise an **IT Support** or **Technical** ticket from a
phone, tablet or PC (via QR code poster or link). It writes straight into the
existing Agilebase (AB) table `I2) IT Support tickets`. It replaces the old
Microsoft Form + Power Automate route.

No login. No build step. Plain HTML/CSS/JS plus one Vercel serverless function.

## 2. Status

**Done and tested on live**
- IT and Technical submission, with required-field validation (browser and server)
- Attachments (photo, screenshot or PDF, one per ticket) for both categories
- Technical issue types supplied by the Technical team, live in AB and the form
- Duplicate-ticket flag in AB (see section 6)
- Custom domain with HTTPS
- Installable on a phone home screen (icon, manifest)
- Spinning pie loading overlay, character counter on Details
- A4 poster with QR code, and a drafted all-staff launch email

**Open / to confirm**
- Confirm the Department options and the extra `IT` option were committed and
  deployed (the list should match the old MS Form: Accounts, Bakery, Despatch,
  IT, Maintenance, Production, Sales, Technical, Other)
- Delete all test tickets in the live table (and any FILETEST/PDFTEST records in
  the test instance)
- Choose the cut-off date for the old MS Form and fill in `[DATE]` in the email
- Print the poster, scan it with 2-3 different phones, then put it up
- Run old and new routes side by side for a couple of weeks
- Then switch the MS Form off (set "Accepting responses" to off) and turn the Power
  Automate flow **off**. Don't delete either for a few quiet weeks
- Test the home-screen install on an iPhone and an Android phone
- Optional: test whether AB rejects a write with a wrong key (see section 9)

**Planned next (not started)**
- Multi-purpose app: a Maintenance job tile that posts to the AB maintenance
  table, and an HR reporting skeleton hidden behind a Vercel setting
  (`ENABLED_FORMS`). Work on a branch called `multi-form`. Needs the maintenance
  table's internal name, field codes and allowed values first.

## 3. Where everything lives

| What | Where |
|---|---|
| Code | `~/ticket-app` on James's Mac; GitHub `jamesmcclarnan/ticket-app`, branch `main` |
| Live site | Vercel project (auto-deploys from `main`) |
| Secrets and settings | Vercel -> Settings -> Environment Variables only |
| Web address | `tickets.lewispies.co.uk` (CNAME, see section 8) |
| Ticket data | Live Agilebase instance, table `I2) IT Support tickets` |
| Poster, QR files, email text | Outside the repo (launch folder). Not served by the site |

Keep the repo out of iCloud (file stubs and conflict copies can corrupt a git
repo). GitHub is the sync and the backup.

## 4. How a submission works

1. The browser checks the form, shrinks any photo to at most 1600px as a JPEG
   (PDFs go as they are, up to 3 MB), and sends one JSON POST to
   `/api/submit-ticket`.
2. The function (`api/submit-ticket.js`) checks the category, the required
   fields, the email shape, the length limits and the attachment (type, size and
   the file's real first bytes). Anything else in the payload is ignored.
3. It writes to AB's `Public.ab` endpoint using the Bearer key from an
   environment variable. With no file, the data goes in the URL query string.
   With a file, every setting must be sent as a **form field** instead
   (`c`, `t`, `save_new_record`, plus the fields).
4. AB replies with `row_id`, which equals the Ticket ID. It is shown on the
   confirmation screen as the reference.

The browser never sees the AB URL, table ID, field codes or key.

## 5. Agilebase mapping

Table: `i2_it_support_tickets`. All codes live in `lib/ticket-config.js`.

| Form value | AB field | Code |
|---|---|---|
| Category (IT / Technical) | Ticket Category | `ticket_category_tt` |
| Name | Name | `name_1` |
| Email | Email Address | `email_address_1` |
| Dept | Dept | `dept` |
| IT issue type | Issue Type | `issue_type` |
| IT details | Details | `details_0` |
| Technical issue type | Technical Issue Type | `technical_issue_type_r8` |
| Technical details | Technical Details | `technical_details_af` |
| IT attachment | File | `file_0` |
| Technical attachment | Technical Link To File | `technical_link_to_file_db` |

Gotchas:
- **`technical_link_to_file_db` is a FILE field** despite the name. IT's real
  upload field is `file_0` ("File"). `Evidence Upload` is IT-admin only; don't use it.
- **Allowed values are enforced by AB.** Ticket Category allows only
  `IT` and `Technical`. Technical Issue Type allows only the seven Title Case
  values below. The form's dropdown must match them exactly or AB refuses the ticket:
  Customer Request For Information; Finished Product Specification; Set Up New
  Raw Material / Supplier; Alternative Raw Material / Supplier; Agilebase Spec /
  Core / Recipe Issue; Artwork And Marketing Materials Sign Off; Other.
  (Option text cannot contain a comma: AB's list is comma-separated.)
- Dept and IT Issue Type accept any text, so only the *wording* matters for reports.
- Ticket Category must be set for the category's field group to show on a
  record (visibility rules). A record created with no category hides the IT File field.
- Field codes can differ between the live and test AB instances. The codes above
  are the live ones.
- Changing an allowed list in AB: edit AB first, then the form, and delete any
  test records using the old values.
- Monitor how often "Other" is chosen for Technical; add real categories later.

## 6. Duplicate-ticket flag (Agilebase side)

View `xref - it ticket dupe check` with calcs Match Key, Earliest Ticket ID,
Earliest Created Time, Is Duplicate. A workflow sets `Duplicate Ticket?` and
`Duplicate Of` on the later ticket. It **flags only, never deletes.**

- Match Key = category | name | details | technical details (lower-cased, trimmed).
  An earlier version used only name and IT Details, which wrongly flagged
  separate Technical tickets as duplicates.
- Window: same key within 24 hours.
- After changing the Match Key, re-save the Earliest Ticket ID and Earliest
  Created Time calcs, or they keep grouping by the old key.
- The workflow acts once per record. A wrongly flagged record must be un-flagged
  by hand.
- Purpose: a safety net if the browser retries a request that did save.

## 7. Environment variables (Vercel)

| Name | Purpose |
|---|---|
| `AB_TICKETS_API_KEY` | Key for writing to AB. Required |
| `AB_ENVIRONMENT` | Optional. Unset = **live**. Exactly `test` = test instance |

- Never leave `AB_ENVIRONMENT=test` set on Production: real tickets would go to
  the test instance and the app would show success. This happened once.
- Changes only apply to deployments made *after* the change (push or redeploy).

## 8. Domain and DNS

- `tickets.lewispies.co.uk` is a CNAME to the target Vercel shows for the
  project (currently `7f71d72b74368e30.vercel-dns-017.com`), added in 123-reg.
- The domain's nameservers show as GoDaddy (`domaincontrol.com`), but the
  123-reg DNS panel does feed them. Verified with
  `dig tickets.lewispies.co.uk CNAME @ns63.domaincontrol.com +short`.
- Use only the custom domain for QR codes and installs, never the `.vercel.app`
  address. An installed app is tied to the address it came from.
- If the Vercel project is ever retired, remove the CNAME so nobody else can claim it.
- Production domain is public. Preview deployments need a Vercel login.

## 9. Design decisions and why

- **Live by default, test only by explicit switch.** A test fallback once sent
  real tickets to the wrong instance with no visible error.
- **Strict server checks.** The form has no login, so the server only accepts
  the six ticket fields, known categories, JPEG or PDF files (checked by their
  first bytes), and server-generated filenames.
- **3 MB file cap, images only shrunk in the browser.** Vercel rejects request
  bodies over about 4.5 MB and base64 adds a third. PDFs can't be shrunk.
- **No file types beyond images and PDFs.** HTML/SVG files can carry scripts.
- **Details capped at 1,000 characters** because the no-file write travels in the URL.
- **No service worker.** Stale cached versions after deploys caused confusion.
  The app is installable from the manifest alone, but needs a connection to open.
- **Details minimum 3 characters;** whitespace-only values are refused.
- **Branding:** brand guidelines at https://lewispies.marriagebristol.com/.
  The app currently uses its own navy/teal/gold and Barlow/Inter fonts (guidelines
  say Lora Bold and Cabin; official navy `#043647`). The logo and icon are on-brand.
  Aligning the CSS palette and fonts is a small optional change.
- **Edits are made manually in VS Code.** Claude advises what to change and why.

## 10. Deploying, checking and rolling back

- Normal flow: edit, `node --check` the JS, `git diff`, commit, push to `main`.
  Vercel deploys automatically (watch the Deployments tab for Ready and Current).
- **Redeploy rebuilds the OLD commit.** It does not pick up newer code. For new
  code, push a commit (an empty one works: `git commit --allow-empty -m "Trigger deployment"`).
- Roll back by reverting the commit: `git revert <commit>` then push.
- Check what is live:
  `curl -s https://tickets.lewispies.co.uk/js/app.js | grep -c "prepareAttachment"`
  (should print 2 or more).
- Real failure reasons are in Vercel -> Logs. The page shows only a generic
  message by design.
- Use `git --no-pager diff` so the diff doesn't open a pager.

## 11. Known limits

- No server-side idempotency token (the button locks while sending, and the AB flag
  catches repeats within 24 hours).
- No rate limiting. The form is public to anyone with the link.
- One file per ticket; images and PDFs only.
- Vercel's Hobby plan terms are non-commercial. Revisit if this becomes a
  concern (a paid seat removes the question).
- Not checked: whether AB enforces the API key on `Public.ab` writes. An earlier
  live key wrote successfully to the test instance. If keys aren't enforced, the
  function's field whitelist is the only protection on the table. To test, send a
  write with a deliberately wrong key to the TEST instance only.

## 12. Lessons learned

- Allowed-value mismatches fail as a generic "didn't go through". Check Vercel Logs.
- A 200 from the function plus a missing record means check which AB instance it
  wrote to.
- When AB receives a file, settings in the URL are ignored. Send them as form fields.
- Large pastes into the editor can silently truncate. Run `node --check` after
  overwriting a file.
- Old browsers and home-screen icons keep stale copies. Use the `curl` check above
  before assuming the site went backwards.

## 13. Commands

```
cd ~/ticket-app
git status -sb
node --check js/app.js && node --check api/submit-ticket.js && node --check lib/ticket-config.js && echo "syntax ok"
git --no-pager diff --stat
git add . && git commit -m "message" && git push
dig NS lewispies.co.uk +short
```
