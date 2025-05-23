<script setup lang="ts">
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
        class="font-normal"
        @click.prevent="() => emit('update:selected', item.key)"
      >
        <div
          :class="
            cn(
              ' flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'opacity-50 [&_svg]:invisible'
            )
          "
        >
          <Icon name="lucide:check" :class="cn('h-4 w-4')" />
        </div>
        <span>{{ t(`filter.${item.key}`) }}</span>
      </Label>
    </DropdownMenuItemComponent>
  </template>
</template>
