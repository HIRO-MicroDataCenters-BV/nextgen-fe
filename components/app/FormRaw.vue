<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import type * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const { t } = useI18n();

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

const props = defineProps<{
  id?: string;
  formSchema: z.ZodType;
  initialValues?: Record<string, unknown>;
  fields: FormField[];
  initialData: FormData;
  submitLabel: string;
}>();

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

const isLoading = ref(false);

onMounted(async () => {
  if (props.id) {
    isLoading.value = true;
    try {
      // TODO: Replace with your API call
      const response = await fetch("/api/raw/" + props.id);
      const data = await response.json();
      setFieldValue("metadata_content", data.metadata_content);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      isLoading.value = false;
    }
  }
});

defineExpose({
  submit: onSubmit,
  cancel: () => emit("cancel"),
  resetForm,
});
</script>

<template>
  <Form class="h-full flex flex-col" @submit="onSubmit">
    <FormField v-slot="{ componentField }" name="metadata_content">
      <FormItem class="flex-1 flex flex-col">
        <FormLabel>{{ t("label.metadata_content") }}</FormLabel>
        <FormControl>
          <Textarea
            v-bind="componentField"
            class="h-[calc(100vh-300px)] resize-none"
            :placeholder="t('placeholder.enter_metadata_content')"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </Form>
</template>

<style scoped>
:deep(.form-control) {
  height: 100%;
}
</style>
