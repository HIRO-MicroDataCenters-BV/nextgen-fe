<template>
  <div class="visual-editor">

    <div v-if="visibleNodes.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <p class="empty-title">{{ t('jsonld.editor.noMetadata') }}</p>
      <button type="button" class="add-btn-primary" @click="emit('request-add-field')">
        <span class="add-btn-icon">＋</span>
        {{ t('jsonld.editor.addField') }}
      </button>
    </div>

    <!-- ── Field list grouped by category -->
    <div v-else class="editor-body">

      <!-- Onboarding hint: shown once per session when all mandatory fields are empty -->
      <Transition name="banner-fade">
        <!-- Completion banner -->
        <div v-if="allRequiredFilled" class="completion-banner">
          <Icon name="lucide:circle-check" class="completion-icon size-4" />
          <div class="onboarding-text">
            <strong>{{ t('jsonld.editor.bannerAllSet') }}</strong>
            {{ t('jsonld.editor.bannerAllSetDesc') }}
          </div>
        </div>
        <!-- Onboarding hint -->
        <div v-else-if="showOnboarding" class="onboarding-banner">
          <Icon name="lucide:lightbulb" class="onboarding-icon size-4" />
          <div class="onboarding-text">
            <strong>{{ t('jsonld.editor.bannerGettingStarted') }}</strong>
            {{ t('jsonld.editor.bannerGettingStartedDesc') }}
          </div>
          <button type="button" class="onboarding-dismiss" :title="t('jsonld.editor.bannerDismiss')" @click="dismissOnboarding">
            <Icon name="lucide:x" class="size-3.5" />
          </button>
        </div>
      </Transition>


      <template v-for="category in filteredCategories" :key="category">
        <div v-if="filteredNodes[category]?.length" class="category-section">
          <!-- Section header -->
          <div class="section-header">
            <span class="section-emoji">{{ categoryEmoji[category] ?? '📋' }}</span>
            <div class="section-title-block">
              <span class="section-title">{{ t(`jsonld.editor.categories.${category}`) }}</span>
              <span class="section-subtitle">{{ categorySubtitle[category] }}</span>
            </div>
            <span class="section-count">{{ filteredNodes[category]?.length }}</span>
          </div>

          <!-- Fields -->
          <div class="section-fields">
            <JsonLdNode
              v-for="node in filteredNodes[category]"
              :key="node.id"
              :node="node"
              :readonly="readonly"
              :validation-errors="validationErrors"
              @update="handleNodeUpdate"
              @remove="handleNodeRemove"
            />
          </div>
        </div>
      </template>

      <!-- "Other" category (uncategorised visible fields) -->
      <div v-if="filteredNodes.other?.length" class="category-section">
        <div class="section-header">
          <span class="section-emoji">📌</span>
          <span class="section-title">{{ t('jsonld.editor.categories.other', 'Other') }}</span>
          <span class="section-count">{{ filteredNodes.other?.length }}</span>
        </div>
        <div class="section-fields">
          <JsonLdNode
            v-for="node in filteredNodes.other"
            :key="node.id"
            :node="node"
            :readonly="readonly"
            :validation-errors="validationErrors"
            @update="handleNodeUpdate"
            @remove="handleNodeRemove"
          />
        </div>
      </div>

    </div>  <!-- /editor-body -->
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JsonLdNode as JsonLdNodeType, ValidationError } from './types/editor.types';
import JsonLdNode from './components/JsonLdNode.vue';

interface Props {
  modelValue: JsonLdNodeType[];
  readonly?: boolean;
  context?: Record<string, string>;
  validationErrors?: ValidationError[];
  searchQuery?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  context: () => ({}),
  validationErrors: () => [],
  searchQuery: '',
});

const { t } = useI18n();

const emit = defineEmits<{
  'update:modelValue': [nodes: JsonLdNodeType[]];
  'request-add-field': [];
}>();


const isMandatoryNode = (n: JsonLdNodeType) =>
  n.metadata.dcatApCompliance === 'mandatory' && !n.metadata.hidden && !n.metadata.readonly;

/**
 * Mirrors useJsonLdValidation.isEffectivelyEmpty — returns true when a node has
 * no meaningful value. Handles plain strings, language-string objects
 * ({ '@value': '', '@language': 'en' }), and nodes whose value lives in children.
 */
