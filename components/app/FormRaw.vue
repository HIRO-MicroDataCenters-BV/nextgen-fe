<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import type * as z from "zod";

const { t } = useI18n();

const props = defineProps<{
  id?: string;
  formSchema: z.ZodType;
  initialValues?: Record<string, unknown>;
  fields?: FormField[];
  initialData?: FormData;
  submitLabel?: string;
}>();

const { appForm } = useAppForm();

interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
}

interface FormData {
  [key: string]: string | number | boolean;
}

const emit = defineEmits<{
  (e: "submit", data: Record<string, unknown>): void;
  (e: "cancel"): void;
}>();

const { handleSubmit, resetForm, setFieldValue } = useForm({
  validationSchema: toTypedSchema(props.formSchema),
  initialValues: props.initialValues,
});

const onSubmit = handleSubmit((values) => {
  emit("submit", values);
});

const hasFile = ref(false);

watch(appForm, (newVal) => {
  if (newVal.files.length > 0) {
    hasFile.value = true;
    const file = newVal.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setFieldValue("file", file);
    };
    reader.readAsText(file as Blob);
  }
});

defineExpose({
  submit: onSubmit,
  cancel: () => emit("cancel"),
  resetForm,
  setFieldValue,
});
</script>

<template>
  <form class="h-full flex flex-col" @submit.prevent="onSubmit">
    <FormField v-slot="{ componentField }" name="metadata_content">
      <FormItem class="flex-1 flex flex-col">
        <FormLabel>{{ t("label.metadata_content") }}</FormLabel>
        <FormControl>
          <Textarea
            v-bind="componentField"
            class="h-[calc(100vh-300px)] resize-none max-w-full overflow-x-auto"
            :placeholder="t('placeholder.enter_metadata_content')"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </form>
</template>

<style scoped>
:deep(.form-control) {
  height: 100%;
}
</style>
