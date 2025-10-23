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
  const datasetType = dataset["dcterms:type"]
    ? ((dataset["dcterms:type"] as JsonLdObject)["@id"] as string)
    : undefined;

  const result: DatasetMetadata = {
    id: getJsonLdValue(dataset["dcterms:identifier"] as JsonLdStringValue),
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
  console.log("datasets", datasets);

  const transformedData = datasets.map((dataset: JsonLdObject) =>
    transformDatasetToTableRow(dataset)
  );
  const totalPages = Math.ceil(transformedData.length / currentLimit);
  console.log("tras", transformedData);
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
  };
}

/**
 * Create filters object for API requests
 */
export function createFiltersObject(
  filters: Record<string, unknown>
): Array<Record<string, unknown>> {
  const filtersObj: Array<Record<string, unknown>> = [
    {
      "dcat:dataset": {
        extraMetadata: [] as Array<Record<string, unknown>>,
      },
    },
  ];

  Object.keys(filters).forEach((key) => {
    switch (key) {
      case "distribution_csv":
      case "distribution_dicom":
      case "distribution_mmio":
        filtersObj[0] = {
          "@type": "dcat:Dataset",
          "dcat:distribution": {
            "@type": "dcat:Distribution",
            "dcat:format": key.replace("distribution_", "").toUpperCase(),
          },
        };
        break;
      case "isShared":
        filtersObj[0] = {
          "@type": "dcat:Dataset",
          isShared: {
            "@value": true,
            "@type": "xsd:boolean",
          },
        };
        break;
      default:
        if (
          filtersObj[0]["dcat:dataset"] &&
          typeof filtersObj[0]["dcat:dataset"] === "object"
        ) {
          const dcatDataset = filtersObj[0]["dcat:dataset"] as Record<
            string,
            unknown
          >;
          if (Array.isArray(dcatDataset["extraMetadata"])) {
            (
              dcatDataset["extraMetadata"] as Array<Record<string, unknown>>
            ).push({
              "@type": "med:Record",
              [key]: [
                {
                  "@value": filters[key],
                  "@type": "xsd:boolean",
                },
              ],
            });
          }
        }
        break;
    }
  });

  return filtersObj;
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
  filters?: Record<string, boolean>;
}): SearchFilter {
  const filter: SearchFilter = {
    "@context": {
      "@vocab": "http://data-space.org/",
      dcat: "http://www.w3.org/ns/dcat#",
      dcterms: "http://purl.org/dc/terms/",
      med: "http://oca.example.org/123/",
      Filters: "http://data-space.org/Filters",
    },
    "@type": "Filters",
    filters: [],
  };

  if (params.filters) {
    filter.filters = params.filters;
  }

  // TEMPORARY: Disable pagination
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
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    if (Array.isArray(value)) {
      if (value.length === 0) continue;

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
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

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

  console.log("result", result);

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
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

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
