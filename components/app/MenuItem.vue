<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DropdownMenuItem } from "@/types/table.types";
import { DropdownMenuItem as DropdownMenuItemComponent } from "@/components/ui/dropdown-menu";
const { t } = useI18n();

const props = defineProps<{
  item: DropdownMenuItem;
  selectedValues: string[];
}>();

const emit = defineEmits<{
  (e: "update:selected", key: string): void;
}>();

const isSelected = computed(() => {
  return props.selectedValues.includes(props.item.key);
});
</script>

<template>
  <template v-if="item.children">
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        {{ t(`filter.${item.key}`) }}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <MenuItem
            v-for="child in item.children"
            :key="child.key"
            :item="child"
            :selected-values="props.selectedValues"
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
        class="font-normal flex items-start gap-2 w-full capitalize"
        @click.prevent="() => emit('update:selected', item.key)"
      >
        <span class="flex-1">{{ t(`filter.${item.key}`) }}</span>
        <div
          v-if="isSelected"
          :class="cn(' flex h-4 w-4 items-center justify-center')"
        >
          <Icon name="lucide:check" :class="cn('h-4 w-4')" />
        </div>
        <div v-else class="w-4 h-4"/>
      </Label>
    </DropdownMenuItemComponent>
  </template>
</template>
