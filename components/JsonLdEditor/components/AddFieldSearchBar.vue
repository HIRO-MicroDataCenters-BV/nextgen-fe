<template>
  <div class="panel-search">
    <Icon name="lucide:search" class="search-icon" />
    <input
      ref="searchInputRef"
      :value="modelValue"
      class="search-input"
      type="text"
      :placeholder="placeholder"
      @input="handleInput"
    >
    <button v-if="modelValue" class="clear-btn" type="button" @click="emit('update:modelValue', '')">
      <Icon name="lucide:x" class="size-3.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Props {
  modelValue: string;
  placeholder: string;
}

defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const searchInputRef = ref<HTMLInputElement | null>(null);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  emit("update:modelValue", target?.value ?? "");
};

const focusInput = () => {
  searchInputRef.value?.focus();
};

defineExpose({ focusInput });
</script>

<style scoped>
.panel-search {
  position: relative;
  padding: 0.875rem 1.5rem;
  border-bottom: 1px solid hsl(var(--border, 220 13% 88%));
  box-shadow: var(--sticky-shadow);
  flex-shrink: 0;
  background: inherit;
  z-index: 1;
}

.search-icon {
  position: absolute;
  left: 2.25rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: hsl(var(--muted-foreground));
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 2.5rem 0 2.5rem;
  border-radius: 0.625rem;
  border: 1.5px solid hsl(var(--border));
  background: hsl(var(--background));
  font-size: 0.875rem;
  color: hsl(var(--foreground));
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-input:focus {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.1);
}

.search-input::placeholder {
  color: hsl(var(--muted-foreground));
}

.clear-btn {
  position: absolute;
  right: 2.25rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
}

.clear-btn:hover {
  background: hsl(var(--muted));
}
</style>
