<template>
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
        @click="canScrollToError(error.path) ? emit('scroll-to-error', error.path) : undefined"
        @keydown.enter="canScrollToError(error.path) ? emit('scroll-to-error', error.path) : undefined"
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
</template>

<script setup lang="ts">
import type { ValidationError } from "../types/editor.types";

interface Props {
  validationErrors: ValidationError[];
  canScrollToError: (errorPath: string) => boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "scroll-to-error", errorPath: string): void;
}>();

const { t } = useI18n();
</script>

<style scoped>
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
