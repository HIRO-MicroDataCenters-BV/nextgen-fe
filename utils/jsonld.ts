import type {
  JsonLdValue,
  JsonLdObject,
  JsonLdResponse,
  JsonLdStringValue,
  JsonLdBooleanValue,
  JsonLdLongValue,
  JsonLdLanguageValue,
  JsonLdDistribution,
  DatasetMetadata,
  SearchFilter,
} from "~/types/jsonld.types";

/**
 * Extract value from JSON-LD value object
 */
export function getJsonLdValue(
  value: JsonLdValue | JsonLdValue[] | undefined
): string {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value[0]?.["@value"] || "";
  }

  return value["@value"] || "";
}

/**
 * Extract value from JSON-LD object by path
 */
export function getJsonLdValueByPath(
  obj: JsonLdObject | undefined | null,
  path: string
): string {
  if (!obj) return "";

  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (!current || typeof current !== "object") return "";
    current = current[part as keyof typeof current];
  }

  return getJsonLdValue(current as JsonLdValue | JsonLdValue[] | undefined);
}

/**
 * Get language value from JSON-LD object
 */
function getLanguageValue(
  value: JsonLdLanguageValue | JsonLdLanguageValue[] | undefined,
  preferredLanguage: string = "en"
): string {
  if (!value) return "";

  if (Array.isArray(value)) {
    const preferred = value.find((v) => v["@language"] === preferredLanguage);
    if (preferred) return preferred["@value"];
    return value[0]?.["@value"] || "";
  }

  return value["@value"] || "";
}

function extractTitleNodePlain(
  node: unknown,
  preferredLanguage: string
): string {
  if (typeof node === "string") return node.trim();
  if (!node) return "";
  if (Array.isArray(node)) {
    const preferred = node.find(
      (x) =>
        x &&
        typeof x === "object" &&
        (x as Record<string, unknown>)["@language"] === preferredLanguage
    );
    if (
      preferred &&
      typeof preferred === "object" &&
      "@value" in preferred
    ) {
      const v = (preferred as { "@value": unknown })["@value"];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (v != null && String(v).trim()) return String(v).trim();
    }
    for (const item of node) {
      const s = extractTitleNodePlain(item, preferredLanguage);
      if (s) return s;
    }
    return "";
  }
  if (typeof node === "object" && node !== null && "@value" in node) {
    const v = (node as { "@value": unknown })["@value"];
    if (typeof v === "string") return v.trim();
    if (v != null) return String(v).trim();
  }
  return "";
}

/**
 * Human-readable string from dataset metadata `dcterms:title` (for UI display / name field).
 * Accepts a metadata object or a JSON string of it.
 */
export function extractDctermsTitlePlainText(
  metadata: unknown,
  preferredLanguage: string = "en"
): string {
  let obj: Record<string, unknown> | null = null;
  if (!metadata) return "";
  if (typeof metadata === "string") {
    try {
      const p = JSON.parse(metadata) as unknown;
      if (p && typeof p === "object" && !Array.isArray(p)) {
        obj = p as Record<string, unknown>;
      }
    } catch {
      return "";
    }
  } else if (
    typeof metadata === "object" &&
    metadata !== null &&
    !Array.isArray(metadata)
  ) {
    obj = metadata as Record<string, unknown>;
  }
  if (!obj) return "";
  return extractTitleNodePlain(obj["dcterms:title"], preferredLanguage);
}

/**
 * Transform JSON-LD dataset to table row format
 */
