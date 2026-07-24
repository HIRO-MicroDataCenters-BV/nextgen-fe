<script setup lang="ts">
import { FormControl } from "@/components/ui/form";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import type { FormFieldDefinition } from "~/types/app-form.types";

defineProps<{
  field: FormFieldDefinition;
  disabled: boolean;
  componentField: object;
}>();
</script>

<template>
  <FormControl>
    <Textarea
      :id="field.name"
      :placeholder="field.placeholder"
      v-bind="componentField"
      :disabled="field.disabled || disabled"
      :rows="(field.props?.rows as number | undefined) || 3"
    />
  </FormControl>
</template>
