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
    <AppDetails v-else :data="datasetData" />
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

// // const { t } = useI18n();
// const dayjs = useDayjs();
const api = useApi();
const { setPage, page } = useApp();

const datasetData = ref();
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
      const data = convertJsonLdDatasetToJson(dataset, {
        preferredLanguage: "en",
        includeRawData: false,
        flattenArrays: true,
        excludeOriginalData: true,
      });

      datasetData.value = data;

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
