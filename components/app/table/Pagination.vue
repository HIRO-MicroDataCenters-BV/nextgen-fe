<script setup lang="ts">
import { Button } from "@/components/ui/button";

import {
  Pagination,
  PaginationEllipsis,
  PaginationFirst,
  PaginationLast,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  filteredItemsCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  pageSize: number;
}>();

const emit = defineEmits([
  "onPreviousPage",
  "onNextPage",
  "onFirstPage",
  "onLastPage",
]);

const { t } = useI18n();

const pageSize = ref(props.pageSize);
const currentPage = ref(props.currentPage);
const totalPages = ref(props.totalPages);
const totalItems = ref(props.totalItems);
</script>

<template>
  <div
    class="flex items-center justify-end space-x-2 py-4 bg-sidebar-background sticky bottom-0"
  >
    <div class="flex-auto text-sm text-muted-foreground">
      {{ t("hint.showing") }}
      {{ currentPage + 1 }}
      {{ t("hint.to") }}
      {{ totalPages || 1 }}
      {{ t("hint.out_of") }}
      {{ filteredItemsCount }}
      {{ t("hint.data_products") }}
    </div>

    <div class="flex gap-4 items-center">
      <div class="flex gap-2">
        <span>{{ t("hint.page") }}</span>
        <span>{{ currentPage + 1 }}</span>
        <span>{{ t("hint.of") }}</span>
        <span>{{ totalPages || 1 }}</span>
      </div>
      <Pagination
        :items-per-page="pageSize"
        :total="totalItems"
        :sibling-count="1"
        show-edges
        :default-page="currentPage"
      >
        <PaginationContent v-slot="{ items }" class="flex items-center gap-1">
          <PaginationFirst>
            <Icon name="lucide:chevrons-left" />
          </PaginationFirst>
          <PaginationPrevious
            ><Icon name="lucide:chevron-left"
          /></PaginationPrevious>

          <PaginationNext><Icon name="lucide:chevron-right" /></PaginationNext>
          <PaginationLast><Icon name="lucide:chevrons-right" /></PaginationLast>
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>
