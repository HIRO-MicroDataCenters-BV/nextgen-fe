<template>
  <div 
    v-if="(canAdd && !readonly) || (canRemove && !readonly)"
    class="node-controls"
    :class="{ 'node-controls--visible': isHovered }"
  >
    <Button
      v-if="canAdd && !readonly"
      type="button"
      variant="ghost"
      size="icon"
      class="node-controls__button"
      @click="$emit('add')"
    >
      <Icon name="lucide:plus" class="size-3" />
    </Button>
    <Button
      v-if="canRemove && !readonly"
      type="button"
      variant="ghost"
      size="icon"
      class="node-controls__button node-controls__button--remove"
      @click="$emit('remove')"
    >
      <Icon name="lucide:minus" class="size-3" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';

interface Props {
  nodeType: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'date' | 'uri' | 'language-string';
  canAdd?: boolean;
  canRemove?: boolean;
  readonly?: boolean;
  isHovered?: boolean;
}

withDefaults(defineProps<Props>(), {
  canAdd: false,
  canRemove: false,
  readonly: false,
  isHovered: false,
});

defineEmits<{
  add: [];
  remove: [];
}>();
</script>

<style scoped>
.node-controls {
  display: inline-flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  margin-left: 0.5rem;
}

.node-controls--visible {
  opacity: 1;
}

.node-controls__button {
  height: 1.25rem;
  width: 1.25rem;
  padding: 0;
}

.node-controls__button--remove:hover {
  color: hsl(var(--destructive));
}
</style>
