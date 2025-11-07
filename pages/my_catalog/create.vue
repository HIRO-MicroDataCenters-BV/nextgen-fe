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
import { createDatasetJsonLd } from "@/utils/jsonld";

const { t } = useI18n();
const { saveDataset, getDataproducts } = useApi();
const router = useRouter();

const formSchema = z.object({
  name: z.string().optional(),
  item_type: z.string().min(1),
  related_data_product: z.string().optional(),
  file: z
    .any()
    .refine((val) => val !== null && val !== undefined && val !== ""),
  metadata_content: z.string().min(1),
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
    dataSource: getDataproducts,
    fieldOptions: {
      dataPath: "dataproducts",
    },
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
    accept: "application/json, application/x-tar",
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
  const uploadedFilename = formRef.value?.getUploadedFile?.("file");

  if (!uploadedFilename) {
    console.error("uploaded filename not found");
    return;
  }

  const datasetJsonLd = createDatasetJsonLd(formValues, uploadedFilename);
  console.log("data", datasetJsonLd);

  const result = await saveDataset(uploadedFilename, datasetJsonLd);
  console.log("res", result);

  router.push("/my_catalog");
};
</script>
