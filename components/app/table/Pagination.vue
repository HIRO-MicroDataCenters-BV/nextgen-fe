<script setup lang="ts">
import { Button } from "~/components/ui/button";
import { Icon } from "#components";

const props = defineProps<{
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
}>();

const emit = defineEmits<{
  "page-change": [page: number];
}>();

const { t } = useI18n();

const handlePageChange = (page: number) => {
  if (page < 0 || page >= props.totalPages) return;
  emit("page-change", page);
};

const pages = computed(() => {
  const pages = [];
  for (let i = 0; i < props.totalPages; i++) {
    pages.push(i);
  }
  return pages;
});
</script>

<template>
  <div
    class="flex items-center justify-between px-2 py-4 bg-sidebar-background sticky bottom-0"
  >
    <div class="flex-1 text-sm text-muted-foreground">
      {{ t("hint.showing") }}
      {{ currentPage * pageSize + 1 }}
      {{ t("hint.to") }}
      {{ Math.min((currentPage + 1) * pageSize, totalItems) }}
      {{ t("hint.out_of") }}
      {{ totalItems }}
      {{ t("hint.data_products") }}
    </div>

    <div class="flex items-center space-x-6 lg:space-x-8">
      <div class="flex items-center space-x-2">
        <p class="text-sm font-medium">{{ t("hint.page") }}</p>
        <span class="text-sm font-medium">{{ currentPage + 1 }}</span>
        <p class="text-sm font-medium">{{ t("hint.of") }}</p>
        <span class="text-sm font-medium">{{ totalPages }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!canPreviousPage"
          @click="handlePageChange(0)"
        >
          <span class="sr-only">{{ t("action.first_page") }}</span>
          <Icon name="lucide:chevrons-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!canPreviousPage"
          @click="handlePageChange(currentPage - 1)"
        >
          <span class="sr-only">{{ t("action.previous_page") }}</span>
          <Icon name="lucide:chevron-left" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="h-8 w-8 p-0"
          :disabled="!canNextPage"
          @click="handlePageChange(currentPage + 1)"
        >
          <span class="sr-only">{{ t("action.next_page") }}</span>
          <Icon name="lucide:chevron-right" class="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          class="hidden h-8 w-8 p-0 lg:flex"
          :disabled="!canNextPage"
          @click="handlePageChange(totalPages - 1)"
        >
          <span class="sr-only">{{ t("action.last_page") }}</span>
          <Icon name="lucide:chevrons-right" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
