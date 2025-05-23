<template>
  <AppContent
    :title="t('title.edit_catalog_item')"
    :description="t('subtitle.edit_catalog_item_desc')"
  >
    <div v-if="loading" class="flex justify-center items-center h-64">
      <p>{{ t("status.loading_data") }}</p>
    </div>
    <div v-else-if="!loading && initialValues" class="px-14 py-6">
      <AppFormRaw
        ref="formRef"
        :form-schema="formSchema"
        :initial-values="initialValues"
        @submit="onSubmit"
        @cancel="onCancel"
      />
    </div>
    <div v-else class="text-center py-10">
      <p>{{ t("status.item_not_found") }}</p>
      <Button class="mt-4" @click="goBackToCatalog">{{
        t("action.back_to_catalog")
      }}</Button>
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import * as z from "zod";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const initialValues = ref<Record<string, unknown> | null>(null);

const licenseOptions = [
  { value: "cc_by", label: "Creative Commons BY" },
  { value: "cc_by_sa", label: "Creative Commons BY-SA" },
  { value: "cc_by_nc", label: "Creative Commons BY-NC" },
  { value: "mit", label: "MIT License" },
  { value: "gpl_3", label: "GPLv3" },
  { value: "proprietary", label: "Proprietary" },
];

const formSchema = [
  {
    label: t("basic_information"),
    fields: [
      {
        name: "dataProductName",
        label: t("label.data_product_name"),
        type: "text" as const,
        placeholder: t("placeholder.data_product_name"),
        validation: z
          .string()
          .min(3, { message: t("validation.required_min_length") }),
      },
      {
        name: "creator",
        label: t("label.creator"),
        type: "text" as const,
        placeholder: t("placeholder.creator"),
        validation: z
          .string()
          .min(2, { message: t("validation.required_min_length") }),
      },
      {
        name: "license",
        label: t("label.license"),
        type: "select" as const,
        placeholder: t("placeholder.select_license"),
        options: licenseOptions,
        validation: z.string({ required_error: t("validation.required") }),
      },
      {
        name: "issued",
        label: t("label.issued_date"),
        type: "date" as const,
        placeholder: t("placeholder.pick_date"),
        validation: z.date({ required_error: t("validation.required_date") }),
      },
      {
        name: "lastUpdated",
        label: t("label.last_updated"),
        type: "date" as const,
        placeholder: t("placeholder.no_date"),
        disabled: true,
        validation: z.date().optional(),
      },
      {
        name: "active",
        label: t("label.active"),
        type: "checkbox" as const,
        validation: z.boolean().optional(),
      },
      {
        name: "tags",
        label: t("label.tags"),
        type: "tags" as const,
        placeholder: t("placeholder.tags"),
        validation: z.array(z.string()).optional(),
      },
      {
        name: "description",
        label: t("label.description"),
        type: "textarea" as const,
        placeholder: t("placeholder.description"),
        validation: z.string().optional(),
      },
      {
        name: "fileUpload",
        label: t("label.file_upload"),
        type: "file" as const,
        placeholder: t("placeholder.file_upload"),
        props: {
          multiple: true,
          accept: "image/*,application/pdf",
        },
        validation: z.any().optional(),
      },
    ],
  },
];

const formRef = ref();

const mockFetchCatalogItem = async (
  id: string
): Promise<Record<string, unknown> | null> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const MOCK_DATA_SOURCE = [
    {
      id: "1",
      dataProductName: "Genomic Data Set Alpha",
      creator: "Dr. Scientist",
      license: "cc_by",
      issued: new Date(2023, 0, 15),
      lastUpdated: new Date(2023, 5, 10),
      active: true,
      tags: ["genomic", "clinical"],
      description: "This is a description",
    },
    {
      id: "2",
      dataProductName: "Clinical Trial Results Beta",
      creator: "Pharma Corp",
      license: "proprietary",
      issued: new Date(2022, 6, 20),
      lastUpdated: new Date(2023, 8, 1),
    },
  ];
  const item = MOCK_DATA_SOURCE.find((item) => item.id === id);
  if (item) {
    return {
      ...item,
      issued: new Date(item.issued),
      lastUpdated: new Date(item.lastUpdated),
    };
  }
  return null;
};

onMounted(async () => {
  const itemId = route.params.id as string;
  if (itemId) {
    const data = await mockFetchCatalogItem(itemId);
    if (data) {
      initialValues.value = data;
    }
  }
  loading.value = false;
});

const onSubmit = (formValues: Record<string, unknown>) => {
  const itemId = route.params.id as string;
  alert(
    `Data Product ${itemId} Updated (simulated): ` +
      JSON.stringify(formValues, null, 2)
  );
  router.push("/my_catalog");
};

const onCancel = () => {
  router.push("/my_catalog");
};

const goBackToCatalog = () => {
  router.push("/my_catalog");
};
</script>
