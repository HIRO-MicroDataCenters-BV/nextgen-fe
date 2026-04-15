import { computed, ref } from "vue";

export const useDiscardGuard = ({
  initialValues,
  values,
  goBack,
}: {
  initialValues?: Record<string, unknown>;
  values: Record<string, unknown>;
  goBack: () => void;
}) => {
  const showDiscardDialog = ref(false);
  const hasChanges = computed(() => {
    if (!initialValues) return false;
    return JSON.stringify(initialValues) !== JSON.stringify(values);
  });

  const handleDiscard = () => {
    if (hasChanges.value) {
      showDiscardDialog.value = true;
    } else {
      goBack();
    }
  };

  const confirmDiscard = () => {
    showDiscardDialog.value = false;
    goBack();
  };

  return { showDiscardDialog, hasChanges, handleDiscard, confirmDiscard };
};
