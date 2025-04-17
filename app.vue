<template>
  <div>
    <h1>Hello {{ t("welcome") }}</h1>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>

<script setup>
const { t } = useI18n();
</script>
