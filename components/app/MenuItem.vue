<script setup lang="ts">
import { h } from "vue";
import { useI18n } from "vue-i18n";
import type { DropdownMenuItem } from "@/types/table.types";
import {
  DropdownMenuItem as DropdownMenuItemComponent,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

const { t } = useI18n();

const props = defineProps<{
  item: DropdownMenuItem;
  selectedValues: string[];
}>();

const emit = defineEmits<{
  (e: "update:selected", key: string): void;
}>();

const selectedValues = ref<string[]>(props.selectedValues);

watch(
  () => selectedValues,
  (newVal) => {
    console.log("selectedValues", newVal);
  },
  {
    deep: true,
  }
);
</script>

<template>
  <template v-if="item.children">
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {{ t(`label.${item.key}`) }}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <MenuItem
            v-for="child in item.children"
            :key="child.key"
            :item="child"
            :selected-values="selectedValues"
            @update:selected="(key) => emit('update:selected', key)"
          />
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  </template>
  <template v-else>
    <DropdownMenuItemComponent
      :class="item.type === 'checkbox' ? 'flex items-center gap-2' : ''"
    >
      <Label
        @click.prevent="() => emit('update:selected', item.key)"
        class="font-normal"
      >
        <Checkbox
          v-if="item.type === 'checkbox'"
          :checked="selectedValues.includes(item.key)"
        />
        {{ t(`label.${item.key}`) }}
      </Label>
    </DropdownMenuItemComponent>
  </template>
</template>
