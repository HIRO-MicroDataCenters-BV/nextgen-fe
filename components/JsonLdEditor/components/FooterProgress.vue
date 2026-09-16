<template>
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
    <span v-else-if="errorCount > 0" class="stat-badge stat-error">
      <Icon name="lucide:circle-x" class="size-3" />
      {{ errorCount }}
      {{ t("jsonld.editor.errors", "errors") }}
    </span>
    <span v-else-if="warningCount > 0" class="stat-badge stat-warn">
      <Icon name="lucide:triangle-alert" class="size-3" />
      {{ warningCount }} {{ t("jsonld.editor.warnings", "warnings") }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  mandatoryProgress: { total: number; filled: number; pct: number };
  progressColorClass: string;
  complianceScore: number;
  errorCount: number;
  warningCount: number;
}

defineProps<Props>();

const { t } = useI18n();
</script>

<style scoped>
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
</style>
