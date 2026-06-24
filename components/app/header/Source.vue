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
        nameSource[source]
      }}</span>
    </div>
    <p class="mt-0.5 text-xs leading-none text-muted-foreground">{{
      fullSource[source]
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
        nameSource[source]
      }}</span>
    </div>
    <div>
      <span class="text-sm text-muted-foreground">{{
        fullSource[source]
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

const fullSource: Record<string, string> = {
  umcu_catalog: "Athero-Express Biobank Study",
  ki_catalog: "Kliniek Informatie",
  hus_catalog: "Hospital Information System",
  uva_catalog: "University of Amsterdam",
  tum_catalog: "Technical University of Munich",
};

const nameSource: Record<string, string> = {
  umcu_catalog: "UMCU",
  ki_catalog: "KI",
  hus_catalog: "HUS",
  uva_catalog: "UVA",
  tum_catalog: "TUM",
};
</script>
<style></style>
