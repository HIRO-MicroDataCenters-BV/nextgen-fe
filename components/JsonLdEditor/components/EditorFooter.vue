<script setup lang="ts">
import { computed } from "vue";
import AddFieldDialog from "./AddFieldDialog.vue";
import FooterProgress from "./FooterProgress.vue";
import FooterValidationList from "./FooterValidationList.vue";
import { useEditorFooterStats } from "../composables/useEditorFooterStats";
import type { FieldDefinition, JsonLdNode, ValidationError } from "../types/editor.types";

interface Props {
  currentMode: "visual" | "code";
  readonly: boolean;
  mandatoryProgress: { total: number; filled: number; pct: number };
  progressColorClass: string;
  complianceScore: number;
  validationErrors: ValidationError[];
  showAddFieldDialog: boolean;
  treeData: JsonLdNode[];
  canScrollToError: (errorPath: string) => boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:showAddFieldDialog", value: boolean): void;
  (e: "confirm-add-field", fieldDef: FieldDefinition): void;
  (e: "scroll-to-error", errorPath: string): void;
}>();

const { t } = useI18n();
const { existingKeys, errorCount, warningCount } = useEditorFooterStats({
  treeData: computed(() => props.treeData),
  validationErrors: computed(() => props.validationErrors),
});
</script>

<template>
  <div class="editor-footer border-t">
    <div v-if="currentMode === 'visual' && !readonly" class="add-field-row">
      <FooterProgress
        :mandatory-progress="mandatoryProgress"
        :progress-color-class="progressColorClass"
        :compliance-score="complianceScore"
        :error-count="errorCount"
        :warning-count="warningCount"
      />

      <button
        type="button"
        class="add-btn-gradient"
        @click="emit('update:showAddFieldDialog', true)"
      >
        <Icon name="lucide:plus" class="add-btn-icon size-4" />
        {{ t("jsonld.editor.addField") }}
      </button>

      <AddFieldDialog
        :open="showAddFieldDialog"
        :existing-keys="existingKeys"
        context="dataset"
        @update:open="emit('update:showAddFieldDialog', $event)"
        @confirm="emit('confirm-add-field', $event)"
      />
    </div>

    <FooterValidationList
      :validation-errors="validationErrors"
      :can-scroll-to-error="canScrollToError"
      @scroll-to-error="emit('scroll-to-error', $event)"
    />
  </div>
</template>

<style scoped>
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

.add-btn-gradient {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.875rem;
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
.add-btn-gradient:active {
  transform: translateY(0);
  box-shadow: none;
}

.add-btn-icon {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.add-btn-gradient:hover .add-btn-icon {
  transform: rotate(90deg);
}

</style>
