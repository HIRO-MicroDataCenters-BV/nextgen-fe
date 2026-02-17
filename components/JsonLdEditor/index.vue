<template>
  <div class="jsonld-editor border rounded-lg">
    <div class="editor-header flex items-center justify-end p-4 border-b bg-muted/30">
      <div class="flex items-center gap-2">
        <Label for="mode-switch" class="text-sm">Visual</Label>
        <Switch
          id="mode-switch"
          :model-value="currentMode === 'code'"
          :disabled="readonly"
          @update:model-value="toggleMode"
        />
        <Label for="mode-switch" class="text-sm">Code</Label>
      </div>
    </div>

    <div ref="editorContentRef" class="editor-content">
      <VisualEditor
        v-if="currentMode === 'visual'"
        key="visual-editor"
        :model-value="treeData"
        :readonly="readonly"
        :context="preservedContext"
        @update:model-value="handleVisualUpdate"
      />
      <CodeEditor
        v-else
        key="code-editor"
        :model-value="codeData"
        :readonly="readonly"
        @update:model-value="handleCodeUpdate"
      />
    </div>

    <div v-if="validationResult.errors.length > 0" class="editor-footer p-4 border-t bg-muted/20">
      <div class="text-sm font-medium mb-2">Validation Errors:</div>
      <div class="space-y-1">
        <div
          v-for="(error, index) in validationResult.errors"
          :key="index"
          class="text-sm flex items-start gap-2"
        >
          <Icon
            :name="error.severity === 'error' ? 'lucide:circle-x' : 'lucide:triangle-alert'"
            :class="error.severity === 'error' ? 'text-destructive' : 'text-warning'"
            class="size-4 mt-0.5"
          />
          <div>
            <span class="font-mono text-xs text-muted-foreground">{{ error.path }}</span>
            <span class="ml-2">{{ error.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { EditorMode, JsonLdNode } from './types/editor.types';
import { useJsonLdTransform } from './composables/useJsonLdTransform';
import { useJsonLdValidation } from './composables/useJsonLdValidation';
import VisualEditor from './VisualEditor.vue';
import CodeEditor from './CodeEditor.vue';

interface Props {
  modelValue: string | Record<string, unknown>;
  readonly?: boolean;
  initialMode?: EditorMode;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  initialMode: 'visual',
  title: 'Metadata Editor',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | Record<string, unknown>];
}>();

const { parseJsonLd, serializeJsonLd } = useJsonLdTransform();
const { validateTree } = useJsonLdValidation();

const currentMode = ref<EditorMode>(props.initialMode);
const treeData = ref<JsonLdNode[]>([]);
const codeData = ref<string>('');
const preservedContext = ref<Record<string, string>>();
const editorContentRef = ref<HTMLElement | null>(null);
const isInternalUpdate = ref(false);

const parseInitialData = () => {
  try {
    const { tree, context } = parseJsonLd(props.modelValue);
    treeData.value = tree;
    preservedContext.value = context;
    
    if (typeof props.modelValue === 'string') {
      codeData.value = props.modelValue;
    } else {
      codeData.value = JSON.stringify(props.modelValue, null, 2);
    }
  } catch (error) {
    console.error('Failed to parse JSON-LD:', error);
    treeData.value = [];
    codeData.value = typeof props.modelValue === 'string' ? props.modelValue : '';
  }
};

parseInitialData();

watch(() => props.modelValue, () => {
  // Don't re-parse if the change came from this editor
  if (isInternalUpdate.value) {
    isInternalUpdate.value = false;
    return;
  }
  parseInitialData();
}, { deep: true });

const validationResult = computed(() => {
  return validateTree(treeData.value);
});

const toggleMode = (checked: boolean) => {
  const newMode: EditorMode = checked ? 'code' : 'visual';
  
  if (newMode === 'code' && currentMode.value === 'visual') {
    try {
      codeData.value = serializeJsonLd(treeData.value, preservedContext.value, 'string') as string;
    } catch (error) {
      console.error('Failed to serialize to code:', error);
    }
  } else if (newMode === 'visual' && currentMode.value === 'code') {
    try {
      const { tree, context } = parseJsonLd(codeData.value);
      treeData.value = tree;
      preservedContext.value = context;
    } catch (error) {
      console.error('Failed to parse code:', error);
    }
  }
  
  currentMode.value = newMode;
};

const updateArrayIndices = (nodes: JsonLdNode[]): JsonLdNode[] => {
  return nodes.map(node => {
    if (node.type === 'array' && node.children) {
      // Update indices for array children
      const updatedChildren = node.children.map((child, index) => ({
        ...child,
        key: `[${index}]`,
        children: child.children ? updateArrayIndices(child.children) : undefined,
      }));
      return {
        ...node,
        children: updatedChildren,
      };
    } else if (node.children) {
      // Recursively update children
      return {
        ...node,
        children: updateArrayIndices(node.children),
      };
    }
    return node;
  });
};

const handleVisualUpdate = (newTree: JsonLdNode[]) => {
  // Save current scroll position
  const savedScroll = editorContentRef.value?.scrollTop || 0;
  
  // Update array indices
  const treeWithUpdatedIndices = updateArrayIndices(newTree);
  
  treeData.value = treeWithUpdatedIndices;
  const serialized = serializeJsonLd(treeWithUpdatedIndices, preservedContext.value, 'object') as Record<string, unknown>;
  
  // Mark as internal update to prevent watcher from re-parsing
  isInternalUpdate.value = true;
  emit('update:modelValue', serialized);
  
  // Restore scroll position after DOM update
  nextTick(() => {
    if (editorContentRef.value) {
      editorContentRef.value.scrollTop = savedScroll;
    }
  });
};

const handleCodeUpdate = (newCode: string) => {
  codeData.value = newCode;
  try {
    const parsed = JSON.parse(newCode);
    emit('update:modelValue', parsed);
  } catch {
    emit('update:modelValue', newCode);
  }
};
</script>

<style scoped>
.jsonld-editor {
  min-height: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-content {
  flex: 1;
  overflow: auto;
  max-width: 100%;
}
</style>
