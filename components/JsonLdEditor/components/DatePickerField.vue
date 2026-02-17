<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="[
          'w-full justify-start text-left font-normal',
          !modelValue && 'text-muted-foreground'
        ]"
        :disabled="readonly"
      >
        <Icon name="lucide:calendar" class="mr-2 size-4" />
        {{ displayDate || placeholder || 'Pick a date' }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <Calendar
        :model-value="calendarDate"
        mode="single"
        @update:model-value="handleDateSelect"
      />
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CalendarDate, parseDate } from '@internationalized/date';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  modelValue: string;
  readonly?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  placeholder: 'Pick a date',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// Convert ISO string to CalendarDate for Calendar component
const calendarDate = computed(() => {
  if (!props.modelValue) return undefined;
  try {
    // Parse ISO date string (YYYY-MM-DD)
    const match = props.modelValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return parseDate(props.modelValue.substring(0, 10));
    }
    return undefined;
  } catch {
    return undefined;
  }
});

// Format date for display
const displayDate = computed(() => {
  if (!props.modelValue) return '';
  try {
    const date = new Date(props.modelValue);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return props.modelValue;
  }
});

// Handle date selection from Calendar
const handleDateSelect = (date: CalendarDate | undefined) => {
  if (!date) {
    emit('update:modelValue', '');
    return;
  }
  
  // Convert CalendarDate to ISO 8601 format (YYYY-MM-DD)
  // CalendarDate has year, month, day properties
  const year = date.year;
  const month = String(date.month).padStart(2, '0');
  const day = String(date.day).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;
  
  emit('update:modelValue', isoDate);
};
</script>
