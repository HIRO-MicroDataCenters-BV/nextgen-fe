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
    // Get first value from array
    return value[0]?.["@value"] || "";
  }

  return value["@value"] || "";
}

/**
 * Extract value from JSON-LD object by path
 */
export function getJsonLdValueByPath(obj: JsonLdObject, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (!current) return "";
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
  // Get themes
  const themes = Array.isArray(dataset["dcat:theme"])
    ? dataset["dcat:theme"].map((theme: JsonLdObject) =>
        getLanguageValue(theme["skos:prefLabel"] as JsonLdLanguageValue)
      )
    : dataset["dcat:theme"]
    ? [
        getLanguageValue(
          (dataset["dcat:theme"] as JsonLdObject)[
            "skos:prefLabel"
          ] as JsonLdLanguageValue
        ),
      ]
    : [];

  // Get distribution info
  const distribution = dataset["dcat:distribution"]
    ? {
        availability: getLanguageValue(
          (dataset["dcat:distribution"] as JsonLdDistribution)[
            "dcatap:availability"
          ]["skos:prefLabel"] as JsonLdLanguageValue
        ),
        description: getLanguageValue(
          (dataset["dcat:distribution"] as JsonLdDistribution)[
            "dcterms:description"
          ] as JsonLdLanguageValue
        ),
        accessURL: (dataset["dcat:distribution"] as JsonLdDistribution)[
          "dcat:accessURL"
        ]["@id"],
        byteSize: getJsonLdValue(
          (dataset["dcat:distribution"] as JsonLdDistribution)[
            "dcat:byteSize"
          ] as JsonLdLongValue
        ),
        format: getJsonLdValue(
          (dataset["dcat:distribution"] as JsonLdDistribution)[
            "dcat:format"
          ] as JsonLdStringValue
        ),
      }
    : null;
  // Transform dataset to table row format
  const result: DatasetMetadata = {
    id: getJsonLdValue(dataset["dcterms:identifier"] as JsonLdStringValue),
    name: getLanguageValue(dataset["dcterms:title"] as JsonLdLanguageValue),
    description: getLanguageValue(
      dataset["dcterms:description"] as JsonLdLanguageValue
    ),
    biobank: getJsonLdValueByPath(dataset, "dspace:biobank"),
    last_update: getJsonLdValueByPath(dataset, "dcterms:modified"),
    issued: getJsonLdValueByPath(dataset, "dcterms:issued"),
    publisher: getJsonLdValueByPath(
      dataset["dcterms:publisher"] as JsonLdObject,
      "foaf:name"
    ),
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

  // Extract datasets from catalogs
  const datasets: JsonLdObject[] = [];
  
  // Handle response with @graph structure
  if (response["@graph"]) {
    const graph = response["@graph"];
    graph.forEach((item) => {
      if (item["@type"] === "dcat:Catalog" && item["dcat:dataset"]) {
        const catalogDatasets = Array.isArray(item["dcat:dataset"])
          ? item["dcat:dataset"]
          : [item["dcat:dataset"]];

        catalogDatasets.forEach((dataset) => {
          if (dataset["@type"] === "dcat:Dataset") {
            datasets.push({...dataset, ...{"dspace:biobank": item["dcterms:title"]}});
          }
        });
      }
    });
  }
  // Handle direct catalog structure (new format)
  else if (response["@type"] === "dcat:Catalog" && response["dcat:dataset"]) {
    const catalogDatasets = Array.isArray(response["dcat:dataset"])
      ? response["dcat:dataset"]
      : [response["dcat:dataset"]];

    catalogDatasets.forEach((dataset) => {
      if (dataset["@type"] === "dcat:Dataset") {
        datasets.push(dataset);
      }
    });
  }
  console.log("datasets",datasets);

  const transformedData = datasets.map(transformDatasetToTableRow);
  const totalPages = Math.ceil(transformedData.length / currentLimit);
  console.log("tras",transformedData);
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
export function createFiltersObject(filters: Record<string, unknown>): Array<Record<string, unknown>> {
  const filtersObj = [
    {
      "dcat:dataset": {
        "extraMetadata": []
      }
    }
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
          }
        };
        break;
      case "isShared":
        filtersObj[0] = {
          "@type": "dcat:Dataset",
          "isShared": {
            "@value": true,
            "@type": "xsd:boolean"
          }
        };
        break;
      default:
        filtersObj[0]["dcat:dataset"]["extraMetadata"].push({
          "@type": "med:Record",
          [key]: [
            {
              "@value": filters[key],
              "@type": "xsd:boolean"
            }
          ]
        });
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

  // Add boolean filters if provided
  if (params.filters) {
    filter.filters = params.filters;
  }

  // TEMPORARY: Disable pagination
  const DISABLE_PAGINATION = true;

  if (!DISABLE_PAGINATION) {
    // Add pagination filter
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
export function findDatasetInJsonLd(jsonLdData: unknown): unknown | null {
  if (!jsonLdData) return null;

  // Check if data has @graph array
  const graph = jsonLdData["@graph"] || [jsonLdData];

  // Iterate through graph items
  for (const item of graph) {
    // Check if item has dcat:dataset property
    if (item["dcat:dataset"]) {
      const datasets = item["dcat:dataset"];
      // If dcat:dataset is an array, return the first dataset
      if (Array.isArray(datasets) && datasets.length > 0) {
        return datasets[0];
      }
      // If dcat:dataset is a single object, return it
      return datasets;
    }
    
    // Check if the item itself is a dataset (for direct catalog structure)
    if (item["@type"] === "dcat:Dataset") {
      return item;
    }
  }

  return null;
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
    excludeOriginalData = false,
  } = options;

  if (!dataset) return {};

  const result: Record<string, unknown> = {
    id: dataset["@id"] || "",
    type: Array.isArray(dataset["@type"])
      ? dataset["@type"]
      : [dataset["@type"] || ""],
  };

  // Process each property in the dataset
  Object.entries(dataset).forEach(([key, value]) => {
    if (key.startsWith("@")) {
      // Skip @id and @type as they're already processed
      if (key !== "@id" && key !== "@type") {
        result[key] = value;
      }
      return;
    }

    // Convert property name to camelCase for convenience
    const camelKey = key
      .replace(/[:-]/g, "_")
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    const processedValue = processJsonLdValue(
      value,
      preferredLanguage,
      flattenArrays,
      includeRawData,
      0,
      excludeOriginalData
    );

    if (!excludeOriginalData) {
      result[key] = processedValue;
    }

    // Always provide camelCase version
    result[camelKey] = processedValue;
  });

  // Add structured data for common properties
  if (dataset["dcterms:title"]) {
    result.title = getLanguageValue(
      dataset["dcterms:title"] as JsonLdLanguageValue,
      preferredLanguage
    );
  }

  if (dataset["dcterms:description"]) {
    result.description = getLanguageValue(
      dataset["dcterms:description"] as JsonLdLanguageValue,
      preferredLanguage
    );
  }

  if (dataset["dcterms:identifier"]) {
    result.identifier = getJsonLdValue(
      dataset["dcterms:identifier"] as JsonLdStringValue
    );
  }

  if (dataset["dcterms:modified"]) {
    result.lastModified = getJsonLdValue(
      dataset["dcterms:modified"] as JsonLdStringValue
    );
  }

  if (dataset["dcterms:issued"]) {
    result.issued = getJsonLdValue(
      dataset["dcterms:issued"] as JsonLdStringValue
    );
  }

  if (dataset["dcat:keyword"]) {
    result.keywords = Array.isArray(dataset["dcat:keyword"])
      ? dataset["dcat:keyword"].map((k) =>
          getJsonLdValue(k as JsonLdStringValue)
        )
      : [getJsonLdValue(dataset["dcat:keyword"] as JsonLdStringValue)];
  }

  if (dataset["dcat:theme"]) {
    result.themes = Array.isArray(dataset["dcat:theme"])
      ? dataset["dcat:theme"].map((theme: JsonLdObject) => ({
          id: theme["@id"],
          label: getLanguageValue(
            theme["skos:prefLabel"] as JsonLdLanguageValue,
            preferredLanguage
          ),
          raw: includeRawData ? theme : undefined,
        }))
      : [
          {
            id: (dataset["dcat:theme"] as JsonLdObject)["@id"],
            label: getLanguageValue(
              (dataset["dcat:theme"] as JsonLdObject)[
                "skos:prefLabel"
              ] as JsonLdLanguageValue,
              preferredLanguage
            ),
            raw: includeRawData ? dataset["dcat:theme"] : undefined,
          },
        ];
  }

  if (dataset["dcterms:publisher"]) {
    const publisher = dataset["dcterms:publisher"] as JsonLdObject;
    result.publisher = {
      id: publisher["@id"],
      name: getJsonLdValue(publisher["foaf:name"] as JsonLdStringValue),
      identifier: getJsonLdValue(
        publisher["dcterms:identifier"] as JsonLdStringValue
      ),
      raw: includeRawData ? publisher : undefined,
    };
  }

  if (dataset["dcat:distribution"]) {
    const dist = dataset["dcat:distribution"] as JsonLdDistribution;
    result.distribution = {
      id: dist["@id"],
      description: getLanguageValue(
        dist["dcterms:description"] as JsonLdLanguageValue,
        preferredLanguage
      ),
      accessURL: dist["dcat:accessURL"]["@id"],
      format: getJsonLdValue(dist["dcat:format"] as JsonLdStringValue),
      byteSize: getJsonLdValue(dist["dcat:byteSize"] as JsonLdLongValue),
      availability: {
        id: dist["dcatap:availability"]["@id"],
        label: getLanguageValue(
          dist["dcatap:availability"]["skos:prefLabel"] as JsonLdLanguageValue,
          preferredLanguage
        ),
      },
      raw: includeRawData ? dist : undefined,
    };
  }

  // Include raw data if requested
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

  // Prevent infinite recursion
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

    // Handle JSON-LD value objects
    if ("@value" in obj) {
      if ("@language" in obj) {
        return getLanguageValue(obj as unknown as JsonLdLanguageValue, preferredLanguage);
      }
      return getJsonLdValue(obj as unknown as JsonLdValue);
    }

    // Handle nested JSON-LD objects (deep traversal)
    if ("@id" in obj || "@type" in obj) {
      return convertJsonLdDatasetToJson(obj as JsonLdObject, {
        preferredLanguage,
        flattenArrays,
        includeRawData,
        excludeOriginalData,
      });
    }

    // Handle regular objects (deep traversal)
    const result: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, val]) => {
      // Convert property name to camelCase for convenience
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

      if (!excludeOriginalData) {
        result[key] = processedValue;
      }

      // Also provide camelCase version if different from original
      if (camelKey !== key) {
        result[camelKey] = processedValue;
      }
    });
    return result;
  }

  return value;
}
