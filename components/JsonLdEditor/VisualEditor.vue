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
              <span class="section-subtitle">{{ t(`jsonld.editor.categorySubtitles.${category}`) }}</span>
            </div>
            <span
              class="section-count"
              :title="t('jsonld.editor.sectionFieldCountTitle', { count: filteredNodes[category]?.length ?? 0 })"
            >
              {{ t('jsonld.editor.sectionFieldCount', { count: filteredNodes[category]?.length ?? 0 }) }}
            </span>
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
          <div class="section-title-block">
            <span class="section-title">{{ t('jsonld.editor.categories.other', 'Other') }}</span>
          </div>
          <span
            class="section-count"
            :title="t('jsonld.editor.sectionFieldCountTitle', { count: filteredNodes.other?.length ?? 0 })"
          >
            {{ t('jsonld.editor.sectionFieldCount', { count: filteredNodes.other?.length ?? 0 }) }}
          </span>
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

// ── Node filtering & grouping ──────────────────────────────────
const hasMeaningfulValue = (node: JsonLdNodeType): boolean => {
  if (node.children && node.children.length > 0) {
    return node.children.some(hasMeaningfulValue);
  }

  const value = node.value;
  if (value === null || value === undefined || value === '') return false;

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('@value' in obj) {
      const v = obj['@value'];
      return v !== null && v !== undefined && String(v).trim() !== '';
    }
    return Object.keys(obj).length > 0;
  }

  return true;
};

const visibleNodes = computed(() =>
  props.modelValue.filter((node) => {
    if (node.metadata.hidden) return false;
    // In read-only mode show only populated fields.
    if (props.readonly) return hasMeaningfulValue(node);
    return true;
  }),
);

const groupedNodes = computed(() => {
  const groups: {
    identification: JsonLdNodeType[];
    provenance: JsonLdNodeType[];
    coverage: JsonLdNodeType[];
    access: JsonLdNodeType[];
    distribution: JsonLdNodeType[];
    other: JsonLdNodeType[];
  } = {
    identification: [], provenance: [], coverage: [],
    access: [], distribution: [], other: [],
  };
  for (const node of visibleNodes.value) {
    const cat = node.metadata.category || 'other';
    const target =
      cat in groups ? groups[cat as keyof typeof groups] : groups.other;
    (target ?? groups.other).push(node);
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

<style scoped src="./assets/VisualEditor.css"></style>
