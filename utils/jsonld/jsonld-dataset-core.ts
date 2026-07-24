import type {
  JsonLdObject,
  JsonLdValue,
  JsonLdLanguageValue,
} from "~/types/jsonld.types";
import {
  getJsonLdValue,
  getLanguageValue,
  normalizeDctermsLanguageLiteral,
} from "./jsonld-values";

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
 * Collapse invalid multi-title arrays and strip `[object Object]` artifacts on the dataset
 * actually used in the payload (in-place). Safe to call on GET responses before editing.
 */
export function sanitizeDatasetDctermsTitleInPlace(root: unknown): void {
  if (!root || typeof root !== "object") return;
  const dataset = findDatasetInJsonLd(root);
  const target = (dataset ?? root) as Record<string, unknown>;
  if (target["dcterms:title"] == null) return;
  target["dcterms:title"] = normalizeDctermsLanguageLiteral(
    target["dcterms:title"],
    "en"
  );
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

  const toDisplayPath = (path: string): string =>
    path
      .split("/")
      .map((segment) => {
        // Keep URI segments intact (e.g. http://oca.example.org/123/education)
        // so we don't corrupt schemes into http_//...
        if (segment.includes("://")) return segment;
        return segment
          .replace(/[:-]/g, "_")
          .replace(/_([a-z])/g, (_match, letter) => letter.toUpperCase());
      })
      .join("/");

  for (const [key, value] of entries) {
    if (key.startsWith("@")) {
      continue;
    }

    const currentPath = prefix ? `${prefix}/${key}` : key;
    const camelPath = toDisplayPath(currentPath);

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
