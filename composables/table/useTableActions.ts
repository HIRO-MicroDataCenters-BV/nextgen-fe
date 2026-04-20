import type { Row } from "@tanstack/vue-table";
import type { Ref } from "vue";
import type { TableRowData } from "~/types/table.types";

interface UseTableActionsOptions {
  searchValue: Ref<string>;
  clientSearchTerm: Ref<string>;
  selectedType: Ref<string>;
  applyClientSearch: () => void;
  updateURLQuery: (replace?: boolean) => void;
  fetchData: () => Promise<void>;
  clearSelection: () => void;
  buildTrainingPayload: (rows: Row<TableRowData>[]) => {
    dataset: Array<Record<string, unknown>>;
  };
  emitPassToTraining: (payload: {
    dataset: Array<Record<string, unknown>>;
  }) => void;
  selectedRows: Ref<Row<TableRowData>[]>;
  getSelectedRowIds: () => string[];
  rawById: Ref<Record<string, unknown>>;
}

export const useTableActions = (options: UseTableActionsOptions) => {
  const applySearchFilter = () => {
    options.clientSearchTerm.value = options.searchValue.value;
    options.applyClientSearch();
    options.updateURLQuery();
  };

  const handleSearchUpdate = (value: string) => {
    options.searchValue.value = value;
  };

  const handleTypeTabChange = (type: string | number) => {
    options.selectedType.value = String(type);
    options.updateURLQuery();
    options.fetchData();
  };

  const handlePassToTraining = () => {
    options.emitPassToTraining(
      options.buildTrainingPayload(options.selectedRows.value),
    );
  };

  const handleClearAll = () => {
    options.clearSelection();
  };

  const handleCreate = () => {
    navigateTo("/my_catalog/create");
  };

  const getSelectedRaw = () => {
    const ids = options.getSelectedRowIds();
    return ids
      .map((id) => options.rawById.value[id])
      .filter((value) => value !== undefined);
  };

  return {
    applySearchFilter,
    handleSearchUpdate,
    handleTypeTabChange,
    handlePassToTraining,
    handleClearAll,
    handleCreate,
    getSelectedRaw,
  };
};
