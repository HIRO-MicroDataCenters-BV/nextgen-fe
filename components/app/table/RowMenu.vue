<template>
  <div class="absolute bottom-[40px] left-0 right-0 mx-auto w-fit">
    <Menubar class="bg-gray-900 text-white overflow rounded-md px-2">
      <MenubarMenu>
        <template v-for="item in items" :key="item.label">
          <MenubarTrigger
            v-if="item.type === 'button'"
            @click="item.action"
            class="bg-transparent! hover:bg-gray-800! text-white! cursor-pointer flex items-center gap-1"
            ><Icon :name="item.icon" class="size-4" />
            {{ item.label }}</MenubarTrigger
          >

          <MenubarTrigger
            v-else-if="item.type === 'counter'"
            @click="item.action"
            class="bg-transparent! text-white!"
            >{{ selectedCount }} {{ item.label }}</MenubarTrigger
          >
          <MenubarSeparator />
        </template>
      </MenubarMenu>
    </Menubar>
  </div>
</template>

<script lang="ts" setup>
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarSeparator,
} from "@/components/ui/menubar";
import type { Row } from "@tanstack/vue-table";
import type { TableRowData } from "~/types/table.types";

interface RowMenuProps {
  rows?: Row<TableRowData>[];
}

const { t } = useI18n();

const props = withDefaults(defineProps<RowMenuProps>(), {
  rows: () => [],
});

const selectedCount = ref(0);

watch(
  () => props.rows,
  (rows) => {
    console.log("rows changed", rows);
    selectedCount.value = Array.isArray(rows) ? rows.length : 0;
  },
  { immediate: true, deep: true }
);

const emit = defineEmits<{
  (e: "on-pass-to-training" | "on-clear-all"): void;
}>();

const handlePassToTraining = () => {
  console.log("pass to training", props.rows);
  emit("on-pass-to-training");
};

const handleClearAll = () => {
  emit("on-clear-all");
};

const items = [
  {
    label: t("action.items_selected"),
    action: null,
    type: "counter",
    icon: "lucide:check-circle",
  },
  {
    label: t("action.clear_all"),
    action: handleClearAll,
    type: "button",
    icon: "lucide:x",
  },
  {
    label: t("action.pass_to_training"),
    action: handlePassToTraining,
    type: "button",
    icon: "lucide:arrow-right",
  },
];
</script>
