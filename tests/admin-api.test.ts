import { describe, expect, it } from "vitest";
import { classifyAdminError } from "~/composables/admin/useAdminApi";
import {
  auditEventListSchema,
  contractPageSchema,
} from "~/schemas/admin.schema";

const contract = {
  jti: "9db5f63d-a27a-4af8-b8d6-32dee55eda0d",
  order_id: "order-1002",
  status: "revoked",
  consumer_id: "dr-bob",
  iat: 1_756_000_000,
  exp: 1_756_900_000,
  registered_at: 1_756_000_001,
  status_changed_at: 1_756_000_050,
};

describe("classifyAdminError", () => {
  it("tells apart the failures the page handles differently", () => {
    expect(classifyAdminError(401)).toBe("not_signed_in");
    expect(classifyAdminError(403)).toBe("forbidden");
    expect(classifyAdminError(404)).toBe("not_found");
    expect(classifyAdminError(502)).toBe("unavailable");
    expect(classifyAdminError(503)).toBe("disabled");
  });

  it("files anything else, including no response, as a plain failure", () => {
    expect(classifyAdminError(500)).toBe("failed");
    expect(classifyAdminError(422)).toBe("failed");
    expect(classifyAdminError(undefined)).toBe("failed");
  });
});

describe("contractPageSchema", () => {
  it("accepts a page as the Clearing House returns it", () => {
    const page = { items: [contract], page: 1, limit: 20, total: 1, total_pages: 1 };
    expect(contractPageSchema.safeParse(page).success).toBe(true);
  });

  it("refuses the old cursor-shaped response", () => {
    // What the list looked like before the switch to page numbers. Without
    // this check the page would render "showing 1 to NaN".
    expect(
      contractPageSchema.safeParse({ items: [contract], next_cursor: "WzQ3XQ" }).success,
    ).toBe(false);
  });

  it("refuses a status the page does not know how to show", () => {
    const page = {
      items: [{ ...contract, status: "deleted" }],
      page: 1,
      limit: 20,
      total: 1,
      total_pages: 1,
    };
    expect(contractPageSchema.safeParse(page).success).toBe(false);
  });
});

describe("auditEventListSchema", () => {
  it("accepts a registration, which has no from_status and no actor", () => {
    const history = {
      items: [
        {
          seq: 1,
          event_type: "contract.registered",
          jti: contract.jti,
          order_id: contract.order_id,
          consumer_id: contract.consumer_id,
          actor: null,
          reason: null,
          from_status: null,
          to_status: "active",
          occurred_at: 1_756_000_001,
          detail: "status=active exp=1756900000",
        },
      ],
    };
    expect(auditEventListSchema.safeParse(history).success).toBe(true);
  });
});