export function transformDatasetToTableRow(
  dataset: JsonLdObject
): DatasetMetadata {
  const themes = Array.isArray(dataset["dcat:theme"])
    ? dataset["dcat:theme"]
      .map((theme: JsonLdObject) =>
        theme["skos:prefLabel"]
          ? getLanguageValue(theme["skos:prefLabel"] as JsonLdLanguageValue)
          : ""
      )
      .filter((theme) => theme !== "")
    : dataset["dcat:theme"]
      ? [
        (dataset["dcat:theme"] as JsonLdObject)["skos:prefLabel"]
          ? getLanguageValue(
            (dataset["dcat:theme"] as JsonLdObject)[
            "skos:prefLabel"
            ] as JsonLdLanguageValue
          )
          : "",
      ].filter((theme) => theme !== "")
      : [];

  const getDistributionInfo = (
    dist: JsonLdDistribution | JsonLdDistribution[] | undefined
  ) => {
    if (!dist) return null;

    const distribution = Array.isArray(dist) ? dist[0] : dist;
    if (!distribution) return null;

    return {
      availability: distribution["dcatap:availability"]?.["skos:prefLabel"]
        ? getLanguageValue(
          distribution["dcatap:availability"][
          "skos:prefLabel"
          ] as JsonLdLanguageValue
        )
        : "",
      description: distribution["dcterms:description"]
        ? getLanguageValue(
          distribution["dcterms:description"] as JsonLdLanguageValue
        )
        : "",
      accessURL: distribution["dcat:accessURL"]?.["@id"] || "",
      byteSize: distribution["dcat:byteSize"]
        ? getJsonLdValue(distribution["dcat:byteSize"] as JsonLdLongValue)
        : "",
      format: distribution["dcat:format"]
        ? getJsonLdValue(distribution["dcat:format"] as JsonLdStringValue)
        : distribution["dcterms:format"]?.["skos:prefLabel"]
          ? getLanguageValue(
            distribution["dcterms:format"][
            "skos:prefLabel"
            ] as JsonLdLanguageValue
          )
          : "",
    };
  };

  const distribution = getDistributionInfo(
    dataset["dcat:distribution"] as
    | JsonLdDistribution
    | JsonLdDistribution[]
    | undefined
  );
  let datasetType: string | undefined;
  if (dataset["dcterms:type"]) {
    const typeValue = dataset["dcterms:type"];
    if (typeof typeValue === "string") {
      datasetType = typeValue;
    } else if (Array.isArray(typeValue)) {
      const firstType = typeValue[0];
      if (firstType && typeof firstType === "object" && "@id" in firstType) {
        datasetType = firstType["@id"] as string;
      }
    } else if (typeof typeValue === "object" && "@id" in typeValue) {
      datasetType = (typeValue as JsonLdObject)["@id"] as string;
    }
  }

  const identifier = getJsonLdValue(
    dataset["dcterms:identifier"] as JsonLdStringValue
  );
  const metadataFilename = getJsonLdValue(
    dataset["metadataFilename"] as JsonLdStringValue
  );
  const metadataFilenameWithoutExt = metadataFilename
    ? metadataFilename.replace(/\.[^/.]+$/, "")
    : "";
  const datasetId = dataset["@id"]
    ? String(dataset["@id"]).split("/").pop() || String(dataset["@id"])
    : "";

  const finalId =
    (identifier && identifier.trim() !== "" ? identifier : null) ||
    metadataFilename ||
    metadataFilenameWithoutExt ||
    datasetId ||
    "";

  const result: DatasetMetadata = {
    id: finalId,
    name: getLanguageValue(dataset["dcterms:title"] as JsonLdLanguageValue),
    description: getLanguageValue(
      dataset["dcterms:description"] as JsonLdLanguageValue
    ),
    biobank: getJsonLdValueByPath(dataset, "dspace:biobank"),
    last_update: getJsonLdValueByPath(dataset, "dcterms:modified"),
    issued: getJsonLdValueByPath(dataset, "dcterms:issued"),
    publisher: dataset["dcterms:publisher"]
      ? getJsonLdValueByPath(
        dataset["dcterms:publisher"] as JsonLdObject,
        "foaf:name"
      )
      : "",
    license: getJsonLdValueByPath(dataset, "dcterms:license"),
    isDeleted:
      getJsonLdValue(dataset["isDeleted"] as JsonLdBooleanValue) === "true",
    isShared:
      getJsonLdValue(dataset["isShared"] as JsonLdBooleanValue) === "true",
    metadataFilename: getJsonLdValue(
      dataset["metadataFilename"] as JsonLdStringValue
    ),
    keyword: getJsonLdValue(dataset["dcat:keyword"] as JsonLdStringValue),
    themes,
    datasetType,
    distribution,
  };

  return result;
}

/**
 * Transform search response to table data format
 */
