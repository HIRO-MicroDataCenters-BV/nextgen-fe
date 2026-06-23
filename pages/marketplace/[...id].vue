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
        class="mx-auto flex h-64 w-full max-w-[1600px] items-center justify-center px-8"
      >
        <Spinner class="size-8" />
      </div>
    </div>
    <div
      v-else-if="metadataContent"
      class="flex w-full min-w-0 flex-col py-6"
    >
      <div class="mx-auto w-full max-w-[1600px] min-w-0 px-8">
        <div
          class="grid grid-cols-1 items-start gap-x-10 gap-y-8 lg:grid-cols-[330px_minmax(0,1fr)]"
        >
          <!-- Summary rail: dataset overview + back action -->
          <aside class="flex min-w-0 flex-col gap-5 lg:sticky lg:top-20">
            <div>
              <h1 class="text-2xl font-semibold leading-tight">
                {{ page.title }}
              </h1>
              <p
                v-if="page.subtitle"
                class="mt-2 text-sm leading-relaxed text-muted-foreground"
              >
                {{ page.subtitle }}
              </p>
            </div>

            <div
              v-if="datasetId"
              class="flex flex-col gap-1 border-t pt-4"
            >
              <span
                class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                {{ t("label.dataset_identifier") }}
              </span>
              <span class="break-all font-mono text-xs text-foreground">
                {{ datasetId }}
              </span>
            </div>

            <Button
              variant="outline"
              class="w-full justify-center"
              @click="goBackToMarketplace"
            >
              <Icon name="lucide:arrow-left" class="size-4" />
              {{ t("action.back_to_marketplace") }}
            </Button>
          </aside>

          <!-- Main column: read-only metadata viewer -->
          <div class="min-w-0">
            <JsonLdEditor
              v-model="metadataContent"
              :title="page.title"
              :readonly="true"
              :enforce-client-access-url="false"
            />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex w-full min-w-0 flex-col py-10">
      <div class="mx-auto w-full max-w-[1600px] px-8 text-center">
        <p>{{ t("status.item_not_found") }}</p>
        <Button class="mt-4" @click="goBackToMarketplace">
          {{ t("action.back_to_marketplace") }}
        </Button>
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
const router = useRouter();
const goBackToMarketplace = () => router.push("/marketplace");
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
