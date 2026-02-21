<template>
  <div
    v-if="!node.metadata.hidden"
    ref="nodeRef"
    :data-node-id="node.id"
    class="field-card"
    :class="{
      'field-highlight': isNewlyAdded,
      'field-card--nested': depth > 0,
      'field-card--required-empty': node.metadata.required && !hasValue,
      'field-card--required-filled': node.metadata.required && hasValue,
    }"
  >
    <!-- ── Field Header ──────────────────────────────────── -->
    <div class="field-header" @click="hasChildren ? toggleExpand() : undefined">
      <!-- Inline icon (same icon as in the Add Field panel) -->
      <span class="field-icon">
        <Icon :name="fieldIconName" class="size-4" />
      </span>

      <div class="field-meta">
        <div class="field-label-row">
          <span class="field-label">{{ fieldLabel }}</span>
          <span v-if="node.metadata.required && !hasValue" class="required-asterisk" title="This field is required">*</span>
          <span
            v-if="node.metadata.dcatApCompliance"
            class="compliance-pill"
            :class="`compliance-${node.metadata.dcatApCompliance}`"
          >
            {{ t(`jsonld.editor.compliance.${node.metadata.dcatApCompliance}`) }}
          </span>
          <!-- ── Contextual help tooltip ── -->
          <TooltipProvider v-if="fieldDescription" :delay-duration="300">
            <Tooltip>
              <TooltipTrigger as-child>
                <button type="button" class="help-btn" tabindex="-1" @click.stop>
                  <Icon name="lucide:info" class="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" class="help-tooltip">
                <p class="help-tooltip__desc">{{ fieldDescription }}</p>
                <p v-if="node.metadata.placeholder" class="help-tooltip__example">
                  <span class="help-tooltip__eg">e.g.</span> {{ node.metadata.placeholder }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <!-- char counter inline in label row -->
          <span v-if="showCharCount" class="char-counter" :class="charCountClass">
            {{ charCount }} / {{ charCountMax }}
          </span>
        </div>
        <p v-if="fieldDescription" class="field-desc">{{ fieldDescription }}</p>
      </div>

      <!-- Expand/collapse toggle for nested fields -->
      <button
        v-if="hasChildren"
        type="button"
        class="expand-btn"
        :aria-expanded="isExpanded"
        :title="isExpanded ? 'Collapse' : 'Expand'"
        @click.stop="toggleExpand"
      >
        <Icon
          :name="isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
          class="size-4"
        />
      </button>

      <!-- Remove button -->
      <button
        v-if="!readonly && !node.metadata.readonly && canRemoveNode"
        type="button"
        class="remove-btn"
        :title="t('common.remove', 'Remove')"
        @click.stop="handleRemove"
      >
        <Icon name="lucide:x" class="size-3.5" />
      </button>
    </div>

    <!-- ── Single-value input ───────────────────────────── -->
    <div v-if="!hasChildren" class="field-input">
      <JsonLdField
        :node="node"
        :readonly="readonly || node.metadata.readonly"
        :validation-errors="fieldErrors"
        @update="handleFieldUpdate"
      />
    </div>

    <!-- ── Nested / object fields ───────────────────────── -->
    <Transition name="collapse">
      <div v-if="hasChildren && isExpanded" class="nested-fields">
        <div class="nested-connector" />
        <div class="nested-items">
          <JsonLdNode
            v-for="child in visibleChildren"
            :key="child.id"
            :node="child"
            :node-path="currentPath"
            :readonly="readonly || node.metadata.readonly"
            :depth="depth + 1"
            :validation-errors="validationErrors"
            @update="handleChildUpdate"
            @remove="handleChildRemove"
            @scroll-to-new="(id) => emit('scrollToNew', id)"
          />
          <!-- Array: add another item -->
          <button
            v-if="!readonly && node.type === 'array' && node.metadata.repeatable"
            type="button"
            class="add-item-btn"
            @click="handleAddArrayItem"
          >
            <Icon name="lucide:plus" class="size-3.5" />
            {{ t('jsonld.editor.addAnotherItem', 'Add another') }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── Validation errors ─────────────────────────────── -->
    <p v-for="(err, i) in fieldErrors" :key="i" class="field-error">
      <Icon name="lucide:circle-alert" class="size-3 inline mr-1" />
      {{ err.message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { jsonldFieldsEn } from '../../../i18n/jsonld-fields';
import type { JsonLdNode as JsonLdNodeType, ValidationError } from '../types/editor.types';
import JsonLdField from './JsonLdField.vue';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ── Icon map (mirrors AddFieldDialog) ─────────────────────────
const FIELD_ICON_MAP: Record<string, string> = {
  'dcterms:title':              'lucide:type',
  'dcterms:description':        'lucide:align-left',
  'dcterms:identifier':         'lucide:fingerprint',
  'dcat:keyword':               'lucide:tag',
  'dcat:theme':                 'lucide:folder',
  'dcterms:type':               'lucide:layers',
  'dcat:landingPage':           'lucide:external-link',
  'dcterms:publisher':          'lucide:building-2',
  'dcterms:creator':            'lucide:user',
  'dcterms:issued':             'lucide:calendar-plus',
  'dcterms:modified':           'lucide:calendar-clock',
  'dcat:version':               'lucide:git-branch',
  'dcterms:accrualPeriodicity': 'lucide:refresh-cw',
  'dcat:inSeries':              'lucide:list-tree',
  'dcterms:spatial':            'lucide:map-pin',
  'dcterms:temporal':           'lucide:clock',
  'dcterms:language':           'lucide:languages',
  'dcterms:accessRights':       'lucide:shield',
  'dcterms:license':            'lucide:scale',
  'dcat:contactPoint':          'lucide:mail',
  'dcat:distribution':          'lucide:package',
  'dcat:accessURL':             'lucide:link',
  'dcat:downloadURL':           'lucide:download',
  'dcat:mediaType':             'lucide:file',
  'dcat:format':                'lucide:file-type',
  'dcat:byteSize':              'lucide:hard-drive',
};

interface Props {
  node: JsonLdNodeType;
  readonly?: boolean;
  depth?: number;
  validationErrors?: ValidationError[];
  nodePath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  depth: 0,
  validationErrors: () => [],
  nodePath: '',
});

const emit = defineEmits<{
  update: [node: JsonLdNodeType];
  remove: [nodeId: string];
  scrollToNew: [nodeId: string];
}>();

const { t } = useI18n();

// Direct lookup from the i18n source — avoids te() issues with colon-containing keys
type FieldKey = keyof typeof jsonldFieldsEn;
const fieldI18n = computed(() => jsonldFieldsEn[props.node.key as FieldKey] ?? null);

// ── Label, description, icon ───────────────────────────────────
const fieldLabel = computed(() => {
  if (fieldI18n.value?.label) return fieldI18n.value.label;
  if (props.node.metadata.label) return props.node.metadata.label;
  // Humanize raw key as last resort: "dcterms:title" → "Title"
  const raw = props.node.key.split(':').pop() || props.node.key;
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/([A-Z])/g, ' $1');
});

// Fallback descriptions for JSON-LD meta-keys that have no schema description
const META_KEY_DESCRIPTIONS: Record<string, string> = {
  '@value':    'The text value of this field',
  '@id':       'Unique identifier (URI)',
  '@language': 'Language code, e.g. en, nl, de',
  '@type':     'The type of this resource',
};

const fieldDescription = computed(() =>
  fieldI18n.value?.description ||
  props.node.metadata.description ||
  META_KEY_DESCRIPTIONS[props.node.key] ||
  null,
);

const fieldIconName = computed(() =>
  FIELD_ICON_MAP[props.node.key] ?? 'lucide:circle-dot',
);

// ── Children ───────────────────────────────────────────────────
const hasChildren = computed(() =>
  Array.isArray(props.node.children) &&
  (props.node.children.length > 0 || props.node.type === 'object' || props.node.type === 'array'),
);

const visibleChildren = computed(() =>
  (props.node.children ?? []).filter(c => !c.metadata.hidden),
);

const isExpanded = ref(true);
const toggleExpand = () => { isExpanded.value = !isExpanded.value; };

// ── Validation ─────────────────────────────────────────────────
const currentPath = computed(() =>
  props.nodePath ? `${props.nodePath}.${props.node.key}` : props.node.key,
);
const fieldErrors = computed(() =>
  props.validationErrors.filter(e => e.path === currentPath.value),
);
const hasValue = computed(() => {
  const v = props.node.value;
  if (v === undefined || v === null || v === '') return false;
  // language-string object: { '@value': '', '@language': 'en' }
  if (typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    if ('@value' in obj) return obj['@value'] !== '' && obj['@value'] !== undefined && obj['@value'] !== null;
  }
  return true;
});

// ── Char counter ─────────────────────────────────────────────────────────────


// Which types show a char counter?
const TEXT_TYPES = new Set(['string', 'language-string', 'uri']);
// These uri-type keys have dedicated format inputs — no char counter needed
const NO_CHAR_COUNT_KEYS = new Set([
  'vcard:hasEmail', 'vcard:hasTelephone', 'foaf:homepage',
  'dcat:landingPage', 'foaf:page', 'schema:url', 'vcard:hasURL',
]);
const charCountMax = computed(() => {
  if (props.node.key === 'dcterms:description') return 500;
  if (props.node.key === 'dcterms:title') return 120;
  return null;
});
const showCharCount = computed(() =>
  charCountMax.value !== null &&
  TEXT_TYPES.has(props.node.type) &&
  !NO_CHAR_COUNT_KEYS.has(props.node.key) &&
  !props.node.metadata.readonly,
);

const charCount = computed(() => {
  const v = props.node.value;
  if (!v) return 0;
  if (typeof v === 'string') return v.length;
  if (typeof v === 'object' && !Array.isArray(v)) {
    const obj = v as Record<string, unknown>;
    return typeof obj['@value'] === 'string' ? (obj['@value'] as string).length : 0;
  }
  return 0;
});

const charCountClass = computed(() => {
  const max = charCountMax.value;
  if (!max) return '';
  if (charCount.value > max) return 'char-counter--danger';
  if (charCount.value > max * 0.85) return 'char-counter--warn';
  return '';
});
const canRemoveNode = computed(() =>
  !props.node.metadata.required && (props.depth === 0),
);

// ── New-highlight ──────────────────────────────────────────────
const nodeRef = ref<HTMLElement | null>(null);
const isNewlyAdded = ref(false);

watch(
  () => props.node.metadata.isNew,
  (isNew) => {
    if (!isNew) return;
    isNewlyAdded.value = true;
    setTimeout(() => nodeRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    setTimeout(() => {
      isNewlyAdded.value = false;
      emit('update', { ...props.node, metadata: { ...props.node.metadata, isNew: false } });
    }, 2500);
  },
  { immediate: true },
);

// ── Handlers ───────────────────────────────────────────────────
const handleFieldUpdate = (value: unknown) => emit('update', { ...props.node, value });

const handleChildUpdate = (updatedChild: JsonLdNodeType) => {
  if (!props.node.children) return;
  emit('update', {
    ...props.node,
    children: props.node.children.map(c => c.id === updatedChild.id ? updatedChild : c),
  });
};

const handleChildRemove = (childId: string) => {
  if (!props.node.children) return;
  emit('update', {
    ...props.node,
    children: props.node.children.filter(c => c.id !== childId),
  });
};

const handleRemove = () => emit('remove', props.node.id);

const handleAddArrayItem = () => {
  if (props.node.type !== 'array' || !props.node.children?.length) return;
  const tpl = props.node.children[0];
  const newItem: JsonLdNodeType = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    key: tpl.key,
    type: tpl.type,
    value: tpl.type === 'object' ? undefined : '',
    children: tpl.children?.map(c => ({
      ...c,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      value: c.type === 'object' ? undefined : '',
    })),
    metadata: { ...tpl.metadata, isNew: true },
  };
  emit('update', { ...props.node, children: [...props.node.children, newItem] });
  emit('scrollToNew', newItem.id);
};
</script>

<style scoped>
/* ── Card ───────────────────────────────────────────────────── */
.field-card {
  background: transparent;
  border: none;
  border-radius: 0;
  overflow: visible;
  transition: background 0.12s;
}

:root.dark .field-card {
  background: transparent;
}

.field-card:focus-within {
  background: rgba(99, 102, 241, 0.03);
  box-shadow: none;
}

.field-card--nested {
  border-radius: 0;
}

/* ── Required field visual states ───────────────────────────── */
.field-card--required-empty {
  border-left: 3px solid hsl(38 92% 50% / 0.7); /* amber */
  transition: border-left-color 0.3s ease;
}
.field-card--required-filled {
  border-left: 3px solid hsl(142 71% 45% / 0.7); /* green */
  transition: border-left-color 0.3s ease;
}

/* ── Help (?) button ────────────────────────────────────────── */
.help-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.15s, color 0.15s;
}
.help-btn:hover {
  opacity: 1;
  color: hsl(var(--foreground));
}

/* ── Help tooltip content ────────────────────────────────────── */
:global(.help-tooltip) {
  max-width: 260px;
}
:global(.help-tooltip__desc) {
  font-size: 0.8rem;
  line-height: 1.45;
  margin: 0;
  color: inherit;
}
:global(.help-tooltip__example) {
  margin: 0.4rem 0 0;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  font-style: italic;
}
:global(.help-tooltip__eg) {
  font-weight: 600;
  font-style: normal;
  margin-right: 0.2rem;
}


.field-highlight {
  animation: highlight-pulse 2.5s ease-out;
}
@keyframes highlight-pulse {
  0%   { box-shadow: 0 0 0 3px rgba(34,197,94,0.35); border-color: #22c55e; }
  100% { box-shadow: none; border-color: #e5e7eb; }
}

/* ── Header ─────────────────────────────────────────────────── */
.field-header {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.35rem 0.75rem;
}

/* ── Inline icon ────────────────────────────────────────────── */
.field-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #6b7280;
  flex-shrink: 0;
  margin-top: 1px;
}

:root.dark .field-icon {
  background: #2e3035;
  color: #9ca3af;
}

/* ── Meta block (label + description) ──────────────────────── */
.field-meta {
  flex: 1;
  min-width: 0;
}

.field-label-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}
:root.dark .field-label { color: #f3f4f6; }

.field-desc {
  font-size: 0.76rem;
  color: #6b7280;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

/* ── Required asterisk ───────────────────────────────────────── */
.required-asterisk {
  color: #ef4444;
  font-weight: 700;
  font-size: 0.9rem;
  line-height: 1;
  flex-shrink: 0;
  margin-left: 1px;
}

/* ── Char counter ────────────────────────────────────────────── */
.char-counter {
  text-align: right;
  font-size: 0.68rem;
  color: hsl(var(--muted-foreground) / 0.7);
  padding-top: 2px;
  transition: color 0.2s;
}
.char-counter--warn   { color: hsl(38 70% 42%); }
.char-counter--danger { color: hsl(0 65% 48%); font-weight: 600; }

/* ── Compliance pill ────────────────────────────────────────── */
.compliance-pill {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 999px;
  line-height: 1.6;
}
.compliance-mandatory   { background: #fee2e2; color: #b91c1c; }
.compliance-recommended { background: #dbeafe; color: #1d4ed8; }
.compliance-optional    { background: #f3f4f6; color: #6b7280; }
:root.dark .compliance-mandatory   { background: rgba(185,28,28,0.25);  color: #fca5a5; }
:root.dark .compliance-recommended { background: rgba(29,78,216,0.25);  color: #93c5fd; }
:root.dark .compliance-optional    { background: rgba(107,114,128,0.2); color: #d1d5db; }

/* ── Expand/collapse button ─────────────────────────────────── */
.expand-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.13s, color 0.13s;
}
.expand-btn:hover { background: #f3f4f6; color: #374151; }
:root.dark .expand-btn { border-color: #374151; }
:root.dark .expand-btn:hover { background: #374151; color: #e5e7eb; }

/* ── Remove button ──────────────────────────────────────────── */
.remove-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s, background 0.13s, color 0.13s;
}
.field-card:hover .remove-btn,
.field-card:focus-within .remove-btn { opacity: 1; }
.remove-btn:hover { background: #fee2e2; color: #dc2626; }

/* ── Input area ─────────────────────────────────────────────── */
.field-input {
  position: relative;
  padding: 0 0.75rem 0.15rem;
}

/* ── Char counter ────────────────────────────────────────────── */
.char-counter {
  margin-left: auto;
  font-size: 0.68rem;
  color: hsl(var(--muted-foreground) / 0.6);
  pointer-events: none;
  white-space: nowrap;
  transition: color 0.2s;
}
.char-counter--warn   { color: hsl(38 70% 42%); }
.char-counter--danger { color: hsl(0 65% 48%); font-weight: 600; }

/* ── Nested fields ──────────────────────────────────────────── */
.nested-fields {
  display: flex;
  padding: 0 0.75rem 0 1rem;
  gap: 0;
}

/* Vertical connector line with tree corner └ at bottom */
.nested-connector {
  position: relative;
  width: 1px;
  background: #f0f0f0;
  border-radius: 0;
  margin-right: 0.875rem;
  margin-bottom: 2.75rem; /* ends at midpoint of last field's header row */
  flex-shrink: 0;
  align-self: stretch;
}

/* The └ corner at the bottom of the connector */
.nested-connector::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 10px;
  height: 10px;
  border-left: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  border-bottom-left-radius: 3px;
  background: transparent;
}

:root.dark .nested-connector {
  background: #2a2d31;
}
:root.dark .nested-connector::after {
  border-color: #2a2d31;
}

.nested-items {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}

/* Collapse animation */
.collapse-enter-active,
.collapse-leave-active {
  transition: opacity 0.2s ease, max-height 0.25s ease;
  max-height: 2000px;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

/* ── Add another (array) ────────────────────────────────────── */
.add-item-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6366f1;
  cursor: pointer;
  border: 1.5px dashed rgba(99,102,241,0.4);
  border-radius: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: transparent;
  width: 100%;
  justify-content: center;
  transition: background 0.13s, border-color 0.13s;
}
.add-item-btn:hover {
  background: rgba(99,102,241,0.06);
  border-color: #6366f1;
}

/* ── Validation error ───────────────────────────────────────── */
.field-error {
  display: flex;
  align-items: center;
  font-size: 0.78rem;
  color: #dc2626;
  padding: 0 1rem 0.25rem;
  margin: 0;
}
</style>
