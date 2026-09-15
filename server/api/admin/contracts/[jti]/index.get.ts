// GET /api/admin/contracts/:jti — one contract's current state.
export default defineEventHandler((event) => {
  requireAdmin(event);
  const jti = getRouterParam(event, "jti", { decode: true }) ?? "";
  return clearingHouse.getContract(jti);
});
