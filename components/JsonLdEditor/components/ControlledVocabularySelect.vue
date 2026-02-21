<script setup lang="ts">
import { computed } from 'vue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VocabularyOption {
  value: string;
  label: string;
  description?: string;
  chipLabel?: string;
  icon?: string;
}

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

const vocabularies: Record<string, VocabularyOption[]> = {
  accessRights: [
    {
      value: 'http://publications.europa.eu/resource/authority/access-right/PUBLIC',
      label: 'Public',
      chipLabel: 'Public',
      icon: 'lucide:globe',
      description: 'Freely accessible to everyone',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/access-right/RESTRICTED',
      label: 'Restricted',
      chipLabel: 'Restricted',
      icon: 'lucide:lock',
      description: 'Access limited to authorised users',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/access-right/NON_PUBLIC',
      label: 'Non-public',
      chipLabel: 'Non-public',
      icon: 'lucide:ban',
      description: 'Not externally accessible',
    },
  ],
  language: [
    {
      value: 'http://publications.europa.eu/resource/authority/language/ENG',
      label: 'English (ENG)',
      chipLabel: 'EN',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/NLD',
      label: 'Dutch (NLD)',
      chipLabel: 'NL',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/DEU',
      label: 'German (DEU)',
      chipLabel: 'DE',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/FRA',
      label: 'French (FRA)',
      chipLabel: 'FR',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/SPA',
      label: 'Spanish (SPA)',
      chipLabel: 'ES',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/ITA',
      label: 'Italian (ITA)',
      chipLabel: 'IT',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/RUS',
      label: 'Russian (RUS)',
      chipLabel: 'RU',
    },
  ],
};

const options = computed(() => vocabularies[props.vocabulary] || []);

// Use chip UI when ≤ 6 options and all have chipLabel
const useChips = computed(() =>
  options.value.length <= 6 && options.value.every(o => o.chipLabel),
);

const selectedLabel = computed(() => {
  const option = options.value.find((opt) => opt.value === props.modelValue);
  return option?.label || props.placeholder;
});

const handleValueChange = (value: unknown) => {
  if (value && typeof value === 'string') {
    emit('update:modelValue', value);
  }
};

const selectChip = (value: string) => {
  if (props.readonly) return;
  // Toggle: clicking selected chip clears it
  emit('update:modelValue', props.modelValue === value ? '' : value);
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
      :class="{ 'chip--selected': modelValue === option.value }"
      :disabled="readonly"
      :title="option.description"
      @click="selectChip(option.value)"
    >
      <Icon v-if="option.icon" :name="option.icon" class="size-3.5 shrink-0" />
      {{ option.chipLabel }}
    </button>
  </div>

  <!-- ── Dropdown mode (> 6 options) ──────────── -->
  <Select v-else :model-value="modelValue" :disabled="readonly" @update:model-value="handleValueChange">
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
