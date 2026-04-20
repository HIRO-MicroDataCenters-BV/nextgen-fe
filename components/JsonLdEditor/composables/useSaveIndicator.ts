import { ref, onUnmounted } from "vue";

export const useSaveIndicator = () => {
  const saveStatus = ref<"idle" | "saving" | "saved">("idle");
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const triggerSaveIndicator = () => {
    saveStatus.value = "saving";
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveStatus.value = "saved";
      saveTimer = setTimeout(() => {
        saveStatus.value = "idle";
      }, 2500);
    }, 400);
  };

  onUnmounted(() => {
    if (saveTimer) clearTimeout(saveTimer);
  });

  return {
    saveStatus,
    triggerSaveIndicator,
  };
};
