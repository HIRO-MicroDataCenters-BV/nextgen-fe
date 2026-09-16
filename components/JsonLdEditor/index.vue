<template>
  <TooltipProvider>
    <div class="jsonld-editor border rounded-lg">
      <EditorHeader
        :search-query="searchQuery"
        :current-mode="currentMode"
        :readonly="readonly"
        :save-status="saveStatus"
        @update:search-query="searchQuery = $event"
        @toggle-mode="toggleMode"
      />

    <div ref="editorContentRef" class="editor-content">
      <VisualEditor
        v-if="currentMode === 'visual'"
        key="visual-editor"
        :model-value="treeData"
        :readonly="readonly"
        :context="preservedContext"
        :validation-errors="validationResult.errors"
        :search-query="searchQuery"
        @update:model-value="handleVisualUpdate"
        @request-add-field="showAddFieldDialog = true"
      />
      <CodeEditor
        v-else
        key="code-editor"
        :model-value="codeData"
        :readonly="readonly"
        :search-query="searchQuery"
        @update:model-value="handleCodeUpdate"
      />
    </div>

      <EditorFooter
        :current-mode="currentMode"
        :readonly="readonly"
        :mandatory-progress="mandatoryProgress"
        :progress-color-class="progressColorClass"
        :compliance-score="complianceScore"
        :validation-errors="validationResult.errors"
        :show-add-field-dialog="showAddFieldDialog"
        :tree-data="treeData"
        :can-scroll-to-error="canScrollToError"
        @update:show-add-field-dialog="showAddFieldDialog = $event"
        @confirm-add-field="handleAddFieldFromFooter"
        @scroll-to-error="scrollToError"
      />
    </div>  <!-- /jsonld-editor -->
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { EditorMode, JsonLdNode, FieldDefinition } from './types/editor.types';
import { useJsonLdTransform } from './composables/useJsonLdTransform';
import { useJsonLdValidation } from './composables/useJsonLdValidation';
import { useJsonLdSchema } from './composables/useJsonLdSchema';
import { useDefaultDataset } from './composables/useDefaultDataset';
import { useSaveIndicator } from './composables/useSaveIndicator';
import { useErrorNavigation } from './composables/useErrorNavigation';
import { useMandatoryProgress } from './composables/useMandatoryProgress';
import { useJsonLdTreeInitialization } from './composables/useJsonLdTreeInitialization';
import { useJsonLdExtraMetadata } from './composables/useJsonLdExtraMetadata';
import { useJsonLdSynchronization } from './composables/useJsonLdSynchronization';
import VisualEditor from './VisualEditor.vue';
import CodeEditor from './CodeEditor.vue';
import EditorHeader from './components/EditorHeader.vue';
import EditorFooter from './components/EditorFooter.vue';

interface Props {
  modelValue: string | Record<string, unknown>;
  readonly?: boolean;
  initialMode?: EditorMode;
  title?: string;
  /** Extra system metadata injected from outside (e.g. MMIO file upload).
   *  Passed as array of JSON-LD objects for dspace:extraMetadata.
   *  When this changes, the data is merged into the current tree without
   *  triggering a full re-parse (preserving any DCAT fields already entered). */
  extraMetadata?: Array<Record<string, unknown>> | null;
  /** When true, all nodes parsed from the current modelValue are readonly.
   *  The user can still ADD new fields via the Add Field button.
   *  Used when content was loaded from an uploaded MMIO/metadata file. */
  contentFromFile?: boolean;
  /** Item type from form (dataset | application). When set, validates dcterms:type matches. */
  itemType?: string;
  /**
   * When false (e.g. catalog edit: client selector is fixed), Access/Download URL is not
   * validated against the globally selected connector — allows file://, s3://, https:// etc.
   */
  enforceClientAccessUrl?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  initialMode: 'visual',
  title: 'Metadata Editor',
  extraMetadata: null,
  contentFromFile: false,
  itemType: undefined,
  enforceClientAccessUrl: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | Record<string, unknown>];
}>();

const { saveStatus, triggerSaveIndicator } = useSaveIndicator();
const nodeIdCounter = ref(0);
const makeNodeId = () => {
  nodeIdCounter.value += 1;
  return `node_${nodeIdCounter.value}`;
};

const { parseJsonLd, serializeJsonLd, parseJsonLdToTree, createDefaultNode } =
  useJsonLdTransform({ idFactory: makeNodeId });
const { validateTree } = useJsonLdValidation();
const { buildDefaultDatasetTree, isEmptyDataset, mergeDatasetTreeWithDefaults } = useDefaultDataset();
const { distributionSchema } = useJsonLdSchema();

