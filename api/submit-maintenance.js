import {
  AB_WRITE_URLS,
  COMPANY_ID,
  MAINTENANCE,
  getEnabledForms
} from "../lib/ticket-config.js";
import { clean, readBody, readAttachment, formatDateRaised } from "../lib/helpers.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!getEnabledForms(process.env.ENABLED_FORMS).includes("maintenance")) {
    return res.status(403).json({ error: "This form is not available" });
  }

  // The Maintenance codes are live-instance codes only.
  if (process.env.AB_ENVIRONMENT === "test") {
    console.error("Maintenance form has live codes only; refusing while AB_ENVIRONMENT=test");
    return res.status(500).json({ error: "Server is not configured" });
  }

  const apiKey = process.env[MAINTENANCE.apiKeyEnv];
  if (!apiKey) {
    console.error(`${MAINTENANCE.apiKeyEnv} is not set`);
    return res.status(500).json({ error: "Server is not configured" });
  }

  const body = readBody(req);
  if (!body) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const { limits, fieldCodes, sites } = MAINTENANCE;
  const requestedBy = clean(body.requestedBy, limits.requestedBy);
  const site = clean(body.site, 100);
  const area = clean(body.area, limits.area);
  const issue = clean(body.issue, limits.issue);

  const checks = [
    [!requestedBy, "requestedBy", "Please enter your name."],
    [!sites.includes(site), "site", "Please select a site."],
    [!area, "area", "Please enter the area."],
    [issue.length < limits.minIssue, "issue", "Please describe the job."]
  ];
  const failed = checks.find(([isProblem]) => isProblem);
  if (failed) {
    return res.status(400).json({ error: failed[2], field: failed[1] });
  }

  const baseParams = {
    c: COMPANY_ID,
    t: MAINTENANCE.table,
    save_new_record: "true",
    [fieldCodes.issue]: issue,
    [fieldCodes.area]: area,
    [fieldCodes.requestedBy]: requestedBy,
    [fieldCodes.site]: site,
    [fieldCodes.source]: MAINTENANCE.sourceValue,
    [fieldCodes.status]: MAINTENANCE.statusValue,
    [fieldCodes.dateRaised]: formatDateRaised()
  };

  let attachment = null;
  if (body.attachment) {
    attachment = readAttachment(body.attachment);
    if (!attachment) {
      return res.status(400).json({ error: "Invalid attachment" });
    }
  }

  let requestUrl = AB_WRITE_URLS.live;
  let requestBody;
  if (attachment) {
    requestBody = new FormData();
    for (const [key, value] of Object.entries(baseParams)) {
      requestBody.append(key, value);
    }
    requestBody.append(
      MAINTENANCE.fileField,
      new Blob([attachment.buffer], { type: attachment.mimeType }),
      attachment.filename
    );
  } else {
    requestUrl = `${requestUrl}?${new URLSearchParams(baseParams).toString()}`;
  }

  try {
    const abResponse = await fetch(requestUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: requestBody
    });

    const text = await abResponse.text();
    if (!abResponse.ok) {
      console.error(`Agilebase maintenance write failed (${abResponse.status}):`, text.slice(0, 500));
      return res.status(502).json({ error: "Could not save the job" });
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("Agilebase returned non-JSON response:", text.slice(0, 500));
      return res.status(502).json({ error: "Could not confirm the job was saved" });
    }

    if (!result.row_id) {
      console.error("Agilebase response had no row_id:", JSON.stringify(result).slice(0, 500));
      return res.status(502).json({ error: "Could not confirm the job was saved" });
    }

        // The job number engineers see is NOT row_id. Show it only if Agilebase sends it back.
    const rawJobNumber = result[MAINTENANCE.jobNumberField];
    const jobNumber = /^[A-Za-z0-9-]{1,20}$/.test(String(rawJobNumber ?? "")) ? String(rawJobNumber) : null;

    // TEMPORARY: remove once we have confirmed the job number comes back.
    console.log(
      "MAINT-TEST job number key present:", Object.hasOwn(result, MAINTENANCE.jobNumberField),
      "| value:", JSON.stringify(rawJobNumber ?? null),
      "| row_id:", result.row_id
    );

    return res.status(200).json({ success: true, ...(jobNumber ? { ticketRef: jobNumber } : {}) });
  } catch (err) {
    console.error("Agilebase request failed:", err.message);
    return res.status(502).json({ error: "Could not reach the job system" });
  }
}