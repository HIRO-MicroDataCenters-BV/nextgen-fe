<template>
  <Collapsible v-if="hasIssues" v-model:open="isOpen" class="validation-summary mb-4 border rounded-lg">
    <div class="flex items-center justify-between p-3 bg-muted/30">
      <div class="flex items-center gap-3">
        <Icon 
          :name="summaryIcon" 
          :class="['size-5', summaryIconColor]"
        />
        <span class="font-medium">{{ summaryText }}</span>
      </div>
      <CollapsibleTrigger as-child>
        <Button variant="ghost" size="sm">
          <Icon 
            name="lucide:chevron-down" 
            :class="['size-4 transition-transform', isOpen && 'rotate-180']"
          />
        </Button>
      </CollapsibleTrigger>
    </div>
    
    <CollapsibleContent>
      <div class="p-3 space-y-2 border-t">
        <div 
          v-for="(error, index) in displayErrors" 
          :key="index"
          class="flex items-start gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
          @click="$emit('jump-to-error', error.path)"
        >
          <Icon 
            :name="error.severity === 'error' ? 'lucide:circle-x' : 'lucide:triangle-alert'"
            :class="['size-4 mt-0.5 flex-shrink-0', error.severity === 'error' ? 'text-destructive' : 'text-yellow-600']"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium">{{ error.path }}</p>
            <p class="text-xs text-muted-foreground">{{ error.message }}</p>
          </div>
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ValidationError } from '../types/editor.types';

interface Props {
  errors: ValidationError[];
  maxDisplay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplay: 5,
});

defineEmits<{
  'jump-to-error': [path: string];
}>();

const isOpen = ref(true);

const errorCount = computed(() => 
  props.errors.filter(e => e.severity === 'error').length
);

const warningCount = computed(() => 
  props.errors.filter(e => e.severity === 'warning').length
);

const hasIssues = computed(() => props.errors.length > 0);

const summaryIcon = computed(() => {
  if (errorCount.value > 0) return 'lucide:circle-x';
  if (warningCount.value > 0) return 'lucide:triangle-alert';
  return 'lucide:circle-check';
});

const summaryIconColor = computed(() => {
  if (errorCount.value > 0) return 'text-destructive';
  if (warningCount.value > 0) return 'text-yellow-600';
  return 'text-green-600';
});

const summaryText = computed(() => {
  const parts = [];
  if (errorCount.value > 0) {
    parts.push(`${errorCount.value} error${errorCount.value > 1 ? 's' : ''}`);
  }
  if (warningCount.value > 0) {
    parts.push(`${warningCount.value} warning${warningCount.value > 1 ? 's' : ''}`);
  }
  
  if (parts.length === 0) return 'All fields valid';
  return `Validation: ${parts.join(', ')}`;
});

const displayErrors = computed(() => 
  props.errors.slice(0, props.maxDisplay)
);
</script>
