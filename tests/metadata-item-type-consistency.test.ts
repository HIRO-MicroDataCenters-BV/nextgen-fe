import { describe, expect, it } from "vitest";
import {
  DCMI_TYPE_DATASET,
  DCMI_TYPE_SOFTWARE,
  hasMetadataItemTypeMismatch,
} from "~/utils/metadataItemTypeConsistency";

describe("metadataItemTypeConsistency", () => {
  it("flags dataset item_type with Software dcterms:type", () => {
    expect(
      hasMetadataItemTypeMismatch(
        {
          "dcterms:type": { "@id": DCMI_TYPE_SOFTWARE },
        },
        "dataset",
      ),
    ).toBe(true);
  });

  it("flags application item_type with Dataset dcterms:type", () => {
    expect(
      hasMetadataItemTypeMismatch(
        {
          "dcterms:type": { "@id": DCMI_TYPE_DATASET },
        },
        "application",
      ),
    ).toBe(true);
  });

  it("allows dataset + Dataset IRI", () => {
    expect(
      hasMetadataItemTypeMismatch(
        {
          "dcterms:type": { "@id": DCMI_TYPE_DATASET },
        },
        "dataset",
      ),
    ).toBe(false);
  });

  it("allows application + Software IRI", () => {
    expect(
      hasMetadataItemTypeMismatch(
        {
          "dcterms:type": { "@id": DCMI_TYPE_SOFTWARE },
        },
        "application",
      ),
    ).toBe(false);
  });

  it("ignores missing dcterms:type", () => {
    expect(hasMetadataItemTypeMismatch({ "dcterms:title": "x" }, "dataset")).toBe(
      false,
    );
  });

  it("parses JSON string metadata", () => {
    const json = JSON.stringify({
      "dcterms:type": { "@id": DCMI_TYPE_SOFTWARE },
    });
    expect(hasMetadataItemTypeMismatch(json, "dataset")).toBe(true);
  });
});
