import { nextTick, ref, shallowRef, type Ref } from "vue";
import type { TableDataResponse, TableRowData } from "~/types/table.types";
import {
  categorizeDctermsTypeId,
  DCMI_TYPE_DATASET,
} from "~/utils/metadataItemTypeConsistency";

type SelectedFilterValue = boolean | string | number;

interface UseTableDataSourceOptions {
  dataSource: (params: unknown) => Promise<TableDataResponse>;
  selectedType: Ref<string>;
  selectedFilters: Ref<Record<string, SelectedFilterValue>>;
  clientSearchTerm: Ref<string>;
  getActiveFilters: () => Record<string, SelectedFilterValue>;
  getPagination: () => { page: number; limit: number };
  clearSelection: () => void;
}

const filterRowsBySelectedType = (rows: TableRowData[], selectedType: string) => {
  if (selectedType === "datasets") {
    return rows.filter((row) => {
      const datasetType = row.datasetType as string | undefined;
      return (
        !datasetType ||
        datasetType === DCMI_TYPE_DATASET ||
        categorizeDctermsTypeId(datasetType) === "dataset"
      );
    });
  }

  if (selectedType === "applications") {
    return rows.filter((row) => {
      const datasetType = row.datasetType as string | undefined;
      return datasetType
        ? categorizeDctermsTypeId(datasetType) === "software"
        : false;
    });
  }

  return rows;
};

export const useTableDataSource = (options: UseTableDataSourceOptions) => {
  const serverData = shallowRef<TableRowData[]>([]);
  const data = shallowRef<TableRowData[]>([]);
  const rawById = ref<Record<string, unknown>>({});
  const isLoading = ref(true);

  let isFetching = false;
  let pendingFetch = false;

  const applyClientSearch = () => {
    const term = options.clientSearchTerm.value?.toLowerCase().trim();
    if (!term) {
      data.value = serverData.value;
      return;
    }

    data.value = serverData.value.filter((row) =>
      Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      }),
    );
  };

  const fetchData = async () => {
    if (isFetching) {
      pendingFetch = true;
      return;
    }

    isFetching = true;
    pendingFetch = false;
    options.clearSelection();
    isLoading.value = true;

    try {
      const { page, limit } = options.getPagination();
      const response = await options.dataSource({
        page,
        limit,
        type: options.selectedType.value,
        filters: {
          ...options.selectedFilters.value,
          ...options.getActiveFilters(),
        },
      });

      rawById.value = {};
      const responseData = response as { originals?: unknown[]; data?: TableRowData[] };

      if (Array.isArray(responseData.originals)) {
        const originals = responseData.originals;
        const preparedRows = responseData.data ?? [];
        preparedRows.forEach((row, index) => {
          rawById.value[String(row.id)] = originals[index];
        });
      }

      const rows = filterRowsBySelectedType(
        responseData.data ?? [],
        options.selectedType.value,
      ).map((row) => {
        const original = rawById.value[String(row.id)];
        return {
          ...row,
          _raw: original,
          _rawJson: original !== undefined ? JSON.stringify(original) : undefined,
        } as unknown as TableRowData;
      });

      serverData.value = rows;
      applyClientSearch();
    } catch {
      serverData.value = [];
      data.value = [];
    } finally {
      isFetching = false;
      isLoading.value = false;
      if (pendingFetch) {
        pendingFetch = false;
        nextTick(() => fetchData());
      }
    }
  };

  return {
    data,
    serverData,
    rawById,
    isLoading,
    applyClientSearch,
    fetchData,
  };
};
