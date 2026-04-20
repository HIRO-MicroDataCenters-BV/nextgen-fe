import type { Ref } from "vue";
import type { FieldDefinition, JsonLdNode } from "../types/editor.types";

interface UseJsonLdNodeActionsOptions {
  node: Ref<JsonLdNode>;
  emitUpdate: (node: JsonLdNode) => void;
  emitRemove: (nodeId: string) => void;
  getFieldDefinition: (key: string) => FieldDefinition | undefined;
  distributionSchema: Record<string, FieldDefinition>;
  createDefaultNode: (definition: FieldDefinition) => JsonLdNode;
}

const createNodeId = () =>
  `node_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const cloneEmptyNode = (src: JsonLdNode): JsonLdNode => ({
  ...src,
  id: createNodeId(),
  value: src.children ? undefined : (src.metadata.defaultValue ?? ""),
  children: src.children?.map(cloneEmptyNode),
  metadata: { ...src.metadata, isNew: false },
});

export const useJsonLdNodeActions = (options: UseJsonLdNodeActionsOptions) => {
  const handleFieldUpdate = (value: unknown) => {
    options.emitUpdate({ ...options.node.value, value });
  };

  const handleChildUpdate = (updatedChild: JsonLdNode) => {
    if (!options.node.value.children) return;
    options.emitUpdate({
      ...options.node.value,
      children: options.node.value.children.map((child) =>
        child.id === updatedChild.id ? updatedChild : child,
      ),
    });
  };

  const handleChildRemove = (childId: string) => {
    if (!options.node.value.children) return;
    options.emitUpdate({
      ...options.node.value,
      children: options.node.value.children.filter((child) => child.id !== childId),
    });
  };

  const handleRemove = () => {
    options.emitRemove(options.node.value.id);
  };

  const handleAddArrayItem = () => {
    if (options.node.value.type !== "array") return;

    let newItem: JsonLdNode;
    const existingItems = options.node.value.children ?? [];
    const nextIndex = existingItems.length;

    if (existingItems.length > 0) {
      const firstItem = existingItems[0];
      if (!firstItem) return;
      newItem = cloneEmptyNode(firstItem);
      newItem.key = `[${nextIndex}]`;
      newItem.metadata = { ...newItem.metadata, isNew: true };
    } else {
      const fieldDef = options.getFieldDefinition(options.node.value.key);
      const schemaChildren = fieldDef?.distributionContext
        ? Object.values(options.distributionSchema).map(options.createDefaultNode)
        : fieldDef?.children
          ? Object.values(fieldDef.children).map(options.createDefaultNode)
          : [];

      newItem = {
        id: createNodeId(),
        key: `[${nextIndex}]`,
        type: "object",
        children: schemaChildren,
        metadata: {
          required: false,
          readonly: false,
          repeatable: false,
          isNew: true,
        },
      };
    }

    options.emitUpdate({
      ...options.node.value,
      children: [...existingItems, newItem],
    });
  };

  return {
    handleFieldUpdate,
    handleChildUpdate,
    handleChildRemove,
    handleRemove,
    handleAddArrayItem,
  };
};
