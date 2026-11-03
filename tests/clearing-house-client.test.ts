import { describe, expect, it } from "vitest";
import {
  CONTRACT_LIST_PARAMS,
  EVENT_LIST_PARAMS,
  isSafeJti,
  pickParams,
} from "~/utils/clearingHouseParams";

describe("pickParams", () => {
  it("forwards only the parameters the endpoint understands", () => {
    // `cursor` was the Clearing House's old paging parameter; it must not leak
    // through, and neither should anything else a caller invents — `order`
    // included, which reads like a sort direction but is not the API's name.
    expect(
      pickParams(
        { status: "revoked", page: 2, cursor: "WzQ3XQ", order: "asc", admin: "1" },
        CONTRACT_LIST_PARAMS,
      ),
    ).toEqual({ status: "revoked", page: "2" });
  });

  it("forwards the sort column and direction", () => {
    // Values are the Clearing House's to check: an unknown sort comes back
    // as its 422, not silently as the default order.
    expect(
      pickParams({ sort: "exp", direction: "asc" }, CONTRACT_LIST_PARAMS),
    ).toEqual({ sort: "exp", direction: "asc" });
  });

  it("takes the first value of a repeated parameter", () => {
    expect(
      pickParams({ status: ["revoked", "active"] }, CONTRACT_LIST_PARAMS),
    ).toEqual({ status: "revoked" });
  });

  it("drops empty values rather than forwarding status=", () => {
    expect(
      pickParams({ status: "", order_id: null, consumer_id: undefined }, CONTRACT_LIST_PARAMS),
    ).toEqual({});
  });

  it("turns booleans and numbers into query strings", () => {
    expect(
      pickParams({ expired: false, limit: 50 }, CONTRACT_LIST_PARAMS),
    ).toEqual({ expired: "false", limit: "50" });
  });

  it("lets the feed filter by actor and time window", () => {
    expect(
      pickParams(
        { actor: "dev-allowlist:admin@example.org", since: 100, until: 200 },
        EVENT_LIST_PARAMS,
      ),
    ).toEqual({
      actor: "dev-allowlist:admin@example.org",
      since: "100",
      until: "200",
    });
  });
});

describe("isSafeJti", () => {
  it("accepts real contract ids and the short ids used in tests", () => {
    for (const jti of [
      "9db5f63d-a27a-4af8-b8d6-32dee55eda0d",
      "sm-a",
      "t1757500000-reg",
      "urn:uuid:9db5f63d",
      "x".repeat(64),
    ]) {
      expect(isSafeJti(jti), jti).toBe(true);
    }
  });

  it("refuses anything that could reach a different upstream route", () => {
    // The Clearing House decodes %2F before routing, so these would otherwise
    // land on the status or history endpoints, whatever the caller meant.
    for (const jti of [
      "../status",
      "x/history",
      "..",
      ".hidden",
      "a b",
      "x?limit=1",
      "x#y",
      "",
      "x".repeat(65),
    ]) {
      expect(isSafeJti(jti), jti).toBe(false);
    }
  });
});
