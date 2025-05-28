<template>
  <div class="roadmap">
    <div>
      <h3 class="text-2xl font-semibold">
        {{ $t("home.roadmap.title") }}
      </h3>
      <h4 class="text-sm font-normal text-gray-500 mb-8">
        {{ $t("home.roadmap.subtitle") }}
      </h4>
      <Separator class="mb-4" />
    </div>
    <div class="roadmap-item" v-for="item in roadmap" :key="item.id">
      <div class="roadmap-item-content grid grid-cols-2 gap-4">
        <div>
          <p>
            {{
              $t("hint.quarter", {
                quarter: dayjs(item.deadline).quarter(),
                year: dayjs(item.deadline).format("YYYY"),
              })
            }}
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

<style></style>
