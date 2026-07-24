<script setup lang="ts">
import { FlexRender } from "@tanstack/vue-table";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import type { Table as TanstackTable } from "@tanstack/vue-table";
import type { TableColumn, TableRowData } from "~/types/table.types";

interface TableGridProps {
  table: TanstackTable<TableRowData>;
  isSelectionVisible: boolean;
  selectionMode: "single" | "multiple";
  mappedColumns: Array<{ id: string }>;
  dataSource: unknown;
  columns: TableColumn[];
  pageSize: number;
  title: string;
  contentClass?: string;
}

defineProps<TableGridProps>();
const { t } = useI18n();
</script>

<template>
  <div class="mb-2 flex min-h-0 flex-1 flex-col overflow-hidden">
    <div
      :class="[contentClass, 'mt-4 min-h-0 flex-1 overflow-auto']"
    >
      <Table
        :data-source="dataSource"
        :columns="columns"
        :page-size="pageSize"
        :title="title"
        class="outline outline-1 outline-border rounded-md overflow-hidden"
      >
        <TableHeader class="bg-muted outline outline-1 outline-border">
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
          >
            <TableHead
              v-if="isSelectionVisible"
              class="sticky top-0 z-20 border-b border-border bg-muted border-t rounded-t-md overflow-hidden rounded-md"
            >
              <div
                v-if="selectionMode === 'multiple'"
                class="flex items-center justify-center"
              >
                <Checkbox
                  :model-value="
                    table.getIsAllRowsSelected()
                      ? true
                      : table.getIsSomeRowsSelected()
                        ? 'indeterminate'
                        : false
                  "
                  aria-label="select all"
                  class="cursor-pointer border-primary"
                  @update:model-value="(v) => table.toggleAllRowsSelected(!!v)"
                />
              </div>
            </TableHead>
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="sticky top-0 z-20 border-b border-border bg-muted"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <TableRow :data-state="row.getIsSelected() && 'selected'">
                <TableCell v-if="isSelectionVisible">
                  <div class="flex items-center justify-center">
                    <Checkbox
                      :model-value="row.getIsSelected()"
                      :disabled="!row.getCanSelect()"
                      aria-label="select row"
                      :class="[
                        'cursor-pointer border-primary',
                        selectionMode === 'single' ? 'rounded-full' : '',
                      ]"
                      @update:model-value="(v) => row.toggleSelected(!!v)"
                    >
                      <template v-if="selectionMode === 'single'">
                        <div class="h-2 w-2 rounded-full bg-current" />
                      </template>
                    </Checkbox>
                  </div>
                </TableCell>
                <TableCell
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </TableCell>
              </TableRow>
            </template>
          </template>

          <TableRow v-else>
            <TableCell
              :colspan="mappedColumns.length + (isSelectionVisible ? 1 : 0)"
              class="h-24 text-center"
            >
              {{ t("hint.no_results") }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
