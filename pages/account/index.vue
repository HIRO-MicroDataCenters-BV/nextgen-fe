<template>
  <AppContent :title="t('account.title')" :description="t('account.subtitle')">
    <!-- Read-only: everything here was signed into the credential, so it can
         only change with a new credential from the site admin. -->
    <div class="@container mx-auto flex w-full max-w-3xl flex-col gap-4 px-8 py-4">
      <Alert v-if="!account">
        <Icon name="lucide:info" />
        <AlertTitle>{{ t("account.no_token.title") }}</AlertTitle>
        <AlertDescription>{{ t("account.no_token.description") }}</AlertDescription>
      </Alert>

      <template v-else>
        <Card>
          <CardHeader class="flex flex-row items-center gap-4">
            <img :src="user.avatar" width="48" height="48" class="size-12 rounded-lg" alt="">
            <div class="min-w-0">
              <CardTitle class="truncate">{{ account.name || user.name }}</CardTitle>
              <CardDescription class="truncate">{{ account.email || user.email }}</CardDescription>
            </div>
          </CardHeader>
          <CardContent class="flex flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2">
              <Badge>{{ roleLabel }}</Badge>
              <span class="font-mono text-sm text-muted-foreground">{{ roleAtSite }}</span>
            </div>
            <p v-if="roleHint" class="text-sm text-muted-foreground">{{ roleHint }}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">{{ t("account.identity.title") }}</CardTitle>
            <CardDescription>{{ t("account.identity.description") }}</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <div v-for="row in idRows" :key="row.key" class="flex flex-col gap-1">
              <span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {{ row.label }}
              </span>
              <div class="flex items-center gap-2">
                <code class="min-w-0 flex-1 break-all rounded-md bg-muted px-2 py-1 text-sm">{{ row.value }}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  :aria-label="row.copyLabel"
                  :title="row.copyLabel"
                  @click="copyText(row.value, row.copied)"
                >
                  <Icon name="lucide:copy" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon name="lucide:lock" class="size-3.5" />
          {{ t("account.change_note") }}
        </p>
      </template>
    </div>
  </AppContent>
</template>

<script setup lang="ts">
import { ACCESS_TOKEN_KEY, accountFromToken } from "~/composables/useAuthUser";

const { t, te } = useI18n();
const toaster = useToaster();
const { copy } = useClipboard();
const { user } = useAuthUser();

const token = useLocalStorage<string | null>(ACCESS_TOKEN_KEY, null);
const account = computed(() => accountFromToken(token.value));

const roleLabel = computed(() => {
  const role = account.value?.role ?? "";
  return te(`credentials.roles.${role}.label`) ? t(`credentials.roles.${role}.label`) : role || "—";
});
const roleHint = computed(() => {
  const role = account.value?.role ?? "";
  return te(`credentials.roles.${role}.hint`) ? t(`credentials.roles.${role}.hint`) : "";
});
const roleAtSite = computed(() =>
  account.value?.institute ? `${account.value.role}@${account.value.institute}` : account.value?.role ?? "",
);

const idRows = computed(() => {
  const a = account.value;
  if (!a) return [];
  return [
    { key: "aid", label: t("account.identity.aid"), value: a.aid,
      copyLabel: t("account.identity.copy_aid"), copied: t("account.identity.aid_copied") },
    { key: "said", label: t("account.identity.credential"), value: a.credentialSaid,
      copyLabel: t("account.identity.copy_credential"), copied: t("account.identity.credential_copied") },
  ].filter((row) => row.value);
});

const copyText = async (text: string, message: string) => {
  await copy(text);
  toaster.show("info", message);
};
</script>
