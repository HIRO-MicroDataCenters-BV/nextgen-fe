<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import type {
  DropdownMenuItem,
  TableDropdownFilterProps,
} from "@/types/table.types";

const { t } = useI18n();
const props = withDefaults(defineProps<TableDropdownFilterProps>(), {
  id: "",
  label: "",
  items: () => [],
  multiple: true,
  selectedValues: () => [],
});

const emit = defineEmits<{
  "filter-change": [key: string, value: boolean, multiple: boolean];
}>();

const searchQuery = ref("");
const items = computed<DropdownMenuItem[]>(() => props.items);
const selectedValues = computed(() => props.selectedValues || []);

const selectedCount = computed(() => selectedValues.value.length);

const filteredItems = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return items.value;
  return items.value
    .map((group) => ({
      ...group,
      children: group.children?.filter((c) =>
        c.label.toLowerCase().includes(q)
      ) ?? [],
    }))
    .filter((g) => g.children.length > 0);
});

const getSelectedCountInGroup = (group: DropdownMenuItem) =>
  group.children?.filter((c) => selectedValues.value.includes(c.key)).length ?? 0;

const handleSelect = (key: string, checked: boolean) => {
  emit("filter-change", key, checked, props.multiple);
};

const handleClearAll = () => {
  [...selectedValues.value].forEach((key) => {
    emit("filter-change", key, false, props.multiple);
  });
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="h-9 border-dashed"
      >
        <Icon name="lucide:filter" class="mr-2 h-4 w-4 shrink-0" />
        {{ t(`action.${label}`) }}
        <template v-if="selectedCount > 0">
          <Separator orientation="vertical" class="mx-2 h-4" />
          <Badge
            variant="secondary"
            class="rounded-sm px-1.5 font-normal"
          >
            {{ selectedCount }}
          </Badge>
        </template>
        <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-[280px] p-0" align="start">
      <div
        class="flex items-center border-b px-2"
        @keydown.stop
        @pointerdown.stop
      >
        <Icon name="lucide:search" class="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          type="text"
          autocomplete="off"
          :placeholder="t('placeholder.search_filters')"
          class="h-9 border-0 shadow-none focus-visible:ring-0"
        />
      </div>
      <div class="max-h-[300px] overflow-y-auto p-1">
        <p
          v-if="filteredItems.length === 0"
          class="px-2 py-4 text-center text-sm text-muted-foreground"
        >
          {{ t('hint.no_results') }}
        </p>
        <template v-for="group in filteredItems" :key="group.key">
          <DropdownMenuSub v-if="!searchQuery.trim()">
            <DropdownMenuSubTrigger class="flex w-full items-center justify-between gap-2">
              <span class="min-w-0 flex-1 truncate">{{ group.label }}</span>
              <span class="flex min-w-8 shrink-0 justify-end">
                <Badge
                  v-if="getSelectedCountInGroup(group)"
                  variant="secondary"
                  class="rounded-sm px-1.5 font-normal"
                >
                  {{ getSelectedCountInGroup(group) }}
                </Badge>
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent class="max-h-[250px] overflow-y-auto">
              <DropdownMenuCheckboxItem
                v-for="child in group.children"
                :key="child.key"
                :model-value="selectedValues.includes(child.key)"
                @update:model-value="(val) => handleSelect(child.key, !!val)"
              >
                {{ child.label }}
              </DropdownMenuCheckboxItem>
            </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <template v-else>
            <div class="border-b border-border/50 px-2 py-1 last:border-b-0">
              <div class="flex items-center justify-between gap-2 py-1">
                <span class="text-xs font-medium text-muted-foreground">{{ group.label }}</span>
                <Badge
                  v-if="getSelectedCountInGroup(group)"
                  variant="secondary"
                  class="rounded-sm px-1.5 font-normal"
                >
                  {{ getSelectedCountInGroup(group) }}
                </Badge>
              </div>
              <div>
                <DropdownMenuCheckboxItem
                  v-for="child in group.children"
                  :key="child.key"
                  :model-value="selectedValues.includes(child.key)"
                  @update:model-value="(val) => handleSelect(child.key, !!val)"
                >
                  {{ child.label }}
                </DropdownMenuCheckboxItem>
              </div>
            </div>
          </template>
        </template>
      </div>
      <div
        v-if="selectedCount > 0"
        class="border-t px-2 py-2"
      >
        <button
          type="button"
          class="flex w-full items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          @click="handleClearAll"
        >
          <Icon name="lucide:x-circle" class="h-4 w-4 shrink-0" />
          {{ t("action.clear_filters") }}
        </button>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
