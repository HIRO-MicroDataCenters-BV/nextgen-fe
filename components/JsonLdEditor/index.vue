<template>
  <TooltipProvider>
    <div class="jsonld-editor border rounded-lg">
      <div class="editor-header">
        <!-- Search Field -->
        <div class="flex-1 max-w-md">
          <div class="relative">
            <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              v-model="searchQuery"
            :placeholder="currentMode === 'visual' ? t('jsonld.editor.searchPlaceholderVisual') : t('jsonld.editor.searchPlaceholderCode')"
              class="pl-9 h-9"
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

        <!-- Right: fixed-width save indicator slot -->
        <div class="header-right">
          <!-- Save indicator — always occupies space to prevent search jumping -->
          <div class="save-slot">
            <span v-if="saveStatus === 'saving'" class="save-indicator save-indicator--saving">
              <Icon name="lucide:loader-circle" class="size-3 animate-spin" />
              <span>{{ t('jsonld.editor.saving') }}</span>
            </span>
            <span v-else-if="saveStatus === 'saved'" class="save-indicator save-indicator--saved">
              <Icon name="lucide:check" class="size-3" />
              <span>{{ t('jsonld.editor.saved') }}</span>
            </span>
          </div>

          <!-- Mode Toggle (compact) -->
          <div class="mode-toggle-wrap" :title="t('jsonld.editor.modeToggleTitle')">
            <Label for="mode-switch" class="text-xs text-muted-foreground">{{ t('jsonld.editor.modeVisual') }}</Label>
            <Switch
              id="mode-switch"
              :model-value="currentMode === 'code'"
              :disabled="readonly"
              @update:model-value="toggleMode"
            />
            <Label for="mode-switch" class="text-xs text-muted-foreground">{{ t('jsonld.editor.modeJson') }}</Label>
          </div>
        </div>
      </div>

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

    <!-- ── Footer: Add Field + Validation errors ────────── -->
    <div class="editor-footer border-t">
      <!-- Add Field row (visual mode only) -->
      <div v-if="currentMode === 'visual' && !readonly" class="add-field-row">
        <!-- Left: completion progress -->
        <div class="completion-block">
          <div class="completion-label">
            <span class="completion-text">
              <template v-if="mandatoryProgress.total === 0">
                {{ t('jsonld.editor.noRequiredFields') }}
              </template>
              <template v-else-if="mandatoryProgress.filled === mandatoryProgress.total">
                <Icon name="lucide:circle-check" class="size-3 inline" />
                {{ t('jsonld.editor.allRequiredComplete') }}
              </template>
              <template v-else>
                {{ mandatoryProgress.filled }} {{ t('jsonld.editor.ofRequiredFields', { total: mandatoryProgress.total }) }}
              </template>
            </span>
            <span class="completion-pct">
              {{ mandatoryProgress.pct }}%
            </span>
          </div>
          <div class="progress-track">
            <div
              class="progress-bar"
              :class="progressColorClass"
              :style="{ width: mandatoryProgress.pct + '%' }"
            />
          </div>
        </div>

        <!-- DCAT-AP compliance badge -->
        <div class="footer-compliance">
          <span v-if="complianceScore === 100" class="stat-badge stat-ok">
            <Icon name="lucide:circle-check" class="size-3" /> DCAT-AP ✓
          </span>
          <span
            v-else-if="validationResult.errors.filter(e => e.severity === 'error').length > 0"
            class="stat-badge stat-error"
          >
            <Icon name="lucide:circle-x" class="size-3" />
            {{ validationResult.errors.filter(e => e.severity === 'error').length }} {{ t('jsonld.editor.errors', 'errors') }}
          </span>
          <span
            v-else-if="validationResult.errors.length > 0"
            class="stat-badge stat-warn"
          >
            <Icon name="lucide:triangle-alert" class="size-3" />
            {{ validationResult.errors.length }} {{ t('jsonld.editor.warnings', 'warnings') }}
          </span>
        </div>

        <!-- Right: add button -->
        <button type="button" class="add-btn-gradient" @click="showAddFieldDialog = true">
          <Icon name="lucide:plus" class="add-btn-icon size-4" />
          {{ t('jsonld.editor.addField') }}
        </button>

        <AddFieldDialog
          v-model:open="showAddFieldDialog"
          :existing-keys="treeData.map(n => n.key)"
          context="dataset"
          @confirm="handleAddFieldFromFooter"
        />
      </div>

      <!-- Validation errors -->
      <div v-if="validationResult.errors.length > 0" class="validation-block">
        <div class="validation-header">
          <Icon name="lucide:shield-alert" class="size-4 text-destructive" />
          <span class="text-sm font-semibold">{{ t('jsonld.editor.validationErrors') }}</span>
        </div>
        <div class="validation-list">
          <div
            v-for="(error, index) in validationResult.errors"
            :key="index"
            class="validation-item"
            :class="error.severity === 'error' ? 'validation-item--error' : 'validation-item--warn'"
          >
            <Icon
              :name="error.severity === 'error' ? 'lucide:circle-x' : 'lucide:triangle-alert'"
              class="size-3.5 flex-shrink-0"
            />
            <span>{{ error.message }}</span>
          </div>
        </div>
      </div>
    </div>  <!-- /editor-footer -->
    </div>  <!-- /jsonld-editor -->
  </TooltipProvider>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { EditorMode, JsonLdNode, FieldDefinition } from './types/editor.types';
