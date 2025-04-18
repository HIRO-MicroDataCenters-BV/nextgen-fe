<template>
  <div class="space-y-4">
    <div class="flex items-center px-24 py-3">
      <h1 class="text-2xl font-bold">
        {{ t("pages.marketplace.title") }}
      </h1>
    </div>
    <h2 class="text-xl font-semibold px-24 py-6">
      {{ t("pages.marketplace.description") }}
    </h2>
    <!-- Здесь будет таблица с контентом -->
  </div>
</template>

<script setup>
const { t } = useI18n();
import { SidebarTrigger } from "@/components/ui/sidebar";
</script>
