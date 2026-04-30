<template>
  <div
    v-if="!node.metadata.hidden"
    ref="nodeRef"
    :data-node-id="node.id"
    :data-node-path="currentPath"
    class="field-card"
    :class="{
      'field-highlight': isNewlyAdded,
      'field-flash': isFlashing,
      'field-card--nested': depth > 0,
      'field-card--required-empty': isDcatMandatory && !hasValue,
      'field-card--required-filled': isDcatMandatory && hasValue,
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
          <span v-if="isDcatMandatory && !hasValue" class="required-asterisk" title="This field is required">*</span>
          <span
            v-if="node.metadata.dcatApCompliance"
            class="compliance-pill"
            :class="`compliance-${node.metadata.dcatApCompliance}`"
          >
            {{ t(`jsonld.editor.compliance.${node.metadata.dcatApCompliance}`) }}
          </span>
          <span
            v-if="isFromMmio || isFromFile"
            class="readonly-pill"
            :title="t('jsonld.editor.fromMmioReadonly', 'Loaded from MMIO file — read-only')"
          >
            <Icon name="lucide:lock" class="size-3" />
            {{ t('jsonld.editor.readonly', 'Read-only') }}
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
        :title="isExpanded ? t('jsonld.editor.collapseField') : t('jsonld.editor.expandField')"
        @click.stop="toggleExpand"
      >
        <Icon
          :name="isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'"
          class="size-4"
        />
      </button>

      <!-- Remove button -->
      <button
        v-if="!effectiveReadonly && canRemoveNode"
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
        :readonly="effectiveReadonly"
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
            :readonly="readonly"
            :depth="depth + 1"
            :validation-errors="validationErrors"
            @update="handleChildUpdate"
            @remove="handleChildRemove"
            @scroll-to-new="(id) => emit('scrollToNew', id)"
          />
          <!-- Array: add another item -->
          <button
            v-if="!effectiveReadonly && node.type === 'array' && node.metadata.repeatable"
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
import { ref, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { JsonLdNode as JsonLdNodeType, ValidationError } from '../types/editor.types';
import JsonLdField from './JsonLdField.vue';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useJsonLdTransform } from '../composables/useJsonLdTransform';
import { useJsonLdSchema } from '../composables/useJsonLdSchema';
import { useJsonLdNodeMeta } from '../composables/useJsonLdNodeMeta';
import { useJsonLdNodeActions } from '../composables/useJsonLdNodeActions';
import { useJsonLdNodeEffects } from '../composables/useJsonLdNodeEffects';


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
const { createDefaultNode } = useJsonLdTransform();
const { getFieldDefinition, distributionSchema } = useJsonLdSchema();
const {
  fieldLabel,
  fieldDescription,
  fieldIconName,
  hasChildren,
  visibleChildren,
  currentPath,
  isFromMmio,
  isFromFile,
  effectiveReadonly,
  fieldErrors,
  hasValue,
  isDcatMandatory,
  showCharCount,
  charCount,
  charCountMax,
  charCountClass,
  canRemoveNode,
} = useJsonLdNodeMeta({
  node: toRef(props, 'node'),
  nodePath: toRef(props, 'nodePath'),
  readonly: toRef(props, 'readonly'),
  depth: toRef(props, 'depth'),
  validationErrors: toRef(props, 'validationErrors'),
});
const {
  handleFieldUpdate,
  handleChildUpdate,
  handleChildRemove,
  handleRemove,
  handleAddArrayItem,
} = useJsonLdNodeActions({
  node: toRef(props, 'node'),
  emitUpdate: (node) => emit('update', node),
  emitRemove: (nodeId) => emit('remove', nodeId),
  getFieldDefinition,
  distributionSchema,
  createDefaultNode,
});
const { nodeRef, isFlashing, isNewlyAdded, flashHighlight } = useJsonLdNodeEffects({
  node: toRef(props, 'node'),
  emitUpdate: (node) => emit('update', node),
});

const isExpanded = ref(true);
const toggleExpand = () => { isExpanded.value = !isExpanded.value; };

// ── Validation ─────────────────────────────────────────────────
defineExpose({ flashHighlight, currentPath });

</script>

<style scoped src="../assets/JsonLdNode.css"></style>
