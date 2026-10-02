// api/proxy.js
//
// This is a placeholder. No AB (Agilebase) integration has been wired up yet —
// the form in index.html does not currently call this endpoint.
//
// When ready, this should follow the same pattern as the stock take app's proxy:
//   - Read the AB table ID and API key from environment variables (set in
//     Vercel's project settings, never committed to this file or the repo)
//   - Accept the ticket form payload from the frontend (POST)
//   - Forward it to the Agilebase API with the correct table/field codes
//   - Return a clean success/failure response the frontend can act on
//
// Suggested env vars (set these in Vercel -> Settings -> Environment Variables,
// not in this file):
//   AB_TICKETS_TABLE_ID
//   AB_TICKETS_API_KEY
//
// Example shape (uncomment and adapt once table/field codes are confirmed):
//
// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }
//
//   try {
//     const payload = req.body;
//
//     // TODO: map payload fields to AB field codes once confirmed
//     // TODO: call Agilebase API using AB_TICKETS_TABLE_ID / AB_TICKETS_API_KEY
//     // TODO: include an idempotency token from the frontend to guard against
//     //       duplicate submissions (see notes in README.md)
//
//     return res.status(200).json({ success: true });
//   } catch (err) {
//     console.error('Ticket submission failed:', err);
//     return res.status(500).json({ error: 'Submission failed' });
//   }
// }

export default async function handler(req, res) {
  return res.status(501).json({ error: 'Not implemented yet' });
}
