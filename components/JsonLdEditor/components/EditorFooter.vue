<script setup lang="ts">
import AddFieldDialog from "./AddFieldDialog.vue";
import type { FieldDefinition, JsonLdNode } from "../types/editor.types";

interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

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

defineProps<Props>();

const emit = defineEmits<{
  (e: "update:showAddFieldDialog", value: boolean): void;
  (e: "confirm-add-field", fieldDef: FieldDefinition): void;
  (e: "scroll-to-error", errorPath: string): void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="editor-footer border-t">
    <div v-if="currentMode === 'visual' && !readonly" class="add-field-row">
      <div class="completion-block">
        <div class="completion-label">
          <span class="completion-text">
            <template v-if="mandatoryProgress.total === 0">
              {{ t("jsonld.editor.noRequiredFields") }}
            </template>
            <template v-else-if="mandatoryProgress.filled === mandatoryProgress.total">
              <Icon name="lucide:circle-check" class="size-3 inline" />
              {{ t("jsonld.editor.allRequiredComplete") }}
            </template>
            <template v-else>
              {{ mandatoryProgress.filled }}
              {{ t("jsonld.editor.ofRequiredFields", { total: mandatoryProgress.total }) }}
            </template>
          </span>
          <span class="completion-pct"> {{ mandatoryProgress.pct }}% </span>
        </div>
        <div class="progress-track">
          <div
            class="progress-bar"
            :class="progressColorClass"
            :style="{ width: mandatoryProgress.pct + '%' }"
          />
        </div>
      </div>

      <div class="footer-compliance">
        <span v-if="complianceScore === 100" class="stat-badge stat-ok">
          <Icon name="lucide:circle-check" class="size-3" /> DCAT-AP ✓
        </span>
        <span
          v-else-if="validationErrors.filter((e) => e.severity === 'error').length > 0"
          class="stat-badge stat-error"
        >
          <Icon name="lucide:circle-x" class="size-3" />
          {{ validationErrors.filter((e) => e.severity === 'error').length }}
          {{ t("jsonld.editor.errors", "errors") }}
        </span>
        <span
          v-else-if="validationErrors.length > 0"
          class="stat-badge stat-warn"
        >
          <Icon name="lucide:triangle-alert" class="size-3" />
          {{ validationErrors.length }} {{ t("jsonld.editor.warnings", "warnings") }}
        </span>
      </div>

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
        :existing-keys="treeData.map((n) => n.key)"
        context="dataset"
        @update:open="emit('update:showAddFieldDialog', $event)"
        @confirm="emit('confirm-add-field', $event)"
      />
    </div>

    <div v-if="validationErrors.length > 0" class="validation-block">
      <div class="validation-header">
        <Icon name="lucide:shield-alert" class="size-4 text-destructive" />
        <span class="text-sm font-semibold">{{ t("jsonld.editor.validationErrors") }}</span>
      </div>
      <div class="validation-list">
        <div
          v-for="(error, index) in validationErrors"
          :key="index"
          class="validation-item"
          :class="[
            error.severity === 'error' ? 'validation-item--error' : 'validation-item--warn',
            canScrollToError(error.path) ? 'validation-item--navigable' : '',
          ]"
          v-bind="
            canScrollToError(error.path)
              ? {
                  role: 'button',
                  tabindex: '0',
                  title: t('jsonld.editor.clickToNavigate', 'Click to navigate to field'),
                }
              : {}
          "
          @click="
            canScrollToError(error.path)
              ? emit('scroll-to-error', error.path)
              : undefined
          "
          @keydown.enter="
            canScrollToError(error.path)
              ? emit('scroll-to-error', error.path)
              : undefined
          "
        >
          <Icon
            :name="error.severity === 'error' ? 'lucide:circle-x' : 'lucide:triangle-alert'"
            class="size-3.5 flex-shrink-0"
          />
          <span>{{ error.message }}</span>
          <Icon
            v-if="canScrollToError(error.path)"
            name="lucide:arrow-up-right"
            class="size-3 ml-auto flex-shrink-0 opacity-40"
          />
        </div>
      </div>
    </div>
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

.progress--red {
  background: hsl(0 72% 51%);
  color: hsl(0 60% 38%);
}
.progress--amber {
  background: hsl(38 92% 50%);
  color: hsl(38 70% 36%);
}
.progress--green {
  background: hsl(142 60% 42%);
  color: hsl(142 50% 28%);
}
:root.dark .progress--red {
  background: hsl(0 72% 58%);
  color: hsl(0 80% 75%);
}
:root.dark .progress--amber {
  background: hsl(38 80% 55%);
  color: hsl(38 80% 70%);
}
:root.dark .progress--green {
  background: hsl(142 60% 52%);
  color: hsl(142 70% 65%);
}

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
.stat-ok {
  background: hsl(142 60% 90%);
  color: hsl(142 50% 28%);
}
.stat-error {
  background: hsl(0 72% 93%);
  color: hsl(0 60% 38%);
}
.stat-warn {
  background: hsl(38 92% 92%);
  color: hsl(38 70% 36%);
}
:root.dark .stat-ok {
  background: hsl(142 40% 18%);
  color: hsl(142 70% 65%);
}
:root.dark .stat-error {
  background: hsl(0 45% 20%);
  color: hsl(0 80% 75%);
}
:root.dark .stat-warn {
  background: hsl(38 50% 18%);
  color: hsl(38 80% 70%);
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
.validation-item--navigable:hover .iconify:last-child {
  opacity: 0.7;
}

.validation-item--error .iconify:first-child {
  color: hsl(0 70% 48%);
}
.validation-item--warn .iconify:first-child {
  color: hsl(38 80% 42%);
}
:root.dark .validation-item--error .iconify:first-child {
  color: hsl(0 80% 72%);
}
:root.dark .validation-item--warn .iconify:first-child {
  color: hsl(38 80% 65%);
}
</style>
