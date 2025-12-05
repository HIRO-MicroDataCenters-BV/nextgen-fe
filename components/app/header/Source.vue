<template>
  <div>
    <div class="flex items-center gap-2">
      <img
        v-if="source"
        :src="`/images/icons/${source}.png`"
        class="size-8"
      /><span class="uppercase text-sm font-medium">{{ source }}</span>
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
  umcu: "Athero-Express Biobank Study",
  ki: "Kliniek Informatie",
  hus: "Hospital Information System",
  uva: "University of Amsterdam",
  tum: "Technical University of Munich",
};
</script>
<style></style>
