<script setup lang="ts">
import { computed } from 'vue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONTROLLED_VOCABULARIES } from '../constants/vocabularies';
import { matchesVocabularyOption } from '../composables/useVocabularyMatching';

interface Props {
  modelValue: string;
  vocabulary: import('../types/editor.types').ControlledVocabulary;
  readonly?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  placeholder: 'Select...',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const options = computed(() => CONTROLLED_VOCABULARIES[props.vocabulary] ?? []);

// Use chip UI when ≤ 6 options and all have chipLabel
const useChips = computed(() =>
  options.value.length <= 6 && options.value.every(o => o.chipLabel),
);

const selectedOption = computed(() =>
  options.value.find((opt) => matchesVocabularyOption(opt, props.modelValue)),
);

const selectedLabel = computed(() =>
  selectedOption.value?.label || props.placeholder,
);

const handleValueChange = (value: unknown) => {
  if (value && typeof value === 'string') {
    emit('update:modelValue', value);
  }
};

const selectChip = (value: string) => {
  if (props.readonly) return;
  // Toggle: clicking selected chip clears it
  const alreadySelected = selectedOption.value?.value === value;
  emit('update:modelValue', alreadySelected ? '' : value);
};
</script>

<template>
  <!-- ── Chip mode (≤ 6 options) ───────────────── -->
  <div v-if="useChips" class="chip-group" :class="{ 'chip-group--disabled': readonly }">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="chip"
      :class="{ 'chip--selected': selectedOption?.value === option.value }"
      :disabled="readonly"
      :title="option.description"
      @click="selectChip(option.value)"
    >
      <Icon v-if="option.icon" :name="option.icon" class="size-3.5 shrink-0" />
      {{ option.chipLabel }}
    </button>
  </div>

  <!-- ── Dropdown mode (> 6 options) ──────────── -->
  <Select v-else :model-value="selectedOption?.value || modelValue" :disabled="readonly" @update:model-value="handleValueChange">
    <SelectTrigger class="w-full">
      <SelectValue :placeholder="placeholder">
        {{ selectedLabel }}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-for="option in options" :key="option.value" :value="option.value">
        <div class="flex flex-col">
          <span>{{ option.label }}</span>
          <span v-if="option.description" class="text-xs text-muted-foreground">
            {{ option.description }}
          </span>
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
</template>

<style scoped>
/* ── Chip group ──────────────────────────────────────────────── */
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  width: 100%;
}
.chip-group--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  border: 1.5px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--muted-foreground));
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  line-height: 1.4;
}

.chip:hover:not(:disabled) {
  border-color: hsl(var(--foreground) / 0.4);
  color: hsl(var(--foreground));
  background: hsl(var(--muted) / 0.5);
}

.chip--selected {
  background: #4f46e5 !important;
  border-color: #4f46e5 !important;
  color: #ffffff !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 6px rgba(79, 70, 229, 0.4);
}

.chip--selected:hover:not(:disabled) {
  background: #4338ca !important;
  border-color: #4338ca !important;
  color: #ffffff !important;
}
</style>

