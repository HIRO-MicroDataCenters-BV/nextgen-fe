// POST /api/admin/contracts/:jti/revoke — revoke one contract, permanently.
//
// The browser sends only a reason. Who is revoking comes from requireAdmin(),
// never from the request, so nobody can put another name in the history.
// 409 from the Clearing House, when the contract is no longer active, is
// passed through for the page to explain.
import { revokeRequestSchema } from "~/schemas/admin.schema";

export default defineEventHandler(async (event) => {
  const admin = requireAdmin(event);
  const jti = getRouterParam(event, "jti", { decode: true }) ?? "";

  const body = revokeRequestSchema.safeParse(await readBody(event));
  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "A reason is required, at most 500 characters",
    });
  }

  return clearingHouse.revokeContract(jti, {
    actor: admin.actor,
    reason: body.data.reason,
  });
});