const nodeIsEffectivelyEmpty = (n: JsonLdNodeType): boolean => {
  if (n.value === undefined || n.value === null || n.value === '') {
    return !n.children?.length;
  }
  if (typeof n.value === 'object' && !Array.isArray(n.value)) {
    const v = n.value as Record<string, unknown>;
    if ('@value' in v) {
      return v['@value'] === '' || v['@value'] === undefined || v['@value'] === null;
    }
  }
  return false;
};

/** True only when every mandatory field has a real value AND all hard errors are resolved. */
const allRequiredFilled = computed(() => {
  const mandatoryNodes = props.modelValue.filter(isMandatoryNode);
  // Must have at least one mandatory field tracked
  if (mandatoryNodes.length === 0) return false;
  // All mandatory nodes must be genuinely filled
  const allFilled = mandatoryNodes.every(n => !nodeIsEffectivelyEmpty(n));
  if (!allFilled) return false;
  // Must have no hard (severity=error) validation errors
  const hardErrors = (props.validationErrors ?? []).filter(e => e.severity === 'error');
  return hardErrors.length === 0;
});

const ONBOARDING_KEY = 'jsonld-onboarding-dismissed';
const showOnboarding = ref(false);

const dismissOnboarding = () => {
  showOnboarding.value = false;
  sessionStorage.setItem(ONBOARDING_KEY, '1');
};

onMounted(() => {
  if (sessionStorage.getItem(ONBOARDING_KEY)) return;
  // Only show when mandatory fields are all empty (fresh dataset)
  const mandatoryEmpty = props.modelValue
    .filter(isMandatoryNode)
    .every(n => nodeIsEffectivelyEmpty(n));
  if (mandatoryEmpty) showOnboarding.value = true;
});

// ── Category config ────────────────────────────────────────────
const categoryOrder = ['identification', 'provenance', 'coverage', 'access', 'distribution'] as const;

const categoryEmoji: Record<string, string> = {
  identification: '🏷️',
  provenance:     '📅',
  coverage:       '🌍',
  access:         '🔑',
  distribution:   '📦',
};

const categorySubtitle: Record<string, string> = {
  identification: 'What is this dataset?',
  provenance:     'Who made it and when?',
  coverage:       'Where and when does the data apply?',
  access:         'Who can access it and under what terms?',
  distribution:   'Where and in what format is the data available?',
};

// ── Node filtering & grouping ──────────────────────────────────
const visibleNodes = computed(() =>
  props.modelValue.filter(n => !n.metadata.hidden && !n.metadata.readonly),
);

const groupedNodes = computed(() => {
  const groups: Record<string, JsonLdNodeType[]> = {
    identification: [], provenance: [], coverage: [],
    access: [], distribution: [], other: [],
  };
  for (const node of visibleNodes.value) {
    const cat = node.metadata.category || 'other';
    (groups[cat] ?? groups.other).push(node);
  }
  // Sort within each group: mandatory → recommended → optional
  const complianceRank: Record<string, number> = { mandatory: 0, recommended: 1, optional: 2 };
  for (const nodes of Object.values(groups)) {
    nodes.sort((a, b) => {
      const reqA = a.metadata.dcatApCompliance === 'mandatory' ? 0 : 1;
      const reqB = b.metadata.dcatApCompliance === 'mandatory' ? 0 : 1;
      if (reqA !== reqB) return reqA - reqB;
      const rankA = complianceRank[a.metadata.dcatApCompliance ?? 'optional'] ?? 2;
      const rankB = complianceRank[b.metadata.dcatApCompliance ?? 'optional'] ?? 2;
      return rankA - rankB;
    });
  }
  return groups;
});

const filteredNodes = computed(() => {
  const q = props.searchQuery?.toLowerCase().trim();
  if (!q) return groupedNodes.value;

  const filtered: Record<string, JsonLdNodeType[]> = {
    identification: [], provenance: [], coverage: [],
    access: [], distribution: [], other: [],
  };
  for (const [cat, nodes] of Object.entries(groupedNodes.value)) {
    filtered[cat] = nodes.filter(node =>
      node.metadata.label?.toLowerCase().includes(q) ||
      node.key.toLowerCase().includes(q) ||
      node.metadata.description?.toLowerCase().includes(q),
    );
  }
  return filtered;
});

