<template>
  <AppContent
    :title="page.title"
    :description="page.subtitle"
    :show-available-biobanks="false"
  >
    <div v-if="loading" class="flex justify-center items-center h-64">
      <Spinner class="size-8" />
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
        :key="String(selectedClient)"
        ref="formRef"
        :title="t('title.edit_catalog_item')"
        :description="t('subtitle.edit_catalog_item_desc')"
        :fields="fields"
        :form-schema="formSchema"
        :initial-values="initialValues!"
        :server-errors="serverErrors"
        @submit="onSubmit"
        @clear-server-errors="serverErrors = null"
      />
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as z from "zod";
import type { FormFieldDefinition } from "@/components/app/Form.vue";
import type { JsonLdObject } from "~/types/jsonld.types";
import {
  findDatasetInJsonLd,
  convertJsonLdDatasetToJson,
  createDatasetJsonLd,
} from "~/utils/jsonld";
import { Spinner } from "@/components/ui/spinner";

const { t } = useI18n();
const { saveDataset, getDataset, getDataproducts } = useApi();
const { selectedClient } = useClientSelector();
const serverErrors = ref<Array<{ code?: string; message?: string; details?: unknown[] }> | null>(null);
const serverErrorsRef = ref<HTMLElement | null>(null);
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
  metadata_content: z.union([z.string().min(1), z.record(z.unknown())]),
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
    name: "client_selector",
    label: "",
    type: "client-selector",
    conditions: [
      {
        field: "item_type",
        value: "dataset",
      },
    ],
  },
  {
    name: "related_data_product",
    label: t("label.related_data_product"),
    type: "select",
    placeholder: t("placeholder.select_data_product"),
    dataSource: () => getDataproducts(selectedClient.value ?? "local"),
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
  },
  {
    name: "file",
    label: t("label.file"),
    type: "file",
    placeholder: t("placeholder.select_file"),
    hint: t("hint.accepted_file_types_json_jar"),
    accept: "application/json, application/x-tar",
    disabled: true,
  },
  {
    name: "metadata_content",
    label: t("label.metadata_content"),
    type: "jsonld-editor",
    placeholder: t("placeholder.enter_metadata_content"),
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

    // Determine type using dcterms:type[@id] (Software = application, Dataset = dataset)
    let detectedType: "dataset" | "application" = "dataset";
    const dctermsType = dataset["dcterms:type"];
    
    if (dctermsType) {
      let typeId: string | undefined;
      
      if (typeof dctermsType === "string") {
        typeId = dctermsType;
      } else if (Array.isArray(dctermsType)) {
        const firstType = dctermsType[0];
        if (firstType && typeof firstType === "object" && "@id" in firstType) {
          typeId = (firstType as Record<string, unknown>)["@id"] as string;
        }
      } else if (typeof dctermsType === "object" && "@id" in dctermsType) {
        typeId = (dctermsType as Record<string, unknown>)["@id"] as string;
      }
      
      if (typeId === "http://purl.org/dc/dcmitype/Software") {
        detectedType = "application";
      }
    }
    
    datasetType.value = detectedType;

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

    // Extract related_data_product from dcat:inSeries or dcat:distribution
    // Priority: dcat:inSeries > dcat:distribution[0].dcat:accessURL
    let relatedDataProductValue: string | null = null;
    const inSeries = dataset["dcat:inSeries"];

    if (inSeries && typeof inSeries === "object" && inSeries !== null) {
      const inSeriesObj = inSeries as Record<string, unknown>;
      const dctermsTitle = inSeriesObj["dcterms:title"] as
        | { "@value": string }
        | undefined;
      if (
        dctermsTitle &&
        typeof dctermsTitle === "object" &&
        "@value" in dctermsTitle
      ) {
        relatedDataProductValue = dctermsTitle["@value"];
      }
    } else {
      // Fallback: extract from dcat:distribution[0].dcat:accessURL
      // Format: file://disease_xyz/filename.ext -> extract "disease_xyz"
      const distributions = dataset["dcat:distribution"];
      if (distributions) {
        const distArray = Array.isArray(distributions)
          ? distributions
          : [distributions];
        if (distArray.length > 0) {
          const firstDist = distArray[0] as Record<string, unknown>;
          const accessURL = firstDist["dcat:accessURL"];
          if (accessURL) {
            let accessURLString: string | null = null;
            if (typeof accessURL === "string") {
              accessURLString = accessURL;
            } else if (
              typeof accessURL === "object" &&
              accessURL !== null &&
              "@id" in accessURL
            ) {
              accessURLString = (accessURL as { "@id": string })["@id"];
            }

            if (accessURLString && accessURLString.startsWith("file://")) {
              // Extract path after file://
              const pathWithoutProtocol = accessURLString.replace(
                /^file:\/\//,
                ""
              );
              // Get first part of path (before first /)
              const pathParts = pathWithoutProtocol.split("/");
              if (pathParts.length > 0 && pathParts[0]) {
                relatedDataProductValue = pathParts[0];
              }
            }
          }
        }
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
      related_data_product: relatedDataProductValue,
      file: existingMetadataFilename.value,
      metadata_content: metadataString,
    };
  } catch {
    // Error loading dataset
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

    const isApplication = formValues.item_type === "application";

    const relatedDataProduct =
      formValues.related_data_product &&
      typeof formValues.related_data_product === "string"
        ? formValues.related_data_product.trim() || null
        : null;

    serverErrors.value = null;
    const result = await saveDataset(targetFilename, datasetJsonLd, {
      relatedDataProduct,
      isApplication,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultAny = result as any;
    if (resultAny && resultAny.error === true) {
      const data = resultAny.data as Record<string, unknown> | undefined;
      const detail = data?.detail;
      let errors: Array<{ code?: string; message?: string; details?: unknown[] }> = [];
      if (Array.isArray(detail) && detail.length > 0) {
        errors = detail as Array<{ code?: string; message?: string; details?: unknown[] }>;
      } else if (typeof detail === "string" && detail) {
        errors = [{ message: detail }];
      } else if (data?.message) {
        errors = [{ message: String(data.message) }];
      } else {
        errors = [{ message: "Server error occurred" }];
      }
      serverErrors.value = errors;
      nextTick(() => {
        serverErrorsRef.value?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      });
      return;
    }

    if (result) {
      goBackToCatalog();
    }
  } catch {
    // Error handling
  }
};
</script>
