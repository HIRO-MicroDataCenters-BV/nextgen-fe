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
      v-else-if="metadataContent"
      class="flex w-full min-w-0 flex-col py-6"
    >
      <div class="mx-auto w-full max-w-[calc(840px+16px)] min-w-0 px-8">
        <JsonLdEditor
          v-model="metadataContent"
          :title="page.title"
          :enforce-client-access-url="false"
        />
      </div>
    </div>
    <div v-else class="flex w-full min-w-0 flex-col py-10">
      <div class="mx-auto w-full max-w-[calc(840px+16px)] px-8 text-center">
        <p>{{ t("status.item_not_found") }}</p>
      </div>
    </div>
  </AppContent>
</template>

<script lang="ts" setup>
import type { SearchFilter } from "~/types/api.types";
import {
  findDatasetInJsonLd,
  convertJsonLdDatasetToJson,
  createTableSearchFilter,
} from "~/utils/jsonld";
import { Spinner } from "@/components/ui/spinner";
import JsonLdEditor from "@/components/JsonLdEditor/index.vue";

const { t } = useI18n();
const api = useApi();
const { setPage, page } = useApp();

const metadataContent = ref<string>("");
const loading = ref(true);

const route = useRoute();
const datasetId = computed(() => {
  const idParam = route.params.id;
  if (Array.isArray(idParam)) {
    return idParam.join("/");
  }
  return (idParam as string) || "";
});

onMounted(async () => {
  if (!datasetId.value) {
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const filter = createTableSearchFilter({
      filters: [
        {
          "dcat:dataset": {
            "dcterms:identifier": datasetId.value,
          },
        },
      ],
    });
    const response = await api.searchDistributed(filter as SearchFilter);
    const dataset = findDatasetInJsonLd(response);

    if (dataset) {
      // Raw JSON-LD drives the editor; mirrors the catalog edit page.
      metadataContent.value = JSON.stringify(dataset, null, 2);

      // Flattened view is used only to derive the page title/subtitle.
      const data = convertJsonLdDatasetToJson(dataset, {
        preferredLanguage: "en",
        includeRawData: false,
        flattenArrays: true,
        excludeOriginalData: true,
      });

      if (data) {
        setPage({
          ...page.value,
          ...{
            title: (data.title as string) || "Dataset",
            subtitle: (data.description as string) || "",
          },
        });
      }
    }
  } catch {
    // Error loading dataset
  } finally {
    loading.value = false;
  }
});
</script>

<style></style>
