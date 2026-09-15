import { describe, expect, it } from "vitest";
import {
  NO_CONTRACT_FILTERS,
  contractDisplayState,
  contractListQuery,
  shortId,
} from "~/utils/contractState";

const NOW = 1_700_000_000;

describe("contractDisplayState", () => {
  it("shows an active contract with time left as Active", () => {
    expect(contractDisplayState({ status: "active", exp: NOW + 1 }, NOW)).toBe("active");
  });

  it("shows an active contract past its expiry as Expired, not Active", () => {
    // The case the whole state exists for: the stored status still says
    // active, but the Validator will refuse the token.
    expect(contractDisplayState({ status: "active", exp: NOW - 60 }, NOW)).toBe("expired");
  });

  it("counts the expiry second itself as expired", () => {
    // RFC 7519: not accepted on or after exp — the Clearing House's rule too.
    expect(contractDisplayState({ status: "active", exp: NOW }, NOW)).toBe("expired");
  });

  it("keeps a finished contract finished, even long after its expiry", () => {
    for (const status of ["revoked", "completed", "cancelled"] as const) {
      expect(contractDisplayState({ status, exp: NOW - 86_400 }, NOW)).toBe(status);
      expect(contractDisplayState({ status, exp: NOW + 86_400 }, NOW)).toBe(status);
    }
  });
});

describe("shortId", () => {
  it("shortens a full contract id", () => {
    expect(shortId("9db5f63d-a27a-4af8-b8d6-32dee55eda0d")).toBe("9db5f63d…");
  });

  it("leaves a short id alone", () => {
    expect(shortId("sm-a")).toBe("sm-a");
  });
});

describe("contractListQuery", () => {
  it("asks for page 1 when the table is on its first page", () => {
    // The table counts pages from 0, the API from 1.
    expect(contractListQuery({ ...NO_CONTRACT_FILTERS }, 0, 20)).toEqual({ page: 1, limit: 20 });
    expect(contractListQuery({ ...NO_CONTRACT_FILTERS }, 2, 20)).toEqual({ page: 3, limit: 20 });
  });

  it("sends every filter that is set, and nothing that is not", () => {
    expect(
      contractListQuery(
        { status: "revoked", expiry: "not_expired", consumerId: " dr-bob ", orderId: "" },
        0,
        20,
      ),
    ).toEqual({ page: 1, limit: 20, status: "revoked", expired: "false", consumer_id: "dr-bob" });
  });

  it("maps the expiry choice onto the API's expired flag", () => {
    const q = (expiry: "any" | "expired" | "not_expired") =>
      contractListQuery({ ...NO_CONTRACT_FILTERS, expiry }, 0, 20).expired;
    expect(q("any")).toBeUndefined();
    expect(q("expired")).toBe("true");
    expect(q("not_expired")).toBe("false");
  });

  it("treats a whitespace-only id as no filter", () => {
    expect(
      contractListQuery({ ...NO_CONTRACT_FILTERS, orderId: "   " }, 0, 20),
    ).not.toHaveProperty("order_id");
  });
});
