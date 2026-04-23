import { describe, expect, it } from "vitest";
import { useJsonLdSchema } from "~/components/JsonLdEditor/composables/useJsonLdSchema";

describe("useJsonLdSchema", () => {
  it("keeps release date visible and read-only for dataset context", () => {
    const { datasetSchema } = useJsonLdSchema();
    const issued = datasetSchema["dcterms:issued"];

    expect(issued).toBeDefined();
    expect(issued?.type).toBe("date");
    expect(issued?.readonly).toBe(true);
    expect(issued?.hidden).toBe(false);
  });

  it("keeps technical dspace fields hidden", () => {
    const { datasetSchema } = useJsonLdSchema();

    expect(datasetSchema["dspace:isDeleted"]?.hidden).toBe(true);
    expect(datasetSchema["dspace:isShared"]?.hidden).toBe(true);
    expect(datasetSchema["dspace:metadataFilename"]?.hidden).toBe(true);
    expect(datasetSchema["dspace:region"]?.hidden).toBe(true);
  });
});
