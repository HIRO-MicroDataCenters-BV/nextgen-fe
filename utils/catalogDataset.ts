/**
 * Shared helpers for introspecting a dataset JSON-LD object.
 * Used by the catalog edit page and the share/unshare toggle so both derive
 * the save filename, related data product, and item type identically.
 */

/** Resolve related data product directory from dcat:inSeries (title or file:// @id). */
export const relatedProductFromInSeries = (inSeries: unknown): string | null => {
  if (!inSeries || typeof inSeries !== "object") return null;
  const o = inSeries as Record<string, unknown>;

  const literalTitle = (title: unknown): string | null => {
    if (typeof title === "string" && title.trim()) return title.trim();
    if (Array.isArray(title)) {
      for (const item of title) {
        const s = literalTitle(item);
        if (s) return s;
      }
      return null;
    }
    if (title && typeof title === "object" && "@value" in title) {
      const v = (title as { "@value": unknown })["@value"];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return null;
  };

  const fromTitle = literalTitle(o["dcterms:title"]);
  if (fromTitle) return fromTitle;

  const id = o["@id"];
  if (typeof id === "string" && id.startsWith("file://")) {
    const path = id.replace(/^file:\/\//, "").replace(/^\/*/, "");
    const parts = path.split("/").filter(Boolean);
    if (parts.length) return parts[parts.length - 1] ?? null;
  }
  return null;
};

export const extractRelatedDataProduct = (
  dataset: Record<string, unknown>,
): string | null => {
  let relatedDataProductValue: string | null = null;
  const inSeries = dataset["dcat:inSeries"];

  if (inSeries && typeof inSeries === "object") {
    relatedDataProductValue = relatedProductFromInSeries(inSeries);
  }

  if (relatedDataProductValue) return relatedDataProductValue;

  // Fallback: extract from dcat:distribution[0].dcat:accessURL
  const distributions = dataset["dcat:distribution"];
  if (!distributions) return null;

  const distArray = Array.isArray(distributions)
    ? distributions
    : [distributions];
  if (distArray.length === 0) return null;

  const firstDist = distArray[0] as Record<string, unknown>;
  const accessURL = firstDist["dcat:accessURL"];

  let accessURLString: string | null = null;
  if (typeof accessURL === "string") {
    accessURLString = accessURL;
  } else if (
    typeof accessURL === "object" &&
    accessURL !== null &&
    "@id" in accessURL
  ) {
    accessURLString = (accessURL as { "@id": string })["@id"];
  }

  if (!accessURLString || !accessURLString.startsWith("file://")) return null;

  const pathWithoutProtocol = accessURLString.replace(/^file:\/\//, "");
  const pathParts = pathWithoutProtocol.split("/");
  if (pathParts.length > 0 && pathParts[0]) return pathParts[0];

  return null;
};

export const detectDatasetType = (
  dataset: Record<string, unknown>,
): "dataset" | "application" => {
  const dctermsType = dataset["dcterms:type"];
  if (!dctermsType) return "dataset";

  let typeId: string | undefined;
  if (typeof dctermsType === "string") {
    typeId = dctermsType;
  } else if (Array.isArray(dctermsType)) {
    const firstType = dctermsType[0];
    if (firstType && typeof firstType === "object" && "@id" in firstType) {
      typeId = (firstType as Record<string, unknown>)["@id"] as string;
    }
  } else if (typeof dctermsType === "object" && "@id" in dctermsType) {
    typeId = (dctermsType as Record<string, unknown>)["@id"] as string;
  }

  if (typeId === "http://purl.org/dc/dcmitype/Software") {
    return "application";
  }

  return "dataset";
};

export const extractMetadataFilename = (
  dataset: Record<string, unknown>,
): string | null => {
  const metadataFilename = dataset["dspace:metadataFilename"];
  if (!metadataFilename) return null;

  if (typeof metadataFilename === "object" && "@value" in metadataFilename) {
    return (metadataFilename as { "@value": string })["@value"];
  }

  if (typeof metadataFilename === "string") {
    return metadataFilename;
  }

  return null;
};
