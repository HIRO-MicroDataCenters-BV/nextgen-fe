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

interface UseCatalogEditPageOptions {
  t: (key: string) => string;
  getDataset: (id: string) => Promise<unknown>;
  saveDataset: (
    filename: string,
    dataset: string,
    options?: { relatedDataProduct?: string | null; isApplication?: boolean },
  ) => Promise<unknown>;
}

/** Resolve related data product directory from dcat:inSeries (title or file:// @id). */
const relatedProductFromInSeries = (inSeries: unknown): string | null => {
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
};

const extractRelatedDataProduct = (
  dataset: Record<string, unknown>,
): string | null => {
  let relatedDataProductValue: string | null = null;
  const inSeries = dataset["dcat:inSeries"];

  if (inSeries && typeof inSeries === "object" && inSeries !== null) {
    relatedDataProductValue = relatedProductFromInSeries(inSeries);
  }

  if (relatedDataProductValue) return relatedDataProductValue;

  // Fallback: extract from dcat:distribution[0].dcat:accessURL
  const distributions = dataset["dcat:distribution"];
  if (!distributions) return null;

  const distArray = Array.isArray(distributions)
    ? distributions
    : [distributions];
  if (distArray.length === 0) return null;

  const firstDist = distArray[0] as Record<string, unknown>;
  const accessURL = firstDist["dcat:accessURL"];

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

  if (!accessURLString || !accessURLString.startsWith("file://")) return null;

  const pathWithoutProtocol = accessURLString.replace(/^file:\/\//, "");
  const pathParts = pathWithoutProtocol.split("/");
  if (pathParts.length > 0 && pathParts[0]) return pathParts[0];

  return null;
};

const detectDatasetType = (
  dataset: Record<string, unknown>,
): "dataset" | "application" => {
  const dctermsType = dataset["dcterms:type"];
  if (!dctermsType) return "dataset";

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
    return "application";
  }

  return "dataset";
};

const extractMetadataFilename = (dataset: Record<string, unknown>): string | null => {
  const metadataFilename = dataset["dspace:metadataFilename"];
  if (!metadataFilename) return null;

  if (typeof metadataFilename === "object" && "@value" in metadataFilename) {
    return (metadataFilename as { "@value": string })["@value"];
  }

  if (typeof metadataFilename === "string") {
    return metadataFilename;
  }

  return null;
};

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
