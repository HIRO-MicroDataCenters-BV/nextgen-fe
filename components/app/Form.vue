<script setup lang="ts">
import { watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import type { z } from "zod";
import { cn } from "@/lib/utils";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TagsInput,
  TagsInputItem,
  TagsInputItemText,
  TagsInputItemDelete,
  TagsInputInput,
} from "@/components/ui/tags-input";
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
import Input from "@/components/ui/input/Input.vue";
import Textarea from "@/components/ui/textarea/Textarea.vue";
import JsonLdEditor from "@/components/JsonLdEditor/index.vue";
import ServerErrorsBlock from "@/components/app/ServerErrorsBlock.vue";
import MmioUploadZone from "@/components/app/MmioUploadZone.vue";
import { useApi } from "@/composables/useApi";
import { useMmioProcessor } from "@/composables/useMmioProcessor";
import { extractDctermsTitlePlainText } from "~/utils/jsonld";

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldDefinition {
  name: string;
  label: string;
  type: "text" | "select" | "date" | "textarea" | "checkbox" | "tags" | "file" | "jsonld-editor" | "client-selector";
  placeholder?: string;
  hint?: string | null;
  options?: FormFieldOption[];
  dataSource?: () => Promise<unknown>;
  fieldOptions?: {
    dataPath?: string;
    valueKey?: string;
    labelKey?: string;
  };
  validation?: z.ZodTypeAny;
  disabled?: boolean;
  accept?: string;
  props?: Record<string, unknown>;
  conditions?: Array<{
    field: string;
    value: unknown;
  }>;
}

export interface AppFormProps {
  fields: FormFieldDefinition[];
  initialValues?: Record<string, unknown>;
  formSchema: z.ZodObject<Record<string, z.ZodTypeAny>>;
  title?: string;
  description?: string;
  disabled?: boolean;
  id?: string | null;
  serverErrors?: Array<{ code?: string; message?: string; details?: unknown[] }> | null;
  /** Create flow: keep `name` in sync with `dcterms:title` in metadata (name field should be disabled). */
  syncNameFromMetadata?: boolean;
}

