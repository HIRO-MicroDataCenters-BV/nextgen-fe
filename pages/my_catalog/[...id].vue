<template>
  <AppContent
    :title="page.title"
    :description="page.subtitle"
    :show-available-biobanks="false"
  >
    <div v-if="loading" class="flex justify-center items-center h-64">
      <p>{{ t("status.loading_data") }}</p>
    </div>
    <div v-else-if="!formReady" class="text-center py-10">
      <p>{{ t("status.item_not_found") }}</p>
      <Button class="mt-4" @click="goBackToCatalog">
        {{ t("action.back_to_catalog") }}
      </Button>
    </div>
    <div v-else class="px-14 py-6">
      <AppForm
        :id="datasetId"
        ref="formRef"
        :title="t('title.edit_catalog_item')"
        :description="t('subtitle.edit_catalog_item_desc')"
        :fields="fields"
        :form-schema="formSchema"
        :initial-values="initialValues!"
        @submit="onSubmit"
      />
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as z from "zod";
import type { FormFieldDefinition } from "@/components/app/Form.vue";
import type { JsonLdObject } from "~/types/jsonld.types";
import {
  findDatasetInJsonLd,
  convertJsonLdDatasetToJson,
  createDatasetJsonLd,
} from "~/utils/jsonld";

const { t } = useI18n();
const { saveDataset, getDataset, getDataproducts } = useApi();
const { setPage, page } = useApp();

const route = useRoute();
const router = useRouter();

const datasetId = computed(() => {
  const param = route.params.id;
  if (Array.isArray(param)) {
    return param[0];
  }
  return param as string | undefined;
});

const loading = ref(true);
const datasetType = ref<"dataset" | "application">("dataset");
const initialValues = ref<Record<string, unknown> | null>(null);
const formRef = ref();
const existingMetadataFilename = ref<string | null>(null);

const formSchema = z.object({
  item_type: z.string().min(1),
  related_data_product: z.string().optional().nullable(),
  file: z.any().optional().nullable(),
  metadata_content: z.string().min(1),
});

const fields = computed<FormFieldDefinition[]>(() => [
  {
    name: "item_type",
    label: t("label.item_type"),
    type: "select",
    placeholder: t("placeholder.select_data_product_directory"),
    options: [
      { label: t("label.dataset"), value: "dataset" },
      { label: t("label.application"), value: "application" },
    ],
    disabled: true,
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
    conditions: [
      {
        field: "item_type",
        value: "dataset",
      },
    ],
  },
  {
    name: "file",
    label: t("label.file"),
    type: "file",
    placeholder: t("placeholder.select_file"),
    hint: t("hint.accepted_file_types_json_jar"),
    accept: "application/json, application/x-tar",
  },
  {
    name: "metadata_content",
    label: t("label.metadata_content"),
    type: "textarea",
    placeholder: t("placeholder.enter_metadata_content"),
    props: {
      rows: 18,
    },
  },
]);

const formReady = computed(
  () => !loading.value && initialValues.value !== null
);

const goBackToCatalog = () => {
  router.push("/my_catalog");
};

onMounted(async () => {
  if (!datasetId.value) {
    goBackToCatalog();
    return;
  }

  loading.value = true;
  try {
    const response = await getDataset(datasetId.value);
    if (!response) {
      return;
    }

    const dataset =
      findDatasetInJsonLd(response) ||
      (response as unknown as JsonLdObject | null);
    if (!dataset) {
      return;
    }

    const rawType = dataset["@type"];
    const typeList = Array.isArray(rawType) ? rawType : [rawType];
    datasetType.value = typeList?.includes("dspace:Application")
      ? "application"
      : "dataset";

    const metadataString = JSON.stringify(dataset, null, 2);
    const converted = convertJsonLdDatasetToJson(dataset, {
      preferredLanguage: "en",
      includeRawData: false,
      flattenArrays: true,
      excludeOriginalData: true,
    });

    const metadataFilename = dataset["dspace:metadataFilename"];
    if (metadataFilename) {
      if (
        typeof metadataFilename === "object" &&
        "@value" in metadataFilename
      ) {
        existingMetadataFilename.value = (
          metadataFilename as { "@value": string }
        )["@value"];
      } else if (typeof metadataFilename === "string") {
        existingMetadataFilename.value = metadataFilename;
      }
    }

    setPage({
      ...page.value,
      title: (converted.title as string) || t("title.edit_catalog_item"),
      subtitle:
        (converted.description as string) ||
        t("subtitle.edit_catalog_item_desc"),
    });

    initialValues.value = {
      item_type: datasetType.value,
      related_data_product: null,
      file: null,
      metadata_content: metadataString,
    };
  } catch (error) {
    console.error("Error loading dataset:", error);
  } finally {
    loading.value = false;
  }
});

const onSubmit = async (formValues: Record<string, unknown>) => {
  if (!datasetId.value) {
    return;
  }

  const uploadedFilename = formRef.value?.getUploadedFile?.("file");

  let targetFilename: string;
  if (uploadedFilename) {
    targetFilename = uploadedFilename;
  } else if (existingMetadataFilename.value) {
    targetFilename = existingMetadataFilename.value;
  } else {
    targetFilename = datasetId.value;
  }

  try {
    const datasetJsonLd = createDatasetJsonLd(formValues, targetFilename);

    const result = await saveDataset(targetFilename, datasetJsonLd);
    if (result) {
      goBackToCatalog();
    }
  } catch (error) {
    console.error("Failed to save dataset:", error);
  }
};
</script>
