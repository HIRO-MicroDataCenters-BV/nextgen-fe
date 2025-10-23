<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  showAvailableBiobanks?: boolean;
}>();
</script>

<template>
  <!-- <div class="px-14 py-6 border-t border-b flex flex-row gap-2 items-end">
    <AppHeader
:title="title" :description="description" :show-available-biobanks="showAvailableBiobanks"
      @change-file="emit('change-file')" @submit="emit('submit')" />
  </div> -->
  <div class="content-slot">
    <slot />
  </div>
</template>
