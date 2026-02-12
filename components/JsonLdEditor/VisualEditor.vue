<template>
  <div class="visual-editor p-4">
    <div v-if="modelValue.length === 0" class="empty-state text-center py-12">
      <Icon name="lucide:file-json" class="size-12 mx-auto text-muted-foreground mb-4" />
      <p class="text-muted-foreground">No metadata to display</p>
      <Button type="button" class="mt-4" @click="showAddFieldDialog = true">
        <Icon name="lucide:plus" class="size-4 mr-2" />
        Add Field
      </Button>
    </div>

    <div v-else class="tree-container space-y-2">
      <JsonLdNode
        v-for="node in modelValue"
        :key="node.id"
        :node="node"
        :readonly="readonly"
        @update="handleNodeUpdate"
        @remove="handleNodeRemove"
      />
      
      <Button
        v-if="!readonly"
        type="button"
        variant="outline"
        size="sm"
        class="mt-4"
        @click="showAddFieldDialog = true"
      >
        <Icon name="lucide:plus" class="size-4 mr-2" />
        Add Field
      </Button>
    </div>

    <AddFieldDialog
      v-model:open="showAddFieldDialog"
      @confirm="handleAddField"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import type { JsonLdNode as JsonLdNodeType, JsonLdNodeType as NodeType } from './types/editor.types';
import JsonLdNode from './components/JsonLdNode.vue';
import AddFieldDialog from './components/AddFieldDialog.vue';

interface Props {
  modelValue: JsonLdNodeType[];
  readonly?: boolean;
  context?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [nodes: JsonLdNodeType[]];
}>();

const showAddFieldDialog = ref(false);

const handleNodeUpdate = (updatedNode: JsonLdNodeType) => {
  const updateNodeInTree = (nodes: JsonLdNodeType[]): JsonLdNodeType[] => {
    return nodes.map(node => {
      if (node.id === updatedNode.id) {
        return updatedNode;
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeInTree(node.children),
        };
      }
      return node;
    });
  };

  emit('update:modelValue', updateNodeInTree(props.modelValue));
};

const handleNodeRemove = (nodeId: string) => {
  const removeNodeFromTree = (nodes: JsonLdNodeType[]): JsonLdNodeType[] => {
    return nodes
      .filter(node => node.id !== nodeId)
      .map(node => {
        if (node.children) {
          return {
            ...node,
            children: removeNodeFromTree(node.children),
          };
        }
        return node;
      });
  };

  emit('update:modelValue', removeNodeFromTree(props.modelValue));
};

const handleAddField = (fieldName: string, fieldType: NodeType) => {
  const newNode: JsonLdNodeType = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    key: fieldName,
    type: fieldType,
    value: fieldType === 'object' || fieldType === 'array' ? undefined : '',
    children: fieldType === 'array' ? [] : undefined,
    metadata: {
      required: false,
      readonly: false,
      repeatable: fieldType === 'array',
    },
  };
  
  emit('update:modelValue', [...props.modelValue, newNode]);
};
</script>

<style scoped>
.visual-editor {
  min-height: 400px;
}

.tree-container {
  max-width: 100%;
}
</style>
