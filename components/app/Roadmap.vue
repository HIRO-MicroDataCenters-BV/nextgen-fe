<template>
  <div class="roadmap">
    <div class="roadmap-title">
      <h3 class="text-2xl font-semibold">
        {{ $t("home.roadmap.title") }}
      </h3>
      <h4 class="text-sm font-normal text-gray-500 mb-8">
        {{ $t("home.roadmap.subtitle") }}
      </h4>
      <Separator class="mb-4" />
    </div>
    <div v-for="item, i in roadmap" :key="item.id" class="roadmap-item">
      <div class="roadmap-item-content grid grid-cols-2 gap-4">
        <div class=" px-2 w-16">
          <p>
            {{ i+1 }}
          </p>
        </div>
        <div>
          <p class="text-gray-500">{{ item.description }}</p>
        </div>
      </div>
      <Separator class="my-4" />
    </div>
  </div>
</template>

<script lang="ts" setup>
const dayjs = useDayjs();
const { roadmap } = useRoadmap();
</script>

<style>
.roadmap-item-content {
  grid-template-columns: 4em 1fr;
}
</style>
