<script setup lang="ts">
// The public landing at "/" (guests only — authenticated users are redirected to
// "/home" by the global auth middleware). A marketing page: hero → consortium →
// value props → tools showcase → real-world impact (footer comes from GuestShell).
</script>

<template>
  <div>
    <AppLandingHero />
    <div id="tools" class="scroll-mt-16 border-b border-border">
      <AppToolsCatalog />
    </div>
    <AppValueProps />
    <AppImpactStory />
  </div>
</template>
