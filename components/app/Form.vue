<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
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
import { useAppFormFiles } from "@/composables/form/useAppFormFiles";
import { useDiscardGuard } from "@/composables/form/useDiscardGuard";
import { useDynamicFieldOptions } from "@/composables/form/useDynamicFieldOptions";
import { extractDctermsTitlePlainText } from "~/utils/jsonld";
import type {
  AppFormProps,
  FormFieldDefinition,
} from "~/types/app-form.types";

export type {
  AppFormProps,
  FormFieldDefinition,
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

const isEditMode = computed(() => Boolean(props.id));

// Layout split: configuration fields live in the left rail, the metadata
// editor (jsonld-editor) takes the wide main column. Falls back to a single
// column when a form has no metadata editor.
const sidebarFields = computed(() =>
  props.fields.filter((f) => f.type !== "jsonld-editor"),
);
const mainFields = computed(() =>
  props.fields.filter((f) => f.type === "jsonld-editor"),
);
const hasSplitLayout = computed(() => mainFields.value.length > 0);

const typedSchema = computed(() => toTypedSchema(props.formSchema));

const { handleSubmit, values, meta, resetForm, setFieldValue, validateField } = useForm({
  validationSchema: typedSchema,
  initialValues: props.initialValues || {},
});

const fieldsRef = computed(() => props.fields);
const {
  uploadedFiles,
  uploadingFiles,
  fileInputKeys,
  mmioExtraMetadata,
  displayedMmioFileName,
  getFileFieldFilename,
  hydrateExistingFile,
  handleFileChange,
  handleFileDelete,
  fileToFileList,
} = useAppFormFiles({
  uploadMmioFile,
  deleteMmioFile,
  processMmioFile,
  setFieldValue,
  validateField,
  emitClearServerErrors: () => emit("clear-server-errors"),
});

watch(
  () => values.metadata_content,
  (meta) => {
    if (!props.syncNameFromMetadata || isEditMode.value) return;
    setFieldValue("name", extractDctermsTitlePlainText(meta));
  },
  { deep: true, immediate: true },
);

const { fieldOptions, loadingOptions, loadFieldOptions, refreshFieldOptions } =
  useDynamicFieldOptions({
    fields: fieldsRef,
    values: values as Record<string, unknown>,
    initialValues: props.initialValues,
    isEditMode,
    setFieldValue,
  });

onMounted(() => {
  props.fields.forEach((field) => {
    if (field.dataSource && field.type === "select") {
      loadFieldOptions(field);
    }
    // Handle existing file values in edit mode
    if (field.type === "file" && isEditMode.value && props.initialValues) {
      const initialValue = props.initialValues[field.name];
      hydrateExistingFile(field.name, initialValue);
    }
  });
});

const { showDiscardDialog, handleDiscard, confirmDiscard } = useDiscardGuard({
  initialValues: props.initialValues,
  values: values as Record<string, unknown>,
  goBack: () => router.back(),
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

const isFieldVisible = (field: FormFieldDefinition): boolean => {
  if (!field.conditions || field.conditions.length === 0) return true;
  return field.conditions.every((condition) => {
    const fieldValue = values[condition.field];
    return fieldValue === condition.value;
  });
};

defineExpose({
  submit: onSubmit,
  resetForm,
  values,
  meta,
  getUploadedFile: (fieldName: string) => {
    if (fieldName === "file") return getFileFieldFilename(values as Record<string, unknown>);
    return uploadedFiles.value[fieldName]?.filename;
  },
  isEditMode,
  refreshFieldOptions,
});
</script>

<template>
  <form
    class="lg:flex lg:h-full lg:min-h-0 lg:flex-col"
    @submit.prevent="onSubmit"
  >
    <!-- Single-column heading (fallback layout only). In the split layout the
         heading lives in the rail so the editor column starts flush at the top. -->
    <div
      v-if="(props.title || props.description) && !hasSplitLayout"
      class="mb-8"
    >
      <h2 v-if="props.title" class="text-2xl font-semibold mb-2">
        {{ props.title }}
      </h2>
      <p v-if="props.description" class="text-sm text-muted-foreground">
        {{ props.description }}
      </p>
    </div>

    <!-- Two-column editor layout: configuration rail + metadata editor.
         On desktop each column scrolls independently within a fixed-height
         shell so the page itself does not scroll. -->
    <div
      v-if="hasSplitLayout"
      class="grid grid-cols-1 items-start gap-x-10 gap-y-8 lg:min-h-0 lg:flex-1 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-stretch lg:[grid-template-rows:minmax(0,1fr)]"
    >
      <!-- Left rail: heading + configuration fields + actions -->
      <aside class="flex min-w-0 flex-col lg:h-full lg:min-h-0">
        <div
          v-if="props.title || props.description"
          class="mb-6 lg:shrink-0"
        >
          <h2 v-if="props.title" class="text-2xl font-semibold mb-2">
            {{ props.title }}
          </h2>
          <p v-if="props.description" class="text-sm text-muted-foreground">
            {{ props.description }}
          </p>
        </div>

        <div
          class="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1"
        >
          <div class="space-y-6">
            <FormFieldsRenderer
              :fields="sidebarFields"
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
          </div>

          <ServerErrorsBlock
            v-if="props.serverErrors && props.serverErrors.length > 0"
            :errors="props.serverErrors"
          />

          <div
            class="actions flex gap-2 border-t pt-4 lg:flex-col-reverse lg:[&>button]:w-full"
          >
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
        </div>
      </aside>

      <!-- Main column: metadata editor (scrolls independently on desktop) -->
      <div class="editor-pane min-w-0 lg:min-h-0">
        <FormFieldsRenderer
          :fields="mainFields"
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
      </div>
    </div>

    <!-- Fallback: single column (forms without a metadata editor) -->
    <div v-else class="space-y-6">
      <FormFieldsRenderer
        :fields="props.fields"
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

<style scoped>
/* Desktop: let the metadata editor fill its column so its own internal
   scroll (search/toggle header and footer stay pinned, only the fields
   scroll) becomes the right pane's single scroll area. The vee-validate
   FormField is renderless and FormControl is a renderless Slot, so the
   FormItem grid is the direct parent of the editor root (.jsonld-editor). */
@media (min-width: 1024px) {
  .editor-pane {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .editor-pane :deep([data-slot="form-item"]) {
    flex: 1 1 0%;
    min-height: 0;
    grid-template-rows: minmax(0, 1fr);
  }
  .editor-pane :deep(.jsonld-editor) {
    height: 100%;
    max-height: 100%;
    min-height: 0;
  }
}
</style>
