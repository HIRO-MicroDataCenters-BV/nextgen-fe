import { watch, type Ref } from "vue";
import type { JsonLdNode } from "../types/editor.types";

interface UseJsonLdExtraMetadataOptions {
  extraMetadata: Ref<Array<Record<string, unknown>> | null | undefined>;
  treeData: Ref<JsonLdNode[]>;
  parseJsonLdToTree: (data: Record<string, unknown>) => JsonLdNode[];
  makeNodeId: () => string;
}

export const useJsonLdExtraMetadata = ({
  extraMetadata,
  treeData,
  parseJsonLdToTree,
  makeNodeId,
}: UseJsonLdExtraMetadataOptions) => {
  watch(
    extraMetadata,
    (newExtra) => {
      const treeWithoutExtra = treeData.value.filter(
        (n) => n.key !== "dspace:extraMetadata",
      );

      if (!newExtra || newExtra.length === 0) {
        // New file / cleared — remove dspace:extraMetadata, all fields editable again.
        if (treeData.value.length !== treeWithoutExtra.length) {
          treeData.value = treeWithoutExtra;
        }
        return;
      }

      const setReadonlyFromMmioRecursive = (nodes: JsonLdNode[]): void => {
        for (const n of nodes) {
          n.metadata.readonly = true;
          (n.metadata as unknown as Record<string, unknown>).fromMmio = true;
          if (n.children?.length) setReadonlyFromMmioRecursive(n.children);
        }
      };

      const extraChildren = newExtra.map((item, index) => {
        const parsed = parseJsonLdToTree(item as Record<string, unknown>);
        setReadonlyFromMmioRecursive(parsed);
        return {
          id: makeNodeId(),
          key: `[${index}]`,
          type: "object" as const,
          children: parsed,
          metadata: {
            required: false,
            readonly: true,
            repeatable: false,
            hidden: false,
            label: undefined,
            fromMmio: true,
          },
        };
      });

      const extraNode = {
        id: makeNodeId(),
        key: "dspace:extraMetadata",
        type: "array" as const,
        children: extraChildren,
        metadata: {
          required: false,
          readonly: true,
          repeatable: false,
          hidden: false,
          label: "Extra Metadata (from MMIO)",
          fromMmio: true,
        },
      };

      treeData.value = [...treeWithoutExtra, extraNode];
    },
    { deep: true },
  );
};