const props = withDefaults(defineProps<AppFormProps>(), {
  syncNameFromMetadata: false,
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
// When a full DCAT-AP JSON file is loaded, all fields in editor become readonly (user can still ADD new fields)
const metadataFromFile = ref(false);
// Separately uploaded OCA bundle file (when user uploads MMIO JSON + bundle separately)
const uploadedBundleFile = ref<File | null>(null);
// Tracks the displayed MMIO file name even if it wasn't uploaded to the server (e.g. DCAT JSON)
const displayedMmioFileName = ref<string | null>(null);

const isEditMode = computed(() => Boolean(props.id));

const typedSchema = computed(() => toTypedSchema(props.formSchema));

const { handleSubmit, values, meta, resetForm, setFieldValue, validateField } = useForm({
  validationSchema: typedSchema,
  initialValues: props.initialValues || {},
});

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
    if (
      isEditMode.value &&
      valToEnsure &&
      !fieldOptions.value[field.name].some((o) => o.value === valToEnsure)
    ) {
      fieldOptions.value[field.name] = [
        { value: valToEnsure, label: valToEnsure },
        ...fieldOptions.value[field.name],
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

const onSubmit = handleSubmit((formData) => {
  emit("submit", formData);
});

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
    metadataFromFile.value = false;
    mmioExtraMetadata.value = null;
    uploadedBundleFile.value = null;
    displayedMmioFileName.value = null;
  }
};

const handleFileChange = async (fieldName: string, files: FileList | null) => {
  if (!files || files.length === 0) return;

  const file = files[0];
  console.log('[Form DEBUG] handleFileChange: fieldName =', fieldName, 'file =', file.name, 'size =', file.size);
  uploadingFiles.value[fieldName] = true;

  try {
    // Peek at JSON files before uploading: DCAT-AP JSONs are for client-side pre-population only
    // and must NOT be uploaded to /mmio/ (backend expects only MMIO TAR files there)
    if (fieldName === 'file' && file.name.endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const isDcatMetadata =
        parsed['dcterms:title'] !== undefined ||
        parsed['dcterms:description'] !== undefined ||
        (parsed['@type'] as string | undefined)?.includes('Dataset');

      if (isDcatMetadata) {
        console.log('[Form DEBUG] DCAT-AP JSON detected — loading into editor client-side only (not uploading to /mmio/)');
        mmioExtraMetadata.value = null;
        metadataFromFile.value = false;

        if (parsed['dspace:extraMetadata']) {
          const extra = parsed['dspace:extraMetadata'];
          mmioExtraMetadata.value = Array.isArray(extra)
            ? extra as Array<Record<string, unknown>>
            : [extra as Record<string, unknown>];
        }

        metadataFromFile.value = true;
        setFieldValue('metadata_content', parsed);
        // Mark the file field as filled so form validation passes
        setFieldValue(fieldName, file);
        validateField(fieldName);
        emit('clear-server-errors');
        // Show the file in the upload zone (not uploaded to server, just metadata)
        displayedMmioFileName.value = file.name;
        uploadingFiles.value[fieldName] = false;
        return;
      }
    }

    console.log('[Form DEBUG] uploading to server...');
    const location = await uploadMmioFile(file);
    console.log('[Form DEBUG] upload location =', location);

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
        metadataFromFile.value = false;
        if (file.name.endsWith('.tar')) {
          // ── TAR file: extract dspace:extraMetadata from OCA bundles ──
          console.log('[Form DEBUG] TAR MMIO file detected, calling processMmioFile...');
          try {
            const mmioMetadata = await processMmioFile(file);
            console.log('[Form DEBUG] processMmioFile returned:', mmioMetadata ? 'OK' : 'NULL');
            if (mmioMetadata) {
              const extra = mmioMetadata.extraMetadata;
              const extraArr = Array.isArray(extra) ? extra : [extra as Record<string, unknown>];
              console.log('[Form DEBUG] setting mmioExtraMetadata from TAR, entries =', extraArr.length);
              mmioExtraMetadata.value = extraArr;
            }
          } catch (error) {
            console.error('[Form DEBUG] Error processing TAR MMIO file:', error);
          }

        } else if (file.name.endsWith('.json')) {
          // MMIO JSON (version/id/modalities) — DCAT JSONs are handled before the upload (early return above)
          console.log('[Form DEBUG] MMIO JSON file uploaded, processing...');
          try {
            const mmioMetadata = await processMmioFile(file);
            console.log('[Form DEBUG] processMmioFile returned:', mmioMetadata ? 'OK' : 'NULL');
            if (mmioMetadata) {
              const extra = mmioMetadata.extraMetadata;
              mmioExtraMetadata.value = Array.isArray(extra)
                ? extra
                : [extra as Record<string, unknown>];
              console.log('[Form DEBUG] setting mmioExtraMetadata from MMIO JSON, entries =', mmioExtraMetadata.value.length);
            }
          } catch (error) {
            console.error('[Form DEBUG] Error processing MMIO JSON file:', error);
          }
        }
      }
    } else {
      console.warn('[Form DEBUG] uploadMmioFile returned falsy location!');
    }
  } catch (err) {
    console.error('[Form DEBUG] upload failed:', err);
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

// Handle separately uploaded OCA bundle file (for MMIO JSON + bundle two-file flow)
const handleBundleFileChange = async (file: File) => {
  uploadedBundleFile.value = file;
  console.log('[Form DEBUG] OCA bundle file selected:', file.name);

  // If there's already an MMIO JSON uploaded, re-process both together
  const mmioFile = uploadedFiles.value['file']?.file;
  if (mmioFile && mmioFile.name.endsWith('.json')) {
    try {
      const { processTarFromFiles } = useMmioProcessor();
      const mmioMetadata = await processTarFromFiles(mmioFile, file);
      if (mmioMetadata) {
        const extra = mmioMetadata.extraMetadata;
        mmioExtraMetadata.value = Array.isArray(extra) ? extra : [extra as Record<string, unknown>];
        console.log('[Form DEBUG] re-processed with bundle, extraMetadata entries =', mmioExtraMetadata.value.length);
      }
    } catch (e) {
      console.error('[Form DEBUG] Error processing MMIO + bundle:', e);
    }
  }
};

const handleBundleFileRemove = () => {
  uploadedBundleFile.value = null;
  // Re-process MMIO JSON alone (without bundle)
  const mmioFile = uploadedFiles.value['file']?.file;
  if (mmioFile) {
    const { processMmioFile } = useMmioProcessor();
    processMmioFile(mmioFile).then(meta => {
      if (meta) {
        const extra = meta.extraMetadata;
        mmioExtraMetadata.value = Array.isArray(extra) ? extra : [extra as Record<string, unknown>];
      }
    });
  }
};

const handleFileDelete = async (fieldName: string) => {
  // If it's a DCAT JSON (only in displayedMmioFileName, not in uploadedFiles), just clear locally
  if (fieldName === 'file' && displayedMmioFileName.value && !uploadedFiles.value[fieldName]) {
    clearFileField(fieldName);
    setFieldValue('metadata_content', {});
    return;
  }

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
  getUploadedFile: (fieldName: string) =>
    uploadedFiles.value[fieldName]?.filename,
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
    <template v-for="field in fields" :key="field.name">
      <!-- Client selector is rendered outside the FormField wrapper -->
      <div v-if="field.type === 'client-selector' && isFieldVisible(field)">
        <AppClientSelector />
      </div>
      <FormField
        v-else-if="isFieldVisible(field)"
        v-slot="{ componentField, value: fieldValue }"
        :name="field.name"
      >
        <FormItem>
          <FormLabel v-if="field.type !== 'checkbox'" :for="field.name">{{
            field.label
          }}</FormLabel>
          <template v-if="field.type === 'text'">
            <FormControl>
              <Input
                :id="field.name"
                type="text"
                :placeholder="field.placeholder"
                v-bind="componentField"
                :disabled="field.disabled || props.disabled"
              />
            </FormControl>
          </template>
          <template v-else-if="field.type === 'textarea'">
            <FormControl>
              <Textarea
                :id="field.name"
                :placeholder="field.placeholder"
                v-bind="componentField"
                :disabled="field.disabled || props.disabled"
                :rows="field.props?.rows || 3"
              />
            </FormControl>
          </template>
          <template v-else-if="field.type === 'select'">
            <Select
              v-bind="componentField"
              :disabled="
                field.disabled ||
                props.disabled ||
                loadingOptions[field.name] ||
                (isEditMode && field.name === 'item_type')
              "
              class="w-full"
            >
              <FormControl>
                <SelectTrigger class="w-full">
                  <SelectValue
                    :placeholder="
                      loadingOptions[field.name]
                        ? t('placeholder.loading')
                        : field.placeholder || t('placeholder.select_option')
                    "
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="option in fieldOptions[field.name] ||
                    field.options ||
                    []"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </template>
          <template v-else-if="field.type === 'date'">
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  :id="field.name"
                  variant="outline"
                  :class="
                    cn(
                      'w-full justify-start text-left font-normal',
                      !fieldValue && 'text-muted-foreground',
                      (field.disabled || props.disabled) &&
                        'cursor-not-allowed opacity-50'
                    )
                  "
                  type="button"
                  :disabled="field.disabled || props.disabled"
                >
                  <Icon name="lucide:calendar" class="mr-2 h-4 w-4" />
                  <span>{{
                    fieldValue
                      ? getFormattedDate(fieldValue)
                      : field.placeholder || t("placeholder.pick_date")
                  }}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                v-if="!(field.disabled || props.disabled)"
                class="w-auto p-0"
              >
                <FormControl>
                  <Calendar
                    initial-focus
                    :v-model="fieldValue instanceof Date ? fieldValue : null"
                    @update:model-value="
                      (v) => {
                        if (v) {
                          setFieldValue(field.name, v.toString());
                        } else {
                          setFieldValue(field.name, undefined);
                        }
                      }
                    "
                  />
                </FormControl>
              </PopoverContent>
            </Popover>
          </template>
          <template v-else-if="field.type === 'checkbox'">
            <FormControl>
              <label
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                <Checkbox
                  :id="field.name"
                  v-bind="componentField"
                  :disabled="field.disabled || props.disabled"
                  :checked="fieldValue"
                />
                <span class="ml-2">{{ field.label }}</span>
              </label>
            </FormControl>
          </template>
          <template v-else-if="field.type === 'tags'">
            <FormControl>
              <TagsInput
                :id="field.name"
                :model-value="componentField.modelValue"
                :disabled="field.disabled || props.disabled"
                :placeholder="field.placeholder"
                :delimiter="/[\n,]+/"
                @update:model-value="componentField['onUpdate:modelValue']"
              >
                <TagsInputItem
                  v-for="tag in componentField.modelValue || []"
                  :key="tag"
                  :value="tag"
                >
                  <TagsInputItemText />
                  <TagsInputItemDelete />
                </TagsInputItem>
                <TagsInputInput
                  :placeholder="
                    field.placeholder || t('placeholder.tags_input')
                  "
                />
              </TagsInput>
            </FormControl>
          </template>
          <template v-else-if="field.type === 'jsonld-editor'">
            <FormControl>
              <JsonLdEditor
                :id="field.name"
                :model-value="componentField.modelValue"
                :readonly="field.disabled || props.disabled"
                :content-from-file="field.name === 'metadata_content' ? metadataFromFile : false"
                :title="field.label"
                :extra-metadata="field.name === 'metadata_content' ? mmioExtraMetadata : null"
                :item-type="field.name === 'metadata_content' ? values.item_type : undefined"
                @update:model-value="componentField['onUpdate:modelValue']"
              />
            </FormControl>
          </template>
          <template v-else-if="field.type === 'file'">
            <FormControl>
              <MmioUploadZone
                :mmio-file="displayedMmioFileName"
                :bundle-file="uploadedBundleFile?.name || null"
                :uploading="uploadingFiles[field.name]"
                :disabled="field.disabled || props.disabled"
                :readonly="field.disabled || props.disabled"
                :input-key="fileInputKeys[field.name] || 0"
                @change-mmio="(file) => handleFileChange(field.name, fileToFileList(file))"
                @change-bundle="handleBundleFileChange"
                @remove-mmio="handleFileDelete(field.name)"
                @remove-bundle="handleBundleFileRemove"
              />
            </FormControl>
          </template>
          <FormMessage />
          <p v-if="field.hint && !(field.disabled || props.disabled)" class="text-sm text-muted-foreground mt-1">
            {{ field.hint }}
          </p>
        </FormItem>
      </FormField>
    </template>

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
