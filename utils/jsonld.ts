import type {
  JsonLdValue,
  JsonLdObject,
  SearchFilter,
} from "~/types/api.types";

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
 * Transform JSON-LD dataset to table row format
 */
export function transformDatasetToTableRow(dataset: JsonLdObject): {
  id: string;
  name: string;
  description: string;
  biobank: string;
  last_update: string;
  issued: string;
  publisher: string;
  license: string;
} {
  console.log("Transforming dataset:", dataset);

  // Helper function to get title in English or first available language
  const getTitle = (title: any): string => {
    if (Array.isArray(title)) {
      const enTitle = title.find((t) => t["@language"] === "en");
      if (enTitle) return enTitle["@value"];
      return title[0]?.["@value"] || "";
    }
    return getJsonLdValue(title);
  };

  // Helper function to get publisher name
  const getPublisherName = (publisher: any): string => {
    if (!publisher) return "";
    return getJsonLdValueByPath(publisher, "foaf:name");
  };

  const result = {
    id: String(dataset["@id"] || ""),
    name: getTitle(dataset["dcterms:title"]),
    description: getJsonLdValueByPath(dataset, "dcterms:description"),
    biobank: getJsonLdValueByPath(dataset, "dspace:biobank"),
    last_update: getJsonLdValueByPath(dataset, "dcterms:modified"),
    issued: getJsonLdValueByPath(dataset, "dcterms:issued"),
    publisher: getPublisherName(dataset["dcterms:publisher"]),
    license: getJsonLdValueByPath(dataset, "dcterms:license"),
  };

  console.log("Transformed row:", result);
  return result;
}

/**
 * Transform search response to table data format
 */
export function transformSearchResponseToTableData(
  response: JsonLdObject | null | undefined,
  currentPage: number = 1,
  currentLimit: number = 10
): {
  data: Array<{
    id: string;
    name: string;
    description: string;
    biobank: string;
    last_update: string;
    issued: string;
    publisher: string;
    license: string;
  }>;
  pagination: {
    total_items: number;
    page: number;
    limit: number;
  };
} {
  console.log("Original response:", JSON.stringify(response, null, 2));

  if (!response || !response["@graph"]) {
    console.log("No response or @graph found");
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
  const graph = response["@graph"] as JsonLdObject[];
  console.log("Graph array length:", graph.length);

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

  console.log("Extracted datasets:", datasets);

  const transformedData = datasets.map(transformDatasetToTableRow);
  console.log("Transformed data:", transformedData);

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
