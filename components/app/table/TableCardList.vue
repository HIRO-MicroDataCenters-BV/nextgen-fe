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
  // Mark shared items with an icon (off on Marketplace: everything is shared).
  showShared?: boolean;
}

const props = withDefaults(defineProps<TableCardListProps>(), {
  itemHrefBase: undefined,
  contentClass: undefined,
  showShared: true,
});
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

const hashOf = (value: string) => {
  const s = String(value);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

// Stable accent per dataset id: the same item keeps the same color across pages
// and sessions (vs a position-based color that changed as you paginated).
const pillClass = (id: string) => palette[hashOf(id) % palette.length];

// Tinted badge per site, so items from the same biobank are easy to spot. No
// blue here: blue is the "shared" icon's color. Known sites get a fixed slot
// (a hash of so few short names collides, e.g. ki and uva); others are hashed.
const biobankSlot: Record<string, number> = {
  hus: 0,
  uva: 1,
  ki: 2,
  umcu: 3,
  tum: 4,
  supsi: 5,
};
const biobankPalette = [
  "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  "border-transparent bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  "border-transparent bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  "border-transparent bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300",
  "border-transparent bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
] as const;
const biobankClass = (site: string) => {
  const key = site.trim().toLowerCase();
  return biobankPalette[
    (biobankSlot[key] ?? hashOf(key)) % biobankPalette.length
  ];
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

// Which site (catalog) the item comes from. Only Marketplace has a biobank
// column; on My Catalog every item is the local site's, so no badge there.
const biobankCellFor = (row: Row<TableRowData>) => {
  const cell = cellById(row, "biobank");
  return cell && String(cell.getValue() ?? "").trim() ? cell : undefined;
};

// Full title on hover, but only when the title is cut off with an ellipsis;
// a title that fits needs no tooltip. The tooltip still handles the delay; we
// only veto opening it.
const openTitleId = ref<string | null>(null);
let titleEl: HTMLElement | null = null;
const trackTitle = (e: Event) => {
  titleEl = e.currentTarget as HTMLElement;
};
const onTitleOpen = (open: boolean, id: string) => {
  const cutOff = !!titleEl && titleEl.scrollWidth > titleEl.clientWidth;
  openTitleId.value = open && cutOff ? id : null;
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
      shared:
        props.showShared &&
        !!(row.original as Record<string, unknown>).isShared,
      biobankCell: biobankCellFor(row),
      biobankClass: biobankClass(String(row.original.biobank ?? "")),
      biobankFull: siteFullName(String(row.original.biobank ?? "")),
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
              <TooltipProvider :delay-duration="600">
                <Tooltip
                  :open="openTitleId === card.row.id"
                  @update:open="(v: boolean) => onTitleOpen(v, card.row.id)"
                >
                  <TooltipTrigger as-child>
                    <!-- NuxtLink, not <a href>: a plain link reloads the whole app. -->
                    <NuxtLink
                      v-if="card.href"
                      :to="card.href"
                      class="truncate font-semibold text-foreground hover:underline"
                      @pointerenter="trackTitle"
                      @focus="trackTitle"
                    >
                      {{ card.name }}
                    </NuxtLink>
                    <span
                      v-else
                      class="cursor-default truncate font-semibold text-foreground"
                      @pointerenter="trackTitle"
                    >
                      {{ card.name }}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent class="max-w-xs">
                    {{ card.name }}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider v-if="card.shared" :delay-duration="200">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <span
                      class="inline-flex shrink-0 cursor-default"
                      role="img"
                      :aria-label="t('hint.shared')"
                    >
                      <Icon
                        name="lucide:users"
                        class="size-3.5 text-blue-600 dark:text-blue-400"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{{ t("hint.shared") }}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
            <TooltipProvider v-if="card.biobankCell" :delay-duration="200">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Badge
                    variant="secondary"
                    :class="
                      cn('cursor-default gap-1 rounded-md font-normal', card.biobankClass)
                    "
                  >
                    <Icon name="lucide:building-2" class="size-3" />
                    <FlexRender
                      :render="card.biobankCell.column.columnDef.cell"
                      :props="card.biobankCell.getContext()"
                    />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {{ card.biobankFull || t("column.biobank") }}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="secondary" class="gap-1 rounded-md font-normal">
              <Icon name="lucide:calendar" class="size-3" />
              <FlexRender
                v-if="card.issuedCell"
                :render="card.issuedCell.column.columnDef.cell"
                :props="card.issuedCell.getContext()"
              />
            </Badge>

            <Button
              v-if="card.href"
              as-child
              variant="outline"
              size="sm"
              class="h-6 gap-1 px-2 text-xs"
            >
              <NuxtLink :to="card.href">
                <Icon name="lucide:external-link" class="size-3.5" />
                {{ t("action.open") }}
              </NuxtLink>
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
