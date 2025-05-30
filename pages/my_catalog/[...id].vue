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
import type { SearchFilter } from "~/types/api.types";
import {
  findDatasetInJsonLd,
  convertJsonLdDatasetToJson,
  createTableSearchFilter,
} from "~/utils/jsonld";

const { t } = useI18n();
const dayjs = useDayjs();
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

    console.log("Created search filter:", filter);
    const response = await api.searchLocalCatalog(filte as SearchFilter);
    const dataset = findDatasetInJsonLd(response);

    if (dataset) {
      const data = convertJsonLdDatasetToJson(dataset, {
        preferredLanguage: "en",
        includeRawData: false,
        flattenArrays: true,
        excludeOriginalData: true,
      });

      console.log("Dataset:", dataset, data);

      datasetData.value = data;

      if (data) {
        setPage({
          title: data.title || "Dataset",
          subtitle: data.description || "",
        });
        console.log("SETO!");
      }
    }
  } catch (error) {
    console.error("Error loading dataset:", error);
  }
});
</script>

<style></style>