const currentMode = ref<EditorMode>(props.initialMode);
const searchQuery = ref('');
const treeData = ref<JsonLdNode[]>([]);
const codeData = ref<string>('');
const preservedContext = ref<Record<string, string>>();
const editorContentRef = ref<HTMLElement | null>(null);
const isInternalUpdate = ref(false);
// Track last serialized value emitted internally so we can detect external vs internal updates.
const lastEmittedValueRef = ref('');
const showAddFieldDialog = ref(false);
const { canScrollToError, scrollToError } = useErrorNavigation(editorContentRef);
const { mandatoryProgress, complianceScore, progressColorClass } =
  useMandatoryProgress(treeData);

const modelValueRef = computed(() => props.modelValue);
const contentFromFileRef = computed(() => Boolean(props.contentFromFile));
const extraMetadataRef = computed(() => props.extraMetadata);

// ── Keyboard shortcut: press 'A' to open Add Field dialog ──────
const handleKeydown = (e: KeyboardEvent) => {
  if (
    currentMode.value === 'visual' &&
    !props.readonly &&
    !showAddFieldDialog.value &&
    e.key.toLowerCase() === 'a' &&
    !(e.target instanceof HTMLInputElement) &&
    !(e.target instanceof HTMLTextAreaElement)
  ) {
    showAddFieldDialog.value = true;
  }
};
onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

const { applyParsedTree } = useJsonLdTreeInitialization({
  modelValue: modelValueRef,
  contentFromFile: contentFromFileRef,
  parseJsonLd,
  buildDefaultDatasetTree,
  isEmptyDataset,
  mergeDatasetTreeWithDefaults,
  treeData,
  codeData,
  preservedContext,
  lastEmittedValueRef,
});

useJsonLdExtraMetadata({
  extraMetadata: extraMetadataRef,
  treeData,
  parseJsonLdToTree,
  makeNodeId,
});


const validationResult = computed(() => {
  const opts = {
    enforceClientAccessUrl: props.enforceClientAccessUrl,
  };
  if (currentMode.value === 'code') {
    const raw = props.modelValue;
    try {
      if (typeof raw === 'string') {
        const { tree } = parseJsonLd(raw);
        return validateTree(tree, props.itemType, opts);
      }
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const { tree } = parseJsonLd(raw as Record<string, unknown>);
        return validateTree(tree, props.itemType, opts);
      }
    } catch {
      /* invalid JSON in code mode — skip tree-based checks */
    }
  }
  return validateTree(treeData.value, props.itemType, opts);
});

const { toggleMode, handleVisualUpdate, handleCodeUpdate } = useJsonLdSynchronization({
  currentMode,
  treeData,
  codeData,
  preservedContext,
  editorContentRef,
  extraMetadata: extraMetadataRef,
  lastEmittedValueRef,
  triggerSaveIndicator,
  parseJsonLd,
  serializeJsonLd,
  applyParsedTree,
  emitModelValue: (value) => emit('update:modelValue', value),
});
const handleAddFieldFromFooter = (fieldDef: FieldDefinition) => {
  const isObject = fieldDef.type === 'object';
  const isArray  = fieldDef.type === 'array';

  // Build the children for an object node using createDefaultNode
  const objectChildren: JsonLdNode[] = isObject && fieldDef.children
    ? Object.values(fieldDef.children).map(childDef => createDefaultNode(childDef))
    : [];

  // Build first array item — seeded with schema children or distributionSchema children
  const buildFirstArrayItem = (): JsonLdNode => {
    const childSchema: Record<string, FieldDefinition> = fieldDef.distributionContext
      ? distributionSchema
      : (fieldDef.children ?? {});
    const children = Object.values(childSchema).map(childDef => createDefaultNode(childDef));
    return {
      id: makeNodeId(),
      key: '[0]',
      type: 'object',
      children,
      metadata: { required: false, readonly: false, repeatable: false, isNew: true },
    };
  };

  const newNode: JsonLdNode = {
    id: makeNodeId(),
    key: fieldDef.key,
    type: fieldDef.type,
    value: (isObject || isArray) ? undefined : '',
    children: isObject && objectChildren.length > 0
      ? objectChildren
      : isArray
        ? [buildFirstArrayItem()]
        : undefined,
    metadata: {
      required: fieldDef.required,
      readonly: false,
      repeatable: fieldDef.repeatable,
      label: fieldDef.label,
      category: fieldDef.category,
      description: fieldDef.description,
      placeholder: fieldDef.placeholder,
      vocabulary: fieldDef.vocabulary,
      dcatApCompliance: fieldDef.dcatApCompliance,
      icon: fieldDef.icon,
      format: fieldDef.format,
      isNew: true,
    },
  };
  treeData.value = [...treeData.value, newNode];
  const serialized = serializeJsonLd(treeData.value, preservedContext.value, 'object') as Record<string, unknown>;
  lastEmittedValueRef.value = JSON.stringify(serialized);
  isInternalUpdate.value = true;
  emit('update:modelValue', serialized);
};
</script>

<style scoped src="./assets/index.css"></style>
