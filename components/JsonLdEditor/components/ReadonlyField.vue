<template>
  <div class="readonly-field w-full">
    <div class="readonly-label text-sm font-medium text-muted-foreground mb-1">
      {{ label }}
    </div>
    <div class="readonly-value flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border border-border cursor-not-allowed">
      <Icon name="lucide:lock" class="size-3 text-muted-foreground flex-shrink-0" />
      <span class="text-sm font-mono flex-1 truncate" :title="String(displayValue)">
        {{ displayValue }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '#components';

interface Props {
  label: string;
  value: unknown;
}

const props = defineProps<Props>();

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) {
    return '—';
  }
  
  if (typeof props.value === 'object') {
    // Handle JSON-LD objects
    if ('@id' in props.value) {
      return props.value['@id'];
    }
    if ('@value' in props.value) {
      return props.value['@value'];
    }
    // Pretty print objects
    return JSON.stringify(props.value, null, 2);
  }
  
  return String(props.value);
});
</script>

