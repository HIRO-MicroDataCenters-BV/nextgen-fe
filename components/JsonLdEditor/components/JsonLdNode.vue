<template>
  <div
    v-if="!node.metadata.hidden"
    ref="nodeRef"
    :data-node-id="node.id"
    class="jsonld-node"
    :class="{ 
      'node-readonly': node.metadata.readonly,
      'node-highlight': isNewlyAdded
    }"
    :style="{ paddingLeft: `${depth * 1.5}rem` }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="node-header flex items-center gap-2 py-2">
      <Button
        v-if="hasChildren"
        type="button"
        variant="ghost"
        size="icon"
        class="size-6"
        @click="toggleExpanded"
      >
        <Icon
          :name="isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
          class="size-4"
        />
      </Button>
      <div v-else class="size-6" />

      <Icon
        :name="getNodeIcon(node.type)"
        class="size-4 text-muted-foreground"
      />

      <span class="node-key font-mono text-sm flex items-center gap-1">
        {{ node.key }}
        <span v-if="node.metadata.required && !node.value" class="text-destructive font-bold">*</span>
        <Icon
          v-if="node.metadata.readonly"
          name="lucide:lock"
          class="size-3 text-muted-foreground"
        />
      </span>

      <NodeControls
        v-if="!node.metadata.readonly"
        :node-type="node.type"
        :can-add="node.type === 'array' && node.metadata.repeatable"
        :can-remove="canRemoveNode"
        :readonly="readonly || node.metadata.readonly"
        :is-hovered="isHovered"
        @add="handleAddArrayItem"
        @remove="handleRemove"
      />

      <div v-if="!hasChildren" class="node-value flex-1">
        <JsonLdField
          :node="node"
          :readonly="readonly || node.metadata.readonly"
          @update="handleFieldUpdate"
        />
      </div>

      <Button
        v-if="!readonly && !node.metadata.readonly"
        type="button"
        variant="ghost"
        size="icon"
        class="size-6 opacity-0 group-hover:opacity-100"
        @click="handleRemove"
      >
        <Icon name="lucide:x" class="size-4" />
      </Button>
    </div>


    <div v-if="isExpanded && hasChildren" class="node-children">
      <JsonLdNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :readonly="readonly || node.metadata.readonly"
        :depth="depth + 1"
        @update="handleChildUpdate"
        @remove="handleChildRemove"
        @scroll-to-new="(nodeId) => emit('scrollToNew', nodeId)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button } from '@/components/ui/button';
import type { JsonLdNode as JsonLdNodeType, JsonLdNodeType as NodeType } from '../types/editor.types';
import JsonLdField from './JsonLdField.vue';
import NodeControls from './NodeControls.vue';

interface Props {
  node: JsonLdNodeType;
  readonly?: boolean;
  depth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  depth: 0,
});

// Debug: Log readonly status for extraMetadata
if (props.node.key === 'dspace:extraMetadata') {
  console.log('ExtraMetadata node:', {
    key: props.node.key,
    readonly: props.node.metadata.readonly,
    metadata: props.node.metadata,
  });
}

const emit = defineEmits<{
  update: [node: JsonLdNodeType];
  remove: [nodeId: string];
  scrollToNew: [nodeId: string];
}>();

const isExpanded = ref(true);
const isHovered = ref(false);

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

const canRemoveNode = computed(() => {
  return !props.node.metadata.required;
});

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const nodeRef = ref<HTMLElement | null>(null);
const isNewlyAdded = ref(false);

const getNodeIcon = (type: NodeType): string => {
  const icons: Record<NodeType, string> = {
    object: 'lucide:braces',
    array: 'lucide:brackets',
    string: 'lucide:text',
    number: 'lucide:hash',
    boolean: 'lucide:toggle-left',
    date: 'lucide:calendar',
    uri: 'lucide:link',
    'language-string': 'lucide:languages',
  };
  return icons[type] || 'lucide:circle';
};

const handleFieldUpdate = (value: unknown) => {
  emit('update', {
    ...props.node,
    value,
  });
};

const handleChildUpdate = (updatedChild: JsonLdNodeType) => {
  if (!props.node.children) return;

  const updatedChildren = props.node.children.map(child =>
    child.id === updatedChild.id ? updatedChild : child
  );

  emit('update', {
    ...props.node,
    children: updatedChildren,
  });
};

const handleChildRemove = (childId: string) => {
  if (!props.node.children) return;

  const updatedChildren = props.node.children.filter(child => child.id !== childId);

  emit('update', {
    ...props.node,
    children: updatedChildren,
  });
};

const handleRemove = () => {
  emit('remove', props.node.id);
};

const handleAddArrayItem = () => {
  if (props.node.type !== 'array' || !props.node.children) return;
  
  // Create a new item based on the first child's structure
  const template = props.node.children[0];
  const newItem: JsonLdNodeType = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    key: template.key,
    type: template.type,
    value: template.type === 'object' ? undefined : '',
    children: template.children ? template.children.map(child => ({
      ...child,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      value: child.type === 'object' ? undefined : '',
    })) : undefined,
    metadata: {
      ...template.metadata,
      isNew: true, // Mark as new for highlighting
    },
  };
  
  emit('update', {
    ...props.node,
    children: [...props.node.children, newItem],
  });
  
  // Emit scroll event to parent
  emit('scrollToNew', newItem.id);
};

// Check if this node was just added for highlighting only
watch(() => props.node.metadata.isNew, (isNew) => {
  if (isNew) {
    isNewlyAdded.value = true;
    
    // Remove highlight after 2.5 seconds
    setTimeout(() => {
      isNewlyAdded.value = false;
      // Clear the isNew flag
      emit('update', {
        ...props.node,
        metadata: {
          ...props.node.metadata,
          isNew: false,
        },
      });
    }, 2500);
  }
}, { immediate: true });
</script>

<style scoped>
.jsonld-node {
  border-left: 1px solid hsl(var(--border));
  transition: background-color 0.2s;
}

.jsonld-node:hover {
  background-color: hsl(var(--muted) / 0.3);
}

.node-readonly {
  opacity: 0.7;
  background-color: hsl(var(--muted) / 0.2);
}

.node-highlight {
  animation: highlight-fade 2s ease-out;
}

@keyframes highlight-fade {
  0% {
    background-color: hsl(120, 60%, 85%);
  }
  100% {
    background-color: transparent;
  }
}

.node-header {
  position: relative;
}

.node-key {
  flex-shrink: 0;
}

.node-value {
  flex: 1;
  min-width: 0;
}
</style>
