# Lewis Pies Ticket App: Handover

Last updated: 4 November 2026. This is the single source of truth for how the
app is built, where everything lives, and why decisions were made. No secrets
belong in this file: variable *names* only, never values.

## 1. What it is

A public, installable web app at **https://tickets.lewispies.co.uk** that lets
anyone at Lewis Pies raise an **IT Support** ticket, a **Technical** request or a
**Maintenance** job from a phone, tablet or PC (via QR code poster or link).

- IT and Technical write into the Agilebase (AB) table `I2) IT Support tickets`.
  They replace the old Microsoft Form + Power Automate route.
- Maintenance writes into the AB table `i1) Maintenance`.

No login. No build step. Plain HTML/CSS/JS plus three Vercel serverless functions
(`api/submit-ticket.js`, `api/submit-maintenance.js`, `api/forms.js`).

## 2. Status

**Done and tested on live**
- IT and Technical submission, with required-field validation (browser and server)
- Attachments (photo, screenshot or PDF, one per ticket) for all three forms
- "Remove attachment" link under every upload box (added 4 Nov 2026)
- Technical issue types supplied by the Technical team, live in AB and the form
- Department options match the old MS Form plus `IT`. Current order in the
  dropdown: Accounts, Bakery, Production, Technical, IT, Maintenance, Despatch,
  Sales, Other (not alphabetical; left as is on purpose)
- Duplicate-ticket flag in AB for IT/Technical (see section 6)
- Custom domain with HTTPS
- Installable on a phone home screen (icon, manifest)
- Spinning pie loading overlay, character counter on the long text boxes
- **Maintenance job form, live since 4 Nov 2026** (see sections 4, 5 and 9)
- **Forms switch (`ENABLED_FORMS`)**: the server refuses any form that is switched
  off, and the home screen only shows tiles for forms that are on (section 9)
- A4 poster with QR code. A second version that adds Maintenance was built on
  4 Nov 2026 (see section 3). Drafted all-staff launch email (IT/Technical only so far)

**Open / to confirm**
- Confirm the Maintenance confirmation screen shows the front-facing Maintenance
  Job Number on live (small `#number` badge). If it shows nothing, AB did not send
  the number back; see section 4