export function transformSearchResponseToTableData(
  response: JsonLdResponse | null | undefined,
  currentPage: number = 1,
  currentLimit: number = 10
): {
  data: DatasetMetadata[];
  pagination: {
    total_items: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  originals?: unknown[];
} {
  if (!response) {
    return {
      data: [],
      pagination: {
        total_items: 0,
        page: currentPage,
        limit: currentLimit,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
      originals: [],
    };
  }

  const datasets: JsonLdObject[] = [];

  if (response["@graph"]) {
    const graph = response["@graph"];
    graph.forEach((item: JsonLdObject) => {
      if (item["@type"] === "dcat:Catalog" && item["dcat:dataset"]) {
        const catalogDatasets = Array.isArray(item["dcat:dataset"])
          ? (item["dcat:dataset"] as JsonLdObject[])
          : [item["dcat:dataset"] as JsonLdObject];

        catalogDatasets.forEach((dataset: JsonLdObject) => {
          if (dataset["@type"] === "dcat:Dataset") {
            datasets.push({
              ...dataset,
              ...{ "dspace:biobank": item["dcterms:title"] },
            } as JsonLdObject);
          }
        });
      }
    });
  } else if (
    (response as unknown as JsonLdObject)["@type"] === "dcat:Catalog" &&
    (response as unknown as JsonLdObject)["dcat:dataset"]
  ) {
    const catalogDatasets = Array.isArray(
      (response as unknown as JsonLdObject)["dcat:dataset"]
    )
      ? ((response as unknown as JsonLdObject)[
        "dcat:dataset"
      ] as JsonLdObject[])
      : [(response as unknown as JsonLdObject)["dcat:dataset"] as JsonLdObject];

    catalogDatasets.forEach((dataset: JsonLdObject) => {
      if (dataset["@type"] === "dcat:Dataset") {
        datasets.push(dataset);
      }
    });
  }

  const transformedData = datasets.map((dataset: JsonLdObject) =>
    transformDatasetToTableRow(dataset)
  );
  const totalPages = Math.ceil(transformedData.length / currentLimit);
  return {
    data: transformedData,
    pagination: {
      total_items: transformedData.length,
      page: currentPage,
      limit: currentLimit,
      total_pages: totalPages,
      has_next: currentPage < totalPages,
      has_prev: currentPage > 1,
    },
    originals: datasets,
  };
}

/**
 * Filter conversion aligns with DCAT-AP 3.0 notation (dcat, dcterms, med, xsd).
 * @see https://semiceu.github.io/DCAT-AP/releases/3.0.0/
 */
const LEGACY_DISTRIBUTION_KEYS = [
  "distribution_csv", "distribution_dicom", "distribution_mmio", "distribution_nifti",
  "distribution_xml", "distribution_vcf", "distribution_plink",
  "distribution_jpg/png", "distribution_jpg_png",
];

/**
 * Map API filter ID to backend property key per DCAT-AP 3.0 and domain context.
 * - distribution.*, distribution_xxx → dcat:Distribution with dcterms:format (DCAT-AP 3.0)
 * - identifiers.*, identifier → dcterms:identifier
 * - sociodemographics.*, comorbidities.*, etc. → med:xxx in extraMetadata (domain extension)
 */
function mapApiFilterIdToBackendKey(apiId: string): { key: string; type: "distribution" | "identifier" | "extraMetadata" | "isShared" } {
  if (apiId.startsWith("distribution.") || LEGACY_DISTRIBUTION_KEYS.includes(apiId)) {
    return { key: apiId, type: "distribution" };
  }
  if (apiId === "identifier" || apiId.startsWith("identifiers.")) {
    return { key: apiId, type: "identifier" };
  }
  if (apiId === "isShared") {
    return { key: apiId, type: "isShared" };
  }
  return { key: apiId, type: "extraMetadata" };
}

/**
 * Create filters object for API requests.
 * Converts UI/API filter keys to DCAT-AP 3.0 compliant structure with proper notation.
 */
export function createFiltersObject(
  filters: Record<string, unknown>
): Array<Record<string, unknown>> {
  if (!filters || Object.keys(filters).length === 0) {
    return [];
  }

  const dcatDataset: Record<string, unknown> = {};
  const extraMetadataFields: Record<string, unknown> = {};
  let distributionFilter: Record<string, unknown> | null = null;
  let identifierFilter: string | null = null;
  let isSharedFilter: Record<string, unknown> | null = null;

  const getFormatValue = (key: string): string => {
    if (key.startsWith("distribution.")) {
      return key.replace("distribution.", "").replace("_", "/").toLowerCase();
    }
    if (key === "distribution_jpg/png" || key === "distribution_jpg_png") return "jpg/png";
    return key.replace("distribution_", "").replace("_", "/").toLowerCase();
  };

  Object.keys(filters).forEach((key) => {
    const value = filters[key] === true || filters[key] === "true";
    const { type } = mapApiFilterIdToBackendKey(key);

    switch (type) {
      case "distribution": {
        const format = getFormatValue(key);
        distributionFilter = {
          "@type": "dcat:Distribution",
          "dcat:format": format,
        };
        break;
      }
      case "identifier":
        identifierFilter = String(filters[key]);
        break;
      case "isShared":
        isSharedFilter = { "@value": true, "@type": "xsd:boolean" };
        break;
      case "extraMetadata": {
        const itemId = key.includes(".") ? key.split(".").slice(1).join(".") : key;
        extraMetadataFields[`med:${itemId}`] = value;
        break;
      }
    }
  });

  if (Object.keys(extraMetadataFields).length > 0) {
    dcatDataset["extraMetadata"] = {
      "@type": "med:Record",
      ...extraMetadataFields,
    };
  }
  if (distributionFilter) {
    dcatDataset["dcat:distribution"] = distributionFilter;
  }
  if (identifierFilter) {
    dcatDataset["dcterms:identifier"] = identifierFilter;
  }
  if (isSharedFilter) {
    dcatDataset["isShared"] = isSharedFilter;
  }
  if (distributionFilter || isSharedFilter) {
    dcatDataset["@type"] = "dcat:Dataset";
  }

  return [{ "dcat:dataset": dcatDataset }];
}

/**
 * Create search filter for table
 */
export function createTableSearchFilter(params: {
  name?: string;
  description?: string;
  biobank?: string;
  lastupdate?: string;
  all?: string;
  page?: number;
  limit?: number;
  filters?: Array<Record<string, unknown>>;
  type?: string; // "datasets" or "applications"
}): SearchFilter {
  const filter: SearchFilter = {
    "@context": {
      "@vocab": "http://data-space.org/",
      dcat: "http://www.w3.org/ns/dcat#",
      dcterms: "http://purl.org/dc/terms/",
      med: "http://oca.example.org/123/",
      skos: "http://www.w3.org/2004/02/skos/core#",
      xsd: "http://www.w3.org/2001/XMLSchema#",
      Filters: "http://data-space.org/Filters",
    },
    "@type": "Filters",
    filters: [],
  };

  const filtersArray: Array<Record<string, unknown>> = [];

  const hasCustomFilters =
    params.filters && Array.isArray(params.filters) && params.filters.length > 0;

  if (hasCustomFilters) {
    const minimalContext: Record<string, string> = {
      "@vocab": "http://data-space.org/",
      dcat: "http://www.w3.org/ns/dcat#",
    };

    const hasExtraMetadata = params.filters?.some((f: Record<string, unknown>) => {
      const dataset = f["dcat:dataset"] as Record<string, unknown> | undefined;
      return dataset && "extraMetadata" in dataset;
    });

    const hasDcterms = params.filters?.some((f: Record<string, unknown>) => {
      const dataset = f["dcat:dataset"] as Record<string, unknown> | undefined;
      if (!dataset) return false;
      return Object.keys(dataset).some(key => key.startsWith("dcterms:"));
    });

    if (hasExtraMetadata) {
      minimalContext.med = "http://oca.example.org/123/";
    }
    if (hasDcterms) {
      minimalContext.dcterms = "http://purl.org/dc/terms/";
    }

    filter["@context"] = minimalContext as typeof filter["@context"];
  } else {
    if (params.type === "applications") {
      filtersArray.push({
        "dcat:dataset": {
          "dcterms:type": {
            "@id": "http://purl.org/dc/dcmitype/Software",
            "@type": "skos:Concept",
            "skos:prefLabel": { "@language": "en", "@value": "Software" },
          },
        },
      });
    } else if (params.type === "datasets" || !params.type) {
      filtersArray.push({
        "dcat:dataset": {
          "dcterms:type": {
            "@id": "http://purl.org/dc/dcmitype/Dataset",
            "@type": "skos:Concept",
            "skos:prefLabel": { "@language": "en", "@value": "Dataset" },
          },
        },
      });
    }
  }

  if (params.all) {
    filtersArray.push({
      "dcat:dataset": {
        "dcterms:title": {
          operation: "contains",
          operationValue: params.all,
        },
      },
    });
  } else {
    if (params.name) {
      filtersArray.push({
        "dcat:dataset": {
          "dcterms:title": {
            operation: "contains",
            operationValue: params.name,
          },
        },
      });
    }
    if (params.description) {
      filtersArray.push({
        "dcat:dataset": {
          "dcterms:description": {
            operation: "contains",
            operationValue: params.description,
          },
        },
      });
    }
  }

  if (params.biobank) {
    filtersArray.push({
      "@type": "dcat:Catalog",
      "dcterms:title": {
        operation: "contains",
        operationValue: params.biobank,
      },
    });
  }

  if (
    params.filters &&
    Array.isArray(params.filters) &&
    params.filters.length > 0
  ) {
    filtersArray.push(...params.filters);
    filter.filters = filtersArray;
    return filter;
  }

  filter.filters = filtersArray;

  const DISABLE_PAGINATION = true;

  if (!DISABLE_PAGINATION) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);

    (filter.filters as Array<unknown>).push({
      "@type": "PaginationFilter",
      "dspace:page": page,
      "dspace:pageSize": limit,
    });
  }
  return filter;
}

