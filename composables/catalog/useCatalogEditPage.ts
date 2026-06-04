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
import { useCatalogSubmit } from "~/composables/catalog/useCatalogSubmit";
import { useCatalogFormFields } from "~/composables/catalog/useCatalogFormFields";
import {
  extractRelatedDataProduct,
  detectDatasetType,
  extractMetadataFilename,
} from "~/utils/catalogDataset";

interface UseCatalogEditPageOptions {
  t: (key: string) => string;
  getDataset: (id: string) => Promise<unknown>;
  saveDataset: (
    filename: string,
    dataset: string,
    options?: { relatedDataProduct?: string | null; isApplication?: boolean },
  ) => Promise<unknown>;
}

export const useCatalogEditPage = ({
  t,
  getDataset,
  saveDataset,
}: UseCatalogEditPageOptions) => {
  const { setPage, page } = useApp();
  const { saveCatalogItem } = useCatalogSubmit({ saveDataset });
  const route = useRoute();
  const router = useRouter();

  const serverErrors = ref<ApiErrorDetail[] | null>(null);
  const serverErrorsRef = ref<HTMLElement | null>(null);
  const loading = ref(true);
  const initialValues = ref<Record<string, unknown> | null>(null);
  const existingMetadataFilename = ref<string | null>(null);
  const formRef = ref();

  const datasetId = computed(() => {
    const param = route.params.id;
    if (Array.isArray(param)) return param[0];
    return param as string | undefined;
  });

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
        },
      ),
  );

  const fields = computed(() =>
    useCatalogFormFields({
      t,
      mode: "edit",
    }),
  );

  const formReady = computed(
    () => !loading.value && initialValues.value !== null,
  );

  const goBackToCatalog = () => {
    router.push("/my_catalog");
  };

  const loadDataset = async () => {
    if (!datasetId.value) {
      goBackToCatalog();
      return;
    }

    loading.value = true;
    try {
      const response = await getDataset(datasetId.value);
      if (!response) return;

      const dataset =
        findDatasetInJsonLd(response) ||
        (response as unknown as JsonLdObject | null);
      if (!dataset) return;

      const datasetType = detectDatasetType(dataset);
      const metadataString = JSON.stringify(dataset, null, 2);
      const converted = convertJsonLdDatasetToJson(dataset, {
        preferredLanguage: "en",
        includeRawData: false,
        flattenArrays: true,
        excludeOriginalData: true,
      });

      existingMetadataFilename.value = extractMetadataFilename(dataset);
      const relatedDataProductValue = extractRelatedDataProduct(dataset);

      setPage({
        ...page.value,
        title: (converted.title as string) || t("title.edit_catalog_item"),
        subtitle:
          (converted.description as string) ||
          t("subtitle.edit_catalog_item_desc"),
      });

      initialValues.value = {
        item_type: datasetType,
        related_data_product: relatedDataProductValue,
        file: existingMetadataFilename.value,
        metadata_content: metadataString,
      };
    } finally {
      loading.value = false;
    }
  };

  onMounted(loadDataset);

  const onSubmit = async (formValues: Record<string, unknown>) => {
    if (!datasetId.value) return;

    const uploadedFilename = formRef.value?.getUploadedFile?.("file");
    const targetFilename =
      uploadedFilename || existingMetadataFilename.value || datasetId.value;

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
        serverErrorsRef.value?.scrollIntoView?.({
          behavior: "smooth",
          block: "start",
        });
      });
      return;
    }

    goBackToCatalog();
  };

  return {
    fields,
    formRef,
    formReady,
    formSchema,
    goBackToCatalog,
    loading,
    onSubmit,
    page,
    initialValues,
    datasetId,
    serverErrors,
    serverErrorsRef,
  };
};
