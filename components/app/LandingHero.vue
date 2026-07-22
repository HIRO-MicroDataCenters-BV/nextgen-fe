<template>
  <section class="border-b border-border">
    <div
      class="mx-auto flex max-w-[1200px] flex-col items-center px-8 py-6 text-center lg:py-8"
    >
      <h1
        class="max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
      >
        {{ t("landing.headline") }}
      </h1>

      <p
        class="mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground sm:text-lg"
      >
        {{ t("landing.subheadline") }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>
