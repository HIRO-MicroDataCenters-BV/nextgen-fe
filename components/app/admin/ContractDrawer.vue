<template>
  <Sheet :open="jti !== null" @update:open="onOpenChange">
    <SheetContent side="right" class="w-full gap-0 sm:max-w-lg">
      <SheetHeader class="border-b pr-10">
        <SheetTitle class="flex items-center gap-2">
          {{ t("admin.drawer.title") }}
          <ContractStatusBadge
            v-if="contract"
            :state="contractDisplayState(contract, nowSeconds)"
          />
        </SheetTitle>
        <!-- The full id, selectable: the one place a keyboard user reliably
             gets all of it, since the table only shows the first 8 characters. -->
        <SheetDescription class="font-mono text-xs break-all select-all">
          {{ shownJti }}
        </SheetDescription>
      </SheetHeader>

      <div class="min-h-0 flex-1 overflow-y-auto p-4">
        <AppTablePreloader v-if="loading && !contract" :rows="5" />

        <Alert v-else-if="error" variant="destructive">
          <Icon name="lucide:triangle-alert" mode="svg" class="size-4" />
          <AlertTitle>
            {{
              error.kind === "not_found"
                ? t("admin.drawer.not_found")
                : error.kind === "unavailable"
                  ? t("admin.error.unavailable")
                  : t("admin.drawer.failed")
            }}
          </AlertTitle>
          <AlertDescription v-if="error.kind !== 'not_found'">
            <Button size="sm" variant="outline" @click="load">
              {{ t("admin.error.retry") }}
            </Button>
          </AlertDescription>
        </Alert>

        <template v-else-if="contract">
          <section :aria-label="t('admin.drawer.details')">
            <h3 class="mb-3 text-xs font-medium text-muted-foreground">
              {{ t("admin.drawer.details") }}
            </h3>
            <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2.5 text-sm">
              <dt class="text-muted-foreground">{{ t("admin.column.order") }}</dt>
              <dd class="break-all">{{ contract.order_id }}</dd>

              <dt class="text-muted-foreground">{{ t("admin.column.consumer") }}</dt>
              <dd class="break-all">{{ contract.consumer_id }}</dd>

              <template v-for="row in timeRows" :key="row.label">
                <dt class="text-muted-foreground">{{ row.label }}</dt>
                <dd>
                  <time :datetime="isoTime(row.at)">{{ formatTime(row.at) }}</time>
                  <span class="text-muted-foreground"> · {{ fromNow(row.at) }}</span>
                </dd>
              </template>
            </dl>
          </section>

          <Separator class="my-6" />

          <section :aria-label="t('admin.drawer.history')">
            <h3 class="mb-4 text-xs font-medium text-muted-foreground">
              {{ t("admin.drawer.history") }}
            </h3>
            <ContractTimeline :events="events" />
          </section>
        </template>
      </div>

      <!-- Always there, so an admin can see that revoking exists; disabled
           while the contract is not active, or not loaded yet. -->
      <SheetFooter class="border-t sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          class="text-destructive hover:text-destructive"
          :disabled="!revokable"
          @click="revokeOpen = true"
        >
          <Icon name="lucide:ban" class="size-4" />
          {{ t("admin.revoke.action") }}
        </Button>
      </SheetFooter>

      <!-- Not tied to canRevoke: after a 409 the contract reloads as no
           longer active, and the dialog has to stay to say why. -->
      <RevokeContractDialog
        v-if="contract"
        v-model:open="revokeOpen"
        :contract="contract"
        @settled="onRevokeSettled"
      />
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import ContractStatusBadge from "~/components/app/admin/ContractStatusBadge.vue";
import ContractTimeline from "~/components/app/admin/ContractTimeline.vue";
import RevokeContractDialog from "~/components/app/admin/RevokeContractDialog.vue";
import { AdminApiError, useAdminApi } from "~/composables/admin/useAdminApi";
import { useAdminTime } from "~/composables/admin/useAdminTime";
import type { AuditEventRecord, ContractRecord } from "~/types/admin.types";
import { canRevoke, contractDisplayState } from "~/utils/contractState";

/**
 * Opens for whichever contract id it is given, and loads that contract and
 * its history fresh. Keyed by id rather than handed a row, so the activity
 * feed can open it from an event as easily as the table does from a row.
 */
const props = defineProps<{ jti: string | null }>();
const emit = defineEmits<{
  "update:jti": [value: string | null];
  // The contract may have changed here, so whatever lists it should reload.
  changed: [];
}>();

const { t } = useI18n();
const api = useAdminApi();
const { nowSeconds, formatTime, fromNow, isoTime } = useAdminTime();

// What the panel shows. Kept after the panel is closed, so its contents do
// not vanish mid-way through the slide-out animation.
const shownJti = ref<string | null>(null);
const contract = ref<ContractRecord | null>(null);
const events = ref<AuditEventRecord[]>([]);
const loading = ref(false);
const error = ref<AdminApiError | null>(null);
const revokeOpen = ref(false);

const revokable = computed(() => contract.value !== null && canRevoke(contract.value));

const timeRows = computed(() => {
  const c = contract.value;
  if (!c) return [];
  return [
    { label: t("admin.drawer.issued"), at: c.iat },
    { label: t("admin.column.expires"), at: c.exp },
    { label: t("admin.column.registered"), at: c.registered_at },
    { label: t("admin.drawer.status_changed"), at: c.status_changed_at },
  ];
});

let latestRequest = 0;

async function load(): Promise<void> {
  const jti = shownJti.value;
  if (!jti) return;
  const request = ++latestRequest;
  loading.value = true;
  error.value = null;
  try {
    const [record, history] = await Promise.all([
      api.getContract(jti),
      api.getHistory(jti),
    ]);
    if (request !== latestRequest) return;
    contract.value = record;
    events.value = history.items;
  } catch (e: unknown) {
    if (request !== latestRequest) return;
    error.value = e instanceof AdminApiError ? e : new AdminApiError("failed", String(e));
    contract.value = null;
    events.value = [];
  } finally {
    if (request === latestRequest) loading.value = false;
  }
}

watch(
  () => props.jti,
  (jti) => {
    // Closing the panel, or moving to another contract, closes the dialog
    // with it: it must never stay open over a contract it was not opened for.
    revokeOpen.value = false;
    if (!jti) return;
    if (jti !== shownJti.value) {
      // A different contract: never show the previous one's details under it.
      contract.value = null;
      events.value = [];
    }
    shownJti.value = jti;
    void load();
  },
  { immediate: true },
);

function onOpenChange(open: boolean): void {
  if (!open) emit("update:jti", null);
}

function onRevokeSettled(): void {
  void load();
  emit("changed");
}
</script>
