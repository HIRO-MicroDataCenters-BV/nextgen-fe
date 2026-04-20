import { computed, type Ref } from "vue";
import type { DropdownMenuItem } from "~/types/table.types";

type FilterValue = boolean | string | number;

interface FilterGroupItem {
  key: string;
  label: string;
  type?: "checkbox" | "select" | "text" | "number";
  value: FilterValue | null;
}

interface FilterGroup {
  key: string;
  label: string;
  items: FilterGroupItem[];
}

interface UseTableFilterControlsOptions {
  filterGroups: Ref<FilterGroup[]>;
  selectedFilters: Ref<Record<string, FilterValue>>;
  searchValue: Ref<string>;
  clientSearchTerm: Ref<string>;
  selectedFilterColumn: Ref<string>;
  currentPage: Ref<number>;
  isUpdatingFromState: Ref<boolean>;
  applyClientSearch: () => void;
  updateURLQuery: (replace?: boolean) => void;
  fetchData: () => Promise<void>;
  resetPageIndex: () => void;
}

export const useTableFilterControls = (options: UseTableFilterControlsOptions) => {
  const stopUpdatingState = () => {
    options.isUpdatingFromState.value = false;
  };

  const mutateFilterItems = (callback: (item: FilterGroupItem) => void) => {
    options.filterGroups.value.forEach((group) => {
      group.items.forEach((item) => callback(item));
    });
    options.filterGroups.value = [...options.filterGroups.value];
  };

  const withGuardedUpdate = (callback: () => void) => {
    options.isUpdatingFromState.value = true;
    const safetyTimeout = setTimeout(stopUpdatingState, 10000);
    callback();
    options.fetchData().finally(() => {
      clearTimeout(safetyTimeout);
      options.isUpdatingFromState.value = false;
    });
  };

  const handleFilterChange = (
    key: string,
    value: FilterValue,
    multiple: boolean,
  ) => {
    withGuardedUpdate(() => {
      if (!multiple) {
        options.selectedFilters.value = {};
        mutateFilterItems((item) => {
          if (item.key !== key) item.value = null;
        });
      }

      if (value) {
        options.selectedFilters.value[key] = value;
        mutateFilterItems((item) => {
          if (item.key === key) item.value = value;
        });
      } else {
        const { [key]: _, ...rest } = options.selectedFilters.value;
        options.selectedFilters.value = rest;
        mutateFilterItems((item) => {
          if (item.key === key) item.value = null;
        });
      }

      options.searchValue.value = "";
      options.clientSearchTerm.value = "";
      options.applyClientSearch();
      options.updateURLQuery(true);
    });
  };

  const handleRemoveFilter = (key: string) => {
    withGuardedUpdate(() => {
      const { [key]: _, ...rest } = options.selectedFilters.value;
      options.selectedFilters.value = rest;
      options.currentPage.value = 0;
      options.resetPageIndex();

      mutateFilterItems((item) => {
        if (item.key === key) item.value = null;
      });

      options.updateURLQuery(true);
    });
  };

  const handleClearAllFilters = () => {
    withGuardedUpdate(() => {
      options.selectedFilters.value = {};
      options.searchValue.value = "";
      options.clientSearchTerm.value = "";
      options.selectedFilterColumn.value = "all";
      options.currentPage.value = 0;
      options.resetPageIndex();

      mutateFilterItems((item) => {
        item.value = null;
      });

      options.applyClientSearch();
      options.updateURLQuery(true);
    });
  };

  const filterItems = computed<DropdownMenuItem[]>(() =>
    options.filterGroups.value.map((group) => ({
      key: group.key,
      label: group.label,
      children: group.items.map((item) => ({
        key: item.key,
        type: item.type,
        value: item.key,
        label: item.label,
      })),
    })),
  );

  const filterLabelByKey = computed(() => {
    const map: Record<string, string> = {};
    options.filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        map[item.key] = item.label;
      });
    });
    return map;
  });

  const selectedFilterKeys = computed(() => {
    const keys: string[] = [];

    options.filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        if (item.value !== null && item.value !== false && !keys.includes(item.key)) {
          keys.push(item.key);
        }
      });
    });

    Object.keys(options.selectedFilters.value).forEach((key) => {
      const value = options.selectedFilters.value[key];
      if (value !== false && value !== null && !keys.includes(key)) {
        keys.push(key);
      }
    });

    return keys;
  });

  return {
    filterItems,
    filterLabelByKey,
    selectedFilterKeys,
    handleFilterChange,
    handleRemoveFilter,
    handleClearAllFilters,
  };
};
