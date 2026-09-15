// GET /api/admin/contracts/:jti/history — everything recorded against one
// contract, oldest first, including refused attempts.
export default defineEventHandler((event) => {
  requireAdmin(event);
  const jti = getRouterParam(event, "jti", { decode: true }) ?? "";
  return clearingHouse.getHistory(jti);
});
