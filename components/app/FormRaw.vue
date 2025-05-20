<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const { t } = useI18n();

const props = defineProps<{
  id?: string;
  formSchema: z.ZodType;
  initialValues?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: "submit", data: Record<string, any>): void;
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
      setFieldValue("content", data.content);
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
  <Form @submit="onSubmit" class="h-full flex flex-col">
    <FormField v-slot="{ componentField }" name="metadata_content">
      <FormItem class="flex-1 flex flex-col">
        <FormLabel>{{ t("label.metadata_content") }}</FormLabel>
        <FormControl>
          <Textarea
            v-bind="componentField"
            class="flex-1 resize-none"
            :placeholder="t('placeholder.enter_metadata_content')"
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>
  </Form>
</template>
