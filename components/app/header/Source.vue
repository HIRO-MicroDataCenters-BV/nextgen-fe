<template>
  <!-- Compact variant (header bar): icon + name on one row, description below. -->
  <div v-if="compact && source" class="leading-none">
    <div class="flex items-center gap-2">
      <img
        :src="`/images/icons/${source}.png`"
        class="size-6 shrink-0"
        alt=""
      >
      <span class="text-lg font-semibold leading-none uppercase">{{
        shortName
      }}</span>
    </div>
    <p class="mt-0.5 text-xs leading-none text-muted-foreground">{{
      fullName
    }}</p>
  </div>

  <!-- Default variant: stacked block used in page content. -->
  <div v-else-if="!compact">
    <div class="flex items-center gap-2">
      <img
        v-if="source"
        :src="`/images/icons/${source}.png`"
        class="size-8"
        alt=""
      ><span class="uppercase text-xl font-medium">{{
        shortName
      }}</span>
    </div>
    <div>
      <span class="text-sm text-muted-foreground">{{
        fullName
      }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });

const { page } = useApp();
const source = ref(page.value.source);

watch(page, (newVal) => {
  source.value = newVal.source;
});

// Names come from utils/siteNames.ts, shared with Marketplace's biobank badge.
const shortName = computed(() => (source.value ? siteShortName(source.value) : ""));
const fullName = computed(() => (source.value ? siteFullName(source.value) : ""));
</script>
<style></style>
