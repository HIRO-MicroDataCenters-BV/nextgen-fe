<script setup lang="ts">
import { computed } from "vue";
import type { CalendarDate, DateValue } from "@internationalized/date";
import { parseDate } from "@internationalized/date";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/button/Button.vue";
import { Calendar } from "@/components/ui/calendar";
import { FormControl } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { FormFieldDefinition } from "~/types/app-form.types";

const props = defineProps<{
  field: FormFieldDefinition;
  disabled: boolean;
  fieldValue: unknown;
  getFormattedDate: (date: unknown) => string | null;
}>();

const emit = defineEmits<{
  (e: "set-field-value", name: string, value: unknown): void;
}>();

const { t } = useI18n();

const calendarDate = computed(() => {
  const raw = props.fieldValue;
  if (raw instanceof Date) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    const d = String(raw.getDate()).padStart(2, "0");
    try {
      return parseDate(`${y}-${m}-${d}`);
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "string" && raw) {
    try {
      const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return parseDate(raw.substring(0, 10));
    } catch {
      return undefined;
    }
  }
  return undefined;
});

const handleDateSelect = (date: DateValue | undefined) => {
  if (!date) {
    emit("set-field-value", props.field.name, undefined);
    return;
  }
  const hasYmd =
    typeof date === "object" &&
    date !== null &&
    "year" in date &&
    "month" in date &&
    "day" in date;
  if (!hasYmd) {
    emit("set-field-value", props.field.name, undefined);
    return;
  }
  const d = date as CalendarDate;
  const year = d.year;
  const month = String(d.month).padStart(2, "0");
  const day = String(d.day).padStart(2, "0");
  emit("set-field-value", props.field.name, `${year}-${month}-${day}`);
};
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        :id="field.name"
        variant="outline"
        :class="
          cn(
            'w-full justify-start text-left font-normal',
            !fieldValue && 'text-muted-foreground',
            (field.disabled || disabled) && 'cursor-not-allowed opacity-50',
          )
        "
        type="button"
        :disabled="field.disabled || disabled"
      >
        <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
        <span>{{
          fieldValue
            ? getFormattedDate(fieldValue)
            : field.placeholder || t('placeholder.pick_date')
        }}</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent
      v-if="!(field.disabled || disabled)"
      class="w-auto p-0"
    >
      <FormControl>
        <Calendar
          initial-focus
          mode="single"
          :model-value="calendarDate"
          @update:model-value="handleDateSelect"
        />
      </FormControl>
    </PopoverContent>
  </Popover>
</template>
