<template>
  <div class="flex flex-row gap-2 items-end justify-between w-full">
    <div class="flex-auto">
      <div class="flex items-center">
        <h1 class="text-lg font-semibold">
          {{ page.title }}
        </h1>
      </div>
      <p class="text-small text-muted-foreground">
        {{ page.subtitle }}
      </p>
    </div>
    <div class="flex items-center space-x-2">
      <!-- Button Groups: Use v-if / v-else-if for mutually exclusive sets -->

      <!-- Marketplace Page Buttons -->
      <Popover v-if="showAvailableBiobanks">
        <PopoverTrigger as-child>
          <Button variant="secondary">{{
            t("action.available_biobanks")
          }}</Button>
        </PopoverTrigger>
        <PopoverContent class="p-2" align="end">
          <div class="mb-2">
            <h5 class="text-sm font-semibold mb-2">
              {{ t("subtitle.available_biobanks") }}
            </h5>
            <p class="text-sm text-muted-foreground text-black">
              {{ t("text.available_biobank_description") }}
            </p>
          </div>
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  v-for="item in availableBiobanks"
                  :key="item.key"
                  :value="item"
                  class="p-0"
                >
                  <Button
                    :href="item.url"
                    class="flex p-2 w-full flex gap-2 text-left items-start justify-start"
                    variant="ghost"
                  >
                    <span
                      ><img :src="`/images/icons/${item.icon}.png`" alt=""
                    ></span>
                    <span>{{ item.label }}</span>
                  </Button>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <!-- My Catalog Index Page Button -->
      <Button
        v-else-if="isMyCatalogIndexPage"
        @click="navigateToCreateCatalogItem"
      >
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        {{ t("action.create_new") }}
      </Button>

      <!-- My Catalog Form Page (Create/Edit) Buttons -->
      <Toolbar v-else-if="isMyCatalogFormPage" :buttons="toolbarButtons" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from "vue-router";
import Toolbar from "./header/Toolbar.vue";
import type { ToolbarButton } from "~/types/toolbar.types";

const { page } = useApp();

const props = defineProps<{
  title: string;
  description?: string;
  showAvailableBiobanks?: boolean;
}>();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const emit = defineEmits(["submit", "discard", "change-file"]);

// Ensure this is specific enough not to conflict with /my_catalog/create or /my_catalog/:id/edit
const isMyCatalogIndexPage = computed(() => route.path === "/my_catalog");
const isMyCatalogCreatePage = computed(
  () => route.path === "/my_catalog/create"
);
const isMyCatalogEditPage = computed(
  () =>
    route.path.startsWith("/my_catalog/") &&
    route.params.id &&
    route.path.endsWith("/edit")
);
const isMyCatalogFormPage = computed(
  () => isMyCatalogCreatePage.value || isMyCatalogEditPage.value
);

const showAvailableBiobanks = ref(props.showAvailableBiobanks);
const navigateToCreateCatalogItem = () => {
  router.push("/my_catalog/create");
};

const toolbarButtons = computed<ToolbarButton[]>(() => {
  const buttons: ToolbarButton[] = [];

  buttons.push(
    {
      id: "discard",
      label: t("action.discard"),
      variant: "outline",
      action: {
        type: "discard",
        onConfirm: () => router.back(),
      },
    },
    {
      id: "fileUpload",
      label: t("action.upload_file"),
      variant: "secondary",
      action: {
        type: "fileUpload",
        onConfirm: () => emit("change-file"),
      },
    },
    {
      id: "submit",
      label: t("action.create"),
      action: {
        type: "submit",
        onConfirm: () => emit("submit"),
      },
    }
  );

  return buttons;
});

const availableBiobanks = ref([
  { key: "umcu", icon: "umcu", label: "UMCU", url: "./umcu" },
  { key: "ki", icon: "ki", label: "KI", url: "./KI" },
  { key: "hus", icon: "hus", label: "HUS", url: "./hus" },
  { key: "uva", icon: "uva", label: "UVA", url: "./uva" },
  { key: "tum", icon: "tum", label: "TUM", url: "./tum" },
]);
</script>

<style>
/* Add any necessary styles */
</style>
