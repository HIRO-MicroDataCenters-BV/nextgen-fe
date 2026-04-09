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
  if (!typeVal) return null;

  if (typeof typeVal === "string" && typeVal.trim()) {
    return typeVal.trim();
  }

  if (Array.isArray(typeVal)) {
    for (const entry of typeVal) {
      if (typeof entry === "string" && entry.trim()) return entry.trim();
      if (entry && typeof entry === "object") {
        const id = (entry as Record<string, unknown>)["@id"];
        if (typeof id === "string" && id.trim()) return id.trim();
      }
    }
    return null;
  }

  if (typeof typeVal !== "object") {
    return null;
  }

  const id = (typeVal as Record<string, unknown>)["@id"];
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function findDatasetObject(
  root: Record<string, unknown>,
): Record<string, unknown> | null {
  const dcatDataset = root["dcat:dataset"];
  if (dcatDataset && typeof dcatDataset === "object") {
    if (Array.isArray(dcatDataset)) {
      const first = dcatDataset.find(
        (entry) => entry && typeof entry === "object",
      );
      if (first && typeof first === "object") {
        return first as Record<string, unknown>;
      }
    } else {
      return dcatDataset as Record<string, unknown>;
    }
  }

  const graph = root["@graph"];
  if (Array.isArray(graph)) {
    const datasetFromGraph = graph.find((entry) => {
      if (!entry || typeof entry !== "object") return false;
      const record = entry as Record<string, unknown>;
      return (
        record["@type"] === "dcat:Dataset" ||
        (Array.isArray(record["@type"]) &&
          record["@type"].some((t) => String(t) === "dcat:Dataset"))
      );
    });
    if (datasetFromGraph && typeof datasetFromGraph === "object") {
      return datasetFromGraph as Record<string, unknown>;
    }
  }

  return null;
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

  // Metadata can be either a dataset object or a wrapper with dcat:dataset / @graph.
  const target = findDatasetObject(root) ?? root;
  const id = getDctermsTypeIdFromMetadataObject(target);
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
