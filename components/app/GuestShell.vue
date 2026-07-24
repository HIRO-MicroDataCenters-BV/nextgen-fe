<template>
  <div class="flex min-h-svh flex-col bg-background">
    <!-- Public top bar: brand left, theme toggle + Login right -->
    <header
      class="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur"
    >
      <div
        class="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-8"
      >
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5 text-lg font-semibold tracking-tight"
        >
          <img src="/images/logo.svg" alt="" class="size-7">
          {{ t("app.title") }}
        </NuxtLink>

        <div class="flex items-center gap-2">
          <AppThemeToggle />
          <Button @click="loginOpen = true">
            {{ t("action.login") }}
          </Button>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <AppFooter />

    <AppLoginDialog v-model:open="loginOpen" @success="onLoginSuccess" />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
// Shared state so the top-bar button AND the landing hero CTA open the same modal.
const { open: loginOpen } = useLoginDialog();

// After signing in, close the modal and go to the authenticated home page.
const onLoginSuccess = () => {
  loginOpen.value = false;
  navigateTo("/home");
};
</script>
