import { jsonLdValueToPlainString, normalizeDctermsLanguageLiteral } from "./jsonld-values";

/** @context for registration API (no vcard prefix — vcard:* keys are expanded to full IRIs). */
const REGISTRATION_JSONLD_CONTEXT: Record<string, string> = {
  dspace: "http://data-space.org/",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  dcat: "http://www.w3.org/ns/dcat#",
  dcatap: "http://data.europa.eu/r5r/",
  dcterms: "http://purl.org/dc/terms/",
  spdx: "http://spdx.org/rdf/terms#",
  foaf: "http://xmlns.com/foaf/0.1/",
  skos: "http://www.w3.org/2004/02/skos/core#",
};

const VCARD_PREFIX = "vcard:";
const VCARD_NS = "http://www.w3.org/2006/vcard/ns#";

/** Expand compact vcard:* keys so @context does not need the vcard prefix. */
function expandVcardPrefixedKeys<T>(node: T): T {
  if (!node || typeof node !== "object") return node;
  if (Array.isArray(node)) {
    return node.map((item) => expandVcardPrefixedKeys(item)) as unknown as T;
  }
  const o = node as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    const keyOut = k.startsWith(VCARD_PREFIX)
      ? `${VCARD_NS}${k.slice(VCARD_PREFIX.length)}`
      : k;
    next[keyOut] =
      v && typeof v === "object" ? expandVcardPrefixedKeys(v) : v;
  }
  return next as unknown as T;
}

const SPDX_ALGO_LEGACY_TO_CANONICAL: Record<string, string> = {
  "http://spdx.org/rdf/terms#checksumAlgorithm_sha256":
    "http://spdx.org/rdf/terms#SHA256",
  "http://spdx.org/rdf/terms#checksumAlgorithm_sha512":
    "http://spdx.org/rdf/terms#SHA512",
  "http://spdx.org/rdf/terms#checksumAlgorithm_sha1":
    "http://spdx.org/rdf/terms#SHA1",
  "http://spdx.org/rdf/terms#checksumAlgorithm_md5":
    "http://spdx.org/rdf/terms#MD5",
};

/** Normalize SPDX checksum algorithm @id to canonical fragment form (e.g. #SHA256). */
function normalizeSpdxAlgorithmIds(node: unknown): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) normalizeSpdxAlgorithmIds(item);
    return;
  }
  const o = node as Record<string, unknown>;
  const checksum = o["spdx:checksum"];
  if (checksum && typeof checksum === "object" && !Array.isArray(checksum)) {
    const c = checksum as Record<string, unknown>;
    const algo = c["spdx:algorithm"];
    if (typeof algo === "string") {
      const canon = SPDX_ALGO_LEGACY_TO_CANONICAL[algo] ?? algo;
      c["spdx:algorithm"] = {
        "@id": canon,
        "@type": "spdx:ChecksumAlgorithm",
      };
    } else if (algo && typeof algo === "object" && "@id" in algo) {
      const id = String((algo as Record<string, unknown>)["@id"]);
      const canon = SPDX_ALGO_LEGACY_TO_CANONICAL[id] ?? id;
      c["spdx:algorithm"] = {
        ...(algo as Record<string, unknown>),
        "@id": canon,
        "@type":
          (algo as Record<string, unknown>)["@type"] ?? "spdx:ChecksumAlgorithm",
      };
    }
  }
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") normalizeSpdxAlgorithmIds(v);
  }
}

/**
 * Create JSON-LD dataset structure for saveDataset API
 * @param formData - Form values
 * @param filename - Filename of uploaded file
 * @returns JSON-LD dataset object as string
 */
