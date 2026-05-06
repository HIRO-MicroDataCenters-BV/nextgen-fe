import type {
  JsonLdObject,
  JsonLdResponse,
  JsonLdStringValue,
  JsonLdLongValue,
  JsonLdLanguageValue,
  JsonLdDistribution,
  JsonLdBooleanValue,
  DatasetMetadata,
} from "~/types/jsonld.types";
import { getJsonLdValue, getJsonLdValueByPath, getLanguageValue } from "./jsonld-values";

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
