import type { SearchFilter } from "~/types/jsonld.types";

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
