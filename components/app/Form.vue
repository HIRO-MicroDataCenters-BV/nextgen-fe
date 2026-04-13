<script setup lang="ts">
import { watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Button from "@/components/ui/button/Button.vue";
import ServerErrorsBlock from "@/components/app/ServerErrorsBlock.vue";
import FormFieldsRenderer from "@/components/app/form/FormFieldsRenderer.vue";
import { useApi } from "@/composables/useApi";
import { useMmioProcessor } from "@/composables/useMmioProcessor";
import { extractDctermsTitlePlainText } from "~/utils/jsonld";
import type {
  AppFormProps,
  FormFieldDefinition,
  FormFieldOption,
} from "~/types/app-form.types";

export type {
  AppFormProps,
  FormFieldDefinition,
  FormFieldOption,
} from "~/types/app-form.types";

const props = withDefaults(defineProps<AppFormProps>(), {
  syncNameFromMetadata: false,
  initialValues: undefined,
  title: undefined,
  description: undefined,
  id: undefined,
  serverErrors: undefined,
});
const emit = defineEmits<{
  (e: "submit", values: Record<string, unknown>): void;
  (e: "cancel" | "clear-server-errors"): void;
}>();

const router = useRouter();
const { t } = useI18n();
const dayjs = useDayjs();
const df = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const { uploadMmioFile, deleteMmioFile } = useApi();
const { processMmioFile } = useMmioProcessor();

const uploadedFiles = ref<Record<string, { filename: string; file: File }>>({});
const uploadingFiles = ref<Record<string, boolean>>({});
const fileInputKeys = ref<Record<string, number>>({});
// Extra system metadata from MMIO file — stored independently from the JsonLd editor tree
const mmioExtraMetadata = ref<Array<Record<string, unknown>> | null>(null);
// Display name for the uploaded MMIO file (from server response or original filename)
const displayedMmioFileName = ref<string | null>(null);

const isEditMode = computed(() => Boolean(props.id));

const typedSchema = computed(() => toTypedSchema(props.formSchema));

const { handleSubmit, values, meta, resetForm, setFieldValue, validateField } = useForm({
  validationSchema: typedSchema,
  initialValues: props.initialValues || {},
});

/** File in the main slot: server-uploaded MMIO/TAR or client-only DCAT JSON (File on form). */
const getFileFieldFile = (): File | undefined => {
  const uploaded = uploadedFiles.value.file;
  if (uploaded?.file) return uploaded.file;
  const v = values.file;
  return v instanceof File ? v : undefined;
};

/** Filename for API / createDatasetJsonLd: prefer server-stored name, else local File name. */
const getFileFieldFilename = (): string | undefined => {
  const uploaded = uploadedFiles.value.file;
  if (uploaded?.filename) return uploaded.filename;
  const f = getFileFieldFile();
  if (f) return f.name;
  return displayedMmioFileName.value ?? undefined;
};

watch(
  () => values.metadata_content,
  (meta) => {
    if (!props.syncNameFromMetadata || isEditMode.value) return;
    setFieldValue("name", extractDctermsTitlePlainText(meta));
  },
  { deep: true, immediate: true },
);

const fieldOptions = ref<Record<string, FormFieldOption[]>>({});
const loadingOptions = ref<Record<string, boolean>>({});

const getNestedValue = (obj: unknown, path: string): unknown => {
  if (!path) return obj;
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (
      current &&
      typeof current === "object" &&
      key in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return null;
    }
  }
  return current;
};

