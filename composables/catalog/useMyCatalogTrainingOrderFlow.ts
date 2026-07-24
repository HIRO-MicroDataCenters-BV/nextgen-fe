import { useTrainingOrder } from "~/composables/training/useTrainingOrder";

export type SelectionContextPayload = {
  selectedType: string;
  selectedIds: string[];
  selectedRaw: Array<Record<string, unknown>>;
};

export type PassToTrainingPayload = {
  dataset: Array<Record<string, unknown>>;
  application?: Record<string, unknown> | null;
};

/**
 * My Catalog: sync table selection with global training order, review dialog, checkout.
 */
export const useMyCatalogTrainingOrderFlow = (options: {
  handlePassToTraining: (payload: PassToTrainingPayload) => Promise<void> | void;
}) => {
  const toaster = useToaster();
  const { selectedDataset, selectedApplication, setSelection } = useTrainingOrder();
  const showTrainingReviewDialog = ref(false);

  const onSelectionContextChange = (value: SelectionContextPayload) => {
    if (value.selectedType === "datasets" || value.selectedType === "applications") {
      setSelection(
        value.selectedType,
        value.selectedRaw,
        value.selectedIds[0] ?? null,
      );
    }
  };

  const onPassToTrainingRequest = () => {
    if (!selectedDataset.value) {
      toaster.show("error", "Select a dataset before passing to training.");
      return;
    }
    showTrainingReviewDialog.value = true;
  };

  const confirmTrainingOrderSubmit = async (value: {
    includeApplication: boolean;
  }) => {
    if (!selectedDataset.value) {
      toaster.show("error", "Application cannot be sent without a dataset.");
      return;
    }

    await options.handlePassToTraining({
      dataset: [selectedDataset.value],
      application:
        value.includeApplication && selectedApplication.value
          ? selectedApplication.value
          : null,
    });
    showTrainingReviewDialog.value = false;
  };

  return {
    selectedDataset,
    selectedApplication,
    showTrainingReviewDialog,
    onSelectionContextChange,
    onPassToTrainingRequest,
    confirmTrainingOrderSubmit,
  };
};
