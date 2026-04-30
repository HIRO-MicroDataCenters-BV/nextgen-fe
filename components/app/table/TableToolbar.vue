<script setup lang="ts">
import type { DropdownMenuItem } from "~/types/table.types";

interface TableToolbarProps {
  hasSourceHeader: boolean;
  selectedType: string;
  isMyCatalog: boolean;
  searchValue: string;
  filterItems: DropdownMenuItem[];
  selectedFilterKeys: string[];
  selectedFilters: Record<string, boolean | string | number>;
  filterLabelByKey: Record<string, string>;
  selectedApplicationName?: string | null;
  selectedDatasetName?: string | null;
}

defineProps<TableToolbarProps>();

const emit = defineEmits<{
  (e: "create" | "apply-search" | "clear-all-filters"): void;
  (e: "type-change", value: string | number): void;
  (e: "search-update" | "remove-filter", value: string): void;
  (
    e: "filter-change",
    key: string,
    value: boolean | string | number,
    multiple: boolean,
  ): void;
  (e: "clear-selected-dataset" | "clear-selected-application"): void;
}>();

const { t } = useI18n();

const handleSearchUpdate = (value: string) => {
  emit("search-update", value);
  emit("apply-search");
};
</script>

<template>
  <div
    class="sticky top-16 z-30 -mx-1 shrink-0 space-y-4 bg-background px-1 pb-3 shadow-sm"
  >
    <div class="mx-auto max-w-[calc(840px+16px)] w-full px-8 py-4">
      <div
        v-if="hasSourceHeader"
        class="flex flex-wrap items-center justify-between gap-2"
      >
        <div class="flex items-center gap-2">
          <AppHeaderSource />
        </div>
        <div class="flex items-center gap-2">
          <Button class="cursor-pointer" @click="emit('create')">{{
            t("action.add_new_item")
          }}</Button>
        </div>
      </div>
      <div class="flex items-center justify-between gap-2">
        <Tabs :model-value="selectedType" @update:model-value="emit('type-change', $event)">
          <TabsList class="mx-auto flex items-center justify-center">
            <TabsTrigger value="datasets">
              <Icon name="lucide:table-2" />
              {{ isMyCatalog ? $t("hint.your") : "" }}
              {{ $t("action.datasets") }}
            </TabsTrigger>
            <TabsTrigger value="applications">
              <Icon name="lucide:box" />
              {{ isMyCatalog ? $t("hint.your") : "" }}
              {{ $t("action.applications") }}
              <span
                v-if="isMyCatalog && selectedApplicationName"
                class="ml-1 inline-flex h-2 w-2 rounded-full bg-primary"
              />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div class="flex items-center gap-2">
          <div class="flex flex-auto flex-wrap gap-2">
            <div class="relative flex max-w-sm items-center gap-2">
              <Input
                :model-value="searchValue"
                class="w-64 pl-8"
                type="search"
                :placeholder="t('placeholder.search', { type: selectedType })"
                @update:model-value="handleSearchUpdate(String($event || ''))"
              />
              <span
                class="absolute start-0 inset-y-0 flex items-center justify-center px-2"
              >
                <Icon name="lucide:search" />
              </span>
            </div>

            <AppTableDropdownFilter
              id="filter"
              label="filter"
              :items="filterItems"
              :selected-values="selectedFilterKeys"
              @filter-change="
                (key, value, multiple) =>
                  emit('filter-change', key, value, multiple)
              "
            />
          </div>
        </div>
      </div>
      <div
        v-if="isMyCatalog && (selectedDatasetName || selectedApplicationName)"
        class="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
      >
        <div v-if="selectedDatasetName" class="inline-flex items-center gap-2 rounded bg-background px-2 py-1">
          <span class="font-medium">Dataset:</span>
          <span>{{ selectedDatasetName }}</span>
          <Button
            variant="ghost"
            size="icon"
            class="h-5 w-5"
            @click="emit('clear-selected-dataset')"
          >
            <Icon name="lucide:x" class="h-3 w-3" />
          </Button>
        </div>
        <div v-if="selectedApplicationName" class="inline-flex items-center gap-2 rounded bg-background px-2 py-1">
          <span class="font-medium">Application:</span>
          <span>{{ selectedApplicationName }}</span>
          <Button
            variant="ghost"
            size="icon"
            class="h-5 w-5"
            @click="emit('clear-selected-application')"
          >
            <Icon name="lucide:x" class="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div class="filters-list mt-2">
        <div
          v-if="Object.keys(selectedFilters).length > 0"
          class="flex flex-wrap items-center gap-2"
        >
          <Button
            variant="default"
            size="sm"
            class="h-6 rounded-sm px-2 py-0 text-sm font-normal"
            @click="emit('clear-all-filters')"
          >
            {{ t("action.clear_filters") }}
          </Button>
          <Badge
            v-for="(value, key) in selectedFilters"
            :key="key"
            variant="secondary"
            class="h-6 rounded-sm px-2 text-sm capitalize"
          >
            {{ filterLabelByKey[key] ?? key }}
            <Button
              variant="ghost"
              size="icon"
              class="ml-1 h-auto w-auto p-0"
              @click.stop="emit('remove-filter', key as string)"
            >
              <Icon name="lucide:x" class="h-3 w-3" />
            </Button>
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>
