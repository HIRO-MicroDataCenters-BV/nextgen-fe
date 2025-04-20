<template>
  <div class="space-y-4">
    <div class="flex items-center px-10 py-3">
      <h1 class="text-2xl font-bold">
        {{ t("title.marketplace") }}
      </h1>
    </div>
    <h2 class="text-xl font-semibold px-10 py-6">
      {{ t("subtitle.marketplace") }}
    </h2>
  </div>
</template>

<script setup>
const { t } = useI18n();
import { SidebarTrigger } from "@/components/ui/sidebar";
</script>
