// GET /api/admin/events — the ledger across every contract, newest first.
export default defineEventHandler((event) => {
  requireAdmin(event);
  return clearingHouse.listEvents(getQuery(event));
});
