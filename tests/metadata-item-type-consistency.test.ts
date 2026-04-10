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

  it("detects mismatch when metadata is wrapped in dcat:dataset", () => {
    expect(
      hasMetadataItemTypeMismatch(
        {
          "dcat:dataset": {
            "dcterms:type": { "@id": DCMI_TYPE_SOFTWARE },
          },
        },
        "dataset",
      ),
    ).toBe(true);
  });

  it("detects mismatch when metadata is in @graph dataset node", () => {
    expect(
      hasMetadataItemTypeMismatch(
        {
          "@graph": [
            {
              "@type": "dcat:Dataset",
              "dcterms:type": { "@id": DCMI_TYPE_DATASET },
            },
          ],
        },
        "application",
      ),
    ).toBe(true);
  });

  it("detects mismatch for rich Software payload used as dataset", () => {
    expect(
      hasMetadataItemTypeMismatch(
        {
          "@context": {
            dcat: "http://www.w3.org/ns/dcat#",
            dcterms: "http://purl.org/dc/terms/",
            skos: "http://www.w3.org/2004/02/skos/core#",
          },
          "@type": "dcat:Dataset",
          "dcterms:type": {
            "@id": DCMI_TYPE_SOFTWARE,
            "@type": "skos:Concept",
            "skos:prefLabel": { "@language": "en", "@value": "Software" },
          },
          "dcat:distribution": [
            {
              "@type": "dcat:Distribution",
              "dcat:accessURL": { "@id": "s3://disease_xyz/ecgs/pt1_ecg.xml" },
            },
          ],
        },
        "dataset",
      ),
    ).toBe(true);
  });
});
