<template>
  <AppContent
    :title="page.title"
    :description="page.subtitle"
    :show-available-biobanks="false"
  >
    <div
      v-if="loading"
      class="flex w-full min-w-0 flex-col py-6"
    >
      <div
        class="mx-auto flex h-64 w-full max-w-[calc(840px+16px)] items-center justify-center px-8"
      >
        <Spinner class="size-8" />
      </div>
    </div>
    <div
      v-else-if="!formReady"
      class="flex w-full min-w-0 flex-col py-10"
    >
      <div
        class="mx-auto w-full max-w-[calc(840px+16px)] px-8 text-center"
      >
        <p>{{ t("status.item_not_found") }}</p>
        <Button class="mt-4" @click="goBackToCatalog">
          {{ t("action.back_to_catalog") }}
        </Button>
      </div>
    </div>
    <div v-else class="flex w-full min-w-0 flex-col py-6">
      <div
        class="mx-auto w-full max-w-[calc(840px+16px)] min-w-0 px-8"
      >
        <AppForm
          :id="datasetId"
          :key="datasetId"
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
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as z from "zod";
import type { ApiErrorDetail } from "~/types/api.types";
import type { JsonLdObject } from "~/types/jsonld.types";
import {
  findDatasetInJsonLd,
  convertJsonLdDatasetToJson,
  createDatasetJsonLd,
} from "~/utils/jsonld";
import { hasMetadataItemTypeMismatch } from "~/utils/metadataItemTypeConsistency";
import { Spinner } from "@/components/ui/spinner";
import { useCatalogSubmit } from "~/composables/catalog/useCatalogSubmit";
import { useCatalogFormFields } from "~/composables/catalog/useCatalogFormFields";

const { t } = useI18n();
const { saveDataset, getDataset } = useApi();
const { saveCatalogItem } = useCatalogSubmit({ saveDataset });
const serverErrors = ref<ApiErrorDetail[] | null>(null);
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

const formSchema = computed(() =>
  z
    .object({
      item_type: z.string().min(1),
      related_data_product: z.string().optional().nullable(),
      file: z.any().optional().nullable(),
      metadata_content: z.union([z.string().min(1), z.record(z.unknown())]),
    })
    .refine(
      (data) =>
        !hasMetadataItemTypeMismatch(data.metadata_content, data.item_type),
      {
        message: t("jsonld.editor.validation.item_type_mismatch"),
        path: ["item_type"],
      }
    )
);

const fields = computed(() =>
  useCatalogFormFields({
    t,
    mode: "edit",
  }),
);

const formReady = computed(
  () => !loading.value && initialValues.value !== null
);

const goBackToCatalog = () => {
  router.push("/my_catalog");
};

/** Resolve related data product directory from dcat:inSeries (title or file:// @id). */
function relatedProductFromInSeries(inSeries: unknown): string | null {
  if (!inSeries || typeof inSeries !== "object") return null;
  const o = inSeries as Record<string, unknown>;

  const literalTitle = (title: unknown): string | null => {
    if (typeof title === "string" && title.trim()) return title.trim();
    if (Array.isArray(title)) {
      for (const item of title) {
        const s = literalTitle(item);
        if (s) return s;
      }
      return null;
    }
    if (title && typeof title === "object" && "@value" in title) {
      const v = (title as { "@value": unknown })["@value"];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return null;
  };

  const fromTitle = literalTitle(o["dcterms:title"]);
  if (fromTitle) return fromTitle;

  const id = o["@id"];
  if (typeof id === "string" && id.startsWith("file://")) {
    const path = id.replace(/^file:\/\//, "").replace(/^\/*/, "");
    const parts = path.split("/").filter(Boolean);
    if (parts.length) return parts[parts.length - 1] ?? null;
  }
  return null;
}

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
    // Priority: dcat:inSeries (title or file:// @id) > dcat:distribution[0].dcat:accessURL
    let relatedDataProductValue: string | null = null;
    const inSeries = dataset["dcat:inSeries"];

    if (inSeries && typeof inSeries === "object" && inSeries !== null) {
      relatedDataProductValue = relatedProductFromInSeries(inSeries);
    }

    if (!relatedDataProductValue) {
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
    const result = await saveCatalogItem({
      filename: targetFilename,
      datasetJsonLd,
      relatedDataProduct,
      isApplication,
    });

    if (!result.ok) {
      serverErrors.value = result.errors as ApiErrorDetail[];
      nextTick(() => {
        serverErrorsRef.value?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      });
      return;
    }

    goBackToCatalog();
  } catch {
    // Error handling
  }
};
</script>
