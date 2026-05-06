<script setup lang="ts">
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FormFieldControlText from "@/components/app/form/field-controls/FormFieldControlText.vue";
import FormFieldControlTextarea from "@/components/app/form/field-controls/FormFieldControlTextarea.vue";
import FormFieldControlSelect from "@/components/app/form/field-controls/FormFieldControlSelect.vue";
import FormFieldControlDate from "@/components/app/form/field-controls/FormFieldControlDate.vue";
import FormFieldControlCheckbox from "@/components/app/form/field-controls/FormFieldControlCheckbox.vue";
import FormFieldControlTags from "@/components/app/form/field-controls/FormFieldControlTags.vue";
import FormFieldControlJsonLd from "@/components/app/form/field-controls/FormFieldControlJsonLd.vue";
import FormFieldControlFile from "@/components/app/form/field-controls/FormFieldControlFile.vue";
import FormFieldControlClientSelector from "@/components/app/form/field-controls/FormFieldControlClientSelector.vue";
import type {
  FormFieldDefinition,
  FormFieldOption,
} from "~/types/app-form.types";

interface Props {
  fields: FormFieldDefinition[];
  values: Record<string, unknown>;
  disabled?: boolean;
  isEditMode: boolean;
  fieldOptions: Record<string, FormFieldOption[]>;
  loadingOptions: Record<string, boolean>;
  displayedMmioFileName: string | null;
  uploadingFiles: Record<string, boolean>;
  fileInputKeys: Record<string, number>;
  mmioExtraMetadata: Array<Record<string, unknown>> | null;
  isFieldVisible: (field: FormFieldDefinition) => boolean;
  getFormattedDate: (date: unknown) => string | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "set-field-value", fieldName: string, value: unknown): void;
  (e: "file-change", fieldName: string, file: File): void;
  (e: "file-delete", fieldName: string): void;
}>();

const itemType = computed(() => {
  const raw = props.values.item_type;
  return typeof raw === "string" ? raw : undefined;
});
</script>

<template>
  <template v-for="field in fields" :key="field.name">
    <FormFieldControlClientSelector
      v-if="field.type === 'client-selector' && isFieldVisible(field)"
    />
    <FormField
      v-else-if="isFieldVisible(field)"
      v-slot="{ componentField, value: fieldValue }"
      :name="field.name"
    >
      <FormItem>
        <FormLabel v-if="field.type !== 'checkbox'" :for="field.name">{{
          field.label
        }}</FormLabel>
        <FormFieldControlText
          v-if="field.type === 'text'"
          :field="field"
          :disabled="!!disabled"
          :component-field="componentField"
        />
        <FormFieldControlTextarea
          v-else-if="field.type === 'textarea'"
          :field="field"
          :disabled="!!disabled"
          :component-field="componentField"
        />
        <FormFieldControlSelect
          v-else-if="field.type === 'select'"
          :field="field"
          :disabled="!!disabled"
          :is-edit-mode="isEditMode"
          :field-options="fieldOptions"
          :loading-options="loadingOptions"
          :component-field="componentField"
        />
        <FormFieldControlDate
          v-else-if="field.type === 'date'"
          :field="field"
          :disabled="!!disabled"
          :field-value="fieldValue"
          :get-formatted-date="getFormattedDate"
          @set-field-value="(name, value) => emit('set-field-value', name, value)"
        />
        <FormFieldControlCheckbox
          v-else-if="field.type === 'checkbox'"
          :field="field"
          :disabled="!!disabled"
          :field-value="fieldValue"
          :component-field="componentField"
        />
        <FormFieldControlTags
          v-else-if="field.type === 'tags'"
          :field="field"
          :disabled="!!disabled"
          :component-field="componentField"
        />
        <FormFieldControlJsonLd
          v-else-if="field.type === 'jsonld-editor'"
          :field="field"
          :disabled="!!disabled"
          :is-edit-mode="isEditMode"
          :mmio-extra-metadata="mmioExtraMetadata"
          :item-type="itemType"
          :component-field="componentField"
        />
        <FormFieldControlFile
          v-else-if="field.type === 'file'"
          :field="field"
          :disabled="!!disabled"
          :displayed-mmio-file-name="displayedMmioFileName"
          :uploading-files="uploadingFiles"
          :file-input-keys="fileInputKeys"
          @file-change="(name, file) => emit('file-change', name, file)"
          @file-delete="(name) => emit('file-delete', name)"
        />
        <FormMessage />
        <p
          v-if="field.hint && !(field.disabled || disabled)"
          class="text-sm text-muted-foreground mt-1"
        >
          {{ field.hint }}
        </p>
      </FormItem>
    </FormField>
  </template>
</template>
