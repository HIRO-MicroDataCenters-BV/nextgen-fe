// GET /api/admin/contracts — the contract list, paged and filtered.
export default defineEventHandler((event) => {
  requireAdmin(event);
  return clearingHouse.listContracts(getQuery(event));
});
