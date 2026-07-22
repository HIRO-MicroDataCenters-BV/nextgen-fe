<script setup lang="ts">
// The public landing at "/" (guests only — authenticated users are redirected to
// "/home" by the global auth middleware): a marketing hero over the tools showcase.
</script>

<template>
  <div>
    <AppLandingHero />
    <div id="tools" class="scroll-mt-16">
      <AppToolsCatalog />
    </div>
  </div>
</template>
