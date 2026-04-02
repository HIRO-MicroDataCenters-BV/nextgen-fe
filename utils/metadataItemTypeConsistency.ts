/** Canonical DCMI type IRIs used with Item Type (dataset | application). */
export const DCMI_TYPE_DATASET = "http://purl.org/dc/dcmitype/Dataset";
export const DCMI_TYPE_SOFTWARE = "http://purl.org/dc/dcmitype/Software";

export type DctermsTypeCategory = "dataset" | "software" | "other";

/** Map dcterms:type @id to dataset / software / other (same rules as JsonLd validation). */
export function categorizeDctermsTypeId(id: string): DctermsTypeCategory {
  const t = id.trim();
  if (
    t === DCMI_TYPE_DATASET ||
    t.endsWith("#Dataset") ||
    t.endsWith("/Dataset")
  ) {
    return "dataset";
  }
  if (
    t === DCMI_TYPE_SOFTWARE ||
    t.endsWith("#Software") ||
    t.endsWith("/Software")
  ) {
    return "software";
  }
  return "other";
}

/** Read dcterms:type.@id from a metadata object (parsed JSON-LD root). */
export function getDctermsTypeIdFromMetadataObject(
  obj: Record<string, unknown> | null | undefined,
): string | null {
  if (!obj) return null;
  const typeVal = obj["dcterms:type"];
  if (!typeVal || typeof typeVal !== "object" || Array.isArray(typeVal)) {
    return null;
  }
  const id = (typeVal as Record<string, unknown>)["@id"];
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

/**
 * Resolve metadata field value (object or JSON string) to a root object, or null.
 */
export function metadataContentToObject(
  metadata: unknown,
): Record<string, unknown> | null {
  if (!metadata) return null;
  if (typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  if (typeof metadata !== "string") return null;
  const s = metadata.trim();
  if (!s) return null;
  try {
    const parsed = JSON.parse(s) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* invalid JSON — caller skips item-type check */
  }
  return null;
}

/**
 * True when Item Type disagrees with dcterms:type @id (Dataset vs Software).
 * Missing or unparseable dcterms:type → false (no UI error; same as validateTree).
 */
export function hasMetadataItemTypeMismatch(
  metadata: unknown,
  itemType: string | undefined,
): boolean {
  if (!itemType) return false;
  const root = metadataContentToObject(metadata);
  if (!root) return false;
  const id = getDctermsTypeIdFromMetadataObject(root);
  if (!id) return false;
  const cat = categorizeDctermsTypeId(id);
  if (cat === "other") return false;
  const expectDataset = itemType === "dataset";
  if (expectDataset && cat === "software") return true;
  if (!expectDataset && itemType === "application" && cat === "dataset") {
    return true;
  }
  return false;
}

/**
 * For JsonLd tree: read dcterms:type → @id child value.
 */
export function getDctermsTypeIdFromTreeNodes(
  nodes: Array<{ key: string; children?: Array<{ key: string; value?: unknown }> }>,
): string | null {
  const typeNode = nodes.find((n) => n.key === "dcterms:type");
  if (!typeNode?.children) return null;
  const idNode = typeNode.children.find((c) => c.key === "@id");
  if (idNode?.value === undefined || idNode.value === null) return null;
  const s = String(idNode.value).trim();
  return s || null;
}

export function hasItemTypeMismatchForDctermsId(
  dctermsTypeId: string | null,
  itemType: string | undefined,
): boolean {
  if (!itemType || !dctermsTypeId) return false;
  const cat = categorizeDctermsTypeId(dctermsTypeId);
  if (cat === "other") return false;
  const expectDataset = itemType === "dataset";
  if (expectDataset && cat === "software") return true;
  if (!expectDataset && itemType === "application" && cat === "dataset") {
    return true;
  }
  return false;
}