/** Deep-clone to plain JSON data (strips Vue proxies / non-JSON values) for stable API payloads. */
function jsonLdMetadataToPlainObject(
  value: Record<string, unknown>
): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function createDatasetJsonLd(
  formData: Record<string, unknown>,
  filename: string
): string {
  const context = REGISTRATION_JSONLD_CONTEXT;

  const datasetId = `https://example.com/dataset/${filename.replace(
    /[^A-Za-z0-9_-]/g,
    "-"
  )}`;

  let parsedMetadataContent: Record<string, unknown> | null = null;
  if (formData.metadata_content) {
    if (typeof formData.metadata_content === "object") {
      parsedMetadataContent = jsonLdMetadataToPlainObject(
        formData.metadata_content as Record<string, unknown>
      );
    } else if (typeof formData.metadata_content === "string") {
      try {
        const parsed = JSON.parse(formData.metadata_content);
        if (parsed && typeof parsed === "object") {
          parsedMetadataContent = parsed as Record<string, unknown>;
        }
      } catch {
        void 0;
      }
    }
  }

  const baseDataset: Record<string, unknown> = parsedMetadataContent
    ? { ...parsedMetadataContent }
    : {
      "@context": context,
      "@id": datasetId,
      "@type": "dcat:Dataset",
    };

  if (!baseDataset["@context"]) {
    baseDataset["@context"] = { ...context };
  } else if (parsedMetadataContent && parsedMetadataContent["@context"]) {
    baseDataset["@context"] = {
      ...(parsedMetadataContent["@context"] as Record<string, string>),
    };
  }

  if (!baseDataset["@id"]) {
    baseDataset["@id"] = datasetId;
  }

  const normalizeLanguageValue = (
    value: unknown
  ):
    | Array<{ "@language": string; "@value": string }>
    | { "@language": string; "@value": string } => {
    if (Array.isArray(value)) {
      const normalized = value.map((item) => {
        if (typeof item === "object" && item !== null) {
          const o = item as Record<string, unknown>;
          if ("@language" in o && "@value" in o) {
            return {
              "@language": String(o["@language"]),
              "@value": jsonLdValueToPlainString(o["@value"]),
            };
          }
          if ("@value" in o) {
            return {
              "@language": "en",
              "@value": jsonLdValueToPlainString(o["@value"]),
            };
          }
        }
        if (typeof item === "string") {
          return { "@language": "en", "@value": item };
        }
        return {
          "@language": "en",
          "@value": jsonLdValueToPlainString(item),
        };
      });
      if (normalized.length === 1) {
        return normalized[0] ?? { "@language": "en", "@value": "" };
      }
      return normalized;
    }
    if (typeof value === "object" && value !== null) {
      const o = value as Record<string, unknown>;
      if ("@language" in o && "@value" in o) {
        return {
          "@language": String(o["@language"]),
          "@value": jsonLdValueToPlainString(o["@value"]),
        };
      }
      if ("@value" in o) {
        return {
          "@language": "en",
          "@value": jsonLdValueToPlainString(o["@value"]),
        };
      }
    }
    if (value) {
      return {
        "@language": "en",
        "@value": jsonLdValueToPlainString(value),
      };
    }
    return {
      "@language": "en",
      "@value": "",
    };
  };

  if (
    formData.name &&
    typeof formData.name === "string" &&
    formData.name.trim()
  ) {
    baseDataset["dcterms:title"] = {
      "@language": "en",
      "@value": formData.name.trim(),
    };
  } else if (!baseDataset["dcterms:title"]) {
    baseDataset["dcterms:title"] = {
      "@language": "en",
      "@value": filename.replace(/[^A-Za-z0-9_-]/g, "-"),
    };
  } else if (baseDataset["dcterms:title"]) {
    baseDataset["dcterms:title"] = normalizeDctermsLanguageLiteral(
      baseDataset["dcterms:title"],
      "en"
    );
  }

  // Only when metadata is plain text (not failed JSON parse of an object string).
  if (
    formData.metadata_content &&
    typeof formData.metadata_content === "string" &&
    formData.metadata_content.trim() &&
    !parsedMetadataContent
  ) {
    const rawMeta = formData.metadata_content.trim();
    if (!rawMeta.startsWith("{") && !rawMeta.startsWith("[")) {
      baseDataset["dcterms:description"] = {
        "@language": "en",
        "@value": rawMeta,
      };
    }
  } else if (baseDataset["dcterms:description"]) {
    const normalizedDesc = normalizeLanguageValue(
      baseDataset["dcterms:description"]
    );
    if (Array.isArray(normalizedDesc)) {
      const nonEmptyDesc = normalizedDesc.filter(
        (item) => item["@value"] && item["@value"].trim().length > 0
      );
      baseDataset["dcterms:description"] =
        nonEmptyDesc.length > 0
          ? nonEmptyDesc[0]
          : {
            "@language": "en",
            "@value": "No description provided",
          };
    } else {
      if (
        normalizedDesc["@value"] &&
        normalizedDesc["@value"].trim().length > 0
      ) {
        baseDataset["dcterms:description"] = normalizedDesc;
      } else {
        baseDataset["dcterms:description"] = {
          "@language": "en",
          "@value": "No description provided",
        };
      }
    }
  } else {
    baseDataset["dcterms:description"] = {
      "@language": "en",
      "@value": "No description provided",
    };
  }

  baseDataset["@type"] = "dcat:Dataset";

  if (formData.item_type && formData.item_type === "application") {
    baseDataset["dcterms:type"] = {
      "@id": "http://purl.org/dc/dcmitype/Software",
      "@type": "skos:Concept",
      "skos:prefLabel": {
        "@language": "en",
        "@value": "Software",
      },
    };
  } else if (!baseDataset["dcterms:type"]) {
    // DCAT-AP 3: explicit dcmitype:Dataset + skos:Concept (aligns with catalogue / SHACL examples)
    baseDataset["dcterms:type"] = {
      "@id": "http://purl.org/dc/dcmitype/Dataset",
      "@type": "skos:Concept",
      "skos:prefLabel": {
        "@language": "en",
        "@value": "Dataset",
      },
    };
  }

  if (!baseDataset["dcterms:identifier"]) {
    if (filename) {
      baseDataset["dcterms:identifier"] = {
        "@type": "xsd:string",
        "@value": filename,
      };
    } else {
      baseDataset["dcterms:identifier"] = {
        "@type": "xsd:string",
        "@value": "",
      };
    }
  }

  const { "dspace:extraMetadata": _, ...payloadWithoutExtra } =
    baseDataset as Record<string, unknown> & { "dspace:extraMetadata"?: unknown };
  const finalPayload = payloadWithoutExtra as Record<string, unknown>;

  delete finalPayload["dcat:inSeries"];
  delete finalPayload["dspace:metadataFilename"];

  const vcardExpanded = expandVcardPrefixedKeys(finalPayload);
  normalizeSpdxAlgorithmIds(vcardExpanded);

  const existingCtx = vcardExpanded["@context"];
  const userCtx =
    existingCtx &&
    typeof existingCtx === "object" &&
    !Array.isArray(existingCtx)
      ? (existingCtx as Record<string, string>)
      : {};
  vcardExpanded["@context"] = {
    ...REGISTRATION_JSONLD_CONTEXT,
    ...userCtx,
  };

  return JSON.stringify(vcardExpanded, null, 2);
}
