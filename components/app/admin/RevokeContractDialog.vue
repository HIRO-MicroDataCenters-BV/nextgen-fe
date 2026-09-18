<template>
  <AlertDialog :open="open" @update:open="onOpenChange">
    <!-- Opens with focus on Cancel. reka-ui does that for every alert
         dialog, and it is the safe place to start for one that cannot be
         undone. -->
    <AlertDialogContent>
      <form class="grid gap-4" @submit.prevent="submit">
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t("admin.revoke.title") }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{ t("admin.revoke.description") }}
          </AlertDialogDescription>
          <!-- One order can hold several contracts, one per node; only this
               one is revoked, and an admin should not have to guess that. -->
          <p class="text-sm text-muted-foreground">
            {{ t("admin.revoke.scope", { order: contract.order_id }) }}
          </p>
        </AlertDialogHeader>

        <div class="grid gap-1.5">
          <Label for="admin-revoke-reason">{{ t("admin.revoke.reason") }}</Label>
          <Textarea
            id="admin-revoke-reason"
            v-model="reason"
            required
            :maxlength="REVOKE_REASON_MAX"
            :disabled="submitting"
            :placeholder="t('admin.revoke.reason_placeholder')"
            aria-describedby="admin-revoke-reason-hint"
          />
          <p id="admin-revoke-reason-hint" class="text-xs text-muted-foreground">
            {{ t("admin.revoke.reason_hint") }}
          </p>
        </div>

        <Alert v-if="error" variant="destructive" role="alert">
          <Icon name="lucide:triangle-alert" mode="svg" class="size-4" />
          <AlertTitle>{{ errorTitle }}</AlertTitle>
          <AlertDescription v-if="error.kind === 'failed'">
            {{ error.message }}
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <AlertDialogCancel type="button" :disabled="submitting">
            {{ t("admin.revoke.cancel") }}
          </AlertDialogCancel>
          <!-- A plain button, not AlertDialogAction: that one closes the
               dialog on click, before the answer is known. -->
          <Button type="submit" variant="destructive" :disabled="!canSubmit">
            <Icon
              v-if="submitting"
              name="lucide:loader-circle"
              class="size-4 motion-safe:animate-spin"
            />
            {{ submitting ? t("admin.revoke.submitting") : t("admin.revoke.confirm") }}
          </Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { AdminApiError, useAdminApi } from "~/composables/admin/useAdminApi";
import { REVOKE_REASON_MAX, revokeRequestSchema } from "~/schemas/admin.schema";
import type { ContractRecord } from "~/types/admin.types";

const props = defineProps<{
  open: boolean;
  contract: Pick<ContractRecord, "jti" | "order_id">;
}>();
const emit = defineEmits<{
  "update:open": [value: boolean];
  // After every attempt, whether it worked or not — see submit().
  settled: [];
}>();

const { t } = useI18n();
const api = useAdminApi();
const toaster = useToaster();

const reason = ref("");
const submitting = ref(false);
const error = ref<AdminApiError | null>(null);

// Blank every time it opens, so a reason typed for one contract is never
// sent for the next.
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    reason.value = "";
    error.value = null;
  },
);

// After a 409 or 404 there is nothing left to revoke. Trying again would
// only add another refused attempt to the contract's history.
const nothingToRevoke = computed(
  () => error.value?.kind === "conflict" || error.value?.kind === "not_found",
);

const canSubmit = computed(
  () =>
    !submitting.value &&
    !nothingToRevoke.value &&
    revokeRequestSchema.safeParse({ reason: reason.value }).success,
);

const errorTitle = computed(() => {
  switch (error.value?.kind) {
    case "conflict":
      return t("admin.revoke.conflict");
    case "unavailable":
      return t("admin.revoke.unavailable");
    case "not_found":
      return t("admin.drawer.not_found");
    default:
      return t("admin.revoke.failed");
  }
});

function onOpenChange(open: boolean): void {
  // Escape does nothing mid-request: closing would hide how it ended.
  if (!open && submitting.value) return;
  emit("update:open", open);
}

async function submit(): Promise<void> {
  if (!canSubmit.value) return;
  submitting.value = true;
  error.value = null;
  try {
    await api.revokeContract(props.contract.jti, reason.value);
    toaster.show("info", t("admin.revoke.done"));
    emit("update:open", false);
  } catch (e: unknown) {
    error.value = e instanceof AdminApiError ? e : new AdminApiError("failed", String(e));
  } finally {
    submitting.value = false;
    // Reload the contract whatever happened. A timeout can hide a revocation
    // that did go through, and a 409 means it changed under us — either way
    // the panel behind this dialog should show what is true now.
    emit("settled");
  }
}
</script>
