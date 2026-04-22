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

<style scoped>
.jsonld-editor {
  min-height: 800px;
  max-height: 1200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* ── Header ─────────────────────────────────────────────────── */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--muted) / 0.3);
  box-shadow: var(--sticky-shadow);
  position: relative;
  z-index: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

/* Mode toggle — subtle */
.mode-toggle-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  opacity: 0.65;
  transition: opacity 0.2s;
}
.mode-toggle-wrap:hover { opacity: 1; }

/* Save slot — fixed width so search doesn't jump */
.save-slot {
  min-width: 90px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* save indicator fades in/out but slot stays fixed */
.save-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  animation: save-appear 0.2s ease;
}
@keyframes save-appear { from { opacity: 0; } to { opacity: 1; } }
.save-indicator--saving {
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
}
.save-indicator--saved {
  color: hsl(142 50% 32%);
  background: hsl(142 60% 92%);
}
:root.dark .save-indicator--saved { background: hsl(142 40% 18%); color: hsl(142 70% 65%); }

.editor-content {
  flex: 1;
  overflow: auto;
  max-width: 100%;
}

/* ── Footer ──────────────────────────────────────────────────── */
.editor-footer {
  flex-shrink: 0;
  background: hsl(var(--muted) / 0.15);
}

.add-field-row {
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid hsl(var(--border) / 0.4);
}

/* ── Progress block ──────────────────────────────────────────── */
.completion-block {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 180px;
  flex: 1;
  max-width: 280px;
}

.completion-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.72rem;
}

.completion-text {
  color: hsl(var(--muted-foreground));
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.completion-pct {
  font-weight: 700;
  font-size: 0.72rem;
}

.progress-track {
  height: 5px;
  width: 100%;
  background: hsl(var(--muted));
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s;
}

/* Colors */
.progress--red   { background: hsl(0 72% 51%);    color: hsl(0 60% 38%); }
.progress--amber { background: hsl(38 92% 50%);   color: hsl(38 70% 36%); }
.progress--green { background: hsl(142 60% 42%);  color: hsl(142 50% 28%); }
:root.dark .progress--red   { background: hsl(0 72% 58%);   color: hsl(0 80% 75%); }
:root.dark .progress--amber { background: hsl(38 80% 55%);  color: hsl(38 80% 70%); }
:root.dark .progress--green { background: hsl(142 60% 52%); color: hsl(142 70% 65%); }

/* ── Compliance badge ────────────────────────────────────────── */
.footer-compliance {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 2px 8px;
  border-radius: 999px;
  line-height: 1.6;
  white-space: nowrap;
}
.stat-ok    { background: hsl(142 60% 90%); color: hsl(142 50% 28%); }
.stat-error { background: hsl(0 72% 93%);   color: hsl(0 60% 38%); }
.stat-warn  { background: hsl(38 92% 92%);  color: hsl(38 70% 36%); }
:root.dark .stat-ok    { background: hsl(142 40% 18%); color: hsl(142 70% 65%); }
:root.dark .stat-error { background: hsl(0 45% 20%);  color: hsl(0 80% 75%); }
:root.dark .stat-warn  { background: hsl(38 50% 18%); color: hsl(38 80% 70%); }

/* ── Add button (gradient) ───────────────────────────────────── */
.add-btn-gradient {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  border: none;
  border-radius: 0.6rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 1px 4px hsl(245 70% 45% / 0.3);
  transition: box-shadow 0.2s, transform 0.15s;
  flex-shrink: 0;
}
.add-btn-gradient:hover {
  box-shadow: 0 3px 10px hsl(245 70% 45% / 0.45);
  transform: translateY(-1px);
}
.add-btn-gradient:active { transform: translateY(0); box-shadow: none; }

.add-btn-gradient {
  gap: 0.4rem;
  padding: 0.4rem 0.875rem;
}

.add-btn-icon {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.add-btn-gradient:hover .add-btn-icon {
  transform: rotate(90deg);
}

/* ── Validation block ────────────────────────────────────────── */
.validation-block {
  padding: 0.625rem 1rem;
}

.validation-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.4rem;
}

.validation-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.validation-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.78rem;
  padding: 0.3rem 0.5rem;
  margin: 0 -0.5rem;
  border-radius: 0.375rem;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
  transition: background 0.15s ease;
}
.validation-item--navigable {
  cursor: pointer;
}
.validation-item--navigable:hover {
  background: hsl(var(--muted) / 0.5);
  color: hsl(var(--foreground));
}
.validation-item--navigable:hover .iconify:last-child { opacity: 0.7; }

.validation-item--error .iconify:first-child { color: hsl(0 70% 48%); }
.validation-item--warn  .iconify:first-child { color: hsl(38 80% 42%); }
:root.dark .validation-item--error .iconify:first-child { color: hsl(0 80% 72%); }
:root.dark .validation-item--warn  .iconify:first-child { color: hsl(38 80% 65%); }
</style>
