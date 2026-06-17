<script setup lang="ts">
import { FlexRender } from "@tanstack/vue-table";
import type { Cell, Row, Table as TanstackTable } from "@tanstack/vue-table";
import type { TableRowData } from "~/types/table.types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Checkbox from "@/components/ui/checkbox/Checkbox.vue";
import { cn } from "@/lib/utils";

interface TableCardListProps {
  table: TanstackTable<TableRowData>;
  isSelectionVisible: boolean;
  selectionMode: "single" | "multiple";
  // When set, the title and "Open" action link to `${itemHrefBase}/${id}`.
  itemHrefBase?: string;
  // Whether the "Add New Item" empty-state CTA is shown. Gated on the same
  // signal as the toolbar's create button (AppTable's `hasSourceHeader`) so the
  // CTA only appears where creating is valid (My Catalog) — not on Marketplace,
  // where items are browsable (hence `itemHrefBase`) but not creatable.
  canCreate?: boolean;
  // Width/centering classes for the content column (shared with the toolbar so
  // cards and toolbar stay aligned). Supplied by AppTable.
  contentClass?: string;
  isLoading?: boolean;
}

const props = defineProps<TableCardListProps>();
const emit = defineEmits<{ (e: "create"): void }>();
const { t } = useI18n();

// Literal class strings — Tailwind v4 only generates complete, static classes,
// so the accent palette must never be built by interpolation.
const palette = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
] as const;

// Stable accent per dataset id: the same item keeps the same color across pages
// and sessions (vs a position-based color that changed as you paginated).
const pillClass = (id: string) => {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

const hrefFor = (row: Row<TableRowData>) =>
  props.itemHrefBase ? `${props.itemHrefBase}/${row.original.id}` : undefined;

const cellById = (
  row: Row<TableRowData>,
  id: string,
): Cell<TableRowData, unknown> | undefined =>
  row.getVisibleCells().find((cell) => cell.column.id === id);

// Secondary line: description is the most useful per-item context, falling back
// to publisher. We keep the full text (for the hover tooltip) and a brief snippet
// (cut on a word boundary) for display.
const subtitleFull = (row: Row<TableRowData>) => {
  const o = row.original as Record<string, unknown>;
  const desc = typeof o.description === "string" ? o.description.trim() : "";
  const pub = typeof o.publisher === "string" ? o.publisher.trim() : "";
  return desc || pub;
};
const clampText = (text: string, max = 80) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
};

const cards = computed(() =>
  props.table.getRowModel().rows.map((row) => {
    const fullSubtitle = subtitleFull(row);
    const snippet = clampText(fullSubtitle);
    return {
      row,
      href: hrefFor(row),
      pill: pillClass(String(row.original.id)),
      name: String(row.getValue("name") ?? ""),
      subtitle: snippet,
      subtitleFull: fullSubtitle,
      subtitleTruncated: snippet !== fullSubtitle,
      shared: !!(row.original as Record<string, unknown>).isShared,
      issuedCell: cellById(row, "issued"),
      actionsCell: cellById(row, "actions"),
    };
  }),
);
</script>

<template>
  <div class="mb-2 flex min-h-0 flex-1 flex-col overflow-hidden">
    <div
      :class="[contentClass, 'pt-4 min-h-0 flex-1 space-y-3 overflow-auto pb-4']"
    >
      <!-- Loading: card-shaped skeletons mirror the real layout -->
      <template v-if="isLoading">
        <div
          v-for="n in 5"
          :key="`sk-${n}`"
          class="flex items-center gap-3 rounded-md bg-card px-4 py-3 shadow-sm"
        >
          <div class="h-8 w-1 shrink-0 rounded-full bg-muted" />
          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton class="h-4 w-1/3" />
            <Skeleton class="h-3 w-1/2" />
          </div>
          <Skeleton class="h-6 w-24 rounded-full" />
          <Skeleton class="h-8 w-16 rounded-md" />
        </div>
      </template>

      <!-- Content -->
      <template v-else-if="cards.length">
        <Card
          v-for="card in cards"
          :key="card.row.id"
          :class="
            cn(
              'group flex-row items-center gap-3 rounded-md border-0 px-4 py-3 shadow-sm transition-[box-shadow,background-color] hover:bg-accent/40 hover:shadow-md',
              card.row.getIsSelected() ? 'bg-primary/5 ring-2 ring-primary/60' : '',
            )
          "
        >
          <div
            :class="cn('h-8 w-1 shrink-0 rounded-full', card.pill)"
            aria-hidden="true"
          />

          <div
            v-if="isSelectionVisible"
            class="flex shrink-0 items-center justify-center"
          >
            <Checkbox
              :model-value="card.row.getIsSelected()"
              :disabled="!card.row.getCanSelect()"
              :aria-label="t('action.select_item', { name: card.name })"
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

          <div class="flex min-w-0 flex-1 flex-col">
            <div class="flex items-center gap-2">
              <component
                :is="card.href ? 'a' : 'span'"
                :href="card.href"
                class="truncate font-semibold text-foreground hover:underline"
              >
                {{ card.name }}
              </component>
              <Badge
                v-if="card.shared"
                variant="secondary"
                class="shrink-0 gap-1 font-normal text-muted-foreground"
              >
                <Icon name="lucide:users" class="size-3" />
                {{ t("hint.shared") }}
              </Badge>
            </div>
            <template v-if="card.subtitle">
              <TooltipProvider
                v-if="card.subtitleTruncated"
                :delay-duration="600"
              >
                <Tooltip>
                  <TooltipTrigger as-child>
                    <span
                      class="w-fit max-w-full cursor-default truncate text-xs text-muted-foreground"
                    >
                      {{ card.subtitle }}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent class="max-w-xs">
                    {{ card.subtitleFull }}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span
                v-else
                class="truncate text-xs text-muted-foreground"
              >
                {{ card.subtitle }}
              </span>
            </template>
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
              class="h-6 gap-1 px-2 text-xs"
            >
              <Icon name="lucide:external-link" class="size-3.5" />
              {{ t("action.open") }}
            </Button>

            <span
              v-if="card.actionsCell"
              class="opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
            >
              <FlexRender
                :render="card.actionsCell.column.columnDef.cell"
                :props="card.actionsCell.getContext()"
              />
            </span>
          </div>
        </Card>
      </template>

      <!-- Empty -->
      <div
        v-else
        class="flex flex-col items-center justify-center gap-3 py-16 text-center"
      >
        <div
          class="flex size-12 items-center justify-center rounded-full bg-muted"
        >
          <Icon name="lucide:folder-open" class="size-6 text-muted-foreground" />
        </div>
        <div class="space-y-1">
          <p class="font-medium">{{ t("hint.no_results") }}</p>
          <p class="text-sm text-muted-foreground">
            {{ t("hint.no_results_hint") }}
          </p>
        </div>
        <Button v-if="canCreate" size="sm" @click="emit('create')">
          <Icon name="lucide:plus" class="size-4" />
          {{ t("action.add_new_item") }}
        </Button>
      </div>
    </div>
  </div>
</template>
