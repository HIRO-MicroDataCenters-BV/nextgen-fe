import { describe, expect, it } from "vitest";
import { updateJsonLdArrayIndices } from "~/components/JsonLdEditor/utils/jsonLdTreeArrayIndices";
import type { JsonLdNode } from "~/components/JsonLdEditor/types/editor.types";

const leaf = (key: string): JsonLdNode => ({
  id: key,
  key,
  type: "string",
  value: "",
  metadata: { required: false, readonly: false, repeatable: false },
});

describe("updateJsonLdArrayIndices", () => {
  it("renames array child keys to [index]", () => {
    const nodes: JsonLdNode[] = [
      {
        id: "arr",
        key: "dcat:distribution",
        type: "array",
        children: [
          {
            id: "0",
            key: "[9]",
            type: "object",
            children: [leaf("dcat:accessURL")],
            metadata: { required: false, readonly: false, repeatable: false },
          },
        ],
        metadata: { required: false, readonly: false, repeatable: false },
      },
    ];

    const result = updateJsonLdArrayIndices(nodes);
    const firstChild = result[0]?.children?.[0];
    expect(firstChild?.key).toBe("[0]");
  });

  it("returns same reference when nothing changed", () => {
    const nodes: JsonLdNode[] = [leaf("dcterms:title")];
    expect(updateJsonLdArrayIndices(nodes)).toBe(nodes);
  });
});
