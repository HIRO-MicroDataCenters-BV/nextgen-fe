<template>
  <button
    type="button"
    class="field-card"
    :class="{ 'field-card--added': added }"
    :disabled="added"
    @click="emit('select')"
  >
    <span class="card-icon-wrap" :class="`card-icon--${field.dcatApCompliance ?? 'optional'}`">
      <Icon :name="field.icon ?? 'lucide:circle-dot'" class="size-5" />
    </span>

    <span class="card-body">
      <span class="card-name">{{ field.label }}</span>
      <span v-if="field.description" class="card-desc">{{ field.description }}</span>
    </span>

    <span v-if="added" class="status-pill status-pill--added">✓ {{ t('jsonld.editor.addFieldDialog.alreadyAdded') }}</span>
    <span
      v-else-if="field.dcatApCompliance === 'mandatory'"
      class="status-pill status-pill--mandatory"
    >{{ t('jsonld.editor.compliance.mandatory') }}</span>
    <span
      v-else-if="field.dcatApCompliance === 'recommended'"
      class="status-pill status-pill--recommended"
    >{{ t('jsonld.editor.compliance.recommended') }}</span>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { FieldDefinition } from "../types/editor.types";

interface Props {
  field: FieldDefinition;
  added: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  select: [];
}>();

const { t } = useI18n();
</script>

<style scoped>
.field-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.875rem 0.875rem 0.75rem;
  background: #ffffff;
  border: 1.5px solid #e5e7eb;
  border-radius: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.18s ease-out,
    box-shadow 0.18s ease-out,
    transform 0.18s ease-out;
  position: relative;
}

.field-card:not(.field-card--added):hover {
  border-color: #9ca3af;
  box-shadow:
    0 0 0 3px hsl(var(--primary) / 0.12),
    0 2px 10px -2px hsl(var(--primary) / 0.08);
  transform: translateY(-1px);
}

.field-card:not(.field-card--added):active {
  transform: translateY(0);
}

.field-card--added {
  opacity: 0.45;
  cursor: not-allowed;
}

.card-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  transition:
    background 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f3f4f6;
  color: #6b7280;
}

.card-icon--mandatory {
  background: #fee2e2;
  color: #b91c1c;
}
.card-icon--recommended {
  background: #dbeafe;
  color: #1d4ed8;
}
.card-icon--optional {
  background: #f3f4f6;
  color: #6b7280;
}

:root.dark .card-icon--mandatory {
  background: #450a0a;
  color: #fca5a5;
}
:root.dark .card-icon--recommended {
  background: #1e3a5f;
  color: #93c5fd;
}
:root.dark .card-icon--optional {
  background: #1f2937;
  color: #9ca3af;
}
:root.dark .field-card {
  background: #1f2937;
  border-color: #374151;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.card-name {
  font-size: 0.83rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1.3;
}

.card-desc {
  font-size: 0.72rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.status-pill {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 999px;
  line-height: 1.6;
  margin-top: auto;
}

.status-pill--mandatory {
  background: hsl(0 80% 94%);
  color: hsl(0 70% 40%);
}
.status-pill--recommended {
  background: hsl(214 80% 93%);
  color: hsl(214 70% 38%);
}
.status-pill--added {
  background: hsl(142 60% 92%);
  color: hsl(142 50% 30%);
}

:root.dark .status-pill--mandatory {
  background: hsl(0 50% 22%);
  color: hsl(0 90% 80%);
}
:root.dark .status-pill--recommended {
  background: hsl(214 50% 22%);
  color: hsl(214 90% 80%);
}
:root.dark .status-pill--added {
  background: hsl(142 40% 18%);
  color: hsl(142 80% 70%);
}
</style>
