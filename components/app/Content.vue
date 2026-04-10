<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  showAvailableBiobanks?: boolean;
}>();
</script>

<template>
  <div class="content-slot flex min-h-0 flex-1 flex-col">
    <slot />
  </div>
</template>
