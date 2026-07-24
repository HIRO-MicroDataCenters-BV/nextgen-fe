<template>
  <!-- Auth-aware "two template" root. Wrapped in <ClientOnly> so the server (which
       cannot read the localStorage-backed auth state) only renders the deterministic
       splash — no hydration mismatch, and no protected content is ever server-rendered.
       Once mounted, the correct shell renders reactively: signing in flips `isSignedIn`
       and swaps the guest shell for the authenticated sidebar in place. -->
  <ClientOnly>
    <AppAuthedShell v-if="isSignedIn">
      <slot />
    </AppAuthedShell>
    <AppGuestShell v-else>
      <slot />
    </AppGuestShell>

    <template #fallback>
      <AppSplash />
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
const { isSignedIn } = useAuthUser();
</script>
