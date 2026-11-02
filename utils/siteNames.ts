/**
 * Display names per site (biobank). A site's catalog is `<code>_catalog` (the
 * `catalogName` config, e.g. `hus_catalog`); search results carry the bare code
 * (`hus`) as the catalog title. Both forms are accepted.
 */
const SITE_SHORT_NAMES: Record<string, string> = {
  umcu: "UMCU",
  ki: "KI",
  hus: "HUS",
  uva: "UVA",
  tum: "TUM",
};

const SITE_FULL_NAMES: Record<string, string> = {
  umcu: "Athero-Express Biobank Study",
  ki: "Kliniek Informatie",
  hus: "Hospital Information System",
  uva: "University of Amsterdam",
  tum: "Technical University of Munich",
};

const siteKey = (codeOrCatalog: string) =>
  codeOrCatalog.trim().toLowerCase().replace(/_catalog$/, "");

/** "hus" or "hus_catalog" → "HUS"; an unknown site is shown upper-cased. */
export const siteShortName = (codeOrCatalog: string) =>
  SITE_SHORT_NAMES[siteKey(codeOrCatalog)] ?? codeOrCatalog.trim().toUpperCase();

/** "hus" or "hus_catalog" → "Hospital Information System"; "" when unknown. */
export const siteFullName = (codeOrCatalog: string) =>
  SITE_FULL_NAMES[siteKey(codeOrCatalog)] ?? "";
