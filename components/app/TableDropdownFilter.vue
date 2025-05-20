<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import type {
  DropdownMenuItem,
  TableDropdownFilterProps,
} from "@/types/table.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const { t } = useI18n();
const props = withDefaults(defineProps<TableDropdownFilterProps>(), {
  id: "",
  label: "",
  items: () => [],
});

const items = ref<DropdownMenuItem[]>(props.items);
const selectedValues = ref<string[]>([]);

const handleCheckboxChange = (key: string) => {
  if (selectedValues.value.includes(key)) {
    selectedValues.value = selectedValues.value.filter((v) => v !== key);
  } else {
    selectedValues.value = [...selectedValues.value, key];
  }
};

const handleRemoveSelected = (key: string) => {
  selectedValues.value = selectedValues.value.filter((v) => v !== key);
};
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="secondary" role="combobox" class="justify-between px-2">
        <div class="flex items-center gap-2">
          {{ t(`action.${label}`) }}
        </div>
        <Icon
          name="lucide:chevron-down"
          class="ml-2 h-4 w-4 shrink-0 opacity-50"
        />
      </Button>
      <div v-if="selectedValues.length > 0" class="flex gap-2">
        <Badge
          v-for="item in selectedValues"
          :key="item"
          variant="secondary"
          class="rounded-sm px-2 text-sm"
        >
          {{ item }}
          <Button
            variant="ghost"
            size="icon"
            class="p-0 h-auto w-auto"
            @click="handleRemoveSelected(item)"
          >
            <Icon name="lucide:x" class="h-2 w-2" />
          </Button>
        </Badge>
      </div>
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
</template>

<style scoped></style>
