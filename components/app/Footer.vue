<template>
  <footer class="border-t border-border bg-background">
    <div class="mx-auto max-w-[1200px] px-8 py-10">
      <div
        class="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"
      >
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5 text-base font-semibold tracking-tight"
        >
          <img src="/images/logo.svg" alt="" class="size-6">
          {{ t("app.title") }}
        </NuxtLink>

        <nav
          class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
        >
          <a href="#tools" class="transition-colors hover:text-foreground">
            {{ t("landing.browse_tools") }}
          </a>
          <button
            type="button"
            class="rounded-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            @click="openLogin"
          >
            {{ t("action.login") }}
          </button>
        </nav>
      </div>

      <p
        class="mt-8 border-t border-border pt-6 text-xs text-muted-foreground"
      >
        {{ t("app.copyright", { year: currentYear }) }}
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n();
const { openLogin } = useLoginDialog();

const currentYear = new Date().getFullYear();
</script>
