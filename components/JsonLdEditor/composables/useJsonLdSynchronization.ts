import { nextTick, type Ref } from "vue";
import type { EditorMode, JsonLdNode } from "../types/editor.types";
import { updateJsonLdArrayIndices } from "../utils/jsonLdTreeArrayIndices";
import { applyJsonLdCodeUpdate } from "../utils/jsonLdCodeUpdate";

interface UseJsonLdSynchronizationOptions {
  currentMode: Ref<EditorMode>;
  treeData: Ref<JsonLdNode[]>;
  codeData: Ref<string>;
  preservedContext: Ref<Record<string, string> | undefined>;
  editorContentRef: Ref<HTMLElement | null>;
  extraMetadata: Ref<Array<Record<string, unknown>> | null | undefined>;
  lastEmittedValueRef: Ref<string>;
  triggerSaveIndicator: () => void;
  parseJsonLd: (
    input: string | Record<string, unknown>,
  ) => { tree: JsonLdNode[]; context?: Record<string, string> };
  serializeJsonLd: (
    tree: JsonLdNode[],
    context?: Record<string, string>,
    format?: "string" | "object",
  ) => string | Record<string, unknown>;
  applyParsedTree: (
    tree: JsonLdNode[],
    context: Record<string, string> | undefined,
  ) => void;
  emitModelValue: (value: string | Record<string, unknown>) => void;
}

export const useJsonLdSynchronization = ({
  currentMode,
  treeData,
  codeData,
  preservedContext,
  editorContentRef,
  extraMetadata,
  lastEmittedValueRef,
  triggerSaveIndicator,
  parseJsonLd,
  serializeJsonLd,
  applyParsedTree,
  emitModelValue,
}: UseJsonLdSynchronizationOptions) => {
  const toggleMode = (checked: boolean) => {
    const newMode: EditorMode = checked ? "code" : "visual";

    if (newMode === "code" && currentMode.value === "visual") {
      try {
        codeData.value = serializeJsonLd(
          treeData.value,
          preservedContext.value,
          "string",
        ) as string;
      } catch (error) {
        console.error("Failed to serialize to code:", error);
      }
    } else if (newMode === "visual" && currentMode.value === "code") {
      try {
        const { tree, context } = parseJsonLd(codeData.value);
        applyParsedTree(tree, context);
      } catch (error) {
        console.error("Failed to parse code:", error);
      }
    }

    currentMode.value = newMode;
  };

  const handleVisualUpdate = (newTree: JsonLdNode[]) => {
    triggerSaveIndicator();
    const savedScroll = editorContentRef.value?.scrollTop || 0;

    const treeWithUpdatedIndices = updateJsonLdArrayIndices(newTree);
    treeData.value = treeWithUpdatedIndices;

    const serialized = serializeJsonLd(
      treeWithUpdatedIndices,
      preservedContext.value,
      "object",
    ) as Record<string, unknown>;

    lastEmittedValueRef.value = JSON.stringify(serialized);
    emitModelValue(serialized);

    nextTick(() => {
      if (editorContentRef.value) {
        editorContentRef.value.scrollTop = savedScroll;
      }
    });
  };

  const handleCodeUpdate = (newCode: string) => {
    triggerSaveIndicator();
    const result = applyJsonLdCodeUpdate(newCode, extraMetadata.value);
    codeData.value = result.codeData;
    lastEmittedValueRef.value = result.lastEmitted;
    emitModelValue(result.modelValue);
  };

  return {
    toggleMode,
    handleVisualUpdate,
    handleCodeUpdate,
  };
};