const loadFieldOptions = async (field: FormFieldDefinition) => {
  if (!field.dataSource || field.type !== "select") return;

  if (loadingOptions.value[field.name]) return;
  loadingOptions.value[field.name] = true;

  try {
    const response = await field.dataSource();
    let data: unknown = response;

    const dataPath = field.fieldOptions?.dataPath;
    if (dataPath) {
      data = getNestedValue(response, dataPath);
    }

    if (!data) {
      return;
    }

    if (!Array.isArray(data)) {
      return;
    }

    const valueKey = field.fieldOptions?.valueKey || "value";
    const labelKey = field.fieldOptions?.labelKey || "label";

    fieldOptions.value[field.name] = data.map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return {
          value: String(item),
          label: String(item),
        };
      }
      if (item && typeof item === "object") {
        const itemObj = item as Record<string, unknown>;
        return {
          value: String(itemObj[valueKey] ?? ""),
          label: String(itemObj[labelKey] ?? itemObj[valueKey] ?? ""),
        };
      }
      return {
        value: String(item),
        label: String(item),
      };
    });

    // Edit mode: Radix Select shows nothing if the form value is not in `SelectItem` list.
    // Dataproducts are fetched per client interface — wrong interface or slow initClient
    // can omit the value that still exists in metadata (dcat:inSeries title).
    const rawCurrent = (values as Record<string, unknown>)[field.name];
    const currentStr =
      typeof rawCurrent === "string" ? rawCurrent.trim() : "";
    const rawInitial = props.initialValues?.[field.name];
    const initialStr =
      typeof rawInitial === "string" ? rawInitial.trim() : "";
    const valToEnsure = currentStr || initialStr;
    const currentOptions = fieldOptions.value[field.name] ?? [];
    if (
      isEditMode.value &&
      valToEnsure &&
      !currentOptions.some((o) => o.value === valToEnsure)
    ) {
      fieldOptions.value[field.name] = [
        { value: valToEnsure, label: valToEnsure },
        ...currentOptions,
      ];
    }
  } catch {
    // Error loading options
  } finally {
    loadingOptions.value[field.name] = false;
  }
};

onMounted(() => {
  props.fields.forEach((field) => {
    if (field.dataSource && field.type === "select") {
      loadFieldOptions(field);
    }
    // Handle existing file values in edit mode
    if (field.type === "file" && isEditMode.value && props.initialValues) {
      const initialValue = props.initialValues[field.name];
      if (initialValue && typeof initialValue === "string") {
        // Store the existing filename so it displays in the form
        uploadedFiles.value[field.name] = {
          filename: initialValue,
          file: null as unknown as File, // No actual File object for existing files
        };
        // Also set the display name so MmioUploadZone shows the file
        if (field.name === 'file') {
          displayedMmioFileName.value = initialValue;
        }
      }
    }
  });
});

const showDiscardDialog = ref(false);
const hasChanges = computed(() => {
  if (!props.initialValues) return false;
  const initial = JSON.stringify(props.initialValues);
  const current = JSON.stringify(values);
  return initial !== current;
});

const getFormattedDate = (date: unknown) => {
  if (!date) return null;
  if (date instanceof Date) return df.format(date);
  if (typeof date === "string") {
    const parsed = dayjs(date);
    return parsed.isValid() ? df.format(parsed.toDate()) : null;
  }
  return null;
};

const onSubmit = handleSubmit(
  (formData) => {
    emit("submit", formData);
  },
  (ctx) => {
    if (import.meta.dev) {
      console.warn("[AppForm] submit blocked (validation)", ctx.errors);
    }
  },
);

const handleDiscard = () => {
  if (hasChanges.value) {
    showDiscardDialog.value = true;
  } else {
    router.back();
  }
};

const confirmDiscard = () => {
  showDiscardDialog.value = false;
  router.back();
};

const clearFileField = (fieldName: string) => {
  const newUploadedFiles = Object.fromEntries(
    Object.entries(uploadedFiles.value).filter(([key]) => key !== fieldName)
  );
  uploadedFiles.value = newUploadedFiles;
  setFieldValue(fieldName, undefined);
  fileInputKeys.value[fieldName] = (fileInputKeys.value[fieldName] || 0) + 1;
  if (fieldName === 'file') {
    mmioExtraMetadata.value = null;
    displayedMmioFileName.value = null;
  }
};

const handleFileChange = async (fieldName: string, files: FileList | null) => {
  if (!files || files.length === 0) return;

  const file = files.item(0);
  if (!file) return;
  uploadingFiles.value[fieldName] = true;

  try {
    const location = await uploadMmioFile(file);

    if (location) {
      const filename = location.split("/").pop() || file.name;
      uploadedFiles.value[fieldName] = { filename, file };
      displayedMmioFileName.value = filename;
      setFieldValue(fieldName, file);
      validateField(fieldName);
      emit('clear-server-errors');

      if (fieldName === 'file') {
        // New file = reset MMIO state, then load from new file
        mmioExtraMetadata.value = null;
        if (file.name.endsWith('.tar') || file.name.endsWith('.json')) {
          try {
            const mmioMetadata = await processMmioFile(file);
            if (mmioMetadata) {
              const extra = mmioMetadata.extraMetadata;
              mmioExtraMetadata.value = Array.isArray(extra)
                ? extra
                : [extra as Record<string, unknown>];
            }
          } catch (error) {
            console.error('[AppForm] MMIO file processing failed:', error);
          }
        }
      }
    } else if (import.meta.dev) {
      console.warn("[AppForm] uploadMmioFile returned no location");
    }
  } catch (err) {
    console.error('[AppForm] file upload failed:', err);
    clearFileField(fieldName);
  } finally {
    uploadingFiles.value[fieldName] = false;
  }
};

