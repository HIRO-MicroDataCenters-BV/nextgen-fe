<script setup lang="ts">
import { FormControl } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import type { FormFieldDefinition } from "~/types/app-form.types";

defineProps<{
  field: FormFieldDefinition;
  disabled: boolean;
  fieldValue: unknown;
  componentField: object;
}>();
</script>

<template>
  <FormControl>
    <label
      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
    >
      <Checkbox
        :id="field.name"
        v-bind="componentField"
        :disabled="field.disabled || disabled"
        :checked="fieldValue"
      />
      <span class="ml-2">{{ field.label }}</span>
    </label>
  </FormControl>
</template>
