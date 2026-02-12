<template>
  <div class="jsonld-field">
    <Input
      v-if="node.type === 'string' || node.type === 'uri'"
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

    <Input
      v-else-if="node.type === 'date'"
      type="datetime-local"
      :model-value="displayValue"
      :readonly="readonly"
      @update:model-value="handleUpdate"
    />

    <span v-else class="text-sm text-muted-foreground">
      {{ node.type }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JsonLdNode } from '../types/editor.types';

interface Props {
  node: JsonLdNode;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
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
