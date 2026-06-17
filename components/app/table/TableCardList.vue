<script setup lang="ts">
import { FlexRender } from "@tanstack/vue-table";
import type { Cell, Row, Table as TanstackTable } from "@tanstack/vue-table";
import type { TableRowData } from "~/types/table.types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import { cn } from "@/lib/utils";

interface TableCardListProps {
  table: TanstackTable<TableRowData>;
  isSelectionVisible: boolean;
  selectionMode: "single" | "multiple";
  // When set, the title and "Open" action link to `${itemHrefBase}/${id}`.
  itemHrefBase?: string;
  // Width/centering classes for the content column (shared with the toolbar so
  // cards and toolbar stay aligned). Supplied by AppTable.
  contentClass?: string;
}

const props = defineProps<TableCardListProps>();
const { t } = useI18n();

// Literal class strings — Tailwind v4 only generates complete, static classes,
// so the left-accent palette must never be built by interpolation. These are
// background colors for the rounded accent pill at the start of each card.
const palette = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
] as const;

const hrefFor = (row: Row<TableRowData>) =>
  props.itemHrefBase ? `${props.itemHrefBase}/${row.original.id}` : undefined;

const cellById = (
  row: Row<TableRowData>,
  id: string,
): Cell<TableRowData, unknown> | undefined =>
  row.getVisibleCells().find((cell) => cell.column.id === id);

// One view-model per row. Re-derives when the shared row model changes
// (data/page); per-row selection state is read directly in the template so it
// stays reactive without recomputing this list.
const cards = computed(() =>
  props.table.getRowModel().rows.map((row) => ({
    row,
    href: hrefFor(row),
    colorClass: palette[row.index % palette.length],
    issuedCell: cellById(row, "issued"),
    actionsCell: cellById(row, "actions"),
  })),
);
</script>

<template>
  <div class="mb-2 flex min-h-0 flex-1 flex-col overflow-hidden">
    <div
      :class="[contentClass, 'pt-4 min-h-0 flex-1 space-y-3 overflow-auto pb-4']"
    >
      <template v-if="cards.length">
        <Card
          v-for="card in cards"
          :key="card.row.id"
          :class="
            cn(
              'flex-row items-center gap-3 rounded-md border-0 px-4 py-3 shadow-sm transition-shadow hover:shadow-md',
              card.row.getIsSelected() ? 'ring-2 ring-primary' : '',
            )
          "
        >
          <div
            :class="cn('h-8 w-1 shrink-0 rounded-full', card.colorClass)"
            aria-hidden="true"
          />
          <div
            v-if="isSelectionVisible"
            class="flex shrink-0 items-center justify-center"
          >
            <Checkbox
              :model-value="card.row.getIsSelected()"
              :disabled="!card.row.getCanSelect()"
              aria-label="select row"
              :class="[
                'cursor-pointer border-primary',
                selectionMode === 'single' ? 'rounded-full' : '',
              ]"
              @update:model-value="(v) => card.row.toggleSelected(!!v)"
            >
              <template v-if="selectionMode === 'single'">
                <div class="h-2 w-2 rounded-full bg-current" />
              </template>
            </Checkbox>
          </div>

          <div class="flex min-w-0 flex-1 items-center gap-2">
            <component
              :is="card.href ? 'a' : 'span'"
              :href="card.href"
              class="truncate font-semibold text-foreground hover:underline"
            >
              {{ card.row.getValue("name") }}
            </component>
            <Icon
              name="lucide:badge-check"
              class="size-4 shrink-0 text-primary"
            />
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" class="gap-1 font-normal">
              <Icon name="lucide:calendar" class="size-3" />
              <FlexRender
                v-if="card.issuedCell"
                :render="card.issuedCell.column.columnDef.cell"
                :props="card.issuedCell.getContext()"
              />
            </Badge>

            <Button
              v-if="card.href"
              as="a"
              :href="card.href"
              variant="outline"
              size="sm"
              class="gap-1"
            >
              <Icon name="lucide:external-link" class="size-4" />
              {{ t("action.open") }}
            </Button>

            <FlexRender
              v-if="card.actionsCell"
              :render="card.actionsCell.column.columnDef.cell"
              :props="card.actionsCell.getContext()"
            />
          </div>
        </Card>
      </template>

      <div
        v-else
        class="flex h-24 items-center justify-center text-center text-muted-foreground"
      >
        {{ t("hint.no_results") }}
      </div>
    </div>
  </div>
</template>
