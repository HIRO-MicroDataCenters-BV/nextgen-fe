<script setup lang="ts">
const props = defineProps<{
  title: string;
  description?: string;
  showAvailableBiobanks?: boolean;
}>();

const { title, description = "", showAvailableBiobanks = true } = props;
console.log("props", props);
</script>

<template>
  <div class="px-14 py-6 border-t border-b flex flex-row gap-2 items-end">
    <AppHeader
      :title="title"
      :description="description"
      :show-available-biobanks="showAvailableBiobanks"
    />
  </div>
  <div class="content-slot">
    <slot />
  </div>
</template>
