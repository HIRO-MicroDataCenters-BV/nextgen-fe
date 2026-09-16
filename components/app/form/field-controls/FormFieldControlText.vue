<script setup lang="ts">
import {
  FormControl,
} from "@/components/ui/form";
import Input from "@/components/ui/input/Input.vue";
import type { FormFieldDefinition } from "~/types/app-form.types";

defineProps<{
  field: FormFieldDefinition;
  disabled: boolean;
  componentField: object;
}>();
</script>

<template>
  <FormControl>
    <Input
      :id="field.name"
      type="text"
      :placeholder="field.placeholder"
      v-bind="componentField"
      :disabled="field.disabled || disabled"
    />
  </FormControl>
</template>
