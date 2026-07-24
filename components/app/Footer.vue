<template>
  <footer class="border-t border-border bg-background">
    <div class="mx-auto max-w-[1200px] px-8 py-12">
      <!-- Consortium partners -->
      <div class="text-center">
        <p
          class="mb-6 text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          {{ t("landing.consortium") }}
        </p>
        <div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <div
            v-for="p in partners"
            :key="p.name"
            class="flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <img
              :src="p.icon"
              :alt="p.name"
              width="24"
              height="24"
              class="size-6 object-contain"
            >
            {{ p.name }}
          </div>
        </div>
      </div>

      <!-- Brand + nav -->
      <div
        class="mt-10 flex flex-col items-start justify-between gap-6 border-t border-border pt-8 sm:flex-row sm:items-center"
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

      <div
        class="mt-8 flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center"
      >
        <p class="text-xs text-muted-foreground">
          {{ t("app.copyright", { year: currentYear }) }}
        </p>
        <!-- Built by Hiro: black on light, white on dark -->
        <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
          {{ t("landing.built_by") }}
          <img
            src="/logo/hiro-logo-dark.svg"
            alt="Hiro"
            class="h-4 w-auto dark:hidden"
          >
          <img
            src="/logo/hiro-logo.svg"
            alt="Hiro"
            class="hidden h-4 w-auto dark:block"
          >
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n();
const { openLogin } = useLoginDialog();

const currentYear = new Date().getFullYear();

// The consortium partners — icons match the partner badges on the tool cards.
const partners = [
  { name: "HUS", icon: "/images/icons/hus_catalog.png" },
  { name: "KI", icon: "/images/icons/ki_catalog.png" },
  { name: "TUM", icon: "/images/icons/tum_catalog.png" },
  { name: "UMCU", icon: "/images/icons/umcu_catalog.png" },
  { name: "UvA", icon: "/images/icons/uva_catalog.png" },
];
</script>
