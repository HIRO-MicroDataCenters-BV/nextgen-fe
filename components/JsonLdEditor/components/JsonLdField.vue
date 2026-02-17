<template>
  <div class="jsonld-field">
    <!-- Controlled Vocabulary Select for URI fields with vocabulary -->
    <ControlledVocabularySelect
      v-if="node.type === 'uri' && node.metadata.vocabulary"
      :model-value="String(node.value || '')"
      :vocabulary="node.metadata.vocabulary"
      :readonly="readonly"
      :placeholder="node.metadata.placeholder"
      @update:model-value="handleUpdate"
    />

    <!-- Regular Input for string/uri without vocabulary -->
    <Input
      v-else-if="node.type === 'string' || node.type === 'uri'"
      :model-value="displayValue"
      :readonly="readonly"
      :placeholder="node.metadata.placeholder"
      @update:model-value="handleUpdate"
    />

    <div v-else-if="node.type === 'language-string'" class="flex gap-2">
      <Input
        :model-value="languageValue"
        :readonly="readonly"
        :placeholder="node.metadata.placeholder"
        class="flex-1"
        @update:model-value="handleLanguageValueUpdate"
      />
      <Select
        :model-value="languageCode"
        :disabled="readonly"
        @update:model-value="handleLanguageCodeUpdate"
      >
        <SelectTrigger class="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">EN</SelectItem>
          <SelectItem value="nl">NL</SelectItem>
          <SelectItem value="de">DE</SelectItem>
          <SelectItem value="fr">FR</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Input
      v-else-if="node.type === 'number'"
      type="number"
      :model-value="displayValue"
      :readonly="readonly"
      :placeholder="node.metadata.placeholder"
      @update:model-value="handleUpdate"
    />

    <Checkbox
      v-else-if="node.type === 'boolean'"
      :checked="Boolean(node.value)"
      :disabled="readonly"
      @update:checked="handleUpdate"
    />

    <!-- Date Picker for date fields -->
    <DatePickerField
      v-else-if="node.type === 'date'"
      :model-value="String(node.value || '')"
      :readonly="readonly"
      :placeholder="node.metadata.placeholder"
      @update:model-value="handleUpdate"
    />

    <span v-else class="text-sm text-muted-foreground">
      {{ node.type }}
    </span>

    <!-- Inline Validation Errors -->
    <Alert v-for="(error, index) in validationErrors" :key="index" :variant="error.severity === 'error' ? 'destructive' : 'default'" class="mt-2">
      <Icon :name="error.severity === 'error' ? 'lucide:circle-x' : 'lucide:triangle-alert'" class="size-4" />
      <AlertDescription>{{ error.message }}</AlertDescription>
    </Alert>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ControlledVocabularySelect from './ControlledVocabularySelect.vue';
import DatePickerField from './DatePickerField.vue';
import type { JsonLdNode, ValidationError } from '../types/editor.types';

interface Props {
  node: JsonLdNode;
  readonly?: boolean;
  validationErrors?: ValidationError[];
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  validationErrors: () => [],
});

const emit = defineEmits<{
  update: [value: unknown];
}>();

const displayValue = computed(() => {
  if (props.node.value === null || props.node.value === undefined) {
    return '';
  }
  return String(props.node.value);
});

const languageValue = computed(() => {
  if (props.node.type === 'language-string' && typeof props.node.value === 'object') {
    return props.node.value['@value'] || '';
  }
  return '';
});

const languageCode = computed(() => {
  if (props.node.type === 'language-string' && typeof props.node.value === 'object') {
    return props.node.value['@language'] || 'en';
  }
  return 'en';
});

const handleUpdate = (value: unknown) => {
  emit('update', value);
};

const handleLanguageValueUpdate = (value: string) => {
  emit('update', {
    '@language': languageCode.value,
    '@value': value,
  });
};

const handleLanguageCodeUpdate = (lang: string) => {
  emit('update', {
    '@language': lang,
    '@value': languageValue.value,
  });
};
</script>

<style scoped>
.jsonld-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
