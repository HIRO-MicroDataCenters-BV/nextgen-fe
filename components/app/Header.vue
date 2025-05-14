<template>
  <div class="flex flex-row gap-2 items-end justify-between w-full">
    <div class="flex-auto">
      <div class="flex items-center">
        <h1 class="text-lg font-semibold">
          {{ currentPageTitle }}
        </h1>
      </div>
      <p class="text-small text-muted-foreground">
        {{ currentPageDescription }}
      </p>
    </div>
    <div class="flex items-center space-x-2">
      <Popover v-if="isMarketplacePage">
        <PopoverTrigger as-child>
          <Button variant="secondary">{{ t('action.available_biobanks') }}</Button>
        </PopoverTrigger>
        <PopoverContent class="p-2" align="end">
          <div class="mb-2">
            <h5 class="text-sm font-semibold mb-2">{{ t('subtitle.available_biobanks') }}</h5>
            <p class="text-sm text-muted-foreground text-black">{{ t('text.available_biobank_description') }}</p>
          </div>
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem v-for="item in availableBiobanks" :key="item.key" :value="item" class="p-0">
                  <Button :href="item.url" class="flex p-2 w-full flex gap-2 text-left items-start justify-start" variant="ghost">
                    <span><img :src="`/images/icons/${item.icon}.png`" /></span>
                    <span>{{ item.label }}</span>
                  </Button>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button v-if="isMyCatalogIndexPage" @click="navigateToCreateCatalogItem">
        <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
        {{ t('action.create_new') }}
      </Button>

      <template v-if="isMyCatalogFormPage">
        <Button variant="outline" @click="onDiscardClick">
          {{ t('action.discard') }}
        </Button>
        <Button @click="onSaveClick">
          <Icon name="lucide:save" class="mr-2 h-4 w-4" />
          {{ t('action.save_changes') }}
        </Button>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
// import { Icon } from '#components'; // Ensure Icon is globally available or imported

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const emit = defineEmits(['save-form', 'discard-form']);

const isMarketplacePage = computed(() => route.path.startsWith('/marketplace'));
const isMyCatalogIndexPage = computed(() => route.path === '/my_catalog');
const isMyCatalogCreatePage = computed(() => route.path === '/my_catalog/create');
const isMyCatalogEditPage = computed(() => 
  route.path.startsWith('/my_catalog/') && route.params.id && route.path.endsWith('/edit')
);
const isMyCatalogFormPage = computed(() => isMyCatalogCreatePage.value || isMyCatalogEditPage.value);

const currentPageTitle = computed(() => {
  if (isMyCatalogCreatePage.value) return t('header_title.create_catalog_item_details', 'Create');
  if (isMyCatalogEditPage.value) return t('header_title.edit_catalog_item_details', 'Edit Details');
  if (isMyCatalogIndexPage.value) return t('title.my_catalog', 'My Catalog');
  if (isMarketplacePage.value) return t('title.marketplace', 'Marketplace');
  return ''; // Default or error title
});

const currentPageDescription = computed(() => {
  if (isMyCatalogCreatePage.value) return t('header_subtitle.new_metadata_details', 'New metadata details.');
  if (isMyCatalogEditPage.value) return t('header_subtitle.change_metadata_details', 'Change metadata details.');
  if (isMyCatalogIndexPage.value) return t('subtitle.my_catalog', 'Manage your data products.'); // Or your preferred subtitle for index
  if (isMarketplacePage.value) return t('subtitle.marketplace_description', 'Explore available biobanks.'); // Example subtitle
  return ''; // Default or error description
});

const navigateToCreateCatalogItem = () => {
  router.push('/my_catalog/create');
};

const onSaveClick = () => {
  emit('save-form');
};

const onDiscardClick = () => {
  emit('discard-form');
};

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