import { computed, ref, watch } from "vue";
import * as z from "zod";
import type { ApiErrorDetail } from "~/types/api.types";
import { createDatasetJsonLd } from "~/utils/jsonld";
import { hasMetadataItemTypeMismatch } from "~/utils/metadataItemTypeConsistency";
import { useDefaultDataset } from "@/components/JsonLdEditor/composables/useDefaultDataset";
import { useCatalogSubmit } from "~/composables/catalog/useCatalogSubmit";
import { useCatalogFormFields } from "~/composables/catalog/useCatalogFormFields";

interface UseCatalogCreatePageOptions {
  t: (key: string) => string;
  saveDataset: (
    filename: string,
    dataset: string,
    options?: { relatedDataProduct?: string | null; isApplication?: boolean },
  ) => Promise<unknown>;
  getDataproducts: (selectedClient: string) => Promise<unknown>;
}

export const useCatalogCreatePage = ({
  t,
  saveDataset,
  getDataproducts,
}: UseCatalogCreatePageOptions) => {
  const router = useRouter();
  const { selectedClient } = useClientSelector();
  const { saveCatalogItem } = useCatalogSubmit({ saveDataset });
  const { buildDefaultMetadataContentObject } = useDefaultDataset();

  const serverErrors = ref<ApiErrorDetail[] | null>(null);
  const formRef = ref();

  // Wrap getDataproducts to pass the currently selected client interface
  const getDataproductsForClient = () => {
    return getDataproducts(selectedClient.value ?? "local");
  };

  const formSchema = computed(() =>
    z
      .object({
        name: z.string().optional(),
        item_type: z.string().min(1),
        related_data_product: z.string().optional().nullable(),
        file: z
          .any()
          .refine((val) => val !== null && val !== undefined && val !== ""),
        metadata_content: z.union([z.record(z.unknown()), z.string()]).optional(),
      })
      .refine(
        (data) =>
          data.item_type !== "dataset" ||
          (data.related_data_product &&
            String(data.related_data_product).trim()),
        {
          message: t("validation.related_data_product_required"),
          path: ["related_data_product"],
        },
      )
      .refine(
        (data) =>
          !hasMetadataItemTypeMismatch(data.metadata_content, data.item_type),
        {
          message: t("jsonld.editor.validation.item_type_mismatch"),
          path: ["item_type"],
        },
      ),
  );

  const initialValues = {
    name: "",
    item_type: "dataset",
    related_data_product: null,
    file: null,
    metadata_content: buildDefaultMetadataContentObject(),
  };

  const fields = computed(() =>
    useCatalogFormFields({
      t,
      mode: "create",
      getDataproductsForClient,
    }),
  );

  watch(selectedClient, () => {
    formRef.value?.refreshFieldOptions?.("related_data_product");
  });

  const onChangeFile = (_file: File) => {
    // File changed
  };

  const onSubmitDirect = () => {
    formRef.value.submit();
  };

  const onSubmit = async (formValues: Record<string, unknown>) => {
    const uploadedFilename = formRef.value?.getUploadedFile?.("file");

    if (!uploadedFilename) {
      console.error(
        "[my_catalog/create] Save aborted: no uploaded filename (file field or DCAT-only flow)",
      );
      serverErrors.value = [
        { message: t("validation.catalog_save_missing_filename") },
      ];
      return;
    }

    const datasetJsonLd = createDatasetJsonLd(formValues, uploadedFilename);
    const isApplication = formValues.item_type === "application";
    const relatedDataProduct =
      formValues.related_data_product &&
      typeof formValues.related_data_product === "string"
        ? formValues.related_data_product.trim() || null
        : null;

    serverErrors.value = null;
    const result = await saveCatalogItem({
      filename: uploadedFilename,
      datasetJsonLd,
      relatedDataProduct,
      isApplication,
    });

    if (!result.ok) {
      serverErrors.value = result.errors as ApiErrorDetail[];
      return;
    }

    router.push("/my_catalog");
  };

  return {
    fields,
    formRef,
    formSchema,
    initialValues,
    onChangeFile,
    onSubmit,
    onSubmitDirect,
    serverErrors,
  };
};
