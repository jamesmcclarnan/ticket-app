import {
  AB_WRITE_URLS,
  COMPANY_ID,
  TABLE_ID,
  CATEGORIES,
  FIELD_CODES,
  FILE_FIELD_CODES,
  ATTACHMENT,
  LIMITS
} from "../lib/ticket-config.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, maxLength) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return null;
    }
  }
  return null;
}
function readAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  if (!Object.hasOwn(ATTACHMENT.types, attachment.type)) return null;
  if (typeof attachment.data !== "string" || !attachment.data) return null;

  const typeInfo = ATTACHMENT.types[attachment.type];
  const buffer = Buffer.from(attachment.data, "base64");
  if (buffer.length === 0 || buffer.length > ATTACHMENT.maxBytes) return null;

  const matchesSignature = typeInfo.signature.every((byte, i) => buffer[i] === byte);
  if (!matchesSignature) return null;

  return {
    buffer,
    mimeType: attachment.type,
    filename: `attachment-${Date.now()}.${typeInfo.extension}`
  };
}
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.AB_TICKETS_API_KEY;
  if (!apiKey) {
    console.error("AB_TICKETS_API_KEY is not set");
    return res.status(500).json({ error: "Server is not configured" });
  }

  const body = readBody(req);
  if (!body) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const category = body.category;
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Invalid ticket category" });
  }

  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);
  const dept = clean(body.dept, LIMITS.dept);
  const issueType = clean(body.issueType, LIMITS.issueType);
  const details = clean(body.details, LIMITS.details);

  const checks = [
    [!name, "name", "Please enter your name."],
    [!EMAIL_PATTERN.test(email), "email", "Please enter a valid email address."],
    [!dept, "dept", "Please select a department."],
    [!issueType, "issueType", "Please select an issue type."],
    [details.length < LIMITS.minDetails, "details", "Please add some detail."]
  ];
  const failed = checks.find(([isProblem]) => isProblem);
  if (failed) {
    return res.status(400).json({ error: failed[2], field: failed[1] });
  }

  const isIT = category === "IT";
  const fieldValues = {
    [FIELD_CODES.ticketCategory]: category,
    [FIELD_CODES.name]: name,
    [FIELD_CODES.email]: email,
    [FIELD_CODES.dept]: dept,
    [isIT ? FIELD_CODES.itIssueType : FIELD_CODES.techIssueType]: issueType,
    [isIT ? FIELD_CODES.itDetails : FIELD_CODES.techDetails]: details
  };

  const environment = process.env.AB_ENVIRONMENT === "test" ? "test" : "live";
  const baseParams = {
    c: COMPANY_ID,
    t: TABLE_ID,
    save_new_record: "true",
    ...fieldValues
  };

  let attachment = null;
  if (body.attachment) {
    attachment = readAttachment(body.attachment);
    if (!attachment) {
      return res.status(400).json({ error: "Invalid attachment" });
    }
  }

  let requestUrl = AB_WRITE_URLS[environment];
  let requestBody;
  if (attachment) {
    requestBody = new FormData();
    for (const [key, value] of Object.entries(baseParams)) {
      requestBody.append(key, value);
    }
    requestBody.append(
      FILE_FIELD_CODES[category],
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
      console.error(`Agilebase write failed (${abResponse.status}, ${environment}):`, text.slice(0, 500));
      return res.status(502).json({ error: "Could not save the ticket" });
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("Agilebase returned non-JSON response:", text.slice(0, 500));
      return res.status(502).json({ error: "Could not confirm the ticket was saved" });
    }

    if (!result.row_id) {
      console.error("Agilebase response had no row_id:", JSON.stringify(result).slice(0, 500));
      return res.status(502).json({ error: "Could not confirm the ticket was saved" });
    }

    return res.status(200).json({ success: true, ticketRef: String(result.row_id) });
  } catch (err) {
    console.error("Agilebase request failed:", err.message);
    return res.status(502).json({ error: "Could not reach the ticket system" });
  }
}