/**
 * Find dcat:dataset element in JSON-LD data
 * @param jsonLdData - JSON-LD data structure
 * @returns The dcat:dataset object if found, null otherwise
 */
export function findDatasetInJsonLd(jsonLdData: unknown): JsonLdObject | null {
  if (!jsonLdData) return null;

  const data = jsonLdData as JsonLdObject;

  const graph = data["@graph"] ? (data["@graph"] as JsonLdObject[]) : [data];

  for (const item of graph) {
    if (item["dcat:dataset"]) {
      const datasets = item["dcat:dataset"];
      if (Array.isArray(datasets) && datasets.length > 0) {
        return datasets[0] as JsonLdObject;
      }
      return datasets as JsonLdObject;
    }

    if (item["@type"] === "dcat:Dataset") {
      return item;
    }
  }

  return null;
}

/**
 * Flatten nested object into flat structure with "/" separated paths
 */
function flattenObject(
  obj: unknown,
  preferredLanguage: string = "en",
  prefix: string = "",
  result: Record<string, string> = {}
): Record<string, string> {
  if (!obj || typeof obj !== "object") {
    return result;
  }

  const processValue = (value: unknown): string => {
    if (!value) return "";

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    if (typeof value === "object" && value !== null) {
      const objValue = value as Record<string, unknown>;

      if ("@value" in objValue) {
        if ("@language" in objValue) {
          return getLanguageValue(
            objValue as unknown as JsonLdLanguageValue,
            preferredLanguage
          );
        }
        return getJsonLdValue(objValue as unknown as JsonLdValue);
      }

      if ("@id" in objValue && Object.keys(objValue).length === 1) {
        return objValue["@id"] as string;
      }
    }

    return "";
  };

  const entries = Object.entries(obj as Record<string, unknown>);

  for (const [key, value] of entries) {
    if (key.startsWith("@")) {
      continue;
    }

    const currentPath = prefix ? `${prefix}/${key}` : key;
    const camelPath = currentPath
      .replace(/[:-]/g, "_")
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

    if (Array.isArray(value)) {
      if (value.length === 0) continue;

      if (key === "dspace:extraMetadata") {
        value.forEach((item) => {
          if (typeof item === "object" && item !== null) {
            flattenObject(item, preferredLanguage, currentPath, result);
          }
        });
        continue;
      }

      const firstItem = value[0];
      if (typeof firstItem === "object" && firstItem !== null) {
        const itemObj = firstItem as Record<string, unknown>;
        if ("@value" in itemObj || "@id" in itemObj) {
          const processed = processValue(firstItem);
          if (processed) {
            result[camelPath] = processed;
          }
        } else {
          flattenObject(firstItem, preferredLanguage, currentPath, result);
        }
      } else {
        const processed = processValue(firstItem);
        if (processed) {
          result[camelPath] = processed;
        }
      }
    } else if (typeof value === "object" && value !== null) {
      const objValue = value as Record<string, unknown>;

      if (
        "@value" in objValue ||
        ("@id" in objValue && Object.keys(objValue).length === 1)
      ) {
        const processed = processValue(value);
        if (processed) {
          result[camelPath] = processed;
        }
      } else {
        flattenObject(value, preferredLanguage, currentPath, result);
      }
    } else {
      const processed = processValue(value);
      if (processed) {
        result[camelPath] = processed;
      }
    }
  }

  return result;
}

