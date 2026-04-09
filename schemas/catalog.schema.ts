import { z } from "zod";

const jsonLdObjectSchema = z.object({}).passthrough();

export const catalogDatasetSchema = jsonLdObjectSchema.refine(
  (obj) => Object.keys(obj).length > 0,
  { message: "Catalog dataset payload is empty" }
);

export const catalogSearchResponseSchema = jsonLdObjectSchema.refine(
  (obj) => {
    // Accept either graph payload or direct catalog payload.
    if ("@graph" in obj || "dcat:dataset" in obj) return true;
    // Some servers return a direct dataset object for filtered lookups.
    return obj["@type"] === "dcat:Dataset";
  },
  { message: "Unexpected catalog search response shape" }
);

export type CatalogDatasetValidated = z.output<typeof catalogDatasetSchema>;
export type CatalogSearchResponseValidated = z.output<
  typeof catalogSearchResponseSchema
>;
