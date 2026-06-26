<template>
  <div class="code-editor">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="searchQuery && highlightedCode" class="code-display" v-html="highlightedCode" />
    <textarea
      v-else
      v-model="code"
      :readonly="readonly"
      class="code-textarea"
      spellcheck="false"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

interface Props {
  modelValue: string;
  readonly?: boolean;
  searchQuery?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  searchQuery: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const code = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  code.value = newValue;
});

// Highlight search matches
const highlightedCode = computed(() => {
  if (!props.searchQuery || !code.value) return null;
  
  const query = props.searchQuery;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedQuery, 'gi');
  
  return code.value.replace(regex, (match) => `<mark class="search-highlight">${match}</mark>`);
});

const handleInput = () => {
  emit('update:modelValue', code.value);
};
</script>

<style scoped>
.code-editor {
  position: absolute;
  inset: 0;
}

.code-textarea,
.code-display {
  width: 100%;
  height: 100%;
  padding: 1rem;
  border: none;
  outline: none;
  resize: none;
  background: hsl(var(--muted) / 0.3);
  color: hsl(var(--foreground));
  line-height: 1.65;
  tab-size: 2;
  font-family: 'Geist Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 0.8125rem;
  font-variant-ligatures: none;
  letter-spacing: 0.01em;
}

.code-display {
  white-space: pre;
  overflow-wrap: normal;
  word-break: normal;
  overflow-y: auto;
}

.code-textarea:focus {
  background: hsl(var(--muted) / 0.5);
}

:deep(.search-highlight) {
  background-color: #ffeb3b;
  color: #000;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 500;
}
</style>