/**
 * Convert JSON-LD dataset to convenient JSON format for template rendering
 * @param dataset - JSON-LD dataset object
 * @param options - Conversion options
 * @returns Converted dataset in convenient format
 */
export function convertJsonLdDatasetToJson(
  dataset: JsonLdObject,
  options: {
    preferredLanguage?: string;
    includeRawData?: boolean;
    flattenArrays?: boolean;
    excludeOriginalData?: boolean;
  } = {}
): Record<string, unknown> {
  const {
    preferredLanguage = "en",
    includeRawData = false,
    flattenArrays = true,
  } = options;

  if (!dataset) return {};

  const result: Record<string, unknown> = {
    id: dataset["@id"] || "",
    type: Array.isArray(dataset["@type"])
      ? dataset["@type"].join(", ")
      : dataset["@type"] || "",
  };

  if (flattenArrays) {
    const flattened = flattenObject(dataset, preferredLanguage);
    Object.assign(result, flattened);
  } else {
    Object.entries(dataset).forEach(([key, value]) => {
      if (key.startsWith("@")) {
        if (key !== "@id" && key !== "@type") {
          result[key] = value;
        }
        return;
      }

      const camelKey = key
        .replace(/[:-]/g, "_")
        .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

      const processedValue = processJsonLdValue(
        value,
        preferredLanguage,
        flattenArrays,
        includeRawData,
        0,
        false
      );

      result[key] = processedValue;
      if (camelKey !== key) {
        result[camelKey] = processedValue;
      }
    });
  }

  if (flattenArrays) {
    if (dataset["dcterms:title"]) {
      result.title = result.dctermsTitle || "";
    }
    if (dataset["dcterms:description"]) {
      result.description = result.dctermsDescription || "";
    }
  }

  if (includeRawData) {
    result._raw = dataset;
  }

  return result;
}

/**
 * Process JSON-LD value recursively
 */