// Convert a single File to a FileList-like object for handleFileChange compatibility
const fileToFileList = (file: File): FileList => {
  const dt = new DataTransfer();
  dt.items.add(file);
  return dt.files;
};

const handleFileDelete = async (fieldName: string) => {
  const uploaded = uploadedFiles.value[fieldName];
  if (!uploaded) return;

  // Only delete from server if it's a newly uploaded file (has a File object)
  // For existing files in edit mode, just clear the field locally
  if (uploaded.file) {
    try {
      const success = await deleteMmioFile(uploaded.filename);
      if (success) {
        clearFileField(fieldName);
      }
    } catch {
      // Error deleting file
    }
  } else {
    // Existing file - just clear locally without deleting from server
    clearFileField(fieldName);
  }
};

const isFieldVisible = (field: FormFieldDefinition): boolean => {
  if (!field.conditions || field.conditions.length === 0) return true;
  return field.conditions.every((condition) => {
    const fieldValue = values[condition.field];
    return fieldValue === condition.value;
  });
};

const refreshFieldOptions = (
  fieldName: string,
  opts?: { preserveValue?: boolean },
) => {
  const field = props.fields.find((f) => f.name === fieldName);
  if (field?.dataSource && field?.type === "select") {
    if (!opts?.preserveValue) {
      setFieldValue(fieldName, null);
    }
    loadFieldOptions(field);
  }
};

defineExpose({
  submit: onSubmit,
  resetForm,
  values,
  meta,
  getUploadedFile: (fieldName: string) => {
    if (fieldName === "file") return getFileFieldFilename();
    return uploadedFiles.value[fieldName]?.filename;
  },
  isEditMode,
  refreshFieldOptions,
});
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <div v-if="props.title || props.description" class="mb-6">
      <h2 v-if="props.title" class="text-2xl font-semibold mb-2">
        {{ props.title }}
      </h2>
      <p v-if="props.description" class="text-sm text-muted-foreground">
        {{ props.description }}
      </p>
    </div>
    <FormFieldsRenderer
      :fields="fields"
      :values="values as Record<string, unknown>"
      :disabled="props.disabled"
      :is-edit-mode="isEditMode"
      :field-options="fieldOptions"
      :loading-options="loadingOptions"
      :displayed-mmio-file-name="displayedMmioFileName"
      :uploading-files="uploadingFiles"
      :file-input-keys="fileInputKeys"
      :mmio-extra-metadata="mmioExtraMetadata"
      :is-field-visible="isFieldVisible"
      :get-formatted-date="getFormattedDate"
      @set-field-value="(name, value) => setFieldValue(name, value)"
      @file-change="(name, file) => handleFileChange(name, fileToFileList(file))"
      @file-delete="handleFileDelete"
    />

    <ServerErrorsBlock
      v-if="props.serverErrors && props.serverErrors.length > 0"
      :errors="props.serverErrors"
      class="mt-4"
    />

    <div class="actions flex justify-start gap-2 pt-4">
      <Button
        type="button"
        variant="outline"
        :disabled="props.disabled"
        @click="handleDiscard"
      >
        {{ t("action.discard") }}
      </Button>
      <Button
        type="submit"
        :disabled="props.disabled || !meta.valid || meta.pending"
      >
        {{ isEditMode ? t("action.update") : t("action.save") }}
      </Button>
    </div>
  </form>

  <AlertDialog
    :open="showDiscardDialog"
    @update:open="showDiscardDialog = $event"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("title.unsaved_changes") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("alert.unsaved_changes_description") }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{{ t("action.cancel") }}</AlertDialogCancel>
        <AlertDialogAction variant="destructive" @click="confirmDiscard">
          {{ t("action.discard") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
