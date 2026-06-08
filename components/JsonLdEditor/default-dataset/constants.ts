/** Same top-level keys as repo `metadata.json` (DCAT body shape for create flow). */
export const MINIMAL_DEFAULT_DATASET_KEYS = [
  "dcterms:identifier",
  "dcterms:title",
  "dcterms:description",
  "dcterms:type",
  "dcat:keyword",
  "dcterms:license",
  "dcat:theme",
  "dcat:distribution",
] as const;
