import { describe, expect, it } from "vitest";
import { useJsonLdTransform } from "~/components/JsonLdEditor/composables/useJsonLdTransform";

describe("useJsonLdTransform", () => {
  it("preserves semantic fields after parse/serialize roundtrip", () => {
    const { parseJsonLd, serializeJsonLd } = useJsonLdTransform({
      idFactory: (() => {
        let i = 0;
        return () => `node_${++i}`;
      })(),
    });

    const payload = {
      "@context": {
        dcat: "http://www.w3.org/ns/dcat#",
        dcterms: "http://purl.org/dc/terms/",
      },
      "@type": "dcat:Dataset",
      "dcterms:title": { "@language": "en", "@value": "Dataset" },
    };

    const parsed = parseJsonLd(payload);
    const serialized = serializeJsonLd(parsed.tree, payload["@context"], "object") as Record<
      string,
      unknown
    >;

    expect(serialized["@type"]).toBe("dcat:Dataset");
    expect((serialized["dcterms:title"] as { "@value": string })["@value"]).toBe(
      "Dataset",
    );
  });
});
