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

    <!-- Field list grouped by category -->
    <div v-else class="editor-body">
      <template v-for="category in filteredCategories" :key="category">
        <div v-if="filteredNodes[category]?.length" class="category-section">
          <!-- Section header -->
          <div class="section-header">
            <span class="section-emoji">{{ categoryEmoji[category] ?? '📋' }}</span>
            <span class="section-title">{{ t(`jsonld.editor.categories.${category}`) }}</span>
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
import { computed } from 'vue';
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



// ── Category config ────────────────────────────────────────────
const categoryOrder = ['identification', 'provenance', 'coverage', 'access', 'distribution'] as const;

const categoryEmoji: Record<string, string> = {
  identification: '🏷️',
  provenance:     '📅',
  coverage:       '🌍',
  access:         '🔑',
  distribution:   '📦',
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
.section-emoji { font-size: 0.95rem; line-height: 1; }
.section-title {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
  flex: 1;
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
</style>
