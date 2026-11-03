import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTRACT_SORT,
  NO_CONTRACT_FILTERS,
  ariaSort,
  canRevoke,
  contractDisplayState,
  contractListQuery,
  nextContractSort,
  shortId,
} from "~/utils/contractState";

const NEWEST_FIRST = { ...DEFAULT_CONTRACT_SORT };

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

describe("canRevoke", () => {
  it("offers revoking only while a contract is active", () => {
    // The Clearing House's rule: every other status is final.
    expect(canRevoke({ status: "active" })).toBe(true);
    for (const status of ["revoked", "completed", "cancelled"] as const) {
      expect(canRevoke({ status })).toBe(false);
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
    expect(contractListQuery({ ...NO_CONTRACT_FILTERS }, NEWEST_FIRST, 0, 20)).toMatchObject({
      page: 1,
      limit: 20,
    });
    expect(contractListQuery({ ...NO_CONTRACT_FILTERS }, NEWEST_FIRST, 2, 20)).toMatchObject({
      page: 3,
      limit: 20,
    });
  });

  it("sends every filter that is set, and nothing that is not", () => {
    expect(
      contractListQuery(
        { status: "revoked", expiry: "not_expired", consumerId: " dr-bob ", orderId: "" },
        NEWEST_FIRST,
        0,
        20,
      ),
    ).toEqual({
      page: 1,
      limit: 20,
      sort: "registered_at",
      direction: "desc",
      status: "revoked",
      expired: "false",
      consumer_id: "dr-bob",
    });
  });

  it("always sends the sort, even the default one", () => {
    // So the header's arrow cannot drift from the order the rows are in if
    // the Clearing House's default ever changes.
    expect(contractListQuery({ ...NO_CONTRACT_FILTERS }, NEWEST_FIRST, 0, 20)).toEqual({
      page: 1,
      limit: 20,
      sort: "registered_at",
      direction: "desc",
    });
    expect(
      contractListQuery({ ...NO_CONTRACT_FILTERS }, { column: "exp", direction: "asc" }, 0, 20),
    ).toMatchObject({ sort: "exp", direction: "asc" });
  });

  it("maps the expiry choice onto the API's expired flag", () => {
    const q = (expiry: "any" | "expired" | "not_expired") =>
      contractListQuery({ ...NO_CONTRACT_FILTERS, expiry }, NEWEST_FIRST, 0, 20).expired;
    expect(q("any")).toBeUndefined();
    expect(q("expired")).toBe("true");
    expect(q("not_expired")).toBe("false");
  });

  it("treats a whitespace-only id as no filter", () => {
    expect(
      contractListQuery({ ...NO_CONTRACT_FILTERS, orderId: "   " }, NEWEST_FIRST, 0, 20),
    ).not.toHaveProperty("order_id");
  });
});

describe("nextContractSort", () => {
  it("starts newest first, by registration", () => {
    expect(DEFAULT_CONTRACT_SORT).toEqual({ column: "registered_at", direction: "desc" });
  });

  it("flips the direction when the sorted column is clicked again", () => {
    const once = nextContractSort(NEWEST_FIRST, "registered_at");
    expect(once).toEqual({ column: "registered_at", direction: "asc" });
    expect(nextContractSort(once, "registered_at")).toEqual(NEWEST_FIRST);
  });

  it("starts another column descending, whatever the current direction", () => {
    for (const direction of ["asc", "desc"] as const) {
      expect(nextContractSort({ column: "registered_at", direction }, "exp")).toEqual({
        column: "exp",
        direction: "desc",
      });
    }
  });

  it("does not change the sort it was given", () => {
    const current = { column: "exp", direction: "desc" } as const;
    nextContractSort(current, "exp");
    expect(current).toEqual({ column: "exp", direction: "desc" });
  });
});

describe("ariaSort", () => {
  it("names the direction on the sorted column only", () => {
    const byExpiry = { column: "exp", direction: "asc" } as const;
    expect(ariaSort(byExpiry, "exp")).toBe("ascending");
    expect(ariaSort(byExpiry, "registered_at")).toBe("none");
    expect(ariaSort(NEWEST_FIRST, "registered_at")).toBe("descending");
  });
});
