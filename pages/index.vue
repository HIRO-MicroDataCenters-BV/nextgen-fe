<script setup lang="ts">
// The public landing at "/". Guests see the tools catalogue here (clean root URL,
// no "/tools"). Authenticated users never render this — the global `auth.global.ts`
// middleware redirects "/" → "/home" for them.
</script>

<template>
  <AppToolsCatalog />
</template>
