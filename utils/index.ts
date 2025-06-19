import type { Updater } from "@tanstack/vue-table";
import type { Ref } from "vue";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function valueUpdater<T extends Updater<unknown>>(
  updaterOrValue: T,
  ref: Ref
) {
  ref.value =
    typeof updaterOrValue === "function"
      ? updaterOrValue(ref.value)
      : updaterOrValue;
}

// Экспорт утилит для кодирования/декодирования ID
export {
  encodeId,
  decodeId,
  isValidId,
  isValidHash,
  convertId,
} from "./idEncoder";

// Экспорт утилит для работы с JSON-LD
export {
  getJsonLdValue,
  getJsonLdValueByPath,
  transformDatasetToTableRow,
  transformSearchResponseToTableData,
  createTableSearchFilter,
  createFiltersObject,
  findDatasetInJsonLd,
  convertJsonLdDatasetToJson,
} from "./jsonld";
