<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4">
    <!-- Two groups: filters on the left, refresh on the right, bottom-aligned
         so the button lines up with the inputs rather than their labels. The
         filters wrap among themselves when space runs out, so the refresh
         group never ends up alone on a line of its own; flex-1 is what lets
         the filter group give up width before the row itself wraps. -->
    <div class="flex shrink-0 flex-wrap items-end gap-3">
      <div class="flex flex-1 flex-wrap items-end gap-3">
        <div class="grid gap-1.5">
          <Label for="admin-filter-status">{{ t("admin.filter.status") }}</Label>
          <Select v-model="filters.status">
            <SelectTrigger id="admin-filter-status" class="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ t("admin.filter.all") }}</SelectItem>
              <SelectItem v-for="status in STATUSES" :key="status" :value="status">
                {{ t(`admin.state.${status}`) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-1.5">
          <Label for="admin-filter-expiry">{{ t("admin.filter.expiry") }}</Label>
          <Select v-model="filters.expiry">
            <SelectTrigger id="admin-filter-expiry" class="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">{{ t("admin.filter.any") }}</SelectItem>
              <SelectItem value="not_expired">
                {{ t("admin.filter.not_expired") }}
              </SelectItem>
              <SelectItem value="expired">{{ t("admin.filter.expired") }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-1.5">
          <Label for="admin-filter-consumer">{{ t("admin.filter.consumer") }}</Label>
          <Input
            id="admin-filter-consumer"
            v-model="filters.consumerId"
            class="w-40"
            :placeholder="t('admin.filter.exact_match')"
          />
        </div>

        <div class="grid gap-1.5">
          <Label for="admin-filter-order">{{ t("admin.filter.order") }}</Label>
          <Input
            id="admin-filter-order"
            v-model="filters.orderId"
            class="w-40"
            :placeholder="t('admin.filter.exact_match')"
          />
        </div>

        <Button variant="ghost" :disabled="!hasFilters" @click="clearFilters">
          <Icon name="lucide:x" class="size-4" />
          {{ t("admin.filter.clear") }}
        </Button>
      </div>

      <!-- Refreshing keeps the filters and the page. -->
      <div class="ml-auto flex shrink-0 items-center gap-3">
        <!-- Always as wide as the longest wording, "a few seconds ago", so
             the row does not reflow as the time counts up, or while nothing
             has loaded yet. -->
        <span class="min-w-40 text-right text-xs whitespace-nowrap text-muted-foreground">
          <time v-if="updatedAt !== null" :datetime="isoTime(updatedAt)">
            {{ t("admin.contracts.updated", { time: fromNow(updatedAt) }) }}
          </time>
        </span>
        <Button variant="outline" @click="load">
          <Icon
            name="lucide:refresh-cw"
            class="size-4"
            :class="{ 'motion-safe:animate-spin': loading }"
          />
          {{ t("admin.contracts.refresh") }}
        </Button>
      </div>
    </div>

    <AppTablePreloader v-if="!page && !error" :rows="6" />

    <Alert v-else-if="error" variant="destructive">
      <Icon name="lucide:triangle-alert" mode="svg" class="size-4" />
      <AlertTitle>
        {{ error.kind === "unavailable" ? t("admin.error.unavailable") : t("admin.error.failed") }}
      </AlertTitle>
      <AlertDescription class="flex flex-wrap items-center gap-3">
        <span>{{ error.message }}</span>
        <Button size="sm" variant="outline" @click="load">
          {{ t("admin.error.retry") }}
        </Button>
      </AlertDescription>
    </Alert>

    <Empty v-else-if="page && page.total === 0" class="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon name="lucide:file-search" mode="svg" />
        </EmptyMedia>
        <EmptyTitle>{{ t("admin.contracts.empty_title") }}</EmptyTitle>
        <EmptyDescription>
          {{ hasFilters ? t("admin.contracts.empty_filtered") : t("admin.contracts.empty") }}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>

    <template v-else-if="page">
      <!-- The only part of the page that gives way. It hugs its rows when
           they fit, and shrinks and scrolls when they do not; min-h-0 is what
           allows a flex child to become smaller than its content. -->
      <div
        class="min-h-0 overflow-auto rounded-md border transition-opacity"
        :class="{ 'opacity-60': loading }"
      >
        <Table>
          <TableHeader :class="HEADER_CLASS">
            <TableRow class="hover:bg-transparent">
              <TableHead :class="HEAD_CLASS">{{ t("admin.column.contract") }}</TableHead>
              <TableHead :class="HEAD_CLASS">{{ t("admin.column.order") }}</TableHead>
              <TableHead :class="HEAD_CLASS">{{ t("admin.column.consumer") }}</TableHead>
              <TableHead :class="HEAD_CLASS">{{ t("admin.column.status") }}</TableHead>
              <TableHead :class="HEAD_CLASS">{{ t("admin.column.expires") }}</TableHead>
              <TableHead :class="HEAD_CLASS">{{ t("admin.column.registered") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <!-- The whole row opens the panel for the mouse; the id button
                 is how keyboard and screen-reader users get there, and its
                 click bubbles up to this same handler. -->
            <TableRow
              v-for="contract in page.items"
              :key="contract.jti"
              class="cursor-pointer"
              :data-state="contract.jti === selectedJti ? 'selected' : undefined"
              @click="selectedJti = contract.jti"
            >
              <TableCell>
                <!-- Same tooltip pattern as TableCardList.vue. No `title`
                     attribute: it would add the browser's own on top. -->
                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      type="button"
                      class="rounded-sm font-mono text-xs underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span class="sr-only">{{ t("admin.drawer.open") }}</span>
                      {{ shortId(contract.jti) }}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent class="max-w-xs">
                    <span class="font-mono text-xs">{{ contract.jti }}</span>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell>{{ contract.order_id }}</TableCell>
              <TableCell>{{ contract.consumer_id }}</TableCell>
              <TableCell>
                <ContractStatusBadge
                  :state="contractDisplayState(contract, nowSeconds)"
                />
              </TableCell>
              <TableCell class="whitespace-nowrap text-xs text-muted-foreground">
                <div>{{ formatTime(contract.exp) }}</div>
                <div class="text-muted-foreground/70">
                  {{ fromNow(contract.exp) }}
                </div>
              </TableCell>
              <TableCell class="whitespace-nowrap text-xs text-muted-foreground">
                <div>{{ formatTime(contract.registered_at) }}</div>
                <div class="text-muted-foreground/70">
                  {{ fromNow(contract.registered_at) }}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <AppTablePagination
        class="shrink-0"
        :current-page="pageIndex"
        :total-pages="page.total_pages"
        :total-items="page.total"
        :page-size="LIMIT"
        :can-previous-page="pageIndex > 0"
        :can-next-page="pageIndex + 1 < page.total_pages"
        :items-label="t('admin.contracts.noun')"
        @page-change="pageIndex = $event"
      />
    </template>

    <ContractDrawer v-model:jti="selectedJti" />
  </div>
</template>

<script setup lang="ts">
import ContractDrawer from "~/components/app/admin/ContractDrawer.vue";
import ContractStatusBadge from "~/components/app/admin/ContractStatusBadge.vue";
import { AdminApiError, useAdminApi } from "~/composables/admin/useAdminApi";
import { useAdminTime } from "~/composables/admin/useAdminTime";
import type { ContractPage, ContractStatus } from "~/types/admin.types";
import {
  NO_CONTRACT_FILTERS,
  contractDisplayState,
  contractListQuery,
  shortId,
  type ContractFilters,
} from "~/utils/contractState";

const LIMIT = 20;

// A quiet header band with small muted labels, so the data reads first.
// The tint is mixed from the theme's own tokens, halfway between muted and
// background: opaque, because the header is pinned and rows scroll beneath
// it, and light enough that the muted labels keep WCAG AA contrast — plain
// bg-muted pushes them just under 4.5:1. border-t-0 because the rounded box
// already draws the top edge.
const HEADER_CLASS =
  "sticky top-0 z-10 border-t-0 bg-[color:color-mix(in_oklab,var(--muted)_50%,var(--background))]";
const HEAD_CLASS = "h-9 text-xs text-muted-foreground";
const STATUSES: ContractStatus[] = ["active", "completed", "cancelled", "revoked"];

const { t } = useI18n();
const api = useAdminApi();

const filters = reactive<ContractFilters>({ ...NO_CONTRACT_FILTERS });
const pageIndex = ref(0); // counted from 0, like the table; the API counts from 1
const page = ref<ContractPage | null>(null);
const loading = ref(false);
const error = ref<AdminApiError | null>(null);
// The contract whose panel is open, or null.
const selectedJti = ref<string | null>(null);
// When the rows on screen were fetched, in seconds; null while none are shown.
const updatedAt = ref<number | null>(null);

// One clock and one date format for the table, the panel and the badges.
const { nowSeconds, tick, formatTime, fromNow, isoTime } = useAdminTime();

const hasFilters = computed(
  () =>
    filters.status !== "all" ||
    filters.expiry !== "any" ||
    filters.consumerId.trim() !== "" ||
    filters.orderId.trim() !== "",
);

// Only the most recent request may update the table. Without this, a slow
// answer for an old filter could land after a fast one for the new filter
// and quietly show the wrong rows.
let latestRequest = 0;

async function load(): Promise<void> {
  const request = ++latestRequest;
  loading.value = true;
  error.value = null;
  try {
    const result = await api.listContracts(
      contractListQuery(filters, pageIndex.value, LIMIT),
    );
    if (request !== latestRequest) return;
    // The list can shrink between loads (contracts revoked while filtering on
    // Active, say), leaving this page past the end. Go to the last page that
    // still exists instead of showing an empty one; the pageIndex watcher
    // loads it.
    if (result.total_pages > 0 && pageIndex.value >= result.total_pages) {
      pageIndex.value = result.total_pages - 1;
      return;
    }
    // Catch the clock up first, so rows newer than its last tick, and the
    // "Updated" time itself, do not read as being in the future.
    tick();
    page.value = result;
    updatedAt.value = nowSeconds.value;
  } catch (e: unknown) {
    if (request !== latestRequest) return;
    error.value = e instanceof AdminApiError ? e : new AdminApiError("failed", String(e));
    page.value = null;
    updatedAt.value = null;
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

function clearFilters(): void {
  Object.assign(filters, NO_CONTRACT_FILTERS);
}

// Any change of filter starts again from the first page.
function restartFromFirstPage(): void {
  if (pageIndex.value === 0) void load();
  else pageIndex.value = 0; // the pageIndex watcher does the loading
}

watch(() => [filters.status, filters.expiry], restartFromFirstPage);
// Typing is debounced, so each keystroke is not a request.
watchDebounced(() => [filters.consumerId, filters.orderId], restartFromFirstPage, {
  debounce: 300,
});
watch(pageIndex, () => void load());

onMounted(load);
</script>
