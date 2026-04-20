import type { Row } from "@tanstack/vue-table";
import { convertJsonLdForTraining } from "~/utils/jsonld";
import type { TableRowData } from "~/types/table.types";

const collectRawJsonLd = (selectedRows: Row<TableRowData>[]) =>
  selectedRows
    .map((row) => (row.original as unknown as { _rawJson?: string })._rawJson)
    .filter((raw): raw is string => typeof raw === "string" && raw.length > 0)
    .map((raw) => {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .filter((raw): raw is Record<string, unknown> => !!raw);

const isJsonLdDatasetCollection = (items: Record<string, unknown>[]) => {
  const first = items[0];
  if (!first) return false;

  return (
    (typeof first["@type"] === "string" &&
      String(first["@type"]).includes("dcat:Dataset")) ||
    (Array.isArray(first["@type"]) &&
      (first["@type"] as unknown[]).some((type) =>
        String(type).includes("dcat:Dataset"),
      ))
  );
};

export const useTrainingPayload = () => {
  const buildTrainingPayload = (selectedRows: Row<TableRowData>[]) => {
    const raws = collectRawJsonLd(selectedRows);
    const isJsonLdDataset = raws.length > 0 && isJsonLdDatasetCollection(raws);

    const payload = convertJsonLdForTraining(
      isJsonLdDataset
        ? ({ "dcat:dataset": raws } as unknown)
        : ({ dataset: raws } as unknown),
    );

    if (isJsonLdDataset && raws.length > 0) {
      payload.dataset = payload.dataset.map((converted, index) => {
        const original = raws[index];
        if (original?.["dcat:distribution"]) {
          (converted as Record<string, unknown>)["_original_dcat_distribution"] =
            original["dcat:distribution"];
        }
        return converted;
      });
    }

    return payload as { dataset: Array<Record<string, unknown>> };
  };

  return { buildTrainingPayload };
};
