import { useTrainingOrder } from "~/composables/training/useTrainingOrder";

/**
 * Wires global training-order selection (My Catalog) into the table: IDs/names for row
 * selection restore and toolbar chips, plus catalog section flag.
 */
export const useTableTrainingOrderBridge = () => {
  const { page } = useApp();
  const {
    selectedDataset,
    selectedApplication,
    clearSelection: clearTrainingSelection,
  } = useTrainingOrder();

  const isMyCatalog = computed(() => page.value.section === "my_catalog");

  const selectedDatasetId = computed(() => {
    if (!selectedDataset.value) return null;
    const id = selectedDataset.value.id;
    return id ? String(id) : null;
  });

  const selectedApplicationId = computed(() => {
    if (!selectedApplication.value) return null;
    const id = selectedApplication.value.id;
    return id ? String(id) : null;
  });

  const selectedDatasetName = computed(() => {
    if (!selectedDataset.value) return null;
    return String(
      selectedDataset.value.title ||
        selectedDataset.value.name ||
        selectedDataset.value.id ||
        "",
    );
  });

  const selectedApplicationName = computed(() => {
    if (!selectedApplication.value) return null;
    return String(
      selectedApplication.value.title ||
        selectedApplication.value.name ||
        selectedApplication.value.id ||
        "",
    );
  });

  return {
    isMyCatalog,
    selectedDataset,
    selectedApplication,
    clearTrainingSelection,
    selectedDatasetId,
    selectedApplicationId,
    selectedDatasetName,
    selectedApplicationName,
  };
};
