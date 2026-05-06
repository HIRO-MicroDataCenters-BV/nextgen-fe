<script setup lang="ts">
import { FormControl } from "@/components/ui/form";
import {
  TagsInput,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
} from "@/components/ui/tags-input";
import type { FormFieldDefinition } from "~/types/app-form.types";

defineProps<{
  field: FormFieldDefinition;
  disabled: boolean;
  componentField: object;
}>();

const { t } = useI18n();
</script>

<template>
  <FormControl>
    <TagsInput
      :id="field.name"
      :model-value="(componentField as { modelValue?: string[] }).modelValue"
      :disabled="field.disabled || disabled"
      :placeholder="field.placeholder"
      :delimiter="/[\n,]+/"
      @update:model-value="
        (v) =>
          (componentField as { 'onUpdate:modelValue'?: (x: string[]) => void })[
            'onUpdate:modelValue'
          ]?.(v as string[])
      "
    >
      <TagsInputItem
        v-for="tag in (componentField as { modelValue?: string[] }).modelValue || []"
        :key="tag"
        :value="tag"
      >
        <TagsInputItemText />
        <TagsInputItemDelete />
      </TagsInputItem>
      <TagsInputInput
        :placeholder="field.placeholder || t('placeholder.tags_input')"
      />
    </TagsInput>
  </FormControl>
</template>
