import { computed, type Ref } from "vue";
import type { JsonLdNode, ValidationError } from "../types/editor.types";

interface UseEditorFooterStatsOptions {
  treeData: Ref<JsonLdNode[]>;
  validationErrors: Ref<ValidationError[]>;
}

export const useEditorFooterStats = ({
  treeData,
  validationErrors,
}: UseEditorFooterStatsOptions) => {
  const existingKeys = computed(() => treeData.value.map((node) => node.key));

  const errorCount = computed(
    () =>
      validationErrors.value.filter((error) => error.severity === "error")
        .length,
  );

  const warningCount = computed(
    () =>
      validationErrors.value.filter((error) => error.severity === "warning")
        .length,
  );

  return {
    existingKeys,
    errorCount,
    warningCount,
  };
};
