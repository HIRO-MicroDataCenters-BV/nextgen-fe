import { watch, type Ref } from "vue";
import type { JsonLdNode } from "../types/editor.types";
import { DCAT_AP_CONTEXT } from "../dcatApContext";
import { resolveParsedJsonLdTree } from "../utils/jsonLdTreeInitialization";

interface UseJsonLdTreeInitializationOptions {
  modelValue: Ref<string | Record<string, unknown>>;
  contentFromFile: Ref<boolean>;
  parseJsonLd: (
    input: string | Record<string, unknown>,
  ) => { tree: JsonLdNode[]; context?: Record<string, string> };
  buildDefaultDatasetTree: () => JsonLdNode[];
  isEmptyDataset: (tree: JsonLdNode[]) => boolean;
  mergeDatasetTreeWithDefaults: (tree: JsonLdNode[]) => JsonLdNode[];
  treeData: Ref<JsonLdNode[]>;
  codeData: Ref<string>;
  preservedContext: Ref<Record<string, string> | undefined>;
  lastEmittedValueRef: Ref<string>;
}

export const useJsonLdTreeInitialization = ({
  modelValue,
  contentFromFile,
  parseJsonLd,
  buildDefaultDatasetTree,
  isEmptyDataset,
  mergeDatasetTreeWithDefaults,
  treeData,
  codeData,
  preservedContext,
  lastEmittedValueRef,
}: UseJsonLdTreeInitializationOptions) => {
  const applyParsedTree = (
    tree: JsonLdNode[],
    context: Record<string, string> | undefined,
  ) => {
    const resolved = resolveParsedJsonLdTree({
      tree,
      context,
      contentFromFile: contentFromFile.value,
      buildDefaultDatasetTree,
      isEmptyDataset,
      mergeDatasetTreeWithDefaults,
    });
    treeData.value = resolved.treeData;
    preservedContext.value = resolved.preservedContext;
  };

  const parseInitialData = () => {
    try {
      const { tree, context } = parseJsonLd(modelValue.value);
      applyParsedTree(tree, context);

      if (typeof modelValue.value === "string") {
        codeData.value = modelValue.value;
      } else {
        codeData.value = JSON.stringify(modelValue.value, null, 2);
      }
    } catch (error) {
      console.error("Failed to parse JSON-LD:", error);
      treeData.value = buildDefaultDatasetTree();
      preservedContext.value = { ...DCAT_AP_CONTEXT };
      codeData.value =
        typeof modelValue.value === "string" ? modelValue.value : "";
    }
  };

  parseInitialData();

  watch(
    modelValue,
    (newVal) => {
      const incomingStr =
        typeof newVal === "string" ? newVal : JSON.stringify(newVal);
      if (lastEmittedValueRef.value && incomingStr === lastEmittedValueRef.value) {
        return;
      }
      parseInitialData();
    },
    { deep: true },
  );

  watch(contentFromFile, () => {
    parseInitialData();
  });

  return {
    applyParsedTree,
    parseInitialData,
  };
};
