<script setup lang="ts">
const props = defineProps<{
  title: string;
  description?: string;
  showAvailableBiobanks?: boolean;
}>();

const { title, description = "", showAvailableBiobanks = true } = props;
const emit = defineEmits(["submit", "change-file"]);
</script>

<template>
  <div class="px-14 py-6 border-t border-b flex flex-row gap-2 items-end">
    <AppHeader
:title="title" :description="description" :show-available-biobanks="showAvailableBiobanks"
      @change-file="emit('change-file')" @submit="emit('submit')" />
  </div>
  <div class="content-slot">
    <slot />
  </div>
</template>
