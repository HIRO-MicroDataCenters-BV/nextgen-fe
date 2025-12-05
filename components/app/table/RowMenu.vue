<template>
  <div class="absolute bottom-[40px] left-0 right-0 mx-auto w-fit">
    <Menubar class="bg-gray-900 text-white overflow rounded-md px-2">
      <MenubarMenu>
        <template v-for="item in items" :key="item.label">
          <MenubarTrigger
            v-if="item.type === 'button'"
            class="bg-transparent! hover:bg-gray-800! text-white! cursor-pointer flex items-center gap-1"
            @click="item.action"
            ><Icon :name="item.icon" class="size-4" />
            {{ item.label }}</MenubarTrigger
          >

          <MenubarTrigger
            v-else-if="item.type === 'counter'"
            class="bg-transparent! text-white!"
            @click="item.action"
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
  console.log(
    "[RowMenu.vue] handlePassToTraining called, emitting on-pass-to-training"
  );
  // Emit event to Table.vue which will handle data conversion and API call
  emit("on-pass-to-training");
};

const handleClearAll = () => {
  emit("on-clear-all");
};

const items = computed(() => [
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
]);
</script>
