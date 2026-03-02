<template>
  <div class="jsonld-field">
    <!-- Controlled Vocabulary Select -->
    <ControlledVocabularySelect
      v-if="node.metadata.vocabulary"
      :model-value="String(node.value || '')"
      :vocabulary="node.metadata.vocabulary"
      :readonly="readonly"
      :placeholder="node.metadata.placeholder"
      @update:model-value="handleUpdate"
    />

    <!-- Email (vcard:hasEmail) — type="email", auto mailto: -->
    <Input
      v-else-if="node.key === 'vcard:hasEmail'"
      type="email"
      :model-value="emailDisplayValue"
      :readonly="readonly"
      placeholder="contact@example.com"
      @update:model-value="handleEmailUpdate"
    />

    <!-- Phone (vcard:hasTelephone) — type="tel", auto tel: -->
    <Input
      v-else-if="node.key === 'vcard:hasTelephone'"
      type="tel"
      :model-value="telDisplayValue"
      :readonly="readonly"
      placeholder="+31-20-555-0100"
      @update:model-value="handleTelUpdate"
    />

    <!-- URL fields -->
    <Input
      v-else-if="URL_FIELD_KEYS.has(node.key)"
      type="url"
      :model-value="displayValue"
      :readonly="readonly"
      :placeholder="node.metadata.placeholder || 'https://example.com'"
      @update:model-value="handleUpdate"
    />

    <!-- Regular string/uri -->
    <Input
      v-else-if="node.type === 'string' || node.type === 'uri'"
      :model-value="displayValue"
      :readonly="readonly"
      :placeholder="node.metadata.placeholder"
      @update:model-value="handleUpdate"
    />

    <!-- Language-string -->
    <div v-else-if="node.type === 'language-string'" class="flex gap-2 w-full">
      <Input
        :model-value="languageValue"
        :readonly="readonly"
        :placeholder="node.metadata.placeholder"
        class="flex-1"
        @update:model-value="(v: string | number) => handleLanguageValueUpdate(String(v))"
      />
      <Select
        :model-value="languageCode"
        :disabled="readonly"
        @update:model-value="(v) => handleLanguageCodeUpdate(String(v ?? 'en'))"
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

    <DatePickerField
      v-else-if="node.type === 'date'"
      :model-value="String(node.value || '')"
      :readonly="readonly"
      :placeholder="node.metadata.placeholder"
      @update:model-value="handleUpdate"
    />

    <!-- Fallback: render as plain text for any unrecognised type -->
    <Input
      v-else
      :model-value="displayValue"
      :readonly="readonly"
      :placeholder="node.metadata.placeholder"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ControlledVocabularySelect from './ControlledVocabularySelect.vue';
import DatePickerField from './DatePickerField.vue';
import type { JsonLdNode, ValidationError } from '../types/editor.types';

const URL_FIELD_KEYS = new Set([
  'foaf:homepage', 'dcat:landingPage', 'foaf:page', 'schema:url', 'vcard:hasURL',
]);

interface Props {
  node: JsonLdNode;
  readonly?: boolean;
  validationErrors?: ValidationError[];
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  validationErrors: () => [],
});

const emit = defineEmits<{ update: [value: unknown] }>();

const displayValue = computed(() => {
  const v = props.node.value;
  if (v === null || v === undefined) return '';
  // Array of typed literals: [{ "@type": "xsd:string", "@value": "..." }, ...]
  // or array of plain strings → join with comma for display
  if (Array.isArray(v)) {
    return v.map(item => {
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        if ('@value' in obj) return String(obj['@value']);
        if ('@id' in obj) return String(obj['@id']);
      }
      return String(item);
    }).join(', ');
  }
  return String(v);
});

// Email: store as mailto:..., show bare address in input
const emailDisplayValue = computed(() => {
  const raw = String(props.node.value || '');
  return raw.startsWith('mailto:') ? raw.slice(7) : raw;
});
const handleEmailUpdate = (v: string | number) => {
  const bare = String(v).trim();
  emit('update', bare ? `mailto:${bare}` : '');
};

// Phone: store as tel:..., show bare number in input
const telDisplayValue = computed(() => {
  const raw = String(props.node.value || '');
  return raw.startsWith('tel:') ? raw.slice(4) : raw;
});
const handleTelUpdate = (v: string | number) => {
  const bare = String(v).trim();
  emit('update', bare ? `tel:${bare}` : '');
};

// Language-string
const languageValue = computed(() => {
  if (props.node.type === 'language-string' && props.node.value && typeof props.node.value === 'object') {
    const v = props.node.value as Record<string, unknown>;
    return String(v['@value'] ?? '');
  }
  return '';
});

const languageCode = computed(() => {
  if (props.node.type === 'language-string' && props.node.value && typeof props.node.value === 'object') {
    const v = props.node.value as Record<string, unknown>;
    return String(v['@language'] ?? 'en');
  }
  return 'en';
});

const handleUpdate = (value: unknown) => {
  // For array-typed nodes (e.g. dcat:keyword), the user edits a comma-separated string.
  // Convert back to the correct array format, preserving the original item structure.
  if (props.node.type === 'array' && Array.isArray(props.node.value)) {
    const raw = String(value);
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    // Detect original item format from the first element
    const firstItem = props.node.value[0];
    const xsdType = (typeof firstItem === 'object' && firstItem !== null && '@type' in (firstItem as object))
      ? (firstItem as Record<string, unknown>)['@type']
      : null;
    const rebuilt = parts.map(part =>
      xsdType
        ? { '@type': xsdType, '@value': part }
        : part
    );
    emit('update', rebuilt);
    return;
  }
  emit('update', value);
};

const handleLanguageValueUpdate = (value: string) => {
  emit('update', { '@language': languageCode.value, '@value': value });
};

const handleLanguageCodeUpdate = (lang: string) => {
  emit('update', { '@language': lang, '@value': languageValue.value });
};
</script>

<style scoped>
.jsonld-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.jsonld-field > :deep(input),
.jsonld-field > :deep(.input),
.jsonld-field > :deep([data-slot="input"]) {
  width: 100%;
}
</style>
