import { describe, expect, it } from "vitest";
import { describeEvent, splitActor } from "~/utils/auditEvent";

const ev = (event_type: string, from_status: string | null, to_status: string | null) =>
  ({ event_type, from_status, to_status }) as Parameters<typeof describeEvent>[0];

describe("describeEvent", () => {
  it("shows a registration quietly", () => {
    expect(describeEvent(ev("contract.registered", null, "active"))).toMatchObject({
      kind: "registered",
      tone: "neutral",
    });
  });

  it("makes a revocation the loud change, and the ordinary endings quiet", () => {
    expect(describeEvent(ev("contract.status_changed", "active", "revoked")).tone).toBe("danger");
    expect(describeEvent(ev("contract.status_changed", "active", "completed")).tone).toBe("neutral");
    expect(describeEvent(ev("contract.status_changed", "active", "cancelled")).tone).toBe("neutral");
  });

  it("highlights a refused attempt, and keeps what was attempted", () => {
    expect(
      describeEvent(ev("contract.status_change_rejected", "revoked", "active")),
    ).toMatchObject({ kind: "refused", tone: "warning", from: "revoked", to: "active" });
  });

  it("still shows an event kind it does not know yet", () => {
    // data.accessed is planned; it must appear in the history, not vanish.
    expect(describeEvent(ev("data.accessed", null, null))).toMatchObject({
      kind: "other",
      tone: "neutral",
    });
  });
});

describe("splitActor", () => {
  it("separates how someone was identified from who they are", () => {
    expect(splitActor("dev-allowlist:admin@example.org")).toEqual({
      source: "dev-allowlist",
      identity: "admin@example.org",
    });
  });

  it("splits on the first colon only", () => {
    expect(splitActor("dex:user:with:colons")).toEqual({
      source: "dex",
      identity: "user:with:colons",
    });
  });

  it("is null when nobody was recorded", () => {
    expect(splitActor(null)).toBeNull();
  });

  it("shows a source-less actor as it is, rather than hiding it", () => {
    expect(splitActor("rahul")).toEqual({ source: "", identity: "rahul" });
  });
});
