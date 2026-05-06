<script setup lang="ts">
import { FormControl } from "@/components/ui/form";
import MmioUploadZone from "@/components/app/MmioUploadZone.vue";
import type { FormFieldDefinition } from "~/types/app-form.types";

defineProps<{
  field: FormFieldDefinition;
  disabled: boolean;
  displayedMmioFileName: string | null;
  uploadingFiles: Record<string, boolean>;
  fileInputKeys: Record<string, number>;
}>();

const emit = defineEmits<{
  (e: "file-change", name: string, file: File): void;
  (e: "file-delete", name: string): void;
}>();
</script>

<template>
  <FormControl>
    <MmioUploadZone
      :mmio-file="displayedMmioFileName"
      :uploading="uploadingFiles[field.name]"
      :disabled="field.disabled || disabled"
      :readonly="field.disabled || disabled"
      :input-key="fileInputKeys[field.name] || 0"
      @change-mmio="(file) => emit('file-change', field.name, file)"
      @remove-mmio="emit('file-delete', field.name)"
    />
  </FormControl>
</template>
