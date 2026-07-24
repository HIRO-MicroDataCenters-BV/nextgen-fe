<template>
  <section
    class="hero relative overflow-hidden border-b border-border bg-white dark:bg-background"
  >
    <!-- Heart illustration (pre-cut with an organic alpha edge) so it dissolves
         naturally into the page in both light and dark mode — no straight mask. -->
    <img
      src="/images/hero-heart.png"
      alt=""
      class="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-auto select-none lg:block"
    >

    <div class="relative z-10 mx-auto max-w-[1200px] px-8 py-6 lg:py-10">
      <div class="max-w-lg text-center lg:text-left">
        <span
          class="mb-4 inline-flex items-center rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          {{ t("landing.eyebrow") }}
        </span>

        <h1
          class="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
        >
          {{ t("landing.headline") }}
        </h1>

        <p
          class="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground sm:text-lg"
        >
          {{ t("landing.subheadline") }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>
