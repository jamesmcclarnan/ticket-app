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
