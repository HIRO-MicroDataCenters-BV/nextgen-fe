<template>
  <div class="visual-editor p-4">
    <!-- Validation Summary -->
    <ValidationSummary 
      v-if="validationErrors.length > 0"
      :errors="validationErrors"
      @jump-to-error="handleJumpToError"
    />

    <div v-if="modelValue.length === 0" class="empty-state text-center py-12">
      <Icon name="lucide:file-json" class="size-12 mx-auto text-muted-foreground mb-4" />
      <p class="text-muted-foreground">{{ t('jsonld.editor.noMetadata') }}</p>
      <Button type="button" class="mt-4" @click="showAddFieldDialog = true">
        <Icon name="lucide:plus" class="size-4 mr-2" />
        {{ t('jsonld.editor.addField') }}
      </Button>
    </div>

    <div v-else class="tree-container space-y-4">
      <!-- Field Search -->
      <div class="search-container mb-4">
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            v-model="searchQuery"
            placeholder="Search fields..."
            class="pl-9"
          />
          <Button
            v-if="searchQuery"
            variant="ghost"
            size="sm"
            class="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            @click="searchQuery = ''"
          >
            <Icon name="lucide:x" class="size-4" />
          </Button>
        </div>
      </div>

      <!-- Grouped by Category -->
      <Collapsible
        v-for="category in filteredCategories"
        :key="category"
        v-show="filteredNodes[category]?.length > 0"
        :default-open="true"
        class="category-group"
      >
        <CollapsibleTrigger as-child>
          <Button variant="ghost" class="w-full justify-between p-3 h-auto">
            <span class="text-sm font-semibold">{{ t(`jsonld.editor.categories.${category}`) }}</span>
            <Icon name="lucide:chevron-down" class="size-4 transition-transform duration-200" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="space-y-2 pt-2">
          <JsonLdNode
            v-for="node in filteredNodes[category]"
            :key="node.id"
            :node="node"
            :readonly="readonly"
            :validation-errors="validationErrors"
            @update="handleNodeUpdate"
            @remove="handleNodeRemove"
          />
        </CollapsibleContent>
      </Collapsible>
      
      <Button
        v-if="!readonly"
        type="button"
        variant="outline"
        size="sm"
        class="mt-4"
        @click="showAddFieldDialog = true"
      >
        <Icon name="lucide:plus" class="size-4 mr-2" />
        {{ t('jsonld.editor.addField') }}
      </Button>
    </div>

    <AddFieldDialog
      v-model:open="showAddFieldDialog"
      @confirm="handleAddField"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { JsonLdNode as JsonLdNodeType, JsonLdNodeType as NodeType, ValidationError } from './types/editor.types';
import JsonLdNode from './components/JsonLdNode.vue';
import AddFieldDialog from './components/AddFieldDialog.vue';
import ValidationSummary from './components/ValidationSummary.vue';

interface Props {
  modelValue: JsonLdNodeType[];
  readonly?: boolean;
  context?: Record<string, string>;
  validationErrors?: ValidationError[];
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  context: () => ({}),
  validationErrors: () => [],
});

const { t } = useI18n();

const emit = defineEmits<{
  'update:modelValue': [nodes: JsonLdNodeType[]];
}>();

const showAddFieldDialog = ref(false);
const searchQuery = ref('');

// Category order for display
const categoryOrder = ['basic', 'coverage', 'rights', 'contact', 'technical', 'other'] as const;

// Group nodes by category
const groupedNodes = computed(() => {
  const groups: Record<string, typeof props.modelValue> = {
    basic: [],
    coverage: [],
    rights: [],
    contact: [],
    technical: [],
    other: [],
  };

  for (const node of props.modelValue) {
    const category = node.metadata.category || 'other';
    if (groups[category]) {
      groups[category].push(node);
    } else {
      groups.other.push(node);
    }
  }

  return groups;
});

// Get visible categories (with nodes)
const visibleCategories = computed(() => {
  return categoryOrder.filter(cat => groupedNodes.value[cat].length > 0);
});

// Filter nodes by search query
const filteredNodes = computed(() => {
  if (!searchQuery.value) return groupedNodes.value;
  
  const query = searchQuery.value.toLowerCase();
  const filtered: Record<string, typeof props.modelValue> = {
    basic: [],
    coverage: [],
    rights: [],
    contact: [],
    technical: [],
    other: [],
  };
  
  for (const [category, nodes] of Object.entries(groupedNodes.value)) {
    filtered[category] = nodes.filter(node => {
      const matchesKey = node.key.toLowerCase().includes(query);
      const matchesLabel = node.metadata.label?.toLowerCase().includes(query);
      const matchesDescription = node.metadata.description?.toLowerCase().includes(query);
      return matchesKey || matchesLabel || matchesDescription;
    });
  }
  
  return filtered;
});

// Get filtered categories (only show categories with filtered nodes)
const filteredCategories = computed(() => {
  return categoryOrder.filter(cat => filteredNodes.value[cat].length > 0);
});

// Handle jump to error from validation summary
const handleJumpToError = (path: string) => {
  // Scroll to the field with error
  // For now, just expand all categories to show the field
  console.log('Jump to error:', path);
  // TODO: Implement smooth scroll to field
};

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