function processJsonLdValue(
  value: unknown,
  preferredLanguage: string,
  flattenArrays: boolean,
  includeRawData: boolean = false,
  depth: number = 0,
  excludeOriginalData: boolean = false
): unknown {
  if (!value) return null;

  if (depth > 10) return value;

  if (Array.isArray(value)) {
    const processed = value.map((v) =>
      processJsonLdValue(
        v,
        preferredLanguage,
        flattenArrays,
        includeRawData,
        depth + 1,
        excludeOriginalData
      )
    );
    return flattenArrays && processed.length === 1 ? processed[0] : processed;
  }

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;

    if ("@value" in obj) {
      if ("@language" in obj) {
        return getLanguageValue(
          obj as unknown as JsonLdLanguageValue,
          preferredLanguage
        );
      }
      return getJsonLdValue(obj as unknown as JsonLdValue);
    }

    if ("@id" in obj || "@type" in obj) {
      return convertJsonLdDatasetToJson(obj as JsonLdObject, {
        preferredLanguage,
        flattenArrays,
        includeRawData,
        excludeOriginalData,
      });
    }

    const result: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, val]) => {
      const camelKey = key
        .replace(/[:-]/g, "_")
        .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());

      const processedValue = processJsonLdValue(
        val,
        preferredLanguage,
        flattenArrays,
        includeRawData,
        depth + 1,
        excludeOriginalData
      );

      if (excludeOriginalData) {
        result[camelKey] = processedValue;
      } else {
        result[key] = processedValue;
        if (camelKey !== key) {
          result[camelKey] = processedValue;
        }
      }
    });
    return result;
  }

  return value;
}

/**
 * Convert JSON-LD (or already-normalized JSON) into a simplified structure
 * suitable for training export: { dataset: Array<...> }
 */
