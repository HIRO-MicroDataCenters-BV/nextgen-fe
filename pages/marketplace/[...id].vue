<template>
  <AppContent
    :title="page.title"
    :description="page.subtitle"
    :show-available-biobanks="false"
  >
    <AppDetails :data="datasetData" />
  </AppContent>
</template>

<script lang="ts" setup>
import {
  findDatasetInJsonLd,
  convertJsonLdDatasetToJson,
  createTableSearchFilter,
} from "~/utils/jsonld";

// // const { t } = useI18n();
  // const dayjs = useDayjs();
const api = useApi();
const { setPage, page } = useApp();

const datasetData = ref();

const route = useRoute();
const datasetId = route.params.id;

onMounted(async () => {
  try {
    const filter = createTableSearchFilter({
      filters: [
        {
          "@type": "dcat:Catalog",
          "dcat:dataset": {
            "@type": "dcat:Dataset",
            "dcterms:identifier": datasetId,
          },
        },
      ],
    });
    const response = await api.searchDecentralized(filter);
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
          title: data.title || "Dataset",
          subtitle: data.description || "",
        });
      }
    }
  } catch (error) {
    console.error("Error loading dataset:", error);
  }
});
</script>

<style></style>
