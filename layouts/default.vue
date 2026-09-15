<template>
  <!-- Auth-aware root. Signed-in users stay client-only: the server renders the
       deterministic splash, so no protected content is ever server-rendered. Guests
       get the public shell server-rendered (SEO / first paint for the landing at "/").
       The server tells them apart from the auth cookie `useAuthUser()` maintains;
       signing in/out flips `isSignedIn` and swaps shells in place.

       Guests may only see "/" (the auth middleware redirects everything else), so a
       guest on any other path — e.g. right after logout, before the redirect lands —
       gets the splash, never the page. Otherwise the protected page would remount
       inside the guest shell and its mount-time URL sync (the table's
       `router.replace`) would cancel the logout redirect. `currentRoute` is used
       (not `useRoute()`) because it updates as soon as the navigation is confirmed,
       without waiting for a page to render. -->
  <ClientOnly v-if="isSignedIn">
    <AppAuthedShell>
      <slot />
    </AppAuthedShell>

    <template #fallback>
      <AppSplash />
    </template>
  </ClientOnly>
  <AppGuestShell v-else-if="currentRoute.path === '/'">
    <slot />
  </AppGuestShell>
  <AppSplash v-else />
</template>

<script setup lang="ts">
const { currentRoute } = useRouter();
const { isSignedIn } = useAuthUser();
</script>