const filteredCategories = computed(() =>
  categoryOrder.filter(cat => (filteredNodes.value[cat]?.length ?? 0) > 0),
);

// ── Event handlers ─────────────────────────────────────────────

const handleNodeUpdate = (updatedNode: JsonLdNodeType) => {
  const update = (nodes: JsonLdNodeType[]): JsonLdNodeType[] =>
    nodes.map(n => {
      if (n.id === updatedNode.id) return updatedNode;
      if (n.children) return { ...n, children: update(n.children) };
      return n;
    });
  emit('update:modelValue', update(props.modelValue));
};

const handleNodeRemove = (nodeId: string) => {
  const remove = (nodes: JsonLdNodeType[]): JsonLdNodeType[] =>
    nodes
      .filter(n => n.id !== nodeId)
      .map(n => (n.children ? { ...n, children: remove(n.children) } : n));
  emit('update:modelValue', remove(props.modelValue));
};


</script>

<style scoped>
.visual-editor {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 300px;
}

/* ── Empty state ─────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 0.75rem;
  text-align: center;
}
.empty-icon { font-size: 2.5rem; line-height: 1; }
.empty-title { font-size: 0.9rem; color: #6b7280; margin: 0; }

/* ── Add buttons ─────────────────────────────────────────────── */
.add-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.add-btn-primary:hover { background: #4f46e5; }
.add-btn-icon { font-size: 1.1rem; line-height: 1; font-weight: 400; }

.add-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.2rem;
  background: transparent;
  color: #6366f1;
  border: 1.5px dashed rgba(99,102,241,0.45);
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.13s, border-color 0.13s;
}
.add-btn-outline:hover {
  background: rgba(99,102,241,0.06);
  border-color: #6366f1;
}

/* ── Editor body ─────────────────────────────────────────────── */
.editor-body {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* ── Category section ────────────────────────────────────────── */
.category-section { display: flex; flex-direction: column; gap: 0.75rem; }

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.25rem;
}
.section-emoji { font-size: 0.95rem; line-height: 1; flex-shrink: 0; }
.section-title-block {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  flex: 1;
}
.section-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
}
.section-subtitle {
  font-size: 0.68rem;
  color: hsl(var(--muted-foreground) / 0.7);
  font-style: italic;
}
.section-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: #d1d5db;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 1px 7px;
  min-width: 20px;
  text-align: center;
}
:root.dark .section-count { background: #374151; color: #9ca3af; }

.section-fields { display: flex; flex-direction: column; gap: 0.5rem; }

/* ── Add row ─────────────────────────────────────────────────── */
.add-field-row {
  padding-top: 0.5rem;
  display: flex;
}

/* ── Onboarding banner ───────────────────────────────────────── */
.onboarding-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0.75rem;
  background: hsl(38 92% 96%);
  border: 1px solid hsl(38 80% 85%);
  font-size: 0.8rem;
  line-height: 1.5;
  color: hsl(38 50% 25%);
}
:root.dark .onboarding-banner {
  background: hsl(38 40% 14%);
  border-color: hsl(38 50% 28%);
  color: hsl(38 70% 75%);
}
.onboarding-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: hsl(38 80% 42%);
}
.onboarding-text { flex: 1; }
.onboarding-text em { font-style: normal; font-weight: 600; }
.onboarding-dismiss {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  opacity: 0.5;
  padding: 2px;
  border-radius: 4px;
  transition: opacity 0.15s;
}
.onboarding-dismiss:hover { opacity: 1; }

.banner-fade-enter-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.banner-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.banner-fade-enter-from  { opacity: 0; transform: translateY(-6px); }
.banner-fade-leave-to    { opacity: 0; transform: translateY(-6px); }

/* ── Completion banner ────────────────────────────────────────── */
.completion-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 0.75rem;
  background: hsl(142 60% 94%);
  border: 1px solid hsl(142 50% 78%);
  font-size: 0.8rem;
  line-height: 1.5;
  color: hsl(142 50% 22%);
}
:root.dark .completion-banner {
  background: hsl(142 40% 14%);
  border-color: hsl(142 40% 28%);
  color: hsl(142 60% 72%);
}
.completion-icon {
  flex-shrink: 0;
  color: hsl(142 60% 38%);
}
:root.dark .completion-icon { color: hsl(142 60% 60%); }
</style>
