<script setup lang="ts">
import { computed } from 'vue';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VocabularyOption {
  value: string;
  label: string;
  description?: string;
}

interface Props {
  modelValue: string;
  vocabulary: 'accessRights' | 'language';
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
      label: 'PUBLIC',
      description: 'Publicly accessible',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/access-right/RESTRICTED',
      label: 'RESTRICTED',
      description: 'Restricted access',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/access-right/NON_PUBLIC',
      label: 'NON_PUBLIC',
      description: 'Not publicly accessible',
    },
  ],
  language: [
    {
      value: 'http://publications.europa.eu/resource/authority/language/ENG',
      label: 'English (ENG)',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/NLD',
      label: 'Dutch (NLD)',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/DEU',
      label: 'German (DEU)',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/FRA',
      label: 'French (FRA)',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/SPA',
      label: 'Spanish (SPA)',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/ITA',
      label: 'Italian (ITA)',
    },
    {
      value: 'http://publications.europa.eu/resource/authority/language/RUS',
      label: 'Russian (RUS)',
    },
  ],
};

const options = computed(() => vocabularies[props.vocabulary] || []);

const selectedLabel = computed(() => {
  const option = options.value.find((opt) => opt.value === props.modelValue);
  return option?.label || props.placeholder;
});

const handleValueChange = (value: string | null) => {
  if (value) {
    emit('update:modelValue', value);
  }
};
</script>

<template>
  <Select :model-value="modelValue" :disabled="readonly" @update:model-value="handleValueChange">
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
