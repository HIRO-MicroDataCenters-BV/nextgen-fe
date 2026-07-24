<script setup lang="ts">
import { FormControl } from "@/components/ui/form";
import JsonLdEditor from "@/components/JsonLdEditor/index.vue";
import type { FormFieldDefinition } from "~/types/app-form.types";

defineProps<{
  field: FormFieldDefinition;
  disabled: boolean;
  isEditMode: boolean;
  mmioExtraMetadata: Array<Record<string, unknown>> | null;
  itemType: string | undefined;
  componentField: object;
}>();

type JsonLdModel = string | Record<string, unknown>;

const jsonLdModel = (componentField: object): JsonLdModel => {
  const v = (componentField as { modelValue?: unknown }).modelValue;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return "";
};

const onJsonLdUpdate = (componentField: object, value: JsonLdModel) => {
  const onUpdate = (componentField as { "onUpdate:modelValue"?: (x: JsonLdModel) => void })[
    "onUpdate:modelValue"
  ];
  onUpdate?.(value);
};
</script>

<template>
  <FormControl>
    <JsonLdEditor
      :id="field.name"
      :model-value="jsonLdModel(componentField)"
      :readonly="field.disabled || disabled"
      :title="field.label"
      :extra-metadata="field.name === 'metadata_content' ? mmioExtraMetadata : null"
      :item-type="field.name === 'metadata_content' ? itemType : undefined"
      :enforce-client-access-url="field.name === 'metadata_content' ? !isEditMode : true"
      @update:model-value="onJsonLdUpdate(componentField, $event)"
    />
  </FormControl>
</template>
