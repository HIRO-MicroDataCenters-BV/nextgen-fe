<script setup lang="ts">
import {
  Pagination,
  PaginationFirst,
  PaginationLast,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  filteredItemsCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  pageSize: number;
}>();

const { t } = useI18n();

const pageSize = ref(props.pageSize);
const currentPage = ref(props.currentPage);
const totalPages = ref(props.totalPages);
const totalItems = ref(props.totalItems);

defineEmits<{
  "page-change": [page: number];
  "page-size-change": [size: number];
}>();
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
        @update:page="(page) => $emit('page-change', page - 1)"
      >
        <PaginationContent class="flex items-center gap-1">
          <PaginationFirst @click="$emit('page-change', 0)" />
          <PaginationPrevious @click="$emit('page-change', currentPage - 1)" />
          <PaginationNext @click="$emit('page-change', currentPage + 1)" />
          <PaginationLast @click="$emit('page-change', totalPages - 1)" />
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>
