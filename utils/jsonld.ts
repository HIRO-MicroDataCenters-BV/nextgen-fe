import type {
  JsonLdValue,
  JsonLdObject,
  JsonLdResponse,
  JsonLdStringValue,
  JsonLdBooleanValue,
  JsonLdLongValue,
  JsonLdLanguageValue,
  JsonLdPublisher,
  JsonLdTheme,
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
  let current: any = obj;

  for (const part of parts) {
    if (!current) return "";
    current = current[part];
  }

  return getJsonLdValue(current);
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

  const result: DatasetMetadata = {
    id: String(dataset["@id"] || ""),
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
  };
} {
  if (!response || !response["@graph"]) {
    return {
      data: [],
      pagination: {
        total_items: 0,
        page: currentPage,
        limit: currentLimit,
      },
    };
  }

  // Get the graph array from the response
  const graph = response["@graph"];

  // Extract datasets from catalogs
  const datasets: JsonLdObject[] = [];
  graph.forEach((item) => {
    if (item["@type"] === "dcat:Catalog" && item["dcat:dataset"]) {
      const catalogDatasets = Array.isArray(item["dcat:dataset"])
        ? item["dcat:dataset"]
        : [item["dcat:dataset"]];

      catalogDatasets.forEach((dataset) => {
        if (dataset["@type"] === "dcat:Dataset") {
          datasets.push(dataset);
        }
      });
    }
  });

  const transformedData = datasets.map(transformDatasetToTableRow);

  return {
    data: transformedData,
    pagination: {
      total_items: transformedData.length,
      page: currentPage,
      limit: currentLimit,
    },
  };
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
}): SearchFilter {
  const filter: SearchFilter = {
    "@context": {
      "@vocab": "http://data-space.org/",
      dcat: "http://www.w3.org/ns/dcat#",
      dcterms: "http://purl.org/dc/terms/",
      dspace: "http://data-space.org/",
    },
    "@type": "Filters",
    filters: [],
  };

  // Add search filters if provided
  if (
    params.name ||
    params.description ||
    params.biobank ||
    params.lastupdate ||
    params.all
  ) {
    const searchFilter: Record<string, unknown> = {
      "@type": "SearchFilter",
    };

    if (params.name) {
      searchFilter["dcterms:title"] = params.name;
    }
    if (params.description) {
      searchFilter["dcterms:description"] = params.description;
    }
    if (params.biobank) {
      searchFilter["dspace:biobank"] = params.biobank;
    }
    if (params.lastupdate) {
      searchFilter["dcterms:modified"] = params.lastupdate;
    }
    if (params.all) {
      searchFilter["dspace:search"] = params.all;
    }

    filter.filters.push(searchFilter);
  }

  // Add pagination
  const page = params.page || 1;
  const limit = params.limit || 10;
  filter.filters.push({
    "@type": "PaginationFilter",
    "dspace:page": page,
    "dspace:pageSize": limit,
  });

  return filter;
}
