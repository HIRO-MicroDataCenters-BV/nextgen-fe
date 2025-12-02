<script setup lang="ts">
import { computed } from "vue";
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

const items = computed<DropdownMenuItem[]>(() => props.items);
const selectedValues = computed(() => props.selectedValues || []);

const handleCheckboxChange = (key: string) => {
  const isSelected = selectedValues.value.includes(key);
  emit("filter-change", key, !isSelected, props.multiple);
};
</script>

<template>
  <div class="flex items-center gap-2 flex-wrap">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="secondary"
          role="combobox"
          class="justify-between px-2"
        >
          <div class="flex items-center gap-2">
            {{ t(`action.${label}`) }}
          </div>
          <Icon
            name="lucide:chevron-down"
            class="ml-2 h-4 w-4 shrink-0 opacity-50"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-[200px]">
        <AppMenuItem
          v-for="item in items"
          :key="item.key"
          :item="item"
          :selected-values="selectedValues"
          @update:selected="handleCheckboxChange"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>

<style scoped></style>