import { useJsonLdTransform } from './composables/useJsonLdTransform';
import { useJsonLdValidation } from './composables/useJsonLdValidation';
import { useDefaultDataset } from './composables/useDefaultDataset';
import VisualEditor from './VisualEditor.vue';
import CodeEditor from './CodeEditor.vue';
import AddFieldDialog from './components/AddFieldDialog.vue';

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

const { t } = useI18n();

const emit = defineEmits<{
  'update:modelValue': [value: string | Record<string, unknown>];
}>();

// ── Auto-save indicator ─────────────────────────────────────────
const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle');
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const triggerSaveIndicator = () => {
  saveStatus.value = 'saving';
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveStatus.value = 'saved';
    saveTimer = setTimeout(() => { saveStatus.value = 'idle'; }, 2500);
  }, 400);
};
onUnmounted(() => { if (saveTimer) clearTimeout(saveTimer); });

const { parseJsonLd, serializeJsonLd } = useJsonLdTransform();
const { validateTree } = useJsonLdValidation();
const { buildDefaultDatasetTree, isEmptyDataset } = useDefaultDataset();

const currentMode = ref<EditorMode>(props.initialMode);
const searchQuery = ref('');
const treeData = ref<JsonLdNode[]>([]);
const codeData = ref<string>('');
const preservedContext = ref<Record<string, string>>();
const editorContentRef = ref<HTMLElement | null>(null);
const isInternalUpdate = ref(false);
const showAddFieldDialog = ref(false);

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

// ── Mandatory progress (replaces old complianceScore) ────────────────────
const isNodeFilled = (n: JsonLdNode): boolean => {
  if (n.value === undefined || n.value === null || n.value === '') {
    return !!(n.children?.length);
  }
  if (typeof n.value === 'object' && !Array.isArray(n.value)) {
    const v = n.value as Record<string, unknown>;
    if ('@value' in v) return v['@value'] !== '' && v['@value'] !== undefined;
  }
  return true;
};

const mandatoryNodes = computed(() =>
  treeData.value.filter(n => n.metadata.required && !n.metadata.hidden && !n.metadata.readonly),
);

const mandatoryProgress = computed(() => {
  const total = mandatoryNodes.value.length;
  const filled = mandatoryNodes.value.filter(isNodeFilled).length;
  const pct = total === 0 ? 100 : Math.round((filled / total) * 100);
  return { total, filled, pct };
});

// Keep complianceScore for template badges
const complianceScore = computed(() => mandatoryProgress.value.pct);

const progressColorClass = computed(() => {
  const pct = mandatoryProgress.value.pct;
  if (pct === 100) return 'progress--green';
  if (pct >= 60)  return 'progress--amber';
  return 'progress--red';
});

const parseInitialData = () => {
  try {
    const { tree, context } = parseJsonLd(props.modelValue);

    // If the dataset is empty (new dataset), pre-populate with DCAT-AP 3 defaults
    treeData.value = isEmptyDataset(tree) ? buildDefaultDatasetTree() : tree;
    preservedContext.value = context;
    
    if (typeof props.modelValue === 'string') {
      codeData.value = props.modelValue;
    } else {
      codeData.value = JSON.stringify(props.modelValue, null, 2);
    }
  } catch (error) {
    console.error('Failed to parse JSON-LD:', error);
    // Even on parse error for a new dataset, show the default form
    treeData.value = buildDefaultDatasetTree();
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
  triggerSaveIndicator();
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
  triggerSaveIndicator();
  codeData.value = newCode;
  try {
    const parsed = JSON.parse(newCode);
    emit('update:modelValue', parsed);
  } catch {
    emit('update:modelValue', newCode);
  }
};
const handleAddFieldFromFooter = (fieldDef: FieldDefinition) => {
  const makeId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Build child nodes from schema definition (same as useDefaultDataset)
  const buildChildren = (def: FieldDefinition): JsonLdNode[] => {
    if (!def.children) return [];
    return Object.values(def.children)
      .filter(c => !c.hidden)
      .map((childDef): JsonLdNode => ({
        id: makeId(),
        key: childDef.key,
        type: childDef.type as JsonLdNode['type'],
        value: childDef.type === 'object' ? undefined : (childDef.defaultValue ?? ''),
        children: childDef.type === 'object' ? [] : undefined,
        metadata: {
          required: childDef.required,
          readonly: childDef.readonly,
          repeatable: childDef.repeatable,
          label: childDef.label,
          hidden: childDef.hidden ?? false,
          placeholder: childDef.placeholder,
          description: childDef.description,
          defaultValue: childDef.defaultValue,
          vocabulary: childDef.vocabulary,
        },
      }));
  };

  const isObject = fieldDef.type === 'object';
  const isArray  = fieldDef.type === 'array';

  const newNode: JsonLdNode = {
    id: makeId(),
    key: fieldDef.key,
    type: fieldDef.type,
    value: (isObject || isArray) ? undefined : '',
    children: isObject ? buildChildren(fieldDef) : (isArray ? [] : undefined),
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
      isNew: true,
    },
  };
  treeData.value = [...treeData.value, newNode];
  const serialized = serializeJsonLd(treeData.value, preservedContext.value, 'object') as Record<string, unknown>;
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
  padding: 0.2rem 0;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
}

.validation-item--error .iconify { color: hsl(0 70% 48%); }
.validation-item--warn  .iconify { color: hsl(38 80% 42%); }
:root.dark .validation-item--error .iconify { color: hsl(0 80% 72%); }
:root.dark .validation-item--warn  .iconify { color: hsl(38 80% 65%); }
</style>
