<template>
  <div class="code-editor">
    <textarea
      v-model="code"
      :readonly="readonly"
      class="code-textarea font-mono text-sm"
      spellcheck="false"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: string;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const code = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  code.value = newValue;
});

const handleInput = () => {
  emit('update:modelValue', code.value);
};
</script>

<style scoped>
.code-editor {
  height: 100%;
  min-height: 400px;
}

.code-textarea {
  width: 100%;
  height: 100%;
  min-height: 400px;
  padding: 1rem;
  border: none;
  outline: none;
  resize: vertical;
  background: hsl(var(--muted) / 0.3);
  color: hsl(var(--foreground));
  line-height: 1.5;
  tab-size: 2;
}

.code-textarea:focus {
  background: hsl(var(--muted) / 0.5);
}
</style>
