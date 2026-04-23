import { nextTick, type Ref } from "vue";
import type { EditorMode, JsonLdNode } from "../types/editor.types";

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
  /**
   * Recursively normalizes array item keys and preserves object references
   * when nothing changed to reduce unnecessary reactive churn.
   */
  const updateArrayIndices = (nodes: JsonLdNode[]): JsonLdNode[] => {
    let changed = false;

    const mapped = nodes.map((node) => {
      if (node.type === "array" && node.children) {
        let childChanged = false;
        const updatedChildren = node.children.map((child, index) => {
          const normalizedChildren = child.children
            ? updateArrayIndices(child.children)
            : child.children;
          const nextKey = `[${index}]`;
          const keyChanged = child.key !== nextKey;
          const nestedChanged = normalizedChildren !== child.children;
          if (keyChanged || nestedChanged) {
            childChanged = true;
            return {
              ...child,
              key: nextKey,
              children: normalizedChildren,
            };
          }
          return child;
        });

        if (childChanged) {
          changed = true;
          return {
            ...node,
            children: updatedChildren,
          };
        }

        return node;
      }

      if (node.children) {
        const normalizedChildren = updateArrayIndices(node.children);
        if (normalizedChildren !== node.children) {
          changed = true;
          return {
            ...node,
            children: normalizedChildren,
          };
        }
      }

      return node;
    });

    return changed ? mapped : nodes;
  };

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

    const treeWithUpdatedIndices = updateArrayIndices(newTree);
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
    try {
      const parsed = JSON.parse(newCode) as Record<string, unknown>;
      // Preserve MMIO extraMetadata: user cannot edit it in code mode — re-inject from props.
      const out = extraMetadata.value?.length
        ? { ...parsed, "dspace:extraMetadata": extraMetadata.value }
        : parsed;
      const outStr = JSON.stringify(out, null, 2);
      codeData.value = outStr;
      lastEmittedValueRef.value = outStr;
      emitModelValue(out);
    } catch {
      codeData.value = newCode;
      lastEmittedValueRef.value = newCode;
      emitModelValue(newCode);
    }
  };

  return {
    toggleMode,
    handleVisualUpdate,
    handleCodeUpdate,
  };
};
