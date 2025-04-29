<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="px-14 py-6 border-t border-b">
    <div class="flex items-center">
      <h1 class="text-lg font-semibold">
        {{ title }}
      </h1>
    </div>
    <p class="text-small text-muted-foreground">
      {{ description }}
    </p>
  </div>
  <div class="content-slot">
    <slot/>
  </div>
</template>
