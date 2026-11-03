<template>
  <AppContent :title="t('admin.title')" :description="t('admin.subtitle')">
    <!-- Exactly the height below the 4rem top bar, so the page itself never
         scrolls: when there are more rows than fit, the table scrolls inside
         its own box while the filters and pagination stay in view. svh, like
         the sidebar, so it holds on mobile too. -->
    <div
      class="mx-auto flex h-[calc(100svh-4rem)] min-h-0 w-full max-w-[1600px] flex-col gap-4 px-8 py-6"
    >
      <Empty v-if="!isAdmin" class="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon name="lucide:shield-x" mode="svg" />
          </EmptyMedia>
          <EmptyTitle>{{ t("admin.denied.title") }}</EmptyTitle>
          <EmptyDescription>{{ t("admin.denied.description") }}</EmptyDescription>
        </EmptyHeader>
      </Empty>

      <Alert v-else-if="!configured" variant="destructive">
        <Icon name="lucide:settings" mode="svg" class="size-4" />
        <AlertTitle>{{ t("admin.not_configured.title") }}</AlertTitle>
        <AlertDescription>{{ t("admin.not_configured.description") }}</AlertDescription>
      </Alert>

      <ContractsTable v-else />
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import ContractsTable from "~/components/app/admin/ContractsTable.vue";
import { useAdminAccess } from "~/composables/admin/useAdminAccess";

const { t } = useI18n();
const { setPage } = useApp();

setPage({
  section: "admin",
  title: t("admin.title"),
  subtitle: t("admin.subtitle"),
});

const { configured, isAdmin } = useAdminAccess();
</script>