- Delete test data: test tickets in the live `I2) IT Support tickets` table, any
  FILETEST/PDFTEST records in the test instance, and the Maintenance test jobs
  in `i1) Maintenance` (hide-from-engineers guardrail is James's, outside the app)
- Confirm the senior maintenance engineer has an AB view of new jobs where Source
  is `Ticket App`, since Severity arrives as Minor by default and is re-graded
  there (section 5)
- Save the new poster PDF into the launch folder, print it, scan it with 2-3
  different phones, then put it up
- Update the all-staff email to mention Maintenance, choose the cut-off date for
  the old MS Form and fill in `[DATE]`
- Run old and new routes side by side for a couple of weeks
- Then switch the MS Form off (set "Accepting responses" to off) and turn the Power
  Automate flow **off**. Don't delete either for a few quiet weeks
- Test the home-screen install on an iPhone and an Android phone
- Decide whether the Vercel **Preview** environment should keep the live
  Maintenance key and `ENABLED_FORMS` (see section 7)
- Optional: test whether AB rejects a write with a wrong key (see section 11)
- Housekeeping: git tag `pre-multi-form-merge` marks the last pre-Maintenance
  commit (`03cb52e`). Keep it for a few weeks, then delete it and the `multi-form`
  branch (local and on GitHub)

**Parked (not started)**
- A failure alert for James (Teams channel or email) when a save fails. Today the
  user sees an error but nobody is told. It must contain no names, emails or
  ticket text
- Let staff choose a lower severity on the Maintenance form. Planned shape:
  plain-English choices, with Critical never selectable on the form
- A duplicate flag for Maintenance (like section 6), covering the 45-second timeout
  case where a save succeeded but the browser gave up
- HR reporting form. Needs decisions first: who sees submissions, whether
  anonymous reports are allowed. Nothing is wired. It was left out of the page on
  purpose (a hidden tile would still show in the page source)
- Brand alignment of the app's own CSS (section 9)
- Narrow the Claude Filesystem connector from the whole Mac to `~/ticket-app`

## 3. Where everything lives

| What | Where |
|---|---|
| Code | `~/ticket-app` on James's Mac; GitHub `jamesmcclarnan/ticket-app`, branch `main` |
| Live site | Vercel project (auto-deploys from `main`) |
| Secrets and settings | Vercel -> Settings -> Environment Variables only |
| Web address | `tickets.lewispies.co.uk` (CNAME, see section 8) |
| IT / Technical data | Live Agilebase instance, table `I2) IT Support tickets` |
| Maintenance data | Live Agilebase instance, table `i1) Maintenance` |
| Poster, QR files, email text | Outside the repo: `~/ticket-app-launch` (not served by the site, not backed up by GitHub) |

Launch folder contents: `ticket-poster-with-qr-code-A4.pdf` (original, IT and
Technical only), `ticket-qr-code.png`, `ticket-qr-code.svg`, and the Maintenance
version `ticket-poster-with-qr-code-A4-maintenance.pdf` once saved there.

Poster notes: the poster's text is converted to outlines in the PDF, so wording
cannot be edited in place. The Maintenance version was made by laying new text
(Lora Bold, Cabin) over the original page, so the logo, ticket box and QR code
are the original artwork, unchanged. The QR code points at
`https://tickets.lewispies.co.uk`. If the wording changes again, keep an editable
source this time. Print at 100% ("Actual size"), not "Fit to page".

Keep the repo out of iCloud (file stubs and conflict copies can corrupt a git
repo). GitHub is the sync and the backup.

## 4. How a submission works

There are three forms. IT and Technical share one endpoint and one table.
Maintenance has its own endpoint, table and API key.

**IT and Technical**
1. The browser checks the form, shrinks any photo to at most 1600px as a JPEG
   (PDFs go as they are, up to 3 MB), and sends one JSON POST to
   `/api/submit-ticket`.
2. The function (`api/submit-ticket.js`) checks the form is switched on, the
   category, the required fields, the email shape, the length limits and the
   attachment (type, size and the file's real first bytes). Anything else in the
   payload is ignored.
3. It writes to AB's `Public.ab` endpoint using the Bearer key from an
   environment variable. With no file, the data goes in the URL query string.
   With a file, every setting must be sent as a **form field** instead
   (`c`, `t`, `save_new_record`, plus the fields).
4. AB replies with `row_id`, which equals the Ticket ID. It is shown on the
   confirmation screen as the reference.

**Maintenance**
1. Same browser checks and photo handling, then a JSON POST to
   `/api/submit-maintenance` with only `requestedBy`, `site`, `area`, `issue`
   and an optional attachment.
2. `api/submit-maintenance.js` checks the form is switched on, refuses to run if
   `AB_ENVIRONMENT=test` (its codes are live-only), needs its own key
   (`AB_MAINTENANCE_API_KEY`, no fallback to the tickets key), and validates the
   four fields. Site must be exactly one of the two allowed sites.
3. The server adds Source (`Ticket App`), Status (`Open`) and Date Raised
   (today's date in UK time, format `04 Nov 2026`). The browser cannot set any of
   these. Severity is never sent.
4. Same write method as above (query string with no file, form fields with a file).
5. **The reference number is not `row_id`.** For Maintenance, AB's `row_id` is an
   internal ID and differs from the Maintenance Job Number engineers see (for
   example row 6170 was job 6100). The server returns the job number to the
   browser only if AB's reply contains field `arf8w69nczjv8rzr9` with a plain
   value; otherwise the confirmation says "Job logged" with no number.

**Home screen:** the page asks `/api/forms` which forms are on and shows only
those tiles. IT and Technical tiles show by default (so a failed request never
hides them); the Maintenance tile is hidden until the server lists it.

The browser never sees the AB URL, table ID, field codes or key.

## 5. Agilebase mapping

All codes live in `lib/ticket-config.js`. They are the live ones.

### 5a. IT and Technical: table `i2_it_support_tickets`

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
- Field codes can differ between the live and test AB instances.
- Changing an allowed list in AB: edit AB first, then the form, and delete any
  test records using the old values.
- Monitor how often "Other" is chosen for Technical; add real categories later.

### 5b. Maintenance: table `i1) Maintenance`, ID `wtgfigtxbdo80ethq`

| Form value | AB field | Code | Set by |
|---|---|---|---|
| Your name | Requested By | `requestedby_wtgfigtxbdo80ethq` | User (required) |
| Site | Site | `ftxzrgclewhosp6jz` | User (dropdown, required) |
| Area | Area | `zzrqtnyv8onftilbj` | User (free text, required) |
| Issue | Issue | `jwpdj7lzf73oktvto` | User (required, 3 to 1,000 characters) |
| Photo | Upload Image | `w6bzekugc8xw7vctq` | User (optional) |
| (hidden) | Source | `source_w3hwrqbs5e88vtxz` | Server, always `Ticket App` |
| (hidden) | Status | `ajqfctrdodochtqnr` | Server, always `Open` |
| (hidden) | Date Raised | `dateraised_sfutfee4ckric0ff` | Server, today's UK date, `04 Nov 2026` format |
| (none) | Maintenance Job Number | `arf8w69nczjv8rzr9` | AB auto-generates it; only read back, never sent |

Gotchas:
- **Live codes only.** The Maintenance table has not been checked on the test
  instance, so the endpoint refuses to run when `AB_ENVIRONMENT=test`.
- **Site** options are exactly `Lewis Pies` and `The Lewis Bakery` (AB's own list
  also has a blank first entry, which the form does not offer).
- **Source** is a list with enforced values: GMP, Salsa, BRC, EHO, Glass & Plastic,
  Pest Control, Complaint, Observation, Health & Safety, Emergency Job Form,
  Continuous Improvement, Ticket App. `Ticket App` was added for this app.
- **Severity** is deliberately not sent. AB defaults it to **Minor**. Values are
  Minor, Major, Critical, Observation. Critical triggers AB's critical
  notification (email), so users cannot choose it. Other AB emails fire only when
  a job is completed or when Source is Continuous Improvement.
- **Triage:** the senior maintenance engineer re-grades new jobs. The form carries
  a warning: if it is serious, a safety or food safety risk, or stopping
  production, tell your line manager straight away and do not rely on the form.
- **Raised By** is not set by the app. On the first test AB filled it with a
  default person's name, so James changed AB so it no longer sets a default for
  jobs created this way. The real name is in Requested By.
- Area is free text, so wording will vary in reports (same trade-off as Dept).
- Date Raised was previously typed by hand. The server now stamps it, and AB
  accepted the `04 Nov 2026` format on the first test.
- No Ticket Category equivalent exists in this table, so the IT/Technical
  visibility gotcha does not apply. Upload Image is always visible.

## 6. Duplicate-ticket flag (Agilebase side, IT and Technical only)

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
- **Maintenance has no equivalent yet** (parked, section 2).

## 7. Environment variables (Vercel)

| Name | Purpose |
|---|---|
| `AB_TICKETS_API_KEY` | Key for writing IT/Technical tickets to AB. Required |
| `AB_MAINTENANCE_API_KEY` | Separate key for writing Maintenance jobs. Required for Maintenance; never falls back to the tickets key |
| `ENABLED_FORMS` | Which forms are on, comma separated: `it,technical,maintenance` |
| `AB_ENVIRONMENT` | Optional. Unset = **live**. Exactly `test` = test instance |

`ENABLED_FORMS` rules:
- **Unset or blank = `it,technical`** (Maintenance off). A missing variable can
  never switch a new form on.
- Unknown names are ignored (so `hr` does nothing).
- A value that is set but has no valid names switches **every** form off (fails
  closed). The home screen would then show no tiles.
- Spaces and capitals are tolerated.

Current setting: `AB_MAINTENANCE_API_KEY` and `ENABLED_FORMS` are set for
**Production** and for **Preview** (both added 4 Nov 2026). Both are marked
sensitive, so Vercel will not show the values again; to change one, enter it again.
`AB_ENVIRONMENT` is unset everywhere.

- **Never leave `AB_ENVIRONMENT=test` set on Production:** real tickets would go to
  the test instance and the app would show success. This happened once.
- Changes only apply to deployments made *after* the change (push or redeploy).
- **Preview builds write to LIVE AB** (because `AB_ENVIRONMENT` is unset) and the
  Preview environment holds the live Maintenance key. Anyone submitting on a
  preview creates real records. Don't submit IT or Technical tickets on a preview.
- To switch Maintenance off quickly: remove `maintenance` from `ENABLED_FORMS` on
  Production and use Vercel's **Redeploy** (it applies the latest settings).

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
- **Strict server checks.** The form has no login, so each server function only
  accepts its own known fields, known categories or sites, JPEG or PDF files
  (checked by their first bytes), and server-generated filenames.
- **3 MB file cap, images only shrunk in the browser.** Vercel rejects request
  bodies over about 4.5 MB and base64 adds a third. PDFs can't be shrunk.
- **No file types beyond images and PDFs.** HTML/SVG files can carry scripts.
- **Long text capped at 1,000 characters** because the no-file write travels in the URL.
- **No service worker.** Stale cached versions after deploys caused confusion.
  The app is installable from the manifest alone, but needs a connection to open.
- **Minimum 3 characters on long text;** whitespace-only values are refused.
- **One endpoint per table (Maintenance is separate).** A mistake in Maintenance
  can't touch IT/Technical, and Maintenance has its own key. Shared safety code
  (`clean`, `readBody`, `readAttachment`, the date helper) lives in
  `lib/helpers.js` so both endpoints use identical checks.
- **Forms switch.** `lib/ticket-config.js` holds a `FORMS` list and
  `getEnabledForms()`. The server refuses a form that is off (403, before any
  call to AB); hiding the tile is only a convenience. Existing tiles fail open
  (shown if `/api/forms` can't be reached), new tiles fail closed.
- **Source, Status and Date Raised are set by the server, never the browser.**
  Severity is not collected (users habitually pick Critical, which sends emails).
- **The job number is shown only if AB sends it.** Never show `row_id` for
  Maintenance, because it is a different number.
- **Warning line on the Maintenance form** (serious or safety issues: tell your
  line manager). The form is not an emergency channel.
- **Remove attachment** is built into `setupFileDrop` in `js/app.js`, so all three
  upload boxes get it. It also fixes a dead end: the "remove it and submit
  without" error message used to have nothing to click.
- **Branding:** brand guidelines at https://lewispies.marriagebristol.com/.
  The app currently uses its own navy/teal/gold and Barlow/Inter fonts (guidelines
  say Lora Bold and Cabin; official navy `#043647`, gold `#f9b333`). The logo and
  icon are on-brand, and the new poster uses Lora Bold and Cabin. Aligning the
  app's CSS palette and fonts is a small optional change.
- **Edits are made manually in VS Code.** Claude advises what to change and why.

## 10. Deploying, checking and rolling back

- Normal flow: edit, run the **load check** (section 13), `git diff`, commit,
  push. Pushing `main` deploys to live.
- For bigger work, use a branch (for example `multi-form`):
  `git checkout -b name`, then `git push -u origin name`. Vercel builds a
  **Preview** (needs your Vercel login to open). Remember previews write to live AB.
  When happy: `git checkout main`, `git merge --ff-only name`, `git push`.
  Set any Production variables **before** that final push.
- **Redeploy rebuilds the OLD commit's code** (with the latest settings). It does
  not pick up newer code. For new code, push a commit (an empty one works:
  `git commit --allow-empty -m "Trigger deployment"`). Redeploy is the right tool
  after changing an environment variable.
- Roll back: Vercel -> the Production Deployment card -> **Instant Rollback**
  (seconds), then `git revert <commit>` and push. Tag `pre-multi-form-merge`
  (`03cb52e`) is the last version before Maintenance.
- Check what is live:
  `curl -s https://tickets.lewispies.co.uk/js/app.js | grep -c "prepareAttachment"`
  (should print 2 or more), and
  `curl -s https://tickets.lewispies.co.uk/api/forms`
  (should list the forms that are on, for example `{"forms":["it","technical","maintenance"]}`).
- Real failure reasons are in Vercel -> Logs (search by the request ID shown on an
  error page, or by path). The page shows only a generic message by design.
- Use `git --no-pager diff` so the diff doesn't open a pager.

## 11. Known limits

- No server-side idempotency token (the button locks while sending, and the AB flag
  catches repeats within 24 hours for IT/Technical only).
- A save that takes over 45 seconds shows an error in the browser even if AB saved
  it, so a retry can create a duplicate. Maintenance has no duplicate flag.
- Nobody is alerted when a save fails. The user sees an error and the reason is
  only in Vercel Logs (parked, section 2).
- No rate limiting. The form is public to anyone with the link.
- One file per ticket; images and PDFs only.
- Vercel's Hobby plan terms are non-commercial. Revisit if this becomes a
  concern (a paid seat removes the question).
- Not checked: whether AB enforces the API key on `Public.ab` writes. An earlier
  live key wrote successfully to the test instance. If keys aren't enforced, the
  functions' field whitelists are the only protection on the tables. To test, send
  a write with a deliberately wrong key to the TEST instance only (IT/Technical
  table; Maintenance has no test-instance setup).
- The look of the pages (spacing, tap targets) is only verified by eye on real
  devices; automated checks use a simulated browser with no layout.

## 12. Lessons learned

- Allowed-value mismatches fail as a generic "didn't go through". Check Vercel Logs.
- A 200 from the function plus a missing record means check which AB instance it
  wrote to.
- When AB receives a file, settings in the URL are ignored. Send them as form fields.
- **`node --check` only checks grammar.** A stray block that used an undefined name
  passed it and then crashed on Vercel (`FORMS is not defined`). Use the load
  check in section 13, which actually loads each endpoint, before every push.
- **Read the saved file, not the editor.** More than once a file was empty or
  missing an edit because the tab was unsaved or the text went into the wrong
  file. After saving, check from the terminal (`wc -l`, `grep -c`) or have the
  saved file read back. Sidebar dots and letters are git markers; a dot on the
  tab itself means unsaved.
- Paste code, don't type it: VS Code auto-adds a closing tag when you type the
  `>` of an HTML tag, which once broke the page structure.
- Large pastes into the editor can silently truncate.
- Wrapping HTML in a new `div` can change CSS that uses `:first-of-type`.
- The `hidden` attribute loses to any CSS `display` rule on the same element
  (the tile needed `.tile[hidden]{display:none;}`).
- The AB `row_id` is not always the number people see. Check which field is the
  user-facing ID before showing a reference.
- A server that refuses a method (405) before anything else is a safe way to test
  whether a function loads: open its address in a browser.
- Old browsers and home-screen icons keep stale copies. Use the `curl` check above
  before assuming the site went backwards.

## 13. Commands

```
cd ~/ticket-app
git status -sb

# Load check: loads each endpoint the way Vercel does. Catches undefined names
# and bad imports that node --check cannot. Safe: it never calls AB.
node --input-type=module -e "for (const f of ['forms','submit-maintenance','submit-ticket']) { await import('./api/'+f+'.js'); console.log('loads ok:', f); }"

# Syntax check of the browser code
node --check js/app.js && echo "syntax ok"

git --no-pager diff --stat
git add . && git commit -m "message" && git push
dig NS lewispies.co.uk +short
```

To run the load check and commit in one go (git stops if the check fails):

```
node --input-type=module -e "for (const f of ['forms','submit-maintenance','submit-ticket']) { await import('./api/'+f+'.js'); console.log('loads ok:', f); }" && git --no-pager diff --stat && git add . && git commit -m "message" && git push
```

## 14. Release history

| Date | Change |
|---|---|
| Before 4 Nov 2026 | IT and Technical built, tested and live on `tickets.lewispies.co.uk` |
| 4 Nov 2026 | `multi-form` merged to `main` (fast-forward, commit `9a820cc`): Maintenance form, `ENABLED_FORMS` switch, `/api/forms`, shared helpers, warning line, Remove attachment. Production variables `AB_MAINTENANCE_API_KEY` and `ENABLED_FORMS` added first. Rollback point: tag `pre-multi-form-merge` (`03cb52e`) |
| 4 Nov 2026 | Poster version with Maintenance created |