export function convertJsonLdForTraining(input: unknown): {
  dataset: Array<Record<string, unknown>>;
} {
  const asObj = (input || {}) as Record<string, unknown>;
  if (Array.isArray(asObj.dataset)) {
    return { dataset: asObj.dataset as Array<Record<string, unknown>> };
  }

  const result: Array<Record<string, unknown>> = [];

  const datasets: unknown[] = (() => {
    if (Array.isArray((asObj as Record<string, unknown>)["dcat:dataset"])) {
      return (asObj as Record<string, unknown>)["dcat:dataset"] as unknown[];
    }
    if ((asObj as Record<string, unknown>)["@type"] === "dcat:Dataset") {
      return [asObj];
    }
    return [];
  })();

  const toBool = (v: unknown): boolean => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") return v.toLowerCase() === "true";
    if (
      v &&
      typeof v === "object" &&
      "@value" in (v as Record<string, unknown>)
    ) {
      return toBool((v as Record<string, unknown>)["@value"]);
    }
    return false;
  };

  const extractScalar = (v: unknown): string => {
    if (v == null) return "";
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    )
      return String(v);
    if (Array.isArray(v)) {
      for (const item of v) {
        const s = extractScalar(item);
        if (s) return s;
      }
      return "";
    }
    if (typeof v === "object") {
      const obj = v as Record<string, unknown>;
      if ("@value" in obj) return getJsonLdValue(obj as unknown as JsonLdValue);
      if ("@language" in obj && "@value" in obj)
        return getLanguageValue(obj as unknown as JsonLdLanguageValue);
      if ("@id" in obj && Object.keys(obj).length === 1)
        return String(obj["@id"]);
      if ("skos:prefLabel" in obj)
        return getLanguageValue(
          obj["skos:prefLabel"] as unknown as JsonLdLanguageValue
        );
      if ("prefLabel" in obj) return extractScalar(obj["prefLabel"]);
      for (const key of ["value", "name", "title"]) {
        if (key in obj) {
          const s = extractScalar(obj[key]);
          if (s) return s;
        }
      }
    }
    return "";
  };

  const keyFromIri = (iri: string): string => {
    const bySlash = iri.split("/");
    const last = bySlash[bySlash.length - 1];
    return last.replace(/[^A-Za-z0-9_-]/g, "_");
  };

  const normalizeExtraMetadata = (extra: unknown): Record<string, boolean> => {
    const out: Record<string, boolean> = {};
    if (!extra || typeof extra !== "object") return out;
    const obj = extra as Record<string, unknown>;
    Object.entries(obj).forEach(([k, v]) => {
      if (k.startsWith("@")) return;
      const key = keyFromIri(k);
      out[key] = toBool(v);
    });
    return out;
  };

  const toPlainDataset = (
    ds: Record<string, unknown>
  ): Record<string, unknown> => {
    const extra = ds["extraMetadata"] as unknown;
    const publisher = ds["dcterms:publisher"] as
      | Record<string, unknown>
      | undefined;
    const theme = ds["dcat:theme"] as Record<string, unknown> | undefined;
    const distributions = ds["dcat:distribution"] as unknown[] | undefined;

    const extractNames = (v: unknown): string[] => {
      if (!v) return [];
      if (Array.isArray(v)) {
        return (v as unknown[])
          .map((n) => {
            if (typeof n === "string") return n;
            if (n && typeof n === "object") {
              return (
                getLanguageValue(n as unknown as JsonLdLanguageValue) ||
                getJsonLdValue(n as unknown as JsonLdValue)
              );
            }
            return "";
          })
          .filter((s) => !!s);
      }
      if (typeof v === "string") return [v];
      if (v && typeof v === "object") {
        const lang = getLanguageValue(v as unknown as JsonLdLanguageValue);
        if (lang) return [lang];
        const val = getJsonLdValue(v as unknown as JsonLdValue);
        if (val) return [val];
      }
      return [];
    };

    const publisherName = publisher
      ? extractNames(publisher["foaf:name"])
      : undefined;

    const availabilityPrefLabel = (dist: Record<string, unknown>): string => {
      const av = dist["dcatap:availability"] as
        | Record<string, unknown>
        | undefined;
      if (!av) return "";
      const label = av?.["skos:prefLabel"] as unknown as
        | JsonLdLanguageValue
        | undefined;
      return label ? getLanguageValue(label) : String(av["@id"] || "");
    };

    return {
      extraMetadata: normalizeExtraMetadata(extra),
      isDeleted: toBool((ds as Record<string, unknown>)["isDeleted"]),
      isShared: toBool((ds as Record<string, unknown>)["isShared"]),
      region:
        getJsonLdValueByPath(ds as unknown as JsonLdObject, "region.@value") ||
        extractScalar((ds as Record<string, unknown>)["region"]),
      metadataFilename:
        getJsonLdValueByPath(
          ds as unknown as JsonLdObject,
          "metadataFilename.@value"
        ) || extractScalar((ds as Record<string, unknown>)["metadataFilename"]),
      description:
        getLanguageValue(
          ds["dcterms:description"] as unknown as JsonLdLanguageValue
        ) || extractScalar(ds["dcterms:description"]),
      identifier: getJsonLdValue(
        ds["dcterms:identifier"] as unknown as JsonLdStringValue
      ),
      issued: getJsonLdValue(
        ds["dcterms:issued"] as unknown as JsonLdStringValue
      ),
      license:
        getJsonLdValue(ds["dcterms:license"] as unknown as JsonLdStringValue) ||
        (ds["dcterms:license"] as Record<string, unknown>)?.["@id"] ||
        extractScalar(ds["dcterms:license"]) ||
        "",
      publisher: publisher
        ? {
          identifier: getJsonLdValue(
            publisher["dcterms:identifier"] as unknown as JsonLdStringValue
          ),
          name: publisherName || [],
        }
        : undefined,
      title:
        getLanguageValue(
          ds["dcterms:title"] as unknown as JsonLdLanguageValue
        ) || extractScalar(ds["dcterms:title"]),
      distribution: Array.isArray(distributions)
        ? distributions.map((d) => {
          const dist = d as Record<string, unknown>;
          return {
            availability: availabilityPrefLabel(dist),
            description: getLanguageValue(
              dist["dcterms:description"] as unknown as JsonLdLanguageValue
            ),
            accessURL:
              (dist["dcat:accessURL"] as Record<string, unknown>)?.["@id"] ||
              (dist["dcat:downloadURL"] as Record<string, unknown>)?.[
              "@id"
              ] ||
              extractScalar(dist["dcat:accessURL"]) ||
              "",
            byteSize: getJsonLdValue(
              dist["dcat:byteSize"] as unknown as JsonLdLongValue
            ),
            format:
              getJsonLdValue(
                dist["dcat:format"] as unknown as JsonLdStringValue
              ) ||
              getLanguageValue(
                dist["dcterms:format"] as unknown as JsonLdLanguageValue
              ) ||
              extractScalar(dist["dcterms:format"]),
          } as Record<string, unknown>;
        })
        : undefined,
      keyword:
        getJsonLdValue(ds["dcat:keyword"] as unknown as JsonLdStringValue) ||
        extractScalar(ds["dcat:keyword"]),
      theme: theme
        ? getLanguageValue(
          theme["skos:prefLabel"] as unknown as JsonLdLanguageValue
        ) || theme
        : undefined,
    } as Record<string, unknown>;
  };

  datasets.forEach((raw) => {
    if (!raw || typeof raw !== "object") return;
    result.push(toPlainDataset(raw as Record<string, unknown>));
  });

  return { dataset: result };
}

/**
 * Create JSON-LD dataset structure for saveDataset API
 * @param formData - Form values
 * @param filename - Filename of uploaded file
 * @returns JSON-LD dataset object as string
 */
