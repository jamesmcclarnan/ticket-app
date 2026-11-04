export const AB_WRITE_URLS = {
  live: "https://lewispies.agilebase.co.uk/agileBase/Public.ab",
  test: "https://lewispiestest.agilebase.co.uk/agileBase/Public.ab"
};

export const COMPANY_ID = "au3jrplsufkk4lb5b";
export const TABLE_ID = "i2_it_support_tickets";

export const CATEGORIES = ["IT", "Technical"];

export const FIELD_CODES = {
  ticketCategory: "ticket_category_tt",
  name: "name_1",
  email: "email_address_1",
  dept: "dept",
  itIssueType: "issue_type",
  itDetails: "details_0",
  techIssueType: "technical_issue_type_r8",
  techDetails: "technical_details_af"
};

export const LIMITS = {
  name: 100,
  email: 150,
  dept: 100,
  issueType: 100,
  details: 1000,
  minDetails: 3
};

export const FILE_FIELD_CODES = {
  IT: "file_0",
  Technical: "technical_link_to_file_db"
};

export const ATTACHMENT = {
  maxBytes: 3 * 1024 * 1024,
  types: {
    "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
    "application/pdf": { extension: "pdf", signature: [0x25, 0x50, 0x44, 0x46, 0x2d] }
  }
};

export const FORMS = {
  it: { category: "IT", table: TABLE_ID, apiKeyEnv: "AB_TICKETS_API_KEY", fileField: "file_0" },
  technical: { category: "Technical", table: TABLE_ID, apiKeyEnv: "AB_TICKETS_API_KEY", fileField: "technical_link_to_file_db" }
};

// Unset or empty means the current live behaviour. Unknown names are ignored,
// so a typo can never switch on a form that does not exist.
export const DEFAULT_ENABLED_FORMS = ["it", "technical"];

export function getEnabledForms(raw) {
  if (typeof raw !== "string" || raw.trim() === "") return DEFAULT_ENABLED_FORMS;
  const names = raw
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter((n) => Object.hasOwn(FORMS, n));
  return names;
}

export const MAINTENANCE = {
  table: "wtgfigtxbdo80ethq",
  apiKeyEnv: "AB_MAINTENANCE_API_KEY",
  fieldCodes: {
    issue: "jwpdj7lzf73oktvto",
    area: "zzrqtnyv8onftilbj",
    requestedBy: "requestedby_wtgfigtxbdo80ethq",
    site: "ftxzrgclewhosp6jz",
    source: "source_w3hwrqbs5e88vtxz",
    dateRaised: "dateraised_sfutfee4ckric0ff"
  },
  fileField: "w6bzekugc8xw7vctq",
  sourceValue: "Ticket App",
  sites: ["Lewis Pies", "The Lewis Bakery"],
  limits: { issue: 1000, minIssue: 3, area: 100, requestedBy: 100 }
};

FORMS.maintenance = {
  table: MAINTENANCE.table,
  apiKeyEnv: MAINTENANCE.apiKeyEnv,
  fileField: MAINTENANCE.fileField
};