import { getEnabledForms } from "../lib/ticket-config.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ forms: getEnabledForms(process.env.ENABLED_FORMS) });
}

FORMS.maintenance = {
  table: MAINTENANCE.table,
  apiKeyEnv: MAINTENANCE.apiKeyEnv,
  fileField: MAINTENANCE.fileField
};