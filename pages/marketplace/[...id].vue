<template>
  <AppContent
    :title="page.title"
    :description="page.subtitle"
    :show-available-biobanks="false"
    class="lg:-mb-8"
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
    <!-- Desktop: fixed-height shell matching the catalog editor so the page
         doesn't scroll; the rail and read-only viewer scroll independently. -->
    <div
      v-else-if="metadataContent"
      class="flex w-full min-w-0 flex-col lg:h-[calc(100svh_-_4rem)]"
    >
      <div
        class="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col px-8 py-6 lg:min-h-0 lg:flex-1 lg:py-3"
      >
        <div
          class="grid grid-cols-1 items-start gap-x-10 gap-y-8 lg:min-h-0 lg:flex-1 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-stretch lg:[grid-template-rows:minmax(0,1fr)]"
        >
          <!-- Summary rail: dataset overview + back action -->
          <aside
            class="flex min-w-0 flex-col gap-5 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1"
          >
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

          <!-- Main column: read-only metadata viewer (fills + scrolls inside) -->
          <div class="editor-pane min-w-0 lg:min-h-0">
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
const config = useRuntimeConfig();
const catalogName = config.public.catalogName;

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

// Seed a default Marketplace page state synchronously so the header source
// display and AppContent stay populated on a hard refresh / direct navigation,
// before (or even if) the async dataset load resolves. Title/subtitle are
// overwritten once the dataset is found.
setPage({
  section: "marketplace",
  title: t("title.marketplace"),
  subtitle: t("subtitle.marketplace"),
  source: catalogName as string,
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
  } catch (error) {
    console.error("[marketplace/detail] Failed to load dataset", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* Desktop: let the read-only editor fill its column so its own internal
   scroll becomes the right pane's single scroll area (matches catalog edit). */
@media (min-width: 1024px) {
  .editor-pane {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .editor-pane :deep(.jsonld-editor) {
    height: 100%;
    max-height: 100%;
    min-height: 0;
  }
}
</style>
