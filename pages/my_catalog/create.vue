<template>
  <AppContent
    :title="t('title.create_catalog_item')"
    :description="t('subtitle.create_catalog_item_desc')"
    @submit="onSubmitDirect"
    @change-file="onChangeFile"
  >
    <div class="px-14 py-6">
      <AppForm
        ref="formRef"
        :title="t('title.create_catalog_item')"
        :description="t('subtitle.create_catalog_item_desc')"
        :fields="fields"
        :form-schema="formSchema"
        :initial-values="initialValues"
        @submit="onSubmit"
      />
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import * as z from "zod";
import type { FormFieldDefinition } from "@/components/app/Form.vue";

const { t } = useI18n();
const { uploadMmioFile, saveDataset } = useApi();
const router = useRouter();

const formSchema = z.object({
  name: z.string(),
  item_type: z.string(),
  related_data_product: z.string().optional(),
  file: z.any(),
  metadata_content: z.string(),
});

const formRef = ref();

const initialValues = {
  name: "",
  item_type: "dataset",
  related_data_product: null,
  file: null,
  metadata_content: "",
};

const fields: FormFieldDefinition[] = [
  {
    name: "name",
    label: t("label.name"),
    type: "text",
    placeholder: t("placeholder.enter_name"),
    hint: null,
    disabled: false,
  },
  {
    name: "item_type",
    label: t("label.item_type"),
    type: "select",
    placeholder: t("placeholder.select_data_product_directory"),

    options: [
      { label: t("label.dataset"), value: "dataset" },
      { label: t("label.application"), value: "application" },
    ],
    disabled: false,
  },
  {
    name: "related_data_product",
    label: t("label.related_data_product"),
    type: "select",
    placeholder: t("placeholder.select_data_product"),
    options: [],
    hint: null,
    conditions: [
      {
        field: "item_type",
        value: "dataset",
      },
    ],
    disabled: false,
  },
  {
    name: "file",
    label: t("label.file"),
    type: "file",
    placeholder: t("placeholder.select_file"),
    hint: t("hint.accepted_file_types_json_jar"),
    disabled: false,
  },
  {
    name: "metadata_content",
    label: t("label.metadata_content"),
    type: "textarea",
    placeholder: t("placeholder.enter_metadata_content"),
    hint: null,
    disabled: false,
  },
];

const onChangeFile = (file: File) => {
  console.log("File changed: ", file);
};
const onSubmitDirect = () => {
  formRef.value.submit();
};

const onSubmit = async (formValues: Record<string, unknown>) => {
  if (formValues.file) {
    console.log("File: ", formValues.file);
    const file = formValues.file as File;
    const name = file.name;
    await uploadMmioFile(file);
    await saveDataset(name, formValues.metadata_content as string);
    router.push("/my_catalog");
  }
};
</script>
