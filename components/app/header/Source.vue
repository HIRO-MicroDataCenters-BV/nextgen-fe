<template>
  <div>
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
const { page } = useApp();
const source = ref(page.value.source);

watch(page, (newVal) => {
  source.value = newVal.source;
});

const fullSource = {
  umcu_catalog: "Athero-Express Biobank Study",
  ki_catalog: "Kliniek Informatie",
  hus_catalog: "Hospital Information System",
  uva_catalog: "University of Amsterdam",
  tum_catalog: "Technical University of Munich",
};

const nameSource = {
  umcu_catalog: "UMCU",
  ki_catalog: "KI",
  hus_catalog: "HUS",
  uva_catalog: "UVA",
  tum_catalog: "TUM",
};
</script>
<style></style>
