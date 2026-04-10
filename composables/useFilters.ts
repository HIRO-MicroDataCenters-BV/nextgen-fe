import { ref, onMounted } from "vue";

export interface FilterItem {
  key: string;
  label: string;
  type: "checkbox" | "select" | "text" | "number";
  value: boolean | number | string | null;
}

export interface FilterGroup {
  key: string;
  label: string;
  items: FilterItem[];
}

export const useFilters = () => {
  const filterGroups = ref<FilterGroup[]>([]);
  const isLoading = ref(true);

  const fetchFilters = async () => {
    const api = useApi();
    const groups = await api.getFilters();
    filterGroups.value = groups.map((group) => ({
      key: group.id,
      label: group.label,
      items: group.items.map((item) => ({
        key: item.id,
        label: item.label,
        type: "checkbox" as const,
        value: null as boolean | number | string | null,
      })),
    }));
    isLoading.value = false;
  };

  onMounted(() => {
    fetchFilters();
  });

  const getActiveFilters = () => {
    const activeFilters: Record<string, unknown> = {};

    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        if (item.value !== null) {
          activeFilters[item.key] = item.value;
        }
      });
    });

    return activeFilters;
  };

  const resetFilters = () => {
    filterGroups.value.forEach((group) => {
      group.items.forEach((item) => {
        item.value = null;
      });
    });
  };

  return {
    filterGroups,
    isLoading,
    getActiveFilters,
    resetFilters,
    fetchFilters,
  };
};
