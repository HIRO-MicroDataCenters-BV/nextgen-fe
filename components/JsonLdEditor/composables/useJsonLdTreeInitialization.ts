import { watch, type Ref } from "vue";
import type { JsonLdNode } from "../types/editor.types";
import { DCAT_AP_CONTEXT } from "../dcatApContext";

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
  const nodeHasValue = (n: JsonLdNode): boolean => {
    if (n.value !== undefined && n.value !== null && n.value !== "") return true;
    if (n.children?.length) return n.children.some(nodeHasValue);
    return false;
  };

  const markFileNodesRecursive = (nodes: JsonLdNode[]): void => {
    for (const n of nodes) {
      if (nodeHasValue(n)) {
        // Use a dedicated 'fromFile' flag — do NOT set readonly: true to avoid
        // triggering the existing "hide readonly/system nodes" logic in the template.
        (n.metadata as unknown as Record<string, unknown>).fromFile = true;
      }
      if (n.children?.length) markFileNodesRecursive(n.children);
    }
  };

  const applyParsedTree = (
    tree: JsonLdNode[],
    context: Record<string, string> | undefined,
  ) => {
    if (isEmptyDataset(tree)) {
      const hiddenNodes = tree.filter((n) => n.metadata.hidden || n.metadata.readonly);
      const defaultTree = buildDefaultDatasetTree();
      treeData.value = [...defaultTree, ...hiddenNodes];
    } else {
      let next = tree;
      if (!contentFromFile.value) {
        next = mergeDatasetTreeWithDefaults(tree);
      }
      if (contentFromFile.value) {
        markFileNodesRecursive(next);
      }
      treeData.value = next;
    }

    preservedContext.value = context
      ? { ...DCAT_AP_CONTEXT, ...context }
      : { ...DCAT_AP_CONTEXT };
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
      codeData.value = typeof modelValue.value === "string" ? modelValue.value : "";
    }
  };

  parseInitialData();

  watch(
    modelValue,
    (newVal) => {
      // Skip if the incoming value matches what we last emitted internally (prevents loops).
      const incomingStr = typeof newVal === "string" ? newVal : JSON.stringify(newVal);
      if (lastEmittedValueRef.value && incomingStr === lastEmittedValueRef.value) {
        return;
      }
      parseInitialData();
    },
    { deep: true },
  );

  // When file origin changes, re-parse with the matching behavior.
  watch(contentFromFile, () => {
    parseInitialData();
  });

  return {
    applyParsedTree,
    parseInitialData,
  };
};
