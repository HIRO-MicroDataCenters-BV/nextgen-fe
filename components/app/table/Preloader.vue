<template>
  <div class="flex flex-col gap-2 items-center justify-center">
    <Skeleton v-for="i in rows" :key="i" class="w-full w-64 h-8" />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  rows?: number;
}>();

const rows = computed(() => props.rows || 3);
</script>

<style></style>
