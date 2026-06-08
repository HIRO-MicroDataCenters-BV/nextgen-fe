import { describe, expect, it } from "vitest";
import { applyJsonLdCodeUpdate } from "~/components/JsonLdEditor/utils/jsonLdCodeUpdate";

describe("applyJsonLdCodeUpdate", () => {
  it("re-injects dspace:extraMetadata on valid JSON", () => {
    const extra = [{ key: "foo", value: true }];
    const result = applyJsonLdCodeUpdate('{"dcterms:title":"x"}', extra);

    expect(result.modelValue).toMatchObject({
      "dcterms:title": "x",
      "dspace:extraMetadata": extra,
    });
    expect(result.codeData).toContain("dspace:extraMetadata");
  });

  it("passes through invalid JSON as raw string", () => {
    const result = applyJsonLdCodeUpdate("{not json", null);
    expect(result.modelValue).toBe("{not json");
    expect(result.codeData).toBe("{not json");
  });
});
