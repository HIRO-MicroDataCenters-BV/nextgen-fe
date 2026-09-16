<template>
  <!-- Deterministic, SSR-safe placeholder shown until the client knows the auth state.
       No localStorage access, so server and first client render match (no hydration
       mismatch); the real shell renders one tick later once mounted. -->
  <div
    class="flex min-h-svh flex-col items-center justify-center gap-3 bg-background"
  >
    <img
      src="/images/logo.svg"
      alt=""
      class="size-10 animate-pulse motion-reduce:animate-none"
    >
    <span class="text-lg font-semibold tracking-tight text-foreground">
      {{ t("app.title") }}
    </span>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
</script>