export function createDatasetJsonLd(
  formData: Record<string, unknown>,
  filename: string
): string {
  const context = {
    dspace: "http://data-space.org/",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    dcat: "http://www.w3.org/ns/dcat#",
    dcatap: "http://data.europa.eu/r5r/",
    dcterms: "http://purl.org/dc/terms/",
    spdx: "http://spdx.org/rdf/terms#",
    foaf: "http://xmlns.com/foaf/0.1/",
    skos: "http://www.w3.org/2004/02/skos/core#",
  };

  const datasetId = `https://example.com/dataset/${filename.replace(
    /[^A-Za-z0-9_-]/g,
    "-"
  )}`;

  let parsedMetadataContent: Record<string, unknown> | null = null;
  if (formData.metadata_content) {
    if (typeof formData.metadata_content === "object") {
      parsedMetadataContent = formData.metadata_content as Record<string, unknown>;
    } else if (typeof formData.metadata_content === "string") {
      try {
        const parsed = JSON.parse(formData.metadata_content);
        if (parsed && typeof parsed === "object") {
          parsedMetadataContent = parsed;
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
    baseDataset["@context"] = context;
  } else if (parsedMetadataContent && parsedMetadataContent["@context"]) {
    baseDataset["@context"] = parsedMetadataContent["@context"];
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
          if ("@language" in item && "@value" in item) {
            return {
              "@language": String(item["@language"]),
              "@value": String(item["@value"]),
            };
          }
        }
        return {
          "@language": "en",
          "@value": String(item),
        };
      });
      if (normalized.length === 1) {
        return normalized[0];
      }
      return normalized;
    }
    if (typeof value === "object" && value !== null) {
      if ("@language" in value && "@value" in value) {
        return {
          "@language": String(value["@language"]),
          "@value": String(value["@value"]),
        };
      }
    }
    if (value) {
      return {
        "@language": "en",
        "@value": String(value),
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
    const normalizedTitle = normalizeLanguageValue(
      baseDataset["dcterms:title"]
    );
    if (Array.isArray(normalizedTitle)) {
      baseDataset["dcterms:title"] =
        normalizedTitle.length > 0 ? normalizedTitle[0] : normalizedTitle;
    } else {
      baseDataset["dcterms:title"] = normalizedTitle;
    }
  }

  if (
    formData.metadata_content &&
    typeof formData.metadata_content === "string" &&
    formData.metadata_content.trim() &&
    !parsedMetadataContent
  ) {
    baseDataset["dcterms:description"] = {
      "@language": "en",
      "@value": formData.metadata_content.trim(),
    };
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
  }

  const isDataset = formData.item_type === "dataset";
  let relatedDataProductPath: string | null = null;
  if (
    isDataset &&
    formData.related_data_product &&
    typeof formData.related_data_product === "string" &&
    formData.related_data_product.trim()
  ) {
    relatedDataProductPath = formData.related_data_product.trim();
    const seriesId = relatedDataProductPath;
    const seriesName =
      seriesId.split("/").pop() ||
      seriesId.split(":").pop() ||
      "Data Product Series";

    baseDataset["dcat:inSeries"] = {
      "@id": seriesId,
      "@type": "dcat:DatasetSeries",
      "dcterms:title": {
        "@language": "en",
        "@value": seriesName,
      },
      "dcterms:description": {
        "@language": "en",
        "@value": `Data product series: ${seriesName}`,
      },
    };
  }

  if (filename) {
    baseDataset["dspace:metadataFilename"] = {
      "@type": "xsd:string",
      "@value": filename,
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

  const SPDX_ALGORITHM_FIXES: Record<string, string> = {
    "http://spdx.org/rdf/terms#SHA256": "http://spdx.org/rdf/terms#checksumAlgorithm_sha256",
    "http://spdx.org/rdf/terms#SHA512": "http://spdx.org/rdf/terms#checksumAlgorithm_sha512",
    "http://spdx.org/rdf/terms#SHA1": "http://spdx.org/rdf/terms#checksumAlgorithm_sha1",
    "http://spdx.org/rdf/terms#MD5": "http://spdx.org/rdf/terms#checksumAlgorithm_md5",
  };
  const distributions = baseDataset["dcat:distribution"];
  if (distributions) {
    const dists = Array.isArray(distributions) ? distributions : [distributions];
    dists.forEach((dist: unknown) => {
      const d = dist as Record<string, unknown>;
      const checksum = d?.["spdx:checksum"] as Record<string, unknown> | undefined;
      if (checksum?.["spdx:algorithm"]) {
        const algo = checksum["spdx:algorithm"] as Record<string, unknown> | string;
        const id = typeof algo === "string" ? algo : (algo?.["@id"] as string);
        const fixed = id ? SPDX_ALGORITHM_FIXES[id] : undefined;
        const finalId = fixed ?? id;
        if (finalId) {
          const base = typeof algo === "object" && algo !== null ? { ...algo } : {};
          checksum["spdx:algorithm"] = {
            ...base,
            "@id": finalId,
            "@type": "spdx:ChecksumAlgorithm",
          };
        }
      }
    });
  }

  const { "dspace:extraMetadata": _, ...payloadWithoutExtra } =
    baseDataset as Record<string, unknown> & { "dspace:extraMetadata"?: unknown };
  const finalPayload = payloadWithoutExtra as Record<string, unknown>;

  return JSON.stringify(finalPayload, null, 2);
}
